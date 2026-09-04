import { useSchemaSocket } from "../hooks/use-schema-socket.js";
import { AppShell } from "./shell/AppShell.js";

export function ErdflowVisualizer() {
  useSchemaSocket();
  return <AppShell />;
}
