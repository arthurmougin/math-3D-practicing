import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh } from "three";
import { AMBox } from "../components/box";

export default function RotatingCube() {
  const meshRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <>
      <AMBox ref={meshRef} position={[0, 0, 0]} color="blue" />
    </>
  );
}
