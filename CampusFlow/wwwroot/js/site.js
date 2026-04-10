const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");

if (sidebar && sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("is-open");
    });

    document.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const clickedInsideSidebar = sidebar.contains(target);
        const clickedToggle = sidebarToggle.contains(target);

        if (!clickedInsideSidebar && !clickedToggle) {
            sidebar.classList.remove("is-open");
        }
    });
}
