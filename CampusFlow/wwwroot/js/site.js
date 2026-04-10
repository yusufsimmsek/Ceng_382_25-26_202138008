const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");

if (sidebar && sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("is-open");
    });
}
