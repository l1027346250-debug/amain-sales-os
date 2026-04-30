import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddEnterpriseMailboxControl1774900000000
  implements MigrationInterface
{
  name = 'AddEnterpriseMailboxControl1774900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseMailboxProfile" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "emailAddress" character varying(320) NOT NULL,
        "provider" character varying(64) NOT NULL DEFAULT 'alibaba-mail',
        "protocolMode" character varying(32) NOT NULL DEFAULT 'imap-smtp',
        "imapHost" character varying(255) NOT NULL,
        "imapPort" integer NOT NULL,
        "imapSecure" boolean NOT NULL DEFAULT true,
        "smtpHost" character varying(255) NOT NULL,
        "smtpPort" integer NOT NULL,
        "smtpSecure" boolean NOT NULL DEFAULT true,
        "loginUsername" character varying(320) NOT NULL,
        "credentialMode" character varying(32) NOT NULL DEFAULT 'authorization-code',
        "credentialRef" character varying(500) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'active',
        "validationStatus" character varying(32) NOT NULL DEFAULT 'pending',
        "lastValidatedAt" TIMESTAMP WITH TIME ZONE,
        "lastSyncAt" TIMESTAMP WITH TIME ZONE,
        "lastSyncStatus" character varying(32),
        "connectedAccountId" uuid,
        "messageChannelId" uuid,
        "createdByWorkspaceMemberId" uuid,
        "updatedByWorkspaceMemberId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_MAILBOX_PROFILE_ID" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ENTERPRISE_MAILBOX_PROFILE_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_MAILBOX_PROFILE_WORKSPACE_EMAIL_UNIQUE"
      ON "core"."enterpriseMailboxProfile" ("workspaceId", "emailAddress")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_MAILBOX_PROFILE_WORKSPACE_PROVIDER"
      ON "core"."enterpriseMailboxProfile" ("workspaceId", "provider")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseMailboxAssignment" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "mailboxProfileId" uuid NOT NULL,
        "workspaceMemberId" uuid NOT NULL,
        "assignedByWorkspaceMemberId" uuid,
        "assignmentStatus" character varying(32) NOT NULL DEFAULT 'active',
        "isPrimaryMailbox" boolean NOT NULL DEFAULT false,
        "canReceive" boolean NOT NULL DEFAULT true,
        "canSend" boolean NOT NULL DEFAULT true,
        "canViewSubordinates" boolean NOT NULL DEFAULT false,
        "canHandleSubordinates" boolean NOT NULL DEFAULT false,
        "canManageRules" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_MAILBOX_ASSIGNMENT_ID" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ENTERPRISE_MAILBOX_ASSIGNMENT_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ENTERPRISE_MAILBOX_ASSIGNMENT_PROFILE_ID" FOREIGN KEY ("mailboxProfileId") REFERENCES "core"."enterpriseMailboxProfile"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_MAILBOX_ASSIGNMENT_WORKSPACE_PROFILE_MEMBER_UNIQUE"
      ON "core"."enterpriseMailboxAssignment" ("workspaceId", "mailboxProfileId", "workspaceMemberId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_MAILBOX_ASSIGNMENT_WORKSPACE_MEMBER"
      ON "core"."enterpriseMailboxAssignment" ("workspaceId", "workspaceMemberId")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseMailboxPermission" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "mailboxAssignmentId" uuid NOT NULL,
        "permissionCode" character varying(120) NOT NULL,
        "permissionValue" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_MAILBOX_PERMISSION_ID" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ENTERPRISE_MAILBOX_PERMISSION_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ENTERPRISE_MAILBOX_PERMISSION_ASSIGNMENT_ID" FOREIGN KEY ("mailboxAssignmentId") REFERENCES "core"."enterpriseMailboxAssignment"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_MAILBOX_PERMISSION_ASSIGNMENT_CODE_UNIQUE"
      ON "core"."enterpriseMailboxPermission" ("workspaceId", "mailboxAssignmentId", "permissionCode")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_MAILBOX_PERMISSION_ASSIGNMENT"
      ON "core"."enterpriseMailboxPermission" ("workspaceId", "mailboxAssignmentId")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseMailboxRule" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "mailboxProfileId" uuid NOT NULL,
        "name" character varying(160) NOT NULL,
        "ruleType" character varying(64) NOT NULL,
        "conditionsJson" jsonb,
        "actionsJson" jsonb,
        "enabled" boolean NOT NULL DEFAULT true,
        "priority" integer NOT NULL DEFAULT 0,
        "createdByWorkspaceMemberId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_MAILBOX_RULE_ID" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ENTERPRISE_MAILBOX_RULE_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ENTERPRISE_MAILBOX_RULE_PROFILE_ID" FOREIGN KEY ("mailboxProfileId") REFERENCES "core"."enterpriseMailboxProfile"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_MAILBOX_RULE_WORKSPACE_PROFILE"
      ON "core"."enterpriseMailboxRule" ("workspaceId", "mailboxProfileId")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseMailThreadCrmLink" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "threadId" character varying(255) NOT NULL,
        "companyId" uuid,
        "personId" uuid,
        "opportunityId" uuid,
        "taskId" uuid,
        "source" character varying(64) NOT NULL DEFAULT 'manual',
        "confidence" numeric(5,2) NOT NULL DEFAULT 1,
        "linkedByWorkspaceMemberId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_MAIL_THREAD_CRM_LINK_ID" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ENTERPRISE_MAIL_THREAD_CRM_LINK_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_MAIL_THREAD_CRM_LINK_WORKSPACE_THREAD_UNIQUE"
      ON "core"."enterpriseMailThreadCrmLink" ("workspaceId", "threadId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_MAIL_THREAD_CRM_LINK_WORKSPACE_COMPANY"
      ON "core"."enterpriseMailThreadCrmLink" ("workspaceId", "companyId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "core"."IDX_ENTERPRISE_MAIL_THREAD_CRM_LINK_WORKSPACE_COMPANY"`);
    await queryRunner.query(`DROP INDEX "core"."IDX_ENTERPRISE_MAIL_THREAD_CRM_LINK_WORKSPACE_THREAD_UNIQUE"`);
    await queryRunner.query(`DROP TABLE "core"."enterpriseMailThreadCrmLink"`);
    await queryRunner.query(`DROP INDEX "core"."IDX_ENTERPRISE_MAILBOX_RULE_WORKSPACE_PROFILE"`);
    await queryRunner.query(`DROP TABLE "core"."enterpriseMailboxRule"`);
    await queryRunner.query(`DROP INDEX "core"."IDX_ENTERPRISE_MAILBOX_PERMISSION_ASSIGNMENT"`);
    await queryRunner.query(`DROP INDEX "core"."IDX_ENTERPRISE_MAILBOX_PERMISSION_ASSIGNMENT_CODE_UNIQUE"`);
    await queryRunner.query(`DROP TABLE "core"."enterpriseMailboxPermission"`);
    await queryRunner.query(`DROP INDEX "core"."IDX_ENTERPRISE_MAILBOX_ASSIGNMENT_WORKSPACE_MEMBER"`);
    await queryRunner.query(`DROP INDEX "core"."IDX_ENTERPRISE_MAILBOX_ASSIGNMENT_WORKSPACE_PROFILE_MEMBER_UNIQUE"`);
    await queryRunner.query(`DROP TABLE "core"."enterpriseMailboxAssignment"`);
    await queryRunner.query(`DROP INDEX "core"."IDX_ENTERPRISE_MAILBOX_PROFILE_WORKSPACE_PROVIDER"`);
    await queryRunner.query(`DROP INDEX "core"."IDX_ENTERPRISE_MAILBOX_PROFILE_WORKSPACE_EMAIL_UNIQUE"`);
    await queryRunner.query(`DROP TABLE "core"."enterpriseMailboxProfile"`);
  }
}
