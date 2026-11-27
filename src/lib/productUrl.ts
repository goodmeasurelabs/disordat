/** Recognize pasted web addresses while leaving free-text product names alone. */
export function productUrl(value: string): string | null {
  const input = value.trim()
  const hasScheme = /^https?:\/\//i.test(input)
  if (!hasScheme && !/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#]|$)/i.test(input)) {
    return null
  }
  try {
    return new URL(hasScheme ? input : `https://${input}`).href
  } catch {
    return null
  }
}
