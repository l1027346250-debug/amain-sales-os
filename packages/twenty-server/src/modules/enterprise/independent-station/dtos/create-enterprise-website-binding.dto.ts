export class CreateEnterpriseWebsiteBindingDto {
  websiteName?: string;
  websiteUrl?: string;
  provider?: string;
  status?: string;
  metadataJson?: Record<string, unknown> | null;
}
