import { useState } from "react";
import type { LogEntry } from "../../shared/types.ts";
import { Markdown } from "./Markdown.tsx";

export function LogEntryCard({ entry }: { entry: LogEntry }) {
  switch (entry.kind) {
    case "user_message":
      return <UserMessage content={entry.content} />;
    case "text":
      return <AssistantText content={entry.content} />;
    case "thinking":
      return <ThinkingBlock content={entry.content} />;
    case "tool_call":
      return <ToolCall name={entry.content} input={entry.metadata?.input} />;
    case "tool_result":
      return <ToolResult content={entry.content} />;
    case "error":
      return <ErrorBlock content={entry.content} />;
    case "system":
      return <SystemMessage content={entry.content} />;
    default:
      return <div style={{ padding: "4px 0", color: "#5a6f8f", fontSize: 12 }}>{entry.content}</div>;
  }
}

function UserMessage({ content }: { content: string }) {
  return (
    <div style={{ margin: "12px 0", padding: "10px 14px", borderRadius: 10, background: "rgba(126,184,255,0.08)", borderLeft: "3px solid #7eb8ff" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#7eb8ff", marginBottom: 4, fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>You</div>
      <div style={{ color: "#c0d0e8", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{content}</div>
    </div>
  );
}

function AssistantText({ content }: { content: string }) {
  return (
    <div style={{ margin: "8px 0", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)" }}>
      <Markdown content={content} />
    </div>
  );
}

function ThinkingBlock({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ margin: "4px 0" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 8px", border: "none", background: "transparent",
          color: "#4a5a7a", fontSize: 11, cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        <span style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s", display: "inline-block" }}>&#9654;</span>
        Thinking...
      </button>
      {open && (
        <div style={{
          margin: "4px 0 4px 20px", padding: "8px 12px",
          borderRadius: 8, background: "rgba(255,255,255,0.015)",
          borderLeft: "2px solid rgba(255,255,255,0.05)",
          color: "#5a6a8a", fontSize: 12, fontFamily: "'JetBrains Mono',monospace",
          lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto",
        }}>
          {content}
        </div>
      )}
    </div>
  );
}

function ToolCall({ name, input }: { name: string; input: unknown }) {
  const [open, setOpen] = useState(false);
  const inputStr = typeof input === "string" ? input : JSON.stringify(input, null, 2);
  // Extract a short summary from the input
  const summary = extractToolSummary(name, input);

  return (
    <div style={{ margin: "4px 0" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 10px", border: "1px solid rgba(80,184,108,0.15)",
          borderRadius: 6, background: "rgba(80,184,108,0.04)",
          color: "#50B86C", fontSize: 12, cursor: "pointer",
          fontFamily: "'JetBrains Mono',monospace", width: "100%", textAlign: "left",
        }}
      >
        <span style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s", display: "inline-block", fontSize: 8 }}>&#9654;</span>
        <span style={{ fontWeight: 600 }}>{name}</span>
        {summary && <span style={{ color: "#4a6a5a", marginLeft: 4, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{summary}</span>}
      </button>
      {open && (
        <div style={{
          margin: "2px 0 2px 20px", padding: "8px 10px",
          borderRadius: 6, background: "rgba(0,0,0,0.2)",
          fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
          color: "#8a9ab8", lineHeight: 1.5, whiteSpace: "pre-wrap",
          maxHeight: 200, overflowY: "auto",
        }}>
          {inputStr}
        </div>
      )}
    </div>
  );
}

function ToolResult({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  const isLong = content.length > 200;
  const preview = isLong ? content.slice(0, 150) + "..." : content;

  return (
    <div style={{
      margin: "2px 0 8px 20px", padding: "6px 10px",
      borderRadius: 6, background: "rgba(0,0,0,0.15)",
      borderLeft: "2px solid rgba(80,184,108,0.15)",
      fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
      color: "#7a8a9a", lineHeight: 1.5,
    }}>
      <div style={{ whiteSpace: "pre-wrap" }}>{open ? content : preview}</div>
      {isLong && (
        <button
          onClick={() => setOpen(!open)}
          style={{
            marginTop: 4, padding: "2px 6px", border: "none",
            background: "rgba(255,255,255,0.04)", borderRadius: 4,
            color: "#5a6a8a", fontSize: 10, cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

function ErrorBlock({ content }: { content: string }) {
  return (
    <div style={{
      margin: "8px 0", padding: "10px 14px",
      borderRadius: 8, background: "rgba(232,93,117,0.08)",
      borderLeft: "3px solid #E85D75",
      color: "#E85D75", fontSize: 12, fontFamily: "'JetBrains Mono',monospace",
      lineHeight: 1.5, whiteSpace: "pre-wrap",
    }}>
      {content}
    </div>
  );
}

function SystemMessage({ content }: { content: string }) {
  return (
    <div style={{
      margin: "8px 0", padding: "6px 0",
      textAlign: "center", color: "#3a4a6a", fontSize: 11,
      fontFamily: "'DM Sans',sans-serif", fontStyle: "italic",
    }}>
      {content}
    </div>
  );
}

function extractToolSummary(toolName: string, input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const obj = input as Record<string, unknown>;
  switch (toolName) {
    case "Bash":
      return typeof obj.command === "string" ? obj.command.slice(0, 80) : "";
    case "Read":
      return typeof obj.file_path === "string" ? obj.file_path : "";
    case "Write":
    case "Edit":
      return typeof obj.file_path === "string" ? obj.file_path : "";
    case "Glob":
      return typeof obj.pattern === "string" ? obj.pattern : "";
    case "Grep":
      return typeof obj.pattern === "string" ? obj.pattern : "";
    case "WebSearch":
      return typeof obj.query === "string" ? obj.query : "";
    default:
      return typeof obj.description === "string" ? obj.description.slice(0, 60) : "";
  }
}
