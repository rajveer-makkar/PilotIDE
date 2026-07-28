function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function escapeAttribute(text: string): string {
  return escapeHtml(text).replace(/"/g, "&quot;")
}

function formatInline(text: string): string {
  return text
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_\n]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>")
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, label, href) => {
      return `<a href="${escapeAttribute(href)}" target="_blank" rel="noreferrer">${label}</a>`
    })
}

export function renderMarkdown(src: string): string {
  const lines = escapeHtml(src).split("\n")
  const result: string[] = []
  let inParagraph = false
  let inCode = false
  let listType: "ul" | "ol" | null = null
  let codeLang = ""

  function closeParagraph() {
    if (!inParagraph) return
    result.push("</p>")
    inParagraph = false
  }

  function closeList() {
    if (!listType) return
    result.push(`</${listType}>`)
    listType = null
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith("```")) {
      closeParagraph()
      closeList()
      if (inCode) {
        result.push("</code></pre>")
        inCode = false
        codeLang = ""
      } else {
        codeLang = trimmed.slice(3).trim()
        const langAttr = codeLang
          ? ` class="lang-${escapeAttribute(codeLang)}"`
          : ""
        result.push(`<pre><code${langAttr}>`)
        inCode = true
      }
      continue
    }

    if (inCode) {
      result.push(line)
      continue
    }

    if (!trimmed) {
      closeParagraph()
      closeList()
      continue
    }

    const headingLevel = trimmed.startsWith("### ")
      ? 3
      : trimmed.startsWith("## ")
        ? 2
        : trimmed.startsWith("# ")
          ? 1
          : 0

    if (headingLevel) {
      closeParagraph()
      closeList()
      const content = trimmed.slice(headingLevel + 1)
      result.push(
        `<h${headingLevel}>${formatInline(content)}</h${headingLevel}>`
      )
      continue
    }

    const unorderedItem = trimmed.startsWith("- ") ? trimmed.slice(2) : null
    const orderedMatch = trimmed.match(/^(\d+)\. (.+)$/)

    if (unorderedItem !== null || orderedMatch) {
      closeParagraph()
      const nextListType = unorderedItem !== null ? "ul" : "ol"
      if (listType !== nextListType) {
        closeList()
        result.push(`<${nextListType}>`)
        listType = nextListType
      }
      const item = unorderedItem ?? orderedMatch?.[2] ?? ""
      result.push(`<li>${formatInline(item)}</li>`)
      continue
    }

    closeList()
    if (!inParagraph) {
      result.push("<p>")
      inParagraph = true
    }
    result.push(formatInline(trimmed))
  }

  if (inCode) result.push("</code></pre>")
  closeParagraph()
  closeList()

  return result.join("\n")
}
