export const LLM_GATEWAY_URL =
  import.meta.env.VITE_LLM_GATEWAY_URL || 'http://localhost:3000';

export const APP_CODE =
  import.meta.env.VITE_APP_CODE || 'portal-internal';

export const APP_API_KEY =
  import.meta.env.VITE_APP_API_KEY || '';

export const DEFAULT_ASSISTANT =
  import.meta.env.VITE_DEFAULT_ASSISTANT || 'internal-helper';

export const DEFAULT_USER_ID =
  import.meta.env.VITE_DEFAULT_USER_ID || 'anonymous';

export type ChatMode = 'auto' | 'rag' | 'llm-only';

export const DEFAULT_TAGS: string[] =
  (import.meta.env.VITE_DEFAULT_TAGS || '')
    .split(',')
    .map((t: string) => t.trim())
    .filter(Boolean);
