import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddDevelopmentEmailEventTable1770907200000
  implements MigrationInterface
{
  name = 'AddDevelopmentEmailEventTable1770907200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "core"."developmentEmailEvent" ("workspaceId" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "eventType" character varying(64) NOT NULL, "campaignId" uuid, "sendJobId" uuid, "sendTaskId" uuid, "email" character varying(255) NOT NULL, "provider" character varying(255), "providerMessageId" character varying(512), "metadata" jsonb, "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_developmentEmailEvent_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DEVELOPMENT_EMAIL_EVENT_WORKSPACE_TYPE" ON "core"."developmentEmailEvent" ("workspaceId", "eventType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DEVELOPMENT_EMAIL_EVENT_WORKSPACE_CAMPAIGN" ON "core"."developmentEmailEvent" ("workspaceId", "campaignId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailEvent" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_EVENT_WORKSPACE" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailEvent" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_EVENT_CAMPAIGN" FOREIGN KEY ("campaignId") REFERENCES "core"."developmentEmailCampaign"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailEvent" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_EVENT_SEND_JOB" FOREIGN KEY ("sendJobId") REFERENCES "core"."developmentEmailSendJob"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailEvent" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_EVENT_SEND_TASK" FOREIGN KEY ("sendTaskId") REFERENCES "core"."developmentEmailSendTask"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailEvent" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_EVENT_SEND_TASK"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailEvent" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_EVENT_SEND_JOB"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailEvent" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_EVENT_CAMPAIGN"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailEvent" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_EVENT_WORKSPACE"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_DEVELOPMENT_EMAIL_EVENT_WORKSPACE_CAMPAIGN"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_DEVELOPMENT_EMAIL_EVENT_WORKSPACE_TYPE"`,
    );
    await queryRunner.query(`DROP TABLE "core"."developmentEmailEvent"`);
  }
}
