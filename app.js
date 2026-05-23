// ==========================================
// CONFIGURACIÓN DE CONEXIÓN A SUPABASE
// ==========================================
const SUPABASE_URL = "https://dgmbsqgcubpofdggowop.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbWJzcWdjdWJwb2ZkZ2dvd29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTMxMzcsImV4cCI6MjA5NTA2OTEzN30.axQ47J7rS3M9ZW-5Ot8hPzyMUMKq51QhE5_lVIB3WFk";

// Crear instancia del cliente de Supabase con validación de carga
let supabaseClient;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.error("Error: No se encontró la librería 'supabase' cargada globalmente.");
  // Crear un mock para evitar que el script se rompa por completo en la inicialización
  supabaseClient = {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: { message: "La librería de Supabase no pudo ser cargada. Revisa tu conexión a internet o desactiva bloqueadores de publicidad." } }),
      insert: () => Promise.resolve({ error: { message: "La librería de Supabase no pudo ser cargada. Revisa tu conexión a internet o desactiva bloqueadores de publicidad." } }),
      update: () => Promise.resolve({ error: { message: "La librería de Supabase no pudo ser cargada. Revisa tu conexión a internet o desactiva bloqueadores de publicidad." } }),
      delete: () => Promise.resolve({ error: { message: "La librería de Supabase no pudo ser cargada. Revisa tu conexión a internet o desactiva bloqueadores de publicidad." } })
    })
  };
  
  // Mostrar alerta visual una vez cargado el DOM
  window.addEventListener('DOMContentLoaded', () => {
    const errorBanner = document.createElement('div');
    errorBanner.style.cssText = "background: var(--danger); color: white; padding: 1rem; text-align: center; font-weight: bold; position: fixed; top: 0; left: 0; right: 0; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.5);";
    errorBanner.innerHTML = "⚠️ ERROR: No se pudo conectar con Supabase. El script CDN fue bloqueado o no tienes internet. Por favor, desactiva extensiones de bloqueo de publicidad (como uBlock Origin, AdBlock, etc.) o recarga la página.";
    document.body.prepend(errorBanner);
  });
}

// ==========================================
// GESTOR DE DATOS DE SUPABASE (CONEXIÓN ASÍNCRONA)
// ==========================================
class Database {
  // 1. Obtener lista de usuarios
  static async getUsers() {
    const { data, error } = await supabaseClient
      .from('users')
      .select('*');
    if (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
    return data || [];
  }

  // 2. Registrar nuevo alumno
  static async saveUser(user) {
    const { error } = await supabaseClient
      .from('users')
      .insert([user]);
    if (error) {
      console.error('Error al guardar estudiante:', error);
      throw error;
    }
  }

  // 3. Eliminar alumno (Supabase aplicará CASCADE en cascada para pagos/notas/asistencia)
  static async deleteUser(username) {
    const { error } = await supabaseClient
      .from('users')
      .delete()
      .eq('username', username);
    if (error) {
      console.error('Error al eliminar alumno:', error);
      throw error;
    }
  }

  // 4. Obtener pagos
  static async getPayments() {
    const { data, error } = await supabaseClient
      .from('payments')
      .select('*');
    if (error) {
      console.error('Error al obtener pagos:', error);
      throw error;
    }
    // Mapear columnas de minúsculas de PostgreSQL a camelCase de JS
    return (data || []).map(p => ({
      ...p,
      studentUsername: p.studentusername,
      studentName: p.studentname
    }));
  }

  // 5. Registrar un nuevo soporte de pago (Base64)
  static async savePayment(payment) {
    // Mapear camelCase de JS a columnas de minúsculas de PostgreSQL
    const dbPayment = {
      id: payment.id,
      studentusername: payment.studentUsername,
      studentname: payment.studentName,
      date: payment.date,
      type: payment.type,
      amount: payment.amount,
      receipt: payment.receipt,
      status: payment.status
    };
    const { error } = await supabaseClient
      .from('payments')
      .insert([dbPayment]);
    if (error) {
      console.error('Error al guardar comprobante:', error);
      throw error;
    }
  }

  // 6. Verificar pago (Cambiar estado a Verificado por la profesora)
  static async verifyPayment(id) {
    const { error } = await supabaseClient
      .from('payments')
      .update({ status: 'Verificado' })
      .eq('id', id);
    if (error) {
      console.error('Error al verificar pago:', error);
      throw error;
    }
  }

  // 7. Obtener calificaciones (Grades)
  static async getGrades() {
    const { data, error } = await supabaseClient
      .from('grades')
      .select('*');
    if (error) {
      console.error('Error al obtener notas:', error);
      throw error;
    }
    // Mapear columnas de minúsculas de PostgreSQL a camelCase de JS
    return (data || []).map(g => ({
      ...g,
      studentUsername: g.studentusername,
      examName: g.examname
    }));
  }

  // 8. Guardar nota de examen
  static async saveGrade(grade) {
    // Mapear camelCase de JS a columnas de minúsculas de PostgreSQL
    const dbGrade = {
      id: grade.id,
      studentusername: grade.studentUsername,
      examname: grade.examName,
      score: grade.score,
      date: grade.date
    };
    const { error } = await supabaseClient
      .from('grades')
      .insert([dbGrade]);
    if (error) {
      console.error('Error al guardar nota:', error);
      throw error;
    }
  }

  // 9. Obtener historial de asistencia
  static async getAttendance() {
    const { data, error } = await supabaseClient
      .from('attendance')
      .select('*');
    if (error) {
      console.error('Error al obtener asistencia:', error);
      throw error;
    }
    // Mapear columnas de minúsculas de PostgreSQL a camelCase de JS
    return (data || []).map(a => ({
      ...a,
      studentUsername: a.studentusername
    }));
  }

  // 10. Guardar asistencia de un día (borra registros previos de esa fecha primero)
  static async saveAttendance(attendanceRecords) {
    const selectedDate = attendanceRecords[0]?.date;
    if (selectedDate) {
      const { error: deleteError } = await supabaseClient
        .from('attendance')
        .delete()
        .eq('date', selectedDate);
      if (deleteError) {
        console.error('Error al limpiar asistencia previa:', deleteError);
      }
    }
    
    if (attendanceRecords.length > 0) {
      // Mapear camelCase de JS a columnas de minúsculas de PostgreSQL
      const dbRecords = attendanceRecords.map(r => ({
        id: r.id,
        date: r.date,
        studentusername: r.studentUsername,
        status: r.status
      }));
      const { error: insertError } = await supabaseClient
        .from('attendance')
        .insert(dbRecords);
      if (insertError) {
        console.error('Error al guardar asistencia:', insertError);
        throw insertError;
      }
    }
  }
}


// ==========================================
// ESTADO DE LA APLICACIÓN (STATE)
// ==========================================
let currentUser = JSON.parse(sessionStorage.getItem('mp_current_user')) || null;
let currentReceiptBase64 = null;
let activeTab = 'tab-payments';
let activePaymentFilter = 'todos';

// Elementos DOM
const dom = {
  loginView: document.getElementById('login-view'),
  studentView: document.getElementById('student-view'),
  teacherView: document.getElementById('teacher-view'),
  loginForm: document.getElementById('login-form'),
  usernameInput: document.getElementById('username'),
  passwordInput: document.getElementById('password'),
  loginError: document.getElementById('login-error'),
  userSessionInfo: document.getElementById('user-session-info'),
  sessionUserName: document.getElementById('session-user-name'),
  sessionUserRole: document.getElementById('session-user-role'),
  logoutBtn: document.getElementById('logout-btn'),
  
  // Estudiante
  paymentForm: document.getElementById('payment-form'),
  paymentType: document.getElementById('payment-type'),
  paymentAmount: document.getElementById('payment-amount'),
  paymentReceipt: document.getElementById('payment-receipt'),
  dropzone: document.getElementById('dropzone'),
  receiptPreviewContainer: document.getElementById('receipt-preview-container'),
  receiptPreviewImg: document.getElementById('receipt-preview-img'),
  removeReceiptBtn: document.getElementById('remove-receipt-btn'),
  studentPaymentsTbody: document.getElementById('student-payments-tbody'),
  gradesListContainer: document.getElementById('grades-list-container'),
  
  // Asistencia Estudiante
  studentAttendanceRate: document.getElementById('student-attendance-rate'),
  studentAttendanceText: document.getElementById('student-attendance-text'),
  studentAttendanceLog: document.getElementById('student-attendance-log'),
  
  // Profesora
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  teacherPaymentsTbody: document.getElementById('teacher-payments-tbody'),
  pendingCountBadge: document.getElementById('pending-count-badge'),
  filterButtons: document.querySelectorAll('.filter-btn'),
  paymentSearchInput: document.getElementById('teacher-payment-search'),
  newStudentForm: document.getElementById('new-student-form'),
  newStudentName: document.getElementById('new-student-name'),
  newStudentUser: document.getElementById('new-student-user'),
  newStudentPass: document.getElementById('new-student-pass'),
  studentsListGradePanel: document.getElementById('students-list-grade-panel'),
  
  // Asistencia Profesora
  attendanceStudentsTbody: document.getElementById('attendance-students-tbody'),
  attendanceDate: document.getElementById('attendance-date'),
  attendanceForm: document.getElementById('attendance-form'),
  
  // Modal Recibo
  receiptModal: document.getElementById('receipt-modal'),
  modalReceiptImg: document.getElementById('modal-receipt-img'),
  closeModalBtn: document.getElementById('close-modal-btn'),
  modalBackdrop: document.getElementById('modal-backdrop'),
  
  // Modal Notas
  gradeModal: document.getElementById('grade-modal'),
  gradeForm: document.getElementById('grade-form'),
  gradeStudentUsername: document.getElementById('grade-student-username'),
  gradeStudentDisplayName: document.getElementById('grade-student-display-name'),
  gradeExamName: document.getElementById('grade-exam-name'),
  gradeScore: document.getElementById('grade-score'),
  gradeDate: document.getElementById('grade-date'),
  closeGradeModalBtn: document.getElementById('close-grade-modal-btn'),
  gradeModalBackdrop: document.getElementById('grade-modal-backdrop')
};

// ==========================================
// CONTROLADOR DE NAVEGACIÓN & SESIÓN
// ==========================================
function updateSessionHeader() {
  if (currentUser) {
    dom.userSessionInfo.classList.remove('hidden');
    dom.sessionUserName.textContent = currentUser.name;
    dom.sessionUserRole.textContent = currentUser.role === 'teacher' ? 'Profesora' : 'Estudiante';
    dom.sessionUserRole.className = `badge ${currentUser.role === 'teacher' ? 'badge-success' : 'badge-warning'}`;
  } else {
    dom.userSessionInfo.classList.add('hidden');
  }
}

async function switchView(viewName) {
  dom.loginView.classList.add('hidden');
  dom.studentView.classList.add('hidden');
  dom.teacherView.classList.add('hidden');

  if (viewName === 'login') {
    dom.loginView.classList.remove('hidden');
  } else if (viewName === 'student') {
    dom.studentView.classList.remove('hidden');
    await renderStudentDashboard();
  } else if (viewName === 'teacher') {
    dom.teacherView.classList.remove('hidden');
    await renderTeacherDashboard();
  }
  updateSessionHeader();
}

async function handleLogin(username, password) {
  const loginButton = dom.loginForm.querySelector('button[type="submit"]');
  const originalText = loginButton ? loginButton.textContent : "Iniciar Sesión";
  
  if (loginButton) {
    loginButton.disabled = true;
    loginButton.textContent = "Iniciando sesión...";
  }
  dom.loginError.classList.add('hidden');
  
  try {
    const users = await Database.getUsers();
    
    if (!users || users.length === 0) {
      dom.loginError.textContent = "Error: No hay usuarios registrados en la base de datos de Supabase.";
      dom.loginError.classList.remove('hidden');
      return;
    }
    
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim() && u.pass === password);
    
    if (user) {
      currentUser = user;
      sessionStorage.setItem('mp_current_user', JSON.stringify(user));
      dom.loginError.classList.add('hidden');
      dom.usernameInput.value = '';
      dom.passwordInput.value = '';
      
      if (user.role === 'teacher') {
        await switchView('teacher');
      } else {
        await switchView('student');
      }
    } else {
      dom.loginError.textContent = "Usuario o contraseña incorrectos.";
      dom.loginError.classList.remove('hidden');
    }
  } catch (error) {
    console.error("Error detallado de inicio de sesión:", error);
    dom.loginError.innerHTML = `
      <strong>Error de conexión con la base de datos:</strong><br>
      ${error.message || error.details || JSON.stringify(error)}<br><br>
      <small>Por favor verifica tu conexión a internet. Si usas extensiones de bloqueo de publicidad (uBlock Origin, AdBlock, etc.), intenta desactivarlas temporalmente.</small>
    `;
    dom.loginError.classList.remove('hidden');
  } finally {
    if (loginButton) {
      loginButton.disabled = false;
      loginButton.textContent = originalText;
    }
  }
}

function handleLogout() {
  currentUser = null;
  sessionStorage.removeItem('mp_current_user');
  switchView('login');
}

// Inicialización de la sesión al cargar
if (currentUser) {
  if (currentUser.role === 'teacher') {
    switchView('teacher');
  } else {
    switchView('student');
  }
} else {
  switchView('login');
}

// ==========================================
// CONTROLADOR VISTA ESTUDIANTE
// ==========================================
async function renderStudentDashboard() {
  if (!currentUser) return;
  
  // 1. Renderizar Notas/Calificaciones
  const allGrades = await Database.getGrades();
  const grades = allGrades.filter(g => g.studentUsername === currentUser.username);
  dom.gradesListContainer.innerHTML = '';
  
  if (grades.length === 0) {
    dom.gradesListContainer.innerHTML = '<p class="empty-state">No tienes calificaciones registradas aún.</p>';
  } else {
    // Ordenar de más reciente a más antiguo
    grades.reverse().forEach(g => {
      const formattedDate = formatDate(g.date);
      const gradeHtml = `
        <div class="grade-notification-item">
          <div class="grade-exam-title">${g.examName}</div>
          <div class="grade-score-display">${g.score}</div>
          <div class="grade-score-meta">Asignado el ${formattedDate}</div>
        </div>
      `;
      dom.gradesListContainer.insertAdjacentHTML('beforeend', gradeHtml);
    });
  }

  // 2. Renderizar Asistencia del Estudiante
  const allAttendance = await Database.getAttendance();
  const attendance = allAttendance.filter(a => a.studentUsername === currentUser.username);
  dom.studentAttendanceLog.innerHTML = '';
  
  if (attendance.length === 0) {
    dom.studentAttendanceRate.textContent = '0%';
    dom.studentAttendanceRate.className = 'badge badge-warning';
    dom.studentAttendanceText.textContent = 'No hay clases registradas aún.';
    dom.studentAttendanceLog.innerHTML = '<p class="empty-state">Sin registros de asistencia.</p>';
  } else {
    const totalClasses = attendance.length;
    const presents = attendance.filter(a => a.status === 'Presente').length;
    const rate = Math.round((presents / totalClasses) * 100);
    
    dom.studentAttendanceRate.textContent = `${rate}%`;
    if (rate >= 80) {
      dom.studentAttendanceRate.className = 'badge badge-success';
    } else if (rate >= 50) {
      dom.studentAttendanceRate.className = 'badge badge-warning';
    } else {
      dom.studentAttendanceRate.className = 'badge badge-danger';
    }
    
    dom.studentAttendanceText.textContent = `Asistencias: ${presents} / ${totalClasses} clases`;
    
    // Mostrar asistencia ordenada por fecha más reciente
    const sortedAttendance = [...attendance].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedAttendance.forEach(a => {
      const itemClass = a.status === 'Presente' ? 'presente' : 'ausente';
      const badgeClass = a.status === 'Presente' ? 'badge-success' : 'badge-danger';
      const symbol = a.status === 'Presente' ? '✓' : '✗';
      
      const logHtml = `
        <div class="attendance-log-item ${itemClass}">
          <span>Clase del ${formatDate(a.date)}</span>
          <span class="badge ${badgeClass}">${symbol} ${a.status}</span>
        </div>
      `;
      dom.studentAttendanceLog.insertAdjacentHTML('beforeend', logHtml);
    });
  }

  // 3. Renderizar Historial de Pagos
  const allPayments = await Database.getPayments();
  const payments = allPayments.filter(p => p.studentUsername === currentUser.username);
  dom.studentPaymentsTbody.innerHTML = '';
  
  if (payments.length === 0) {
    dom.studentPaymentsTbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">Aún no has registrado ningún pago.</td>
      </tr>
    `;
  } else {
    // Mostrar el más nuevo primero
    payments.reverse().forEach(p => {
      const statusBadge = p.status === 'Verificado' 
        ? '<span class="badge badge-success">✓ Verificado</span>' 
        : '<span class="badge badge-warning">⏳ Pendiente</span>';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td data-label="Fecha">${formatDate(p.date)}</td>
        <td data-label="Tipo">${p.type}</td>
        <td data-label="Monto">$${p.amount}</td>
        <td data-label="Soporte">
          <button class="receipt-thumbnail-btn" data-receipt="${p.id}">
            <img src="${p.receipt}" class="receipt-thumbnail" alt="Soporte">
          </button>
        </td>
        <td data-label="Estado">${statusBadge}</td>
      `;
      dom.studentPaymentsTbody.appendChild(tr);
    });

    // Agregar eventos para ver los comprobantes en grande
    document.querySelectorAll('.receipt-thumbnail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const payId = btn.getAttribute('data-receipt');
        const payment = payments.find(p => p.id === payId);
        if (payment) {
          showReceiptModal(payment.receipt);
        }
      });
    });
  }
}

// Convertir soporte de pago a base64
dom.paymentReceipt.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      currentReceiptBase64 = event.target.result;
      dom.receiptPreviewImg.src = currentReceiptBase64;
      dom.receiptPreviewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
});

dom.removeReceiptBtn.addEventListener('click', () => {
  dom.paymentReceipt.value = '';
  currentReceiptBase64 = null;
  dom.receiptPreviewContainer.classList.add('hidden');
  dom.receiptPreviewImg.src = '';
});

dom.paymentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentReceiptBase64) {
    alert('Por favor selecciona una captura de pago válida.');
    return;
  }

  const newPayment = {
    id: 'pay-' + Date.now(),
    studentUsername: currentUser.username,
    studentName: currentUser.name,
    date: new Date().toISOString().split('T')[0],
    type: dom.paymentType.value,
    amount: parseFloat(dom.paymentAmount.value),
    receipt: currentReceiptBase64,
    status: 'Pendiente'
  };

  try {
    await Database.savePayment(newPayment);
    // Reset del formulario
    dom.paymentForm.reset();
    dom.removeReceiptBtn.click();
    alert('¡Soporte de pago subido con éxito! Queda en espera de verificación por la profesora.');
    await renderStudentDashboard();
  } catch (error) {
    alert('Ocurrió un error al subir el pago. Inténtalo de nuevo.');
  }
});

// ==========================================
// CONTROLADOR VISTA PROFESORA
// ==========================================
async function renderTeacherDashboard() {
  const payments = await Database.getPayments();
  const allUsers = await Database.getUsers();
  const students = allUsers.filter(u => u.role === 'student');
  const grades = await Database.getGrades();

  // 1. Mostrar conteo de pendientes
  const pendingCount = payments.filter(p => p.status === 'Pendiente').length;
  if (pendingCount > 0) {
    dom.pendingCountBadge.textContent = pendingCount;
    dom.pendingCountBadge.classList.remove('hidden');
  } else {
    dom.pendingCountBadge.classList.add('hidden');
  }

  // 2. Renderizar Pestaña de Verificar Pagos
  dom.teacherPaymentsTbody.innerHTML = '';
  
  // Filtrar según botón activo
  let filteredPayments = payments;
  if (activePaymentFilter === 'pendiente') {
    filteredPayments = payments.filter(p => p.status === 'Pendiente');
  } else if (activePaymentFilter === 'verificado') {
    filteredPayments = payments.filter(p => p.status === 'Verificado');
  }

  // Filtrar según búsqueda por texto
  const searchQuery = dom.paymentSearchInput ? dom.paymentSearchInput.value.toLowerCase().trim() : "";
  if (searchQuery) {
    filteredPayments = filteredPayments.filter(p => 
      p.studentName.toLowerCase().includes(searchQuery) ||
      p.studentUsername.toLowerCase().includes(searchQuery)
    );
  }

  // Ordenar para mostrar los pendientes primero, y luego más recientes
  filteredPayments.sort((a, b) => {
    if (a.status === 'Pendiente' && b.status !== 'Pendiente') return -1;
    if (a.status !== 'Pendiente' && b.status === 'Pendiente') return 1;
    return new Date(b.date) - new Date(a.date);
  });

  if (filteredPayments.length === 0) {
    dom.teacherPaymentsTbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No hay registros de pagos para mostrar.</td>
      </tr>
    `;
  } else {
    filteredPayments.forEach(p => {
      const isPending = p.status === 'Pendiente';
      const statusBadge = isPending 
        ? '<span class="badge badge-warning">⏳ Pendiente</span>' 
        : '<span class="badge badge-success">✓ Verificado</span>';
      
      const actionButton = isPending
        ? `<button class="btn btn-success btn-sm approve-pay-btn" data-id="${p.id}">✓ Verificar</button>`
        : `<span class="badge badge-success" style="opacity: 0.7;">Listo</span>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td data-label="Alumno"><strong>${p.studentName}</strong> <br><small style="color: var(--text-muted)">@${p.studentUsername}</small></td>
        <td data-label="Fecha">${formatDate(p.date)}</td>
        <td data-label="Tipo">${p.type}</td>
        <td data-label="Monto">$${p.amount}</td>
        <td data-label="Soporte">
          <button class="receipt-thumbnail-btn" data-receipt="${p.id}">
            <img src="${p.receipt}" class="receipt-thumbnail" alt="Soporte">
          </button>
        </td>
        <td data-label="Estado">${statusBadge}</td>
        <td data-label="Acción">${actionButton}</td>
      `;
      dom.teacherPaymentsTbody.appendChild(tr);
    });

    // Zoom soporte
    document.querySelectorAll('#teacher-payments-tbody .receipt-thumbnail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const payId = btn.getAttribute('data-receipt');
        const payment = payments.find(p => p.id === payId);
        if (payment) {
          showReceiptModal(payment.receipt);
        }
      });
    });

    // Aprobar pago
    document.querySelectorAll('.approve-pay-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const payId = btn.getAttribute('data-id');
        try {
          await Database.verifyPayment(payId);
          await renderTeacherDashboard();
        } catch (error) {
          alert('Error al verificar el pago en Supabase.');
        }
      });
    });
  }

  // 3. Renderizar Pestaña de Estudiantes (para asignar notas y eliminarlos)
  dom.studentsListGradePanel.innerHTML = '';
  if (students.length === 0) {
    dom.studentsListGradePanel.innerHTML = '<p class="empty-state">No hay alumnos registrados aún.</p>';
  } else {
    students.forEach(student => {
      const studentGrades = grades.filter(g => g.studentUsername === student.username);
      const gradesCount = studentGrades.length;
      
      const div = document.createElement('div');
      div.className = 'student-list-item';
      div.innerHTML = `
        <div class="student-info">
          <h4>${student.name}</h4>
          <p>@${student.username} • Clave: <code>${student.pass}</code></p>
          <span class="grades-summary-badge">${gradesCount} Notas registradas</span>
        </div>
        <div class="student-actions" style="display: flex; gap: 0.5rem;">
          <button class="btn btn-primary btn-sm assign-grade-btn" data-user="${student.username}" data-name="${student.name}">
            📝 Asignar Nota
          </button>
          <button class="btn btn-danger btn-sm delete-student-btn" data-user="${student.username}" data-name="${student.name}">
            🗑️ Eliminar
          </button>
        </div>
      `;
      dom.studentsListGradePanel.appendChild(div);
    });

    // Abrir modal de notas al hacer clic
    document.querySelectorAll('.assign-grade-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const username = btn.getAttribute('data-user');
        const name = btn.getAttribute('data-name');
        openGradeModal(username, name);
      });
    });

    // Eliminar alumno al hacer clic
    document.querySelectorAll('.delete-student-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const username = btn.getAttribute('data-user');
        const name = btn.getAttribute('data-name');
        if (confirm(`¿Estás seguro de que deseas eliminar al alumno "${name}" (@${username})? Se borrarán todas sus calificaciones, registros de pagos y asistencias permanentemente.`)) {
          try {
            await Database.deleteUser(username);
            alert(`Alumno "${name}" eliminado correctamente.`);
            await renderTeacherDashboard();
          } catch (error) {
            alert('Error al eliminar alumno.');
          }
        }
      });
    });
  }

  // 4. Renderizar Pestaña de Asistencia
  await renderAttendanceSheet();

  // 5. Renderizar Pestaña de Ingresos
  renderIncomeDashboard(payments);
}

// Registro de alumnos nuevos
dom.newStudentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const allUsers = await Database.getUsers();
  
  const userExists = allUsers.some(u => u.username.toLowerCase() === dom.newStudentUser.value.toLowerCase().trim());
  if (userExists) {
    alert('El nombre de usuario ya está registrado. Intenta con otro.');
    return;
  }

  const newStudent = {
    username: dom.newStudentUser.value.toLowerCase().trim(),
    name: dom.newStudentName.value.trim(),
    role: 'student',
    pass: dom.newStudentPass.value
  };

  try {
    await Database.saveUser(newStudent);
    dom.newStudentForm.reset();
    alert('¡Estudiante registrado exitosamente! Ya puede iniciar sesión con sus credenciales.');
    await renderTeacherDashboard();
  } catch (error) {
    alert('Error al registrar estudiante en la base de datos.');
  }
});

// Registrar nota de examen
dom.gradeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const newGrade = {
    id: 'grade-' + Date.now(),
    studentUsername: dom.gradeStudentUsername.value,
    examName: dom.gradeExamName.value.trim(),
    score: dom.gradeScore.value.trim(),
    date: dom.gradeDate.value
  };

  try {
    await Database.saveGrade(newGrade);
    closeGradeModal();
    alert('¡Calificación guardada y enviada al perfil del alumno!');
    await renderTeacherDashboard();
  } catch (error) {
    alert('Error al guardar calificación.');
  }
});

// Pestañas (Tabs) de la profesora
dom.tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    dom.tabButtons.forEach(b => b.classList.remove('active'));
    dom.tabContents.forEach(c => c.classList.add('hidden'));
    
    btn.classList.add('active');
    const targetTab = btn.getAttribute('data-tab');
    document.getElementById(targetTab).classList.remove('hidden');
    activeTab = targetTab;
  });
});

// Filtros de pagos
dom.filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    dom.filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activePaymentFilter = btn.getAttribute('data-filter');
    renderTeacherDashboard();
  });
});

// ==========================================
// MODALES (MÉTODOS COMUNES)
// ==========================================
function showReceiptModal(imgSrc) {
  dom.modalReceiptImg.src = imgSrc;
  dom.receiptModal.classList.remove('hidden');
}

function closeReceiptModal() {
  dom.receiptModal.classList.add('hidden');
  dom.modalReceiptImg.src = '';
}

dom.closeModalBtn.addEventListener('click', closeReceiptModal);
dom.modalBackdrop.addEventListener('click', closeReceiptModal);

function openGradeModal(username, name) {
  dom.gradeStudentUsername.value = username;
  dom.gradeStudentDisplayName.textContent = name;
  dom.gradeExamName.value = '';
  dom.gradeScore.value = '';
  dom.gradeDate.value = new Date().toISOString().split('T')[0];
  dom.gradeModal.classList.remove('hidden');
}

function closeGradeModal() {
  dom.gradeModal.classList.add('hidden');
}

dom.closeGradeModalBtn.addEventListener('click', closeGradeModal);
dom.gradeModalBackdrop.addEventListener('click', closeGradeModal);



dom.loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleLogin(dom.usernameInput.value, dom.passwordInput.value);
});

dom.logoutBtn.addEventListener('click', handleLogout);

// Utilidad para formatear fechas
function formatDate(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// ==========================================
// CONTROLADOR DE ASISTENCIA (TEACHER)
// ==========================================
async function renderAttendanceSheet() {
  const allUsers = await Database.getUsers();
  const students = allUsers.filter(u => u.role === 'student');
  const attendance = await Database.getAttendance();
  
  if (!dom.attendanceDate.value) {
    dom.attendanceDate.value = new Date().toISOString().split('T')[0];
  }
  
  const selectedDate = dom.attendanceDate.value;
  dom.attendanceStudentsTbody.innerHTML = '';
  
  if (students.length === 0) {
    dom.attendanceStudentsTbody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-state">No hay alumnos registrados para pasar asistencia.</td>
      </tr>
    `;
    return;
  }
  
  students.forEach(student => {
    const record = attendance.find(a => a.date === selectedDate && a.studentUsername === student.username);
    const isPresent = record ? record.status === 'Presente' : true; // Por defecto "Presente"
    const isAbsent = record ? record.status === 'Ausente' : false;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Alumno"><strong>${student.name}</strong></td>
      <td data-label="Usuario">@${student.username}</td>
      <td data-label="Estado">
        <div class="attendance-options">
          <label class="attendance-radio-label opt-present">
            <input type="radio" name="att-${student.username}" value="Presente" ${isPresent ? 'checked' : ''}>
            <span>✅ Presente</span>
          </label>
          <label class="attendance-radio-label opt-absent">
            <input type="radio" name="att-${student.username}" value="Ausente" ${isAbsent ? 'checked' : ''}>
            <span>❌ Ausente</span>
          </label>
        </div>
      </td>
    `;
    dom.attendanceStudentsTbody.appendChild(tr);
  });
}

// Inicializar fecha por defecto y recargar tabla al cambiar fecha
if (dom.attendanceDate) {
  dom.attendanceDate.value = new Date().toISOString().split('T')[0];
  dom.attendanceDate.addEventListener('change', async () => {
    await renderAttendanceSheet();
  });
}

// Guardar asistencia en base de datos local
if (dom.attendanceForm) {
  dom.attendanceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedDate = dom.attendanceDate.value;
    if (!selectedDate) {
      alert('Por favor selecciona una fecha válida.');
      return;
    }
    
    const allUsers = await Database.getUsers();
    const students = allUsers.filter(u => u.role === 'student');
    
    const attendanceRecords = [];
    students.forEach(student => {
      const radioElement = document.querySelector(`input[name="att-${student.username}"]:checked`);
      const status = radioElement ? radioElement.value : 'Presente';
      
      attendanceRecords.push({
        id: 'att-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        date: selectedDate,
        studentUsername: student.username,
        status: status
      });
    });
    
    try {
      await Database.saveAttendance(attendanceRecords);
      alert(`¡Asistencia del día ${formatDate(selectedDate)} guardada con éxito!`);
      await renderTeacherDashboard();
    } catch (error) {
      alert('Error al guardar asistencia.');
    }
  });
}

// ==========================================
// CONTROLADOR DE INGRESOS (DASHBOARD FINANCIERO)
// ==========================================
function renderIncomeDashboard(payments) {
  // 1. Clasificar transacciones
  const verifiedPayments = payments.filter(p => p.status === 'Verificado');
  const pendingPayments = payments.filter(p => p.status === 'Pendiente');
  
  // 2. Sumas de métricas
  const totalVerified = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const monthlyVerified = verifiedPayments.filter(p => p.type === 'Mensual').reduce((sum, p) => sum + p.amount, 0);
  const dailyVerified = verifiedPayments.filter(p => p.type === 'Diario').reduce((sum, p) => sum + p.amount, 0);
  
  // 3. Pintar en el DOM
  document.getElementById('stat-total-income').textContent = `$${totalVerified.toFixed(2)}`;
  document.getElementById('stat-total-count').textContent = `${verifiedPayments.length} transacciones verificadas`;
  
  document.getElementById('stat-pending-income').textContent = `$${totalPending.toFixed(2)}`;
  document.getElementById('stat-pending-count').textContent = `${pendingPayments.length} transacciones en espera`;
  
  document.getElementById('stat-monthly-income').textContent = `$${monthlyVerified.toFixed(2)}`;
  document.getElementById('stat-daily-income').textContent = `$${dailyVerified.toFixed(2)}`;
  
  // 4. Calcular porcentajes para Donut y leyenda
  const totalPercent = totalVerified > 0 ? totalVerified : 1;
  const monthlyPercent = Math.round((monthlyVerified / totalPercent) * 100);
  const dailyPercent = totalVerified > 0 ? 100 - monthlyPercent : 0;
  
  document.getElementById('stat-monthly-percent').textContent = `${monthlyPercent}% del total`;
  document.getElementById('stat-daily-percent').textContent = `${dailyPercent}% del total`;
  document.getElementById('donut-center-percent').textContent = `${monthlyPercent}%`;
  document.getElementById('legend-monthly-val').textContent = `$${monthlyVerified.toFixed(2)}`;
  document.getElementById('legend-daily-val').textContent = `$${dailyVerified.toFixed(2)}`;
  
  // Ajustar segmentos del Donut SVG
  const donutMonthly = document.getElementById('donut-segment-monthly');
  const donutDaily = document.getElementById('donut-segment-daily');
  if (donutMonthly && donutDaily) {
    donutMonthly.setAttribute('stroke-dasharray', `${monthlyPercent} ${100 - monthlyPercent}`);
    donutDaily.setAttribute('stroke-dasharray', `${dailyPercent} ${100 - dailyPercent}`);
    donutDaily.setAttribute('stroke-dashoffset', `-${monthlyPercent}`);
  }
  
  // 5. Generar Gráfica SVG de Curva Temporal
  renderIncomeSvgChart(verifiedPayments);
}

function renderIncomeSvgChart(verifiedPayments) {
  const linePath = document.getElementById('chart-line-path');
  const areaPath = document.getElementById('chart-area-path');
  const dotsGroup = document.getElementById('chart-dots-group');
  const yLabels = document.getElementById('chart-labels-y');
  const xLabels = document.getElementById('chart-labels-x');
  
  if (!linePath || !areaPath || !dotsGroup || !yLabels || !xLabels) return;
  
  dotsGroup.innerHTML = '';
  yLabels.innerHTML = '';
  xLabels.innerHTML = '';
  
  // Agrupar cobros por fecha
  const dateMap = {};
  verifiedPayments.forEach(p => {
    dateMap[p.date] = (dateMap[p.date] || 0) + p.amount;
  });
  
  // Ordenar fechas cronológicamente
  const sortedDates = Object.keys(dateMap).sort();
  
  // Acumular ingresos históricos
  let cumulativeSum = 0;
  const chartPoints = sortedDates.map(date => {
    cumulativeSum += dateMap[date];
    return { date, amount: cumulativeSum };
  });
  
  // Línea plana por defecto si no hay ingresos verificados
  if (chartPoints.length === 0) {
    linePath.setAttribute('d', 'M 50 200 L 570 200');
    areaPath.setAttribute('d', 'M 50 200 L 570 200 L 570 200 L 50 200 Z');
    yLabels.insertAdjacentHTML('beforeend', '<text x="15" y="204">$0</text>');
    return;
  }
  
  const maxVal = chartPoints[chartPoints.length - 1].amount || 1;
  let coords = [];
  
  if (chartPoints.length === 1) {
    // Un solo punto centrado
    coords = [{ x: 310, y: 120, date: chartPoints[0].date, amount: chartPoints[0].amount }];
    linePath.setAttribute('d', `M 50 120 L 310 120 L 570 120`);
    areaPath.setAttribute('d', `M 50 120 L 310 120 L 570 120 L 570 200 L 50 200 Z`);
  } else {
    // Escalar coordenadas en base al ancho (520px) y alto (160px) del lienzo
    coords = chartPoints.map((pt, index) => {
      const x = 50 + index * (520 / (chartPoints.length - 1));
      const y = 200 - (pt.amount / maxVal) * 160;
      return { x, y, date: pt.date, amount: pt.amount };
    });
    
    // Trazado de línea
    let lineD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      lineD += ` L ${coords[i].x} ${coords[i].y}`;
    }
    linePath.setAttribute('d', lineD);
    
    // Trazado de área
    let areaD = `M ${coords[0].x} 200 L ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      areaD += ` L ${coords[i].x} ${coords[i].y}`;
    }
    areaD += ` L ${coords[coords.length - 1].x} 200 Z`;
    areaPath.setAttribute('d', areaD);
  }
  
  // Dibujar escala Y (3 divisiones)
  const yTicks = [0, maxVal / 3, (2 * maxVal) / 3, maxVal];
  yTicks.forEach(t => {
    const y = 200 - (t / maxVal) * 160;
    yLabels.insertAdjacentHTML('beforeend', `<text x="12" y="${y + 4}">$${Math.round(t)}</text>`);
  });
  
  // Dibujar puntos del gráfico y etiquetas X
  coords.forEach(pt => {
    const dateParts = pt.date.split('-');
    const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : pt.date;
    
    // Etiqueta X
    xLabels.insertAdjacentHTML('beforeend', `<text x="${pt.x}" y="220">${displayDate}</text>`);
    
    // Circulo del punto con glow y etiqueta de monto encima
    dotsGroup.insertAdjacentHTML('beforeend', `
      <circle cx="${pt.x}" cy="${pt.y}" r="5" fill="var(--primary)" stroke="var(--bg-deep)" stroke-width="2.5" class="chart-dot"/>
      <text x="${pt.x}" y="${pt.y - 12}" fill="white" font-size="9" text-anchor="middle" font-weight="700" style="text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${pt.amount}</text>
    `);
  });
}

// Búsqueda de pagos en tiempo real
if (dom.paymentSearchInput) {
  dom.paymentSearchInput.addEventListener('input', async () => {
    await renderTeacherDashboard();
  });
}
