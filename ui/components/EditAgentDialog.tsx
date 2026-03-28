import { useState } from "react";
import type { AgentInfo, AgentOutfit } from "../../shared/types.ts";
import { SHIRT_COLORS, HAIR_COLORS, HATS, ACCESSORIES } from "../../shared/outfit-options.ts";
import { Character } from "../office/Character.tsx";
import { send } from "../ws.ts";

export function EditAgentDialog({
  agent,
  onClose,
}: {
  agent: AgentInfo;
  onClose: () => void;
}) {
  const [name, setName] = useState(agent.name);
  const [cwd, setCwd] = useState(agent.cwd);
  const [outfit, setOutfit] = useState<AgentOutfit>({ ...agent.outfit });

  function randomizeOutfit() {
    setOutfit({
      hat: HATS[Math.floor(Math.random() * HATS.length)],
      color: SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)],
      hair: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
      accessory: ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)],
    });
  }

  function handleSave() {
    const cmd: any = { type: "edit_agent", agentId: agent.id };
    if (name.trim() && name.trim() !== agent.name) cmd.name = name.trim();
    if (cwd.trim() && cwd.trim() !== agent.cwd) cmd.cwd = cwd.trim();
    if (JSON.stringify(outfit) !== JSON.stringify(agent.outfit)) cmd.outfit = outfit;
    if (cmd.name || cmd.cwd || cmd.outfit) send(cmd);
    onClose();
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
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(14,20,35,0.96)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "24px 28px",
          width: 380,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          animation: "hudIn 0.2s ease-out",
        }}
      >
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#e0e8f5" }}>Edit Agent</h3>
        <p style={{ fontSize: 12, color: "#4a5a7a", margin: "2px 0 18px" }}>Desk #{agent.desk + 1}</p>

        <label style={labelStyle}>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus style={inputStyle} />

        <label style={{ ...labelStyle, marginTop: 12 }}>Working Directory</label>
        <input value={cwd} onChange={(e) => setCwd(e.target.value)} style={inputStyle} />
        <p style={{ fontSize: 10, color: "#3a4a6a", margin: "3px 0 0" }}>Changes take effect on next conversation.</p>

        <label style={{ ...labelStyle, marginTop: 14 }}>Appearance</label>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
          <div style={{ width: 52, height: 70, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Character state="idle" outfit={outfit} />
          </div>
          <button onClick={randomizeOutfit} style={randomBtnStyle}>
            Randomize
          </button>
        </div>

        {/* Shirt Color */}
        <div style={{ fontSize: 10, color: "#5a6a8a", marginBottom: 4 }}>Shirt</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {SHIRT_COLORS.map((c) => (
            <div
              key={c}
              onClick={() => setOutfit({ ...outfit, color: c })}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: c,
                cursor: "pointer",
                border: outfit.color === c ? "2px solid #e0e8f5" : "2px solid transparent",
              }}
            />
          ))}
        </div>

        {/* Hair Color */}
        <div style={{ fontSize: 10, color: "#5a6a8a", marginBottom: 4 }}>Hair</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {HAIR_COLORS.map((c) => (
            <div
              key={c}
              onClick={() => setOutfit({ ...outfit, hair: c })}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: c,
                cursor: "pointer",
                border: outfit.hair === c ? "2px solid #e0e8f5" : "2px solid transparent",
              }}
            />
          ))}
        </div>

        {/* Hat & Accessory */}
        <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#5a6a8a", marginBottom: 4 }}>Hat</div>
            <select
              value={outfit.hat}
              onChange={(e) => setOutfit({ ...outfit, hat: e.target.value as AgentOutfit["hat"] })}
              style={selectStyle}
            >
              <option value="none">None</option>
              <option value="cap">Cap</option>
              <option value="beanie">Beanie</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#5a6a8a", marginBottom: 4 }}>Accessory</div>
            <select
              value={outfit.accessory ?? "none"}
              onChange={(e) => setOutfit({ ...outfit, accessory: e.target.value === "none" ? null : e.target.value as "glasses" | "headphones" })}
              style={selectStyle}
            >
              <option value="none">None</option>
              <option value="glasses">Glasses</option>
              <option value="headphones">Headphones</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button onClick={handleSave} style={saveBtnStyle}>Save</button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#6a7a9a",
  marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  background: "rgba(0,0,0,0.3)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 8,
  color: "#e0e8f5",
  fontFamily: "'JetBrains Mono',monospace",
  fontSize: 12,
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  cursor: "pointer",
  width: "100%",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "7px 16px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "transparent",
  color: "#8a9ab8",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "'DM Sans',sans-serif",
};

const saveBtnStyle: React.CSSProperties = {
  padding: "7px 16px",
  borderRadius: 8,
  border: "none",
  background: "#7eb8ff",
  color: "#0a0e16",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'DM Sans',sans-serif",
};

const randomBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#8a9ab8",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "'DM Sans',sans-serif",
};
