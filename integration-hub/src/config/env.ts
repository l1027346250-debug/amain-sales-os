import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3020),
  INTEGRATION_HUB_API_PREFIX: z.string().default('api'),
  TWENTY_BASE_URL: z.string().url().default('http://localhost:3000'),
  TWENTY_API_KEY: z.string().default('replace-me'),
  TWENTY_WORKSPACE_ID: z.string().uuid().optional(),
  TWENTY_WEBHOOK_SECRET: z.string().default('replace-me'),
  ALIBABA_SHARED_SECRET: z.string().default('replace-me'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  LEAD_ASSIGNMENT_RULES_JSON: z.string().optional(),
  LEAD_ASSIGNMENT_DEFAULT_ASSIGNEE_ID: z.string().optional(),
  LEAD_FIRST_RESPONSE_TASK_AUTO_APPLY: z.coerce.boolean().default(true),
  LEAD_FIRST_RESPONSE_TASK_DUE_HOURS: z.coerce.number().default(2),
  LEAD_FIRST_RESPONSE_SLA_HOURS: z.coerce.number().default(12),
  LEAD_FIRST_RESPONSE_MANAGER_ESCALATION_HOURS: z.coerce.number().default(24),
  OPPORTUNITY_QUOTE_FOLLOWUP_AFTER_DAYS: z.coerce.number().default(3),
  OPPORTUNITY_QUOTE_FOLLOWUP_TASK_AUTO_APPLY: z.coerce.boolean().default(true),
  OPPORTUNITY_QUOTE_FOLLOWUP_TASK_DUE_HOURS: z.coerce.number().default(0),
  OPPORTUNITY_STALLED_AFTER_DAYS: z.coerce.number().default(7),
  OPPORTUNITY_STALLED_TASK_AUTO_APPLY: z.coerce.boolean().default(true),
  OPPORTUNITY_STALLED_TASK_DUE_HOURS: z.coerce.number().default(0),
  INTEGRATION_HUB_STATE_DIR: z.string().optional(),
  INTEGRATION_HUB_STATE_BACKEND: z
    .enum(['file', 'postgres'])
    .default('file'),
  INTEGRATION_HUB_STATE_PG_URL: z.string().optional(),
});

export type IntegrationHubEnv = z.infer<typeof envSchema>;

export const getEnv = (): IntegrationHubEnv => {
  return envSchema.parse(process.env);
};
