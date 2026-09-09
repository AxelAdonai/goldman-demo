// ============================================================
// Índice de Goldman — Versión Cliente con Historial y Escala
// Autor: Axel Adonai
// ============================================================

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
      { id: 'ev5', texto: 'Más de 5 extrasístoles ventriculares/min en cualquier ECG preop.', puntos: 7 },
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
let ecgArchivo = null;
let ultimoIdGuardado = null;

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

  // Eventos para el Modal de Historial
  document.getElementById('btnVerRegistros').addEventListener('click', mostrarHistorial);
  document.getElementById('cerrarModal').addEventListener('click', () => {
    document.getElementById('modalRegistros').style.display = 'none';
  });
}

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
    prev.innerHTML = `<span class="preview-error">Error al cargar el archivo ECG.</span>`;
    ecgArchivo = null;
    e.target.value = '';
  }
}

async function validarPDF(archivo) {
  const buffer = await archivo.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  if (pdf.numPages === 0) throw new Error('PDF sin páginas.');
  await pdf.getPage(1);
}

function leerComoDataURL(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = ev => resolve(ev.target.result);
    lector.onerror = () => reject(new Error('Error de lectura'));
    lector.readAsDataURL(archivo);
  });
}

async function convertirPdfAImagen(archivo) {
  const buffer = await archivo.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pagina = await pdf.getPage(1);
  const viewport = pagina.getViewport({ scale: 2.0 });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await pagina.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/png');
}

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

// ----- Generación de Formato Oficial e Impresión -----
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
  if (!contenedor) return;

  const edadPts = (d.edad > 70) ? 5 : 0;
  const im6mPts = d.respuestas.im6m ? 10 : 0;
  const s3pvyPts = d.respuestas.s3pvy ? 11 : 0;
  const estaoPts = d.respuestas.estao ? 3 : 0;
  const ritmoPts = d.respuestas.ritmo ? 7 : 0;
  const ev5Pts = d.respuestas.ev5 ? 7 : 0;
  const ciraltoPts = d.respuestas.ciralto ? 3 : 0;
  const cirurgPts = d.respuestas.cirurg ? 4 : 0;

  const estadoAlterado = d.respuestas.gases || d.respuestas.iones || d.respuestas.renal || d.respuestas.hepat || d.respuestas.encam;
  const estadoPts = estadoAlterado ? 3 : 0;

  let filas = '<tr class="rep-grupo"><td colspan="3">HISTORIA</td></tr>';
  filas += `<tr><td>Infarto de miocardio en los 6 meses previos</td><td style="text-align:center">${d.respuestas.im6m ? 'SI' : 'NO'}</td><td style="text-align:center">${im6mPts}</td></tr>`;
  filas += `<tr><td>Edad &gt; 70 años</td><td style="text-align:center">${d.edad > 70 ? 'SI' : 'NO'}</td><td style="text-align:center">${edadPts}</td></tr>`;

  filas += '<tr class="rep-grupo"><td colspan="3">EXPLORACIÓN</td></tr>';
  filas += `<tr><td>Tercer tono ó presión venosa yugular elevada</td><td style="text-align:center">${d.respuestas.s3pvy ? 'SI' : 'NO'}</td><td style="text-align:center">${s3pvyPts}</td></tr>`;
  filas += `<tr><td>Estenosis aórtica significativa</td><td style="text-align:center">${d.respuestas.estao ? 'SI' : 'NO'}</td><td style="text-align:center">${estaoPts}</td></tr>`;

  filas += '<tr class="rep-grupo"><td colspan="3">ELECTROCARDIOGRAMA</td></tr>';
  filas += `<tr><td>Ritmo no sinusal ó extrasistolia supraventricular en el último ECG</td><td style="text-align:center">${d.respuestas.ritmo ? 'SI' : 'NO'}</td><td style="text-align:center">${ritmoPts}</td></tr>`;
  filas += `<tr><td>Más de 5 extrasístoles ventriculares/min en cualquier ECG preop.</td><td style="text-align:center">${d.respuestas.ev5 ? 'SI' : 'NO'}</td><td style="text-align:center">${ev5Pts}</td></tr>`;

  filas += '<tr class="rep-grupo"><td colspan="3">ESTADO GENERAL</td></tr>';
  filas += `<tr><td style="padding-left:18px">PO₂ &lt; 60 ó PCO₂ &gt; 55 mmHg</td><td style="text-align:center">${d.respuestas.gases ? 'SI' : 'NO'}</td><td style="text-align:center">—</td></tr>`;
  filas += `<tr><td style="padding-left:18px">K &lt; 3 ó HCO₃ &lt; 20 mEq/L</td><td style="text-align:center">${d.respuestas.iones ? 'SI' : 'NO'}</td><td style="text-align:center">—</td></tr>`;
  filas += `<tr><td style="padding-left:18px">BUN &gt; 50 ó Cr &gt; 3 mg/dl</td><td style="text-align:center">${d.respuestas.renal ? 'SI' : 'NO'}</td><td style="text-align:center">—</td></tr>`;
  filas += `<tr><td style="padding-left:18px">GOT sérica anormal ó signos de hepatopatía crónica</td><td style="text-align:center">${d.respuestas.hepat ? 'SI' : 'NO'}</td><td style="text-align:center">—</td></tr>`;
  filas += `<tr><td style="padding-left:18px">Hospitalizado por causa no cardiaca</td><td style="text-align:center">${d.respuestas.encam ? 'SI' : 'NO'}</td><td style="text-align:center">—</td></tr>`;
  filas += `<tr><td style="font-style:italic">Estado general alterado (cualquiera de los anteriores)</td><td style="text-align:center">${estadoAlterado ? 'SI' : 'NO'}</td><td style="text-align:center">${estadoPts}</td></tr>`;

  filas += '<tr class="rep-grupo"><td colspan="3">INTERVENCIÓN QUIRÚRGICA</td></tr>';
  filas += `<tr><td>Intraperitoneal, intratorácica ó aórtica</td><td style="text-align:center">${d.respuestas.ciralto ? 'SI' : 'NO'}</td><td style="text-align:center">${ciraltoPts}</td></tr>`;
  filas += `<tr><td>Urgente</td><td style="text-align:center">${d.respuestas.cirurg ? 'SI' : 'NO'}</td><td style="text-align:center">${cirurgPts}</td></tr>`;

  let ecgHtml = '';
  if (d.ecg_archivo && d.ecg_archivo.datos) {
    ecgHtml = `
      <div class="ecg-bloque">
        <p class="ecg-titulo">ECG adjunto ${d.nombre} Exp. ${d.expediente} | ${d.fecha}</p>
        <div class="ecg-image-container">
          <img src="${d.ecg_archivo.datos}" class="rep-ecg" alt="ECG">
        </div>
      </div>`;
  }

  // ESCALA DE REFERENCIA GOLDMAN
  const refClases = [
    { n: 'I', rng: '0–5', m: '0,20%', r: 'Bajo' },
    { n: 'II', rng: '6–12', m: '1,50%', r: 'Intermedio' },
    { n: 'III', rng: '13–25', m: '2,30%', r: 'Alto' },
    { n: 'IV', rng: '&gt; 25', m: '56%', r: 'Muy alto' },
  ];

  const cClase = clasificar(d.score);
  let refRows = '';
  refClases.forEach(rc => {
    const act = (rc.n === (cClase ? cClase.n : '')) ? ' class="activo"' : '';
    refRows += `<tr${act}><td>${rc.n}</td><td>${rc.rng}</td><td>${rc.m}</td><td>${rc.r}</td></tr>`;
  });

  contenedor.innerHTML = `
    <div class="rep-encabezado">
      <img src="logo-hgm.png" alt="Logo HGM" class="rep-logo">
      <div class="rep-titulo">
        <h1>Hospital General de México "Dr. Eduardo Liceaga"</h1>
        <h2>Valoración perioperatoria de riesgo cardiovascular</h2>
        <h3>Índice de Goldman de riesgo cardiaco</h3>
      </div>
      <img src="logo-hgm.png" alt="Logo HGM" class="rep-logo">
    </div>
    <div class="contenido">
      <table class="rep">
        <tr><th>Nombre del paciente</th><td colspan="3">${d.nombre}</td></tr>
        <tr><th style="width:120px">Expediente</th><td style="width:120px">${d.expediente}</td><th style="width:70px">PAB</th><td>${d.pab || '—'}</td></tr>
        <tr><th>Cama</th><td>${d.cama || '—'}</td><th>Sexo</th><td>${d.sexo || '—'}</td></tr>
        <tr><th>Edad</th><td>${d.edad} años</td><th>Fecha</th><td>${d.fecha}</td></tr>
        <tr><th>Médico</th><td colspan="3">${d.medico || '—'}</td></tr>
        <tr><th>Diagnóstico</th><td colspan="3">${d.diagnostico || '—'}</td></tr>
        <tr><th>Presión arterial</th><td colspan="3">${d.presion_arterial || '—'}</td></tr>
      </table>

      <table class="rep">
        <thead><tr><th>Criterio</th><th style="width:80px;text-align:center">Respuesta</th><th style="width:70px;text-align:center">Puntos</th></tr></thead>
        <tbody>
          ${filas}
          <tr><th colspan="2" style="text-align:right">TOTAL</th><th style="text-align:center;font-size:1rem">${d.score}</th></tr>
        </tbody>
      </table>

      <div class="resultado-bloque">
        <span class="score-num">${d.score}</span>
        <div>
          <span class="clase-txt">${d.clase}</span>
          <div style="font-size:11px">${cClase ? cClase.m : ''}</div>
        </div>
      </div>

      <table class="rep">
        <tr><th style="width:150px">Diagnóstico del ECG</th><td>${d.ecg_dx || '—'}</td></tr>
      </table>

      ${ecgHtml}

      <table class="ref">
        <thead><tr><th>Clase</th><th>Puntuación</th><th>Mortalidad</th><th>Riesgo</th></tr></thead>
        <tbody>${refRows}</tbody>
      </table>

      <div class="rep-firma">
        <div class="linea"></div>
        <div class="nombre-med">${d.medico || ''}</div>
        <div>Nombre y firma del médico</div>
      </div>

      <p class="pie">Adaptado de Goldman L, et al. N Engl J Med 1977;297:845. | ID Registro: ${d.id} | ${d.fecha}</p>
    </div>
  `;

  window.print();
}

// ----- Gestión del Historial (localStorage) -----
function mostrarHistorial() {
  const modal = document.getElementById('modalRegistros');
  const contenedor = document.getElementById('listaRegistros');
  const registros = JSON.parse(localStorage.getItem('tb_goldman') || '[]');

  if (registros.length === 0) {
    contenedor.innerHTML = '<p style="text-align:center; padding:15px; color:#666;">No hay registros guardados localmente.</p>';
  } else {
    let html = `
      <table class="tabla-historial">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Paciente</th>
            <th>Expediente</th>
            <th>Score</th>
            <th>Clase</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>`;

    registros.forEach(r => {
      html += `
        <tr>
          <td>${r.fecha}</td>
          <td><strong>${r.nombre}</strong></td>
          <td>${r.expediente}</td>
          <td>${r.score} pts</td>
          <td>${r.clase}</td>
          <td>
            <button class="btn-acc cargar" onclick="cargarRegistro(${r.id})">👁️ Ver</button>
            <button class="btn-acc borrar" onclick="eliminarRegistro(${r.id})">🗑️ Borrar</button>
          </td>
        </tr>`;
    });

    html += '</tbody></table>';
    contenedor.innerHTML = html;
  }

  modal.style.display = 'block';
}

function cargarRegistro(id) {
  const registros = JSON.parse(localStorage.getItem('tb_goldman') || '[]');
  const r = registros.find(item => item.id === id);
  if (!r) return;

  document.getElementById('nombre').value = r.nombre;
  document.getElementById('expediente').value = r.expediente;
  document.getElementById('pab').value = r.pab || '';
  document.getElementById('cama').value = r.cama || '';
  document.getElementById('sexo').value = r.sexo || '';
  document.getElementById('diagnostico').value = r.diagnostico || '';
  document.getElementById('fecha').value = r.fecha;
  document.getElementById('medico').value = r.medico || '';
  document.getElementById('edad').value = r.edad;
  document.getElementById('presion_arterial').value = r.presion_arterial || '';
  document.getElementById('ecg-dx').value = r.ecg_dx || '';

  TODOS.forEach(it => {
    const btn = document.getElementById(it.id);
    if (btn && r.respuestas) {
      const val = r.respuestas[it.id] ? '1' : '0';
      btn.dataset.val = val;
      btn.textContent = val === '1' ? 'SI' : 'NO';
      btn.classList.toggle('si', val === '1');
    }
  });

  ultimoIdGuardado = r.id;
  ecgArchivo = r.ecg_archivo || null;

  calcular();
  document.getElementById('modalRegistros').style.display = 'none';
}

function eliminarRegistro(id) {
  if (!confirm('¿Desea eliminar este registro?')) return;
  let registros = JSON.parse(localStorage.getItem('tb_goldman') || '[]');
  registros = registros.filter(r => r.id !== id);
  localStorage.setItem('tb_goldman', JSON.stringify(registros));
  mostrarHistorial();
}

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