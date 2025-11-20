import { writeFileSync } from "fs";
import { join } from "path";
import {
  Euler,
  Matrix3,
  Matrix4,
  Quaternion,
  Vector2,
  Vector3,
  Vector4,
} from "three";

/**
 * Types supported in our system
 */
type valueTypeName =
  | "Vector2"
  | "Vector3"
  | "Vector4"
  | "Quaternion"
  | "Euler"
  | "Matrix3"
  | "Matrix4"
  | "number"
  | "boolean";

/**
 * Represents a valid equation signature
 */
interface EquationSignature {
  className: valueTypeName;
  methodName: string;
  parameters: valueTypeName[];
  returnType: valueTypeName | "void" | "unknown";
  isStatic: boolean;
}

/**
 * The complete equation database
 */
interface EquationDatabase {
  version: string;
  generatedAt: string;
  source: string;
  methods: EquationSignature[];
}

/**
 * Create test instances of each type
 * Uses non-trivial values to detect false positives
 * @param type - The type to create
 * @param variant - Which variant (A or B)
 * @param keepFirstNComponentsIdentical - Number of first components to keep identical between variants (useful for detecting type confusion)
 */
function createInstance(
  type: valueTypeName,
  variant: "A" | "B" = "A",
  keepFirstNComponentsIdentical: number = 0
):
  | Vector2
  | Vector3
  | Vector4
  | Quaternion
  | Euler
  | Matrix3
  | Matrix4
  | number
  | boolean
  | null {
  switch (type) {
    case "Vector2": {
      // Use distinct values for each variant
      const baseValues = [1.5, 2.7];
      const altValues = [3.2, 4.8];

      if (keepFirstNComponentsIdentical > 0) {
        const x = baseValues[0];
        const y =
          keepFirstNComponentsIdentical >= 2
            ? baseValues[1]
            : variant === "A"
            ? baseValues[1]
            : altValues[1];
        return new Vector2(x, y);
      }

      return variant === "A" ? new Vector2(1.5, 2.7) : new Vector2(3.2, 4.8);
    }
    case "Vector3": {
      // Use distinct non-zero values
      const baseValues = [1.5, 2.7, 3.1];
      const altValues = [4.2, 5.8, 6.3];

      if (keepFirstNComponentsIdentical > 0) {
        const x = baseValues[0];
        const y =
          keepFirstNComponentsIdentical >= 2
            ? baseValues[1]
            : variant === "A"
            ? baseValues[1]
            : altValues[1];
        const z =
          keepFirstNComponentsIdentical >= 3
            ? baseValues[2]
            : variant === "A"
            ? baseValues[2]
            : altValues[2];
        return new Vector3(x, y, z);
      }

      return variant === "A"
        ? new Vector3(1.5, 2.7, 3.1)
        : new Vector3(4.2, 5.8, 6.3);
    }
    case "Vector4": {
      // Use distinct values for each variant
      const baseValues = [1.5, 2.7, 3.1, 4.2];
      const altValues = [5.3, 6.4, 7.5, 8.6];

      if (keepFirstNComponentsIdentical > 0) {
        const x = baseValues[0];
        const y =
          keepFirstNComponentsIdentical >= 2
            ? baseValues[1]
            : variant === "A"
            ? baseValues[1]
            : altValues[1];
        const z =
          keepFirstNComponentsIdentical >= 3
            ? baseValues[2]
            : variant === "A"
            ? baseValues[2]
            : altValues[2];
        const w =
          keepFirstNComponentsIdentical >= 4
            ? baseValues[3]
            : variant === "A"
            ? baseValues[3]
            : altValues[3];
        return new Vector4(x, y, z, w);
      }

      return variant === "A"
        ? new Vector4(1.5, 2.7, 3.1, 4.2)
        : new Vector4(5.3, 6.4, 7.5, 8.6);
    }
    case "Quaternion": {
      // CRITICAL: By default, keep x, y, z the same, only change w
      // This detects if methods incorrectly accept Quaternion instead of Vector3
      // (Vector3 methods only read x, y, z and ignore w)
      const baseValues = [1.5, 2.7, 3.1, 0.9];
      const altValues = [4.2, 5.8, 6.3, 0.2];

      const effectiveKeep =
        keepFirstNComponentsIdentical > 0 ? keepFirstNComponentsIdentical : 3; // Default to 3 for Quaternion

      const x =
        effectiveKeep >= 1
          ? baseValues[0]
          : variant === "A"
          ? baseValues[0]
          : altValues[0];
      const y =
        effectiveKeep >= 2
          ? baseValues[1]
          : variant === "A"
          ? baseValues[1]
          : altValues[1];
      const z =
        effectiveKeep >= 3
          ? baseValues[2]
          : variant === "A"
          ? baseValues[2]
          : altValues[2];
      const w =
        effectiveKeep >= 4
          ? baseValues[3]
          : variant === "A"
          ? baseValues[3]
          : altValues[3];

      return new Quaternion(x, y, z, w);
    }
    case "Euler":
      // Use non-zero angles, keep order consistent
      return variant === "A"
        ? new Euler(0.5, 1.2, 0.8)
        : new Euler(1.1, 0.3, 1.7);
    case "Matrix3": {
      // Use non-identity matrices
      const m = new Matrix3();
      if (variant === "A") {
        m.set(1, 0.1, 0.2, 0.1, 1, 0.3, 0.2, 0.3, 1);
      } else {
        m.set(1, 0.4, 0.5, 0.4, 1, 0.6, 0.5, 0.6, 1);
      }
      return m;
    }
    case "Matrix4": {
      // Use non-identity matrices
      const m = new Matrix4();
      if (variant === "A") {
        m.set(1, 0.1, 0.2, 0, 0.1, 1, 0.3, 0, 0.2, 0.3, 1, 0, 0, 0, 0, 1);
      } else {
        m.set(1, 0.4, 0.5, 0, 0.4, 1, 0.6, 0, 0.5, 0.6, 1, 0, 0, 0, 0, 1);
      }
      return m;
    }
    case "number":
      // Use distinct non-integer values
      return variant === "A" ? 5.7 : 8.3;
    case "boolean":
      // Use different boolean values
      return variant === "A" ? true : false;
    default:
      return null;
  }
}

/**
 * Get the number of components/properties for a type
 * Used to detect if a method requires more properties than provided
 */
function getTypeComponentCount(type: valueTypeName): number {
  switch (type) {
    case "Vector2":
      return 2;
    case "Vector3":
    case "Euler":
      return 3;
    case "Vector4":
    case "Quaternion":
      return 4;
    case "Matrix3":
      return 9;
    case "Matrix4":
      return 16;
    case "number":
    case "boolean":
      return 1;
    default:
      return 0;
  }
}

/**
 * Create a "smaller" instance - one with fewer components
 * Used to test if methods reject under-specified parameters
 * For example, if a method requires Vector3 (x,y,z), test with Vector2 (x,y)
 */
function getSmallerType(type: valueTypeName): valueTypeName | null {
  switch (type) {
    case "Vector3":
    case "Euler":
      return "Vector2"; // Has x,y but missing z
    case "Vector4":
    case "Quaternion":
      return "Vector3"; // Has x,y,z but missing w
    case "Matrix4":
      return "Matrix3"; // Smaller matrix
    default:
      return null; // No smaller equivalent
  }
}

/**
 * Get the type name from a value
 */
function getTypeName(value: any): valueTypeName | "void" | "unknown" {
  if (value === null || value === undefined) return "void";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (value instanceof Vector2) return "Vector2";
  if (value instanceof Vector3) return "Vector3";
  if (value instanceof Vector4) return "Vector4";
  if (value instanceof Quaternion) return "Quaternion";
  if (value instanceof Euler) return "Euler";
  if (value instanceof Matrix3) return "Matrix3";
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
  className: valueTypeName,
  methodName: string,
  paramTypes: valueTypeName[],
  isStatic: boolean
): EquationSignature | null {
  try {
    // Create instance or use class for static methods
    const classConstructor = createInstance(className);
    const target = isStatic ? classConstructor!.constructor : classConstructor;
    if (!target) {
      return null;
    }

    if (typeof (target as any)[methodName] !== "function") {
      return null;
    }

    // Determine keepFirstN strategy based on parameter types
    // For Quaternion: keep 3 components identical to detect Vector3-only methods
    // For Vector4: keep 3 components identical to detect Vector3-only methods
    // For others: vary all components
    const getKeepFirstN = (type: valueTypeName): number => {
      if (type === "Quaternion") return 3; // Keep x,y,z same, vary w
      if (type === "Vector4") return 3; // Keep x,y,z same, vary w
      return 0; // Vary all components
    };

    // Create parameter instances (variant A)
    const paramsA = paramTypes.map((type) =>
      createInstance(type, "A", getKeepFirstN(type))
    );

    // Try calling the method
    const resultA = (target as any)[methodName](...paramsA);

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

    // VALIDATION 1: Test with different parameter values (variant B)
    // If the result is identical, the parameters are likely ignored
    if (paramTypes.length > 0) {
      const paramsB = paramTypes.map((type) =>
        createInstance(type, "B", getKeepFirstN(type))
      );
      const instanceB = createInstance(className);
      const targetB = isStatic ? instanceB?.constructor : instanceB;
      const resultB = (targetB as any)[methodName](...paramsB);

      // Compare results - if they're different, params are actually used
      const resultsAreDifferent = !areResultsEqual(resultA, resultB);

      // If results are the same, parameters might be ignored (false positive)
      if (!resultsAreDifferent) {
        return null;
      }
    }

    // VALIDATION 2: Test with "smaller" types to detect under-specified parameters
    // Example: if method requires Vector3, it should NOT accept Vector2
    // This eliminates false positives where methods read x,y from any object
    for (let i = 0; i < paramTypes.length; i++) {
      const smallerType = getSmallerType(paramTypes[i]);

      if (smallerType) {
        try {
          // Create parameters with the smaller type at position i
          const paramsSmallerA = paramTypes.map((type, idx) =>
            idx === i
              ? createInstance(smallerType, "A", getKeepFirstN(smallerType))
              : createInstance(type, "A", getKeepFirstN(type))
          );
          const paramsSmallerB = paramTypes.map((type, idx) =>
            idx === i
              ? createInstance(smallerType, "B", getKeepFirstN(smallerType))
              : createInstance(type, "B", getKeepFirstN(type))
          );

          // Test with smaller type - variant A
          const instanceSmallerA = createInstance(className);
          const targetSmallerA = isStatic
            ? instanceSmallerA?.constructor
            : instanceSmallerA;
          const resultSmallerA = (targetSmallerA as any)[methodName](
            ...paramsSmallerA
          );

          // Test with smaller type - variant B
          const instanceSmallerB = createInstance(className);
          const targetSmallerB = isStatic
            ? instanceSmallerB?.constructor
            : instanceSmallerB;
          const resultSmallerB = (targetSmallerB as any)[methodName](
            ...paramsSmallerB
          );

          // If the method works with the smaller type AND produces different results,
          // it means the method doesn't actually require the full type - FALSE POSITIVE
          const smallerResultsAreDifferent = !areResultsEqual(
            resultSmallerA,
            resultSmallerB
          );

          if (smallerResultsAreDifferent) {
            // Method accepts smaller type → it's reading only partial properties → FALSE POSITIVE
            return null;
          }
        } catch (e) {
          // If smaller type throws an error, that's good - method properly rejects it
          // Continue validation
        }
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
): Generator<valueTypeName[]> {
  const types: valueTypeName[] = [
    "Vector2",
    "Vector3",
    "Vector4",
    "Quaternion",
    "Euler",
    "Matrix3",
    "Matrix4",
    "number",
    "boolean",
  ];

  // Start with 0 parameters
  yield [];

  // Generate combinations for 1 to maxParams
  for (let paramCount = 1; paramCount <= maxParams; paramCount++) {
    function* combine(
      current: valueTypeName[],
      depth: number
    ): Generator<valueTypeName[]> {
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
function discoverMethods(className: valueTypeName, instance: any): string[] {
  const methods = new Set<string>();

  // Instance methods
  let proto = Object.getPrototypeOf(instance);
  while (proto && proto !== Object.prototype) {
    Object.getOwnPropertyNames(proto).forEach((name) => {
      if (
        typeof (instance as any)[name] === "function" &&
        !shouldSkipMethod(name)
      ) {
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

  const types: valueTypeName[] = [
    "Vector2",
    "Vector3",
    "Vector4",
    "Quaternion",
    "Euler",
    "Matrix3",
    "Matrix4",
  ];

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
    source: "Runtime AB testing",
    methods: allSignatures,
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
  console.log(`   Total methods: ${allSignatures.length}`);
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
