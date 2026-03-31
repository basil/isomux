import { useState, useRef, useEffect } from "react";
import { useAppState } from "../store.tsx";
import { send } from "../ws.ts";

export function TodoModal({ username, onClose }: { username: string; onClose: () => void }) {
  const { todos, isMobile } = useAppState();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [onClose]);

  function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed) return;
    send({ type: "add_todo", text: trimmed, username });
    setInput("");
  }

  function handleDelete(id: string) {
    send({ type: "delete_todo", id });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 900,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "center",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-overlay)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-light)",
          borderRadius: 16,
          padding: "24px 28px",
          marginTop: isMobile ? "env(safe-area-inset-top, 16px)" : undefined,
          marginBottom: isMobile ? 16 : undefined,
          width: isMobile ? "calc(100% - 32px)" : 500,
          maxWidth: isMobile ? "100%" : undefined,
          boxShadow: "0 20px 60px var(--shadow-heavy)",
          animation: "hudIn 0.2s ease-out",
        }}
      >
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 18px", color: "var(--text-primary)" }}>
          Todos
        </h3>

        {/* Input */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              e.stopPropagation();
            }}
            placeholder="Add a todo..."
            style={{
              flex: 1,
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              fontSize: 13,
              fontFamily: "'DM Sans',sans-serif",
              outline: "none",
            }}
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "none",
              background: input.trim() ? "var(--accent)" : "var(--bg-subtle)",
              color: input.trim() ? "var(--bg-base)" : "var(--text-muted)",
              fontSize: 12,
              fontWeight: 600,
              cursor: input.trim() ? "pointer" : "default",
              fontFamily: "'DM Sans',sans-serif",
              flexShrink: 0,
            }}
          >
            Add
          </button>
        </div>

        {/* List */}
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {todos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: "var(--text-muted)", fontSize: 12 }}>
              No todos yet
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "8px 0",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.4, wordBreak: "break-word" }}>
                    {todo.text}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>
                    {todo.createdBy}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(todo.id)}
                  style={{
                    flexShrink: 0,
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: 16,
                    cursor: "pointer",
                    padding: "2px 6px",
                    borderRadius: 4,
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  title="Delete todo"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 12, paddingTop: 10, textAlign: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-hint)", fontStyle: "italic" }}>
            Agents don't ingest this list automatically.
          </span>
        </div>
      </div>
    </div>
  );
}
