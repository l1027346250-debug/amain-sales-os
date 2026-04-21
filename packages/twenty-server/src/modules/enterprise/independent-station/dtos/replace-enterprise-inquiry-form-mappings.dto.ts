export type EnterpriseInquiryFormMappingInput = {
  externalFieldCode?: string;
  crmFieldCode?: string;
  required?: boolean;
};

export class ReplaceEnterpriseInquiryFormMappingsDto {
  mappings?: EnterpriseInquiryFormMappingInput[];
}
