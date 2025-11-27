import { useRef } from "react";
import type { Mesh } from "three";
import type { ScenarioParameter } from "../../../types/types";
import { AMBox } from "../box";
import { ParameterLabel } from "../common/ParameterLabel";
import { PivotControls } from "@react-three/drei";
import { useCameraControlHandlers } from "../../utils/cameraControl";
import { matrix4ToValue, valueToMatrix4 } from "../../utils/parameterHelpers";
import type { Matrix4 } from "three";
import { useScenarioStore } from "../../stores/scenarioStore";

interface ParameterProps {
  parameter: ScenarioParameter;
  onClick?: () => void;
}

/**
 * Visual representation of a scenario parameter in the 3D scene
 * Uses Matrix4 under the hood for all transformations regardless of value type
 */
export function Parameter({ parameter, onClick }: ParameterProps) {
  const { representation, value, type } = parameter;

  if (!representation) {
    return null;
  }

  const meshRef = useRef<Mesh>(null);
  const scenarioStore = useScenarioStore();
  const { disableCameraControl, enableCameraControl } =
    useCameraControlHandlers();

  // Convert value to matrix
  const matrix = valueToMatrix4(value, type);
  function updateParameter(newMatrix: Matrix4) {
    const newValue = matrix4ToValue(newMatrix, value, type);
    scenarioStore.updateParameter(
      scenarioStore.getCurrentScenario()?.id ?? "",
      parameter.id,
      newValue
    );
  }

  /** Allows you to switch individual axes off */
  const activeAxes: [boolean, boolean, boolean] = [true, true, true];
  /** Allows you to disable translation via axes arrows */
  let disableAxes: boolean = false;
  /** Allows you to disable translation via axes planes */
  let disableSliders: boolean = false;
  /** Allows you to disable rotation */
  let disableRotations: boolean = false;
  /** Allows you to disable scaling */
  let disableScaling: boolean = false;

  switch (type) {
    case "Vector3":
      // All controls enabled
      disableRotations = true;
      disableScaling = true;
      break;
    case "Vector2":
      // Disable Z axis
      activeAxes[2] = false;
      disableRotations = true;
      disableScaling = true;
      break;
    // @ts-ignore
    case "Vector4":
      // Disable rotation and scaling for Vector4
      disableRotations = true;
      disableScaling = true;
      break;
    case "Euler":
    case "Quaternion":
      // Disable translation and scaling for rotations
      disableAxes = true;
      disableSliders = true;
      disableScaling = true;
      break;
    case "Matrix4":
      break;
    case "Matrix3":
      // Disable scaling for matrices
      disableScaling = true;
      break;
    // @ts-ignore
    case "Number":
    // @ts-ignore
    case "Boolean":
      // Disable all but one axis for numbers and booleans
      activeAxes[1] = false;
      activeAxes[2] = false;
      disableRotations = true;
      disableScaling = true;
      break;
    default:
      throw new Error(`Unsupported parameter type for visualization: ${type}`);
  }

  // Render based on representation type
  switch (representation.type) {
    case "cube":
      return (
        <PivotControls
          matrix={matrix}
          onDragEnd={() => enableCameraControl()}
          onDrag={updateParameter}
          onDragStart={() => disableCameraControl()}
          activeAxes={activeAxes}
          disableAxes={disableAxes}
          disableSliders={disableSliders}
          disableRotations={disableRotations}
          disableScaling={disableScaling}
          depthTest={false}
        >
          <ParameterLabel
            text={parameter.name}
            position={[0, 0.9, 0]}
            borderColor={representation.color}
            useSuspense={false}
          />
          <AMBox
            ref={meshRef}
            color={representation.color}
            onClick={onClick}
            scale={0.5}
          />
        </PivotControls>
      );

    case "vertex":
      return (
        <PivotControls
          matrix={matrix}
          onDragEnd={() => enableCameraControl()}
          onDrag={updateParameter}
          onDragStart={() => disableCameraControl()}
          activeAxes={activeAxes}
          disableAxes={disableAxes}
          disableSliders={disableSliders}
          disableRotations={disableRotations}
          disableScaling={disableScaling}
        >
          <ParameterLabel
            text={parameter.name}
            position={[0.5, 0.5, 0.5]}
            borderColor={representation.color}
            useSuspense={true}
          />
        </PivotControls>
      );

    default:
      throw new Error(`Unknown representation type: ${representation.type}`);
  }
}
