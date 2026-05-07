import { useCallback, useEffect, useMemo, useState } from 'react';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';

import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import {
  enterprisePermissionCodes,
  type EnterprisePermissionCode,
} from '@/enterprise/shared/constants/enterprisePermissions';
import { enterpriseNavigationGroups } from '@/enterprise/shared/constants/enterpriseNavigation';
import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { useEnterprisePermissions } from '@/enterprise/shared/hooks/useEnterprisePermissions';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type EnterpriseRole = {
  id: string;
  label: string;
  description: string | null;
  canUpdateAllSettings: boolean;
  canAccessAllTools: boolean;
};

type GetEnterpriseRolesQueryResult = {
  getRoles: EnterpriseRole[];
};

type EnterprisePermissionCatalogItem = {
  permissionCode: EnterprisePermissionCode;
};

type EnterpriseRolePermissionsResponse = {
  configured: boolean;
  permissionCodes: EnterprisePermissionCode[];
  roleId: string;
};

type PermissionGroup = {
  description: string;
  permissionCodes: EnterprisePermissionCode[];
  title: string;
};

const GET_ENTERPRISE_ROLES = gql`
  query GetEnterpriseRolesForPermissions {
    getRoles {
      id
      label
      description
      canUpdateAllSettings
      canAccessAllTools
    }
  }
`;

const permissionGroups: PermissionGroup[] = [
  {
    title: '邮箱中台',
    description: '控制企业邮箱账号、分配、规则和健康检查。 ',
    permissionCodes: [
      enterprisePermissionCodes.mailboxRead,
      enterprisePermissionCodes.mailboxCreate,
      enterprisePermissionCodes.mailboxUpdate,
      enterprisePermissionCodes.mailboxAssign,
    ],
  },
  {
    title: '字段与布局',
    description: '控制自定义字段、字段选项、字段显示布局的读取和维护。',
    permissionCodes: [
      enterprisePermissionCodes.fieldRead,
      enterprisePermissionCodes.fieldCreate,
      enterprisePermissionCodes.fieldUpdate,
      enterprisePermissionCodes.fieldDelete,
      enterprisePermissionCodes.fieldLayoutRead,
      enterprisePermissionCodes.fieldLayoutUpdate,
    ],
  },
  {
    title: '数据治理',
    description: '控制客户导出、下载、回收站恢复和永久清空。',
    permissionCodes: [
      enterprisePermissionCodes.customerExportRead,
      enterprisePermissionCodes.customerExportCreate,
      enterprisePermissionCodes.customerExportDownload,
      enterprisePermissionCodes.recycleRead,
      enterprisePermissionCodes.recycleRestore,
      enterprisePermissionCodes.recyclePurge,
    ],
  },
  {
    title: '流程规则',
    description: '控制报告模板、获客来源流转和来源黑名单。',
    permissionCodes: [
      enterprisePermissionCodes.reportTemplateRead,
      enterprisePermissionCodes.reportTemplateCreate,
      enterprisePermissionCodes.reportTemplateUpdate,
      enterprisePermissionCodes.reportTemplateDelete,
      enterprisePermissionCodes.sourceConvertRead,
      enterprisePermissionCodes.sourceConvertUpdate,
      enterprisePermissionCodes.sourceConvertBlacklistRead,
      enterprisePermissionCodes.sourceConvertBlacklistUpdate,
    ],
  },
  {
    title: '外部对接',
    description: '控制独立站绑定、解绑、字段映射、分配规则和询盘处置。',
    permissionCodes: [
      enterprisePermissionCodes.independentStationRead,
      enterprisePermissionCodes.independentStationBind,
      enterprisePermissionCodes.independentStationUpdate,
      enterprisePermissionCodes.independentStationUnbind,
    ],
  },
  {
    title: '销售辅助',
    description: '控制销售 Playbook 的读取、创建和维护。',
    permissionCodes: [
      enterprisePermissionCodes.salesPlaybookRead,
      enterprisePermissionCodes.salesPlaybookCreate,
      enterprisePermissionCodes.salesPlaybookUpdate,
    ],
  },
  {
    title: '安全权限',
    description: '控制企业管理权限目录和角色授权配置。',
    permissionCodes: [
      enterprisePermissionCodes.permissionsRead,
      enterprisePermissionCodes.permissionsUpdate,
    ],
  },
];

const permissionLabels: Record<EnterprisePermissionCode, string> = {
  [enterprisePermissionCodes.mailboxAssign]: '分配企业邮箱',
  [enterprisePermissionCodes.mailboxCreate]: '创建企业邮箱账号',
  [enterprisePermissionCodes.mailboxRead]: '查看邮箱中台',
  [enterprisePermissionCodes.mailboxUpdate]: '更新邮箱中台',
  [enterprisePermissionCodes.customerExportCreate]: '创建客户导出任务',
  [enterprisePermissionCodes.customerExportDownload]: '下载客户导出文件',
  [enterprisePermissionCodes.customerExportRead]: '查看客户导出',
  [enterprisePermissionCodes.fieldCreate]: '新增字段',
  [enterprisePermissionCodes.fieldDelete]: '删除字段',
  [enterprisePermissionCodes.fieldLayoutRead]: '查看字段显示',
  [enterprisePermissionCodes.fieldLayoutUpdate]: '更新字段显示',
  [enterprisePermissionCodes.fieldRead]: '查看字段',
  [enterprisePermissionCodes.fieldUpdate]: '编辑字段',
  [enterprisePermissionCodes.independentStationBind]: '绑定独立站',
  [enterprisePermissionCodes.independentStationRead]: '查看独立站',
  [enterprisePermissionCodes.independentStationUnbind]: '解绑独立站',
  [enterprisePermissionCodes.independentStationUpdate]: '更新独立站',
  [enterprisePermissionCodes.permissionsRead]: '查看企业权限配置',
  [enterprisePermissionCodes.permissionsUpdate]: '更新企业权限配置',
  [enterprisePermissionCodes.recyclePurge]: '永久清空回收箱',
  [enterprisePermissionCodes.recycleRead]: '查看回收箱',
  [enterprisePermissionCodes.recycleRestore]: '恢复回收记录',
  [enterprisePermissionCodes.reportTemplateCreate]: '创建报告模板',
  [enterprisePermissionCodes.reportTemplateDelete]: '删除报告模板',
  [enterprisePermissionCodes.reportTemplateRead]: '查看报告模板',
  [enterprisePermissionCodes.reportTemplateUpdate]: '更新报告模板',
  [enterprisePermissionCodes.salesPlaybookCreate]: '创建销售助手流程',
  [enterprisePermissionCodes.salesPlaybookRead]: '查看销售助手',
  [enterprisePermissionCodes.salesPlaybookUpdate]: '更新销售助手',
  [enterprisePermissionCodes.sourceConvertBlacklistRead]: '查看来源黑名单',
  [enterprisePermissionCodes.sourceConvertBlacklistUpdate]: '更新来源黑名单',
  [enterprisePermissionCodes.sourceConvertRead]: '查看来源流转',
  [enterprisePermissionCodes.sourceConvertUpdate]: '更新来源流转',
};

const buildSidebar = () =>
  enterpriseNavigationGroups.map((section) => ({
    title: section.label,
    items: section.items.map((item) => item.label),
  }));

export const EnterprisePermissionsPage = () => {
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const { hasEnterprisePermission } = useEnterprisePermissions();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { data, loading: isLoadingRoles } =
    useQuery<GetEnterpriseRolesQueryResult>(GET_ENTERPRISE_ROLES);
  const [catalog, setCatalog] = useState<EnterprisePermissionCatalogItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<
    EnterprisePermissionCode[]
  >([]);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const roles: EnterpriseRole[] = data?.getRoles ?? [];
  const canUpdatePermissions = hasEnterprisePermission(
    enterprisePermissionCodes.permissionsUpdate,
  );
  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );
  const selectedPermissionSet = useMemo(
    () => new Set(selectedPermissionCodes),
    [selectedPermissionCodes],
  );
  const availablePermissionCodes = useMemo(
    () => new Set(catalog.map((item) => item.permissionCode)),
    [catalog],
  );

  const loadCatalog = useCallback(async () => {
    const response = await enterpriseApiRequest('/api/enterprise/permissions', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load enterprise permission catalog');
    }

    setCatalog((await response.json()) as EnterprisePermissionCatalogItem[]);
  }, [enterpriseApiRequest]);

  const loadRolePermissions = useCallback(
    async (roleId: string) => {
      setIsLoadingPermissions(true);

      try {
        const response = await enterpriseApiRequest(
          `/api/enterprise/permissions/roles/${roleId}`,
          { credentials: 'include' },
        );

        if (!response.ok) {
          throw new Error('Failed to load enterprise role permissions');
        }

        const rolePermissions =
          (await response.json()) as EnterpriseRolePermissionsResponse;

        setIsConfigured(rolePermissions.configured);
        setSelectedPermissionCodes(rolePermissions.permissionCodes);
      } catch {
        enqueueErrorSnackBar({ message: '无法加载角色企业权限' });
      } finally {
        setIsLoadingPermissions(false);
      }
    },
    [enqueueErrorSnackBar, enterpriseApiRequest],
  );

  useEffect(() => {
    loadCatalog().catch(() =>
      enqueueErrorSnackBar({ message: '无法加载企业权限目录' }),
    );
  }, [enqueueErrorSnackBar, loadCatalog]);

  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  useEffect(() => {
    if (!selectedRoleId) {
      return;
    }

    void loadRolePermissions(selectedRoleId);
  }, [loadRolePermissions, selectedRoleId]);

  const togglePermission = (permissionCode: EnterprisePermissionCode) => {
    if (!canUpdatePermissions) {
      enqueueErrorSnackBar({ message: '没有更新企业权限的权限' });

      return;
    }

    setSelectedPermissionCodes((currentPermissionCodes) =>
      currentPermissionCodes.includes(permissionCode)
        ? currentPermissionCodes.filter(
            (currentPermissionCode) => currentPermissionCode !== permissionCode,
          )
        : [...currentPermissionCodes, permissionCode],
    );
  };

  const selectGroupPermissions = (permissionCodes: EnterprisePermissionCode[]) => {
    if (!canUpdatePermissions) {
      enqueueErrorSnackBar({ message: '没有更新企业权限的权限' });

      return;
    }

    setSelectedPermissionCodes((currentPermissionCodes) => [
      ...new Set([...currentPermissionCodes, ...permissionCodes]),
    ]);
  };

  const clearGroupPermissions = (permissionCodes: EnterprisePermissionCode[]) => {
    if (!canUpdatePermissions) {
      enqueueErrorSnackBar({ message: '没有更新企业权限的权限' });

      return;
    }

    const permissionCodesToClear = new Set(permissionCodes);

    setSelectedPermissionCodes((currentPermissionCodes) =>
      currentPermissionCodes.filter(
        (permissionCode) => !permissionCodesToClear.has(permissionCode),
      ),
    );
  };

  const saveRolePermissions = async () => {
    if (!selectedRoleId) {
      return;
    }

    if (!canUpdatePermissions) {
      enqueueErrorSnackBar({ message: '没有更新企业权限的权限' });

      return;
    }

    setIsSaving(true);

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/permissions/roles/${selectedRoleId}`,
        {
          body: JSON.stringify({ permissionCodes: selectedPermissionCodes }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PUT',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to save enterprise role permissions');
      }

      const rolePermissions =
        (await response.json()) as EnterpriseRolePermissionsResponse;

      setIsConfigured(rolePermissions.configured);
      setSelectedPermissionCodes(rolePermissions.permissionCodes);
      enqueueSuccessSnackBar({ message: '企业权限已保存' });
    } catch {
      enqueueErrorSnackBar({ message: '保存企业权限失败' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EnterprisePermissionGuard
      requiredPermission={enterprisePermissionCodes.permissionsRead}
    >
      <EnterpriseShell title="企业管理 / 企业权限配置" sidebar={buildSidebar()}>
        <StyledGrid>
          <StyledPanel>
            <StyledHeader>
              <div>
                <StyledTitle>角色企业权限</StyledTitle>
                <StyledDescription>
                  按角色配置企业管理模块的细粒度权限。角色一旦保存过企业权限配置，将不再只依赖 ENTERPRISE / WORKSPACE fallback。
                </StyledDescription>
              </div>
              <Button
                accent="blue"
                disabled={!selectedRoleId || isSaving || !canUpdatePermissions}
                title={isSaving ? '保存中...' : '保存权限'}
                onClick={() => void saveRolePermissions()}
              />
            </StyledHeader>
          </StyledPanel>

          <StyledContentGrid>
            <StyledPanel>
              <StyledSubTitle>角色</StyledSubTitle>
              {isLoadingRoles && <StyledEmpty>角色加载中...</StyledEmpty>}
              <StyledRoleList>
                {roles.map((role) => (
                  <StyledRoleButton
                    active={role.id === selectedRoleId}
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    type="button"
                  >
                    <strong>{role.label}</strong>
                    <span>{role.description || '无角色说明'}</span>
                    <StyledRoleMeta>
                      {role.canUpdateAllSettings ? '设置全权限' : '有限设置权限'} /{' '}
                      {role.canAccessAllTools ? '工具全权限' : '有限工具权限'}
                    </StyledRoleMeta>
                  </StyledRoleButton>
                ))}
              </StyledRoleList>
            </StyledPanel>

            <StyledGrid>
              <StyledPanel>
                <StyledHeader>
                  <div>
                    <StyledSubTitle>
                      {selectedRole ? `${selectedRole.label} 的企业权限` : '企业权限'}
                    </StyledSubTitle>
                    <StyledDescription>
                      {isConfigured
                        ? '该角色已启用细粒度企业权限配置。'
                        : '该角色尚未保存企业权限配置，后端会继续使用 ENTERPRISE / WORKSPACE fallback。'}
                    </StyledDescription>
                  </div>
                  <StyledCounter>
                    {selectedPermissionCodes.length} / {catalog.length}
                  </StyledCounter>
                </StyledHeader>
              </StyledPanel>

              {isLoadingPermissions ? (
                <StyledPanel>
                  <StyledEmpty>权限加载中...</StyledEmpty>
                </StyledPanel>
              ) : (
                permissionGroups.map((permissionGroup) => (
                  <StyledPanel key={permissionGroup.title}>
                    <StyledHeader>
                      <div>
                        <StyledSubTitle>{permissionGroup.title}</StyledSubTitle>
                        <StyledDescription>
                          {permissionGroup.description}
                        </StyledDescription>
                      </div>
                      <StyledActionRow>
                        <Button
                          disabled={!canUpdatePermissions}
                          title="全选"
                          onClick={() =>
                            selectGroupPermissions(permissionGroup.permissionCodes)
                          }
                        />
                        <Button
                          disabled={!canUpdatePermissions}
                          title="清空"
                          onClick={() =>
                            clearGroupPermissions(permissionGroup.permissionCodes)
                          }
                        />
                      </StyledActionRow>
                    </StyledHeader>
                    <StyledPermissionGrid>
                      {permissionGroup.permissionCodes.map((permissionCode) => (
                        <StyledPermissionItem key={permissionCode}>
                          <input
                            checked={selectedPermissionSet.has(permissionCode)}
                            disabled={
                              !availablePermissionCodes.has(permissionCode) ||
                              !canUpdatePermissions
                            }
                            onChange={() => togglePermission(permissionCode)}
                            type="checkbox"
                          />
                          <div>
                            <strong>{permissionLabels[permissionCode]}</strong>
                            <span>{permissionCode}</span>
                          </div>
                        </StyledPermissionItem>
                      ))}
                    </StyledPermissionGrid>
                  </StyledPanel>
                ))
              )}
            </StyledGrid>
          </StyledContentGrid>
        </StyledGrid>
      </EnterpriseShell>
    </EnterprisePermissionGuard>
  );
};

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledPanel = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHeader = styled.div`
  align-items: flex-start;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledSubTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledDescription = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  line-height: ${themeCssVariables.text.lineHeight.md};
  margin: ${themeCssVariables.spacing[1]} 0 0;
`;

const StyledContentGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 320px minmax(0, 1fr);

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

const StyledRoleList = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledRoleButton = styled.button<{ active: boolean }>`
  background: ${({ active }) =>
    active
      ? themeCssVariables.background.secondary
      : themeCssVariables.background.primary};
  border: 1px solid
    ${({ active }) =>
      active
        ? themeCssVariables.border.color.medium
        : themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[3]};
  text-align: left;
`;

const StyledRoleMeta = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledCounter = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-weight: ${themeCssVariables.font.weight.medium};
  white-space: nowrap;
`;

const StyledActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledPermissionGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StyledPermissionItem = styled.label`
  align-items: flex-start;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};

  span {
    color: ${themeCssVariables.font.color.secondary};
    display: block;
    font-size: ${themeCssVariables.font.size.sm};
    margin-top: ${themeCssVariables.spacing[1]};
  }
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  padding: ${themeCssVariables.spacing[5]} 0;
  text-align: center;
`;
