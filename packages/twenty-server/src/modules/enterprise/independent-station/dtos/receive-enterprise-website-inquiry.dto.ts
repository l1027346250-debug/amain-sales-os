export class ReceiveEnterpriseWebsiteInquiryDto {
  websiteBindingId?: string;
  externalInquiryId?: string;
  visitorName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  country?: string;
  message?: string;
  sourcePage?: string;
  formFields?: Record<string, unknown> | null;
  payloadJson?: Record<string, unknown> | null;
}
