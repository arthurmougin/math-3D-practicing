import { useRef } from "react";
import type { Mesh } from "three";
import {
  ArrowHelper,
  BoxHelper,
  Color,
  Euler,
  Group,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";
import type { ScenarioParameter } from "../types";
import { AMBox } from "./box";
import { Helper } from "@react-three/drei";
import { VertexNormalsHelper } from "three/examples/jsm/Addons.js";

interface ParameterProps {
  parameter: ScenarioParameter;
  onClick?: () => void;
}

/**
 * Converts any MathDataType to a Matrix4 for unified transformation handling
 */
function valueToMatrix4(value: unknown): Matrix4 {
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

/**
 * Visual representation of a scenario parameter in the 3D scene
 * Uses Matrix4 under the hood for all transformations regardless of value type
 */
export function Parameter({ parameter, onClick }: ParameterProps) {
  const { representation, value } = parameter;
  const meshRef = useRef<Mesh>(null);

  // Convert value to matrix
  const matrix = valueToMatrix4(value);

  const representationColor = new Color(representation.color);
  const dimmedColor = representationColor.multiplyScalar(0.2);
  const xColor = new Color(0xff0000).add(dimmedColor);
  const yColor = new Color(0x00ff00).add(dimmedColor);
  const zColor = new Color(0x0000ff).add(dimmedColor);

  // Render based on representation type
  switch (representation.type) {
    case "cube":
      return (
        <AMBox
          ref={meshRef}
          matrix={matrix}
          matrixAutoUpdate={false}
          color={representation.color}
          onClick={onClick}
          scale={0.5}
        />
      );

    case "vertex":
      return (
        <mesh matrix={matrix} matrixAutoUpdate={false}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color={representation.color} />
          <arrowHelper
            args={[
              new Vector3(1, 0, 0),
              new Vector3(0, 0, 0),
              1,
              xColor,
              0.1,
              0.05,
            ]}
          />
          <arrowHelper
            args={[
              new Vector3(0, 1, 0),
              new Vector3(0, 0, 0),
              1,
              yColor,
              0.1,
              0.05,
            ]}
          />
          <arrowHelper
            args={[
              new Vector3(0, 0, 1),
              new Vector3(0, 0, 0),
              1,
              zColor,
              0.1,
              0.05,
            ]}
          />
        </mesh>
      );

    default:
      return null;
  }
}
