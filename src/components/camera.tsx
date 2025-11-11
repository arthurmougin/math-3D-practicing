import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useCameraStore } from "../stores/cameraStore";

export const AMCamera = () => {
  const orbitRef = useRef<OrbitControlsImpl>(null!);
  const defaultPosition = new Vector3(3, 3, 4);
  const cameraStore = useCameraStore();

  useEffect(() => {
    if (orbitRef.current) {
      console.log("Camera target updated:", cameraStore.target);
      orbitRef.current.position0 = defaultPosition.add(cameraStore.target);
      orbitRef.current.reset();
      orbitRef.current.target = cameraStore.target;
    }
  }, [cameraStore.target]);

  return (
    <OrbitControls
      ref={orbitRef}
      target={cameraStore.target}
      maxDistance={20}
      minDistance={1.5}
      enableRotate={true}
      enablePan={true}
      enableZoom={true}
    />
  );
};
