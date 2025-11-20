import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh } from "three";
import { AMBox } from "../components/box";

export default function RotatingCube({ speed = 1 }: { speed?: number }) {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * speed;
      meshRef.current.rotation.y += delta * speed * 0.5;
    }
  });

  return (
    <>
      <AMBox ref={meshRef} position={[0, 0, 0]} type="wall" color="" />
    </>
  );
}
