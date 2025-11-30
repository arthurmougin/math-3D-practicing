import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  enrichDescriptionWithLinks,
  getTermUsageStats,
} from "./technicalTerms";
import {
  ClassNames,
  EnhancedEquationDatabase,
  EquationParameter,
  EquationSignature,
  EquationType,
  ValueType,
  ValueTypeName,
} from "../types/types.d";
import {
  Vector2,
  Vector3,
  Vector4,
  Quaternion,
  Euler,
  Matrix4,
  Matrix3,
} from "three";
import * as THREE from "three";

type EquationParameterCandidate = Omit<EquationParameter, "type"> & {
  type: string;
};
type EquationTypeCandidate = Partial<EquationType>;
type EquationSignatureCandidate = Omit<
  EquationSignature,
  "className" | "methodName" | "parameters" | "returnType" | "equationType"
> & {
  className: string;
  methodName: string;
  parameters: EquationParameterCandidate[];
  returnType: string;
  equationType: EquationTypeCandidate;
};

export function isExcludedMethodName(methodName: string): boolean {
  return (
    methodName.includes("Array") ||
    methodName.includes("Buffer") ||
    methodName.includes("random") ||
    methodName.startsWith("_") ||
    methodName === "constructor" ||
    methodName === "set" ||
    methodName === "copy" ||
    methodName === "clone" ||
    methodName === "toJSON" ||
    methodName === "fromJSON" ||
    methodName === "generateUUID" ||
    methodName === "seededRandom"
  );
}

/**
 * Parse JSDoc comment block
 */
function parseJSDoc(jsDocComment: string): Partial<EquationSignatureCandidate> {
  const lines = jsDocComment.split("\n");
  let description = "";
  const parameters: EquationParameterCandidate[] = [];
  let returns: { type: string; description: string } | null = null;

  for (const line of lines) {
    const trimmed = line.trim().split("*")?.[1]?.trim() || "";

    if (trimmed.length === 0) {
      continue;
    }

    // Description (before any @tags)
    if (!trimmed.startsWith("@") && trimmed) {
      //if description already has content, add a space before appending
      description += (description != "" ? " " : "") + trimmed;
      continue;
    }

    // @param tag with description
    const paramMatch = trimmed.includes("@param");
    if (paramMatch) {
      /**
       * example data :
       * @param {Matrix4} m - A 4x4 matrix of which the upper 3x3 of matrix is a pure rotation matrix (i.e. unscaled).
       * @param {boolean} [update=true] - Whether the internal `onChange` callback should be executed or not
       * @param {number} t - The interpolation factor in the closed interval `[0, 1]`.
       * @param {Array<number>} [array=[]] - The target array holding the quaternion components.
       */

      const splitDescription = trimmed.split(" - ");

      const parameterSegment = splitDescription[0];
      //"@param {boolean} [update=true]"

      const descriptionSegment = splitDescription[1] || "";

      const typeAndName = parameterSegment
        .replace("@param", "")
        .trim()
        .split(" ");
      //typeAndName[0] = "{boolean}"; typeAndName[1] = "[update=true]" || "t"

      const [, type] = typeAndName[0].match(/\{?([^}]+)\}/) || [];

      const nameSection = typeAndName[1].trim();

      const nameAndDefault = nameSection
        .match(/\[?([^}]+)\]/)?.[1]
        .split("=") || [typeAndName[1]];
      // nameAndDefault[0] = "update" || "m"; nameAndDefault[1] = "true" || undefined

      const name = nameAndDefault[0].trim();

      let defaultValue = undefined;
      if (nameAndDefault[1]) {
        try {
          const trimmedDefault = nameAndDefault[1].trim();
          defaultValue = nameAndDefault[1]
            ? JSON.parse(trimmedDefault)
            : undefined;
        } catch (e) {
          console.warn(
            `⚠️  Warning: Could not parse default value for parameter "${name}": ${nameAndDefault[1]}`
          );
        }
      }

      const optional = !!nameAndDefault[1];

      const typeFormated = type.charAt(0).toUpperCase() + type.slice(1);

      //TODO handle union types like "Number|Array"
      const firstType = typeFormated.split("|")[0];
      if (typeFormated.includes("|")) {
        console.warn(
          `⚠️  Warning: Parameter "${name}" has a union type "${typeFormated}". Using first type "${firstType}".`
        );
      }

      parameters.push({
        name,
        type: firstType,
        optional,
        defaultValue,
        description: descriptionSegment.trim(),
        isMutated: false, //default value, will be updated later if needed
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

  return {
    description,
    parameters,
    returnType: returns?.type,
    returnDescription: returns?.description,
  };
}

function generateRandomValue(
  type: ValueTypeName,
  shift: number,
  className: ClassNames
): ValueType {
  switch (type) {
    // @ts-ignore
    case "Number":
      const val = Math.round(Math.random() * 10 + shift);
      //handle setComponent for vectors (take value between 0 and dimension-1)
      if (className === "Vector2") return val % 2;
      if (className === "Vector3") return val % 3;
      // @ts-ignore
      if (className === "Vector4") return val % 4;
      return val;
    case "Vector2":
      return new Vector2(
        Math.random() * 10 + shift,
        Math.random() * 10 + shift
      );
    case "Vector3":
      return new Vector3(
        Math.random() * 10 + shift,
        Math.random() * 10 + shift,
        Math.random() * 10 + shift
      );
    // @ts-ignore
    case "Vector4":
      return new Vector4(
        Math.random() * 10 + shift,
        Math.random() * 10 + shift,
        Math.random() * 10 + shift,
        Math.random() * 10 + shift
      );
    case "Quaternion":
      return new Quaternion().setFromEuler(
        new Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        )
      );
    case "Euler":
      return new Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
    case "Matrix4":
      return new Matrix4().makeRotationFromEuler(
        new Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        )
      );
    case "Matrix3":
      return new Matrix3().setFromMatrix4(
        new Matrix4().makeRotationFromEuler(
          new Euler(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          )
        )
      );
    // @ts-ignore
    case "Boolean":
      return Math.random() > 0.5;
    default:
      throw new Error(`Unsupported type for random value generation: ${type}`);
  }
}

/**
 * Extract methods from a JavaScript class file
 */
async function extractMethodsFromFile(
  filePath: string,
  className: string
): Promise<EquationSignatureCandidate[]> {
  if (!THREE) throw new Error("THREE is not defined");

  const content = readFileSync(filePath, "utf-8");
  const methods: EquationSignatureCandidate[] = [];

  // For MathUtils, use a different regex to match free functions
  // For classes, match method definitions
  const isMathUtils = className === "MathUtils";

  const methodRegex = isMathUtils
    ? /\/\*\*([\s\S]*?)\*\/\s*function\s+(\w+)\s*\(([^)]*)\)\s*\{/g
    : /\/\*\*([\s\S]*?)\*\/\s*(\w+)\s*\(([^)]*)\)\s*\{/g;

  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    const [, jsDocContent, methodName] = match;

    // Skip constructor and private methods
    if (!isMathUtils) {
      if (isExcludedMethodName(methodName)) {
        continue;
      }
    }

    const parsed: Partial<EquationSignatureCandidate> =
      parseJSDoc(jsDocContent);

    parsed.parameters = parsed.parameters || [];

    // Determine return type
    const returnType = parsed.returnType || "void";

    if (!(THREE as any)[className]) {
      throw new Error(
        `Class ${className} not found in imported module from ${filePath}`
      );
    }

    methods.push({
      className,
      methodName,
      description: parsed.description
        ? enrichDescriptionWithLinks(parsed.description, "en")
        : "",
      parameters: (parsed.parameters || []).map((param) => ({
        ...param,
        description: param.description
          ? enrichDescriptionWithLinks(param.description, "en")
          : undefined,
      })),
      returnType,
      returnDescription: parsed.returnDescription
        ? enrichDescriptionWithLinks(parsed.returnDescription, "en")
        : undefined,
      equationType: {},
    });
  }
  return methods;
}

function methodActuallyRuns(
  candidate: EquationSignatureCandidate
): EquationSignature | null {
  const className = candidate.className;
  const methodName = candidate.methodName;
  // Classify method type
  let EquationType: EquationType;
  let isStatic = false;
  let isMutatingInvoker = false;
  let isMutatingParameter = false;
  let isReturningInstance = false;
  let isPureFunction = false;

  const classRef = (THREE as any)[className];
  //check if method is static
  isStatic = typeof classRef[methodName] === "function";
  let invoker;
  if (!isStatic) {
    invoker = generateRandomValue(
      ValueTypeName[className as keyof typeof ValueTypeName],
      0,
      className as ClassNames
    );
  } else {
    invoker = classRef;
  }

  let parameters = candidate.parameters?.map(
    (p: EquationParameterCandidate, i) => {
      let type = p.type;
      type = type.split("|")[0]; //handle union types by taking the first type
      return generateRandomValue(
        ValueTypeName[type as keyof typeof ValueTypeName],
        i,
        className as ClassNames
      );
    }
  );

  try {
    const oldInvoker = isStatic ? invoker : invoker.clone();
    const oldParameters = parameters.map((p: any) => {
      if (p.clone) return p.clone();
      return p;
    });

    const method = invoker[methodName];

    const resultValue = method.apply(invoker, parameters);

    // Check if invoker was mutated
    isMutatingInvoker = invoker.equals
      ? !invoker.equals(oldInvoker)
      : invoker !== oldInvoker;

    // Check for all and return if at least one is mutated
    isMutatingParameter = parameters
      .map((p: any, index: number) => {
        let hasChanged;
        if (p.equals) {
          hasChanged = !p.equals(oldParameters[index]);
        } else {
          hasChanged = p !== oldParameters[index];
        }
        if (hasChanged) {
          //mark parameter as mutated in parsed data
          candidate.parameters![index].isMutated = true;
        }
        return hasChanged;
      })
      .some((v) => v);

    // Check if method returns the instance
    isReturningInstance = resultValue === invoker;

    isPureFunction =
      !isMutatingInvoker &&
      !isMutatingParameter &&
      !isReturningInstance &&
      resultValue !== undefined;

    return {
      ...candidate,
      className: candidate.className as ClassNames,
      returnType: candidate.returnType as ValueTypeName,
      parameters: candidate.parameters.map((p) => ({
        ...p,
        type: p.type as ValueTypeName,
      })),
      equationType: {
        isStatic,
        isMutatingInvoker,
        isMutatingParameter,
        isReturningInstance,
        isPureFunction,
      },
    };
  } catch (error) {
    console.error(
      `   ❌ Error running method ${className}.${methodName}:`,
      error
    );
    return null;
  }
}

/**
 * Map  js types to our supported types
 */
function mapTypeToSupported(type: string): ValueTypeName | null {
  const cleaned = type
    .replace(/\s+/g, "")
    .replace(/\[/g, "")
    .replace(/\]/g, "");

  //TODO
  // @ts-ignore
  if (
    ValueTypeName?.Number &&
    (cleaned === "number" || cleaned === "float" || cleaned === "integer")
  ) {
    // @ts-ignore
    return ValueTypeName.Number;
  }
  // @ts-ignore
  if (ValueTypeName?.Boolean && (cleaned === "boolean" || cleaned === "bool")) {
    // @ts-ignore
    return ValueTypeName.Boolean;
  }
  //use ValueTypeName enums
  if (ValueTypeName[cleaned as keyof typeof ValueTypeName]) {
    return ValueTypeName[cleaned as keyof typeof ValueTypeName];
  }

  return null;
}

/**
 * Filter methods that are useful for equation database
 */
function hasAllTypesSupported(method: EquationSignatureCandidate): boolean {
  // Must return a supported type
  const returnType = mapTypeToSupported(method.returnType || "");
  if (!returnType) return false;

  // Must have supported parameter types
  const allParametersSupported = (method.parameters || []).every((p) => {
    return mapTypeToSupported(p.type) !== null || p.optional;
  });

  return allParametersSupported;
}

/**
 * Main generation function
 */
async function generateEnhancedDatabase() {
  console.log("🔍 Analyzing  js source code...\n");

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

  const allMethods: Array<EquationSignature> = [];

  for (const { file, className } of classFiles) {
    const filePath = join(mathFolder, file);
    console.log(`📊 Analyzing ${className}...`);

    try {
      const methods: Array<EquationSignatureCandidate> =
        await extractMethodsFromFile(filePath, className);
      const supportedMethods: Array<EquationSignatureCandidate> =
        methods.filter(hasAllTypesSupported) as Array<EquationSignature>;
      const fullMethods: Array<EquationSignature> = supportedMethods
        .map((m) => methodActuallyRuns(m))
        .filter((m): m is EquationSignature => m !== null);

      console.log(
        `   Found ${methods.length} methods, ${fullMethods.length} useful`
      );

      allMethods.push(...fullMethods);
    } catch (error) {
      console.error(`   ❌ Error processing ${file}:`, error);
    }
  }

  // Create enhanced database
  const database: EnhancedEquationDatabase = {
    version: "2.0.0",
    generatedAt: new Date().toISOString(),
    source: " js source code analysis",
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
  const allDescriptions = allMethods.flatMap(
    (m) =>
      [
        m.description,
        ...(m.parameters.map((p) => p.description).filter(Boolean) as string[]),
        m.returnDescription,
      ].filter(Boolean) as string[]
  );

  const termStats = getTermUsageStats(allDescriptions);
  if (termStats.size > 0) {
    console.log(
      `\n🔗 Wikipedia links added for ${termStats.size} technical terms:`
    );
    Array.from(termStats.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([term, count]) => {
        console.log(`   "${term}": ${count} occurrence${count > 1 ? "s" : ""}`);
      });
  }

  /*
  type EquationType = {
    isStatic: boolean; // true for static methods (e.g., MathUtils), false for instance methods
    isMutatingInvoker: boolean; // true if the method mutates the instance (this), false otherwise
    isMutatingParameter: boolean; // true if the method mutates any of its parameters, false otherwise
    isReturningInstance: boolean; // true if the method returns the instance (this), false otherwise
    isPureFunction: boolean; // true if the method does not mutate any input and returns a new value, false otherwise
  };

  */

  // Print statistics by method type
  const byType = allMethods.reduce((acc, method) => {
    acc["static"] =
      (acc["static"] || 0) + (method.equationType.isStatic ? 1 : 0);
    acc["mutatingInvoker"] =
      (acc["mutatingInvoker"] || 0) +
      (method.equationType.isMutatingInvoker ? 1 : 0);
    acc["mutatingParameter"] =
      (acc["mutatingParameter"] || 0) +
      (method.equationType.isMutatingParameter ? 1 : 0);
    acc["returningInstance"] =
      (acc["returningInstance"] || 0) +
      (method.equationType.isReturningInstance ? 1 : 0);
    acc["pureFunction"] =
      (acc["pureFunction"] || 0) + (method.equationType.isPureFunction ? 1 : 0);
    return acc;
  }, {} as Record<string, number>);

  console.log(`\n📊 Statistics by method type:`);
  Object.entries(byType)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      let icon;
      switch (type) {
        case "static":
          icon = "📌";
          break;
        case "mutatingInvoker":
          icon = "🔧";
          break;
        case "mutatingParameter":
          icon = "⚙️ ";
          break;
        case "returningInstance":
          icon = "🔄";
          break;
        case "pureFunction":
          icon = "✨";
          break;
        default:
          icon = "❓";
      }
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
    const parameters = method.parameters
      .map((p) => `${p.name}: ${p.type}`)
      .join(", ");
    console.log(
      `   ${method.className}.${method.methodName}(${parameters}) → ${method.returnType}`
    );
    console.log(`      ${method.description}`);
  });
}

// Run the generation
generateEnhancedDatabase().catch(console.error);
