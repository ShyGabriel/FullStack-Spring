export function renderTasks() {
  const tasksList = document.getElementById("tasks-list");
  if (!tasksList) return;

  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasksList.innerHTML = "";

  tasks.forEach((task) => {
    const taskItem = document.createElement("div");
    taskItem.className = "task-item card mb-3";

    taskItem.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">${task.title}</h5>
        <p class="card-text">${task.description || ""}</p>
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">${task.dueDate || "Sin fecha"}</small>
          <button class="btn btn-sm btn-danger delete-task">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `;

    taskItem.querySelector(".delete-task").addEventListener("click", () => {
      const updatedTasks = tasks.filter((t) => t.id !== task.id);
      localStorage.setItem("tasks", JSON.stringify(updatedTasks));
      renderTasks();
    });

    tasksList.appendChild(taskItem);
  });
}
