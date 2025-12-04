import type { ChatMode } from '@/config';

export type Role = 'user' | 'assistant';

export type ChatMessage = {
  id: number;
  role: Role;
  content: string;
};

export type ChatSession = {
  id: string;
  userId: string | null;
  title: string | null;
  createdAt: string;
  lastActivityAt: string | null;
  totalTurns: number;
  usedRagTurns: number;
  lastUserText: string | null;
  lastAssistantText: string | null;
};

export type SessionTurn = {
  id: string;
  createdAt: string;
  userText: string | null;
  assistantText: string | null;
  mode: ChatMode;
  usedRag: boolean;
  hitsCount: number;
  latencyMs: number;
};
