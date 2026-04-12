using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Sofranet.Data;
using Sofranet.Models;
using Sofranet.Models.ViewModels;
using Sofranet.Services;

namespace Sofranet.Controllers;

public class AccountController : Controller
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ApplicationDbContext _db;
    private readonly ILocationService _location;
    private readonly ILogService _logs;
    private readonly ILogger<AccountController> _logger;

    public AccountController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ApplicationDbContext db,
        ILocationService location,
        ILogService logs,
        ILogger<AccountController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _db = db;
        _location = location;
        _logs = logs;
        _logger = logger;
    }

    [HttpGet]
    public IActionResult Register()
    {
        return View(new RegisterViewModel { Role = "User" });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(RegisterViewModel vm)
    {
        if (vm.Role != "User" && vm.Role != "Caterer")
            ModelState.AddModelError(nameof(vm.Role), "Geçersiz hesap tipi");

        if (vm.Role == "Caterer" && string.IsNullOrWhiteSpace(vm.Address))
            ModelState.AddModelError(nameof(vm.Address), "Caterer için adres zorunlu");

        if (!ModelState.IsValid) return View(vm);

        var user = new ApplicationUser
        {
            UserName = vm.Email,
            Email = vm.Email,
            FullName = vm.FullName,
            PhoneNumber = vm.Phone,
            Address = vm.Address,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        // Caterer ise adresi geocode etmeyi dene
        if (vm.Role == "Caterer" && !string.IsNullOrWhiteSpace(vm.Address))
        {
            var coords = await _location.GeocodeAddressAsync(vm.Address);
            if (coords.HasValue)
            {
                user.Latitude = coords.Value.Lat;
                user.Longitude = coords.Value.Lng;
            }
        }

        var result = await _userManager.CreateAsync(user, vm.Password);
        if (!result.Succeeded)
        {
            foreach (var e in result.Errors)
                ModelState.AddModelError(string.Empty, e.Description);
            return View(vm);
        }

        await _userManager.AddToRoleAsync(user, vm.Role);
        await _logs.LogAsync(HttpContext, "USER_REGISTERED", $"email={vm.Email} role={vm.Role}", user.Id);

        TempData["SuccessMessage"] = "Kayıt başarılı, şimdi giriş yapabilirsin.";
        return RedirectToAction(nameof(Login));
    }

    [HttpGet]
    public IActionResult Login(string? returnUrl = null)
    {
        ViewData["ReturnUrl"] = returnUrl;
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginViewModel vm, string? returnUrl = null)
    {
        ViewData["ReturnUrl"] = returnUrl;
        if (!ModelState.IsValid) return View(vm);

        var user = await _userManager.FindByEmailAsync(vm.Email);
        if (user == null)
        {
            await _logs.LogAsync(HttpContext, "LOGIN_FAIL", $"email={vm.Email} reason=no_user");
            ModelState.AddModelError(string.Empty, "Email veya şifre hatalı");
            return View(vm);
        }

        var result = await _signInManager.PasswordSignInAsync(user, vm.Password, vm.RememberMe, lockoutOnFailure: false);
        if (!result.Succeeded)
        {
            await _logs.LogAsync(HttpContext, "LOGIN_FAIL", $"email={vm.Email} reason=wrong_password", user.Id);
            ModelState.AddModelError(string.Empty, "Email veya şifre hatalı");
            return View(vm);
        }

        await _logs.LogAsync(HttpContext, "LOGIN_SUCCESS", $"user_id={user.Id}", user.Id);

        if (!string.IsNullOrWhiteSpace(returnUrl) && Url.IsLocalUrl(returnUrl))
            return Redirect(returnUrl);

        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains("Admin")) return RedirectToAction("Index", "Admin");
        if (roles.Contains("Caterer")) return RedirectToAction("Index", "Caterer");
        return RedirectToAction("Index", "User");
    }

    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        var userId = _userManager.GetUserId(User);
        await _logs.LogAsync(HttpContext, "LOGOUT", $"user_id={userId}", userId);
        await _signInManager.SignOutAsync();
        return RedirectToAction("Index", "Home");
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> Profile()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return RedirectToAction(nameof(Login));

        var vm = new ProfileViewModel
        {
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            Phone = user.PhoneNumber,
            Address = user.Address,
            Latitude = user.Latitude,
            Longitude = user.Longitude,
            TwoFactorEnabled = user.TwoFactorEnabled
        };
        return View(vm);
    }

    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> UpdateAddress(string? address)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return RedirectToAction(nameof(Login));

        user.Address = address;
        if (!string.IsNullOrWhiteSpace(address))
        {
            var coords = await _location.GeocodeAddressAsync(address);
            if (coords.HasValue)
            {
                user.Latitude = coords.Value.Lat;
                user.Longitude = coords.Value.Lng;
            }
        }

        var result = await _userManager.UpdateAsync(user);
        if (result.Succeeded)
        {
            await _logs.LogAsync(HttpContext, "PROFILE_ADDRESS_UPDATED", $"user_id={user.Id}", user.Id);
            TempData["SuccessMessage"] = "Adres güncellendi";
        }
        else
        {
            TempData["ErrorMessage"] = "Adres güncellenemedi";
        }
        return RedirectToAction(nameof(Profile));
    }

    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> UpdateLocation(double latitude, double longitude)
    {
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
        {
            TempData["ErrorMessage"] = "Geçersiz koordinat";
            return RedirectToAction(nameof(Profile));
        }

        var user = await _userManager.GetUserAsync(User);
        if (user == null) return RedirectToAction(nameof(Login));

        user.Latitude = latitude;
        user.Longitude = longitude;

        var result = await _userManager.UpdateAsync(user);
        if (result.Succeeded)
        {
            await _logs.LogAsync(HttpContext, "PROFILE_LOCATION_UPDATED",
                $"user_id={user.Id} lat={latitude} lng={longitude}", user.Id);
            TempData["SuccessMessage"] = "Konum güncellendi";
        }
        else
        {
            TempData["ErrorMessage"] = "Konum güncellenemedi";
        }
        return RedirectToAction(nameof(Profile));
    }

    [HttpGet]
    public IActionResult AccessDenied()
    {
        return View();
    }
}
