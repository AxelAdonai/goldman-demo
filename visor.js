// ============================================================
// Visor de registros — Modal ECG con zoom y navegación táctil
// Autor: Axel Adonai
// ============================================================

const ZOOM_PASO = 0.25;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 5;

let zoomActual = 1;
let arrastrando = false;
let inicioX = 0, inicioY = 0;
let despX = 0, despY = 0;
let ultimaDistanciaTactil = null;

document.addEventListener('DOMContentLoaded', inicializarVisor);

// ----- Configura eventos del modal -----
function inicializarVisor() {
    const contenedorImg = document.getElementById('modal-img-wrap');
    const img = document.getElementById('modal-img');

    // Zoom con rueda del ratón
    contenedorImg.addEventListener('wheel', function (e) {
        e.preventDefault();
        e.deltaY < 0 ? acercar() : alejar();
    }, { passive: false });

    // Arrastrar imagen cuando está ampliada
    img.addEventListener('mousedown', function (e) {
        if (zoomActual <= 1) return;
        arrastrando = true;
        inicioX = e.clientX - despX;
        inicioY = e.clientY - despY;
        img.classList.add('dragging');
        e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
        if (!arrastrando) return;
        despX = e.clientX - inicioX;
        despY = e.clientY - inicioY;
        aplicarTransformacion();
    });

    document.addEventListener('mouseup', function () {
        arrastrando = false;
        img.classList.remove('dragging');
    });

    // Zoom con pellizco táctil (pinch)
    contenedorImg.addEventListener('touchmove', function (e) {
        if (e.touches.length !== 2) return;
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        if (ultimaDistanciaTactil !== null) {
            const delta = distancia - ultimaDistanciaTactil;
            if (Math.abs(delta) > 2) {
                zoomActual = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +(zoomActual + delta * 0.01).toFixed(2)));
                aplicarTransformacion();
            }
        }
        ultimaDistanciaTactil = distancia;
    }, { passive: false });

    contenedorImg.addEventListener('touchend', function () {
        ultimaDistanciaTactil = null;
    });

    // Teclado: Escape cierra, +/- hacen zoom
    document.addEventListener('keydown', function (e) {
        if (document.getElementById('modal-ecg').style.display !== 'flex') return;
        if (e.key === 'Escape') { cerrarModal(e); return; }
        if (e.key === '+' || e.key === '=') acercar();
        if (e.key === '-') alejar();
        if (e.key === '0') restablecerZoom();
    });
}

// ----- Aplica escala y desplazamiento a la imagen -----
function aplicarTransformacion() {
    const img = document.getElementById('modal-img');
    img.style.transform = `scale(${zoomActual}) translate(${despX / zoomActual}px, ${despY / zoomActual}px)`;
    document.getElementById('zoom-label').textContent = Math.round(zoomActual * 100) + '%';
}

function acercar() {
    zoomActual = Math.min(ZOOM_MAX, +(zoomActual + ZOOM_PASO).toFixed(2));
    aplicarTransformacion();
}

function alejar() {
    zoomActual = Math.max(ZOOM_MIN, +(zoomActual - ZOOM_PASO).toFixed(2));
    aplicarTransformacion();
}

function restablecerZoom() {
    zoomActual = 1;
    despX = 0;
    despY = 0;
    aplicarTransformacion();
}

// ----- Abre el modal con la imagen del ECG -----
function abrirModal(ruta) {
    restablecerZoom();
    document.getElementById('modal-img').src = ruta;
    document.getElementById('modal-ecg').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ----- Cierra el modal -----
function cerrarModal(event) {
    if (event && event.target !== event.currentTarget && !event.target.classList.contains('modal-close')) return;
    document.getElementById('modal-ecg').style.display = 'none';
    document.body.style.overflow = '';
}

// ----- Abre el reporte HTML en nueva ventana e imprime -----
function imprimirPDF(url) {
    const ventana = window.open(url, '_blank');
    if (!ventana) return;
    ventana.onload = function () {
        ventana.focus();
        ventana.print();
    };
}
