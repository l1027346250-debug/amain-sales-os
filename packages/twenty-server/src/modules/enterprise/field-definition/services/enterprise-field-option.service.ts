import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  EnterpriseFieldOptionInputDto,
} from 'src/modules/enterprise/field-definition/dtos/create-enterprise-field.dto';
import { EnterpriseFieldDefinitionEntity } from 'src/modules/enterprise/field-definition/enterprise-field-definition.entity';
import { EnterpriseFieldOptionEntity } from 'src/modules/enterprise/field-definition/enterprise-field-option.entity';
import { EnterpriseFieldType } from 'src/modules/enterprise/shared/types/enterprise-field-type';

@Injectable()
export class EnterpriseFieldOptionService {
  constructor(
    @InjectRepository(EnterpriseFieldOptionEntity)
    private readonly enterpriseFieldOptionRepository: Repository<EnterpriseFieldOptionEntity>,
    @InjectRepository(EnterpriseFieldDefinitionEntity)
    private readonly enterpriseFieldDefinitionRepository: Repository<EnterpriseFieldDefinitionEntity>,
  ) {}

  async findByFieldDefinitionId(
    workspaceId: string,
    fieldDefinitionId: string,
  ) {
    return this.enterpriseFieldOptionRepository.find({
      where: {
        workspaceId,
        fieldDefinitionId,
      },
      order: {
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  async replaceOptions(
    workspaceId: string,
    fieldDefinitionId: string,
    options: EnterpriseFieldOptionInputDto[],
  ) {
    const fieldDefinition =
      await this.enterpriseFieldDefinitionRepository.findOne({
        where: {
          id: fieldDefinitionId,
          workspaceId,
        },
      });

    if (!fieldDefinition) {
      throw new NotFoundException(
        `Enterprise field definition ${fieldDefinitionId} was not found`,
      );
    }

    if (
      fieldDefinition.fieldType !== EnterpriseFieldType.SELECT &&
      fieldDefinition.fieldType !== EnterpriseFieldType.MULTI_SELECT
    ) {
      throw new BadRequestException(
        'Options can only be assigned to select or multiSelect fields',
      );
    }

    await this.enterpriseFieldOptionRepository.delete({
      workspaceId,
      fieldDefinitionId,
    });

    if (options.length === 0) {
      return [];
    }

    return this.enterpriseFieldOptionRepository.save(
      options.map((option, index) =>
        this.enterpriseFieldOptionRepository.create({
          workspaceId,
          fieldDefinitionId,
          optionCode: option.optionCode,
          optionLabel: option.optionLabel,
          color: option.color ?? null,
          sortOrder: option.sortOrder ?? index,
          enabled: option.enabled ?? true,
        }),
      ),
    );
  }
}
