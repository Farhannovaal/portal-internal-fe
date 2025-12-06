export type AssistantMode = 'auto' | 'rag' | 'llm-only';

export interface AiAssistant {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  defaultModel: string;
  defaultMode: AssistantMode;
  systemPrompt: string;
  kbTags?: string[] | null;
  temperature: number;
  maxTokens?: number | null;
  isActive: boolean;
  createdAt?: string;
}
