import {
  findEquationsByParameters,
  getAllMethodNames,
  getDatabaseStats,
  getEquationSignatureString,
} from "../src/data/equationDatabaseHelper";

console.log("🔍 Equation Database Test\n");

// Test 1: Database statistics
console.log("📊 Database Statistics:");
const stats = getDatabaseStats();
console.log(`   Total equations: ${stats.total}`);
console.log(`   Version: ${stats.version}`);
console.log(`   Generated: ${new Date(stats.generatedAt).toLocaleString()}\n`);

console.log("   By Class:");
Object.entries(stats.byClass).forEach(([cls, count]) => {
  console.log(`   - ${cls}: ${count}`);
});
console.log();

// Test 2: Find methods with 1 Vector3 parameter (instance methods)
console.log("🔎 Finding methods with Vector3 parameter:");
const v3Equations = findEquationsByParameters(["Vector3"]);
console.log(`   Found ${v3Equations.length} methods\n`);
console.log("   Top 3 with parameter details:");
v3Equations.slice(0, 3).forEach((eq) => {
  console.log(`   - ${getEquationSignatureString(eq)}`);
  console.log(`     ${eq.description}`);
  if (eq.parameters.length > 0) {
    eq.parameters.forEach((param) => {
      if (param.description) {
        console.log(`     • ${param.name}: ${param.description}`);
      }
    });
  }
  console.log();
});

// Test 3: Find methods with no parameters
console.log("🔎 Finding methods with no parameters:");
const noParamEquations = findEquationsByParameters([]);
console.log(`   Found ${noParamEquations.length} methods\n`);
console.log("   First 5:");
noParamEquations.slice(0, 5).forEach((eq) => {
  console.log(`   - ${getEquationSignatureString(eq)}`);
  console.log(`     ${eq.description}`);
});
console.log();

// Test 4: List all unique method names
console.log("📝 All unique method names:");
const methodNames = getAllMethodNames();
console.log(`   Total: ${methodNames.length}`);
console.log(`   Sample: ${methodNames.slice(0, 20).join(", ")}...\n`);

console.log("✅ Tests completed!");
