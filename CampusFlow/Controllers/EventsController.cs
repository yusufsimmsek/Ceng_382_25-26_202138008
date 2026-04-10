using Microsoft.AspNetCore.Mvc;

namespace CampusFlow.Controllers;

public class EventsController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}
