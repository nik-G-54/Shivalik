const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_MODEL = 'gemini-2.5-flash'
const TIMEOUT_MS = 25_000

/** Schema in the Gemini (OpenAPI subset) format, e.g. { type: 'OBJECT', properties: {...} }. */
export type GeminiSchema = Record<string, unknown>

export interface GeminiJsonRequest {
  systemInstruction?: string
  prompt: string
  responseSchema?: GeminiSchema
  temperature?: number
}

/** The last raw response (or failure reason), kept so a run can be inspected afterwards. */
export const geminiDebug: { lastRaw: string | null; lastError: string | null; calls: number } = {
  lastRaw: null,
  lastError: null,
  calls: 0,
}

let warnedMissingKey = false

function fail(reason: string): null {
  geminiDebug.lastError = reason
  console.warn(`[gemini] ${reason}`)
  return null
}

export function isGeminiConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY)
}

/**
 * Calls generateContent in JSON mode and returns the parsed object.
 * Returns null (after a console.warn) on a missing key, network error, timeout, non-200 or unparsable JSON.
 */
export async function generateJson<T>(request: GeminiJsonRequest): Promise<T | null> {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key) {
    if (!warnedMissingKey) {
      warnedMissingKey = true
      console.warn('[gemini] VITE_GEMINI_API_KEY is not set; using offline mode')
    }
    geminiDebug.lastError = 'missing API key'
    return null
  }

  const model = import.meta.env.VITE_GEMINI_MODEL || DEFAULT_MODEL
  const body = {
    ...(request.systemInstruction && { systemInstruction: { parts: [{ text: request.systemInstruction }] } }),
    contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      ...(request.responseSchema && { responseSchema: request.responseSchema }),
      ...(request.temperature !== undefined && { temperature: request.temperature }),
    },
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  geminiDebug.calls++
  geminiDebug.lastRaw = null
  geminiDebug.lastError = null

  try {
    const response = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      // The key goes in a header, not the URL, so it does not end up in logs or history.
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).slice(0, 300)
      return fail(`HTTP ${response.status} from Gemini (${model}): ${detail}`)
    }

    const data = await response.json()
    const text: unknown = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof text !== 'string') return fail('Gemini response had no text part')

    geminiDebug.lastRaw = text
    try {
      return JSON.parse(text) as T
    } catch {
      return fail('Gemini returned text that is not valid JSON')
    }
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError'
    return fail(aborted ? `request timed out after ${TIMEOUT_MS / 1000}s` : `network error: ${String(error)}`)
  } finally {
    clearTimeout(timer)
  }
}
