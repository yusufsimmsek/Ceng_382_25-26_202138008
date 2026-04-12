using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Sofranet.Controllers;

[Authorize(Roles = "Caterer")]
public class CatererController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "Restoran Panel";
        return View();
    }
}
