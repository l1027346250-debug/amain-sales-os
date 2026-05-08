import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnterpriseMailboxValidationError1776500000000
  implements MigrationInterface
{
  name = 'AddEnterpriseMailboxValidationError1776500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "core"."enterpriseMailboxProfile"
      ADD COLUMN "lastValidationError" character varying(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "core"."enterpriseMailboxProfile"
      DROP COLUMN "lastValidationError"
    `);
  }
}
