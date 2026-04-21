import { Injectable } from '@nestjs/common';

import { type ObjectLiteral } from 'typeorm';

import {
  CustomerDocumentItemDTO,
  CustomerDocumentsArgs,
  CustomerDocumentsDTO,
} from 'src/engine/core-modules/customer/dto/customer-document.dto';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

type WorkspaceAttachmentRecord = ObjectLiteral & {
  id: string;
  createdAt?: Date | string | null;
  name?: string | null;
  file?: Array<Record<string, unknown>> | null;
  fullPath?: string | null;
  fileCategory?: string | null;
  type?: string | null;
  targetCompanyId?: string | null;
};

const EMPTY_CUSTOMER_DOCUMENTS: CustomerDocumentsDTO = {
  items: [],
  totalCount: 0,
};

const getSafeLimit = (limit: number | undefined) =>
  Math.max(1, Math.min(limit ?? 20, 100));

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeDateString = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return normalizeString(value);
};

@Injectable()
export class CustomerDocumentService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
  ) {}

  async getCustomerDocuments(
    workspaceId: string,
    args: CustomerDocumentsArgs,
  ): Promise<CustomerDocumentsDTO> {
    const hasAttachmentObject = await this.hasWorkspaceObject(
      workspaceId,
      'attachment',
    );

    if (!hasAttachmentObject) {
      return EMPTY_CUSTOMER_DOCUMENTS;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceAttachmentRecord>(
          workspaceId,
          'attachment',
          { shouldBypassPermissionChecks: true },
        );
      const [records, totalCount] = await repository.findAndCount({
        order: {
          createdAt: 'DESC',
        },
        take: getSafeLimit(args.limit),
        where: {
          targetCompanyId: args.customerId,
        },
      });

      return {
        items: records.map((record) => this.mapAttachment(record)),
        totalCount,
      };
    }, authContext);
  }

  private mapAttachment(
    record: WorkspaceAttachmentRecord,
  ): CustomerDocumentItemDTO {
    const primaryFile = Array.isArray(record.file) ? record.file[0] : null;
    const fileLabel = normalizeString(primaryFile?.label);
    const fileId = normalizeString(primaryFile?.fileId);
    const fileExtension = normalizeString(primaryFile?.extension);

    return {
      id: record.id,
      createdAt: normalizeDateString(record.createdAt),
      fileCategory:
        normalizeString(record.fileCategory) ??
        normalizeString(record.type) ??
        fileExtension,
      fullPath: normalizeString(record.fullPath) ?? fileId,
      name: fileLabel ?? normalizeString(record.name) ?? 'Customer document',
    };
  }

  private async hasWorkspaceObject(
    workspaceId: string,
    objectNameSingular: string,
  ): Promise<boolean> {
    const objectMetadata = await this.objectMetadataService.findOneWithinWorkspace(
      workspaceId,
      {
        where: {
          nameSingular: objectNameSingular,
        },
      },
    );

    return objectMetadata !== null;
  }
}
