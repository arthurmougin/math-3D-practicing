import { useRef } from "react";
import { Color, Matrix4, Vector3, type Mesh } from "three";
import { AMBox } from "../box";
import type { ScenarioResult } from "../../../types/types";
import { TextLabel } from "../common/TextLabel";
import { valueToMatrix4 } from "../../utils/parameterHelpers";

interface resultProps {
  result: ScenarioResult;
  onClick?: () => void;
  opacity?: number; // Optional opacity for showing expected result
}

/**
 * Visual representation of a scenario result in the 3D scene
 * Uses Matrix4 under the hood for all transformations regardless of value type
 * Can be rendered with transparency to show expected result
 */
export function Result({ result, onClick, opacity = 1 }: resultProps) {
  const { representation, value, type } = result;
  const meshRef = useRef<Mesh>(null);
  const matrix = new Matrix4();
  if (!representation) {
    return null;
  }

  // Convert value to matrix
  valueToMatrix4(value, matrix, type);

  // Render based on representation type
  switch (representation.type) {
    case "cube":
      return (
        <group matrix={matrix} matrixAutoUpdate={false}>
          <TextLabel
            text="Result"
            position={[0, 0.8, 0]}
            borderColor={representation.color}
            useSuspense={false}
          />
          <AMBox
            ref={meshRef}
            color={representation.color}
            onClick={onClick}
            scale={0.5}
          >
            <meshStandardMaterial
              color={representation.color}
              transparent={opacity < 1}
              opacity={opacity}
            />
          </AMBox>
        </group>
      );

    case "vertex":
      const representationColor = new Color(representation.color);
      const dimmedColor = representationColor.multiplyScalar(0.2);
      const xColor = new Color(0xff0000).add(dimmedColor);
      const yColor = new Color(0x00ff00).add(dimmedColor);
      const zColor = new Color(0x0000ff).add(dimmedColor);
      return (
        <group matrix={matrix} matrixAutoUpdate={false}>
          <TextLabel
            text="Result"
            position={[0, 0.3, 0]}
            borderColor={representation.color}
            useSuspense={true}
          />
          <mesh>
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
        </group>
      );

    default:
      return null;
  }
}
