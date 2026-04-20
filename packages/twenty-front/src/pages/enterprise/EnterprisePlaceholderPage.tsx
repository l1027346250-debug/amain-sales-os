import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import { enterpriseNavigationGroups } from '@/enterprise/shared/constants/enterpriseNavigation';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledTitle = styled.h2`
  font-size: ${themeCssVariables.font.size.xl};
  margin: 0 0 ${themeCssVariables.spacing[3]};
`;

const StyledText = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  margin: 0;
  max-width: 720px;
`;

export const EnterprisePlaceholderPage = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <EnterprisePermissionGuard>
      <EnterpriseShell
        title={title}
        sidebar={enterpriseNavigationGroups.map((section) => ({
          title: section.label,
          items: section.items.map((item) => item.label),
        }))}
      >
        <StyledTitle>{title}</StyledTitle>
        <StyledText>{description}</StyledText>
      </EnterpriseShell>
    </EnterprisePermissionGuard>
  );
};
