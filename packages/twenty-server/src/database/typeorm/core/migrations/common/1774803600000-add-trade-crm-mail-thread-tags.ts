import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTradeCrmMailThreadTags1774803600000
  implements MigrationInterface
{
  name = 'AddTradeCrmMailThreadTags1774803600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."tradeCrmMailThreadTag" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "threadId" uuid NOT NULL,
        "tag" character varying(120) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_TRADE_CRM_MAIL_THREAD_TAG_ID" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_TRADE_CRM_MAIL_THREAD_TAG_WORKSPACE_THREAD"
      ON "core"."tradeCrmMailThreadTag" ("workspaceId", "threadId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_TRADE_CRM_MAIL_THREAD_TAG_WORKSPACE_TAG"
      ON "core"."tradeCrmMailThreadTag" ("workspaceId", "tag")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_TRADE_CRM_MAIL_THREAD_TAG_WORKSPACE_THREAD_TAG"
      ON "core"."tradeCrmMailThreadTag" ("workspaceId", "threadId", "tag")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "core"."IDX_TRADE_CRM_MAIL_THREAD_TAG_WORKSPACE_THREAD_TAG"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_TRADE_CRM_MAIL_THREAD_TAG_WORKSPACE_TAG"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_TRADE_CRM_MAIL_THREAD_TAG_WORKSPACE_THREAD"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."tradeCrmMailThreadTag"
    `);
  }
}
