/* ════════ DATOS DE EJEMPLO (luego vendrán de la API) ════════ */
const TEMAS = {
    'if': {
        titulo: 'If / Else', archivo: 'ifelse.cs',
        definicion: 'La estructura <strong>if</strong> ejecuta un bloque de código solo si una condición es verdadera. Puede combinarse con <strong>else if</strong> y <strong>else</strong> para manejar múltiples casos.',
        codigo: `int edad = 17;\nstring nombre = "Juan";\n\nif (edad >= 18) {\n    Console.WriteLine(nombre + " es mayor de edad");\n} else if (edad >= 13) {\n    Console.WriteLine(nombre + " es adolescente");\n} else {\n    Console.WriteLine(nombre + " es niño");\n}`
    },
    'switch': {
        titulo: 'Switch', archivo: 'switch.cs',
        definicion: 'La estructura <strong>switch</strong> evalúa una expresión y ejecuta el bloque correspondiente a su valor. Es útil cuando hay múltiples casos posibles para una misma variable.',
        codigo: `int dia = 3;\nswitch (dia) {\n    case 1: Console.WriteLine("Lunes"); break;\n    case 2: Console.WriteLine("Martes"); break;\n    case 3: Console.WriteLine("Miércoles"); break;\n    default: Console.WriteLine("Otro día"); break;\n}`
    },
    'ternario': {
        titulo: 'Operador ternario', archivo: 'ternario.cs',
        definicion: 'El <strong>operador ternario</strong> es una forma compacta de escribir un if-else en una sola línea: condición ? valor_si_true : valor_si_false.',
        codigo: `int edad = 20;\nstring mensaje = (edad >= 18) ? "Mayor de edad" : "Menor de edad";\nConsole.WriteLine(mensaje);`
    },
    'ciclo-for': {
        titulo: 'Ciclo For', archivo: 'for.cs',
        definicion: 'El ciclo <strong>for</strong> repite un bloque un número determinado de veces. Se compone de inicialización, condición e incremento.',
        codigo: `for (int i = 1; i <= 5; i = i + 1) {\n    Console.WriteLine("Número: " + i);\n}`
    },
    'ciclo-while': {
        titulo: 'Ciclo While', archivo: 'while.cs',
        definicion: 'El ciclo <strong>while</strong> repite un bloque mientras una condición sea verdadera.',
        codigo: `int contador = 3;\nwhile (contador > 0) {\n    Console.WriteLine("Cuenta: " + contador);\n    contador = contador - 1;\n}`
    },
    'ciclo-dowhile': {
        titulo: 'Ciclo Do-While', archivo: 'dowhile.cs',
        definicion: 'El ciclo <strong>do-while</strong> garantiza que el bloque se ejecute al menos una vez, ya que la condición se evalúa al final.',
        codigo: `int x = 1;\ndo {\n    Console.WriteLine("Valor: " + x);\n    x = x + 1;\n} while (x <= 3);`
    },
    'arreglo-uni': {
        titulo: 'Arreglos unidimensionales', archivo: 'arreglo_uni.cs',
        definicion: 'Un <strong>arreglo unidimensional</strong> almacena varios elementos del mismo tipo en una secuencia contigua.',
        codigo: `int[] numeros = {10, 20, 30};\nfor (int i = 0; i < 3; i = i + 1) {\n    Console.WriteLine(numeros[i]);\n}`
    },
    'arreglo-bi': {
        titulo: 'Arreglos bidimensionales', archivo: 'arreglo_bi.cs',
        definicion: 'Un <strong>arreglo bidimensional</strong> organiza los datos en filas y columnas, como una tabla.',
        codigo: `int[,] matriz = {{1,2},{3,4}};\nConsole.WriteLine(matriz[0,0]);\nConsole.WriteLine(matriz[1,1]);`
    },
    'recursividad': {
        titulo: 'Recursividad', archivo: 'recursividad.cs',
        definicion: 'La <strong>recursividad</strong> ocurre cuando una función se llama a sí misma. Tiene un caso base que detiene la recursión y un caso recursivo.',
        codigo: `int factorial = 1;\nint numero = 5;\nint temporal = numero;\nwhile (temporal > 1) {\n    factorial = factorial * temporal;\n    temporal = temporal - 1;\n}\nConsole.WriteLine("Factorial: " + factorial);`
    },
    'archivos': {
        titulo: 'Archivos', archivo: 'archivos.cs',
        definicion: 'Sección dedicada a la lectura y escritura de archivos en C#.',
        codigo: `// Ejemplo de archivos (pendiente)\nConsole.WriteLine("Lectura de archivos");`
    },
    'glosario': {
        titulo: 'Glosario', archivo: 'glosario.cs',
        definicion: 'Administra aquí los términos técnicos y sus definiciones.',
        codigo: `// El glosario tendrá su propia vista de edición en el siguiente paso.`
    }
};

const estudiantes = [
    { nombre: "María Fernanda López", matricula: "2023A0451", hechas: 24, total: 24, cuat: 4, color: "#04AA6D" },
    { nombre: "Diego Ramírez Soto", matricula: "2023A0288", hechas: 23, total: 24, cuat: 4, color: "#7B2CBF" },
    { nombre: "Valeria Ortiz Mena", matricula: "2024B0112", hechas: 21, total: 24, cuat: 3, color: "#f7b733" },
    { nombre: "Carlos Herrera Ruiz", matricula: "2024B0190", hechas: 19, total: 24, cuat: 3, color: "#2d9cdb" },
    { nombre: "Ana Sofía Torres", matricula: "2024C0033", hechas: 17, total: 24, cuat: 2, color: "#eb5757" },
    { nombre: "Luis Ángel Mendoza", matricula: "2025A0007", hechas: 14, total: 24, cuat: 1, color: "#06c47e" },
    { nombre: "Paola Jiménez Cruz", matricula: "2025A0061", hechas: 11, total: 24, cuat: 1, color: "#bb6bd9" },
    { nombre: "Jorge Castillo Vega", matricula: "2025A0078", hechas: 8, total: 24, cuat: 1, color: "#f2994a" },
];

let temaActual = null, originalSnapshot = null, dirty = false, monacoEditor = null;

/* ════ Inicio: usuarios ════ */
function inic(n) { const p = n.trim().split(/\s+/); return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() }
function pintarUsuarios() {
    document.getElementById("userRows").innerHTML = estudiantes.map((e, i) => {
        const pos = i + 1, pct = Math.round(e.hechas / e.total * 100), rc = pos <= 3 ? ` rank--${pos}` : "";
        return `<tr>
            <td class="num"><span class="rank${rc}">${pos}</span></td>
            <td><div class="u-cell"><div class="u-avatar" style="background:${e.color}">${inic(e.nombre)}</div><div class="u-name"><b>${e.nombre}</b><small>Activo</small></div></div></td>
            <td><span class="matricula">${e.matricula}</span></td>
            <td><div class="prog"><div class="prog__bar"><div class="prog__fill" style="width:${pct}%"></div></div><span class="prog__num">${e.hechas}/${e.total}</span></div></td>
            <td class="num"><span class="badge">${e.cuat}.º</span></td>
            <td><div class="row-actions">
                <button class="icon-btn" title="Editar"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></button>
                <button class="icon-btn danger" title="Eliminar"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
            </div></td></tr>`;
    }).join("");
}
pintarUsuarios();

/* ════ Navegación ════ */
/* function clearActive() { document.querySelectorAll('.nav-btn,.nav-sub-btn').forEach(b => b.classList.remove('active')) }
function navInicio(btn) { if (!confirmDiscard()) return; clearActive(); btn.classList.add('active'); showView('inicio'); }
function navTema(btn, slug) { if (!confirmDiscard()) return; clearActive(); btn.classList.add('active'); showView('tema'); cargarTema(slug); }
function showView(name) { document.querySelectorAll('.view').forEach(v => v.classList.remove('show')); document.getElementById('view-' + name).classList.add('show'); }
function toggleGroup(id) { document.getElementById(id).classList.toggle('open'); }
 */

const toggleBtn = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');

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

if (toggleBtn) toggleBtn.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
});

if (overlay) overlay.addEventListener('click', closeSidebar);


/* ════ Carga de un tema ════ */
function cargarTema(slug) {
    const t = cargarTemaDesdeAPI(slug);
    if (!t) return;
    temaActual = slug;
    originalSnapshot = JSON.stringify({ titulo: t.titulo, definicion: t.definicion, codigo: t.codigo });
    document.getElementById('temaTitulo').textContent = t.titulo;
    document.getElementById('f-titulo').value = t.titulo;
    document.getElementById('f-definicion').value = t.definicion;
    document.getElementById('codeFileName').textContent = t.archivo || 'ejemplo.cs';
    if (monacoEditor) monacoEditor.setValue(t.codigo);
    else document.getElementById('codeFallback').value = t.codigo;
    setDirty(false);
}

/* ════ PUNTOS DE CONEXIÓN CON LA API ════
   Hoy leen/escriben el objeto local TEMAS. Cuando la API esté lista:
   cargarTemaDesdeAPI  →  const r = await fetch(`${API}/api/subtemas/${slug}`); return await r.json();
   guardarTemaEnAPI    →  await fetch(`${API}/api/subtemas/${slug}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(datos)});
*/
function cargarTemaDesdeAPI(slug) { return TEMAS[slug] ? { ...TEMAS[slug] } : null; }
function guardarTemaEnAPI(slug, datos) { TEMAS[slug] = { ...TEMAS[slug], ...datos }; return true; }

/* ════ Guardar / Cancelar ════ */
function getCodigoActual() { return monacoEditor ? monacoEditor.getValue() : document.getElementById('codeFallback').value; }
function guardarCambios() {
    if (!temaActual) return;
    const datos = { titulo: document.getElementById('f-titulo').value.trim(), definicion: document.getElementById('f-definicion').value.trim(), codigo: getCodigoActual() };
    if (!datos.titulo) { alert('El título no puede estar vacío.'); return; }
    if (guardarTemaEnAPI(temaActual, datos)) {
        originalSnapshot = JSON.stringify(datos);
        document.getElementById('temaTitulo').textContent = datos.titulo;
        setDirty(false);
        flashStatus('Cambios guardados ✓', true);
    } else { flashStatus('No se pudo guardar', false); }
}
function cancelarCambios() {
    if (!temaActual || !originalSnapshot) return;
    const s = JSON.parse(originalSnapshot);
    document.getElementById('f-titulo').value = s.titulo;
    document.getElementById('f-definicion').value = s.definicion;
    if (monacoEditor) monacoEditor.setValue(s.codigo); else document.getElementById('codeFallback').value = s.codigo;
    setDirty(false);
}

/* ════ Estado "dirty" ════ */
function markDirty() { setDirty(true); }
function setDirty(v) {
    dirty = v;
    document.getElementById('btnGuardar').disabled = !v;
    const st = document.getElementById('saveStatus'); st.classList.toggle('dirty', v);
    document.getElementById('saveStatusText').textContent = v ? 'Cambios sin guardar' : 'Sin cambios';
}
function flashStatus(msg, ok) {
    const st = document.getElementById('saveStatus'), txt = document.getElementById('saveStatusText');
    st.classList.remove('dirty'); st.style.color = ok ? 'var(--green-main)' : 'var(--danger)'; txt.textContent = msg;
    setTimeout(() => { st.style.color = ''; txt.textContent = 'Sin cambios'; }, 2200);
}
function confirmDiscard() { if (!dirty) return true; return confirm('Tienes cambios sin guardar. ¿Deseas descartarlos?'); }

/* ════ Monaco ════ */
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    monacoEditor = monaco.editor.create(document.getElementById('monaco-editor'), {
        value: '', language: 'csharp', theme: 'vs-dark', automaticLayout: true,
        fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false
    });
    monacoEditor.onDidChangeModelContent(() => { if (temaActual) markDirty(); });
    document.getElementById('codeFallback').style.display = 'none';
});