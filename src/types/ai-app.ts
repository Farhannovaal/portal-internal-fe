export interface AiApp {
  id: string;
  name: string;
  code: string;
  apiKey: string;
  allowedModels: string[] | null;
  allowedAssistants: string[] | null;
  rateLimitPerMin: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
