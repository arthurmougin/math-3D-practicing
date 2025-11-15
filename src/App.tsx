import {
  Environment,
  GizmoHelper,
  GizmoViewport,
  Grid,
  Plane,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Fullscreen } from "@react-three/uikit";
import { useRef } from "react";
import { DirectionalLight, DoubleSide, Vector3 } from "three";
import "./App.css";
import { AMCamera } from "./components/camera";
import { ScenarioCreator } from "./components/creation/scenarioCreator";
import { ScenarioVisualization } from "./components/scenarioVisualization";

function App() {
  const sunPosition = new Vector3(15, 10, 10);
  const light = useRef<DirectionalLight>(null!);
  return (
    <>
      <Canvas
        style={{ height: "100vh", width: "100vw", touchAction: "none" }}
        shadows="percentage"
        gl={{ localClippingEnabled: true }}
      >
        <AMCamera />

        <directionalLight
          position={sunPosition}
          ref={light}
          castShadow={true}
        ></directionalLight>

        <ScenarioVisualization />

        <axesHelper position={[0, 0.001, 0]} />
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
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
          <shadowMaterial opacity={0.2} />
        </Plane>
        <Environment
          background
          files="./assets/skies/autumn_field_puresky_2k.hdr"
        ></Environment>

        <Fullscreen>
          <ScenarioCreator />
        </Fullscreen>
      </Canvas>
    </>
  );
}

export default App;
