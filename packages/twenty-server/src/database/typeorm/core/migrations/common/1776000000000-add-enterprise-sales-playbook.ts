import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddEnterpriseSalesPlaybook1776000000000
  implements MigrationInterface
{
  name = 'AddEnterpriseSalesPlaybook1776000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseSalesPlaybook" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "playbookName" character varying(160) NOT NULL,
        "description" text,
        "enabled" boolean NOT NULL DEFAULT true,
        "createdByWorkspaceMemberId" uuid,
        "updatedByWorkspaceMemberId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_ENTERPRISE_SALES_PLAYBOOK_ID" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_SALES_PLAYBOOK_WORKSPACE_ENABLED"
      ON "core"."enterpriseSalesPlaybook" ("workspaceId", "enabled")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseSalesPlaybookStage" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "playbookId" uuid NOT NULL,
        "stageName" character varying(160) NOT NULL,
        "stageCode" character varying(120) NOT NULL,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "enabled" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_SALES_PLAYBOOK_STAGE_ID" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_SALES_PLAYBOOK_STAGE_WORKSPACE_PLAYBOOK"
      ON "core"."enterpriseSalesPlaybookStage" ("workspaceId", "playbookId")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_SALES_PLAYBOOK_STAGE_CODE_UNIQUE"
      ON "core"."enterpriseSalesPlaybookStage" ("workspaceId", "playbookId", "stageCode")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseSalesPlaybookItem" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "stageId" uuid NOT NULL,
        "itemType" character varying(40) NOT NULL,
        "title" character varying(180) NOT NULL,
        "content" text,
        "attachmentIds" text[] NOT NULL DEFAULT '{}',
        "suggestionJson" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "enabled" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_SALES_PLAYBOOK_ITEM_ID" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_SALES_PLAYBOOK_ITEM_WORKSPACE_STAGE"
      ON "core"."enterpriseSalesPlaybookItem" ("workspaceId", "stageId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_SALES_PLAYBOOK_ITEM_WORKSPACE_ENABLED"
      ON "core"."enterpriseSalesPlaybookItem" ("workspaceId", "enabled")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_SALES_PLAYBOOK_ITEM_WORKSPACE_ENABLED"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_SALES_PLAYBOOK_ITEM_WORKSPACE_STAGE"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseSalesPlaybookItem"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_SALES_PLAYBOOK_STAGE_CODE_UNIQUE"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_SALES_PLAYBOOK_STAGE_WORKSPACE_PLAYBOOK"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseSalesPlaybookStage"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_SALES_PLAYBOOK_WORKSPACE_ENABLED"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseSalesPlaybook"
    `);
  }
}
