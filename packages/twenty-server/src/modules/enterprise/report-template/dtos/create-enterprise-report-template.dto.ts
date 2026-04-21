export class CreateEnterpriseReportTemplateDto {
  templateName: string;
  templateCode: string;
  reportType: string;
  description?: string | null;
  sectionKeys?: string[];
  recipientRoleCodes?: string[];
  deliveryChannel?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

