import { AppShell } from "./shell/AppShell.js";
import { useSchemaSocket } from "../hooks/useSchemaSocket.js";

export function ErdflowVisualizer() {
  useSchemaSocket();
  return <AppShell />;
}
