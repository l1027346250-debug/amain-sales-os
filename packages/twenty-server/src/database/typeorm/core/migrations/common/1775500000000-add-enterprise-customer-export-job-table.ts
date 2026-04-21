import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddEnterpriseCustomerExportJobTable1775500000000
  implements MigrationInterface
{
  name = 'AddEnterpriseCustomerExportJobTable1775500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseCustomerExportJob" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "taskName" character varying(180) NOT NULL,
        "filterJson" jsonb NOT NULL,
        "selectedFieldCodes" text[] NOT NULL DEFAULT '{}',
        "customerCount" integer,
        "status" character varying(30) NOT NULL DEFAULT 'pending',
        "fileUrl" text,
        "fileExpiresAt" TIMESTAMP WITH TIME ZONE,
        "errorMessage" text,
        "createdByWorkspaceMemberId" uuid,
        "startedAt" TIMESTAMP WITH TIME ZONE,
        "finishedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_CUSTOMER_EXPORT_JOB_ID" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_CUSTOMER_EXPORT_JOB_WORKSPACE_CREATED_AT"
      ON "core"."enterpriseCustomerExportJob" ("workspaceId", "createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_CUSTOMER_EXPORT_JOB_WORKSPACE_CREATED_AT"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseCustomerExportJob"
    `);
  }
}
