// ============================================================
// Índice de Goldman
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
let ultimoPdfRuta = null;

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
  const edad = parseInt(document.getElementById('edad').value);
  let total = (edad > 70) ? 5 : 0;

  GRUPOS.forEach(g => {
    if (g.estadoGeneral) {
      if (g.items.some(it => document.getElementById(it.id).dataset.val === '1')) total += 3;
    } else {
      g.items.forEach(it => {
        if (document.getElementById(it.id).dataset.val === '1') total += it.puntos;
      });
    }
  });

  const hayDatos = !isNaN(edad) || TODOS.some(it => document.getElementById(it.id).dataset.val === '1');
  document.getElementById('score').textContent = hayDatos ? total : '…';

  const elClase = document.getElementById('clase');
  const elMortalidad = document.getElementById('mortalidad');
  if (hayDatos) {
    const c = clasificar(total);
    elClase.textContent = c.t;
    elClase.className = 'clase ' + c.c;
    elMortalidad.textContent = c.m;
  } else {
    elClase.textContent = '';
    elMortalidad.textContent = '';
  }
  return total;
}

// ----- Recopila datos del formulario -----
function datosActuales() {
  const edad = parseInt(document.getElementById('edad').value);
  const respuestas = {};
  TODOS.forEach(it => { respuestas[it.id] = document.getElementById(it.id).dataset.val === '1'; });

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

// ----- Valida que el PDF sea legible -----
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

// ----- Convierte la primera página del PDF a imagen PNG -----
async function convertirPdfAImagen(archivo) {
  const buffer = await archivo.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pagina = await pdf.getPage(1);

  // Escala dinámica: ancho objetivo A4 landscape a 200 dpi
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
// Guardar registro en la base de datos
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

  try {
    const resp = await fetch('guardar.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d)
    });
    const data = await resp.json();

    if (!data.ok) {
      estado.textContent = ' Error: ' + (data.error || 'desconocido');
      estado.className = 'error';
      return Promise.reject(data.error);
    }

    ultimoIdGuardado = data.id;
    ultimoPdfRuta = data.pdf_ruta;
    estado.textContent = data.actualizado
      ? '✅ Registro actualizado (ID: ' + data.id + ')'
      : '✅ Registro guardado exitosamente (ID: ' + data.id + ')';
    estado.className = 'ok';
    return data;
  } catch (e) {
    estado.textContent = ' No se pudo conectar con el servidor.';
    estado.className = 'error';
    return Promise.reject(e);
  }
}

// ----- Abre el reporte imprimible en nueva pestaña -----
async function descargarPDF() {
  if (!ultimoIdGuardado) {
    try {
      await guardar();
    } catch (e) {
      return;
    }
  }

  if (!ultimoPdfRuta) {
    alert('No se pudo generar el formato. Intente guardar de nuevo.');
    return;
  }

  const ventana = window.open(ultimoPdfRuta, '_blank');
  if (!ventana) {
    alert('Por favor, permita las ventanas emergentes para poder imprimir el formato.');
  }
}

// ----- Limpia todos los campos del formulario -----
function limpiar() {
  ['nombre', 'expediente', 'pab', 'cama', 'medico', 'edad', 'presion_arterial'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('sexo').value = '';
  document.getElementById('diagnostico').value = '';

  TODOS.forEach(it => {
    const btn = document.getElementById(it.id);
    btn.dataset.val = '0';
    btn.textContent = 'NO';
    btn.classList.remove('si');
  });

  establecerFechaHoy();
  document.getElementById('ecg-dx').value = '';
  document.getElementById('ecg-archivo').value = '';
  document.getElementById('ecg-preview').innerHTML = '';
  ecgArchivo = null;
  ultimoIdGuardado = null;
  ultimoPdfRuta = null;
  document.getElementById('estado-guardado').textContent = '';
  document.getElementById('estado-guardado').className = '';
  calcular();
}
