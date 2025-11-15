import { writeFileSync } from "fs";
import { join } from "path";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";

/**
 * Types supported in our system
 */
type SupportedType = "Vector3" | "Quaternion" | "Euler" | "Matrix4" | "number";

/**
 * Represents a valid equation signature
 */
interface EquationSignature {
  className: SupportedType;
  methodName: string;
  parameters: SupportedType[];
  returnType: SupportedType | "void" | "unknown";
  isStatic: boolean;
}

/**
 * The complete equation database
 */
interface EquationDatabase {
  version: string;
  generatedAt: string;
  equations: EquationSignature[];
}

/**
 * Create test instances of each type
 * Uses non-trivial values to detect false positives
 */
function createInstance(type: SupportedType, variant: "A" | "B" = "A"): any {
  switch (type) {
    case "Vector3":
      // Use distinct non-zero values
      return variant === "A"
        ? new Vector3(1.5, 2.7, 3.1)
        : new Vector3(4.2, 5.8, 6.3);
    case "Quaternion":
      // Use non-identity quaternions
      return variant === "A"
        ? new Quaternion(0.1, 0.2, 0.3, 0.9)
        : new Quaternion(0.4, 0.5, 0.6, 0.7);
    case "Euler":
      // Use non-zero angles
      return variant === "A"
        ? new Euler(0.5, 1.2, 0.8)
        : new Euler(1.1, 0.3, 1.7);
    case "Matrix4":
      // Use non-identity matrices
      const m = new Matrix4();
      if (variant === "A") {
        m.set(1, 0.1, 0.2, 0, 0.1, 1, 0.3, 0, 0.2, 0.3, 1, 0, 0, 0, 0, 1);
      } else {
        m.set(1, 0.4, 0.5, 0, 0.4, 1, 0.6, 0, 0.5, 0.6, 1, 0, 0, 0, 0, 1);
      }
      return m;
    case "number":
      // Use distinct non-integer values
      return variant === "A" ? 5.7 : 8.3;
    default:
      return null;
  }
}

/**
 * Get the type name from a value
 */
function getTypeName(value: any): SupportedType | "void" | "unknown" {
  if (value === null || value === undefined) return "void";
  if (typeof value === "number") return "number";
  if (value instanceof Vector3) return "Vector3";
  if (value instanceof Quaternion) return "Quaternion";
  if (value instanceof Euler) return "Euler";
  if (value instanceof Matrix4) return "Matrix4";
  return "unknown";
}

/**
 * Check if a method should be skipped
 */
function shouldSkipMethod(methodName: string): boolean {
  const skipList = [
    "constructor",
    "toString",
    "toJSON",
    "valueOf",
    "hasOwnProperty",
    "isPrototypeOf",
    "propertyIsEnumerable",
    "toLocaleString",
    // Skip getters/setters that don't represent operations
    "get",
    "set",
    // Skip iteration/array methods
    "forEach",
    "map",
    "reduce",
    "filter",
    "iterator",
    // Skip clone/copy as they don't represent math operations
    "clone",
    "copy",
    "copyFrom",
    "fromArray",
    "toArray",
  ];

  return skipList.includes(methodName) || methodName.startsWith("_");
}

/**
 * Test a method with given parameters and validate it's not a false positive
 */
function testMethod(
  className: SupportedType,
  methodName: string,
  paramTypes: SupportedType[],
  isStatic: boolean
): EquationSignature | null {
  try {
    // Create instance or use class for static methods
    const classConstructor = createInstance(className);
    const target = isStatic ? classConstructor.constructor : classConstructor;

    if (typeof target[methodName] !== "function") {
      return null;
    }

    // Create parameter instances (variant A)
    const paramsA = paramTypes.map((type) => createInstance(type, "A"));

    // Try calling the method
    const resultA = target[methodName](...paramsA);

    // Determine return type
    const returnType = getTypeName(resultA);

    // Skip if method returns the same instance (fluent API)
    if (resultA === classConstructor) {
      return null;
    }

    // Skip if returns void or unknown
    if (returnType === "void" || returnType === "unknown") {
      return null;
    }

    // VALIDATION: Test with different parameter values (variant B)
    // If the result is identical, the parameters are likely ignored
    if (paramTypes.length > 0) {
      const paramsB = paramTypes.map((type) => createInstance(type, "B"));
      const instanceB = createInstance(className);
      const targetB = isStatic ? instanceB.constructor : instanceB;
      const resultB = targetB[methodName](...paramsB);

      // Compare results - if they're different, params are actually used
      const resultsAreDifferent = !areResultsEqual(resultA, resultB);

      // If results are the same, parameters might be ignored (false positive)
      if (!resultsAreDifferent) {
        return null;
      }
    }

    return {
      className,
      methodName,
      parameters: paramTypes,
      returnType,
      isStatic,
    };
  } catch (error) {
    // Method threw an error, not a valid signature
    return null;
  }
}

/**
 * Compare two results to check if they're equal
 */
function areResultsEqual(a: any, b: any): boolean {
  if (typeof a === "number" && typeof b === "number") {
    // Use epsilon comparison for numbers
    return Math.abs(a - b) < 0.0001;
  }

  if (a instanceof Vector3 && b instanceof Vector3) {
    return a.distanceTo(b) < 0.0001;
  }

  if (a instanceof Quaternion && b instanceof Quaternion) {
    return (
      Math.abs(a.x - b.x) < 0.0001 &&
      Math.abs(a.y - b.y) < 0.0001 &&
      Math.abs(a.z - b.z) < 0.0001 &&
      Math.abs(a.w - b.w) < 0.0001
    );
  }

  if (a instanceof Euler && b instanceof Euler) {
    return (
      Math.abs(a.x - b.x) < 0.0001 &&
      Math.abs(a.y - b.y) < 0.0001 &&
      Math.abs(a.z - b.z) < 0.0001
    );
  }

  if (a instanceof Matrix4 && b instanceof Matrix4) {
    for (let i = 0; i < 16; i++) {
      if (Math.abs(a.elements[i] - b.elements[i]) > 0.0001) {
        return false;
      }
    }
    return true;
  }

  // Default comparison
  return a === b;
}

/**
 * Generate all possible parameter combinations up to maxParams
 */
function* generateParameterCombinations(
  maxParams: number
): Generator<SupportedType[]> {
  const types: SupportedType[] = [
    "Vector3",
    "Quaternion",
    "Euler",
    "Matrix4",
    "number",
  ];

  // Start with 0 parameters
  yield [];

  // Generate combinations for 1 to maxParams
  for (let paramCount = 1; paramCount <= maxParams; paramCount++) {
    function* combine(
      current: SupportedType[],
      depth: number
    ): Generator<SupportedType[]> {
      if (depth === paramCount) {
        yield [...current];
        return;
      }

      for (const type of types) {
        current[depth] = type;
        yield* combine(current, depth + 1);
      }
    }

    yield* combine([], 0);
  }
}

/**
 * Discover all methods on a class
 */
function discoverMethods(className: SupportedType, instance: any): string[] {
  const methods = new Set<string>();

  // Instance methods
  let proto = Object.getPrototypeOf(instance);
  while (proto && proto !== Object.prototype) {
    Object.getOwnPropertyNames(proto).forEach((name) => {
      if (typeof instance[name] === "function" && !shouldSkipMethod(name)) {
        methods.add(name);
      }
    });
    proto = Object.getPrototypeOf(proto);
  }

  return Array.from(methods);
}

/**
 * Main generation function
 */
async function generateDatabase() {
  console.log("🔍 Starting equation database generation...\n");

  const types: SupportedType[] = ["Vector3", "Quaternion", "Euler", "Matrix4"];

  const allSignatures: EquationSignature[] = [];
  const maxParams = 3; // Test up to 3 parameters

  for (const className of types) {
    console.log(`\n📊 Analyzing ${className}...`);
    const instance = createInstance(className);
    const methods = discoverMethods(className, instance);

    console.log(`   Found ${methods.length} methods to test`);

    for (const methodName of methods) {
      let validCount = 0;
      let foundValidSignature = false;

      // OPTIMIZATION: Test in order of increasing parameter count
      // Stop when we find a working signature with N params
      for (let paramCount = 0; paramCount <= maxParams; paramCount++) {
        let foundForThisCount = false;

        // Generate only combinations for current param count
        for (const paramTypes of generateParameterCombinations(maxParams)) {
          if (paramTypes.length !== paramCount) continue;

          // Test as instance method
          const instanceSig = testMethod(
            className,
            methodName,
            paramTypes,
            false
          );
          if (instanceSig) {
            allSignatures.push(instanceSig);
            validCount++;
            foundForThisCount = true;
            foundValidSignature = true;
          }

          // Test as static method (if first param is same as class)
          if (paramTypes.length > 0 && paramTypes[0] === className) {
            const staticSig = testMethod(
              className,
              methodName,
              paramTypes.slice(1),
              true
            );
            if (staticSig) {
              allSignatures.push(staticSig);
              validCount++;
              foundForThisCount = true;
            }
          }
        }

        // OPTIMIZATION: If we found valid signatures for N params,
        // don't test N+1 params (they would be false positives)
        if (foundForThisCount && foundValidSignature) {
          break;
        }
      }

      if (validCount > 0) {
        console.log(`   ✓ ${methodName}: ${validCount} valid signatures`);
      }
    }
  }

  // Create database object
  const database: EquationDatabase = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    equations: allSignatures,
  };

  // Save to file
  const outputPath = join(
    process.cwd(),
    "src",
    "data",
    "equationDatabase.json"
  );

  writeFileSync(outputPath, JSON.stringify(database, null, 2));

  console.log(`\n✅ Database generated successfully!`);
  console.log(`   Total equations: ${allSignatures.length}`);
  console.log(`   Output: ${outputPath}`);

  // Print some statistics
  const byClass = allSignatures.reduce((acc, sig) => {
    acc[sig.className] = (acc[sig.className] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log("\n📈 Statistics by class:");
  Object.entries(byClass).forEach(([className, count]) => {
    console.log(`   ${className}: ${count} equations`);
  });
}

// Run the generation
generateDatabase().catch(console.error);
