import * as THREE from "three";
import { create } from "zustand";
import type { CameraState } from "../types";

const defaultTarget = new THREE.Vector3(0, 0, 0);

export const useCameraStore = create<CameraState>((set) => ({
  target: defaultTarget.clone(),
  setTarget: (target) => {
    console.log("Camera target changed:", target);
    set({ target });
  },
  enabled: true,
  setEnabled: (enabled) => set({ enabled }),
}));
