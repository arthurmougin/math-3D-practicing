import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { enrichDescriptionWithLinks, getTermUsageStats } from "./technicalTerms";

/**
 * Types supported in our system
 */
type valueTypeName =
  | "Vector3"
  | "Quaternion"
  | "Euler"
  | "Matrix4"
  | "Matrix3"
  | "Vector2"
  | "Vector4"
  | "number"
  | "boolean";

/**
 * Represents a method parameter extracted from JSDoc
 */
interface EquationParameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
  description?: string;
}

/**
 * Method type classification
 */
type EquationType = 'calculation' | 'transformation' | 'mutation';

/**
 * Represents a method signature with documentation
 */
interface EquationSignature {
  className: string;
  methodName: string;
  description: string;
  parameters: EquationParameter[];
  returnType: string;
  returnDescription?: string;
  example?: string;
  EquationType: EquationType;
  mutatesThis: boolean;
}

/**
 * The complete equation database with source analysis
 */
interface EnhancedEquationDatabase {
  version: string;
  generatedAt: string;
  source: string;
  methods: EquationSignature[];
}

/**
 * Parse JSDoc comment block
 */
function parseJSDoc(jsDocComment: string): {
  description: string;
  params: EquationParameter[];
  returns: { type: string; description: string } | null;
} {
  const lines = jsDocComment.split("\n");
  let description = "";
  const params: EquationParameter[] = [];
  let returns: { type: string; description: string } | null = null;

  for (const line of lines) {
    const trimmed = line.trim().replace(/^\*\s?/, "");

    // Description (before any @tags)
    if (!trimmed.startsWith("@") && !description && trimmed) {
      description = trimmed;
      continue;
    }

    // @param tag with description
    const paramMatch = trimmed.match(
      /@param\s+\{([^}]+)\}\s+\[?([^\]\s]+)\]?(?:=([^\s]+))?\s*-?\s*(.*)/
    );
    if (paramMatch) {
      const [, type, name, defaultValue, description] = paramMatch;
      params.push({
        name: name.replace(/[[\]]/g, ""),
        type: type.trim(),
        optional: name.includes("[") || defaultValue !== undefined,
        defaultValue: defaultValue?.trim(),
        description: description.trim() || undefined,
      });
      continue;
    }

    // @return or @returns tag
    const returnMatch = trimmed.match(/@returns?\s+\{([^}]+)\}\s*-?\s*(.*)/);
    if (returnMatch) {
      returns = {
        type: returnMatch[1].trim(),
        description: returnMatch[2].trim(),
      };
    }
  }

  return { description, params, returns };
}

/**
 * Extract methods from a JavaScript class file
 */
function extractMethodsFromFile(
  filePath: string,
  className: string
): EquationSignature[] {
  const content = readFileSync(filePath, "utf-8");
  const methods: EquationSignature[] = [];

  // For MathUtils, use a different regex to match free functions
  // For classes, match method definitions
  const isMathUtils = className === "MathUtils";
  const methodRegex = isMathUtils
    ? /\/\*\*([\s\S]*?)\*\/\s*function\s+(\w+)\s*\(([^)]*)\)\s*\{/g
    : /\/\*\*([\s\S]*?)\*\/\s*(\w+)\s*\(([^)]*)\)\s*\{/g;

  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    const [, jsDocContent, methodName] = match;

    // Skip constructor and private methods (but not for MathUtils free functions)
    if (!isMathUtils) {
      if (
        methodName === "constructor" ||
        methodName.startsWith("_") ||
        methodName === "set" ||
        methodName === "copy" ||
        methodName === "clone" ||
        methodName === "toJSON" ||
        methodName === "fromJSON"
      ) {
        continue;
      }
    } else {
      // For MathUtils, skip private functions and utility functions
      if (
        methodName.startsWith("_") ||
        methodName === "generateUUID" ||
        methodName === "seededRandom" ||
        methodName === "setQuaternionFromProperEuler"
      ) {
        continue;
      }
    }

    const parsed = parseJSDoc(jsDocContent);

    // Determine return type
    const returnType = parsed.returns?.type || "void";
    
    // Classify method type
    let EquationType: EquationType;
    let mutatesThis = false;
    
    // For MathUtils, all functions are calculations (pure functions)
    if (isMathUtils) {
      EquationType = "calculation";
      mutatesThis = false;
    } else if (returnType === "number" || returnType === "boolean") {
      EquationType = "calculation";
      mutatesThis = false;
    } else if (returnType === className || returnType === "this") {
      mutatesThis = true;
      
      // Distinguish between mathematical transformations and simple mutations
      const MATH_OPERATION_PATTERNS = [
        /^(add|sub|multiply|divide|scale)/i,           // Arithmetic
        /^(normalize|negate|absolute|floor|ceil|round|abs)/i,  // Normalization
        /^(clamp|min|max|lerp|slerp)/i,                // Clamping/interpolation
        /^(apply|transform|project|reflect)/i,         // Transformations
        /^(cross|dot)/i,                               // Vector operations
        /^(rotate|lookAt)/i,                           // Rotation
        /^(setLength|setFromSpherical|setFromCylindrical)/i,  // Special setters
      ];
      
      const isMathOperation = MATH_OPERATION_PATTERNS.some(pattern => 
        pattern.test(methodName)
      );
      
      if (isMathOperation) {
        EquationType = "transformation";
      } else {
        EquationType = "mutation";
        // Skip simple mutations (setters, copy, etc.)
        continue;
      }
    } else if (returnType === "void") {
      // Skip void methods
      continue;
    } else {
      // Methods returning other types (Vector3, Matrix4, etc.) are transformations
      EquationType = "transformation";
      mutatesThis = false;
    }

    methods.push({
      className,
      methodName,
      description: enrichDescriptionWithLinks(parsed.description, "en"),
      parameters: parsed.params.map(param => ({
        ...param,
        description: param.description ? enrichDescriptionWithLinks(param.description, "en") : undefined
      })),
      returnType,
      returnDescription: parsed.returns?.description 
        ? enrichDescriptionWithLinks(parsed.returns.description, "en")
        : undefined,
      EquationType,
      mutatesThis,
    });
  }

  return methods;
}

/**
 * Map Three.js types to our supported types
 */
function mapTypeToSupported(type: string): valueTypeName | null {
  const cleaned = type
    .replace(/\s+/g, "")
    .replace(/\[/g, "")
    .replace(/\]/g, "");

  if (cleaned === "number" || cleaned === "float" || cleaned === "integer") {
    return "number";
  }
  if (cleaned === "boolean" || cleaned === "bool") {
    return "boolean";
  }
  if (cleaned === "Vector3") return "Vector3";
  if (cleaned === "Vector2") return "Vector2";
  if (cleaned === "Vector4") return "Vector4";
  if (cleaned === "Quaternion") return "Quaternion";
  if (cleaned === "Euler") return "Euler";
  if (cleaned === "Matrix4") return "Matrix4";
  if (cleaned === "Matrix3") return "Matrix3";

  return null;
}

/**
 * Filter methods that are useful for equation database
 */
function isUsefulMethod(method: EquationSignature): boolean {
  // Must return a supported type
  const returnType = mapTypeToSupported(method.returnType);
  if (!returnType) return false;

  // Must have supported parameter types
  const allParamsSupported = method.parameters.every((p) => {
    return mapTypeToSupported(p.type) !== null || p.optional;
  });

  if (!allParamsSupported) return false;

  // Exclude methods with too many parameters
  const requiredParams = method.parameters.filter((p) => !p.optional);
  if (requiredParams.length > 3) return false;

  // Useful methods typically:
  // - Return numbers (calculations)
  // - Return vectors/quaternions (transformations)
  // - Have descriptive names suggesting operations
  const usefulPatterns = [
    /^(add|sub|multiply|divide|scale|dot|cross|distance|angle|length|normalize|clamp|lerp|min|max|abs|ceil|floor|round|apply|transform|project|rotate)/i,
    /^(get|compute|calculate|is|equals|contains|intersect)/i,
  ];

  const isUsefulPattern = usefulPatterns.some((pattern) =>
    pattern.test(method.methodName)
  );

  return isUsefulPattern || returnType === "number" || returnType === "boolean";
}

/**
 * Main generation function
 */
async function generateEnhancedDatabase() {
  console.log("🔍 Analyzing Three.js source code...\n");

  const mathFolder = join(process.cwd(), "docs", "ia-only", "math");

  // Files to analyze
  const classFiles = [
    { file: "Vector3.js", className: "Vector3" },
    { file: "Vector2.js", className: "Vector2" },
    { file: "Vector4.js", className: "Vector4" },
    { file: "Quaternion.js", className: "Quaternion" },
    { file: "Euler.js", className: "Euler" },
    { file: "Matrix4.js", className: "Matrix4" },
    { file: "Matrix3.js", className: "Matrix3" },
    { file: "MathUtils.js", className: "MathUtils" },
  ];

  const allMethods: EquationSignature[] = [];

  for (const { file, className } of classFiles) {
    const filePath = join(mathFolder, file);
    console.log(`📊 Analyzing ${className}...`);

    try {
      const methods = extractMethodsFromFile(filePath, className);
      const usefulMethods = methods.filter(isUsefulMethod);

      console.log(
        `   Found ${methods.length} methods, ${usefulMethods.length} useful`
      );

      allMethods.push(...usefulMethods);
    } catch (error) {
      console.error(`   ❌ Error processing ${file}:`, error);
    }
  }

  // Create enhanced database
  const database: EnhancedEquationDatabase = {
    version: "2.0.0",
    generatedAt: new Date().toISOString(),
    source: "Three.js source code analysis",
    methods: allMethods,
  };

  // Save to file
  const outputPath = join(
    process.cwd(),
    "src",
    "data",
    "equationDatabase.source.json"
  );

  writeFileSync(outputPath, JSON.stringify(database, null, 2));

  console.log(`\n✅ Enhanced database generated successfully!`);
  console.log(`   Total useful methods: ${allMethods.length}`);
  console.log(`   Output: ${outputPath}`);

  // Print term usage statistics
  const allDescriptions = allMethods.flatMap(m => [
    m.description,
    ...(m.parameters.map(p => p.description).filter(Boolean) as string[]),
    m.returnDescription
  ].filter(Boolean) as string[]);
  
  const termStats = getTermUsageStats(allDescriptions);
  if (termStats.size > 0) {
    console.log(`\n🔗 Wikipedia links added for ${termStats.size} technical terms:`);
    Array.from(termStats.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([term, count]) => {
        console.log(`   "${term}": ${count} occurrence${count > 1 ? 's' : ''}`);
      });
  }

  // Print statistics by method type
  const byType = allMethods.reduce((acc, method) => {
    acc[method.EquationType] = (acc[method.EquationType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`\n📊 Statistics by method type:`);
  Object.entries(byType)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      const icon = type === 'calculation' ? '🔢' : type === 'transformation' ? '🔄' : '⚙️';
      console.log(`   ${icon} ${type}: ${count} methods`);
    });

  // Print statistics by class
  const byClass = allMethods.reduce((acc, method) => {
    acc[method.className] = (acc[method.className] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log("\n📈 Statistics by class:");
  Object.entries(byClass)
    .sort(([, a], [, b]) => b - a)
    .forEach(([className, count]) => {
      console.log(`   ${className}: ${count} methods`);
    });

  // Show some examples
  console.log("\n📝 Sample methods:");
  allMethods.slice(0, 5).forEach((method) => {
    const params = method.parameters
      .map((p) => `${p.name}: ${p.type}`)
      .join(", ");
    console.log(
      `   ${method.className}.${method.methodName}(${params}) → ${method.returnType}`
    );
    console.log(`      ${method.description}`);
  });
}

// Run the generation
generateEnhancedDatabase().catch(console.error);
