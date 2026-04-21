import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import {
  ENTERPRISE_ENTITY_BINDINGS,
  type EnterpriseEntityBindingConfig,
} from 'src/modules/enterprise/shared/constants/enterprise-entity-bindings';
import { EnterpriseEntityType } from 'src/modules/enterprise/shared/types/enterprise-entity-type';
import { EnterpriseEntityBindingEntity } from 'src/modules/enterprise/entity-binding/enterprise-entity-binding.entity';

@Injectable()
export class EnterpriseEntityBindingService {
  constructor(
    @InjectRepository(EnterpriseEntityBindingEntity)
    private readonly enterpriseEntityBindingRepository: Repository<EnterpriseEntityBindingEntity>,
    @InjectRepository(ObjectMetadataEntity)
    private readonly objectMetadataRepository: Repository<ObjectMetadataEntity>,
  ) {}

  async listEntities(workspaceId: string) {
    const metadataObjects = await this.objectMetadataRepository.find({
      select: ['id', 'nameSingular'],
      where: {
        workspaceId,
      },
    });

    const metadataNameSet = new Set(
      metadataObjects.map((objectMetadata) => objectMetadata.nameSingular),
    );

    return ENTERPRISE_ENTITY_BINDINGS.map((binding) => ({
      entityType: binding.entityType,
      label: binding.label,
      metadataName: binding.metadataName,
      available:
        binding.metadataName !== null &&
        metadataNameSet.has(binding.metadataName),
    }));
  }

  async resolveBindingOrFail(
    workspaceId: string,
    entityType: EnterpriseEntityType,
  ): Promise<EnterpriseEntityBindingEntity> {
    const existingBinding =
      await this.enterpriseEntityBindingRepository.findOne({
        where: {
          workspaceId,
          entityType,
        },
      });

    if (existingBinding) {
      return existingBinding;
    }

    const config = ENTERPRISE_ENTITY_BINDINGS.find(
      (binding) => binding.entityType === entityType,
    );

    if (!config || !config.metadataName) {
      throw new NotFoundException(
        `Enterprise entity ${entityType} is not configured`,
      );
    }

    const objectMetadata = await this.objectMetadataRepository.findOne({
      where: {
        workspaceId,
        nameSingular: config.metadataName,
      },
    });

    if (!objectMetadata) {
      throw new NotFoundException(
        `Object metadata ${config.metadataName} was not found in workspace ${workspaceId}`,
      );
    }

    const createdBinding = this.enterpriseEntityBindingRepository.create({
      workspaceId,
      entityType,
      objectMetadataId: objectMetadata.id,
      objectNameSingular: objectMetadata.nameSingular,
      objectNamePlural: objectMetadata.namePlural,
      enabled: true,
    });

    return this.enterpriseEntityBindingRepository.save(createdBinding);
  }

  async resolveBindingByIdOrFail(
    workspaceId: string,
    bindingId: string,
  ): Promise<EnterpriseEntityBindingEntity> {
    const binding = await this.enterpriseEntityBindingRepository.findOne({
      where: {
        id: bindingId,
        workspaceId,
      },
    });

    if (!binding) {
      throw new NotFoundException(
        `Enterprise entity binding ${bindingId} was not found`,
      );
    }

    return binding;
  }

  getBindingConfig(
    entityType: EnterpriseEntityType,
  ): EnterpriseEntityBindingConfig | undefined {
    return ENTERPRISE_ENTITY_BINDINGS.find(
      (binding) => binding.entityType === entityType,
    );
  }
}
