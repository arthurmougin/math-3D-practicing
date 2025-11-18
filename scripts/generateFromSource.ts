import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * Types supported in our system
 */
type SupportedType =
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
interface MethodParameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
  description?: string;
}

/**
 * Represents a method signature with documentation
 */
interface MethodSignature {
  className: string;
  methodName: string;
  description: string;
  parameters: MethodParameter[];
  returnType: string;
  returnDescription?: string;
  example?: string;
}

/**
 * The complete equation database with source analysis
 */
interface EnhancedEquationDatabase {
  version: string;
  generatedAt: string;
  source: string;
  methods: MethodSignature[];
}

/**
 * Parse JSDoc comment block
 */
function parseJSDoc(jsDocComment: string): {
  description: string;
  params: MethodParameter[];
  returns: { type: string; description: string } | null;
} {
  const lines = jsDocComment.split("\n");
  let description = "";
  const params: MethodParameter[] = [];
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
): MethodSignature[] {
  const content = readFileSync(filePath, "utf-8");
  const methods: MethodSignature[] = [];

  // Match JSDoc + method definition
  const methodRegex = /\/\*\*([\s\S]*?)\*\/\s*(\w+)\s*\(([^)]*)\)\s*\{/g;

  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    const [, jsDocContent, methodName] = match;

    // Skip constructor and private methods
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

    const parsed = parseJSDoc(jsDocContent);

    // Only include methods that return something useful or perform calculations
    const returnType = parsed.returns?.type || "void";

    // Skip if it just returns 'this' (fluent API)
    if (returnType === className || returnType === "this") {
      continue;
    }

    methods.push({
      className,
      methodName,
      description: parsed.description,
      parameters: parsed.params,
      returnType,
      returnDescription: parsed.returns?.description,
    });
  }

  return methods;
}

/**
 * Map Three.js types to our supported types
 */
function mapTypeToSupported(type: string): SupportedType | null {
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
function isUsefulMethod(method: MethodSignature): boolean {
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
  ];

  const allMethods: MethodSignature[] = [];

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
    "equationDatabase.json"
  );

  writeFileSync(outputPath, JSON.stringify(database, null, 2));

  console.log(`\n✅ Enhanced database generated successfully!`);
  console.log(`   Total useful methods: ${allMethods.length}`);
  console.log(`   Output: ${outputPath}`);

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
