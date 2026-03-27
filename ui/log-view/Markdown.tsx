import { useMemo } from "react";
import { marked } from "marked";

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

export function Markdown({ content }: { content: string }) {
  const html = useMemo(() => {
    try {
      return marked.parse(content) as string;
    } catch {
      return content;
    }
  }, [content]);

  return (
    <div
      className="md-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
