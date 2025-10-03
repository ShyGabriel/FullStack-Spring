document.addEventListener("DOMContentLoaded", () => {
  // Cargar datos del usuario
  const userData = JSON.parse(localStorage.getItem("userData"));
  if (!userData || !userData.success) {
    window.location.href = "index.html";
    return;
  }

  // Mapear días abreviados a días completos
  const dayMap = {
    Lun: "Lunes",
    Mar: "Martes",
    Mié: "Miércoles",
    Jue: "Jueves",
    Vie: "Viernes",
    Sáb: "Sabado",
    Dom: "Domingo",
  };

  // Actualizar información del encabezado
  document.getElementById("cycleInfo").textContent = userData.semanaInfo.ciclo;
  document.getElementById(
    "weekInfo"
  ).textContent = `${userData.semanaInfo.semanaActual} ${userData.semanaInfo.fechas}`;

  // Obtener elementos del DOM
  const scheduleTableBody = document.getElementById("scheduleTableBody");
  const mobileSchedule = document.getElementById("mobileSchedule");
  const deliveredActivities = document.getElementById("deliveredActivities");
  const pendingActivities = document.getElementById("pendingActivities");

  // Limpiar contenido previo
  scheduleTableBody.innerHTML = "";
  mobileSchedule.innerHTML = "";
  deliveredActivities.innerHTML = "";
  pendingActivities.innerHTML = "";

  // Filtrar eventos
  const clases = userData.eventos.filter((e) => e.tipo === "Clase");
  const actividades = userData.eventos.filter((e) => e.tipo === "Actividad");

  // Definir slots de tiempo y días
  const timeSlots = [
    "08:00 a.m. - 09:30 a.m.",
    "08:00 a.m. - 10:00 a.m.",
    "09:00 a.m. - 11:00 a.m.",
    "10:00 a.m. - 12:00 p.m.",
    "02:00 p.m. - 04:00 p.m.",
    "05:00 p.m.",
    "06:00 p.m.",
    "06:30 p.m. - 08:00 p.m.",
    "11:59 p.m.",
  ];
  const days = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sabado",
    "Domingo",
  ];

  // Función para extraer la hora de inicio de un slot
  const getStartTime = (timeSlot) => {
    return timeSlot.split(" - ")[0];
  };

  // Generar horario para desktop
  timeSlots.forEach((timeSlot) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td style="font-weight: 600;">${timeSlot}</td>`;

    days.forEach((day) => {
const cell = document.createElement("td");
  const timeSlotStart = getStartTime(timeSlot);

  const dayClasses = clases.filter((clase) => {
    // Extrae solo el nombre del día, ignorando números o saltos de línea
    const match = clase.dia.match(/^[^\d\n]+/);
    const claseDay = match ? match[0].trim() : clase.dia;

    const claseStartTime = getStartTime(clase.hora);
    return dayMap[claseDay] === day && claseStartTime === timeSlotStart;
      });

      if (dayClasses.length > 0) {
        dayClasses.forEach((clase) => {
          const courseBlock = document.createElement("div");
          courseBlock.className = "course-block";
          const courseName = clase.curso.split("(")[0].trim();
          courseBlock.innerHTML = `
            ${courseName}
            <small>${clase.modalidad}</small>
          `;
          cell.appendChild(courseBlock);
        });
      }
      row.appendChild(cell);
    });
    scheduleTableBody.appendChild(row);
  });

  // Generar horario para mobile
  const dayEvents = {};
  clases.forEach((clase) => {
    const match = clase.dia.match(/^[^\d\n]+/);
    const claseDay = match ? match[0].trim() : clase.dia;
    const dayName = dayMap[claseDay];
    if (!dayEvents[dayName]) dayEvents[dayName] = [];
    dayEvents[dayName].push(clase);
  });

  Object.entries(dayEvents).forEach(([day, events]) => {
    const dayCard = document.createElement("div");
    dayCard.className = "day-card";
    dayCard.innerHTML = `<h4>${day}</h4>`;
    events.forEach((event) => {
      const eventDiv = document.createElement("div");
      eventDiv.className = "mobile-event";
      const courseName = event.curso.split("(")[0].trim();
      eventDiv.innerHTML = `
        <h5>${courseName}</h5>
        <div class="time">${event.hora}</div>
        <span class="modality">${event.modalidad}</span>
      `;
      dayCard.appendChild(eventDiv);
    });
    mobileSchedule.appendChild(dayCard);
  });

  // Generar lista de actividades
  actividades.forEach((actividad) => {
    const activityDiv = document.createElement("div");
    activityDiv.className = "activity-item";
    let badgeClass = "badge-pending";
    let statusText = "Pendiente";

    if (actividad.estado === "Entregada") {
      badgeClass = "badge-delivered";
      statusText = "Entregada";
    } else if (actividad.estado === "Vencida") {
      badgeClass = "badge-overdue";
      statusText = "Vencida";
    } else if (actividad.estado === "Por entregar") {
      badgeClass = "badge-pending";
      statusText = "Por entregar";
    }

    const activityName = actividad.nombreActividad
      .replace(/🔴|📝|📌/g, "")
      .trim();
    activityDiv.innerHTML = `
      <div class="activity-name">
        <strong>${activityName}</strong>
        <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
          ${actividad.curso} • ${actividad.hora}
        </div>
      </div>
      <span class="activity-badge ${badgeClass}">${statusText}</span>
    `;

    if (actividad.estado === "Entregada") {
      deliveredActivities.appendChild(activityDiv);
    } else {
      pendingActivities.appendChild(activityDiv);
    }
  });

  // Mostrar estado vacío si no hay actividades
  if (deliveredActivities.children.length === 0) {
    deliveredActivities.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-check-circle"></i>
        <p>No hay actividades entregadas</p>
      </div>
    `;
  }
  if (pendingActivities.children.length === 0) {
    pendingActivities.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-clock"></i>
        <p>No hay actividades pendientes</p>
      </div>
    `;
  }
});
