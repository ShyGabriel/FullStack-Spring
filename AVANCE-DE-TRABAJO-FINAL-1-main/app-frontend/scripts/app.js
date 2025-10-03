export class UniversityScheduleApp {
  constructor() {
    this.courses = JSON.parse(localStorage.getItem("courses")) || [];
    this.tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    this.resources = JSON.parse(localStorage.getItem("resources")) || [];

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadPageContent();
  }

  loadPageContent() {
    // Determine current page from URL
    const currentPage = this.getCurrentPage();

    switch (currentPage) {
      case "index":
        this.updateHomePageStats();
        break;
      case "schedule":
        this.loadSchedulePage();
        break;
      case "add-course":
        this.loadAddCoursePage();
        break;
      case "tasks":
        this.loadTasksPage();
        break;
      case "resources":
        this.loadResourcesPage();
        break;
      case "login":
        this.loadLoginPage();
        break;
      case "register":
        this.loadRegisterPage();
        break;
    }
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split("/").pop() || "index.html";
    return filename.replace(".html", "");
  }

  setupEventListeners() {
    // Course form submission
    const addCourseForm = document.getElementById("add-course-form");
    if (addCourseForm) {
      addCourseForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleAddCourse();
      });
    }

    // Task form submission
    const addTaskForm = document.getElementById("add-task-form");
    if (addTaskForm) {
      addTaskForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleAddTask();
      });
    }

    // Resource form submission
    const addResourceForm = document.getElementById("add-resource-form");
    if (addResourceForm) {
      addResourceForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleAddResource();
      });
    }

    // Login form submission
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Register form submission
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
      registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }

    const navbarToggler = document.querySelector(".navbar-toggler");
    const navbarCollapse = document.querySelector(".navbar-collapse");

    if (navbarToggler && navbarCollapse) {
      navbarToggler.addEventListener("click", () => {
        navbarCollapse.classList.toggle("show");
      });

      document.addEventListener("click", (e) => {
        if (
          !navbarToggler.contains(e.target) &&
          !navbarCollapse.contains(e.target)
        ) {
          navbarCollapse.classList.remove("show");
        }
      });
    }
  }

  updateHomePageStats() {
    const statusElement = document.getElementById("home-status");
    if (statusElement) {
      if (this.courses.length === 0) {
        statusElement.textContent =
          "No hay cursos registrados. Comienza agregando tus materias para crear tu horario.";
      } else {
        statusElement.textContent = `Tienes ${this.courses.length} curso${
          this.courses.length > 1 ? "s" : ""
        } registrado${this.courses.length > 1 ? "s" : ""} y ${
          this.tasks.length
        } tarea${this.tasks.length !== 1 ? "s" : ""} pendiente${
          this.tasks.length !== 1 ? "s" : ""
        }.`;
      }
    }
  }

  loadSchedulePage() {
    const scheduleContent = document.getElementById("schedule-content");
    if (!scheduleContent) return;

    if (this.courses.length === 0) {
      scheduleContent.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-calendar-x display-1 text-muted mb-3"></i>
          <h4 class="text-muted mb-3">No hay cursos en tu horario</h4>
          <p class="text-muted mb-4">Agrega tus primeros cursos para comenzar a organizar tu horario académico</p>
          <a href="add-course.html" class="btn btn-outline-primary">
            <i class="bi bi-plus-lg me-2"></i>
            Agregar Primer Curso
          </a>
        </div>
      `;
    } else {
      this.renderScheduleGrid();
    }
  }

  renderScheduleGrid() {
    const scheduleContent = document.getElementById("schedule-content");
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayNames = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];

    // Vista tarjetas (mobile)
    let cardsHTML = `<div class="course-list d-md-none" id="course-list" style="background:var(--color-bg-primary);">`;
    this.courses.forEach((course) => {
      cardsHTML += `
      <div class="course-card shadow-sm rounded mb-3 p-3 border" 
           style="background:var(--color-bg-secondary);color:var(--color-text-primary);border-color:var(--color-border);">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="mb-0 text-primary"><i class="bi bi-journal-bookmark me-2"></i>${
            course.name
          }</h5>
          <span class="badge" style="background:var(--color-primary);color:white;">${
            dayNames[days.indexOf(course.day)]
          }</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="course-time fw-bold"><i class="bi bi-clock me-1"></i>${
            course.startTime
          } - ${course.endTime}</span>
          <span class="text-muted small"><i class="bi bi-geo-alt me-1"></i>${
            course.location || "Sin aula"
          }</span>
        </div>
        <div class="mt-2 text-muted small">${
          course.professor
            ? `<i class="bi bi-person me-1"></i>${course.professor}`
            : ""
        }</div>
      </div>
    `;
    });
    cardsHTML += `</div>`;

    // Vista tabla (desktop)
    let tableHTML = `
    <div class="causa schedule-grid d-none d-md-block" id="schedule-table" style="background:var(--color-bg-primary);">
      <div class="table-responsive">
        <table class="table align-middle schedule-table table-bordered table-hover" 
               style="background:var(--color-bg-secondary);color:var(--color-text-primary);border-color:var(--color-border);">
          <thead style="background:var(--color-bg-tertiary);color:var(--color-text-primary);">
            <tr>
              <th class="text-center">Hora</th>
              ${dayNames
                .map((day) => `<th class="text-center">${day}</th>`)
                .join("")}
            </tr>
          </thead>
          <tbody id="schedule-body">
  `;
    for (let hour = 7; hour < 21; hour += 2) {
      const start = `${hour.toString().padStart(2, "0")}:00`;
      const end = `${(hour + 2).toString().padStart(2, "0")}:00`;
      tableHTML += `<tr><td class="fw-bold text-center" style="background:var(--color-bg-terciary);">${start} - ${end}</td>`;
      days.forEach((day) => {
        const course = this.courses.find(
          (c) => c.day === day && c.startTime <= start && c.endTime >= end
        );
        if (course) {
          tableHTML += `<td style="background:var(--color-bg-secondary);color:var(--color-primary);border-radius:8px;">
          <div class="fw-bold"><i class="bi bi-journal-bookmark me-1"></i>${
            course.name
          }</div>
          <div class="small text-muted"><i class="bi bi-person me-1"></i>${
            course.professor || ""
          }</div>
          <div class="small text-muted"><i class="bi bi-geo-alt me-1"></i>${
            course.location || ""
          }</div>
        </td>`;
        } else {
          tableHTML += `<td></td>`;
        }
      });
      tableHTML += `</tr>`;
    }
    tableHTML += `
          </tbody>
        </table>
      </div>
    </div>
  `;

    scheduleContent.innerHTML = cardsHTML + tableHTML;
  }

  isTimeInRange(checkTime, startTime, endTime) {
    const check = this.timeToMinutes(checkTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    return check >= start && check < end;
  }

  timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  loadAddCoursePage() {
    // Page is already loaded, just ensure form is ready
  }

  handleAddCourse() {
    const form = document.getElementById("add-course-form");
    const formData = new FormData(form);

    const course = {
      id: Date.now(),
      name: document.getElementById("course-name").value,
      code: document.getElementById("course-code").value,
      professor: document.getElementById("professor").value,
      credits: Number.parseInt(document.getElementById("credits").value) || 0,
      day: document.getElementById("day").value,
      startTime: document.getElementById("start-time").value,
      endTime: document.getElementById("end-time").value,
      location: document.getElementById("location").value,
      description: document.getElementById("description").value,
    };

    this.courses.push(course);
    localStorage.setItem("courses", JSON.stringify(this.courses));

    // Redirect to schedule page
    window.location.href = "schedule.html";
  }

  loadTasksPage() {
    this.populateCourseSelects();
    this.renderTasks();
  }

  renderTasks() {
    const tasksContent = document.getElementById("tasks-content");
    if (!tasksContent) return;

    if (this.tasks.length === 0) {
      tasksContent.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-check-square display-1 text-muted mb-3"></i>
          <h4 class="text-muted mb-3">No tienes tareas pendientes</h4>
          <p class="text-muted mb-4">Agrega tus primeras tareas para mantener un seguimiento de tus proyectos académicos</p>
          <button class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#addTaskModal">
            <i class="bi bi-plus-lg me-2"></i>
            Agregar Primera Tarea
          </button>
        </div>
      `;
    } else {
      let tasksHTML = '<div class="row g-3">';

      this.tasks.forEach((task) => {
        const course = this.courses.find((c) => c.id == task.courseId);
        const priorityClass =
          {
            low: "border-success",
            medium: "border-warning",
            high: "border-danger",
          }[task.priority] || "border-secondary";

        tasksHTML += `
          <div class="col-md-6 col-lg-4">
            <div class="card bg-secondary ${priorityClass} h-100">
              <div class="card-body">
                <h6 class="card-title">${task.title}</h6>
                <p class="card-text text-muted small">${
                  task.description || ""
                }</p>
                <div class="d-flex justify-content-between align-items-center">
                  <small class="text-muted">${
                    course ? course.name : "Sin curso"
                  }</small>
                  <small class="text-muted">${
                    task.dueDate || "Sin fecha"
                  }</small>
                </div>
              </div>
            </div>
          </div>
        `;
      });

      tasksHTML += "</div>";
      tasksContent.innerHTML = tasksHTML;
    }
  }

  handleAddTask() {
    const task = {
      id: Date.now(),
      title: document.getElementById("task-title").value,
      courseId: document.getElementById("task-course").value,
      dueDate: document.getElementById("task-due-date").value,
      priority: document.getElementById("task-priority").value,
      description: document.getElementById("task-description").value,
      completed: false,
    };

    this.tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(this.tasks));

    // Close modal and refresh
    const modal = window.bootstrap.Modal.getInstance(
      document.getElementById("addTaskModal")
    );
    modal.hide();
    this.renderTasks();

    // Reset form
    document.getElementById("add-task-form").reset();
  }

  loadResourcesPage() {
    this.populateCourseSelects();
    this.renderResources();
  }

  renderResources() {
    const resourcesContent = document.getElementById("resources-content");
    if (!resourcesContent) return;

    if (this.resources.length === 0) {
      resourcesContent.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-collection display-1 text-muted mb-3"></i>
          <h4 class="text-muted mb-3">No tienes recursos guardados</h4>
          <p class="text-muted mb-4">Agrega enlaces, documentos y materiales de estudio organizados por curso</p>
          <button class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#addResourceModal">
            <i class="bi bi-plus-lg me-2"></i>
            Agregar Primer Recurso
          </button>
        </div>
      `;
    } else {
      let resourcesHTML = '<div class="row g-3">';

      this.resources.forEach((resource) => {
        const course = this.courses.find((c) => c.id == resource.courseId);
        const typeIcon =
          {
            link: "bi-link-45deg",
            document: "bi-file-text",
            video: "bi-play-circle",
            book: "bi-book",
            other: "bi-file",
          }[resource.type] || "bi-file";

        resourcesHTML += `
          <div class="col-md-6 col-lg-4">
            <div class="card bg-secondary border-secondary h-100">
              <div class="card-body">
                <div class="d-flex align-items-start mb-2">
                  <i class="bi ${typeIcon} text-primary me-2 mt-1"></i>
                  <h6 class="card-title mb-0">${resource.title}</h6>
                </div>
                <p class="card-text text-muted small">${
                  resource.description || ""
                }</p>
                <div class="d-flex justify-content-between align-items-center">
                  <small class="text-muted">${
                    course ? course.name : "Sin curso"
                  }</small>
                  ${
                    resource.url
                      ? `<a href="${resource.url}" target="_blank" class="btn btn-sm btn-outline-primary">Ver</a>`
                      : ""
                  }
                </div>
              </div>
            </div>
          </div>
        `;
      });

      resourcesHTML += "</div>";
      resourcesContent.innerHTML = resourcesHTML;
    }
  }

  handleAddResource() {
    const resource = {
      id: Date.now(),
      title: document.getElementById("resource-title").value,
      courseId: document.getElementById("resource-course").value,
      type: document.getElementById("resource-type").value,
      url: document.getElementById("resource-url").value,
      description: document.getElementById("resource-description").value,
    };

    this.resources.push(resource);
    localStorage.setItem("resources", JSON.stringify(this.resources));

    // Close modal and refresh
    const modal = window.bootstrap.Modal.getInstance(
      document.getElementById("addResourceModal")
    );
    modal.hide();
    this.renderResources();

    // Reset form
    document.getElementById("add-resource-form").reset();
  }

  populateCourseSelects() {
    const courseSelects = document.querySelectorAll(
      "#task-course, #resource-course"
    );
    courseSelects.forEach((select) => {
      if (select) {
        select.innerHTML = '<option value="">Seleccionar curso</option>';
        this.courses.forEach((course) => {
          select.innerHTML += `<option value="${course.id}">${course.name} (${course.code})</option>`;
        });
      }
    });
  }

  loadLoginPage() {
    // Page is already loaded
  }

  handleLogin() {
    // Simple mock login - in real app would validate credentials
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (email && password) {
      localStorage.setItem("user", JSON.stringify({ email, loggedIn: true }));
      window.location.href = "index.html";
    }
  }

  loadRegisterPage() {
    // Page is already loaded
  }

  handleRegister() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    if (name && email && password) {
      localStorage.setItem(
        "user",
        JSON.stringify({ name, email, loggedIn: true })
      );
      window.location.href = "index.html";
    }
  }
}
