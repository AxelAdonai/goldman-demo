<?php
// ============================================================
// Buscador de registros — Índice de Goldman
// Autor: Axel Adonai
// ============================================================
require_once 'config.php';

// ===== PARÁMETROS DE BÚSQUEDA =====
$buscar = isset($_GET['buscar']) ? trim($_GET['buscar']) : '';
$clase = isset($_GET['clase']) ? $_GET['clase'] : '';
$pagina = isset($_GET['pagina']) ? max(1, (int) $_GET['pagina']) : 1;
$porPagina = 20;
$offset = ($pagina - 1) * $porPagina;

// ===== CONSTRUIR WHERE =====
$where = '1=1';
$params = [];
$tipos = '';

if ($buscar !== '') {
    $where .= ' AND (nombre LIKE ? OR expediente LIKE ?)';
    $like = "%$buscar%";
    $params[] = $like;
    $params[] = $like;
    $tipos .= 'ss';
}

if ($clase !== '') {
    $where .= ' AND clase LIKE ?';
    $params[] = 'Clase ' . $clase . ' %';
    $tipos .= 's';
}

// ===== CONTAR TOTAL =====
$stmt = $conn->prepare("SELECT COUNT(*) AS total FROM tb_goldman WHERE $where");
if ($params) {
    $stmt->bind_param($tipos, ...$params);
}
$stmt->execute();
$totalRegistros = $stmt->get_result()->fetch_assoc()['total'];
$totalPaginas = max(1, (int) ceil($totalRegistros / $porPagina));

// ===== OBTENER REGISTROS =====
$sql = "SELECT id, nombre, expediente, pab, cama, sexo, diagnostico, edad, score, clase, ecg_ruta, pdf_ruta,
               creado_en, edad_mayor_70, im6m, s3pvy, estao, ritmo, ev5,
               gases, iones, renal, hepat, encam, ciralto, cirurg
        FROM tb_goldman
        WHERE $where
        ORDER BY creado_en DESC
        LIMIT ? OFFSET ?";

$params[] = $porPagina;
$params[] = $offset;
$tipos .= 'ii';

$stmt = $conn->prepare($sql);
$stmt->bind_param($tipos, ...$params);
$stmt->execute();
$resultado = $stmt->get_result();

$registros = [];
while ($fila = $resultado->fetch_assoc()) {
    $registros[] = $fila;
}
$conn->close();

/**
 * Renderiza un valor booleano como ✅ o ❌.
 *
 * @param mixed $valor Valor a evaluar (puede ser null, '', 0, 1, etc.)
 * @return string Código HTML con el icono correspondiente.
 */
function renderBool($valor): string
{
    if ($valor === null || $valor === '') return '<td>—</td>';
    return $valor == 1 ? '<td class="si">✅</td>' : '<td class="no">❌</td>';
}

/**
 * Extrae el número de clase romano y su índice numérico.
 *
 * @param string|null $claseCompleta Cadena como "Clase I (Riesgo Bajo)" o similar.
 * @return array [número_romano, índice_numérico] ej. ['I', 1].
 */
function claseNumero(?string $claseCompleta): array
{
    preg_match('/Clase\s+(I{1,3}V?|VI{0,3}|IV|IX)/i', $claseCompleta ?? '', $m);
    $numero = $m[1] ?? ($claseCompleta ?? '');
    $indices = ['I' => 1, 'II' => 2, 'III' => 3, 'IV' => 4];
    return [$numero, $indices[strtoupper($numero)] ?? 1];
}
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buscador - Índice de Goldman</title>
    <link rel="stylesheet" href="style.css">
</head>

<body>
    <div class="contenedor-buscador">
        <div class="header-buscador">
            <h1> Buscador <small>Índice de Goldman</small></h1>
            <a href="index.html" class="btn-nuevo"> Nuevo</a>
        </div>

        <form class="filtros" method="GET" action="">
            <div class="campo">
                <label> Buscar</label>
                <input type="text" name="buscar" placeholder="Nombre o expediente..." value="<?php echo htmlspecialchars($buscar); ?>">
            </div>
            <div class="campo">
                <label>Clase</label>
                <select name="clase">
                    <option value="">Todas</option>
                    <option value="I" <?php echo $clase === 'I' ? 'selected' : ''; ?>>Clase I — Riesgo Bajo</option>
                    <option value="II" <?php echo $clase === 'II' ? 'selected' : ''; ?>>Clase II — Riesgo Intermedio</option>
                    <option value="III" <?php echo $clase === 'III' ? 'selected' : ''; ?>>Clase III — Alto Riesgo</option>
                    <option value="IV" <?php echo $clase === 'IV' ? 'selected' : ''; ?>>Clase IV — Riesgo Muy Alto</option>
                </select>
            </div>
            <div class="campo">
                <button type="submit" class="btn-buscar"> Buscar</button>
            </div>
            <div class="campo">
                <a href="ver_registros.php" class="btn-limpiar-bus">Limpiar</a>
            </div>
        </form>

        <div class="stats">
            <span> Total: <span class="numero"><?php echo number_format($totalRegistros); ?></span></span>
            <span> Página <span class="numero"><?php echo $pagina; ?></span> de <span class="numero"><?php echo $totalPaginas; ?></span></span>
        </div>

        <div class="tabla-wrap">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Paciente</th>
                        <th>Exp.</th>
                        <th>PAB</th>
                        <th>Cama</th>
                        <th>Sexo</th>
                        <th>Diagnóstico</th>
                        <th>Edad</th>
                        <th>Score</th>
                        <th>Clase</th>
                        <th>ECG</th>
                        <th>PDF</th>
                        <th>E&gt;70</th>
                        <th>IAM</th>
                        <th>S3</th>
                        <th>EAo</th>
                        <th>Rit</th>
                        <th>EV</th>
                        <th>Gas</th>
                        <th>Ion</th>
                        <th>Ren</th>
                        <th>Hep</th>
                        <th>Enc</th>
                        <th>Int</th>
                        <th>Urg</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($registros)): ?>
                        <tr>
                            <td colspan="26" class="sin-registros">No hay registros</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($registros as $r): ?>
                            <?php [$claseNum, $claseIdx] = claseNumero($r['clase']); ?>
                            <tr>
                                <td><?php echo $r['id']; ?></td>
                                <td><strong><?php echo htmlspecialchars($r['nombre']); ?></strong></td>
                                <td><?php echo htmlspecialchars($r['expediente'] ?? '—'); ?></td>
                                <td><?php echo htmlspecialchars($r['pab'] ?? '—'); ?></td>
                                <td><?php echo htmlspecialchars($r['cama'] ?? '—'); ?></td>
                                <td><?php echo htmlspecialchars($r['sexo'] ?? '—'); ?></td>
                                <td><?php echo htmlspecialchars($r['diagnostico'] ?? '—'); ?></td>
                                <td><?php echo $r['edad']; ?></td>
                                <td><strong><?php echo $r['score']; ?></strong></td>
                                <td><span class="badge c<?php echo $claseIdx; ?>"><?php echo htmlspecialchars($claseNum); ?></span></td>
                                <td>
                                    <?php if (!empty($r['ecg_ruta']) && file_exists($r['ecg_ruta'])): ?>
                                        <img src="<?php echo htmlspecialchars($r['ecg_ruta']); ?>" class="ecg-img"
                                            onclick="abrirModal('<?php echo htmlspecialchars($r['ecg_ruta']); ?>')" alt="ECG">
                                        <?php else: ?>—<?php endif; ?>
                                </td>
                                <td>
                                    <?php if (!empty($r['pdf_ruta']) && file_exists($r['pdf_ruta'])): ?>
                                        <div class="acciones-pdf">
                                            <a href="<?php echo htmlspecialchars($r['pdf_ruta']); ?>" target="_blank" class="btn-pdf" title="Ver reporte">📄 Ver</a>
                                            <button class="btn-pdf btn-pdf-dl" onclick="imprimirPDF('<?php echo htmlspecialchars($r['pdf_ruta']); ?>')" title="Imprimir">🖨️ Imprimir</button>
                                        </div>
                                        <?php else: ?>—<?php endif; ?>
                                </td>
                                <?php echo renderBool($r['edad_mayor_70']); ?>
                                <?php echo renderBool($r['im6m']); ?>
                                <?php echo renderBool($r['s3pvy']); ?>
                                <?php echo renderBool($r['estao']); ?>
                                <?php echo renderBool($r['ritmo']); ?>
                                <?php echo renderBool($r['ev5']); ?>
                                <?php echo renderBool($r['gases']); ?>
                                <?php echo renderBool($r['iones']); ?>
                                <?php echo renderBool($r['renal']); ?>
                                <?php echo renderBool($r['hepat']); ?>
                                <?php echo renderBool($r['encam']); ?>
                                <?php echo renderBool($r['ciralto']); ?>
                                <?php echo renderBool($r['cirurg']); ?>
                                <td class="fecha"><?php echo date('d/m/Y H:i', strtotime($r['creado_en'])); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <?php if ($totalPaginas > 1): ?>
            <div class="paginacion">
                <?php if ($pagina > 1): ?>
                    <a href="?<?php echo http_build_query(array_merge($_GET, ['pagina' => $pagina - 1])); ?>">◀</a>
                <?php endif; ?>
                <?php for ($i = max(1, $pagina - 2); $i <= min($totalPaginas, $pagina + 2); $i++): ?>
                    <?php if ($i === $pagina): ?>
                        <span class="activo"><?php echo $i; ?></span>
                    <?php else: ?>
                        <a href="?<?php echo http_build_query(array_merge($_GET, ['pagina' => $i])); ?>"><?php echo $i; ?></a>
                    <?php endif; ?>
                <?php endfor; ?>
                <?php if ($pagina < $totalPaginas): ?>
                    <a href="?<?php echo http_build_query(array_merge($_GET, ['pagina' => $pagina + 1])); ?>">▶</a>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>

    <!-- MODAL DE ECG -->
    <div class="modal" id="modal-ecg" onclick="cerrarModal(event)">
        <div class="modal-content" onclick="event.stopPropagation();">
            <button class="modal-close" onclick="cerrarModal(event)">✕</button>
            <div class="modal-img-wrap" id="modal-img-wrap">
                <img id="modal-img" src="" alt="ECG">
            </div>
            <div class="modal-toolbar">
                <button onclick="alejar()">−</button>
                <span class="zoom-label" id="zoom-label">100%</span>
                <button onclick="acercar()">+</button>
                <button onclick="restablecerZoom()">↺ Reset</button>
            </div>
        </div>
    </div>

    <script src="visor.js"></script>
</body>

</html>