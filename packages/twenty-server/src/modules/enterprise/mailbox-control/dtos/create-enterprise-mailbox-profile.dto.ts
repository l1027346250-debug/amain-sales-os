export class CreateEnterpriseMailboxProfileDto {
  emailAddress: string;
  provider: string;
  credentialMode: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  loginUsername: string;
  secret: string;
}
