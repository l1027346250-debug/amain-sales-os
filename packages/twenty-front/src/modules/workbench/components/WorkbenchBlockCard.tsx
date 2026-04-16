import { styled } from '@linaria/react';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { themeCssVariables } from 'twenty-ui/theme-constants';

type WorkbenchBlockCardProps = {
  testId?: string;
  title: string;
  description: string;
  count?: number;
  footerLabel?: string;
  footerTo?: string;
  children: ReactNode;
};

const StyledBlock = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-height: 220px;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledTitleRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledCount = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledDescription = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
`;

const StyledBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-height: 0;
`;

const StyledFooterLink = styled(Link)`
  color: ${themeCssVariables.accent.primary};
  font-size: ${themeCssVariables.font.size.sm};
  margin-top: auto;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const WorkbenchBlockCard = ({
  testId,
  title,
  description,
  count,
  footerLabel,
  footerTo,
  children,
}: WorkbenchBlockCardProps) => {
  return (
    <StyledBlock data-testid={testId}>
      <StyledHeader>
        <StyledTitleRow>
          <StyledTitle>{title}</StyledTitle>
          {typeof count === 'number' && <StyledCount>{count}</StyledCount>}
        </StyledTitleRow>
        <StyledDescription>{description}</StyledDescription>
      </StyledHeader>
      <StyledBody>{children}</StyledBody>
      {footerLabel && footerTo ? (
        <StyledFooterLink to={footerTo}>{footerLabel}</StyledFooterLink>
      ) : null}
    </StyledBlock>
  );
};
