import { SignInUpWithGoogle } from '@/auth/sign-in-up/components/internal/SignInUpWithGoogle';
import { SignInUpWithMicrosoft } from '@/auth/sign-in-up/components/internal/SignInUpWithMicrosoft';
import { SignInUpWithSSO } from '@/auth/sign-in-up/components/internal/SignInUpWithSSO';
import { useHandleResetPassword } from '@/auth/sign-in-up/hooks/useHandleResetPassword';
import { useSignInUp } from '@/auth/sign-in-up/hooks/useSignInUp';
import { type Form } from '@/auth/sign-in-up/hooks/useSignInUpForm';
import { signInUpModeState } from '@/auth/states/signInUpModeState';
import {
  SignInUpStep,
  signInUpStepState,
} from '@/auth/states/signInUpStepState';
import { SignInUpMode } from '@/auth/types/signInUpMode';
import { isRequestingCaptchaTokenState } from '@/captcha/states/isRequestingCaptchaTokenState';
import { captchaState } from '@/client-config/states/captchaState';
import { getDateFnsLocale } from '@/ui/field/display/utils/getDateFnsLocale';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { workspaceAuthBypassProvidersState } from '@/workspace/states/workspaceAuthBypassProvidersState';
import { workspaceAuthProvidersState } from '@/workspace/states/workspaceAuthProvidersState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { enUS } from 'date-fns/locale';
import { useStore } from 'jotai';
import { useEffect, useState, type FormEvent } from 'react';
import { Controller, FormProvider, type UseFormReturn } from 'react-hook-form';
import { useParams, useSearchParams } from 'react-router-dom';
import { APP_LOCALES } from 'twenty-shared/translations';
import { isDefined } from 'twenty-shared/utils';
import { Loader } from 'twenty-ui/feedback';
import {
  type AuthBypassProviders,
  type AuthProviders,
  type PublicWorkspaceData,
} from '~/generated-metadata/graphql';
import { dateLocaleState } from '~/localization/states/dateLocaleState';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';
import { logError } from '~/utils/logError';

import { useWorkspaceBypass } from '../hooks/useWorkspaceBypass';

type AuthLocale = (typeof APP_LOCALES)['zh-CN'] | (typeof APP_LOCALES)['en'];
type AuthSurface = 'sign-in' | 'sign-up';
type CredentialMode = 'email' | 'phone';

const authCopy = {
  [APP_LOCALES['zh-CN']]: {
    brand: '亚麦客户管理',
    brandEn: 'AMAIN CRM',
    language: '界面语言',
    workspace: '当前工作区',
    signIn: '登录',
    signUp: '报名注册',
    email: '邮箱',
    phone: '手机号',
    emailPlaceholder: '请输入邮箱',
    phonePlaceholder: '请输入手机号',
    passwordPlaceholder: '请输入密码',
    phoneNotice: '手机号登录入口已预留，当前请使用邮箱 + 密码登录。',
    passwordHint: '至少 8 个字符。',
    continue: '继续',
    continueToRegister: '继续注册',
    signInAction: '登录',
    signUpAction: '注册并进入',
    forgotPassword: '忘记密码',
    registerPrompt: '没有账号？报名注册',
    signInPrompt: '已有账号？返回登录',
    alternate: '其他登录方式',
    heroEyebrow: '外贸销售执行中枢',
    heroTitle: '把获客、客户与商机放回同一个工作面。',
    heroDescription:
      'AMAIN CRM 面向外贸销售与主管，保留清晰动作链，减少无效跳转和冗余入口。',
    chipOne: 'Lead Intake',
    chipTwo: 'Customer 360',
    chipThree: 'Pipeline Motion',
    secure: '正在使用 https 方式安全登录',
    joinRestriction:
      '加入当前工作区需要管理员邀请、公开邀请链接或已认证企业邮箱。',
    loading: '正在加载登录配置...',
    footerNote: '登录后默认进入外贸 CRM 工作台。',
  },
  [APP_LOCALES.en]: {
    brand: 'AMAIN Customer Management',
    brandEn: 'AMAIN CRM',
    language: 'Interface',
    workspace: 'Workspace',
    signIn: 'Sign in',
    signUp: 'Register',
    email: 'Email',
    phone: 'Phone',
    emailPlaceholder: 'Enter your email',
    phonePlaceholder: 'Enter your phone number',
    passwordPlaceholder: 'Enter your password',
    phoneNotice:
      'Phone sign-in is reserved for now. Use email and password in the current build.',
    passwordHint: 'At least 8 characters long.',
    continue: 'Continue',
    continueToRegister: 'Continue to register',
    signInAction: 'Sign in',
    signUpAction: 'Create account',
    forgotPassword: 'Forgot password',
    registerPrompt: 'Need an account? Register',
    signInPrompt: 'Already have an account? Sign in',
    alternate: 'Other sign-in methods',
    heroEyebrow: 'Export sales operating core',
    heroTitle:
      'Bring lead intake, customers, and pipeline back into one workspace.',
    heroDescription:
      'AMAIN CRM is tuned for export sellers and managers, with a cleaner operating surface and fewer dead-end pages.',
    chipOne: 'Lead Intake',
    chipTwo: 'Customer 360',
    chipThree: 'Pipeline Motion',
    secure: 'Using https secure sign-in',
    joinRestriction:
      'Joining this workspace requires an admin invite, a public invite link, or an approved company email domain.',
    loading: 'Loading authentication configuration...',
    footerNote: 'After sign-in, you will land in the Trade CRM workbench.',
  },
} as const;

const getInitialLocale = (locale: string | undefined): AuthLocale => {
  if (locale?.startsWith('zh')) {
    return APP_LOCALES['zh-CN'];
  }

  try {
    const storedLocale = localStorage.getItem('locale');

    if (storedLocale?.startsWith('zh')) {
      return APP_LOCALES['zh-CN'];
    }
  } catch (error) {
    logError(error);
  }

  return APP_LOCALES.en;
};

const StyledViewport = styled.div`
  --amain-ink: #152033;
  --amain-muted: rgba(21, 32, 51, 0.66);
  --amain-blue: #3f78ff;
  background:
    radial-gradient(circle at 14% 18%, rgba(123, 174, 255, 0.28), transparent 26%),
    radial-gradient(circle at 86% 12%, rgba(255, 215, 162, 0.26), transparent 22%),
    radial-gradient(circle at 82% 78%, rgba(214, 149, 255, 0.14), transparent 24%),
    linear-gradient(135deg, #eef5ff 0%, #f5f3ff 52%, #fff6fb 100%);
  inset: 0;
  overflow: auto;
  position: fixed;
  z-index: 9999;
`;

const StyledTopBar = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 28px 32px 0;
  position: relative;
  z-index: 2;

  @media (max-width: 720px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }
`;

const StyledBrandButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  display: inline-flex;
  gap: 14px;
  padding: 0;
`;

const StyledBrandMark = styled.div`
  align-items: center;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.88), rgba(225, 237, 255, 0.72));
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.94),
    0 18px 34px rgba(54, 87, 147, 0.14);
  color: #1f4294;
  display: inline-flex;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
  font-weight: 700;
  height: 56px;
  justify-content: center;
  letter-spacing: 0.06em;
  width: 56px;
`;

const StyledBrandMeta = styled.div`
  display: grid;
  gap: 4px;
  text-align: left;
`;

const StyledBrandName = styled.div`
  color: var(--amain-ink);
  font-size: 20px;
  font-weight: 800;
`;

const StyledBrandSubname = styled.div`
  color: var(--amain-muted);
  font-size: 13px;
  font-weight: 600;
`;

const StyledLanguageShell = styled.div`
  align-items: center;
  background: rgba(255, 255, 255, 0.54);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 999px;
  box-shadow: 0 12px 28px rgba(45, 67, 105, 0.1);
  display: inline-flex;
  gap: 6px;
  padding: 6px;
`;

const StyledLanguageButton = styled.button<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(135deg, rgba(63, 120, 255, 0.96), rgba(108, 167, 255, 0.92))'
      : 'transparent'};
  border: none;
  border-radius: 999px;
  color: ${({ $active }) => ($active ? '#ffffff' : 'var(--amain-ink)')};
  cursor: ${({ $active }) => ($active ? 'default' : 'pointer')};
  font-size: 13px;
  font-weight: 700;
  min-width: 102px;
  padding: 10px 16px;
`;

const StyledGrid = styled.div`
  align-items: center;
  display: grid;
  gap: 28px;
  grid-template-columns: minmax(0, 1.08fr) minmax(420px, 0.72fr);
  margin: 0 auto;
  max-width: 1200px;
  min-height: calc(100vh - 92px);
  padding: 24px 32px 40px;
  position: relative;
  width: 100%;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  @media (max-width: 640px) {
    padding-left: 20px;
    padding-right: 20px;
  }
`;

const StyledHero = styled.section`
  display: grid;
  gap: 28px;
  min-height: 620px;
  padding: 26px 10px 26px 0;

  @media (max-width: 1080px) {
    min-height: auto;
    padding-right: 0;
  }
`;

const StyledHeroHeader = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: 160px minmax(0, 1fr);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StyledLogoStage = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  min-height: 160px;
  padding: 0;
  perspective: 1200px;
`;

const StyledGlassLogo = styled.div`
  align-items: center;
  display: flex;
  height: 132px;
  justify-content: center;
  position: relative;
  transform: rotateX(18deg) rotateY(-20deg);
  width: 132px;
`;

const StyledGlassShadow = styled.div`
  background: linear-gradient(155deg, rgba(70, 127, 255, 0.82), rgba(176, 207, 255, 0.22));
  border-radius: 28px;
  bottom: -10px;
  height: 116px;
  left: 12px;
  opacity: 0.74;
  position: absolute;
  width: 116px;
`;

const StyledGlassFace = styled.div`
  backdrop-filter: blur(14px);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.76), rgba(183, 214, 255, 0.32));
  border: 1px solid rgba(255, 255, 255, 0.84);
  border-radius: 30px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 28px 48px rgba(33, 68, 130, 0.2);
  height: 132px;
  position: absolute;
  width: 132px;
`;

const StyledGlassGloss = styled.div`
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(255, 255, 255, 0));
  border-radius: 24px;
  height: 60px;
  left: 12px;
  position: absolute;
  top: 10px;
  width: 88px;
`;

const StyledGlassText = styled.div`
  color: #1b3668;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 52px;
  font-weight: 700;
  letter-spacing: 0.06em;
  position: relative;
  text-shadow: 0 6px 20px rgba(61, 121, 255, 0.18);
  z-index: 2;
`;

const StyledGlassChip = styled.div`
  align-items: center;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 999px;
  bottom: 6px;
  box-shadow: 0 12px 28px rgba(35, 56, 91, 0.12);
  color: var(--amain-blue);
  display: inline-flex;
  font-size: 12px;
  font-weight: 800;
  padding: 8px 12px;
  position: absolute;
  right: -4px;
  z-index: 3;
`;

const StyledHeroCopy = styled.div`
  align-content: start;
  display: grid;
  gap: 14px;
`;

const StyledEyebrow = styled.div`
  color: var(--amain-blue);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const StyledHeroBrand = styled.div`
  color: var(--amain-ink);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const StyledHeroWordmark = styled.div`
  color: var(--amain-blue);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 28px;
  font-weight: 700;
`;
const StyledHeroTitle = styled.h1`
  color: var(--amain-ink);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(36px, 4.7vw, 72px);
  line-height: 1.04;
  margin: 0;
  max-width: 10ch;
`;

const StyledHeroDescription = styled.p`
  color: var(--amain-muted);
  font-size: 17px;
  line-height: 1.8;
  margin: 0;
  max-width: 34rem;
`;

const StyledChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
`;

const StyledChip = styled.div`
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 999px;
  color: var(--amain-ink);
  font-size: 13px;
  font-weight: 700;
  padding: 10px 16px;
`;

const StyledAuthColumn = styled.section`
  display: flex;
  justify-content: center;
`;

const StyledAuthCard = styled.div`
  backdrop-filter: blur(18px);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(229, 236, 248, 0.96);
  border-radius: 32px;
  box-shadow: 0 24px 72px rgba(36, 58, 94, 0.14);
  max-width: 430px;
  padding: 28px 30px 24px;
  width: 100%;

  @media (max-width: 640px) {
    padding: 24px 20px 22px;
  }
`;

const StyledWorkspacePill = styled.div`
  color: var(--amain-muted);
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 16px;
`;

const StyledAuthTabs = styled.div`
  align-items: center;
  display: flex;
  gap: 36px;
  margin-bottom: 20px;
`;

const StyledAuthTab = styled.button<{ $active: boolean }>`
  background: transparent;
  border: none;
  border-bottom: 2px solid
    ${({ $active }) => ($active ? 'var(--amain-blue)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--amain-blue)' : 'var(--amain-ink)')};
  cursor: pointer;
  font-size: 15px;
  font-weight: ${({ $active }) => ($active ? 800 : 600)};
  padding: 0 0 10px;
`;

const StyledAuthHeading = styled.h2`
  color: var(--amain-ink);
  font-size: 28px;
  font-weight: 800;
  margin: 0;
`;

const StyledAuthDescription = styled.p`
  color: var(--amain-muted);
  font-size: 13px;
  line-height: 1.7;
  margin: 8px 0 0;
`;

const StyledModeTabs = styled.div`
  display: inline-flex;
  gap: 8px;
  margin-top: 18px;
`;

const StyledModeTab = styled.button<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active ? 'rgba(236, 242, 255, 0.96)' : 'transparent'};
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(186, 207, 255, 0.9)' : 'rgba(216, 225, 241, 0.9)'};
  border-radius: 999px;
  color: ${({ $active }) => ($active ? 'var(--amain-blue)' : 'var(--amain-muted)')};
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  min-height: 34px;
  padding: 0 14px;
`;

const StyledSection = styled.div`
  display: grid;
  gap: 12px;
  margin-top: 20px;
`;

const StyledNotice = styled.div`
  background: rgba(255, 245, 230, 0.82);
  border: 1px solid rgba(225, 196, 145, 0.58);
  border-radius: 16px;
  color: #7c5c21;
  font-size: 13px;
  line-height: 1.65;
  padding: 12px 14px;
`;

const StyledPrimaryButton = styled.button<{ $disabled: boolean }>`
  align-items: center;
  background: ${({ $disabled }) =>
    $disabled
      ? 'linear-gradient(135deg, #bfd0ef, #bfd0ef)'
      : 'linear-gradient(135deg, #8eb6ff, #9ec4ff)'};
  border: none;
  border-radius: 999px;
  color: #ffffff;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  display: inline-flex;
  font-size: 16px;
  font-weight: 800;
  justify-content: center;
  min-height: 50px;
  width: 100%;
`;

const StyledPrimaryButtonText = styled.span`
  align-items: center;
  display: inline-flex;
  gap: 10px;
`;

const StyledSecurityHint = styled.div`
  align-items: center;
  background: #edf9ef;
  border-radius: 8px;
  color: #2e9a43;
  display: inline-flex;
  font-size: 12px;
  font-weight: 700;
  gap: 8px;
  margin: 2px auto 0;
  padding: 8px 12px;
`;

const StyledSecurityBadge = styled.span`
  align-items: center;
  background: #39b55a;
  border-radius: 999px;
  color: #fff;
  display: inline-flex;
  font-size: 10px;
  height: 16px;
  justify-content: center;
  width: 16px;
`;

const StyledHelperRow = styled.div`
  align-items: center;
  color: var(--amain-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
  gap: 12px;
  justify-content: space-between;
`;

const StyledHint = styled.div`
  color: var(--amain-muted);
  font-size: 12px;
  line-height: 1.6;
`;

const StyledLinkButton = styled.button`
  background: none;
  border: none;
  color: var(--amain-blue);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  padding: 0;
`;

const StyledDivider = styled.div`
  align-items: center;
  color: var(--amain-muted);
  display: flex;
  font-size: 12px;
  font-weight: 700;
  gap: 12px;
  margin: 22px 0 14px;

  &::before,
  &::after {
    background: linear-gradient(
      90deg,
      rgba(216, 225, 241, 0),
      rgba(216, 225, 241, 1),
      rgba(216, 225, 241, 0)
    );
    content: '';
    flex: 1;
    height: 1px;
  }
`;

const StyledProviderStack = styled.div`
  display: grid;
  gap: 10px;
`;

const StyledFooterNote = styled.div`
  color: var(--amain-muted);
  font-size: 12px;
  line-height: 1.7;
  margin-top: 16px;
`;

const StyledLoaderShell = styled.div`
  align-items: center;
  color: var(--amain-muted);
  display: flex;
  gap: 12px;
  justify-content: center;
  min-height: 180px;
`;

const getResolvedProviders = ({
  workspaceAuthProviders,
  workspaceAuthBypassProviders,
  shouldOfferBypass,
  shouldUseBypass,
}: {
  workspaceAuthProviders: AuthProviders | null;
  workspaceAuthBypassProviders: AuthBypassProviders | null;
  shouldOfferBypass: boolean;
  shouldUseBypass: boolean;
}) => {
  if (!workspaceAuthProviders) {
    return null;
  }

  if (shouldOfferBypass && shouldUseBypass) {
    return {
      password: workspaceAuthBypassProviders?.password ?? false,
      google: workspaceAuthBypassProviders?.google ?? false,
      microsoft: workspaceAuthBypassProviders?.microsoft ?? false,
      ...workspaceAuthBypassProviders,
      sso: [],
    };
  }

  return workspaceAuthProviders;
};
export const AmainBrandedAuthScreen = ({
  form,
  workspacePublicData,
  isLoading,
  fallbackForm,
  onClickOnLogo,
}: {
  form: UseFormReturn<Form>;
  workspacePublicData: PublicWorkspaceData | null;
  isLoading: boolean;
  fallbackForm: JSX.Element | null;
  onClickOnLogo: () => void;
}) => {
  const store = useStore();
  const { i18n } = useLingui();
  const [signInUpStep, setSignInUpStep] = useAtomState(signInUpStepState);
  const [, setSignInUpMode] = useAtomState(signInUpModeState);
  const captcha = useAtomStateValue(captchaState);
  const isRequestingCaptchaToken = useAtomStateValue(
    isRequestingCaptchaTokenState,
  );
  const workspaceAuthProviders = useAtomStateValue(workspaceAuthProvidersState);
  const workspaceAuthBypassProviders = useAtomStateValue(
    workspaceAuthBypassProvidersState,
  );
  const { shouldOfferBypass, shouldUseBypass } = useWorkspaceBypass();
  const { handleResetPassword } = useHandleResetPassword();
  const [showErrors, setShowErrors] = useState(false);
  const [authSurface, setAuthSurface] = useState<AuthSurface>('sign-in');
  const [credentialMode, setCredentialMode] = useState<CredentialMode>('email');
  const [phoneValue, setPhoneValue] = useState('');
  const [authLocale, setAuthLocale] = useState<AuthLocale>(() =>
    getInitialLocale(i18n.locale),
  );
  const { workspaceInviteHash } = useParams();
  const [searchParams] = useSearchParams();

  const { signInUpMode, continueWithCredentials, submitCredentials } =
    useSignInUp(form);

  const providers = getResolvedProviders({
    workspaceAuthProviders,
    workspaceAuthBypassProviders,
    shouldOfferBypass,
    shouldUseBypass,
  });

  const copy = authCopy[authLocale];
  const workspaceName =
    workspacePublicData?.displayName?.trim() ||
    workspacePublicData?.id ||
    'AMAIN';
  const workspacePersonalInviteToken = searchParams.get('inviteToken');
  const hasWorkspaceJoinContext =
    isDefined(workspaceInviteHash) || isDefined(workspacePersonalInviteToken);

  useEffect(() => {
    if (signInUpStep !== SignInUpStep.Password) {
      return;
    }

    setAuthSurface(
      signInUpMode === SignInUpMode.SignUp ? 'sign-up' : 'sign-in',
    );
  }, [signInUpMode, signInUpStep]);

  const persistLocale = async (nextLocale: AuthLocale) => {
    setAuthLocale(nextLocale);

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
  };

  const handleEmailChange = (value: string) => {
    if (value !== form.getValues('email')) {
      setSignInUpStep(SignInUpStep.Email);
      setShowErrors(false);
    }

    form.setValue('email', value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: false,
    });
  };

  const shouldWaitForCaptchaToken =
    signInUpStep !== SignInUpStep.Init &&
    isDefined(captcha?.provider) &&
    isRequestingCaptchaToken;

  const isSubmitDisabled =
    credentialMode === 'phone' ||
    (signInUpStep !== SignInUpStep.Password &&
      (isDefined(form.formState.errors.email) || shouldWaitForCaptchaToken)) ||
    (signInUpStep === SignInUpStep.Password &&
      (!form.formState.isValid ||
        form.formState.isSubmitting ||
        shouldWaitForCaptchaToken));

  const handlePrimarySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (credentialMode === 'phone' || isSubmitDisabled) {
      return;
    }

    if (
      signInUpStep === SignInUpStep.Init ||
      signInUpStep === SignInUpStep.Email
    ) {
      if (isDefined(form.formState.errors.email)) {
        setShowErrors(true);
        return;
      }

      const nextSignInUpMode = await continueWithCredentials();

      if (nextSignInUpMode) {
        setAuthSurface(
          nextSignInUpMode === SignInUpMode.SignUp ? 'sign-up' : 'sign-in',
        );
      }

      return;
    }

    if (!form.formState.isSubmitting) {
      setShowErrors(true);
      void form.handleSubmit(submitCredentials)();
    }
  };

  const handleSurfaceSwitch = (nextSurface: AuthSurface) => {
    setAuthSurface(nextSurface);
    setSignInUpMode(
      nextSurface === 'sign-up'
        ? SignInUpMode.SignUp
        : SignInUpMode.SignIn,
    );
    setShowErrors(false);

    if (signInUpStep === SignInUpStep.Password) {
      form.setValue('password', '', {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
      setSignInUpStep(SignInUpStep.Email);
    }
  };

  const primaryActionLabel =
    credentialMode === 'phone'
      ? copy.phone
      : signInUpStep === SignInUpStep.Password
        ? signInUpMode === SignInUpMode.SignUp
          ? copy.signUpAction
          : copy.signInAction
        : authSurface === 'sign-up'
          ? copy.continueToRegister
          : copy.continue;

  const shouldUseFallbackPasswordForm =
    !providers ||
    (!providers.password &&
      !providers.google &&
      !providers.microsoft &&
      providers.sso.length === 0);

  const showAlternativeProviders =
    providers != null &&
    (providers.google || providers.microsoft || providers.sso.length > 0);

  return (
    <StyledViewport>
      <StyledTopBar>
        <StyledBrandButton type="button" onClick={onClickOnLogo}>
          <StyledBrandMark>AM</StyledBrandMark>
          <StyledBrandMeta>
            <StyledBrandName>{copy.brandEn}</StyledBrandName>
            <StyledBrandSubname>{copy.brand}</StyledBrandSubname>
          </StyledBrandMeta>
        </StyledBrandButton>
        <StyledLanguageShell aria-label={copy.language}>
          <StyledLanguageButton
            type="button"
            $active={authLocale === APP_LOCALES['zh-CN']}
            onClick={() => void persistLocale(APP_LOCALES['zh-CN'])}
          >
            Chinese
          </StyledLanguageButton>
          <StyledLanguageButton
            type="button"
            $active={authLocale === APP_LOCALES.en}
            onClick={() => void persistLocale(APP_LOCALES.en)}
          >
            English
          </StyledLanguageButton>
        </StyledLanguageShell>
      </StyledTopBar>
      <StyledGrid>
        <StyledHero>
          <StyledHeroHeader>
            <StyledLogoStage type="button" onClick={onClickOnLogo}>
              <StyledGlassLogo>
                <StyledGlassShadow />
                <StyledGlassFace />
                <StyledGlassGloss />
                <StyledGlassText>AM</StyledGlassText>
                <StyledGlassChip>3D Glass</StyledGlassChip>
              </StyledGlassLogo>
            </StyledLogoStage>
            <StyledHeroCopy>
              <StyledEyebrow>{copy.heroEyebrow}</StyledEyebrow>
              <div>
                <StyledHeroBrand>{copy.brand}</StyledHeroBrand>
                <StyledHeroWordmark>{copy.brandEn}</StyledHeroWordmark>
              </div>
              <StyledHeroTitle>{copy.heroTitle}</StyledHeroTitle>
              <StyledHeroDescription>{copy.heroDescription}</StyledHeroDescription>
              <StyledChipRow>
                <StyledChip>{copy.chipOne}</StyledChip>
                <StyledChip>{copy.chipTwo}</StyledChip>
                <StyledChip>{copy.chipThree}</StyledChip>
              </StyledChipRow>
            </StyledHeroCopy>
          </StyledHeroHeader>
        </StyledHero>
        <StyledAuthColumn>
          <StyledAuthCard>
            <StyledWorkspacePill>
              {copy.workspace}: {workspaceName}
            </StyledWorkspacePill>
            <StyledAuthTabs>
              <StyledAuthTab
                type="button"
                $active={authSurface === 'sign-in'}
                onClick={() => handleSurfaceSwitch('sign-in')}
              >
                {copy.signIn}
              </StyledAuthTab>
              <StyledAuthTab
                type="button"
                $active={authSurface === 'sign-up'}
                onClick={() => handleSurfaceSwitch('sign-up')}
              >
                {copy.signUp}
              </StyledAuthTab>
            </StyledAuthTabs>
            <StyledAuthHeading>
              {authSurface === 'sign-up' ? copy.signUp : copy.signIn}
            </StyledAuthHeading>
            <StyledAuthDescription>
              {authSurface === 'sign-up'
                ? copy.joinRestriction
                : copy.footerNote}
            </StyledAuthDescription>
            <StyledModeTabs>
              <StyledModeTab
                type="button"
                $active={credentialMode === 'email'}
                onClick={() => setCredentialMode('email')}
              >
                {copy.email}
              </StyledModeTab>
              <StyledModeTab
                type="button"
                $active={credentialMode === 'phone'}
                onClick={() => setCredentialMode('phone')}
              >
                {copy.phone}
              </StyledModeTab>
            </StyledModeTabs>
            {authSurface === 'sign-up' &&
            credentialMode === 'email' &&
            !hasWorkspaceJoinContext ? (
              <StyledSection>
                <StyledNotice>{copy.joinRestriction}</StyledNotice>
              </StyledSection>
            ) : null}
            {isLoading ? (
              <StyledLoaderShell>
                <Loader color="gray" />
                <span>{copy.loading}</span>
              </StyledLoaderShell>
            ) : shouldUseFallbackPasswordForm ? (
              fallbackForm
            ) : (
              <>
                <FormProvider {...form}>
                  <form onSubmit={handlePrimarySubmit}>
                    <StyledSection>
                      {credentialMode === 'email' ? (
                        <>
                          <Controller
                            name="email"
                            control={form.control}
                            render={({ field: { value }, fieldState: { error } }) => (
                              <SettingsTextInput
                                instanceId="amain-auth-email"
                                autoComplete="email"
                                autoFocus
                                value={value}
                                placeholder={copy.emailPlaceholder}
                                onChange={handleEmailChange}
                                error={showErrors ? error?.message : undefined}
                                fullWidth
                              />
                            )}
                          />
                          {signInUpStep === SignInUpStep.Password ? (
                            <>
                              <Controller
                                name="password"
                                control={form.control}
                                render={({
                                  field: { onChange, onBlur, value },
                                  fieldState: { error },
                                }) => (
                                  <SettingsTextInput
                                    instanceId="amain-auth-password"
                                    autoComplete="current-password"
                                    value={value}
                                    type="password"
                                    placeholder={copy.passwordPlaceholder}
                                    onBlur={onBlur}
                                    onChange={onChange}
                                    error={showErrors ? error?.message : undefined}
                                    fullWidth
                                  />
                                )}
                              />
                              {signInUpMode === SignInUpMode.SignUp ? (
                                <StyledHint>{copy.passwordHint}</StyledHint>
                              ) : null}
                            </>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <SettingsTextInput
                            instanceId="amain-auth-phone"
                            autoComplete="tel"
                            value={phoneValue}
                            placeholder={copy.phonePlaceholder}
                            onChange={setPhoneValue}
                            fullWidth
                          />
                          <StyledNotice>{copy.phoneNotice}</StyledNotice>
                        </>
                      )}
                      <StyledPrimaryButton
                        type="submit"
                        $disabled={isSubmitDisabled}
                        disabled={isSubmitDisabled}
                      >
                        <StyledPrimaryButtonText>
                          {form.formState.isSubmitting ? (
                            <Loader color="gray" />
                          ) : null}
                          {primaryActionLabel}
                        </StyledPrimaryButtonText>
                      </StyledPrimaryButton>
                    </StyledSection>
                  </form>
                </FormProvider>
                <StyledSection>
                  <StyledSecurityHint>
                    <StyledSecurityBadge>✓</StyledSecurityBadge>
                    {copy.secure}
                  </StyledSecurityHint>
                  <StyledHelperRow>
                    <StyledHint>
                      {signInUpStep === SignInUpStep.Password
                        ? copy.passwordHint
                        : copy.footerNote}
                    </StyledHint>
                    <StyledLinkButton
                      type="button"
                      onClick={() =>
                        handleSurfaceSwitch(
                          authSurface === 'sign-in' ? 'sign-up' : 'sign-in',
                        )
                      }
                    >
                      {authSurface === 'sign-in'
                        ? copy.registerPrompt
                        : copy.signInPrompt}
                    </StyledLinkButton>
                  </StyledHelperRow>
                  {credentialMode === 'email' &&
                  signInUpStep === SignInUpStep.Password ? (
                    <StyledLinkButton
                      type="button"
                      onClick={handleResetPassword(form.getValues('email'))}
                    >
                      {copy.forgotPassword}
                    </StyledLinkButton>
                  ) : null}
                </StyledSection>
                {showAlternativeProviders ? (
                  <>
                    <StyledDivider>{copy.alternate}</StyledDivider>
                    <StyledProviderStack>
                      {providers?.google ? (
                        <SignInUpWithGoogle action="join-workspace" />
                      ) : null}
                      {providers?.microsoft ? (
                        <SignInUpWithMicrosoft action="join-workspace" />
                      ) : null}
                      {providers?.sso.length ? <SignInUpWithSSO /> : null}
                    </StyledProviderStack>
                  </>
                ) : null}
              </>
            )}
            <StyledFooterNote>{copy.footerNote}</StyledFooterNote>
          </StyledAuthCard>
        </StyledAuthColumn>
      </StyledGrid>
    </StyledViewport>
  );
};
