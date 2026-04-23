import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';

import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export type TradeCrmCustomerTableBadgeTone = string;

export type TradeCrmCustomerTableCell = {
  primary: string;
  secondary?: string;
  badgeLabel?: string;
  badgeTone?: TradeCrmCustomerTableBadgeTone;
};

export type TradeCrmCustomerTableRow = {
  id: string;
  cells: TradeCrmCustomerTableCell[];
  actionLabel?: string;
  actionTo?: string;
};

type TradeCrmCustomerTableProps = {
  title: string;
  description: string;
  columns: string[];
  rows: TradeCrmCustomerTableRow[];
  emptyState?: string;
};

const StyledCard = styled.section`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  overflow: hidden;
`;

const StyledHeader = styled.div`
  align-items: end;
  border-bottom: 1px solid ${tradeCrmUiTheme.colors.border};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledDescription = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
  max-width: 760px;
`;

const StyledTable = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledRow = styled.div<{ $columnCount: number; $isHeader?: boolean }>`
  align-items: stretch;
  border-top: ${({ $isHeader }) =>
    $isHeader ? '0' : `1px solid ${tradeCrmUiTheme.colors.border}`};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(
      ${({ $columnCount }) => $columnCount},
      minmax(0, 1fr)
    )
    120px;
  padding: ${({ $isHeader }) =>
    $isHeader
      ? `${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]}`
      : `${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]}`};

  @media (max-width: 1180px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StyledHeaderCell = styled.div`
  color: ${tradeCrmUiTheme.colors.inkFaint};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const StyledCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledCellPrimary = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledCellSecondary = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledBadge = styled.span<{ $tone: TradeCrmCustomerTableBadgeTone }>`
  align-self: flex-start;
  background: ${({ $tone }) =>
    $tone === 'green'
      ? 'rgba(28, 145, 95, 0.12)'
      : $tone === 'amber'
        ? 'rgba(216, 145, 24, 0.12)'
        : $tone === 'blue'
          ? 'rgba(39, 106, 245, 0.12)'
          : $tone === 'red'
            ? 'rgba(200, 74, 63, 0.12)'
            : tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'green'
        ? 'rgba(28, 145, 95, 0.2)'
        : $tone === 'amber'
          ? 'rgba(216, 145, 24, 0.2)'
          : $tone === 'blue'
            ? 'rgba(39, 106, 245, 0.2)'
            : $tone === 'red'
              ? 'rgba(200, 74, 63, 0.2)'
              : tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${({ $tone }) =>
    $tone === 'green'
      ? '#176C49'
      : $tone === 'amber'
        ? '#8E5B00'
        : $tone === 'blue'
          ? '#2759C6'
          : $tone === 'red'
            ? '#A54439'
            : tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 4px 8px;
`;

const StyledAction = styled(Link)`
  align-self: center;
  border: 1px solid ${tradeCrmUiTheme.colors.borderStrong};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-align: center;
  text-decoration: none;

  &:hover {
    background: ${tradeCrmUiTheme.colors.surfaceMuted};
  }
`;

const StyledEmpty = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  padding: ${themeCssVariables.spacing[5]} ${themeCssVariables.spacing[4]};
`;

export const TradeCrmCustomerTable = ({
  title,
  description,
  columns,
  rows,
  emptyState = 'No rows available yet.',
}: TradeCrmCustomerTableProps) => {
  return (
    <StyledCard>
      <StyledHeader>
        <StyledTitleBlock>
          <StyledTitle>{title}</StyledTitle>
          <StyledDescription>{description}</StyledDescription>
        </StyledTitleBlock>
      </StyledHeader>
      <StyledTable>
        <StyledRow $columnCount={columns.length} $isHeader>
          {columns.map((column) => (
            <StyledHeaderCell key={column}>{column}</StyledHeaderCell>
          ))}
          <StyledHeaderCell>Action</StyledHeaderCell>
        </StyledRow>
        {rows.length > 0 ? (
          rows.map((row) => (
            <StyledRow $columnCount={columns.length} key={row.id}>
              {row.cells.map((cell, cellIndex) => (
                <StyledCell key={`${row.id}-${cellIndex}`}>
                  {cell.badgeLabel ? (
                    <StyledBadge $tone={cell.badgeTone ?? 'neutral'}>
                      {cell.badgeLabel}
                    </StyledBadge>
                  ) : null}
                  <StyledCellPrimary>{cell.primary}</StyledCellPrimary>
                  {cell.secondary ? (
                    <StyledCellSecondary>{cell.secondary}</StyledCellSecondary>
                  ) : null}
                </StyledCell>
              ))}
              {row.actionTo ? (
                <StyledAction to={row.actionTo}>
                  {row.actionLabel ?? 'Open'}
                </StyledAction>
              ) : (
                <StyledCellSecondary>{row.actionLabel ?? '--'}</StyledCellSecondary>
              )}
            </StyledRow>
          ))
        ) : (
          <StyledEmpty>{emptyState}</StyledEmpty>
        )}
      </StyledTable>
    </StyledCard>
  );
};
