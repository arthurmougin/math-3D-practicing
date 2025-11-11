import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useCameraStore } from "../stores/cameraStore";
export const AMCamera = () => {
  const orbitRef = useRef<OrbitControlsImpl>(null!);
  const defaultPosition = new Vector3(0, 5, 7);

  const cameraStore = useCameraStore();

  useEffect(() => {
    console.log(cameraStore.target, orbitRef.current);
    orbitRef.current.position0 = defaultPosition.add(cameraStore.target);
    orbitRef.current.reset();
    orbitRef.current.target = cameraStore.target;

    return () => {
      // Cleanup
    };
  }, [cameraStore]);
  return (
    <>
      <PerspectiveCamera makeDefault position={defaultPosition}>
        <OrbitControls
          ref={orbitRef}
          makeDefault
          maxDistance={20}
          minDistance={1.5}
        />
      </PerspectiveCamera>
    </>
  );
};
