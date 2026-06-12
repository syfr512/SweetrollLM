function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMarkdown(source) {
  if (!source) {
    return "";
  }

  const codeBlocks = [];
  let text = escapeHtml(source.replace(/\r\n/g, "\n"));

  text = text.replace(/```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g, (_, language, code) => {
    const index = codeBlocks.length;
    const className = language ? ` class="language-${language}"` : "";
    codeBlocks.push(`<pre><code${className}>${code}</code></pre>`);
    return `@@CODE_BLOCK_${index}@@`;
  });

  text = text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
    );

  const blocks = text.split(/\n{2,}/).map((block) => renderBlock(block.trim()));
  return blocks
    .join("")
    .replace(/@@CODE_BLOCK_(\d+)@@/g, (_, index) => codeBlocks[Number(index)] || "");
}

function renderBlock(block) {
  if (!block) {
    return "";
  }
  if (block.startsWith("@@CODE_BLOCK_")) {
    return block;
  }
  if (/^#{1,3}\s/.test(block)) {
    const level = block.match(/^#+/)[0].length;
    return `<h${level}>${block.replace(/^#{1,3}\s/, "")}</h${level}>`;
  }
  if (/^[-*]\s/m.test(block)) {
    const items = block
      .split("\n")
      .filter((line) => /^[-*]\s/.test(line))
      .map((line) => `<li>${line.replace(/^[-*]\s/, "")}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  }
  return `<p>${block.replace(/\n/g, "<br>")}</p>`;
}

window.renderMarkdown = renderMarkdown;

