import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddEnterpriseExportStorageAndReportTemplate1775600000000
  implements MigrationInterface
{
  name = 'AddEnterpriseExportStorageAndReportTemplate1775600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "core"."enterpriseCustomerExportJob"
      ADD COLUMN "fileId" uuid,
      ADD COLUMN "retryCount" integer NOT NULL DEFAULT 0,
      ADD COLUMN "lastAttemptAt" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN "storageDeletedAt" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseReportTemplate" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "templateName" character varying(180) NOT NULL,
        "templateCode" character varying(120) NOT NULL,
        "reportType" character varying(40) NOT NULL,
        "description" text,
        "sectionKeys" text[] NOT NULL DEFAULT '{}',
        "recipientRoleCodes" text[] NOT NULL DEFAULT '{}',
        "deliveryChannel" character varying(40) NOT NULL DEFAULT 'dashboard',
        "isActive" boolean NOT NULL DEFAULT true,
        "isDefault" boolean NOT NULL DEFAULT false,
        "version" integer NOT NULL DEFAULT 1,
        "currentVersionId" uuid,
        "createdByWorkspaceMemberId" uuid,
        "updatedByWorkspaceMemberId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_REPORT_TEMPLATE_ID" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_REPORT_TEMPLATE_WORKSPACE_CODE_UNIQUE"
      ON "core"."enterpriseReportTemplate" ("workspaceId", "templateCode")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_REPORT_TEMPLATE_WORKSPACE_TYPE"
      ON "core"."enterpriseReportTemplate" ("workspaceId", "reportType")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseReportTemplateVersion" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "templateId" uuid NOT NULL,
        "versionNumber" integer NOT NULL,
        "templateName" character varying(180) NOT NULL,
        "templateCode" character varying(120) NOT NULL,
        "reportType" character varying(40) NOT NULL,
        "description" text,
        "sectionKeys" text[] NOT NULL DEFAULT '{}',
        "recipientRoleCodes" text[] NOT NULL DEFAULT '{}',
        "deliveryChannel" character varying(40) NOT NULL DEFAULT 'dashboard',
        "isActive" boolean NOT NULL DEFAULT true,
        "isDefault" boolean NOT NULL DEFAULT false,
        "previewJson" jsonb,
        "createdByWorkspaceMemberId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_REPORT_TEMPLATE_VERSION_ID" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_REPORT_TEMPLATE_VERSION_TEMPLATE_NUMBER_UNIQUE"
      ON "core"."enterpriseReportTemplateVersion" ("templateId", "versionNumber")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_REPORT_TEMPLATE_VERSION_TEMPLATE_CREATED_AT"
      ON "core"."enterpriseReportTemplateVersion" ("templateId", "createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_REPORT_TEMPLATE_VERSION_TEMPLATE_CREATED_AT"
    `);

    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_REPORT_TEMPLATE_VERSION_TEMPLATE_NUMBER_UNIQUE"
    `);

    await queryRunner.query(`
      DROP TABLE "core"."enterpriseReportTemplateVersion"
    `);

    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_REPORT_TEMPLATE_WORKSPACE_TYPE"
    `);

    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_REPORT_TEMPLATE_WORKSPACE_CODE_UNIQUE"
    `);

    await queryRunner.query(`
      DROP TABLE "core"."enterpriseReportTemplate"
    `);

    await queryRunner.query(`
      ALTER TABLE "core"."enterpriseCustomerExportJob"
      DROP COLUMN "storageDeletedAt",
      DROP COLUMN "lastAttemptAt",
      DROP COLUMN "retryCount",
      DROP COLUMN "fileId"
    `);
  }
}

