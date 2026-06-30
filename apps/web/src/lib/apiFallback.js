/**
 * Tenta a API primeiro; em falha (rede, 500, 403…) executa fallback Supabase.
 */
export async function withApiFallback(apiFn, fallbackFn) {
  try {
    return await apiFn()
  } catch {
    return fallbackFn()
  }
}

/**
 * Tenta API; fallback Supabase; se ambos falharem, propaga o erro do fallback.
 */
export async function withApiFallbackOrThrow(apiFn, fallbackFn) {
  try {
    return await apiFn()
  } catch (apiErr) {
    try {
      return await fallbackFn()
    } catch {
      throw apiErr
    }
  }
}
