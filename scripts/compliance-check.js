const fs = require('fs');
const path = require('path');

console.log('=== Iniciando Auditoría de Cumplimiento (Compliance Quality Gate) ===');

const COVERAGE_SUMMARY_PATH = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
const MIN_COVERAGE_THRESHOLD = 80.0; // 80% de cobertura mínima requerida

if (!fs.existsSync(COVERAGE_SUMMARY_PATH)) {
  console.error('Error: No se encontró el reporte de cobertura en ' + COVERAGE_SUMMARY_PATH);
  console.error('Por favor, ejecute las pruebas con cobertura primero (npm test).');
  process.exit(1);
}

try {
  const summaryRaw = fs.readFileSync(COVERAGE_SUMMARY_PATH, 'utf8');
  const summary = JSON.parse(summaryRaw);
  
  if (!summary.total || !summary.total.lines) {
    console.error('Error: El formato del reporte de cobertura es inválido.');
    process.exit(1);
  }

  const linesPct = summary.total.lines.pct;
  const statementsPct = summary.total.statements.pct;
  const functionsPct = summary.total.functions.pct;
  const branchesPct = summary.total.branches.pct;

  console.log(`- Cobertura de Líneas: ${linesPct}% (Mínimo requerido: ${MIN_COVERAGE_THRESHOLD}%)`);
  console.log(`- Cobertura de Declaraciones: ${statementsPct}%`);
  console.log(`- Cobertura de Funciones: ${functionsPct}%`);
  console.log(`- Cobertura de Ramas: ${branchesPct}%`);

  if (linesPct < MIN_COVERAGE_THRESHOLD) {
    console.error(`\n[FALLA DE CALIDAD] La cobertura de líneas (${linesPct}%) es menor al umbral mínimo requerido (${MIN_COVERAGE_THRESHOLD}%).`);
    console.error('El pipeline de CI/CD se detendrá de inmediato.');
    process.exit(1);
  }

  console.log('\n[ÉXITO DE CALIDAD] El código cumple con las políticas de cobertura mínima establecida.');
  process.exit(0);

} catch (err) {
  console.error('Error al procesar las políticas de cumplimiento:', err.message);
  process.exit(1);
}
