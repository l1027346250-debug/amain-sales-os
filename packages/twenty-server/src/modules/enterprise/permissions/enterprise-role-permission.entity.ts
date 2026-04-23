import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { RoleEntity } from 'src/engine/metadata-modules/role/role.entity';
import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';
import { type EnterprisePermissionCode } from 'src/modules/enterprise/permissions/types/enterprise-permission-code';

@Entity({ name: 'enterpriseRolePermission', schema: 'core' })
@Unique('IDX_ENTERPRISE_ROLE_PERMISSION_WORKSPACE_ROLE_CODE_UNIQUE', [
  'workspaceId',
  'roleId',
  'permissionCode',
])
@Index('IDX_ENTERPRISE_ROLE_PERMISSION_WORKSPACE_ROLE', [
  'workspaceId',
  'roleId',
])
export class EnterpriseRolePermissionEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  roleId: string;

  @ManyToOne(() => RoleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: Relation<RoleEntity>;

  @Column({ type: 'varchar', length: 120 })
  permissionCode: EnterprisePermissionCode;

  @Column({ type: 'boolean', default: true })
  granted: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdByWorkspaceMemberId: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedByWorkspaceMemberId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
