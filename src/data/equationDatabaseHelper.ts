
import type { MathDataType } from "../types";
import equationDatabase from "./equationDatabase.source.json";

/**
 * Types supported in our system
 */
export type SupportedType =
  | "Vector3"
  | "Vector2"
  | "Vector4"
  | "Quaternion"
  | "Euler"
  | "Matrix4"
  | "Matrix3"
  | "number"
  | "boolean";

/**
 * Method parameter from source analysis
 */
export interface MethodParameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
  description?: string;
}

/**
 * Method type classification
 */
export type MethodType = 'calculation' | 'transformation' | 'mutation';

/**
 * Method signature with documentation (NEW FORMAT)
 */
export interface MethodSignature {
  className: string;
  methodName: string;
  description: string;
  parameters: MethodParameter[];
  returnType: string;
  returnDescription?: string;
  example?: string;
  methodType: MethodType;
  mutatesThis: boolean;
}

/**
 * Enhanced equation database (NEW FORMAT)
 */
export interface EnhancedEquationDatabase {
  version: string;
  generatedAt: string;
  source: string;
  methods: MethodSignature[];
}

// Legacy format (OLD)
export interface EquationSignature {
  className: SupportedType;
  methodName: string;
  parameters: SupportedType[];
  returnType: SupportedType | "void" | "unknown";
  isStatic: boolean;
}

// Type-safe cast of the imported JSON
const db = equationDatabase as EnhancedEquationDatabase;

/**
 * Get the type name from a MathDataType value
 */
export function getTypeName(value: MathDataType): SupportedType {
  if (typeof value === "number") return "number";
  return value.constructor.name as SupportedType;
}

/**
 * Normalize type names for comparison
 */
function normalizeType(type: string): string {
  return type.replace(/\s+/g, "").toLowerCase();
}

/**
 * Find all methods that match the given parameter types
 * @param parameterTypes - Array of parameter types to match
 * @returns Array of matching method signatures
 */
export function findEquationsByParameters(
  parameterTypes: SupportedType[]
): MethodSignature[] {
  return db.methods.filter((method) => {
    // Filter out optional parameters for matching
    const requiredParams = method.parameters.filter((p) => !p.optional);

    if (requiredParams.length !== parameterTypes.length) return false;

    return requiredParams.every((param, i) => {
      const paramType = normalizeType(param.type);
      const targetType = normalizeType(parameterTypes[i]);
      return paramType === targetType;
    });
  });
}

/**
 * Find all methods that return a specific type
 * @param returnType - The return type to match
 * @returns Array of matching method signatures
 */
export function findEquationsByReturnType(
  returnType: SupportedType
): MethodSignature[] {
  return db.methods.filter(
    (method) => normalizeType(method.returnType) === normalizeType(returnType)
  );
}

/**
 * Find all methods for a specific class
 * @param className - The class name to match
 * @returns Array of matching method signatures
 */
export function findEquationsByClass(
  className: SupportedType
): MethodSignature[] {
  return db.methods.filter((method) => method.className === className);
}

/**
 * Find methods that match parameters and return type
 * @param parameterTypes - Array of parameter types
 * @param returnType - The return type
 * @returns Array of matching method signatures
 */
export function findEquations(
  parameterTypes: SupportedType[],
  returnType?: SupportedType
): MethodSignature[] {
  let results = findEquationsByParameters(parameterTypes);

  if (returnType) {
    results = results.filter(
      (method) => normalizeType(method.returnType) === normalizeType(returnType)
    );
  }

  return results;
}

/**
 * Get a unique signature string for a method
 */
export function getEquationSignatureString(method: MethodSignature): string {
  const params = method.parameters
    .map((p) => `${p.name}: ${p.type}`)
    .join(", ");
  return `${method.className}.${method.methodName}(${params}): ${method.returnType}`;
}

/**
 * Get all unique method names in the database
 */
export function getAllMethodNames(): string[] {
  const names = new Set(db.methods.map((method) => method.methodName));
  return Array.from(names).sort();
}

/**
 * Find methods by method name
 */
export function findEquationsByMethodName(
  methodName: string
): MethodSignature[] {
  return db.methods.filter((method) => method.methodName === methodName);
}

/**
 * Get statistics about the database
 */
export function getDatabaseStats() {
  const byClass = db.methods.reduce((acc, method) => {
    acc[method.className] = (acc[method.className] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byMethod = db.methods.reduce((acc, method) => {
    acc[method.methodName] = (acc[method.methodName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: db.methods.length,
    byClass,
    byMethod,
    version: db.version,
    generatedAt: db.generatedAt,
    source: db.source,
  };
}
