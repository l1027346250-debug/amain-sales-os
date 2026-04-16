import { styled } from '@linaria/react';
import { useStore } from 'jotai';
import { enUS } from 'date-fns/locale';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { APP_LOCALES } from 'twenty-shared/translations';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useInvalidateMetadataStore } from '@/metadata-store/hooks/useInvalidateMetadataStore';
import { getDateFnsLocale } from '@/ui/field/display/utils/getDateFnsLocale';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';
import { logError } from '~/utils/logError';
import { dateLocaleState } from '~/localization/states/dateLocaleState';

import { useTradeCrmLocale } from '@/trade-crm/shared/hooks/useTradeCrmLocale';

const StyledContainer = styled.div`
  align-items: center;
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  box-shadow: ${tradeCrmUiTheme.shadow.soft};
  display: inline-flex;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[1]};
`;

const StyledSegmentButton = styled.button<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active
      ? tradeCrmUiTheme.colors.ink
      : tradeCrmUiTheme.colors.surfaceInteractive};
  border: none;
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${({ $active }) =>
    $active
      ? tradeCrmUiTheme.colors.inverted
      : tradeCrmUiTheme.colors.inkMuted};
  cursor: ${({ $active }) => ($active ? 'default' : 'pointer')};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  min-height: 32px;
  min-width: 88px;
  padding: 0 ${themeCssVariables.spacing[3]};
  transition:
    background-color 140ms ease,
    color 140ms ease,
    transform 140ms ease;

  &:hover {
    transform: ${({ $active }) => ($active ? 'none' : 'translateY(-1px)')};
  }

  &:focus-visible {
    outline: 2px solid ${tradeCrmUiTheme.colors.focusRing};
    outline-offset: 2px;
  }
`;

export const TradeCrmLocaleSwitch = () => {
  const store = useStore();
  const { locale, isChinese } = useTradeCrmLocale();
  const [currentWorkspaceMember, setCurrentWorkspaceMember] = useAtomState(
    currentWorkspaceMemberState,
  );
  const { updateOneRecord } = useUpdateOneRecord();
  const { invalidateMetadataStore } = useInvalidateMetadataStore();

  const persistLocale = async (nextLocale: keyof typeof APP_LOCALES) => {
    setCurrentWorkspaceMember((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            locale: nextLocale,
          }
        : currentValue,
    );

    if (currentWorkspaceMember?.id) {
      try {
        await updateOneRecord({
          objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
          idToUpdate: currentWorkspaceMember.id,
          updateOneRecordInput: {
            locale: nextLocale,
          },
        });
      } catch (error) {
        logError(error);
      }
    }

    const dateFnsLocale = await getDateFnsLocale(nextLocale);

    store.set(dateLocaleState.atom, {
      locale: nextLocale,
      localeCatalog: dateFnsLocale || enUS,
    });

    await dynamicActivate(nextLocale);

    try {
      localStorage.setItem('locale', nextLocale);
      document.documentElement.lang = nextLocale;
    } catch (error) {
      logError(error);
    }

    invalidateMetadataStore();
  };

  return (
    <StyledContainer aria-label={isChinese ? '界面语言切换' : 'Interface language'}>
      <StyledSegmentButton
        type="button"
        $active={locale === APP_LOCALES['zh-CN']}
        onClick={() => void persistLocale(APP_LOCALES['zh-CN'])}
      >
        中文
      </StyledSegmentButton>
      <StyledSegmentButton
        type="button"
        $active={locale === APP_LOCALES.en}
        onClick={() => void persistLocale(APP_LOCALES.en)}
      >
        English
      </StyledSegmentButton>
    </StyledContainer>
  );
};
