import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTradeCrmMailThreadState1774800000000
  implements MigrationInterface
{
  name = 'AddTradeCrmMailThreadState1774800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."tradeCrmMailThreadState" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "threadId" uuid NOT NULL,
        "isPending" boolean NOT NULL DEFAULT false,
        "pendingReason" character varying(255),
        "metadata" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tradeCrmMailThreadState" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_TRADE_CRM_MAIL_THREAD_STATE_WORKSPACE_THREAD"
      ON "core"."tradeCrmMailThreadState" ("workspaceId", "threadId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_TRADE_CRM_MAIL_THREAD_STATE_WORKSPACE_PENDING"
      ON "core"."tradeCrmMailThreadState" ("workspaceId", "isPending", "updatedAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "core"."IDX_TRADE_CRM_MAIL_THREAD_STATE_WORKSPACE_PENDING"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_TRADE_CRM_MAIL_THREAD_STATE_WORKSPACE_THREAD"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."tradeCrmMailThreadState"
    `);
  }
}
