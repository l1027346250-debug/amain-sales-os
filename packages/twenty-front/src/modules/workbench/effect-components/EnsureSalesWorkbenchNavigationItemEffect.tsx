import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useCreateManyNavigationMenuItems } from '@/navigation-menu-item/common/hooks/useCreateManyNavigationMenuItems';
import { navigationMenuItemsSelector } from '@/navigation-menu-item/common/states/navigationMenuItemsSelector';
import { filterWorkspaceNavigationMenuItems } from '@/navigation-menu-item/common/utils/filterWorkspaceNavigationMenuItems';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';
import { type CreateNavigationMenuItemInput } from '~/generated-metadata/graphql';
import { AppPath, NavigationMenuItemType } from 'twenty-shared/types';

const isSalesWorkbenchLink = (link: string | null | undefined) => {
  const normalizedLink = (link ?? '').trim();

  if (normalizedLink === AppPath.SalesWorkbench) {
    return true;
  }

  if (!normalizedLink) {
    return false;
  }

  try {
    const parsedUrl = new URL(normalizedLink);

    return parsedUrl.pathname === AppPath.SalesWorkbench;
  } catch {
    return false;
  }
};

export const EnsureSalesWorkbenchNavigationItemEffect = () => {
  const { t } = useLingui();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const navigationMenuItems = useAtomStateValue(navigationMenuItemsSelector);
  const { createManyNavigationMenuItems } = useCreateManyNavigationMenuItems();

  const attemptedWorkspaceMemberIdRef = useRef<string | null>(null);

  useEffect(() => {
    const workspaceMemberId = currentWorkspaceMember?.id;

    if (!workspaceMemberId) {
      attemptedWorkspaceMemberIdRef.current = null;
      return;
    }

    const workspaceNavigationMenuItems =
      filterWorkspaceNavigationMenuItems(navigationMenuItems);

    const hasWorkbenchNavigationItem = workspaceNavigationMenuItems.some(
      (item) =>
        item.type === NavigationMenuItemType.LINK &&
        isSalesWorkbenchLink(item.link),
    );

    if (hasWorkbenchNavigationItem) {
      attemptedWorkspaceMemberIdRef.current = workspaceMemberId;
      return;
    }

    if (attemptedWorkspaceMemberIdRef.current === workspaceMemberId) {
      return;
    }

    attemptedWorkspaceMemberIdRef.current = workspaceMemberId;

    const topLevelWorkspaceItems = workspaceNavigationMenuItems.filter(
      (item) => item.folderId == null,
    );

    const minPosition =
      topLevelWorkspaceItems.length > 0
        ? Math.min(...topLevelWorkspaceItems.map((item) => item.position))
        : 1;

    const input: CreateNavigationMenuItemInput = {
      id: crypto.randomUUID(),
      type: NavigationMenuItemType.LINK,
      name: t`Sales Workbench`,
      link: AppPath.SalesWorkbench,
      folderId: null,
      userWorkspaceId: null,
      targetObjectMetadataId: null,
      targetRecordId: null,
      viewId: null,
      position: minPosition - 1,
    };

    void createManyNavigationMenuItems([input]).catch(() => {
      attemptedWorkspaceMemberIdRef.current = null;
    });
  }, [createManyNavigationMenuItems, currentWorkspaceMember?.id, navigationMenuItems, t]);

  return null;
};
