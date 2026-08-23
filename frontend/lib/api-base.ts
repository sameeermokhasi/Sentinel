const base =
  process.env.NEXT_PUBLIC_SENTINEL_API?.replace(/\/$/, '') || 'http://localhost:8000'

export const API_BASE_LABEL = `FastAPI · ${base.replace(/^https?:\/\//, '')}`
