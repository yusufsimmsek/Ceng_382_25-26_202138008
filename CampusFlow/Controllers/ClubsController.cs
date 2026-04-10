using Microsoft.AspNetCore.Mvc;

namespace CampusFlow.Controllers;

public class ClubsController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}
