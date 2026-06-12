function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeUrl(value, options = {}) {
  const url = String(value || "").trim();
  if (!url) {
    return "";
  }
  if (options.image && url.startsWith("data:image/")) {
    return url;
  }
  if (url.startsWith("/static/") || url.startsWith("/api/assets/")) {
    return url;
  }
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch {
    return "";
  }
  return "";
}

function sanitizeRenderedHtml(html) {
  if (typeof document === "undefined") {
    return html;
  }
  const allowedTags = new Set([
    "A",
    "BR",
    "CODE",
    "EM",
    "H1",
    "H2",
    "H3",
    "IMG",
    "LI",
    "P",
    "PRE",
    "STRONG",
    "UL",
  ]);
  const allowedAttrs = {
    A: new Set(["href", "target", "rel"]),
    CODE: new Set(["class"]),
    IMG: new Set(["src", "alt", "title", "loading"]),
  };
  const template = document.createElement("template");
  template.innerHTML = html;

  const walk = (node) => {
    Array.from(node.children).forEach((child) => {
      if (!allowedTags.has(child.tagName)) {
        child.replaceWith(document.createTextNode(child.textContent || ""));
        return;
      }
      Array.from(child.attributes).forEach((attribute) => {
        const allowed = allowedAttrs[child.tagName];
        if (!allowed?.has(attribute.name)) {
          child.removeAttribute(attribute.name);
          return;
        }
        if (attribute.name === "href") {
          const href = safeUrl(attribute.value);
          if (!href) {
            child.removeAttribute("href");
          } else {
            child.setAttribute("href", href);
            child.setAttribute("target", "_blank");
            child.setAttribute("rel", "noreferrer noopener");
          }
        }
        if (attribute.name === "src") {
          const src = safeUrl(attribute.value, { image: true });
          if (!src) {
            child.remove();
          } else {
            child.setAttribute("src", src);
            child.setAttribute("loading", "lazy");
          }
        }
      });
      walk(child);
    });
  };

  walk(template.content);
  return template.innerHTML;
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
      /!\[([^\]]*)\]\(([^)\s]+)\)/g,
      (_, alt, url) => {
        const src = safeUrl(url, { image: true });
        return src ? `<img src="${src}" alt="${alt}" loading="lazy">` : "";
      }
    )
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_, label, url) => {
        const href = safeUrl(url);
        return href
          ? `<a href="${href}" target="_blank" rel="noreferrer noopener">${label}</a>`
          : label;
      }
    );

  const blocks = text.split(/\n{2,}/).map((block) => renderBlock(block.trim()));
  const rendered = blocks
    .join("")
    .replace(/@@CODE_BLOCK_(\d+)@@/g, (_, index) => codeBlocks[Number(index)] || "");
  return sanitizeRenderedHtml(rendered);
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
