import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class ConvertLeadToCustomerInput {
  @Field(() => UUIDScalarType)
  leadId: string;
}

@ObjectType('ConvertLeadToCustomerResult')
export class ConvertLeadToCustomerResultDTO {
  @Field(() => UUIDScalarType)
  leadId: string;

  @Field(() => UUIDScalarType)
  customerId: string;

  @Field(() => UUIDScalarType, { nullable: true })
  contactId: string | null;
}
