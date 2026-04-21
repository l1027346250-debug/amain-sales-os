import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddEnterpriseRecycleRecord1775700000000
  implements MigrationInterface
{
  name = 'AddEnterpriseRecycleRecord1775700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseRecycleRecord" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "resourceType" character varying(60) NOT NULL,
        "resourceId" uuid NOT NULL,
        "resourceTitle" text,
        "deletedPayload" jsonb NOT NULL,
        "deletedByWorkspaceMemberId" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "recoverableUntil" TIMESTAMP WITH TIME ZONE,
        "restoredByWorkspaceMemberId" uuid,
        "restoredAt" TIMESTAMP WITH TIME ZONE,
        "purgedByWorkspaceMemberId" uuid,
        "purgedAt" TIMESTAMP WITH TIME ZONE,
        "status" character varying(30) NOT NULL DEFAULT 'deleted',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_RECYCLE_RECORD_ID" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_RECYCLE_RECORD_RESOURCE"
      ON "core"."enterpriseRecycleRecord" ("workspaceId", "resourceType", "status", "deletedAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_RECYCLE_RECORD_RESOURCE"
    `);

    await queryRunner.query(`
      DROP TABLE "core"."enterpriseRecycleRecord"
    `);
  }
}

