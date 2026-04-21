export class ExecuteEnterpriseSourceConvertDto {
  categoryCode: string;
  sourceCode: string;
  externalId?: string;
  email?: string;
  domain?: string;
  payload?: Record<string, unknown>;
}

