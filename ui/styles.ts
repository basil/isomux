export const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0a0e16; overflow:hidden; }
  ::-webkit-scrollbar { width:6px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.06); border-radius:3px; }

  @keyframes waitBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  @keyframes errShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-2px)} 75%{transform:translateX(2px)} }
  @keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }
  @keyframes termEnter { from{opacity:0} to{opacity:1} }
  @keyframes hudIn { from{opacity:0;transform:translateY(4px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes toastSlide { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

  /* Markdown content styles */
  .md-content { font-family: 'DM Sans', sans-serif; font-size: 13px; line-height: 1.7; color: #c0c8d8; }
  .md-content p { margin: 0 0 8px 0; }
  .md-content p:last-child { margin-bottom: 0; }
  .md-content strong { color: #e0e8f5; font-weight: 600; }
  .md-content em { color: #a0b0c8; }
  .md-content h1, .md-content h2, .md-content h3, .md-content h4 {
    color: #e0e8f5; margin: 12px 0 6px 0; font-weight: 600;
  }
  .md-content h1 { font-size: 16px; }
  .md-content h2 { font-size: 15px; }
  .md-content h3 { font-size: 14px; }
  .md-content code {
    font-family: 'JetBrains Mono', monospace; font-size: 12px;
    background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 4px; color: #d0d8e8;
  }
  .md-content pre {
    background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px 14px;
    margin: 8px 0; overflow-x: auto; border: 1px solid rgba(255,255,255,0.04);
  }
  .md-content pre code {
    background: transparent; padding: 0; font-size: 12px; line-height: 1.5; color: #a0b0c8;
  }
  .md-content ul, .md-content ol { margin: 4px 0 8px 20px; }
  .md-content li { margin: 2px 0; }
  .md-content a { color: #7eb8ff; text-decoration: none; }
  .md-content a:hover { text-decoration: underline; }
  .md-content blockquote {
    border-left: 3px solid rgba(255,255,255,0.08); margin: 8px 0; padding: 4px 12px; color: #8a9ab8;
  }
  .md-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 12px 0; }
  .md-content table { border-collapse: collapse; margin: 8px 0; width: 100%; }
  .md-content th, .md-content td {
    border: 1px solid rgba(255,255,255,0.06); padding: 6px 10px; text-align: left; font-size: 12px;
  }
  .md-content th { background: rgba(255,255,255,0.03); color: #e0e8f5; font-weight: 600; }
`;
