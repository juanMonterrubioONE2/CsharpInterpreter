function insertarConsolas() {
    document.getElementById('workspace-container').innerHTML = `
        <div class="workspace">

            <!-- Editor grande izquierda -->
            <div class="console-panel editor-panel">
                <div class="console-header">
                    <span class="console-title">Editor</span>
                </div>
                <div class="editor-body" id="editor-body"></div>
                <div class="editor-controls">
                    <button class="ctrl-btn">Reiniciar</button>
                    <button class="ctrl-btn" disabled>Anterior</button>
                    <button class="ctrl-btn">Siguiente</button>
                    <button class="ctrl-btn primary">Reproducir</button>
                    <div class="ctrl-progress">
                        <span class="ctrl-step">Paso 0 / 0</span>
                        <div class="pbar"><i></i></div>
                    </div>
                </div>
            </div>

            <!-- Paneles laterales derecha -->
            <div class="side-panels">

                <!-- Panel 1: Paso actual -->
                <div class="console-panel2">
                    <div class="console-header2">
                        <span class="console-title2">Paso actual</span>
                    </div>
                    <div class="console-body2" id="panel-paso"></div>
                </div>

                <!-- Panel 2: Variables -->
                <div class="console-panel">
                    <div class="console-header">
                        <span class="console-title">Variables</span>
                    </div>
                    <div class="console-body" id="panel-vars"></div>
                </div>

                <!-- Panel 3: Salida -->
                <div class="console-panel">
                    <div class="console-header">
                        <span class="console-title">Salida</span>
                    </div>
                    <div class="console-body" id="panel-salida"></div>
                </div>

            </div>

        </div>
    `;
}