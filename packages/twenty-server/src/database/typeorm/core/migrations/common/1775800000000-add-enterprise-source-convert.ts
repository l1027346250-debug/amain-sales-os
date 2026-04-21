import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddEnterpriseSourceConvert1775800000000
  implements MigrationInterface
{
  name = 'AddEnterpriseSourceConvert1775800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseSourceChannel" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "categoryCode" character varying(80) NOT NULL,
        "sourceCode" character varying(120) NOT NULL,
        "sourceName" character varying(160) NOT NULL,
        "secondSourceName" character varying(160),
        "systemSource" boolean NOT NULL DEFAULT true,
        "enabled" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_SOURCE_CHANNEL_ID" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_SOURCE_CHANNEL_WORKSPACE_CATEGORY_CODE_UNIQUE"
      ON "core"."enterpriseSourceChannel" ("workspaceId", "categoryCode", "sourceCode")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_SOURCE_CHANNEL_WORKSPACE_CATEGORY"
      ON "core"."enterpriseSourceChannel" ("workspaceId", "categoryCode")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseSourceConvertRule" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "sourceChannelId" uuid NOT NULL,
        "depositEntityType" character varying(30) NOT NULL,
        "targetLeadStatus" character varying(80),
        "targetCustomerStage" character varying(80),
        "autoTagIds" text[] NOT NULL DEFAULT '{}',
        "includeFunnelStats" boolean NOT NULL DEFAULT true,
        "enabled" boolean NOT NULL DEFAULT false,
        "ruleJson" jsonb,
        "ruleEditedByWorkspaceMemberId" uuid,
        "ruleEditedAt" TIMESTAMP WITH TIME ZONE,
        "dataSyncedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_SOURCE_CONVERT_RULE_ID" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_SOURCE_CONVERT_RULE_WORKSPACE_CHANNEL"
      ON "core"."enterpriseSourceConvertRule" ("workspaceId", "sourceChannelId")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseSourceBlacklistRule" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "ruleType" character varying(40) NOT NULL,
        "ruleValue" character varying(255) NOT NULL,
        "action" character varying(40) NOT NULL DEFAULT 'reject',
        "enabled" boolean NOT NULL DEFAULT true,
        "createdByWorkspaceMemberId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_SOURCE_BLACKLIST_RULE_ID" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_SOURCE_BLACKLIST_WORKSPACE_TYPE_VALUE_UNIQUE"
      ON "core"."enterpriseSourceBlacklistRule" ("workspaceId", "ruleType", "ruleValue")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_SOURCE_BLACKLIST_WORKSPACE_ENABLED"
      ON "core"."enterpriseSourceBlacklistRule" ("workspaceId", "enabled")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_SOURCE_BLACKLIST_WORKSPACE_ENABLED"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_SOURCE_BLACKLIST_WORKSPACE_TYPE_VALUE_UNIQUE"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseSourceBlacklistRule"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_SOURCE_CONVERT_RULE_WORKSPACE_CHANNEL"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseSourceConvertRule"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_SOURCE_CHANNEL_WORKSPACE_CATEGORY"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_SOURCE_CHANNEL_WORKSPACE_CATEGORY_CODE_UNIQUE"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseSourceChannel"
    `);
  }
}

