import { useAppState } from "../store.tsx";

export function TodoButton({ isMobile, onOpen }: { isMobile?: boolean; onOpen: () => void }) {
  const { todos } = useAppState();

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onOpen}
        style={{
          position: "relative",
          padding: isMobile ? "6px 10px" : "4px 10px",
          borderRadius: 8,
          border: "1px solid var(--border-medium)",
          background: "var(--btn-surface)",
          color: "var(--text-dim)",
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
    </div>
  );
}
