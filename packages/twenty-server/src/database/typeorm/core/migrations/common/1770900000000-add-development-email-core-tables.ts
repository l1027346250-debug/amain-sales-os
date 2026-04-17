import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddDevelopmentEmailCoreTables1770900000000
  implements MigrationInterface
{
  name = 'AddDevelopmentEmailCoreTables1770900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "core"."developmentEmailAudience" ("workspaceId" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "displayName" character varying(255) NOT NULL, "companyId" uuid, "personId" uuid, "subscriptionStatus" character varying(64) NOT NULL DEFAULT 'subscribed', "source" character varying(64) NOT NULL DEFAULT 'crm', "tags" jsonb, "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_developmentEmailAudience_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DEVELOPMENT_EMAIL_AUDIENCE_WORKSPACE_EMAIL" ON "core"."developmentEmailAudience" ("workspaceId", "email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "core"."developmentEmailTemplate" ("workspaceId" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "subject" character varying(512) NOT NULL, "bodyHtml" text NOT NULL, "bodyText" text, "version" integer NOT NULL DEFAULT '1', "status" character varying(64) NOT NULL DEFAULT 'draft', "variableSchema" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_developmentEmailTemplate_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DEVELOPMENT_EMAIL_TEMPLATE_WORKSPACE_NAME" ON "core"."developmentEmailTemplate" ("workspaceId", "name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "core"."developmentEmailCampaign" ("workspaceId" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "templateId" uuid, "status" character varying(64) NOT NULL DEFAULT 'draft', "scheduledAt" TIMESTAMP WITH TIME ZONE, "startedAt" TIMESTAMP WITH TIME ZONE, "completedAt" TIMESTAMP WITH TIME ZONE, "audienceFilter" jsonb, "sendingPolicy" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_developmentEmailCampaign_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DEVELOPMENT_EMAIL_CAMPAIGN_WORKSPACE_STATUS" ON "core"."developmentEmailCampaign" ("workspaceId", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "core"."developmentEmailSendJob" ("workspaceId" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "campaignId" uuid, "status" character varying(64) NOT NULL DEFAULT 'draft', "queuedCount" integer NOT NULL DEFAULT '0', "sentCount" integer NOT NULL DEFAULT '0', "failedCount" integer NOT NULL DEFAULT '0', "startedAt" TIMESTAMP WITH TIME ZONE, "completedAt" TIMESTAMP WITH TIME ZONE, "executionSummary" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_developmentEmailSendJob_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DEVELOPMENT_EMAIL_SEND_JOB_WORKSPACE_STATUS" ON "core"."developmentEmailSendJob" ("workspaceId", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "core"."developmentEmailSendTask" ("workspaceId" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sendJobId" uuid, "campaignId" uuid, "audienceId" uuid, "templateId" uuid, "connectedAccountId" uuid, "status" character varying(64) NOT NULL DEFAULT 'queued', "retryCount" integer NOT NULL DEFAULT '0', "providerMessageId" character varying(512), "lastError" text, "scheduledAt" TIMESTAMP WITH TIME ZONE, "sentAt" TIMESTAMP WITH TIME ZONE, "trackingSnapshot" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_developmentEmailSendTask_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DEVELOPMENT_EMAIL_SEND_TASK_WORKSPACE_STATUS" ON "core"."developmentEmailSendTask" ("workspaceId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DEVELOPMENT_EMAIL_SEND_TASK_JOB_AUDIENCE" ON "core"."developmentEmailSendTask" ("sendJobId", "audienceId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailAudience" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_AUDIENCE_WORKSPACE" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailTemplate" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_TEMPLATE_WORKSPACE" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailCampaign" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_CAMPAIGN_WORKSPACE" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailCampaign" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_CAMPAIGN_TEMPLATE" FOREIGN KEY ("templateId") REFERENCES "core"."developmentEmailTemplate"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendJob" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_JOB_WORKSPACE" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendJob" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_JOB_CAMPAIGN" FOREIGN KEY ("campaignId") REFERENCES "core"."developmentEmailCampaign"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendTask" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_TASK_WORKSPACE" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendTask" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_TASK_JOB" FOREIGN KEY ("sendJobId") REFERENCES "core"."developmentEmailSendJob"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendTask" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_TASK_CAMPAIGN" FOREIGN KEY ("campaignId") REFERENCES "core"."developmentEmailCampaign"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendTask" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_TASK_AUDIENCE" FOREIGN KEY ("audienceId") REFERENCES "core"."developmentEmailAudience"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendTask" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_TASK_TEMPLATE" FOREIGN KEY ("templateId") REFERENCES "core"."developmentEmailTemplate"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendTask" ADD CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_TASK_CONNECTED_ACCOUNT" FOREIGN KEY ("connectedAccountId") REFERENCES "core"."connectedAccount"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendTask" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_TASK_CONNECTED_ACCOUNT"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendTask" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_TASK_TEMPLATE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendTask" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_TASK_AUDIENCE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendTask" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_TASK_CAMPAIGN"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendTask" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_TASK_JOB"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendTask" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_TASK_WORKSPACE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendJob" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_JOB_CAMPAIGN"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailSendJob" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_SEND_JOB_WORKSPACE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailCampaign" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_CAMPAIGN_TEMPLATE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailCampaign" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_CAMPAIGN_WORKSPACE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailTemplate" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_TEMPLATE_WORKSPACE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."developmentEmailAudience" DROP CONSTRAINT "FK_DEVELOPMENT_EMAIL_AUDIENCE_WORKSPACE"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_DEVELOPMENT_EMAIL_SEND_TASK_JOB_AUDIENCE"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_DEVELOPMENT_EMAIL_SEND_TASK_WORKSPACE_STATUS"`,
    );
    await queryRunner.query(`DROP TABLE "core"."developmentEmailSendTask"`);
    await queryRunner.query(
      `DROP INDEX "core"."IDX_DEVELOPMENT_EMAIL_SEND_JOB_WORKSPACE_STATUS"`,
    );
    await queryRunner.query(`DROP TABLE "core"."developmentEmailSendJob"`);
    await queryRunner.query(
      `DROP INDEX "core"."IDX_DEVELOPMENT_EMAIL_CAMPAIGN_WORKSPACE_STATUS"`,
    );
    await queryRunner.query(`DROP TABLE "core"."developmentEmailCampaign"`);
    await queryRunner.query(
      `DROP INDEX "core"."IDX_DEVELOPMENT_EMAIL_TEMPLATE_WORKSPACE_NAME"`,
    );
    await queryRunner.query(`DROP TABLE "core"."developmentEmailTemplate"`);
    await queryRunner.query(
      `DROP INDEX "core"."IDX_DEVELOPMENT_EMAIL_AUDIENCE_WORKSPACE_EMAIL"`,
    );
    await queryRunner.query(`DROP TABLE "core"."developmentEmailAudience"`);
  }
}
