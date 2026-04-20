import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddEnterpriseFieldCoreTables1775400000000
  implements MigrationInterface
{
  name = 'AddEnterpriseFieldCoreTables1775400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseEntityBinding" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "entityType" character varying(64) NOT NULL,
        "objectMetadataId" uuid NOT NULL,
        "objectNameSingular" character varying(120) NOT NULL,
        "objectNamePlural" character varying(160) NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_ENTITY_BINDING_ID" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_ENTITY_BINDING_WORKSPACE_ENTITY_UNIQUE"
      ON "core"."enterpriseEntityBinding" ("workspaceId", "entityType")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_ENTITY_BINDING_WORKSPACE_OBJECT"
      ON "core"."enterpriseEntityBinding" ("workspaceId", "objectMetadataId")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseFieldDefinition" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "entityBindingId" uuid NOT NULL,
        "fieldCode" character varying(80) NOT NULL,
        "fieldName" character varying(160) NOT NULL,
        "fieldType" character varying(40) NOT NULL,
        "groupCode" character varying(80),
        "visibleInModules" jsonb,
        "validationJson" jsonb,
        "defaultValueJson" jsonb,
        "searchable" boolean NOT NULL DEFAULT false,
        "exportable" boolean NOT NULL DEFAULT false,
        "systemField" boolean NOT NULL DEFAULT false,
        "enabled" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "storageStrategy" character varying(40) NOT NULL DEFAULT 'enterprise_eav',
        "metadataFieldId" uuid,
        "syncStatus" character varying(24) NOT NULL DEFAULT 'pending',
        "syncErrorMessage" text,
        "createdByWorkspaceMemberId" uuid,
        "updatedByWorkspaceMemberId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_ENTERPRISE_FIELD_DEFINITION_ID" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_FIELD_DEFINITION_WORKSPACE_ENTITY_CODE_UNIQUE"
      ON "core"."enterpriseFieldDefinition" ("workspaceId", "entityBindingId", "fieldCode")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_FIELD_DEFINITION_WORKSPACE_ENTITY"
      ON "core"."enterpriseFieldDefinition" ("workspaceId", "entityBindingId")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseFieldOption" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "fieldDefinitionId" uuid NOT NULL,
        "optionCode" character varying(80) NOT NULL,
        "optionLabel" character varying(160) NOT NULL,
        "color" character varying(24),
        "sortOrder" integer NOT NULL DEFAULT 0,
        "enabled" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_FIELD_OPTION_ID" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_FIELD_OPTION_WORKSPACE_FIELD_CODE_UNIQUE"
      ON "core"."enterpriseFieldOption" ("workspaceId", "fieldDefinitionId", "optionCode")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseFieldLayoutConfig" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "entityBindingId" uuid NOT NULL,
        "pageScene" character varying(40) NOT NULL,
        "fieldDefinitionId" uuid NOT NULL,
        "groupCode" character varying(80),
        "required" boolean NOT NULL DEFAULT false,
        "visible" boolean NOT NULL DEFAULT true,
        "readonly" boolean NOT NULL DEFAULT false,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "roleId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_FIELD_LAYOUT_CONFIG_ID" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_FIELD_LAYOUT_WORKSPACE_ENTITY_SCENE_ROLE_FIELD"
      ON "core"."enterpriseFieldLayoutConfig" ("workspaceId", "entityBindingId", "pageScene", "roleId", "fieldDefinitionId")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseFieldValue" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "entityBindingId" uuid NOT NULL,
        "recordId" uuid NOT NULL,
        "fieldDefinitionId" uuid NOT NULL,
        "valueJson" jsonb,
        "valueString" text,
        "valueNumber" numeric,
        "valueBoolean" boolean,
        "valueDate" TIMESTAMP WITH TIME ZONE,
        "valueStringArray" text[],
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_FIELD_VALUE_ID" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ENTERPRISE_FIELD_VALUE_WORKSPACE_ENTITY_RECORD_FIELD"
      ON "core"."enterpriseFieldValue" ("workspaceId", "entityBindingId", "recordId", "fieldDefinitionId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_FIELD_VALUE_WORKSPACE_ENTITY_RECORD"
      ON "core"."enterpriseFieldValue" ("workspaceId", "entityBindingId", "recordId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_FIELD_VALUE_WORKSPACE_FIELD_STRING"
      ON "core"."enterpriseFieldValue" ("workspaceId", "fieldDefinitionId", "valueString")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_FIELD_VALUE_WORKSPACE_FIELD_NUMBER"
      ON "core"."enterpriseFieldValue" ("workspaceId", "fieldDefinitionId", "valueNumber")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_FIELD_VALUE_WORKSPACE_FIELD_DATE"
      ON "core"."enterpriseFieldValue" ("workspaceId", "fieldDefinitionId", "valueDate")
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."enterpriseConfigAuditLog" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        "action" character varying(120) NOT NULL,
        "resourceType" character varying(120) NOT NULL,
        "resourceId" character varying(120),
        "actorWorkspaceMemberId" uuid,
        "beforeJson" jsonb,
        "afterJson" jsonb,
        "contextJson" jsonb,
        "ip" character varying(255),
        "userAgent" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ENTERPRISE_CONFIG_AUDIT_LOG_ID" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ENTERPRISE_AUDIT_LOG_WORKSPACE_RESOURCE"
      ON "core"."enterpriseConfigAuditLog" ("workspaceId", "resourceType", "resourceId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_AUDIT_LOG_WORKSPACE_RESOURCE"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseConfigAuditLog"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_FIELD_VALUE_WORKSPACE_FIELD_DATE"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_FIELD_VALUE_WORKSPACE_FIELD_NUMBER"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_FIELD_VALUE_WORKSPACE_FIELD_STRING"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_FIELD_VALUE_WORKSPACE_ENTITY_RECORD"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_FIELD_VALUE_WORKSPACE_ENTITY_RECORD_FIELD"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseFieldValue"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_FIELD_LAYOUT_WORKSPACE_ENTITY_SCENE_ROLE_FIELD"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseFieldLayoutConfig"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_FIELD_OPTION_WORKSPACE_FIELD_CODE_UNIQUE"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseFieldOption"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_FIELD_DEFINITION_WORKSPACE_ENTITY"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_FIELD_DEFINITION_WORKSPACE_ENTITY_CODE_UNIQUE"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseFieldDefinition"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_ENTITY_BINDING_WORKSPACE_OBJECT"
    `);
    await queryRunner.query(`
      DROP INDEX "core"."IDX_ENTERPRISE_ENTITY_BINDING_WORKSPACE_ENTITY_UNIQUE"
    `);
    await queryRunner.query(`
      DROP TABLE "core"."enterpriseEntityBinding"
    `);
  }
}
