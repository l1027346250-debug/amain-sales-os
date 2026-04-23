import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddEnterpriseRolePermission1776100000000
  implements MigrationInterface
{
  name = 'AddEnterpriseRolePermission1776100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseRolePermission" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "roleId" uuid NOT NULL,
        "permissionCode" character varying(120) NOT NULL,
        "granted" boolean NOT NULL DEFAULT true,
        "createdByWorkspaceMemberId" uuid,
        "updatedByWorkspaceMemberId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_ROLE_PERMISSION_ID" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ENTERPRISE_ROLE_PERMISSION_ROLE_ID" FOREIGN KEY ("roleId") REFERENCES "core"."role"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ENTERPRISE_ROLE_PERMISSION_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_ROLE_PERMISSION_WORKSPACE_ROLE_CODE_UNIQUE"
      ON "core"."enterpriseRolePermission" ("workspaceId", "roleId", "permissionCode")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_ROLE_PERMISSION_WORKSPACE_ROLE"
      ON "core"."enterpriseRolePermission" ("workspaceId", "roleId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_ROLE_PERMISSION_WORKSPACE_ROLE"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_ROLE_PERMISSION_WORKSPACE_ROLE_CODE_UNIQUE"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseRolePermission"
    `);
  }
}
