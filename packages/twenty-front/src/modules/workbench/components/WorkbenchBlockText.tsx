import { styled } from '@linaria/react';

import { themeCssVariables } from 'twenty-ui/theme-constants';

export const WorkbenchBlockEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
`;

export const WorkbenchBlockHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.5;
  margin-bottom: ${themeCssVariables.spacing[2]};
`;
