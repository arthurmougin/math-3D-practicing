import {
  Environment,
  GizmoHelper,
  GizmoViewport,
  Grid,
  Helper,
  Plane,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import {
  DirectionalLight,
  DirectionalLightHelper,
  DoubleSide,
  Vector3,
} from "three";
import "./App.css";
import { AMCamera } from "./components/camera";
import RotatingCube from "./visualisations/rotatingCube";

function App() {
  const sunPosition = new Vector3(15, 10, 10);
  const light = useRef<DirectionalLight>(null!);
  return (
    <>
      <Canvas style={{ height: "100vh", width: "100vw" }} shadows="percentage">
        <AMCamera />
        <directionalLight position={sunPosition} ref={light} castShadow={true}>
          <Helper type={DirectionalLightHelper} args={[5]} />
        </directionalLight>

        <group position={[0.5, 1.5, 0.5]}>
          <RotatingCube />
        </group>

        <axesHelper position={[0, 0.001, 0]} />
        <GizmoHelper
          alignment="bottom-right" // widget alignment within scene
          margin={[80, 80]} // widget margins (X, Y)
        >
          <GizmoViewport
            axisColors={["red", "green", "blue"]}
            labelColor="black"
          />
        </GizmoHelper>
        <Grid
          infiniteGrid={true}
          followCamera={false}
          fadeDistance={50}
          side={DoubleSide}
          sectionColor={"green"}
        />
        <Plane
          position={[0, -0.0015, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={1000}
          receiveShadow
        >
          <shadowMaterial opacity={0.5} />
        </Plane>
        {/*<Sky
          distance={450000}
          sunPosition={sunPosition}
          inclination={0}
          azimuth={0.25}
        />*/}
        <Environment
          background
          files="./assets/autumn_field_puresky_2k.hdr"
        ></Environment>
      </Canvas>
    </>
  );
}

export default App;
