// Declarative registry of every known Claude Code command and bundled skill.
// Pure data — no handler logic lives here.
//
// See docs/slash-command-design.md for the full design.
// Last updated: 2026-03-31 (Claude Code ~1.0.x)

export type CommandType = "hardcoded" | "bundled-skill";

export type CommandConfig = {
  type: CommandType;
  /** Does Isomux handle this command? */
  supported: boolean;
  /** Show in autocomplete? */
  autocomplete: boolean;
  /** Can user/project/bundled skills shadow this command? */
  overridable: boolean;
  /** Key into commandHandlers (required when supported: true) */
  handler?: string;
  /** Custom ephemeral message for unsupported commands (default is type-aware) */
  message?: string;
};

// Shorthand for the common unsupported-hardcoded pattern
const UNSUPPORTED_HARDCODED: Omit<CommandConfig, "message"> = {
  type: "hardcoded",
  supported: false,
  autocomplete: false,
  overridable: false,
};

// Shorthand for the common unsupported-bundled-skill pattern
const UNSUPPORTED_BUNDLED_SKILL: Omit<CommandConfig, "message"> = {
  type: "bundled-skill",
  supported: false,
  autocomplete: false,
  overridable: true,
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const commands: Record<string, CommandConfig> = {
  // =========================================================================
  // Supported (Isomux built-in handlers)
  // =========================================================================
  clear: {
    type: "hardcoded",
    supported: true,
    autocomplete: true,
    overridable: false,
    handler: "clear",
  },
  context: {
    type: "hardcoded",
    supported: true,
    autocomplete: true,
    overridable: false,
    handler: "context",
  },
  help: {
    type: "hardcoded",
    supported: true,
    autocomplete: true,
    overridable: false,
    handler: "help",
  },
  resume: {
    type: "hardcoded",
    supported: true,
    autocomplete: true,
    overridable: false,
    handler: "resume",
  },
  login: {
    type: "hardcoded",
    supported: true,
    autocomplete: true,
    overridable: false,
    handler: "login",
  },
  logout: {
    type: "hardcoded",
    supported: true,
    autocomplete: true,
    overridable: false,
    handler: "logout",
  },

  // =========================================================================
  // Unsupported hardcoded commands (non-overridable)
  // =========================================================================

  // --- Session & context ---
  compact:    { ...UNSUPPORTED_HARDCODED, message: "`/compact` is not yet supported in Isomux. Context is auto-compacted by the SDK." },
  branch:     { ...UNSUPPORTED_HARDCODED },
  fork:       { ...UNSUPPORTED_HARDCODED }, // alias: branch in older versions
  export:     { ...UNSUPPORTED_HARDCODED },
  plan:       { ...UNSUPPORTED_HARDCODED },
  rename:     { ...UNSUPPORTED_HARDCODED },
  reset:      { type: "hardcoded", supported: true, autocomplete: false, overridable: false, handler: "clear" },
  new:        { type: "hardcoded", supported: true, autocomplete: false, overridable: false, handler: "clear" },

  // --- Model & performance ---
  model:      { ...UNSUPPORTED_HARDCODED },
  fast:       { ...UNSUPPORTED_HARDCODED },
  effort:     { ...UNSUPPORTED_HARDCODED },
  advisor:    { ...UNSUPPORTED_HARDCODED },

  // --- Cost & usage ---
  cost:       { ...UNSUPPORTED_HARDCODED, message: "`/cost` is a Claude Code command for API users. Isomux uses subscription-based billing." },
  usage:      { ...UNSUPPORTED_HARDCODED },
  stats:      { ...UNSUPPORTED_HARDCODED },
  "extra-usage": { ...UNSUPPORTED_HARDCODED },
  "rate-limit-options": { ...UNSUPPORTED_HARDCODED },

  // --- Code & file operations ---
  diff:       { ...UNSUPPORTED_HARDCODED },
  rewind:     { ...UNSUPPORTED_HARDCODED },
  checkpoint: { ...UNSUPPORTED_HARDCODED }, // alias for /rewind
  copy:       { ...UNSUPPORTED_HARDCODED },
  files:      { ...UNSUPPORTED_HARDCODED },
  "add-dir":  { ...UNSUPPORTED_HARDCODED },

  // --- Side channel ---
  btw:        { ...UNSUPPORTED_HARDCODED },

  // --- Configuration & management ---
  config:     { ...UNSUPPORTED_HARDCODED },
  settings:   { ...UNSUPPORTED_HARDCODED }, // alias for /config
  hooks:      { ...UNSUPPORTED_HARDCODED },
  permissions: { ...UNSUPPORTED_HARDCODED },
  keybindings: { ...UNSUPPORTED_HARDCODED },
  memory:     { ...UNSUPPORTED_HARDCODED },
  mcp:        { ...UNSUPPORTED_HARDCODED },
  ide:        { ...UNSUPPORTED_HARDCODED },
  agents:     { ...UNSUPPORTED_HARDCODED },
  skills:     { ...UNSUPPORTED_HARDCODED },
  sandbox:    { ...UNSUPPORTED_HARDCODED },
  "privacy-settings": { ...UNSUPPORTED_HARDCODED },
  theme:      { ...UNSUPPORTED_HARDCODED },
  color:      { ...UNSUPPORTED_HARDCODED },
  vim:        { ...UNSUPPORTED_HARDCODED },
  "terminal-setup": { ...UNSUPPORTED_HARDCODED },
  "reload-plugins": { ...UNSUPPORTED_HARDCODED },

  // --- Background & system ---
  tasks:      { ...UNSUPPORTED_HARDCODED },
  bashes:     { ...UNSUPPORTED_HARDCODED }, // older name for /tasks
  doctor:     { ...UNSUPPORTED_HARDCODED },
  feedback:   { ...UNSUPPORTED_HARDCODED },
  bug:        { ...UNSUPPORTED_HARDCODED }, // older name for /feedback
  "release-notes": { ...UNSUPPORTED_HARDCODED },
  heapdump:   { ...UNSUPPORTED_HARDCODED },
  status:     { ...UNSUPPORTED_HARDCODED },
  tag:        { ...UNSUPPORTED_HARDCODED },
  init:       { ...UNSUPPORTED_HARDCODED },
  "install-github-app": { ...UNSUPPORTED_HARDCODED },
  pr_comments: { ...UNSUPPORTED_HARDCODED },

  // --- Desktop / mobile / remote ---
  desktop:    { ...UNSUPPORTED_HARDCODED },
  mobile:     { ...UNSUPPORTED_HARDCODED },
  chrome:     { ...UNSUPPORTED_HARDCODED },
  session:    { ...UNSUPPORTED_HARDCODED },
  teleport:   { ...UNSUPPORTED_HARDCODED },
  "remote-env": { ...UNSUPPORTED_HARDCODED },

  // --- Misc ---
  exit:       { ...UNSUPPORTED_HARDCODED, message: "Use the Isomux UI to manage agents. `/exit` only works in the Claude Code CLI." },
  stickers:   { ...UNSUPPORTED_HARDCODED },
  upgrade:    { ...UNSUPPORTED_HARDCODED },
  plugin:     { ...UNSUPPORTED_HARDCODED },

  // =========================================================================
  // Bundled skills (overridable — users can shadow with their own skill files)
  // =========================================================================
  batch:              { ...UNSUPPORTED_BUNDLED_SKILL },
  "claude-api":       { ...UNSUPPORTED_BUNDLED_SKILL },
  "claude-in-chrome": { ...UNSUPPORTED_BUNDLED_SKILL },
  debug:              { ...UNSUPPORTED_BUNDLED_SKILL },
  "keybindings-help": { ...UNSUPPORTED_BUNDLED_SKILL },
  loop:               { ...UNSUPPORTED_BUNDLED_SKILL },
  "lorem-ipsum":      { ...UNSUPPORTED_BUNDLED_SKILL },
  review:             { ...UNSUPPORTED_BUNDLED_SKILL },
  schedule:           { ...UNSUPPORTED_BUNDLED_SKILL },
  "security-review":  { ...UNSUPPORTED_BUNDLED_SKILL },
  simplify:           { ...UNSUPPORTED_BUNDLED_SKILL },
  skillify:           { ...UNSUPPORTED_BUNDLED_SKILL },
  stuck:              { ...UNSUPPORTED_BUNDLED_SKILL },
  ultrareview:        { ...UNSUPPORTED_BUNDLED_SKILL },
  "update-config":    { ...UNSUPPORTED_BUNDLED_SKILL },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** All command names that should appear in autocomplete from the config. */
export function autocompleteCommands(): string[] {
  return Object.entries(commands)
    .filter(([, cfg]) => cfg.autocomplete)
    .map(([name]) => name);
}

/** Unsupported message for a command, with type-aware defaults. */
export function unsupportedMessage(name: string): string {
  const cfg = commands[name];
  if (cfg?.message) return cfg.message;
  if (!cfg) return `\`/${name}\` is not available in Isomux.`;
  if (cfg.type === "hardcoded") {
    return `\`/${name}\` is a Claude Code command, but it's not supported in Isomux.`;
  }
  if (cfg.type === "bundled-skill") {
    return `\`/${name}\` is a Claude Code bundled skill, but it's not supported in Isomux. You can override it by creating your own skill file.`;
  }
  return `\`/${name}\` is not available in Isomux.`;
}
