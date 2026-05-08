import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddEnterpriseMailboxRuleResult1776200000000
  implements MigrationInterface
{
  name = 'AddEnterpriseMailboxRuleResult1776200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseMailboxRuleResult" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "mailboxRuleId" uuid NOT NULL,
        "mailboxProfileId" uuid NOT NULL,
        "executionType" character varying(32) NOT NULL,
        "outcome" character varying(32) NOT NULL,
        "threadId" character varying(255),
        "summary" character varying(500) NOT NULL,
        "failureReason" character varying(500),
        "matchedSignalsJson" jsonb,
        "plannedActionsJson" jsonb,
        "metadataJson" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_MAILBOX_RULE_RESULT_ID" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ENTERPRISE_MAILBOX_RULE_RESULT_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ENTERPRISE_MAILBOX_RULE_RESULT_RULE_ID" FOREIGN KEY ("mailboxRuleId") REFERENCES "core"."enterpriseMailboxRule"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ENTERPRISE_MAILBOX_RULE_RESULT_PROFILE_ID" FOREIGN KEY ("mailboxProfileId") REFERENCES "core"."enterpriseMailboxProfile"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_MAILBOX_RULE_RESULT_WORKSPACE_RULE_CREATED_AT"
      ON "core"."enterpriseMailboxRuleResult" ("workspaceId", "mailboxRuleId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_MAILBOX_RULE_RESULT_WORKSPACE_MAILBOX_CREATED_AT"
      ON "core"."enterpriseMailboxRuleResult" ("workspaceId", "mailboxProfileId", "createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "core"."IDX_ENTERPRISE_MAILBOX_RULE_RESULT_WORKSPACE_MAILBOX_CREATED_AT"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_ENTERPRISE_MAILBOX_RULE_RESULT_WORKSPACE_RULE_CREATED_AT"`,
    );
    await queryRunner.query(`DROP TABLE "core"."enterpriseMailboxRuleResult"`);
  }
}
