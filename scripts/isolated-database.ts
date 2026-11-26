export function requireIsolatedDatabase(env: NodeJS.ProcessEnv = process.env): string {
  const { BEPA_ISOLATED_TEST, NODE_ENV, DATABASE_URL, DIRECT_URL } = env
  const urls = [DATABASE_URL, DIRECT_URL].filter((value): value is string => Boolean(value))
  if (BEPA_ISOLATED_TEST !== '1' || NODE_ENV !== 'test' || !DATABASE_URL ||
      !urls.every((value) => {
        const parsed = new URL(value)
        return ['postgresql:', 'postgres:'].includes(parsed.protocol) &&
          ['127.0.0.1', 'localhost'].includes(parsed.hostname)
      })) {
    throw new Error('Set BEPA_ISOLATED_TEST=1, NODE_ENV=test and disposable loopback PostgreSQL URLs.')
  }
  return DIRECT_URL || DATABASE_URL
}
