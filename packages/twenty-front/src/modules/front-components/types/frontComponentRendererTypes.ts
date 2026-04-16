import { type AppPath, type EnqueueSnackbarParams, type NavigateOptions, type SidePanelPages } from 'twenty-shared/types';
import { type getAppPath } from 'twenty-shared/utils';

export type FrontComponentExecutionContext = {
  frontComponentId: string;
  userId: string | null;
  recordId: string | null;
};

export type NavigateFunction = <T extends AppPath>(
  to: T,
  params?: Parameters<typeof getAppPath<T>>[1],
  queryParams?: Record<string, any>,
  options?: NavigateOptions,
) => Promise<void>;

export type OpenSidePanelPageFunction = (params: {
  page: SidePanelPages;
  pageTitle: string;
  pageIcon?: string;
  shouldResetSearchState?: boolean;
}) => Promise<void>;

export type CommandConfirmationModalAccent = 'default' | 'blue' | 'danger';

export type OpenCommandConfirmationModalHostFunction = (params: {
  title: string;
  subtitle: string;
  confirmButtonText?: string;
  confirmButtonAccent?: CommandConfirmationModalAccent;
}) => Promise<void>;

export type UnmountFrontComponentFunction = () => Promise<void>;

export type EnqueueSnackbarFunction = (
  params: EnqueueSnackbarParams,
) => Promise<void>;

export type CloseSidePanelFunction = () => Promise<void>;

export type UpdateProgressFunction = (progress: number) => Promise<void>;

export type RequestAccessTokenRefreshFunction = () => Promise<string>;

export type FrontComponentHostCommunicationApi = {
  navigate: NavigateFunction;
  requestAccessTokenRefresh: RequestAccessTokenRefreshFunction;
  openSidePanelPage: OpenSidePanelPageFunction;
  openCommandConfirmationModal: OpenCommandConfirmationModalHostFunction;
  unmountFrontComponent: UnmountFrontComponentFunction;
  enqueueSnackbar: EnqueueSnackbarFunction;
  closeSidePanel: CloseSidePanelFunction;
  updateProgress: UpdateProgressFunction;
};

export type SdkClientUrls = {
  core: string;
  metadata: string;
};
