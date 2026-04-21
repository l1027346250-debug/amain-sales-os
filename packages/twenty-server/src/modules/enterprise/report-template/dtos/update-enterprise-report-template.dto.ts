export class UpdateEnterpriseReportTemplateDto {
  templateName?: string;
  reportType?: string;
  description?: string | null;
  sectionKeys?: string[];
  recipientRoleCodes?: string[];
  deliveryChannel?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

