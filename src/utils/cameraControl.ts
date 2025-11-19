import type { Object3DEventMap } from "three";
import { useCameraStore } from "../stores/cameraStore";

/**
 * Creates handlers for pointer events to control OrbitControl state
 * Automatically disables OrbitControl when pointer enters an interactive UI element
 * and re-enables it when pointer leaves, preventing camera rotation during UI interaction.
 * 
 * @example
 * ```tsx
 * const { disableCameraControl, enableCameraControl } = useCameraControlHandlers();
 * 
 * <Card
 *   onPointerEnter={disableCameraControl}
 *   onPointerLeave={enableCameraControl}
 * >
 *   ...
 * </Card>
 * ```
 */
export function useCameraControlHandlers() {
  const cameraStore = useCameraStore();

  /**
   * Disables OrbitControl when pointer enters the UI element
   * Prevents scrolling/interaction from rotating the camera
   * Ignores events if user is dragging (buttons !== 0)
   */
  const disableCameraControl = (event: Object3DEventMap["pointerenter"]) => {
    // Ignore if any button is pressed (user is dragging)
    if ((event.nativeEvent as PointerEvent).buttons !== 0) return;
    cameraStore.setEnabled(false);
  };

  /**
   * Re-enables OrbitControl when pointer leaves the UI element
   * Restores camera control for the user
   * Ignores events if user is dragging (buttons !== 0)
   */
  const enableCameraControl = (event: Object3DEventMap["pointerleave"]) => {
    // Ignore if any button is pressed (user is dragging)
    if ((event.nativeEvent as PointerEvent).buttons !== 0) return;
    cameraStore.setEnabled(true);
  };

  return {
    disableCameraControl,
    enableCameraControl,
  };
}
