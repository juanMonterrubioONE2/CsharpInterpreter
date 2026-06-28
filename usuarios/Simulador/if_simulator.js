// ============================================================
//  Backend/if_simulator.js
//  Simulador paso a paso para el subtema "if / else if / else"
//  Se conecta a los paneles del workspace existente (consolas.js)
//
//  NUEVO: variables editables.
//  El editor Monaco queda en modo solo-lectura (readOnly), y los
//  valores iniciales de las variables (int, string, bool, double...)
//  se exponen como inputs HTML generados automáticamente a partir
//  del AST. Cambiar un input reconstruye el código y vuelve a
//  ejecutar el simulador con el nuevo valor.
// ============================================================

// ── Utilidades ───────────────────────────────────────────────

function ifFmt(v) {
    if (typeof v === 'string') return '"' + v + '"';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (v === undefined || v === null) return 'null';
    return String(v);
}

function ifEscape(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// ── Scope ────────────────────────────────────────────────────

class IfVariables {
    constructor() { this.map = {}; }
    has(n) { return Object.prototype.hasOwnProperty.call(this.map, n); }
    set(n, v) { this.map[n] = v; }
    get(n) { return this.map[n]; }
    snapshot() { return { ...this.map }; }
}

class IfScope {
    constructor(parent = null) { this.parent = parent; this.frame = new IfVariables(); }
    declare(name, value) { this.frame.set(name, value); }
    set(name, value) {
        let s = this;
        while (s) { if (s.frame.has(name)) { s.frame.set(name, value); return; } s = s.parent; }
        this.frame.set(name, value);
    }
    get(name) {
        let s = this;
        while (s) { if (s.frame.has(name)) return s.frame.get(name); s = s.parent; }
        return undefined;
    }
    snapshot() {
        const chain = []; let s = this;
        while (s) { chain.unshift(s); s = s.parent; }
        const out = {};
        for (const sc of chain) Object.assign(out, sc.frame.snapshot());
        return out;
    }
}

// ── SnapshotManager ──────────────────────────────────────────

class IfSnapMgr {
    constructor() { this.snaps = []; this.idx = -1; }
    reset() { this.snaps = []; this.idx = -1; }
    capture(state) { this.snaps.push(state); }
    begin() { this.idx = this.snaps.length ? 0 : -1; }
    current() { return this.idx >= 0 ? this.snaps[this.idx] : null; }
    next() { if (this.idx < this.snaps.length - 1) this.idx++; return this.current(); }
    prev() { if (this.idx > 0) this.idx--; return this.current(); }
    total() { return this.snaps.length; }
}

// ── Lexer ─────────────────────────────────────────────────────

function ifTokenize(code) {
    const tokens = []; let i = 0, line = 1;
    const KW = new Set(['int', 'string', 'bool', 'double', 'float', 'char', 'long', 'var', 'if', 'else', 'true', 'false']);
    const TWO = ['==', '!=', '<=', '>=', '&&', '||'];
    const isDigit   = c => c >= '0' && c <= '9';
    const isIdStart = c => /[A-Za-z_]/.test(c);
    const isId      = c => /[A-Za-z0-9_]/.test(c);

    while (i < code.length) {
        const c = code[i];
        if (c === '\n') { line++; i++; continue; }
        if (/\s/.test(c)) { i++; continue; }
        if (c === '/' && code[i + 1] === '/') { while (i < code.length && code[i] !== '\n') i++; continue; }

        if (c === '"') {
            let j = i + 1, s = '';
            while (j < code.length && code[j] !== '"') {
                if (code[j] === '\\' && code[j + 1]) {
                    s += ({ n: '\n', t: '\t', '"': '"', '\\': '\\' })[code[j + 1]] || code[j + 1];
                    j += 2; continue;
                }
                s += code[j++];
            }
            tokens.push({ type: 'string', value: s, line }); i = j + 1; continue;
        }
        if (isDigit(c)) {
            let n = '';
            while (i < code.length && (isDigit(code[i]) || code[i] === '.')) n += code[i++];
            tokens.push({ type: 'number', value: parseFloat(n), line }); continue;
        }
        if (isIdStart(c)) {
            let id = '';
            while (i < code.length && isId(code[i])) id += code[i++];
            tokens.push({ type: KW.has(id) ? 'keyword' : 'ident', value: id, line }); continue;
        }
        const two = code.substr(i, 2);
        if (TWO.includes(two)) { tokens.push({ type: 'op', value: two, line }); i += 2; continue; }
        if ('(){};,.[]'.includes(c)) { tokens.push({ type: 'punct', value: c, line }); i++; continue; }
        if ('+-*/%=<>!'.includes(c)) { tokens.push({ type: 'op', value: c, line }); i++; continue; }
        i++;
    }
    tokens.push({ type: 'eof', value: null, line });
    return tokens;
}

// ── Parser ────────────────────────────────────────────────────

const IF_PREC  = { '||': 1, '&&': 2, '==': 3, '!=': 3, '<': 4, '>': 4, '<=': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6 };
const IF_TYPES = ['int', 'string', 'bool', 'double', 'float', 'char', 'long', 'var'];

function ifExprStr(n) {
    if (!n) return '';
    if (n.type === 'Literal') return typeof n.value === 'string' ? '"' + n.value + '"' : String(n.value);
    if (n.type === 'Ident')   return n.name;
    if (n.type === 'Binary')  return ifExprStr(n.left) + ' ' + n.op + ' ' + ifExprStr(n.right);
    return '';
}

class IfParser {
    constructor(tokens) { this.tokens = tokens; this.pos = 0; }
    peek(n = 0) { return this.tokens[this.pos + n]; }
    next()      { return this.tokens[this.pos++]; }
    check(t, v) { const tok = this.peek(); return tok.type === t && (v === undefined || tok.value === v); }
    match(t, v) { return this.check(t, v) ? this.next() : null; }
    expect(t, v) {
        if (this.check(t, v)) return this.next();
        const tok = this.peek();
        throw new Error('Sintaxis: se esperaba "' + (v ?? t) + '" en línea ' + tok.line);
    }

    parseProgram() {
        const body = [];
        while (!this.check('eof')) body.push(this.parseStmt());
        return { type: 'Program', body };
    }

    parseStmt() {
        const t = this.peek();
        if (t.type === 'keyword') {
            if (t.value === 'if') return this.parseIfNode();
            if (IF_TYPES.includes(t.value)) return this.parseVarDecl();
        }
        if (t.type === 'ident') {
            if (t.value === 'Console') return this.parsePrint();
            const after = this.peek(1);
            if (after && after.type === 'op' && after.value === '=') return this.parseAssign();
        }
        const line = t.line;
        const expr = this.parseExpr();
        this.match('punct', ';');
        return { type: 'ExprStmt', expr, line };
    }

    parseVarDecl() {
        const line = this.peek().line;
        const varType = this.next().value;
        const name = this.expect('ident').value;
        if (this.match('op', '=')) {
            const expr = this.parseExpr();
            this.match('punct', ';');
            return { type: 'VarDecl', varType, name, expr, line };
        }
        this.match('punct', ';');
        return { type: 'VarDecl', varType, name, expr: { type: 'Literal', value: null }, line };
    }

    parseAssign() {
        const line = this.peek().line;
        const name = this.expect('ident').value;
        this.expect('op', '=');
        const expr = this.parseExpr();
        this.match('punct', ';');
        return { type: 'Assign', name, expr, line };
    }

    parsePrint() {
        const line = this.peek().line;
        this.expect('ident', 'Console');
        this.expect('punct', '.');
        this.expect('ident'); // WriteLine / Write
        this.expect('punct', '(');
        const expr = this.check('punct', ')') ? { type: 'Literal', value: '' } : this.parseExpr();
        this.expect('punct', ')');
        this.match('punct', ';');
        return { type: 'Print', expr, line };
    }

    parseIfNode() {
        const tok = this.expect('keyword', 'if');
        this.expect('punct', '(');
        const cond = this.parseExpr();
        this.expect('punct', ')');
        const clauses = [{ cond, body: this.parseBlock(), line: tok.line }];
        while (this.check('keyword', 'else')) {
            const etok = this.next();
            if (this.check('keyword', 'if')) {
                this.next();
                this.expect('punct', '(');
                const c = this.parseExpr();
                this.expect('punct', ')');
                clauses.push({ cond: c, body: this.parseBlock(), line: etok.line });
            } else {
                clauses.push({ cond: null, body: this.parseBlock(), line: etok.line });
                break;
            }
        }
        return { type: 'If', clauses, line: tok.line };
    }

    parseBlock() {
        if (this.match('punct', '{')) {
            const body = [];
            while (!this.check('punct', '}') && !this.check('eof')) body.push(this.parseStmt());
            this.expect('punct', '}');
            return body;
        }
        return [this.parseStmt()];
    }

    parseExpr()       { return this.parseBinary(0); }

    parseBinary(minP) {
        let left = this.parseUnary();
        while (true) {
            const t = this.peek(); if (t.type !== 'op') break;
            const p = IF_PREC[t.value]; if (p === undefined || p < minP) break;
            this.next();
            left = { type: 'Binary', op: t.value, left, right: this.parseBinary(p + 1) };
        }
        return left;
    }

    parseUnary() {
        const t = this.peek();
        if (t.type === 'op' && (t.value === '-' || t.value === '!')) {
            this.next();
            return { type: 'Binary', op: t.value === '!' ? '==' : '-', left: { type: 'Literal', value: 0 }, right: this.parseUnary() };
        }
        return this.parsePrimary();
    }

    parsePrimary() {
        const t = this.next();
        if (t.type === 'number') return { type: 'Literal', value: t.value };
        if (t.type === 'string') return { type: 'Literal', value: t.value };
        if (t.type === 'keyword' && t.value === 'true')  return { type: 'Literal', value: true };
        if (t.type === 'keyword' && t.value === 'false') return { type: 'Literal', value: false };
        if (t.type === 'ident') return { type: 'Ident', name: t.value };
        if (t.type === 'punct' && t.value === '(') {
            const e = this.parseExpr();
            this.expect('punct', ')');
            return e;
        }
        throw new Error('Sintaxis: expresión inesperada "' + t.value + '" en línea ' + t.line);
    }
}

// ── Interpreter ───────────────────────────────────────────────

class IfInterp {
    constructor(snap, scope) { this.snap = snap; this.scope = scope; this.out = []; }

    run(prog) { this.execBlock(prog.body); }

    execBlock(stmts) { for (const s of stmts) this.execNode(s); }

    execNode(node) {
        switch (node.type) {
            case 'VarDecl': {
                const v = this.eval(node.expr);
                this.scope.declare(node.name, v);
                this.capture(node.line, node.name + ' = ' + ifFmt(v), null);
                break;
            }
            case 'Assign': {
                const v = this.eval(node.expr);
                this.scope.set(node.name, v);
                this.capture(node.line, node.name + ' = ' + ifFmt(v), null);
                break;
            }
            case 'Print': {
                const v = this.eval(node.expr);
                this.out.push(String(v));
                this.capture(node.line, 'imprime: ' + ifFmt(v), null);
                break;
            }
            case 'If':      this.execIf(node); break;
            case 'ExprStmt': this.eval(node.expr); this.capture(node.line, '', null); break;
        }
    }

    execIf(node) {
        for (const cl of node.clauses) {
            if (cl.cond === null) {
                this.capture(cl.line, 'else: ejecuta este bloque', 'true');
                this.execBlock(cl.body);
                return;
            }
            const res = this.eval(cl.cond);
            const txt = ifExprStr(cl.cond);
            this.capture(cl.line, res ? '(' + txt + ') = VERDADERO' : '(' + txt + ') = FALSO', res ? 'true' : 'false');
            if (res) { this.execBlock(cl.body); return; }
        }
    }

    eval(node) {
        switch (node.type) {
            case 'Literal': return node.value;
            case 'Ident':   return this.scope.get(node.name);
            case 'Binary':  return this.binop(node.op, this.eval(node.left), this.eval(node.right));
        }
    }

    binop(op, a, b) {
        switch (op) {
            case '+':  return (typeof a === 'string' || typeof b === 'string') ? String(a) + String(b) : a + b;
            case '-':  return a - b;
            case '*':  return a * b;
            case '/':  return Math.trunc(a / b);
            case '%':  return a % b;
            case '==': return a === b;
            case '!=': return a !== b;
            case '<':  return a < b;
            case '>':  return a > b;
            case '<=': return a <= b;
            case '>=': return a >= b;
            case '&&': return Boolean(a && b);
            case '||': return Boolean(a || b);
            default:   return undefined;
        }
    }

    capture(line, note, status) {
        this.snap.capture({ line, note, status, variables: this.scope.snapshot(), output: this.out.slice() });
    }
}

// ── Simulador ─────────────────────────────────────────────────

class IfSimulator {
    constructor() { this.snap = new IfSnapMgr(); this.lastAst = null; }
    load(code) {
        this.snap.reset();
        try {
            const tokens = ifTokenize(code);
            const ast    = new IfParser(tokens).parseProgram();
            this.lastAst = ast;
            const scope  = new IfScope();
            new IfInterp(this.snap, scope).run(ast);
            this.snap.begin();
            return this.snap.current();
        } catch (e) {
            return { line: 1, note: e.message, status: 'err', variables: {}, output: [] };
        }
    }
    next()  { return this.snap.next(); }
    prev()  { return this.snap.prev(); }
    clear() { this.snap.reset(); }
    info()  { return { index: this.snap.idx, total: this.snap.total() }; }
}

// ── Código de ejemplo ─────────────────────────────────────────

const IF_EXAMPLE =
`int edad = 17;
string nombre = "Juan";

if (edad >= 18) {
    Console.WriteLine(nombre + " es mayor de edad");
} else if (edad >= 13) {
    Console.WriteLine(nombre + " es adolescente");
} else {
    Console.WriteLine(nombre + " es niño");
}`;

// ── Estado global del módulo ──────────────────────────────────

const ifSim = new IfSimulator();
let ifMonacoEditor  = null;
let ifDecorations   = [];
let ifPlayTimer     = null;
let ifPlaying       = false;

function ifExtraerVariablesEditables(ast) {
    if (!ast || !ast.body) return [];
    return ast.body
        .filter(n => n.type === 'VarDecl' && n.expr && n.expr.type === 'Literal' && n.expr.value !== null)
        .map(n => ({
            name: n.name,
            varType: n.varType,
            value: n.expr.value,
            line: n.line
        }));
}

// Reconstruye el código fuente completo, sustituyendo SOLO los valores
// de las variables editables indicadas en "valores" ({ nombre: valor }),
// sin tocar el resto de la estructura (if/else, prints, etc.).
function ifReconstruirCodigo(baseCode, variables, valoresNuevos) {
    const lineas = baseCode.split('\n');
    for (const v of variables) {
        const idx = v.line - 1;
        if (idx < 0 || idx >= lineas.length) continue;
        const nuevoValor = valoresNuevos[v.name];
        let valorFormateado;
        if (typeof v.value === 'string') {
            valorFormateado = '"' + String(nuevoValor).replace(/"/g, '\\"') + '"';
        } else if (typeof v.value === 'boolean') {
            valorFormateado = (nuevoValor === true || nuevoValor === 'true') ? 'true' : 'false';
        } else {
            // numérico
            const num = parseFloat(nuevoValor);
            valorFormateado = isNaN(num) ? String(v.value) : String(num);
        }
        // Reemplaza solo la parte "= ... ;" de esa línea específica, preservando
        // el tipo, el nombre y la indentación original.
        const regex = new RegExp('^(\\s*' + v.varType + '\\s+' + v.name + '\\s*=\\s*).*?(;.*)$');
        lineas[idx] = lineas[idx].replace(regex, (_, antes, despues) => antes + valorFormateado + despues);
    }
    return lineas.join('\n');
}

// Dibuja el panel de inputs encima del editor, uno por cada variable editable.
// IMPORTANTE: solo reconstruye el HTML si las variables cambiaron (cantidad/nombres/tipos).
// Si ya existen los mismos inputs, NO se vuelve a tocar el DOM al escribir,
// para no perder el foco ni la posición del cursor en cada tecla.
function ifRenderInputsVariables(variables, codigoBase) {
    const host = document.getElementById('if-vars-editable');
    if (!host) return;

    if (!variables.length) {
        host.innerHTML = '';
        host.style.display = 'none';
        host.dataset.ifVarsSignature = '';
        return;
    }
    host.style.display = 'flex';

    // "Firma" de las variables actuales: si no cambió, no reconstruimos el HTML.
    const signature = variables.map(v => v.name + ':' + v.varType).join('|');
    if (host.dataset.ifVarsSignature === signature) {
        return; // los inputs ya existen y son los correctos; no tocar el DOM
    }
    host.dataset.ifVarsSignature = signature;

    host.innerHTML = variables.map(v => {
        const tipoInput = (v.varType === 'int' || v.varType === 'double' || v.varType === 'float' || v.varType === 'long') ? 'number' : 'text';
        let inputHtml;
        if (v.varType === 'bool') {
            inputHtml =
                '<select class="if-var-input" data-var="' + v.name + '">' +
                    '<option value="true"' + (v.value === true ? ' selected' : '') + '>true</option>' +
                    '<option value="false"' + (v.value === false ? ' selected' : '') + '>false</option>' +
                '</select>';
        } else {
            inputHtml =
                '<input class="if-var-input" type="' + tipoInput + '" data-var="' + v.name + '" value="' + ifEscape(String(v.value)) + '"' +
                (tipoInput === 'number' && v.varType !== 'int' && v.varType !== 'long' ? ' step="0.01"' : '') + '>';
        }
        return (
            '<div class="if-var-field">' +
                '<label>' + ifEscape(v.varType) + ' ' + ifEscape(v.name) + '</label>' +
                inputHtml +
            '</div>'
        );
    }).join('');

    // Conectar eventos UNA SOLA VEZ (porque el bloque de arriba solo corre
    // cuando los inputs se crean por primera vez o cambian de tipo/nombre).
    host.querySelectorAll('.if-var-input').forEach(input => {
        const evento = input.tagName === 'SELECT' ? 'change' : 'input';
        input.addEventListener(evento, () => {
            const valoresNuevos = {};
            host.querySelectorAll('.if-var-input').forEach(inp => {
                valoresNuevos[inp.dataset.var] = inp.tagName === 'SELECT' ? (inp.value === 'true') : inp.value;
            });
            const nuevoCodigo = ifReconstruirCodigo(codigoBase, variables, valoresNuevos);
            if (ifMonacoEditor) ifMonacoEditor.setValue(nuevoCodigo);
            ifEjecutarSinTocarInputs(nuevoCodigo, variables);
        });
    });
}

// Variante de ejecución que NO vuelve a dibujar el panel de inputs
// (evita el problema de perder el foco mientras el usuario escribe).
function ifEjecutarSinTocarInputs(codigo) {
    const first = ifSim.load(codigo);
    ifRender(first, ifSim.info());

    const btns = document.querySelectorAll('.editor-controls .ctrl-btn');
    if (btns[1]) btns[1].disabled = true;
    if (btns[3]) { ifPlaying = false; btns[3].textContent = 'Reproducir'; }
}

// Carga el código en el simulador, detecta variables editables, dibuja
// sus inputs, y muestra el primer paso. Se usa tanto al inicializar
// como cada vez que el usuario cambia un valor.
function ifCargarYEjecutar(codigo) {
    const first = ifSim.load(codigo);
    const variables = ifExtraerVariablesEditables(ifSim.lastAst);
    ifRenderInputsVariables(variables, codigo);
    ifRender(first, ifSim.info());

    const btns = document.querySelectorAll('.editor-controls .ctrl-btn');
    if (btns[1]) btns[1].disabled = true;
    if (btns[3]) { ifPlaying = false; btns[3].textContent = 'Reproducir'; }
}

// ── CSS para resaltado de líneas (Monaco decorations) + panel de variables ─

(function injectIfStyles() {
    if (document.getElementById('if-simulator-styles')) return;
    const style = document.createElement('style');
    style.id = 'if-simulator-styles';
    style.textContent = `
        .lineHighlight { background: rgba(255,255,255,0.08); }
        .lineTrue      { background: rgba(4,170,109,0.20);  }
        .lineFalse     { background: rgba(220,53,69,0.20);  }
        .if-note       { margin-top:6px; font-size:0.88em; color:#c5cae9; word-break:break-word; }
        .if-note.t     { color:#04AA6D; font-weight:600; }
        .if-note.f     { color:#e05263; font-weight:600; }
        .if-note.err   { color:#ff8a65; font-weight:600; }
        .if-line-ref   { font-size:0.82em; color:#8a9ab5; }
        .if-speed-row  { display:flex; align-items:center; gap:8px; margin-top:8px; width:100%; }
        .if-speed-row label { font-size:0.78em; color:#8a9ab5; white-space:nowrap; }
        .if-speed-row input[type=range] { flex:1; accent-color:#04AA6D; cursor:pointer; height:4px; }
        .if-speed-val  { font-size:0.78em; color:#04AA6D; min-width:30px; text-align:right; }

        #if-vars-editable {
            display: flex; flex-wrap: wrap; gap: 14px;
            padding: 10px 14px; margin-bottom: 8px;
            background: #1e2130; border: 1px solid #3a3d4a; border-radius: 8px;
        }
        .if-var-field { display: flex; flex-direction: column; gap: 4px; min-width: 120px; }
        .if-var-field label {
            font-size: 0.72em; color: #8a9ab5; font-family: monospace;
            text-transform: none; letter-spacing: 0.02em;
        }
        .if-var-input {
            background: #15161e; border: 1px solid #3a3d4a; color: #fff;
            padding: 6px 10px; border-radius: 6px; font-family: 'Consolas', monospace;
            font-size: 0.9em; outline: none; transition: border-color 0.15s;
        }
        .if-var-input:focus { border-color: #04AA6D; }
    `;
    document.head.appendChild(style);
})();

// ── Render ────────────────────────────────────────────────────

function ifRender(state, info) {
    if (!state) { ifClearPanels(); return; }
    ifHighlight(state.line, state.status);

    const panelPaso = document.getElementById('panel-paso');
    if (panelPaso) {
        const src = ifMonacoEditor
            ? ifEscape(ifMonacoEditor.getModel().getLineContent(state.line).trim())
            : '';
        const noteClass = state.status === 'true' ? ' t' : state.status === 'false' ? ' f' : state.status === 'err' ? ' err' : '';
        panelPaso.innerHTML =
            '<div class="if-line-ref">Línea ' + state.line + ': ' + src + '</div>' +
            (state.note ? '<div class="if-note' + noteClass + '">' + ifEscape(state.note) + '</div>' : '');
    }

    const panelVars = document.getElementById('panel-vars');
    if (panelVars) {
        const entries = Object.entries(state.variables || {});
        panelVars.innerHTML = entries.length
            ? entries.map(([k, v]) => '<div class="var">' + ifEscape(k) + ' = ' + ifEscape(ifFmt(v)) + '</div>').join('')
            : '<span style="color:#8a9ab5;font-size:0.85em;">Sin variables</span>';
    }

    const panelSalida = document.getElementById('panel-salida');
    if (panelSalida) {
        panelSalida.textContent = (state.output || []).join('\n');
    }

    if (info && info.total > 0) {
        const stepEl = document.querySelector('.ctrl-step');
        if (stepEl) stepEl.textContent = 'Paso ' + (info.index + 1) + ' / ' + info.total;
    }
}

function ifHighlight(line, status) {
    if (!ifMonacoEditor) return;
    const cls = status === 'true' ? 'lineTrue' : status === 'false' ? 'lineFalse' : 'lineHighlight';
    ifDecorations = ifMonacoEditor.deltaDecorations(ifDecorations, [{
        range: new monaco.Range(line, 1, line, 1),
        options: { isWholeLine: true, className: cls }
    }]);
    ifMonacoEditor.revealLineInCenter(line);
}

function ifClearPanels() {
    if (ifMonacoEditor) ifDecorations = ifMonacoEditor.deltaDecorations(ifDecorations, []);
    const panelPaso  = document.getElementById('panel-paso');
    const panelVars  = document.getElementById('panel-vars');
    const panelSalida = document.getElementById('panel-salida');
    const stepEl     = document.querySelector('.ctrl-step');
    if (panelPaso)   panelPaso.innerHTML   = '';
    if (panelVars)   panelVars.innerHTML   = '';
    if (panelSalida) panelSalida.textContent = '';
    if (stepEl)      stepEl.textContent    = 'Paso 0 / 0';
}

// ── Inicialización del editor ─────────────────────────────────

function initIfSimulator() {
    const editorBody = document.getElementById('editor-body');
    if (!editorBody) return;

    // Inserta el contenedor de inputs editables justo ANTES del editor
    if (!document.getElementById('if-vars-editable')) {
        const varsHost = document.createElement('div');
        varsHost.id = 'if-vars-editable';
        editorBody.parentNode.insertBefore(varsHost, editorBody);
    }

    function crearEditor() {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            ifMonacoEditor = monaco.editor.create(editorBody, {
                value: IF_EXAMPLE,
                language: 'csharp',
                theme: 'vs-dark',
                automaticLayout: true,
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                readOnly: true   // ← BLOQUEA toda edición directa de la estructura del código
            });
            conectarBotones();
            // Carga inicial: detecta variables y dibuja sus inputs
            ifCargarYEjecutar(IF_EXAMPLE);
        });
    }

    if (window.monaco) {
        crearEditor();
    } else {
        const loader = document.createElement('script');
        loader.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.js';
        loader.onload = crearEditor;
        document.head.appendChild(loader);
    }
}

// ── Auto-reproducción ─────────────────────────────────────────

function ifGetDelay() {
    const slider = document.getElementById('if-speed-slider');
    const val = slider ? parseInt(slider.value) : 40;
    return Math.round(2000 - (val / 100) * 1800);
}

function ifStopPlay(btns) {
    clearTimeout(ifPlayTimer);
    ifPlayTimer = null;
    ifPlaying   = false;
    if (btns && btns[3]) btns[3].textContent = 'Reproducir';
}

function ifAutoPlay(btns) {
    const info = ifSim.info();
    if (info.index >= info.total - 1) {
        ifStopPlay(btns);
        return;
    }
    const state = ifSim.next();
    ifRender(state, ifSim.info());
    if (btns[1]) btns[1].disabled = (ifSim.info().index <= 0);
    ifPlayTimer = setTimeout(() => ifAutoPlay(btns), ifGetDelay());
}

// ── Conexión de botones ───────────────────────────────────────

function conectarBotones() {
    const btns = document.querySelectorAll('.editor-controls .ctrl-btn');

    // Reiniciar: vuelve al código de ejemplo original
    if (btns[0]) btns[0].onclick = () => {
        ifStopPlay(btns);
        if (ifMonacoEditor) ifMonacoEditor.setValue(IF_EXAMPLE);
        ifCargarYEjecutar(IF_EXAMPLE);
    };

    if (btns[1]) {
        btns[1].disabled = true;
        btns[1].onclick = () => {
            ifStopPlay(btns);
            const state = ifSim.prev();
            ifRender(state, ifSim.info());
            btns[1].disabled = (ifSim.info().index <= 0);
        };
    }

    if (btns[2]) btns[2].onclick = () => {
        ifStopPlay(btns);
        const state = ifSim.next();
        ifRender(state, ifSim.info());
        if (btns[1]) btns[1].disabled = false;
    };

    if (btns[3]) btns[3].onclick = () => {
        if (ifPlaying) {
            ifStopPlay(btns);
            return;
        }
        if (ifSim.info().total === 0) {
            const first = ifSim.load(ifMonacoEditor.getValue());
            if (!first || first.status === 'err') {
                ifRender(first, ifSim.info());
                return;
            }
            ifRender(first, ifSim.info());
            if (btns[1]) btns[1].disabled = true;
        }
        ifPlaying = true;
        btns[3].textContent = 'Pausar';
        ifPlayTimer = setTimeout(() => ifAutoPlay(btns), ifGetDelay());
    };

    const controls = document.querySelector('.editor-controls');
    if (controls && !document.getElementById('if-speed-slider')) {
        const speedRow = document.createElement('div');
        speedRow.className = 'if-speed-row';
        speedRow.innerHTML =
            '<label>Velocidad</label>' +
            '<input type="range" id="if-speed-slider" min="1" max="100" value="40">' +
            '<span class="if-speed-val" id="if-speed-val">1×</span>';
        controls.appendChild(speedRow);

        const slider = document.getElementById('if-speed-slider');
        const valLbl = document.getElementById('if-speed-val');
        slider.addEventListener('input', () => {
            const mult = (parseFloat(slider.value) / 40).toFixed(1);
            valLbl.textContent = mult + '×';
        });
    }
}

// ── Hook a cargarTema ─────────────────────────────────────────

(function () {
    const _cargarTema = window.cargarTema;
    window.cargarTema = function (nombreTema) {
        ifStopPlay(null);
        if (ifMonacoEditor) {
            ifMonacoEditor.dispose();
            ifMonacoEditor = null;
            ifDecorations  = [];
        }
        ifSim.clear();

        _cargarTema(nombreTema);

        if (nombreTema === 'if') {
            setTimeout(initIfSimulator, 0);
        }
    };
})();