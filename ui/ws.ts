import type { ServerMessage, ClientCommand } from "../shared/types.ts";

type MessageHandler = (msg: ServerMessage) => void;
type RawHandler = (data: string) => void;

let socket: WebSocket | null = null;
let handler: MessageHandler | null = null;
const rawListeners = new Set<RawHandler>();

export function connect(onMessage: MessageHandler) {
  handler = onMessage;
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(`${protocol}//${location.host}/ws`);
  socket.onmessage = (e) => {
    const data = e.data as string;
    // Dispatch to raw listeners (terminal, etc.) before parsing
    for (const listener of rawListeners) {
      listener(data);
    }
    try {
      const msg = JSON.parse(data) as ServerMessage;
      handler?.(msg);
    } catch {}
  };
  socket.onclose = () => {
    // Auto-reconnect after 2s
    setTimeout(() => connect(onMessage), 2000);
  };
}

export function send(cmd: ClientCommand) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(cmd));
  }
}

// Subscribe to raw WebSocket messages (survives reconnects)
export function addRawListener(fn: RawHandler) {
  rawListeners.add(fn);
}

export function removeRawListener(fn: RawHandler) {
  rawListeners.delete(fn);
}
