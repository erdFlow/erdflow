import ELK from "elkjs/lib/elk.bundled.js";
import type { LayoutOptions } from "./types.js";

type ElkInstance = InstanceType<typeof ELK>;

let elkInstance: ElkInstance | undefined;

export function getElk(): ElkInstance {
  if (!elkInstance) {
    elkInstance = new ELK();
  }
  return elkInstance;
}

export function buildRootLayoutOptions(options?: LayoutOptions): Record<string, string> {
  return {
    "elk.algorithm": "layered",
    "elk.direction": options?.direction ?? "RIGHT",
    "elk.spacing.nodeNode": String(options?.nodeSpacing ?? 40),
    "elk.layered.spacing.nodeNodeBetweenLayers": String(options?.layerSpacing ?? 60),
  };
}
