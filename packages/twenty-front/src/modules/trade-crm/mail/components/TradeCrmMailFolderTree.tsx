import { styled } from '@linaria/react';
import { type ReactNode } from 'react';

import { type MessageFolderTreeNode } from '@/settings/accounts/components/message-folders/utils/computeMessageFolderTree';
import { formatFolderName } from '@/settings/accounts/components/message-folders/utils/formatFolderName';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type TradeCrmMailFolderTreeProps = {
  folderTreeNodes: MessageFolderTreeNode[];
};

const StyledTree = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledTreeItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledFolderRow = styled.div<{ $depth: number; $synced: boolean }>`
  align-items: center;
  background: ${({ $synced }) =>
    $synced ? tradeCrmUiTheme.colors.page : tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.inkMuted};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  padding-left: ${({ $depth }) =>
    `calc(${themeCssVariables.spacing[3]} + ${$depth} * ${themeCssVariables.spacing[3]})`};
`;

const StyledFolderDot = styled.div<{ $synced: boolean }>`
  background: ${({ $synced }) =>
    $synced
      ? tradeCrmUiTheme.colors.ink
      : tradeCrmUiTheme.colors.borderInteractive};
  border-radius: ${themeCssVariables.border.radius.rounded};
  height: 8px;
  width: 8px;
`;

const renderFolderNode = (
  folderTreeNode: MessageFolderTreeNode,
  depth = 0,
): ReactNode => (
  <StyledTreeItem key={folderTreeNode.folder.id}>
    <StyledFolderRow $depth={depth} $synced={folderTreeNode.folder.isSynced}>
      <StyledFolderDot $synced={folderTreeNode.folder.isSynced} />
      <span>{formatFolderName(folderTreeNode.folder.name)}</span>
    </StyledFolderRow>
    {folderTreeNode.children.length > 0 ? (
      <StyledTree>
        {folderTreeNode.children.map((childNode) =>
          renderFolderNode(childNode, depth + 1),
        )}
      </StyledTree>
    ) : null}
  </StyledTreeItem>
);

export const TradeCrmMailFolderTree = ({
  folderTreeNodes,
}: TradeCrmMailFolderTreeProps) => {
  if (folderTreeNodes.length === 0) {
    return null;
  }

  return (
    <StyledTree>
      {folderTreeNodes.map((node) => renderFolderNode(node))}
    </StyledTree>
  );
};
