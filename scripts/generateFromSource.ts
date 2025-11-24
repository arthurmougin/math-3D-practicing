import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { enrichDescriptionWithLinks, getTermUsageStats } from "./technicalTerms";
import * as THREE from 'three';
import { EnhancedEquationDatabase, EquationParameter, EquationSignature, EquationType, ValueTypeName } from "../types/types.d";

type EquationParameterCandidate = Omit<EquationParameter, "type"> & {type: string};
type EquationTypeCandidate = Partial<EquationType>;
type EquationSignatureCandidate = Omit<EquationSignature, "className" | "methodName" | "parameters" | "returnType" | "equationType"> & {
  className: string;
  methodName: string;
  parameters: EquationParameterCandidate[];
  returnType: string;
  equationType: EquationTypeCandidate;
};

export function isExcludedMethodName(methodName: string): boolean {
  return methodName.includes("Array")||
        methodName.includes("Buffer")||
        methodName.includes("random")||
        methodName.startsWith("_") ||
        methodName === "constructor" ||
        methodName === "set" ||
        methodName === "copy" ||
        methodName === "clone" ||
        methodName === "toJSON" ||
        methodName === "fromJSON" ||
        methodName === "generateUUID" ||
        methodName === "seededRandom"
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
    const trimmed = line.trim().split("\*")?.[1]?.trim() || "";

    if(trimmed.length === 0){
      continue;
    }

    // Description (before any @tags)
    if (!trimmed.startsWith("@") && trimmed) {
      //if description already has content, add a space before appending
      description += (description != "" ? " " : "") + trimmed;
      continue;
    }

    // @param tag with description
    const paramMatch = trimmed.includes("@param")
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

      const typeAndName = parameterSegment.replace("@param", "").trim().split(" "); 
      //typeAndName[0] = "{boolean}"; typeAndName[1] = "[update=true]" || "t"

      const [,type] = typeAndName[0].match(/\{?([^}]+)\}/) || [];

      const nameSection = typeAndName[1].trim();

      const nameAndDefault = nameSection.match(/\[?([^}]+)\]/)?.[1].split("=") || [typeAndName[1]]; 
      // nameAndDefault[0] = "update" || "m"; nameAndDefault[1] = "true" || undefined

      const name = nameAndDefault[0].trim();

      const defaultValue =  nameAndDefault[1] ? JSON.parse(nameAndDefault[1].trim()) : undefined;

      const optional = !!nameAndDefault[1];

      //number -> Number
      const typeFormated = type.charAt(0).toUpperCase() + type.slice(1);

      //TODO handle union types like "Number|Array"
      const firstType = typeFormated.split("|")[0];
      if(typeFormated.includes("|")){
        console.warn(`⚠️  Warning: Parameter "${name}" has a union type "${typeFormated}". Using first type "${firstType}".`);
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
    returnDescription: 
    returns?.description  
  };
}

/**
 * Extract methods from a JavaScript class file
 */
async function extractMethodsFromFile(
  filePath: string,
  className: string
): Promise<EquationSignatureCandidate[]> {
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
      if (
        isExcludedMethodName(methodName)
      ) {
        continue;
      }
    }

    const parsed : Partial<EquationSignatureCandidate> = parseJSDoc(jsDocContent);

    parsed.parameters = parsed.parameters || [];

    // Determine return type
    const returnType = parsed.returnType || "void";
    
    // Classify method type
    let EquationType: EquationType;
    let isStatic = false;
    let isMutatingInvoker = false;
    let isMutatingParameter = false;
    let isReturningInstance = false;
    let isPureFunction = false;

    if (THREE && (THREE as any)[className]) {
      const classRef = (THREE as any)[className];
      //check if method is static
      isStatic = typeof classRef[methodName] === "function";
      let invoker;
      if( !isStatic ){
        invoker = new classRef();
      } else{
        invoker = classRef;
      }

      let parameters = parsed.parameters?.map((p: EquationParameterCandidate) => {
        let type = p.type;

        type = type.split("|")[0]; //handle union types by taking the first type


        if(type === "Number"){
          // Vector and matrix component related methods use integer to return the value of one of their properties, 0 points to the first one
          if(methodName.includes("Component")){
            return p.defaultValue || 0;
          }
          else return 10;
        }
        if(type === "Boolean"){
          return p.defaultValue || true;
        }
        if(type === "String"){
          return p.defaultValue || "ZXY";
        }
        return new (THREE as any)[type]();
      });

      const oldInvoker = isStatic ? invoker : invoker.clone();
      const oldParameters = parameters.map((p: any) => {
        if(p.clone) return p.clone();
        return p;
      });

      const method = invoker[methodName];

      const results = method.apply(invoker, parameters);

      // Check if invoker was mutated
      isMutatingInvoker = invoker.equals ? !invoker.equals(oldInvoker) : invoker !== oldInvoker;

      // Check for all and return if at least one is mutated
      isMutatingParameter = parameters.map((p: any, index: number) => {
        let hasChanged;
        if(p.equals){
          hasChanged = !p.equals(oldParameters[index]);
        }
        else {
          hasChanged = p !== oldParameters[index];
        }
        if(hasChanged){
          //mark parameter as mutated in parsed data
          parsed.parameters![index].isMutated = true;
        }
        return hasChanged;
      }).some(v => v);

      // Check if method returns the instance
      isReturningInstance = results === invoker;

      isPureFunction = !isMutatingInvoker && !isMutatingParameter && !isReturningInstance && results !== undefined;
    
    }
    else {
      throw new Error(`Class ${className} not found in imported module from ${filePath}`);
    }

    methods.push({
      className,
      methodName,
      description: parsed.description ? enrichDescriptionWithLinks(parsed.description, "en") : "",
      parameters: (parsed.parameters || []).map(param => ({
        ...param,
        description: param.description ? enrichDescriptionWithLinks(param.description, "en") : undefined
      })),
      returnType,
      returnDescription: parsed.returnDescription 
        ? enrichDescriptionWithLinks(parsed.returnDescription, "en")
        : undefined,
      equationType: {
        isStatic,
        isMutatingInvoker,
        isMutatingParameter,
        isReturningInstance,
        isPureFunction
      }
    });
  }

  return methods;
}

/**
 * Map Three.js types to our supported types
 */
function mapTypeToSupported(type: string): ValueTypeName | null {
  const cleaned = type
    .replace(/\s+/g, "")
    .replace(/\[/g, "")
    .replace(/\]/g, "");

  if (cleaned === "number" || cleaned === "float" || cleaned === "integer") {
    return  ValueTypeName.Number;
  }
  if (cleaned === "boolean" || cleaned === "bool") {
    return ValueTypeName.Boolean;
  }
  //use ValueTypeName enums
  if(ValueTypeName[cleaned as keyof typeof ValueTypeName]){
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

  return allParametersSupported
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

  const allMethods: Array<EquationSignature> = [];

  for (const { file, className } of classFiles) {
    const filePath = join(mathFolder, file);
    console.log(`📊 Analyzing ${className}...`);

    try {
      const methods : Array<EquationSignatureCandidate> = await extractMethodsFromFile(filePath, className);
      const supportedMethods : Array<EquationSignature> = methods.filter(hasAllTypesSupported) as Array<EquationSignature>;

      console.log(
        `   Found ${methods.length} methods, ${supportedMethods.length} useful`
      );

      allMethods.push(...supportedMethods);
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
    acc['static'] = (acc['static'] || 0) + (method.equationType.isStatic ? 1 : 0);
    acc['mutatingInvoker'] = (acc['mutatingInvoker'] || 0) + (method.equationType.isMutatingInvoker ? 1 : 0);
    acc['mutatingParameter'] = (acc['mutatingParameter'] || 0) + (method.equationType.isMutatingParameter ? 1 : 0);
    acc['returningInstance'] = (acc['returningInstance'] || 0) + (method.equationType.isReturningInstance ? 1 : 0);
    acc['pureFunction'] = (acc['pureFunction'] || 0) + (method.equationType.isPureFunction ? 1 : 0);
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`\n📊 Statistics by method type:`);
  Object.entries(byType)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      let icon;
      switch(type){
        case 'static':
          icon = '📌';
          break;
        case 'mutatingInvoker':
          icon = '🔧';
          break;
        case 'mutatingParameter':
          icon = '⚙️ ';
          break;
        case 'returningInstance':
          icon = '🔄';
          break;
        case 'pureFunction':
          icon = '✨';
          break;
        default:
          icon = '❓';
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
