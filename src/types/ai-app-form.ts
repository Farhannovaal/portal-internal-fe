export interface AiAppFormPayload {
  id?: string;
  name: string;
  code: string;
  allowedModels?: string[] | null;
  allowedAssistants?: string[] | null;
  rateLimitPerMin?: number | null;
  isActive?: boolean;
}
