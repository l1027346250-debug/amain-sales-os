import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTradeCrmMailThreadDrafts1776600000000
  implements MigrationInterface
{
  name = 'AddTradeCrmMailThreadDrafts1776600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."tradeCrmMailThreadDraft" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "threadId" uuid,
        "mode" character varying(32) NOT NULL,
        "customerLabel" character varying(255) NOT NULL DEFAULT '',
        "threadTitle" character varying(255) NOT NULL DEFAULT '',
        "contextLabel" character varying(255) NOT NULL DEFAULT '',
        "contextValue" character varying(255) NOT NULL DEFAULT '',
        "recipients" text NOT NULL DEFAULT '',
        "ccRecipients" text NOT NULL DEFAULT '',
        "subject" text NOT NULL DEFAULT '',
        "body" text NOT NULL DEFAULT '',
        "savedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tradeCrmMailThreadDraft" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_TRADE_CRM_MAIL_THREAD_DRAFT_WORKSPACE_SAVED_AT"
      ON "core"."tradeCrmMailThreadDraft" ("workspaceId", "savedAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_TRADE_CRM_MAIL_THREAD_DRAFT_WORKSPACE_THREAD"
      ON "core"."tradeCrmMailThreadDraft" ("workspaceId", "threadId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "core"."IDX_TRADE_CRM_MAIL_THREAD_DRAFT_WORKSPACE_THREAD"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_TRADE_CRM_MAIL_THREAD_DRAFT_WORKSPACE_SAVED_AT"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."tradeCrmMailThreadDraft"
    `);
  }
}
