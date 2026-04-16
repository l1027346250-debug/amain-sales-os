import { Link, useNavigate } from 'react-router-dom';

import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { IconPlug, IconTestPipe, Status } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';

import { type AiProviderItem } from '@/settings/admin-panel/ai/types/AiProviderItem';
import { getAiProviderReadiness } from '@/settings/admin-panel/ai/utils/getAiProviderReadiness';
import { getProviderIcon } from '@/settings/admin-panel/ai/utils/getProviderIcon';
import { SettingsCard } from '@/settings/components/SettingsCard';
import { SettingsListCard } from '@/settings/components/SettingsListCard';

const StyledLinkContainer = styled.div`
  > a {
    text-decoration: none;
  }
`;

const StyledRowRightContainer = styled.div`
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StyledRowStatusContainer = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
`;

const StyledProbeHint = styled.span`
  color: var(--twenty-font-color-tertiary);
  font-size: 12px;
  max-width: 360px;
  text-align: right;
`;

type SettingsAdminAiProviderListCardProps = {
  emptyStateDescription?: string;
  emptyStateTitle?: string;
  providers: AiProviderItem[];
  onClearProbeResult?: (provider: AiProviderItem) => void;
  showAddButton?: boolean;
  onProbeProvider?: (provider: AiProviderItem) => void | Promise<void>;
  probeResultsByProvider?: Record<
    string,
    {
      ok: boolean;
      testedAt: string;
      modelCount?: number;
      error?: string;
    }
  >;
  testingProviderId?: string | null;
};

const getNormalizedProviderReadinessDescription = (
  provider: AiProviderItem,
): string => getAiProviderReadiness(provider).descriptionParts.join(' | ');

export const SettingsAdminAiProviderListCard = ({
  emptyStateDescription,
  emptyStateTitle,
  providers,
  onClearProbeResult,
  showAddButton = true,
  onProbeProvider,
  probeResultsByProvider,
  testingProviderId,
}: SettingsAdminAiProviderListCardProps) => {
  const navigate = useNavigate();

  if (providers.length === 0 && showAddButton) {
    return (
      <StyledLinkContainer>
        <Link to={getSettingsPath(SettingsPath.AdminPanelNewAiProvider)}>
          <SettingsCard title={t`Add Custom Provider`} Icon={<IconPlug />} />
        </Link>
      </StyledLinkContainer>
    );
  }

  if (providers.length === 0) {
    if (!emptyStateTitle) {
      return null;
    }

    return (
      <SettingsCard
        title={emptyStateTitle}
        description={emptyStateDescription}
        Icon={<IconPlug />}
      />
    );
  }

  return (
    <SettingsListCard
      items={providers}
      rounded
      RowIconFn={(provider) => getProviderIcon(provider.name ?? provider.id)}
      getItemLabel={(provider) => provider.label ?? provider.id}
      getItemDescription={getNormalizedProviderReadinessDescription}
      RowRightComponent={({ item: provider }) => {
        const readiness = getAiProviderReadiness(provider);
        const probeResult = probeResultsByProvider?.[provider.id];

        return (
          <StyledRowRightContainer>
            <StyledRowStatusContainer>
              {probeResult && onClearProbeResult && (
                <Button
                  title={t`Clear`}
                  variant="tertiary"
                  size="small"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onClearProbeResult(provider);
                  }}
                />
              )}
              {onProbeProvider && (
                <Button
                  Icon={IconTestPipe}
                  title={t`Test`}
                  variant="secondary"
                  size="small"
                  isLoading={testingProviderId === provider.id}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void onProbeProvider(provider);
                  }}
                />
              )}
              <Status
                color={readiness.statusColor}
                text={readiness.statusText}
                weight="medium"
              />
            </StyledRowStatusContainer>
            {probeResult && (
              <StyledProbeHint>
                {probeResult.ok
                  ? probeResult.modelCount !== undefined
                    ? t`Last test passed at ${probeResult.testedAt} (${probeResult.modelCount} models)`
                    : t`Last test passed at ${probeResult.testedAt}`
                  : probeResult.error
                    ? t`Last test failed at ${probeResult.testedAt}: ${probeResult.error}`
                    : t`Last test failed at ${probeResult.testedAt}`}
              </StyledProbeHint>
            )}
          </StyledRowRightContainer>
        );
      }}
      to={(provider) =>
        getSettingsPath(SettingsPath.AdminPanelAiProviderDetail, {
          providerName: provider.id,
        })
      }
      hasFooter={showAddButton}
      footerButtonLabel={t`Add Custom Provider`}
      onFooterButtonClick={() =>
        navigate(getSettingsPath(SettingsPath.AdminPanelNewAiProvider))
      }
    />
  );
};
