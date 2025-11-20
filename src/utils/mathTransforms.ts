import { Euler, Matrix4, Quaternion, Vector3 } from "three";

/**
 * Converts any valueType to a Matrix4 for unified transformation handling
 * 
 * @param value - The value to convert (Vector3, Quaternion, Euler, Matrix4, number[], or number)
 * @returns A Matrix4 representing the transformation
 * 
 * @example
 * ```ts
 * const vec = new Vector3(1, 2, 3);
 * const matrix = valueToMatrix4(vec); // Translation matrix
 * 
 * const quat = new Quaternion(0, 0, 0, 1);
 * const matrix2 = valueToMatrix4(quat); // Rotation matrix
 * ```
 */
export function valueToMatrix4(value: unknown): Matrix4 {
  const matrix = new Matrix4();

  if (value instanceof Matrix4) {
    // Already a matrix
    return value.clone();
  }

  if (value instanceof Vector3) {
    // Vector3 -> translation matrix
    matrix.makeTranslation(value.x, value.y, value.z);
    return matrix;
  }

  if (value instanceof Quaternion) {
    // Quaternion -> rotation matrix
    matrix.makeRotationFromQuaternion(value);
    return matrix;
  }

  if (value instanceof Euler) {
    // Euler -> rotation matrix
    matrix.makeRotationFromEuler(value);
    return matrix;
  }

  if (Array.isArray(value)) {
    if (value.length === 3) {
      // [x, y, z] -> translation matrix
      matrix.makeTranslation(value[0], value[1], value[2]);
      return matrix;
    }
    if (value.length === 16) {
      // Array of 16 elements -> matrix elements
      matrix.fromArray(value);
      return matrix;
    }
  }

  // Default: identity matrix at origin
  return matrix;
}
