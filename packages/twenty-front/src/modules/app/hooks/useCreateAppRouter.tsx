import { AppRouterProviders } from '@/app/components/AppRouterProviders';
import { LazyRoute } from '@/app/components/LazyRoute';
import { SettingsRoutes } from '@/app/components/SettingsRoutes';
import { VerifyLoginTokenEffect } from '@/auth/components/VerifyLoginTokenEffect';

import { VerifyEmailEffect } from '@/auth/components/VerifyEmailEffect';
import indexAppPath from '@/navigation/utils/indexAppPath';
import { BlankLayout } from '@/ui/layout/page/components/BlankLayout';
import { DefaultLayout } from '@/ui/layout/page/components/DefaultLayout';
import { AppPath } from 'twenty-shared/types';

import { lazy } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';

const RecordIndexPage = lazy(() =>
  import('~/pages/object-record/RecordIndexPage').then((module) => ({
    default: module.RecordIndexPage,
  })),
);

const SalesWorkbenchPage = lazy(() =>
  import('~/pages/workbench/SalesWorkbenchPage').then((module) => ({
    default: module.SalesWorkbenchPage,
  })),
);

const TradeCrmWorkbenchPage = lazy(() =>
  import('@/trade-crm/workbench/pages/TradeCrmWorkbenchPage').then(
    (module) => ({
      default: module.TradeCrmWorkbenchPage,
    }),
  ),
);

const TradeCrmProspectingPage = lazy(() =>
  import('@/trade-crm/prospecting/pages/TradeCrmProspectingPage').then(
    (module) => ({
      default: module.TradeCrmProspectingPage,
    }),
  ),
);

const TradeCrmMailPage = lazy(() =>
  import('@/trade-crm/mail/pages/TradeCrmMailPage').then((module) => ({
    default: module.TradeCrmMailPage,
  })),
);

const TradeCrmCustomersPage = lazy(() =>
  import('@/trade-crm/customers/pages/TradeCrmCustomersPage').then(
    (module) => ({
      default: module.TradeCrmCustomersPage,
    }),
  ),
);

const TradeCrmOpportunitiesPage = lazy(() =>
  import('@/trade-crm/opportunities/pages/TradeCrmOpportunitiesPage').then(
    (module) => ({
      default: module.TradeCrmOpportunitiesPage,
    }),
  ),
);

const TradeCrmCollaborationPage = lazy(() =>
  import('@/trade-crm/collaboration/pages/TradeCrmCollaborationPage').then(
    (module) => ({
      default: module.TradeCrmCollaborationPage,
    }),
  ),
);

const TradeCrmAnalyticsPage = lazy(() =>
  import('@/trade-crm/analytics/pages/TradeCrmAnalyticsPage').then(
    (module) => ({
      default: module.TradeCrmAnalyticsPage,
    }),
  ),
);

const EnterpriseCustomFieldsPage = lazy(() =>
  import('~/pages/enterprise/EnterpriseCustomFieldsPage').then((module) => ({
    default: module.EnterpriseCustomFieldsPage,
  })),
);

const EnterpriseFieldLayoutPage = lazy(() =>
  import('~/pages/enterprise/EnterpriseFieldLayoutPage').then((module) => ({
    default: module.EnterpriseFieldLayoutPage,
  })),
);

const EnterpriseCustomerExportPage = lazy(() =>
  import('~/pages/enterprise/EnterpriseCustomerExportPage').then((module) => ({
    default: module.EnterpriseCustomerExportPage,
  })),
);

const EnterpriseRecycleBinPage = lazy(() =>
  import('~/pages/enterprise/EnterpriseRecycleBinPage').then((module) => ({
    default: module.EnterpriseRecycleBinPage,
  })),
);

const EnterpriseReportTemplatesPage = lazy(() =>
  import('~/pages/enterprise/EnterpriseReportTemplatesPage').then(
    (module) => ({
      default: module.EnterpriseReportTemplatesPage,
    }),
  ),
);

const EnterpriseSourceConvertPage = lazy(() =>
  import('~/pages/enterprise/EnterpriseSourceConvertPage').then((module) => ({
    default: module.EnterpriseSourceConvertPage,
  })),
);

const EnterpriseIndependentStationPage = lazy(() =>
  import('~/pages/enterprise/EnterpriseIndependentStationPage').then(
    (module) => ({
      default: module.EnterpriseIndependentStationPage,
    }),
  ),
);

const EnterpriseSalesPlaybookPage = lazy(() =>
  import('~/pages/enterprise/EnterpriseSalesPlaybookPage').then((module) => ({
    default: module.EnterpriseSalesPlaybookPage,
  })),
);

const EnterprisePermissionsPage = lazy(() =>
  import('~/pages/enterprise/EnterprisePermissionsPage').then((module) => ({
    default: module.EnterprisePermissionsPage,
  })),
);

const RecordShowPage = lazy(() =>
  import('~/pages/object-record/RecordShowPage').then((module) => ({
    default: module.RecordShowPage,
  })),
);

const SignInUp = lazy(() =>
  import('~/pages/auth/SignInUp').then((module) => ({
    default: module.SignInUp,
  })),
);

const PasswordReset = lazy(() =>
  import('~/pages/auth/PasswordReset').then((module) => ({
    default: module.PasswordReset,
  })),
);

const Authorize = lazy(() =>
  import('~/pages/auth/Authorize').then((module) => ({
    default: module.Authorize,
  })),
);

const CreateWorkspace = lazy(() =>
  import('~/pages/onboarding/CreateWorkspace').then((module) => ({
    default: module.CreateWorkspace,
  })),
);

const CreateProfile = lazy(() =>
  import('~/pages/onboarding/CreateProfile').then((module) => ({
    default: module.CreateProfile,
  })),
);

const SyncEmails = lazy(() =>
  import('~/pages/onboarding/SyncEmails').then((module) => ({
    default: module.SyncEmails,
  })),
);

const InviteTeam = lazy(() =>
  import('~/pages/onboarding/InviteTeam').then((module) => ({
    default: module.InviteTeam,
  })),
);

const ChooseYourPlan = lazy(() =>
  import('~/pages/onboarding/ChooseYourPlan').then((module) => ({
    default: module.ChooseYourPlan,
  })),
);

const PaymentSuccess = lazy(() =>
  import('~/pages/onboarding/PaymentSuccess').then((module) => ({
    default: module.PaymentSuccess,
  })),
);

const BookCallDecision = lazy(() =>
  import('~/pages/onboarding/BookCallDecision').then((module) => ({
    default: module.BookCallDecision,
  })),
);

const BookCall = lazy(() =>
  import('~/pages/onboarding/BookCall').then((module) => ({
    default: module.BookCall,
  })),
);

const NotFound = lazy(() =>
  import('~/pages/not-found/NotFound').then((module) => ({
    default: module.NotFound,
  })),
);

export const useCreateAppRouter = (
  isFunctionSettingsEnabled?: boolean,
  isAdminPageEnabled?: boolean,
) =>
  createBrowserRouter(
    createRoutesFromElements(
      <Route
        element={<AppRouterProviders />}
        // To switch state to `loading` temporarily to enable us
        // to set scroll position before the page is rendered
        loader={async () => Promise.resolve(null)}
      >
        <Route element={<DefaultLayout />}>
          <Route path={AppPath.Verify} element={<VerifyLoginTokenEffect />} />
          <Route path={AppPath.VerifyEmail} element={<VerifyEmailEffect />} />
          <Route
            path={AppPath.SignInUp}
            element={
              <LazyRoute>
                <SignInUp />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.Invite}
            element={
              <LazyRoute>
                <SignInUp />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.ResetPassword}
            element={
              <LazyRoute>
                <PasswordReset />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.CreateWorkspace}
            element={
              <LazyRoute>
                <CreateWorkspace />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.CreateProfile}
            element={
              <LazyRoute>
                <CreateProfile />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.SyncEmails}
            element={
              <LazyRoute>
                <SyncEmails />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.InviteTeam}
            element={
              <LazyRoute>
                <InviteTeam />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.PlanRequired}
            element={
              <LazyRoute>
                <ChooseYourPlan />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.PlanRequiredSuccess}
            element={
              <LazyRoute>
                <PaymentSuccess />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.BookCallDecision}
            element={
              <LazyRoute>
                <BookCallDecision />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.BookCall}
            element={
              <LazyRoute>
                <BookCall />
              </LazyRoute>
            }
          />
          <Route path={indexAppPath.getIndexAppPath()} element={<></>} />
          <Route
            path={AppPath.SalesWorkbench}
            element={
              <LazyRoute>
                <SalesWorkbenchPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.TradeCrmWorkbench}
            element={
              <LazyRoute>
                <TradeCrmWorkbenchPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.TradeCrmProspecting}
            element={
              <LazyRoute>
                <TradeCrmProspectingPage />
              </LazyRoute>
            }
          />
          <Route
            path={`${AppPath.TradeCrmMail}/*`}
            element={
              <LazyRoute>
                <TradeCrmMailPage />
              </LazyRoute>
            }
          />
          <Route
            path={`${AppPath.TradeCrmMail}/:legacyView`}
            element={
              <LazyRoute>
                <TradeCrmMailPage />
              </LazyRoute>
            }
          />
          <Route
            path={`${AppPath.TradeCrmMail}/:legacyScope/:legacyView`}
            element={
              <LazyRoute>
                <TradeCrmMailPage />
              </LazyRoute>
            }
          />
          <Route
            path={`${AppPath.TradeCrmCustomers}/*`}
            element={
              <LazyRoute>
                <TradeCrmCustomersPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.TradeCrmOpportunities}
            element={
              <LazyRoute>
                <TradeCrmOpportunitiesPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.TradeCrmCollaboration}
            element={
              <LazyRoute>
                <TradeCrmCollaborationPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.TradeCrmAnalytics}
            element={
              <LazyRoute>
                <TradeCrmAnalyticsPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.EnterpriseCustomFields}
            element={
              <LazyRoute>
                <EnterpriseCustomFieldsPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.EnterpriseFieldDisplay}
            element={
              <LazyRoute>
                <EnterpriseFieldLayoutPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.EnterpriseCustomerExport}
            element={
              <LazyRoute>
                <EnterpriseCustomerExportPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.EnterpriseRecycle}
            element={
              <LazyRoute>
                <EnterpriseRecycleBinPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.EnterpriseReportTemplates}
            element={
              <LazyRoute>
                <EnterpriseReportTemplatesPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.EnterpriseSourceConvert}
            element={
              <LazyRoute>
                <EnterpriseSourceConvertPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.EnterpriseIndependentStation}
            element={
              <LazyRoute>
                <EnterpriseIndependentStationPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.EnterpriseSalesPlaybook}
            element={
              <LazyRoute>
                <EnterpriseSalesPlaybookPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.EnterprisePermissions}
            element={
              <LazyRoute>
                <EnterprisePermissionsPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.RecordIndexPage}
            element={
              <LazyRoute>
                <RecordIndexPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.RecordShowPage}
            element={
              <LazyRoute>
                <RecordShowPage />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.SettingsCatchAll}
            element={
              <SettingsRoutes
                isFunctionSettingsEnabled={isFunctionSettingsEnabled}
                isAdminPageEnabled={isAdminPageEnabled}
              />
            }
          />
          <Route
            path={AppPath.NotFoundWildcard}
            element={
              <LazyRoute>
                <NotFound />
              </LazyRoute>
            }
          />
        </Route>
        <Route element={<BlankLayout />}>
          <Route
            path={AppPath.Authorize}
            element={
              <LazyRoute>
                <Authorize />
              </LazyRoute>
            }
          />
        </Route>
      </Route>,
    ),
  );
