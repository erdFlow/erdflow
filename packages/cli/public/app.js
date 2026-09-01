const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");
const errorEl = document.getElementById("error");
const errorMessageEl = document.getElementById("error-message");
const schemaDetailsEl = document.getElementById("schema-details");
const schemaJsonEl = document.getElementById("schema-json");
const entityCountEl = document.getElementById("entity-count");
const enumCountEl = document.getElementById("enum-count");
const relationCountEl = document.getElementById("relation-count");
const indexCountEl = document.getElementById("index-count");

function setStatus(text, className) {
  statusEl.textContent = text;
  statusEl.className = `status ${className ?? ""}`.trim();
}

function showError(message) {
  summaryEl.classList.add("hidden");
  schemaDetailsEl.classList.add("hidden");
  errorEl.classList.remove("hidden");
  errorMessageEl.textContent = message;
  setStatus("Schema error", "error");
}

function renderSchema(schema) {
  errorEl.classList.add("hidden");
  summaryEl.classList.remove("hidden");
  schemaDetailsEl.classList.remove("hidden");

  entityCountEl.textContent = String(schema.entities?.length ?? 0);
  enumCountEl.textContent = String(schema.enums?.length ?? 0);
  relationCountEl.textContent = String(schema.relations?.length ?? 0);
  indexCountEl.textContent = String(schema.indexes?.length ?? 0);
  schemaJsonEl.textContent = JSON.stringify(schema, null, 2);
  setStatus("Connected · schema loaded", "connected");
}

function connect() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);

  socket.addEventListener("open", () => {
    setStatus("Connected · waiting for schema", "connected");
  });

  socket.addEventListener("message", (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === "schema") {
        renderSchema(message.schema);
        return;
      }
      if (message.type === "error") {
        showError(message.message ?? "Unknown schema error");
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error));
    }
  });

  socket.addEventListener("close", () => {
    setStatus("Disconnected · retrying…", "error");
    setTimeout(connect, 1000);
  });

  socket.addEventListener("error", () => {
    setStatus("Connection error", "error");
  });
}

connect();
