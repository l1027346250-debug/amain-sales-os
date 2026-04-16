import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { verifyHmacSha256Signature } from 'src/common/security/signature-verifier.util';
import { AlibabaLeadIntakeMapperService } from 'src/modules/inbound/alibaba/alibaba-lead-intake-mapper.service';
import { LeadIntakeService } from 'src/modules/lead-intake/lead-intake.service';
import { AlibabaLeadDto } from 'src/modules/inbound/alibaba/dto/alibaba-lead.dto';

@Injectable()
export class AlibabaService {
  constructor(
    private readonly alibabaLeadIntakeMapperService: AlibabaLeadIntakeMapperService,
    private readonly leadIntakeService: LeadIntakeService,
    private readonly configService: ConfigService,
  ) {}

  async ingestLead(payload: AlibabaLeadDto, signature?: string) {
    let signatureValidation;

    try {
      signatureValidation = verifyHmacSha256Signature({
        payload,
        providedSignature: signature,
        secret:
          this.configService.get<string>('ALIBABA_SHARED_SECRET') ?? 'replace-me',
      });
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Invalid signature',
      );
    }

    const standardizedPayload =
      this.alibabaLeadIntakeMapperService.toLeadIntakeDto(payload);
    const result = await this.leadIntakeService.ingestLead(standardizedPayload);

    return {
      ...result,
      standardizedPayload,
      receivedSignature: signature ?? null,
      signatureValidation,
    };
  }
}
