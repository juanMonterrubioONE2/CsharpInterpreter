// ============================================================
//  Simulador/array_simulator.js
//  Simulador paso a paso para los subtemas "Arreglos unidimensionales"
//  y "Arreglos bidimensionales" (matrices).
// ============================================================

// ── Utilidades ───────────────────────────────────────────────

function arrEscape(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function arrFmtVal(v, type) {
    if (v === null || v === undefined) return { text: 'null' };
    if (type === 'bool' || typeof v === 'boolean') return { text: v ? 'true' : 'false' };
    if (type === 'char') return { text: "'" + v + "'" };
    if (type === 'string' || typeof v === 'string') return { text: '"' + v + '"' };
    return { text: String(v) };
}

function arrCellText(v) {
    if (v === null || v === undefined) return '·';
    if (typeof v === 'boolean') return v ? 'T' : 'F';
    return String(v);
}

// ── Iconos del botón reproducir/pausar ───────────────────────
const _ARR_ICON_PLAY  = '<img src="./img/iconos/play.png" alt="Reproducir"><span class="tooltip-text">Reproducir</span>';
const _ARR_ICON_PAUSE = '<img src="./img/iconos/pause.png" alt="Pausar"><span class="tooltip-text">Pausar</span>';

// ── Botones por ID (compatibles con consolas.js) ─────────────
function _arrBtns() {
    return [
        document.getElementById('btn-reiniciar'),
        document.getElementById('btn-paso-anterior'),
        document.getElementById('btn-paso-siguiente'),
        document.getElementById('btn-reproducir')
    ];
}

// ── SnapshotManager ──────────────────────────────────────────

class ArrSnapMgr {
    constructor() { this.snaps = []; this.idx = -1; }
    reset()  { this.snaps = []; this.idx = -1; }
    load(snapshots) { this.snaps = snapshots || []; this.idx = this.snaps.length ? 0 : -1; }
    current() { return this.idx >= 0 ? this.snaps[this.idx] : null; }
    next()  { if (this.idx < this.snaps.length - 1) this.idx++; return this.current(); }
    prev()  { if (this.idx > 0) this.idx--; return this.current(); }
    total() { return this.snaps.length; }
}

// ── Simulador (usa CSharpEngine como motor) ──────────────────

class ArraySimulator {
    constructor() { this.snap = new ArrSnapMgr(); this.lastAst = null; }
    load(code) {
        this.snap.reset();
        this.lastAst = null;
        let result;
        try {
            result = CSharpEngine.compileAndRun(code, { maxSteps: 20000 });
        } catch (e) {
            return {
                currentLine: e.line || 1, description: e.message, isError: true,
                variables: [], arrays: [], matrices: [], output: [], changed: []
            };
        }
        this.lastAst = result.ast;
        this.snap.load(result.snapshots);
        return this.snap.current();
    }
    next()  { return this.snap.next(); }
    prev()  { return this.snap.prev(); }
    clear() { this.snap.reset(); this.lastAst = null; }
    info()  { return { index: this.snap.idx, total: this.snap.total() }; }
}

// ════════════════════════════════════════════════════════════
//  EJEMPLOS — 3 por módulo (arrays de strings)
// ════════════════════════════════════════════════════════════

const ARR_EXAMPLES = {

    // ══ ARREGLOS UNIDIMENSIONALES ═══════════════════════════
    Array_unidimensional: [

        // Ejemplo 1 — Llenar y mostrar con ciclo for
`// Llenar un arreglo con ciclo for
int[] numeros = new int[5];

for (int pos = 0; pos < numeros.Length; pos++) {
    numeros[pos] = (pos + 1) * 10;
}

for (int pos = 0; pos < numeros.Length; pos++) {
    Console.WriteLine("numeros[" + pos + "] = " + numeros[pos]);
}

Console.WriteLine("Longitud = " + numeros.Length);`,

        // Ejemplo 2 — Suma y promedio de temperaturas
`// Promedio de temperaturas semanales
int[] temps = {22, 25, 19, 28, 24};
int suma = 0;

for (int pos = 0; pos < temps.Length; pos++) {
    suma = suma + temps[pos];
}

int promedio = suma / temps.Length;
Console.WriteLine("Suma total: " + suma);
Console.WriteLine("Promedio: " + promedio + " grados");`,

        // Ejemplo 3 — Buscar el mayor y el menor
`// Calificacion mas alta y mas baja del grupo
int[] califs = {75, 92, 88, 61, 95};
int mayor = califs[0];
int menor = califs[0];

for (int pos = 1; pos < califs.Length; pos++) {
    if (califs[pos] > mayor) {
        mayor = califs[pos];
    }
    if (califs[pos] < menor) {
        menor = califs[pos];
    }
}

Console.WriteLine("Mas alta: " + mayor);
Console.WriteLine("Mas baja: " + menor);`
    ],

    // ══ ARREGLOS BIDIMENSIONALES (MATRICES) ═════════════════
    Array_bidimensional: [

        // Ejemplo 1 — Llenar con fórmula y recorrer
`// Tabla de multiplicar en una matriz 3x3
int[,] tabla = new int[3,3];

for (int fila = 0; fila < tabla.GetLength(0); fila++) {
    for (int col = 0; col < tabla.GetLength(1); col++) {
        tabla[fila,col] = (fila + 1) * (col + 1);
    }
}

Console.WriteLine("Filas: " + tabla.GetLength(0));
Console.WriteLine("Columnas: " + tabla.GetLength(1));
Console.WriteLine("tabla[1,2] = " + tabla[1,2]);`,

        // Ejemplo 2 — Suma de ventas por vendedor (fila)
`// Ventas de 3 vendedores en 3 dias
int[,] ventas = new int[3,3];

ventas[0,0] = 100;
ventas[0,1] = 150;
ventas[0,2] = 200;
ventas[1,0] = 80;
ventas[1,1] = 120;
ventas[1,2] = 90;
ventas[2,0] = 200;
ventas[2,1] = 180;
ventas[2,2] = 210;

for (int fila = 0; fila < ventas.GetLength(0); fila++) {
    int suma = 0;
    for (int col = 0; col < ventas.GetLength(1); col++) {
        suma = suma + ventas[fila,col];
    }
    Console.WriteLine("Vendedor " + (fila + 1) + ": $" + suma);
}`,

        // Ejemplo 3 — Encontrar el mayor de toda la matriz
`// Temperatura maxima de 3 ciudades en 3 dias
int[,] temps = new int[3,3];

temps[0,0] = 25;
temps[0,1] = 28;
temps[0,2] = 22;
temps[1,0] = 30;
temps[1,1] = 31;
temps[1,2] = 29;
temps[2,0] = 18;
temps[2,1] = 20;
temps[2,2] = 17;

int maxTemp = temps[0,0];
for (int fila = 0; fila < temps.GetLength(0); fila++) {
    for (int col = 0; col < temps.GetLength(1); col++) {
        if (temps[fila,col] > maxTemp) {
            maxTemp = temps[fila,col];
        }
    }
}

Console.WriteLine("Temp maxima: " + maxTemp + " grados");`
    ]
};

// ════════════════════════════════════════════════════════════
//  EJERCICIOS — problema cotidiano con enunciado y solución
// ════════════════════════════════════════════════════════════

const ARR_EJERCICIOS = {

    Array_unidimensional: {
        enunciado: `Una tienda registra el precio de 5 artículos en un arreglo. El programa recorre ese arreglo y cuenta cuántos productos superan un precio límite (umbral), además de calcular el total y el promedio. <strong>Prueba cambiando el valor de <code>umbral</code></strong> en el panel de variables: sube a 300 o baja a 100 y observa cómo cambia la cantidad de productos "caros". Así funcionan los filtros de precio en tiendas en línea como Amazon o Mercado Libre.`,
        codigo:
`// Inventario: ajusta "umbral" para filtrar precios
int umbral = 200;
int[] precios = {120, 350, 89, 275, 499};
int total = 0;
int caros = 0;

for (int pos = 0; pos < precios.Length; pos++) {
    total = total + precios[pos];
    if (precios[pos] > umbral) {
        caros = caros + 1;
    }
}

int promedio = total / precios.Length;
Console.WriteLine("Total: $" + total);
Console.WriteLine("Promedio: $" + promedio);
Console.WriteLine("Sobre $" + umbral + ": " + caros + " productos");`
    },

    Array_bidimensional: {
        enunciado: `Un maestro tiene 3 alumnos con calificaciones en 3 materias. El programa calcula el promedio de cada alumno y determina si aprueba o reprueba según una nota mínima. <strong>Prueba cambiando <code>notaMinima</code></strong> en el panel de variables: ponla en 60 (más fácil) o en 85 (muy exigente) y observa cuántos alumnos aprueban. Así funcionan los sistemas de control escolar que generan boletas automáticamente en bachilleratos y universidades.`,
        codigo:
`// Calificaciones — ajusta "notaMinima" para cambiar el criterio
int notaMinima = 75;
int[,] calif = new int[3,3];

calif[0,0] = 85;
calif[0,1] = 90;
calif[0,2] = 78;
calif[1,0] = 70;
calif[1,1] = 65;
calif[1,2] = 88;
calif[2,0] = 95;
calif[2,1] = 88;
calif[2,2] = 91;

int aprobados = 0;

for (int alumno = 0; alumno < calif.GetLength(0); alumno++) {
    int suma = 0;
    for (int materia = 0; materia < calif.GetLength(1); materia++) {
        suma = suma + calif[alumno,materia];
    }
    int prom = suma / calif.GetLength(1);
    if (prom >= notaMinima) {
        Console.WriteLine("Alumno " + (alumno + 1) + ": " + prom + " aprobado");
        aprobados = aprobados + 1;
    } else {
        Console.WriteLine("Alumno " + (alumno + 1) + ": " + prom + " reprobado");
    }
}

Console.WriteLine("Aprobados: " + aprobados + " de " + calif.GetLength(0));`
    }
};

// ── Helpers de items (como simGetEjemplos / simGetItems) ─────

function arrGetEjemplos(tema) {
    const ex = ARR_EXAMPLES[tema];
    if (Array.isArray(ex)) return ex.slice();
    if (typeof ex === 'string') return [ex];
    return [''];
}

function arrGetItems(tema) {
    const items = arrGetEjemplos(tema).map((code, i) => ({
        label: 'Ejemplo ' + (i + 1),
        codigo: code,
        enunciado: null,
        esEjercicio: false
    }));
    const ej = ARR_EJERCICIOS[tema];
    if (ej) items.push({ label: 'Ejercicio', codigo: ej.codigo, enunciado: ej.enunciado, esEjercicio: true });
    return items;
}

// Cambia el texto descriptivo de arriba: concepto normal o enunciado del ejercicio
function arrSetDescripcion(html, esEjercicio) {
    const elDesc = document.getElementById('tema-descripcion');
    if (!elDesc) return;
    if (html) {
        elDesc.innerHTML = esEjercicio
            ? '<span class="sim-ejercicio-badge">Ejercicio: </span>' + html
            : html;
        elDesc.style.display = 'block';
        elDesc.classList.toggle('modo-ejercicio', !!esEjercicio);
    } else {
        elDesc.innerHTML = '';
        elDesc.style.display = 'none';
        elDesc.classList.remove('modo-ejercicio');
    }
}

// ── Estado global del módulo ──────────────────────────────────

const arrSim = new ArraySimulator();
let arrMonacoEditor = null;
let arrDecorations  = [];
let arrPlayTimer    = null;
let arrPlaying      = false;
let arrCurrentCode  = '';
let arrTemaActual   = '';

// ── Variables escalares editables ────────────────────────────

function arrExtraerVariablesEditables(ast) {
    if (!ast || !ast.body) return [];
    return ast.body
        .filter(n => n.type === 'VariableDeclaration' && n.init && n.init.type === 'Literal' && n.init.value !== null)
        .map(n => ({ name: n.name, dataType: n.dataType, raw: n.init.raw, value: n.init.value, line: n.line }));
}

function arrReconstruirCodigo(baseCode, variables, valoresNuevos) {
    const lineas = baseCode.split('\n');
    for (const v of variables) {
        const idx = v.line - 1;
        if (idx < 0 || idx >= lineas.length) continue;
        const nuevoValor = valoresNuevos[v.name];
        let valorFormateado;
        if (v.raw === 'string') {
            valorFormateado = '"' + String(nuevoValor).replace(/"/g, '\\"') + '"';
        } else if (v.raw === 'char') {
            valorFormateado = "'" + String(nuevoValor).charAt(0) + "'";
        } else if (v.raw === 'bool') {
            valorFormateado = (nuevoValor === true || nuevoValor === 'true') ? 'true' : 'false';
        } else {
            const num = parseFloat(nuevoValor);
            valorFormateado = isNaN(num) ? String(v.value) : String(num);
        }
        const regex = new RegExp('^(\\s*' + v.dataType + '\\s+' + v.name + '\\s*=\\s*).*?(;.*)$');
        lineas[idx] = lineas[idx].replace(regex, (_, antes, despues) => antes + valorFormateado + despues);
    }
    return lineas.join('\n');
}

function arrRenderInputsVariables(variables, codigoBase) {
    const host = document.getElementById('arr-vars-editable');
    if (!host) return;

    if (!variables.length) {
        host.innerHTML = '';
        host.dataset.arrVarsSignature = '';
        return;
    }

    const signature = variables.map(v => v.name + ':' + v.dataType).join('|');
    if (host.dataset.arrVarsSignature === signature) return;
    host.dataset.arrVarsSignature = signature;

    host.innerHTML = variables.map(v => {
        const tipoInput = (v.dataType === 'int' || v.dataType === 'double' || v.dataType === 'float' || v.dataType === 'long') ? 'number' : 'text';
        let inputHtml;
        if (v.dataType === 'bool') {
            inputHtml =
                '<select class="arr-var-input" data-var="' + v.name + '">' +
                    '<option value="true"'  + (v.value === true  ? ' selected' : '') + '>true</option>'  +
                    '<option value="false"' + (v.value === false ? ' selected' : '') + '>false</option>' +
                '</select>';
        } else {
            inputHtml =
                '<input class="arr-var-input" type="' + tipoInput + '" data-var="' + v.name + '" value="' + arrEscape(String(v.value)) + '"' +
                (tipoInput === 'number' && v.dataType !== 'int' && v.dataType !== 'long' ? ' step="0.01"' : '') + '>';
        }
        return (
            '<div class="arr-var-field">' +
                '<label>' + arrEscape(v.dataType) + ' ' + arrEscape(v.name) + '</label>' +
                inputHtml +
            '</div>'
        );
    }).join('');

    host.querySelectorAll('.arr-var-input').forEach(input => {
        const evento = input.tagName === 'SELECT' ? 'change' : 'input';
        input.addEventListener(evento, () => {
            const valoresNuevos = {};
            host.querySelectorAll('.arr-var-input').forEach(inp => {
                valoresNuevos[inp.dataset.var] = inp.tagName === 'SELECT' ? (inp.value === 'true') : inp.value;
            });
            const nuevoCodigo = arrReconstruirCodigo(codigoBase, variables, valoresNuevos);
            if (arrMonacoEditor) arrMonacoEditor.setValue(nuevoCodigo);
            arrEjecutarSinTocarInputs(nuevoCodigo);
        });
    });
}

function arrEjecutarSinTocarInputs(codigo) {
    const first = arrSim.load(codigo);
    arrRender(first, arrSim.info());
    const btns = _arrBtns();
    if (btns[1]) btns[1].disabled = true;
    if (btns[3]) { arrPlaying = false; btns[3].innerHTML = _ARR_ICON_PLAY; }
}

function arrCargarYEjecutar(codigo) {
    const first    = arrSim.load(codigo);
    const variables = arrExtraerVariablesEditables(arrSim.lastAst);
    arrRenderInputsVariables(variables, codigo);
    arrRender(first, arrSim.info());
    const btns = _arrBtns();
    if (btns[1]) btns[1].disabled = true;
    if (btns[3]) { arrPlaying = false; btns[3].innerHTML = _ARR_ICON_PLAY; }
}

// ── Render de memoria (variables, arreglos y matrices) ────────

function arrBuildForBoxHtml(forCtx) {
    if (!forCtx) return '';
    const val    = forCtx.varValue !== null ? forCtx.varValue : '?';
    const valStr = arrEscape(String(val));
    // Sustituye el nombre de la variable por su valor numérico actual
    const varRe         = new RegExp('\\b' + forCtx.varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
    const condWithVal   = arrEscape(forCtx.condText.replace(varRe,   String(val)));
    const updateWithVal = arrEscape(forCtx.updateText.replace(varRe, String(val)));
    let condBadge = '';
    if (forCtx.condResult !== null) {
        const yes = forCtx.condResult;
        condBadge = '<span class="sim-for-badge ' + (yes ? 'sim-for-t' : 'sim-for-f') + '">' +
            (yes ? '✓ verdadero' : '✗ falso') + '</span>';
    }
    return '<div class="sim-for-panel">' +
        '<div class="sim-for-header">⟳ ciclo <b>for</b></div>' +
        '<div class="sim-for-parts">' +
            '<div class="sim-for-part">' +
                '<div class="sim-for-label">inicializador</div>' +
                '<code class="sim-for-code">' + arrEscape(forCtx.varName) + ' = <b class="sim-for-t">' + valStr + '</b></code>' +
            '</div>' +
            '<div class="sim-for-part">' +
                '<div class="sim-for-label">condición</div>' +
                '<code class="sim-for-code">' + condWithVal + '</code>' +
                (condBadge ? '<div class="sim-for-now">' + condBadge + '</div>' : '') +
            '</div>' +
            '<div class="sim-for-part">' +
                '<div class="sim-for-label">avance</div>' +
                '<code class="sim-for-code">' + updateWithVal + '</code>' +
            '</div>' +
        '</div>' +
    '</div>';
}

function arrBuildMemoriaHtml(state) {
    const ch = new Set(state.changed || []);
    const rd = new Set(state.read || []);
    let html = arrBuildForBoxHtml(state.forCtx);

    if (state.variables && state.variables.length) {
        html += '<div class="cs-mem-block"><div class="cs-mem-head">Variables<span class="n">' + state.variables.length + '</span></div>';
        state.variables.forEach(v => {
            const f = arrFmtVal(v.value, v.type);
            const changed = ch.has(v.name);
            html += '<div class="cs-var-row' + (changed ? ' cs-flash' : '') + '">' +
                arrEscape(v.type) + ' <b>' + arrEscape(v.name) + '</b> = ' + arrEscape(f.text) + '</div>';
        });
        html += '</div>';
    }

    if (state.arrays && state.arrays.length) {
        html += '<div class="cs-mem-block"><div class="cs-mem-head">Arreglos<span class="n">' + state.arrays.length + '</span></div>';
        state.arrays.forEach(a => {
            html += '<div class="cs-arr"><div class="cs-arr-name">' + arrEscape(a.type) + '[] <b>' + arrEscape(a.name) + '</b><span class="meta">.Length = ' + a.length + '</span></div>';
            html += '<div class="cs-cells">';
            for (let i = 0; i < a.length; i++) {
                const val   = a.values[i];
                const isch  = ch.has(a.name + '[' + i + ']');
                const isrd  = !isch && rd.has(a.name + '[' + i + ']');
                const extra = isch ? ' cs-flash' : (isrd ? ' cs-read' : '');
                html += '<div class="cs-cell-wrap">' +
                    '<div class="cs-cell-idx' + (isrd ? ' cs-read-idx' : '') + '">' + i + '</div>' +
                    '<div class="cs-cell' + (val === null ? ' cs-null' : '') + extra + '">' + arrEscape(arrCellText(val)) + '</div>' +
                    '</div>';
            }
            html += '</div></div>';
        });
        html += '</div>';
    }

    if (state.matrices && state.matrices.length) {
        html += '<div class="cs-mem-block"><div class="cs-mem-head">Matrices<span class="n">' + state.matrices.length + '</span></div>';
        state.matrices.forEach(m => {
            html += '<div class="cs-mtx"><div class="cs-mtx-name">' + arrEscape(m.type) + '[,] <b>' + arrEscape(m.name) + '</b><span class="meta">' + m.rows + ' × ' + m.cols + '</span></div>';
            html += '<table class="cs-mtx-table"><tr><th></th>';
            for (let c = 0; c < m.cols; c++) html += '<th>C' + c + '</th>';
            html += '</tr>';
            for (let r = 0; r < m.rows; r++) {
                html += '<tr><th>F' + r + '</th>';
                for (let c = 0; c < m.cols; c++) {
                    const val   = m.values[r][c];
                    const key   = m.name + '[' + r + ',' + c + ']';
                    const isch  = ch.has(key);
                    const isrd  = !isch && rd.has(key);
                    const extra = isch ? ' cs-flash' : (isrd ? ' cs-read' : '');
                    html += '<td><div class="cs-mcell' + (val === null ? ' cs-null' : '') + extra + '">' + arrEscape(arrCellText(val)) + '</div></td>';
                }
                html += '</tr>';
            }
            html += '</table></div>';
        });
        html += '</div>';
    }

    if (!html) html = '<div class="cs-empty-hint">Aún no hay datos en memoria en este paso.</div>';
    return html;
}

function arrRender(state, info) {
    if (!state) { arrClearPanels(); return; }
    arrHighlightLine(state.currentLine, state.isError);

    const panelPaso = document.getElementById('panel-paso');
    if (panelPaso) {
        const src = (arrMonacoEditor && state.currentLine)
            ? arrEscape(arrMonacoEditor.getModel().getLineContent(state.currentLine).trim())
            : '';
        panelPaso.innerHTML =
            (state.currentLine ? '<div class="cs-step-line">Línea ' + state.currentLine + ': ' + src + '</div>' : '') +
            '<div class="cs-step-note' + (state.isError ? ' iserr' : '') + '">' + arrEscape(state.description || '') + '</div>';
    }

    const panelVars = document.getElementById('panel-vars');
    if (panelVars) panelVars.innerHTML = arrBuildMemoriaHtml(state);

    const panelSalida = document.getElementById('panel-salida');
    if (panelSalida) panelSalida.textContent = (state.output || []).join('\n');

    if (info && info.total > 0) {
        const stepEl = document.querySelector('.ctrl-step');
        if (stepEl) stepEl.textContent = 'Paso ' + (info.index + 1) + ' / ' + info.total;
        const fill = document.querySelector('.pbar i');
        if (fill) fill.style.width = ((info.index + 1) / info.total * 100) + '%';
    }
}

function arrHighlightLine(line, isError) {
    if (!arrMonacoEditor) return;
    if (!line || line < 1) { arrDecorations = arrMonacoEditor.deltaDecorations(arrDecorations, []); return; }
    const cls = isError ? 'cs-line-error' : 'cs-line-active';
    arrDecorations = arrMonacoEditor.deltaDecorations(arrDecorations, [{
        range: new monaco.Range(line, 1, line, 1),
        options: { isWholeLine: true, className: cls }
    }]);
    arrMonacoEditor.revealLineInCenter(line);
}

function arrClearPanels() {
    if (arrMonacoEditor) arrDecorations = arrMonacoEditor.deltaDecorations(arrDecorations, []);
    const panelPaso   = document.getElementById('panel-paso');
    const panelVars   = document.getElementById('panel-vars');
    const panelSalida = document.getElementById('panel-salida');
    const stepEl      = document.querySelector('.ctrl-step');
    const fill        = document.querySelector('.pbar i');
    if (panelPaso)   panelPaso.innerHTML    = '';
    if (panelVars)   panelVars.innerHTML    = '';
    if (panelSalida) panelSalida.textContent = '';
    if (stepEl)      stepEl.textContent     = 'Paso 0 / 0';
    if (fill)        fill.style.width       = '0%';
}

// ── Inicialización del editor con sistema de tabs ─────────────

function initArraySimulator(nombreTema) {
    const editorBody = document.getElementById('editor-body');
    if (!editorBody) return;

    arrTemaActual = nombreTema;
    const items = arrGetItems(nombreTema);
    const defOriginal = (window.temas && window.temas[nombreTema]) ? window.temas[nombreTema].definicion : '';

    // Panel de variables editables
    if (!document.getElementById('arr-vars-editable')) {
        const varsHost = document.createElement('div');
        varsHost.id = 'arr-vars-editable';
        editorBody.parentNode.insertBefore(varsHost, editorBody);
    }

    // Tabs (solo si hay más de un item)
    if (!document.getElementById('arr-ejemplos-tabs') && items.length > 1) {
        const tabs = document.createElement('div');
        tabs.id = 'arr-ejemplos-tabs';
        tabs.innerHTML = items.map((it, i) =>
            '<button class="sim-tab' + (i === 0 ? ' activo' : '') +
            (it.esEjercicio ? ' ejercicio' : '') +
            '" data-idx="' + i + '">' + it.label + '</button>'
        ).join('');
        editorBody.parentNode.insertBefore(tabs, editorBody.parentNode.querySelector('#arr-vars-editable'));
    }

    const codigoInicial = items[0].codigo;
    arrCurrentCode = codigoInicial;

    // Activa la lógica de las tabs una vez que el editor esté listo
    function activarTabs() {
        const tabs = document.getElementById('arr-ejemplos-tabs');
        if (!tabs) return;
        tabs.querySelectorAll('.sim-tab').forEach(btn => {
            btn.onclick = () => {
                arrStopPlay(_arrBtns());
                const idx = parseInt(btn.dataset.idx);
                const it  = items[idx];

                tabs.querySelectorAll('.sim-tab').forEach(b => b.classList.remove('activo'));
                btn.classList.add('activo');

                // Muestra enunciado del ejercicio o descripción normal
                if (it.enunciado) {
                    arrSetDescripcion(it.enunciado, true);
                } else {
                    arrSetDescripcion(defOriginal, false);
                }

                arrCurrentCode = it.codigo;
                if (arrMonacoEditor) arrMonacoEditor.setValue(it.codigo);
                arrCargarYEjecutar(it.codigo);
            };
        });
    }

    function crearEditor() {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            arrMonacoEditor = monaco.editor.create(editorBody, {
                value: codigoInicial,
                language: 'csharp',
                theme: 'vs-dark',
                automaticLayout: true,
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                readOnly: true
            });
            arrConectarBotones();
            activarTabs();
            arrCargarYEjecutar(codigoInicial);
        });
    }

    if (window.monaco) {
        crearEditor();
    } else if (window.require) {
        crearEditor();
    } else {
        const loader = document.createElement('script');
        loader.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.js';
        loader.onload = crearEditor;
        document.head.appendChild(loader);
    }
}

// ── Auto-reproducción ─────────────────────────────────────────

function arrGetDelay() {
    const slider = document.getElementById('arr-speed-slider');
    const val = slider ? parseInt(slider.value) : 40;
    return Math.round(2000 - (val / 100) * 1800);
}

function arrStopPlay(btns) {
    clearTimeout(arrPlayTimer);
    arrPlayTimer = null;
    arrPlaying   = false;
    const btnR = (btns && btns[3]) ? btns[3] : document.getElementById('btn-reproducir');
    if (btnR) btnR.innerHTML = _ARR_ICON_PLAY;
}

function arrAutoPlay(btns) {
    const info = arrSim.info();
    if (info.index >= info.total - 1) { arrStopPlay(btns); return; }
    const state = arrSim.next();
    arrRender(state, arrSim.info());
    if (btns[1]) btns[1].disabled = (arrSim.info().index <= 0);
    arrPlayTimer = setTimeout(() => arrAutoPlay(btns), arrGetDelay());
}

// ── Conexión de botones ───────────────────────────────────────

function arrConectarBotones() {
    const btns = _arrBtns();

    // [0] Volver al inicio → regresa al paso 1 con el código actual del editor
    if (btns[0]) btns[0].onclick = () => {
        arrStopPlay(btns);
        const codigoActual = arrMonacoEditor ? arrMonacoEditor.getValue() : arrCurrentCode;
        arrEjecutarSinTocarInputs(codigoActual);
    };

    // [1] Paso anterior
    if (btns[1]) {
        btns[1].disabled = true;
        btns[1].onclick = () => {
            arrStopPlay(btns);
            const state = arrSim.prev();
            arrRender(state, arrSim.info());
            btns[1].disabled = (arrSim.info().index <= 0);
        };
    }

    // [2] Paso siguiente
    if (btns[2]) btns[2].onclick = () => {
        arrStopPlay(btns);
        const state = arrSim.next();
        arrRender(state, arrSim.info());
        if (btns[1]) btns[1].disabled = (arrSim.info().index <= 0);
    };

    // [3] Reproducir / Pausar
    if (btns[3]) btns[3].onclick = () => {
        if (arrPlaying) { arrStopPlay(btns); return; }
        if (arrSim.info().total === 0) {
            const first = arrSim.load(arrMonacoEditor.getValue());
            arrRender(first, arrSim.info());
            if (!first || first.isError) return;
            if (btns[1]) btns[1].disabled = true;
        }
        arrPlaying = true;
        btns[3].innerHTML = _ARR_ICON_PAUSE;
        arrPlayTimer = setTimeout(() => arrAutoPlay(btns), arrGetDelay());
    };

    // Control de velocidad
    const controls = document.querySelector('.editor-controls');
    if (controls && !document.getElementById('arr-speed-slider')) {
        const speedRow = document.createElement('div');
        speedRow.className = 'sim-speed-row';
        speedRow.innerHTML =
            '<label>Velocidad</label>' +
            '<input type="range" id="arr-speed-slider" min="1" max="100" value="40">' +
            '<span class="sim-speed-val" id="arr-speed-val">1×</span>';
        controls.appendChild(speedRow);

        const slider = document.getElementById('arr-speed-slider');
        const valLbl = document.getElementById('arr-speed-val');
        slider.addEventListener('input', () => {
            valLbl.textContent = (parseFloat(slider.value) / 40).toFixed(1) + '×';
        });
    }
}

// ── Hook a cargarTema ─────────────────────────────────────────

(function () {
    const _cargarTema = window.cargarTema;
    window.cargarTema = function (nombreTema) {
        arrStopPlay(null);
        if (arrMonacoEditor) {
            arrMonacoEditor.dispose();
            arrMonacoEditor = null;
            arrDecorations  = [];
        }
        arrSim.clear();

        if (typeof _cargarTema === 'function') _cargarTema(nombreTema);

        if (nombreTema === 'Array_unidimensional' || nombreTema === 'Array_bidimensional') {
            setTimeout(() => initArraySimulator(nombreTema), 0);
        }
    };
})();
