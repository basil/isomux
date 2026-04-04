import { execSync } from "child_process";
import { join } from "path";

export interface UpdateStatus {
  updateAvailable: boolean;
  currentSha: string;
  latestSha: string;
  latestMessage: string;
}

const REPO = "nmamano/isomux";
const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour
const PROJECT_ROOT = join(import.meta.dir, "..");

let status: UpdateStatus = {
  updateAvailable: false,
  currentSha: "",
  latestSha: "",
  latestMessage: "",
};

let onChange: ((s: UpdateStatus) => void) | null = null;

function getLocalSha(): string {
  try {
    return execSync("git rev-parse HEAD", { cwd: PROJECT_ROOT, timeout: 5000 })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

async function fetchLatestCommit(): Promise<{ sha: string; message: string } | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/commits/main`, {
      headers: { Accept: "application/vnd.github.v3+json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      sha: data.sha,
      message: data.commit?.message?.split("\n")[0] ?? "",
    };
  } catch {
    return null;
  }
}

async function check() {
  const currentSha = getLocalSha();
  if (!currentSha) return;

  const latest = await fetchLatestCommit();
  if (!latest) return;

  const prev = status.updateAvailable;
  status = {
    updateAvailable: currentSha !== latest.sha,
    currentSha,
    latestSha: latest.sha,
    latestMessage: latest.message,
  };

  // Notify only when status changes
  if (status.updateAvailable !== prev && onChange) {
    onChange(status);
  }
}

export function getUpdateStatus(): UpdateStatus {
  return status;
}

export function onUpdateChange(cb: (s: UpdateStatus) => void) {
  onChange = cb;
}

export function startUpdateChecker() {
  // Initial check after a short delay to not slow down startup
  setTimeout(() => check(), 5000);
  setInterval(() => check(), CHECK_INTERVAL);
}
