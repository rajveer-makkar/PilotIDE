"use client"

import { renderMarkdown } from "@/lib/utils/markdown"

export function MarkdownPreview({ content }: { content: string }) {
  const html = renderMarkdown(content)

  return (
    <div className="h-full overflow-auto p-6">
      <div
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
