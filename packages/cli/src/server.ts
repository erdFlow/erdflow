import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, join, normalize } from "node:path";
import type { UniversalSchema } from "@erdflow/core";
import { WebSocketServer } from "ws";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

export interface ServerMessage {
  type: "schema" | "error";
  schema?: UniversalSchema;
  message?: string;
}

export interface ErdflowServer {
  url: string;
  broadcastSchema(schema: UniversalSchema): void;
  broadcastError(message: string): void;
  close(): Promise<void>;
}

interface CreateServerOptions {
  port: number;
  publicDir: string;
  host?: string;
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function serveStaticFile(
  publicDir: string,
  requestPath: string,
  response: ServerResponse,
): Promise<boolean> {
  const safePath = normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath === "/" ? "index.html" : safePath);

  if (!filePath.startsWith(publicDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return true;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return false;
    }

    const extension = extname(filePath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
    return true;
  } catch {
    return false;
  }
}

export async function createServer(
  options: CreateServerOptions,
): Promise<ErdflowServer> {
  const host = options.host ?? "127.0.0.1";
  let currentSchema: UniversalSchema | null = null;
  let currentError: string | null = null;

  const httpServer = createHttpServer(async (request, response) => {
    await handleRequest(request, response);
  });

  const wss = new WebSocketServer({ noServer: true });

  function serializeMessage(message: ServerMessage): string {
    return JSON.stringify(message);
  }

  function pushToClients(message: ServerMessage): void {
    const payload = serializeMessage(message);
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  }

  async function handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    const url = new URL(request.url ?? "/", `http://${host}`);
    const pathname = url.pathname;

    if (pathname === "/api/schema") {
      if (currentSchema) {
        sendJson(response, 200, currentSchema);
        return;
      }
      sendJson(response, 503, {
        error: currentError ?? "Schema not loaded yet.",
      });
      return;
    }

    const served = await serveStaticFile(options.publicDir, pathname, response);
    if (served) {
      return;
    }

    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }

  httpServer.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "/", `http://${host}`);
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws) => {
    if (currentSchema) {
      ws.send(serializeMessage({ type: "schema", schema: currentSchema }));
      return;
    }

    if (currentError) {
      ws.send(serializeMessage({ type: "error", message: currentError }));
    }
  });

  await new Promise<void>((resolvePromise, rejectPromise) => {
    httpServer.listen(options.port, host, () => resolvePromise());
    httpServer.on("error", rejectPromise);
  });

  const address = httpServer.address();
  const resolvedPort =
    typeof address === "object" && address ? address.port : options.port;
  const url = `http://${host}:${resolvedPort}/`;

  return {
    url,
    broadcastSchema(schema: UniversalSchema) {
      currentSchema = schema;
      currentError = null;
      pushToClients({ type: "schema", schema });
    },
    broadcastError(message: string) {
      currentError = message;
      pushToClients({ type: "error", message });
    },
    close() {
      return new Promise<void>((resolvePromise, rejectPromise) => {
        for (const client of wss.clients) {
          client.close();
        }
        wss.close(() => {
          httpServer.close((error) => {
            if (error) {
              rejectPromise(error);
              return;
            }
            resolvePromise();
          });
        });
      });
    },
  };
}
