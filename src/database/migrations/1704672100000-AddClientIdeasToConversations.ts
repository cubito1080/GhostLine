import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddClientIdeasToConversations1704672100000 implements MigrationInterface {
  name = 'AddClientIdeasToConversations1704672100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'client_ideas',
        type: 'text',
        isNullable: true,
        comment: 'Historia personal y narrativa del cliente para el diseño del tatuaje',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('conversations', 'client_ideas');
  }
}
