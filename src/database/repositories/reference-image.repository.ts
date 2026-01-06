import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferenceImage } from '../entities/reference-image.entity';

@Injectable()
export class ReferenceImageRepository {
  constructor(
    @InjectRepository(ReferenceImage)
    private readonly repository: Repository<ReferenceImage>,
  ) {}

  /**
   * Find all reference images for a conversation
   */
  async findByConversation(conversationId: string): Promise<ReferenceImage[]> {
    return this.repository.find({
      where: { conversation_id: conversationId },
      order: { order_index: 'ASC' },
    });
  }

  /**
   * Find all reference images for a client
   */
  async findByClient(clientId: string): Promise<ReferenceImage[]> {
    return this.repository.find({
      where: { client_id: clientId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Find all reference images for a project
   */
  async findByProject(projectId: string): Promise<ReferenceImage[]> {
    return this.repository.find({
      where: { project_id: projectId },
      order: { order_index: 'ASC' },
    });
  }

  /**
   * Count reference images for a conversation
   */
  async countByConversation(conversationId: string): Promise<number> {
    return this.repository.count({
      where: { conversation_id: conversationId },
    });
  }

  /**
   * Get next available order index for a conversation
   */
  async getNextOrderIndex(conversationId: string): Promise<number> {
    const count = await this.countByConversation(conversationId);

    if (count >= 6) {
      throw new Error('Maximum 6 reference images per conversation exceeded');
    }

    return count + 1;
  }

  /**
   * Create a new reference image
   */
  async create(data: Partial<ReferenceImage>): Promise<ReferenceImage> {
    const refImage = this.repository.create(data);
    return this.repository.save(refImage);
  }

  /**
   * Update a reference image
   */
  async update(
    id: string,
    data: Partial<ReferenceImage>,
  ): Promise<ReferenceImage> {
    await this.repository.update(id, data);
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Delete a reference image
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Delete all reference images for a conversation
   */
  async deleteByConversation(conversationId: string): Promise<void> {
    await this.repository.delete({ conversation_id: conversationId });
  }

  /**
   * Associate reference images with a project
   */
  async associateWithProject(
    conversationId: string,
    projectId: string,
  ): Promise<void> {
    await this.repository.update(
      { conversation_id: conversationId },
      { project_id: projectId },
    );
  }
}
