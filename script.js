// ============================================================
// Índice de Goldman — Versión Cliente (Demo GitHub Pages)
// Autor: Axel Adonai
// ============================================================

// ----- Criterios clínicos del índice -----
const GRUPOS = [
  {
    clave: 'historia', titulo: 'Historia', cont: 'g-historia', items: [
      { id: 'im6m', texto: 'Infarto de miocardio en los 6 meses previos', puntos: 10 },
    ]
  },
  {
    clave: 'exploracion', titulo: 'Exploración', cont: 'g-exploracion', items: [
      { id: 's3pvy', texto: 'Tercer tono ó presión venosa yugular elevada', puntos: 11 },
      { id: 'estao', texto: 'Estenosis aórtica significativa', puntos: 3 },
    ]
  },
  {
    clave: 'ecg', titulo: 'Electrocardiograma', cont: 'g-ecg', items: [
      { id: 'ritmo', texto: 'Ritmo no sinusal ó extrasistolia supraventricular en el último ECG', puntos: 7 },
      { id: 'ev5', texto: 'Más de 5 extrasístoles ventriculares/min en cualquier ECG preoperatorio', puntos: 7 },
    ]
  },
  {
    clave: 'estado', titulo: 'Estado general', cont: 'g-estado', estadoGeneral: true, items: [
      { id: 'gases', texto: 'PO₂ < 60 ó PCO₂ > 55 mmHg', puntos: 3 },
      { id: 'iones', texto: 'K < 3 ó HCO₃ < 20 mEq/L', puntos: 3 },
      { id: 'renal', texto: 'BUN > 50 ó Cr > 3 mg/dl', puntos: 3 },
      { id: 'hepat', texto: 'GOT sérica anormal ó signos de hepatopatía crónica', puntos: 3 },
      { id: 'encam', texto: 'Hospitalizado por causa no cardiaca', puntos: 3 },
    ]
  },
  {
    clave: 'cirugia', titulo: 'Intervención quirúrgica', cont: 'g-cirugia', items: [
      { id: 'ciralto', texto: 'Intraperitoneal, intratorácica ó aórtica', puntos: 3 },
      { id: 'cirurg', texto: 'Urgente', puntos: 4 },
    ]
  },
];
const TODOS = GRUPOS.flatMap(g => g.items);

// ----- Clasificación de riesgo -----
const CLASES = [
  { max: 5, n: 'I', t: 'Clase I (Riesgo Bajo)', m: 'Mortalidad estimada: 0,20%', c: 'c1' },
  { max: 12, n: 'II', t: 'Clase II (Riesgo Intermedio)', m: 'Mortalidad estimada: 1,50%', c: 'c2' },
  { max: 25, n: 'III', t: 'Clase III (Alto Riesgo)', m: 'Mortalidad estimada: 2,30%', c: 'c3' },
  { max: Infinity, n: 'IV', t: 'Clase IV (Riesgo Muy Alto)', m: 'Mortalidad estimada: 56%', c: 'c4' },
];

function clasificar(score) {
  return CLASES.find(c => score <= c.max);
}

const LIMITE_ARCHIVO_MB = 8;

// ----- Estado de sesión -----
let ecgArchivo = null;
let ultimoIdGuardado = null;

// ----- Inicio -----
document.addEventListener('DOMContentLoaded', inicializar);

function inicializar() {
  generarBotonesToggle();
  establecerFechaHoy();

  document.querySelectorAll('.toggle').forEach(btn => btn.addEventListener('click', alternarToggle));
  document.getElementById('edad').addEventListener('input', calcular);
  document.getElementById('ecg-archivo').addEventListener('change', manejarArchivoECG);
  document.getElementById('btnGuardar').addEventListener('click', guardar);
  document.getElementById('btnPDF').addEventListener('click', descargarPDF);
  document.getElementById('btnLimpiar').addEventListener('click', limpiar);
}

// ----- Genera los botones SI/NO por grupo -----
function generarBotonesToggle() {
  GRUPOS.forEach(g => {
    const cont = document.getElementById(g.cont);
    if (!cont) return;
    g.items.forEach(it => {
      const fila = document.createElement('div');
      fila.className = 'fila';
      fila.innerHTML = `
        <label>${it.texto} <span class="pts">(${it.puntos} pts)</span></label>
        <button type="button" class="toggle" id="${it.id}" data-val="0">NO</button>
      `;
      cont.appendChild(fila);
    });
  });
}

// ----- Alterna el valor de un criterio -----
function alternarToggle() {
  const marcar = this.dataset.val === '0';
  this.dataset.val = marcar ? '1' : '0';
  this.textContent = marcar ? 'SI' : 'NO';
  this.classList.toggle('si', marcar);
  calcular();
}

function fechaHoyISO() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const d = String(hoy.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function establecerFechaHoy() {
  const el = document.getElementById('fecha');
  if (el) el.value = fechaHoyISO();
}

// ----- Cálculo del score Goldman -----
function calcular() {
  const edadInput = document.getElementById('edad');
  const edad = parseInt(edadInput ? edadInput.value : '');
  let total = (edad > 70) ? 5 : 0;

  GRUPOS.forEach(g => {
    if (g.estadoGeneral) {
      if (g.items.some(it => {
        const el = document.getElementById(it.id);
        return el && el.dataset.val === '1';
      })) total += 3;
    } else {
      g.items.forEach(it => {
        const el = document.getElementById(it.id);
        if (el && el.dataset.val === '1') total += it.puntos;
      });
    }
  });

  const hayDatos = !isNaN(edad) || TODOS.some(it => {
    const el = document.getElementById(it.id);
    return el && el.dataset.val === '1';
  });

  const elScore = document.getElementById('score');
  if (elScore) elScore.textContent = hayDatos ? total : '…';

  const elClase = document.getElementById('clase');
  const elMortalidad = document.getElementById('mortalidad');
  if (hayDatos) {
    const c = clasificar(total);
    if (elClase) {
      elClase.textContent = c.t;
      elClase.className = 'clase ' + c.c;
    }
    if (elMortalidad) elMortalidad.textContent = c.m;
  } else {
    if (elClase) elClase.textContent = '';
    if (elMortalidad) elMortalidad.textContent = '';
  }
  return total;
}

// ----- Recopila datos del formulario -----
function datosActuales() {
  const edad = parseInt(document.getElementById('edad').value);
  const respuestas = {};
  TODOS.forEach(it => {
    const el = document.getElementById(it.id);
    respuestas[it.id] = el ? (el.dataset.val === '1') : false;
  });

  const score = calcular();
  const c = clasificar(score);

  return {
    id: ultimoIdGuardado,
    nombre: document.getElementById('nombre').value.trim(),
    expediente: document.getElementById('expediente').value.trim(),
    pab: document.getElementById('pab').value.trim(),
    cama: document.getElementById('cama').value.trim(),
    sexo: document.getElementById('sexo').value,
    diagnostico: document.getElementById('diagnostico').value.trim(),
    fecha: document.getElementById('fecha').value,
    medico: document.getElementById('medico').value.trim(),
    edad: isNaN(edad) ? null : edad,
    presion_arterial: document.getElementById('presion_arterial').value.trim(),
    ecg_dx: document.getElementById('ecg-dx').value.trim(),
    ecg_archivo: ecgArchivo,
    respuestas,
    score,
    clase: c ? c.t : '',
  };
}

// ============================================================
// Manejo del archivo ECG (imagen o PDF)
// ============================================================
async function manejarArchivoECG(e) {
  const archivo = e.target.files[0];
  const prev = document.getElementById('ecg-preview');

  if (!archivo) {
    ecgArchivo = null;
    prev.innerHTML = '';
    return;
  }

  if (archivo.size > LIMITE_ARCHIVO_MB * 1024 * 1024) {
    prev.innerHTML = `<span class="preview-error">El archivo supera ${LIMITE_ARCHIVO_MB} MB.</span>`;
    e.target.value = '';
    ecgArchivo = null;
    return;
  }

  prev.innerHTML = '<span class="preview-cargando">Procesando archivo…</span>';

  try {
    const esPDF = archivo.type === 'application/pdf';

    if (esPDF) {
      await validarPDF(archivo);
      const datos = await convertirPdfAImagen(archivo);
      const nombre = archivo.name.replace(/\.pdf$/i, '') + '.png';
      ecgArchivo = { nombre, tipo: 'image/png', datos };
      prev.innerHTML = `<img src="${datos}" alt="ECG" class="preview-ecg-img">
                        <br><span class="preview-ecg-msg">✓ PDF convertido a imagen</span>`;
    } else {
      const datos = await leerComoDataURL(archivo);
      ecgArchivo = { nombre: archivo.name, tipo: archivo.type, datos };
      prev.innerHTML = `<img src="${datos}" alt="ECG" class="preview-ecg-img">`;
    }
  } catch (err) {
    console.error('Error al procesar el archivo ECG:', err);
    let mensaje = 'No se pudo procesar el archivo. ';
    if (err.message.includes('PDF') || err.message.includes('pdf')) {
      mensaje += 'El PDF no es válido o está dañado. Intente convertirlo a imagen (JPG/PNG).';
    } else {
      mensaje += 'Intente con otra imagen o PDF.';
    }
    prev.innerHTML = `<span class="preview-error">${mensaje}</span>`;
    ecgArchivo = null;
    e.target.value = '';
  }
}

async function validarPDF(archivo) {
  try {
    const buffer = await archivo.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    if (pdf.numPages === 0) throw new Error('El PDF no contiene páginas.');
    await pdf.getPage(1);
  } catch (err) {
    throw new Error('PDF inválido: ' + (err.message || ''));
  }
}

function leerComoDataURL(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = ev => resolve(ev.target.result);
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'));
    lector.readAsDataURL(archivo);
  });
}

async function convertirPdfAImagen(archivo) {
  const buffer = await archivo.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pagina = await pdf.getPage(1);

  const ANCHO_OBJETIVO = 2338;
  const viewportBase = pagina.getViewport({ scale: 1 });
  const escala = Math.max(2.0, ANCHO_OBJETIVO / viewportBase.width);
  const viewport = pagina.getViewport({ scale: escala });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await pagina.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/png');
}

// ============================================================
// Guardar registro en localStorage (Client-Side Demo)
// ============================================================
async function guardar() {
  const d = datosActuales();
  const estado = document.getElementById('estado-guardado');

  if (!d.nombre || !d.expediente || d.edad === null) {
    estado.textContent = ' Complete nombre, expediente y edad antes de guardar.';
    estado.className = 'error';
    return Promise.reject('Faltan datos');
  }

  estado.textContent = ' Guardando...';
  estado.className = 'cargando';

  d.id = d.id || Date.now();
  let registros = JSON.parse(localStorage.getItem('tb_goldman') || '[]');
  const idx = registros.findIndex(r => r.id === d.id);
  if (idx !== -1) {
    registros[idx] = d;
  } else {
    registros.push(d);
  }
  localStorage.setItem('tb_goldman', JSON.stringify(registros));

  ultimoIdGuardado = d.id;
  estado.textContent = '✅ Registro guardado exitosamente (ID: ' + d.id + ')';
  estado.className = 'ok';
  return d;
}

// ============================================================
// Generar e imprimir reporte dinámico en el navegador
// ============================================================
async function descargarPDF() {
  if (!ultimoIdGuardado) {
    try {
      await guardar();
    } catch (e) {
      return;
    }
  }

  const d = datosActuales();
  const contenedor = document.getElementById('reporte-impresion');

  if (!contenedor) {
    alert("Falta el contenedor #reporte-impresion en index.html");
    return;
  }

  let ecgHtml = '';
  if (d.ecg_archivo && d.ecg_archivo.datos) {
    ecgHtml = `
      <div class="ecg-bloque">
        <p class="ecg-titulo">ECG adjunto — ${d.nombre} | Exp. ${d.expediente} | ${d.fecha}</p>
        <div class="ecg-image-container">
          <img src="${d.ecg_archivo.datos}" class="rep-ecg" alt="ECG">
        </div>
      </div>`;
  }

  contenedor.innerHTML = `
    <div class="rep-encabezado">
      <img src="logo-hgm.png" alt="Logo HGM" class="rep-logo">
      <div class="rep-titulo">
        <h1>Hospital General de México "Dr. Eduardo Liceaga"</h1>
        <h2>Valoración perioperatoria de riesgo cardiovascular</h2>
        <h3>Índice de Goldman de riesgo cardiaco</h3>
      </div>
    </div>
    <div class="contenido">
      <table class="rep">
        <tr><th>Nombre del paciente</th><td colspan="3">${d.nombre}</td></tr>
        <tr><th>Expediente</th><td>${d.expediente}</td><th>PAB</th><td>${d.pab || '—'}</td></tr>
        <tr><th>Cama</th><td>${d.cama || '—'}</td><th>Sexo</th><td>${d.sexo || '—'}</td></tr>
        <tr><th>Edad</th><td>${d.edad} años</td><th>Fecha</th><td>${d.fecha}</td></tr>
        <tr><th>Médico</th><td colspan="3">${d.medico || '—'}</td></tr>
        <tr><th>Diagnóstico</th><td colspan="3">${d.diagnostico || '—'}</td></tr>
        <tr><th>Presión arterial</th><td colspan="3">${d.presion_arterial || '—'}</td></tr>
      </table>
      <div class="resultado-bloque">
        <span class="score-num">Score: ${d.score}</span>
        <div><strong class="clase-txt">${d.clase}</strong></div>
      </div>
      <table class="rep">
        <tr><th>Diagnóstico del ECG</th><td>${d.ecg_dx || '—'}</td></tr>
      </table>
      ${ecgHtml}
    </div>
  `;

  window.print();
}

// ----- Limpia todos los campos del formulario -----
function limpiar() {
  ['nombre', 'expediente', 'pab', 'cama', 'medico', 'edad', 'presion_arterial'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const elSexo = document.getElementById('sexo');
  if (elSexo) elSexo.value = '';

  const elDiag = document.getElementById('diagnostico');
  if (elDiag) elDiag.value = '';

  TODOS.forEach(it => {
    const btn = document.getElementById(it.id);
    if (btn) {
      btn.dataset.val = '0';
      btn.textContent = 'NO';
      btn.classList.remove('si');
    }
  });

  establecerFechaHoy();
  const elEcgDx = document.getElementById('ecg-dx');
  if (elEcgDx) elEcgDx.value = '';

  const elEcgArch = document.getElementById('ecg-archivo');
  if (elEcgArch) elEcgArch.value = '';

  const elEcgPrev = document.getElementById('ecg-preview');
  if (elEcgPrev) elEcgPrev.innerHTML = '';

  ecgArchivo = null;
  ultimoIdGuardado = null;

  const elEstado = document.getElementById('estado-guardado');
  if (elEstado) {
    elEstado.textContent = '';
    elEstado.className = '';
  }

  calcular();
}