export interface AiAssistantFormPayload {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  defaultModel: string;
  defaultMode: 'auto' | 'rag' | 'llm-only';
  systemPrompt: string;
  kbTags?: string[] | null;
  temperature?: number;
  maxTokens?: number | null;
  isActive?: boolean;
}
