import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddEnterpriseIndependentStation1775900000000
  implements MigrationInterface
{
  name = 'AddEnterpriseIndependentStation1775900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseWebsiteBinding" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "websiteName" character varying(160) NOT NULL,
        "websiteUrl" text NOT NULL,
        "provider" character varying(60) NOT NULL DEFAULT 'okki_shops',
        "status" character varying(30) NOT NULL DEFAULT 'bound',
        "boundByWorkspaceMemberId" uuid,
        "boundAt" TIMESTAMP WITH TIME ZONE,
        "unboundAt" TIMESTAMP WITH TIME ZONE,
        "metadataJson" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_WEBSITE_BINDING_ID" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_WEBSITE_BINDING_WORKSPACE_STATUS"
      ON "core"."enterpriseWebsiteBinding" ("workspaceId", "status")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_WEBSITE_BINDING_WORKSPACE_URL_UNIQUE"
      ON "core"."enterpriseWebsiteBinding" ("workspaceId", "websiteUrl")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseInquiryFormMapping" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "websiteBindingId" uuid NOT NULL,
        "externalFieldCode" character varying(120) NOT NULL,
        "crmFieldCode" character varying(120) NOT NULL,
        "required" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_INQUIRY_FORM_MAPPING_ID" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_INQUIRY_FORM_MAPPING_WORKSPACE_WEBSITE"
      ON "core"."enterpriseInquiryFormMapping" ("workspaceId", "websiteBindingId")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_INQUIRY_FORM_MAPPING_FIELD_UNIQUE"
      ON "core"."enterpriseInquiryFormMapping" ("workspaceId", "websiteBindingId", "externalFieldCode")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseInquiryAssignmentRule" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "websiteBindingId" uuid,
        "ruleName" character varying(160) NOT NULL,
        "assignmentType" character varying(40) NOT NULL,
        "assigneeIds" text[] NOT NULL DEFAULT '{}',
        "departmentIds" text[] NOT NULL DEFAULT '{}',
        "conditionJson" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "enabled" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_INQUIRY_ASSIGNMENT_RULE_ID" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_INQUIRY_ASSIGNMENT_RULE_WORKSPACE_WEBSITE"
      ON "core"."enterpriseInquiryAssignmentRule" ("workspaceId", "websiteBindingId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_INQUIRY_ASSIGNMENT_RULE_WORKSPACE_ENABLED"
      ON "core"."enterpriseInquiryAssignmentRule" ("workspaceId", "enabled")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseWebsiteInquiry" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "websiteBindingId" uuid NOT NULL,
        "externalInquiryId" character varying(160) NOT NULL,
        "inquiryStatus" character varying(40) NOT NULL,
        "leadId" uuid,
        "assignedTo" character varying(160),
        "payloadJson" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "decisionJson" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_WEBSITE_INQUIRY_ID" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_WEBSITE_INQUIRY_WORKSPACE_WEBSITE"
      ON "core"."enterpriseWebsiteInquiry" ("workspaceId", "websiteBindingId")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_WEBSITE_INQUIRY_EXTERNAL_UNIQUE"
      ON "core"."enterpriseWebsiteInquiry" ("workspaceId", "websiteBindingId", "externalInquiryId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_WEBSITE_INQUIRY_EXTERNAL_UNIQUE"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_WEBSITE_INQUIRY_WORKSPACE_WEBSITE"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseWebsiteInquiry"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_INQUIRY_ASSIGNMENT_RULE_WORKSPACE_ENABLED"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_INQUIRY_ASSIGNMENT_RULE_WORKSPACE_WEBSITE"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseInquiryAssignmentRule"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_INQUIRY_FORM_MAPPING_FIELD_UNIQUE"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_INQUIRY_FORM_MAPPING_WORKSPACE_WEBSITE"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseInquiryFormMapping"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_WEBSITE_BINDING_WORKSPACE_URL_UNIQUE"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_WEBSITE_BINDING_WORKSPACE_STATUS"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseWebsiteBinding"
    `);
  }
}
