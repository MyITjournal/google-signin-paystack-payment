import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexesToTables1733600000000 implements MigrationInterface {
  name = 'AddIndexesToTables1733600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add index on users.google_id for faster OAuth lookups
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_google_id" ON "users" ("google_id")`,
    );

    // Add index on users.email for faster email searches
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email")`,
    );

    // Add composite index on transactions for user-specific queries
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transactions_user_status" ON "transactions" ("user_id", "status")`,
    );

    // Add index on transactions.reference for webhook lookups
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transactions_reference" ON "transactions" ("reference")`,
    );

    // Add index on transactions.created_at for sorting and duplicate checks
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transactions_created_at" ON "transactions" ("created_at")`,
    );

    // Add composite index for duplicate transaction checks
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transactions_duplicate_check" ON "transactions" ("user_id", "amount", "status", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_google_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transactions_user_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transactions_reference"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transactions_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transactions_duplicate_check"`,
    );
  }
}
