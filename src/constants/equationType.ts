import type { EquationType } from "../../types/types";

/**
 * Descriptions for each EquationType property
 * Used for tooltips and documentation
 */
export const EQUATION_TYPE_DESCRIPTIONS: Record<keyof EquationType, string> = {
  isStatic: "This is a static method and does not require an instance to be called.",
  isMutatingInvoker:
    "This method modifies the instance (this) it is called on.",
  isMutatingParameter:
    "This method modifies one or more of its input parameters.",
  isReturningInstance:
    "This method returns this and can be chained with other methods.",
  isPureFunction:
    "This method does not modify any inputs and returns a new value.",
};

export const EQUATION_TYPE_NICENAMES: Record<keyof EquationType, string> = {
  isStatic: "Static Method",
  isMutatingInvoker: "Mutates Invoker",
  isMutatingParameter: "Mutates Parameter",
  isReturningInstance: "Returns Invoker",
  isPureFunction: "Pure Function",
};