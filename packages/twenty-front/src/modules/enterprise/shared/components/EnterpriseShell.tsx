import { styled } from '@linaria/react';
import { PropsWithChildren } from 'react';

import { EnterprisePageHeader } from '@/enterprise/shared/components/EnterprisePageHeader';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledLayout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
`;

const StyledBody = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 240px 1fr;
  padding: 0 ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[4]};
`;

const StyledSidebar = styled.aside`
  background: ${themeCssVariables.background.noisy};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledContent = styled.main`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  min-height: 480px;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledSectionTitle = styled.div`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.sm};
  margin-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledItem = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  margin-bottom: ${themeCssVariables.spacing[2]};
`;

export const EnterpriseShell = ({
  title,
  sidebar,
  children,
}: PropsWithChildren<{ title: string; sidebar: Array<{ title: string; items: string[] }> }>) => {
  return (
    <StyledLayout>
      <EnterprisePageHeader title={title} />
      <StyledBody>
        <StyledSidebar>
          {sidebar.map((section) => (
            <div key={section.title}>
              <StyledSectionTitle>{section.title}</StyledSectionTitle>
              {section.items.map((item) => (
                <StyledItem key={item}>{item}</StyledItem>
              ))}
            </div>
          ))}
        </StyledSidebar>
        <StyledContent>{children}</StyledContent>
      </StyledBody>
    </StyledLayout>
  );
};
