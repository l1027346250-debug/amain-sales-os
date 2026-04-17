import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddDevelopmentEmailFeedbackTables1770903600000
  implements MigrationInterface
{
  name = 'AddDevelopmentEmailFeedbackTables1770903600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "core"."developmentEmailBounceEvent" ("workspaceId" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "eventType" character varying(64) NOT NULL, "email" character varying(255) NOT NULL, "audienceId" uuid, "campaignId" uuid, "sendTaskId" uuid, "provider" character varying(255), "reason" text, "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_developmentEmailBounceEvent_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DEVELOPMENT_EMAIL_BOUNCE_EVENT_WORKSPACE_TYPE" ON "core"."developmentEmailBounceEvent" ("workspaceId", "eventType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DEVELOPMENT_EMAIL_BOUNCE_EVENT_WORKSPACE_EMAIL" ON "core"."developmentEmailBounceEvent" ("workspaceId", "email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "core"."developmentEmailUnsubscribe" ("workspaceId" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "audienceId" uuid, "campaignId" uuid, "sendTaskId" uuid, "source" character varying(128), "reason" text, "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_developmentEmailUnsubscribe_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DEVELOPMENT_EMAIL_UNSUBSCRIBE_WORKSPACE_EMAIL" ON "core"."developmentEmailUnsubscribe" ("workspaceId", "email") `,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailBounceEvent" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_BOUNCE_EVENT_WORKSPACE" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailBounceEvent" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_BOUNCE_EVENT_AUDIENCE" FOREIGN KEY ("audienceId") REFERENCES "core"."developmentEmailAudience"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailBounceEvent" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_BOUNCE_EVENT_CAMPAIGN" FOREIGN KEY ("campaignId") REFERENCES "core"."developmentEmailCampaign"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailBounceEvent" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_BOUNCE_EVENT_SEND_TASK" FOREIGN KEY ("sendTaskId") REFERENCES "core"."developmentEmailSendTask"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailUnsubscribe" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_UNSUBSCRIBE_WORKSPACE" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailUnsubscribe" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_UNSUBSCRIBE_AUDIENCE" FOREIGN KEY ("audienceId") REFERENCES "core"."developmentEmailAudience"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailUnsubscribe" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_UNSUBSCRIBE_CAMPAIGN" FOREIGN KEY ("campaignId") REFERENCES "core"."developmentEmailCampaign"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailUnsubscribe" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_UNSUBSCRIBE_SEND_TASK" FOREIGN KEY ("sendTaskId") REFERENCES "core"."developmentEmailSendTask"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailUnsubscribe" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_UNSUBSCRIBE_SEND_TASK"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailUnsubscribe" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_UNSUBSCRIBE_CAMPAIGN"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailUnsubscribe" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_UNSUBSCRIBE_AUDIENCE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailUnsubscribe" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_UNSUBSCRIBE_WORKSPACE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailBounceEvent" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_BOUNCE_EVENT_SEND_TASK"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailBounceEvent" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_BOUNCE_EVENT_CAMPAIGN"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailBounceEvent" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_BOUNCE_EVENT_AUDIENCE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailBounceEvent" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_BOUNCE_EVENT_WORKSPACE"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_DEVELOPMENT_EMAIL_UNSUBSCRIBE_WORKSPACE_EMAIL"`,
    );
    await queryRunner.query(`DROP TABLE "core"."developmentEmailUnsubscribe"`);
    await queryRunner.query(
      `DROP INDEX "core"."IDX_DEVELOPMENT_EMAIL_BOUNCE_EVENT_WORKSPACE_EMAIL"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_DEVELOPMENT_EMAIL_BOUNCE_EVENT_WORKSPACE_TYPE"`,
    );
    await queryRunner.query(`DROP TABLE "core"."developmentEmailBounceEvent"`);
  }
}
