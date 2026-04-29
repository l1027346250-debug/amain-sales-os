import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTradeCrmMailThreadTaskLinks1774810800000
  implements MigrationInterface
{
  name = 'AddTradeCrmMailThreadTaskLinks1774810800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."tradeCrmMailThreadTaskLink" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "threadId" uuid NOT NULL,
        "taskId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tradeCrmMailThreadTaskLink" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_TRADE_CRM_MAIL_THREAD_TASK_LINK_WORKSPACE_THREAD"
      ON "core"."tradeCrmMailThreadTaskLink" ("workspaceId", "threadId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_TRADE_CRM_MAIL_THREAD_TASK_LINK_WORKSPACE_TASK"
      ON "core"."tradeCrmMailThreadTaskLink" ("workspaceId", "taskId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "core"."IDX_TRADE_CRM_MAIL_THREAD_TASK_LINK_WORKSPACE_TASK"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_TRADE_CRM_MAIL_THREAD_TASK_LINK_WORKSPACE_THREAD"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."tradeCrmMailThreadTaskLink"
    `);
  }
}
