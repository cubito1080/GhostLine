import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateReferenceImagesTable1704672000000 implements MigrationInterface {
  name = 'CreateReferenceImagesTable1704672000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create reference_images table
    await queryRunner.createTable(
      new Table({
        name: 'reference_images',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversation_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'client_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'project_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 's3_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'thumbnail_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'whatsapp_media_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'file_type',
            type: 'varchar',
            length: '50',
            default: "'image/jpeg'",
            isNullable: false,
          },
          {
            name: 'file_size_kb',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'order_index',
            type: 'smallint',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'NOW()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Add foreign key to conversations
    await queryRunner.createForeignKey(
      'reference_images',
      new TableForeignKey({
        name: 'FK_reference_images_conversation',
        columnNames: ['conversation_id'],
        referencedTableName: 'conversations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key to clients
    await queryRunner.createForeignKey(
      'reference_images',
      new TableForeignKey({
        name: 'FK_reference_images_client',
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key to projects
    await queryRunner.createForeignKey(
      'reference_images',
      new TableForeignKey({
        name: 'FK_reference_images_project',
        columnNames: ['project_id'],
        referencedTableName: 'projects',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'reference_images',
      new TableIndex({
        name: 'IDX_reference_conversation',
        columnNames: ['conversation_id', 'order_index'],
      }),
    );

    await queryRunner.createIndex(
      'reference_images',
      new TableIndex({
        name: 'IDX_reference_client',
        columnNames: ['client_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'reference_images',
      new TableIndex({
        name: 'IDX_reference_project',
        columnNames: ['project_id'],
        where: 'project_id IS NOT NULL',
      }),
    );

    // Add unique constraint for conversation_id + order_index
    await queryRunner.query(
      'ALTER TABLE reference_images ADD CONSTRAINT UQ_reference_conversation_order UNIQUE (conversation_id, order_index)',
    );

    // Add check constraint for order_index (1-6)
    await queryRunner.query(
      'ALTER TABLE reference_images ADD CONSTRAINT CHK_reference_order_index CHECK (order_index BETWEEN 1 AND 6)',
    );

    // Create trigger function to enforce max 6 images per conversation
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION check_max_references()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (SELECT COUNT(*) FROM reference_images WHERE conversation_id = NEW.conversation_id) >= 6 THEN
          RAISE EXCEPTION 'Maximum 6 reference images per conversation exceeded';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger
    await queryRunner.query(`
      CREATE TRIGGER enforce_max_references
        BEFORE INSERT ON reference_images
        FOR EACH ROW
        EXECUTE FUNCTION check_max_references();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger
    await queryRunner.query('DROP TRIGGER IF EXISTS enforce_max_references ON reference_images');
    
    // Drop trigger function
    await queryRunner.query('DROP FUNCTION IF EXISTS check_max_references()');

    // Drop table (cascade will drop foreign keys and indexes)
    await queryRunner.dropTable('reference_images', true);
  }
}
