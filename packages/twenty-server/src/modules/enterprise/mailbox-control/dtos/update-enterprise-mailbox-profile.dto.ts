export class UpdateEnterpriseMailboxProfileDto {
  emailAddress?: string;
  credentialMode?: string;
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  loginUsername?: string;
  secret?: string;
  status?: string;
}
