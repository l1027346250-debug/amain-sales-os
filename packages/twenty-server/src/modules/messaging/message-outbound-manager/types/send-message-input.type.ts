type EmailAddress = string | string[];

export type SendMessageInput = {
  body: string;
  subject: string;
  to: EmailAddress;
  cc?: EmailAddress;
  bcc?: EmailAddress;
  html: string;
  headers?: Record<string, string>;
  attachments?: {
    filename: string;
    content: Buffer;
    contentType: string;
  }[];
  inReplyTo?: string;
};
