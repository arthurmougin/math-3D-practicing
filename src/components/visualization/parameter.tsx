import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ScenarioParameter } from "../../../types/types";
import { AMBox } from "../box";
import { PivotControls } from "@react-three/drei";
import { useCameraControlHandlers } from "../../utils/cameraControl";
import { matrix4ToValue, valueToMatrix4 } from "../../utils/parameterHelpers";
import { Matrix4, Vector3 } from "three";
import { useIndividualScenarioStore } from "../../stores/individualScenarioStore";
import { invalidate } from "@react-three/fiber";
import { TextLabel } from "../common/TextLabel";

interface ParameterProps {
  parameter: ScenarioParameter;
  onClick?: () => void;
}

/**
 * Visual representation of a scenario parameter in the 3D scene
 * Uses Matrix4 under the hood for all transformations regardless of value type
 */
export function Parameter({ parameter, onClick }: ParameterProps) {
  const { representation, value, type, position } = parameter;

  if (!representation) {
    return null;
  }

  // Stores
  const individualScenarioStore = useIndividualScenarioStore();
  const { disableCameraControl, enableCameraControl } =
    useCameraControlHandlers();

  const matrix = useRef(new Matrix4());

  const [activeAxes, setActiveAxes] = useState<[boolean, boolean, boolean]>([
    true,
    true,
    true,
  ]);
  const [disableAxes, setDisableAxes] = useState(false);
  const [disableSliders, setDisableSliders] = useState(false);
  const [disableRotations, setDisableRotations] = useState(true);
  const [disableScaling, setDisableScaling] = useState(true);

  const localTextPosition = useRef<[number, number, number]>([0, 1.2, 0]);
  const [worldTextPosition, setWorldTextPosition] = useState(new Vector3());

  // Computation Effect
  useEffect(() => {
    console.log("Updating parameter matrix for", parameter.name);
    valueToMatrix4(value, matrix.current, type, position);
  }, [value, matrix, position]);

  function updateParameter(newMatrix: Matrix4) {
    console.log("Updating parameter value for", parameter.name);
    const newValue = matrix4ToValue(newMatrix, value, type, position);
    individualScenarioStore.updateParameter(parameter.id, newValue);
    updateWorldTextPosition();
  }

  // Type Effect
  useEffect(() => {
    switch (type) {
      case "Vector3":
        // All controls enabled
        setActiveAxes([true, true, true]);
        setDisableAxes(false);
        setDisableSliders(false);
        setDisableRotations(true);
        setDisableScaling(true);
        localTextPosition.current = [0, 1.2, 0];
        break;
      case "Vector2":
        // Disable Z axis
        setActiveAxes([true, false, true]);
        setDisableAxes(false);
        setDisableSliders(false);
        setDisableRotations(true);
        setDisableScaling(true);
        localTextPosition.current = [0, 0.3, 0];
        break;
      // @ts-ignore
      case "Vector4":
        // Disable rotation and scaling for Vector4
        setActiveAxes([true, true, true]);
        setDisableAxes(false);
        setDisableSliders(false);
        setDisableRotations(true);
        setDisableScaling(true);
        localTextPosition.current = [0, 1.2, 0];
        break;
      case "Euler":
      case "Quaternion":
        // Disable translation and scaling for rotations
        setActiveAxes([true, true, true]);
        setDisableAxes(true);
        setDisableSliders(true);
        setDisableRotations(false);
        setDisableScaling(true);
        localTextPosition.current = [0, 1.2, 0];
        break;
      case "Matrix4":
        setActiveAxes([true, true, true]);
        setDisableAxes(false);
        setDisableSliders(false);
        setDisableRotations(false);
        setDisableScaling(false);
        localTextPosition.current = [0, 1.2, 0];
        break;
      case "Matrix3":
        // Disable scaling for matrices
        setActiveAxes([true, true, true]);
        setDisableAxes(false);
        setDisableSliders(false);
        setDisableRotations(false);
        setDisableScaling(false);
        localTextPosition.current = [0, 1.2, 0];
        break;
      // @ts-ignore
      case "Number":
      // @ts-ignore
      case "Boolean":
        // Disable all but one axis for numbers and booleans
        setActiveAxes([true, false, false]);
        setDisableAxes(false);
        setDisableSliders(true);
        setDisableRotations(true);
        setDisableScaling(true);
        localTextPosition.current = [0, 1.2, 0];
        break;
      default:
        throw new Error(
          `Unsupported parameter type for visualization: ${type}`
        );
    }
  }, [type]);

  function updateWorldTextPosition() {
    console.log("Updating world text position");
    worldTextPosition.setFromMatrixPosition(matrix.current);
    worldTextPosition.x += localTextPosition.current[0];
    worldTextPosition.y += localTextPosition.current[1];
    worldTextPosition.z += localTextPosition.current[2];
    setWorldTextPosition(worldTextPosition);
  }
  // Text position effect
  useEffect(updateWorldTextPosition, [matrix, localTextPosition]);

  // Render based on representation type
  return (
    <>
      <PivotControls
        matrix={matrix.current}
        onDragEnd={() => enableCameraControl()}
        onDrag={updateParameter}
        onDragStart={() => disableCameraControl()}
        activeAxes={activeAxes}
        disableAxes={disableAxes}
        disableSliders={disableSliders}
        disableRotations={disableRotations}
        disableScaling={disableScaling}
      >
        {representation.type == "cube" && (
          <AMBox
            color={representation.color}
            onClick={onClick}
            scale={0.5}
          ></AMBox>
        )}
      </PivotControls>
      <TextLabel
        text={parameter.name}
        position={worldTextPosition.toArray()}
        borderColor={representation.color}
        useSuspense={false}
      />
    </>
  );
}
