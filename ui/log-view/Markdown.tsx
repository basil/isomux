import { useMemo, useRef, useEffect } from "react";
import { marked } from "marked";

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

export function Markdown({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    try {
      return marked.parse(content) as string;
    } catch {
      return content;
    }
  }, [content]);

  // Inject copy buttons into <pre> code blocks after render
  useEffect(() => {
    if (!ref.current) return;
    const pres = ref.current.querySelectorAll("pre");
    for (const pre of pres) {
      if (pre.querySelector(".code-copy-btn")) continue;
      pre.style.position = "relative";

      const btn = document.createElement("button");
      btn.className = "copy-btn code-copy-btn";
      btn.title = "Copy";
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V3.5a1.5 1.5 0 0 0-1.5-1.5H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5h2"/></svg>`;

      const checkSvg = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3.5 8.5 6.5 11.5 12.5 4.5"/></svg>`;
      const copySvg = btn.innerHTML;

      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const code = pre.querySelector("code");
        const text = code ? code.textContent ?? "" : pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        btn.innerHTML = checkSvg;
        btn.style.color = "var(--green)";
        btn.style.background = "var(--green-bg)";
        setTimeout(() => {
          btn.innerHTML = copySvg;
          btn.style.color = "";
          btn.style.background = "";
        }, 1500);
      });

      pre.appendChild(btn);
    }
  }, [html]);

  return (
    <div
      ref={ref}
      className="md-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
