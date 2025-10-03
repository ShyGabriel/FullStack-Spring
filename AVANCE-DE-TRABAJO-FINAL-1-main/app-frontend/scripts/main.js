import { UniversityScheduleApp } from "./app.js";
import { loadNavbarAndHeader } from "./navbar.js";
import { renderTasks } from "./tasks.js";


document.addEventListener("DOMContentLoaded", () => {
  // Inicializar la app principal
  window.app = new UniversityScheduleApp();

  loadNavbarAndHeader();
  renderTasks();
});
