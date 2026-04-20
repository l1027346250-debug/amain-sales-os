import { PartialType } from '@nestjs/mapped-types';

import { CreateEnterpriseFieldDto } from 'src/modules/enterprise/field-definition/dtos/create-enterprise-field.dto';

export class UpdateEnterpriseFieldDto extends PartialType(
  CreateEnterpriseFieldDto,
) {}
