import { useState, useRef, useEffect } from "react";
import { useAppState } from "../store.tsx";
import { send } from "../ws.ts";

export function TodoButton({ username, isMobile }: { username: string; isMobile?: boolean }) {
  const { todos } = useAppState();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

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
    <div style={{ position: "relative" }}>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        style={{
          position: "relative",
          padding: isMobile ? "6px 10px" : "4px 10px",
          borderRadius: 8,
          border: `1px solid ${open ? "var(--accent)" : "var(--border-medium)"}`,
          background: open ? "var(--accent-bg)" : "var(--btn-surface)",
          color: open ? "var(--accent)" : "var(--text-dim)",
          fontSize: 11,
          cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        Todos
        {todos.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: "var(--accent)",
              color: "var(--bg-base)",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              fontFamily: "'JetBrains Mono',monospace",
            }}
          >
            {todos.length}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: isMobile ? "-16px" : 0,
            width: isMobile ? "calc(100vw - 32px)" : 320,
            background: "var(--bg-overlay)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--border-light)",
            borderRadius: 12,
            boxShadow: "0 12px 40px var(--shadow-heavy)",
            zIndex: 1000,
            animation: "hudIn 0.15s ease-out",
            overflow: "hidden",
          }}
        >
          {/* Input */}
          <div style={{ padding: "12px 12px 8px" }}>
            <div style={{ display: "flex", gap: 8 }}>
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
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--border-medium)",
                  background: "var(--bg-surface)",
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
                  padding: "8px 14px",
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
          </div>

          {/* List */}
          <div
            style={{
              maxHeight: 300,
              overflowY: "auto",
              padding: todos.length > 0 ? "0 12px 12px" : "0 12px 12px",
            }}
          >
            {todos.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "16px 0",
                  color: "var(--text-muted)",
                  fontSize: 12,
                }}
              >
                No todos
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
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-primary)",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      {todo.text}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        marginTop: 2,
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
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

          {/* Footer note */}
          <div
            style={{
              padding: "8px 12px",
              borderTop: "1px solid var(--border-subtle)",
              fontSize: 10,
              color: "var(--text-hint)",
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            Agents don't ingest this list automatically.
          </div>
        </div>
      )}
    </div>
  );
}
