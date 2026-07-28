const DEFAULT_AI_API_URL = "https://api.openai.com/v1"
const DEFAULT_AI_API_ORIGIN = "https://api.openai.com"

function allowedAiApiOrigins() {
  return new Set(
    [
      DEFAULT_AI_API_ORIGIN,
      process.env.AI_ALLOWED_API_ORIGINS,
      process.env.AI_API_URL_ALLOWLIST,
    ]
      .filter(Boolean)
      .join(",")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  )
}

export function resolveAiApiUrl(requested?: string) {
  const rawUrl = requested || process.env.AI_API_URL || DEFAULT_AI_API_URL
  const url = new URL(rawUrl)

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Unsupported AI API URL protocol")
  }

  const origin = url.origin
  if (!allowedAiApiOrigins().has(origin)) {
    throw new Error("AI API URL origin is not allowed")
  }

  url.pathname = url.pathname.replace(/\/+$/, "")
  url.search = ""
  url.hash = ""
  return url.toString()
}
