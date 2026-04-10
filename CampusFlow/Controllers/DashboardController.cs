using Microsoft.AspNetCore.Mvc;

namespace CampusFlow.Controllers;

public class DashboardController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}
