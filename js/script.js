// ============================================================
//  SIDEBAR — abrir / cerrar en móvil
// ============================================================
const toggleBtn = document.getElementById('sidebarToggle');
const sidebar   = document.getElementById('sidebar');
const overlay   = document.getElementById('sidebarOverlay');

function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.classList.add('sidebar-open');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
}

toggleBtn.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
});

overlay.addEventListener('click', closeSidebar);

document.querySelectorAll('.nav-btn, .nav-sub-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (window.innerWidth < 768) closeSidebar();
    });
});

// ============================================================
//  SUBMENÚ — acordeón al hacer click
// ============================================================
document.querySelectorAll('.nav-group .has-sub').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();

        const group  = btn.closest('.nav-group');
        const isOpen = group.classList.contains('open');

        document.querySelectorAll('.nav-group.open').forEach(g => g.classList.remove('open'));

        if (!isOpen) group.classList.add('open');
    });
});

// ============================================================
//  HELPERS — actualizar título y definición en pantalla
// ============================================================
function mostrarDescripcion(titulo, definicion) {
    const elTitulo = document.getElementById('tema-titulo');
    const elDesc   = document.getElementById('tema-descripcion');

    if (titulo) {
        elTitulo.innerHTML = `<h2 class="tema-titulo-text">${titulo}</h2>`;
    } else {
        elTitulo.innerHTML = '';
    }

    if (definicion) {
        elDesc.innerHTML  = definicion;
        elDesc.style.display = 'block';
    } else {
        elDesc.innerHTML  = '';
        elDesc.style.display = 'none';
    }
}

function limpiarPantalla() {
    document.getElementById('workspace-container').innerHTML = '';
    mostrarDescripcion('', '');
}

// ============================================================
//  INICIO — contenido general sin consolas
// ============================================================
document.getElementById('btn-inicio').addEventListener('click', () => {
    limpiarPantalla();
    // Aquí irá el contenido de conceptos generales de programación
    // mostrarDescripcion('Inicio', '<p>Contenido general...</p>');
});

// ============================================================
//  NAVEGACIÓN — cargar tema al hacer click
// ============================================================
document.querySelectorAll('.nav-sub-btn, .nav-btn[data-tema]').forEach(btn => {
    btn.addEventListener('click', () => {
        const tema = btn.dataset.tema;
        if (tema) cargarTema(tema);
    });
});

function cargarTema(nombreTema) {
    const datos = window.temas[nombreTema];
    if (!datos) return;

    // 1. Mostrar título y definición del tema
    mostrarDescripcion(datos.titulo, datos.definicion);

    // 2. Inyectar las consolas debajo de la definición
    insertarConsolas();

    // 3. Aquí irá la lógica del intérprete cuando esté lista
}