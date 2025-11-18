
import { Canvas } from "@react-three/fiber";
import { Fullscreen } from "@react-three/uikit";
import "./App.css";
import { CustomOrbitControl } from "./components/orbitControl";
import { ScenarioCreator } from "./components/creation/scenarioCreator";
import { ScenarioVisualization } from "./components/scenarioVisualization";
import { Decorations } from "./components/environment";
import { Suspense } from "react";
import { EquationDatabaseBrowser } from "./components/creation/equationDatabaseBrowser";

function App() {
  return (
    <>
      <Canvas
        style={{ height: "100vh", width: "100vw", touchAction: "none" }}
        shadows="percentage"
        gl={{ localClippingEnabled: true }}
      >
        <CustomOrbitControl />

        <ScenarioVisualization />
       
        <Fullscreen>
          <Suspense fallback={null}>
            <EquationDatabaseBrowser/>
          </Suspense>
        </Fullscreen>

        <Decorations />
      </Canvas>
    </>
  );
}

export default App;
