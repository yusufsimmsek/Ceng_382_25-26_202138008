using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Sofranet.Controllers;

[Authorize(Roles = "User")]
public class UserController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "Panelim";
        return View();
    }
}
