export function renderMarkdown(src: string): string {
  let html = src
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>")
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>")
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>")

  html = html.replace(/```(\w*)\n([\s\S]*?)```/gm, (_, lang, code) => {
    const langAttr = lang ? ` class="lang-${lang}"` : ""
    return `<pre><code${langAttr}>${code.trim()}</code></pre>`
  })

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>")

  html = html.replace(/\*\*(\S(?:.*?\S)?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/__(\S(?:.*?\S)?)__/g, "<strong>$1</strong>")
  html = html.replace(/\*(\S(?:.*?\S)?)\*/g, "<em>$1</em>")
  html = html.replace(/_(\S(?:.*?\S)?)_/g, "<em>$1</em>")

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')

  html = html.replace(/^- (.+)$/gm, "<li>$1</li>")
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>")

  html = html.replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
  html = html.replace(/((?:<li>.*<\/li>\n?)+)(?=<\/ul>|$)/g, "<ol>$1</ol>")

  const lines = html.split("\n")
  const result: string[] = []
  let inParagraph = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (inParagraph) { result.push("</p>"); inParagraph = false }
      continue
    }
    if (trimmed.startsWith("<h") || trimmed.startsWith("<pre") || trimmed.startsWith("<ul") || trimmed.startsWith("<ol") || trimmed.startsWith("<li")) {
      if (inParagraph) { result.push("</p>"); inParagraph = false }
      result.push(line)
      continue
    }
    if (trimmed.startsWith("</")) {
      result.push(line)
      continue
    }
    if (!inParagraph) { result.push("<p>"); inParagraph = true }
    result.push(line)
  }
  if (inParagraph) result.push("</p>")

  return result.join("\n")
}
