import { useAtomValue } from 'jotai';
import { type ReactElement } from 'react';

import { SdkClientBlobUrlsEffect } from '@/front-components/components/SdkClientBlobUrlsEffect';
import { sdkClientFamilyState } from '@/front-components/states/sdkClientFamilyState';
import {
  type FrontComponentExecutionContext,
  type FrontComponentHostCommunicationApi,
  type SdkClientUrls,
} from '@/front-components/types/frontComponentRendererTypes';
import {
  FrontComponentRenderer as SharedFrontComponentRenderer,
} from 'twenty-front-component-renderer';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

type SharedFrontComponentRendererProps = {
  colorScheme: 'light' | 'dark';
  componentUrl: string;
  applicationAccessToken: string;
  apiUrl: string;
  sdkClientUrls?: SdkClientUrls;
  executionContext: FrontComponentExecutionContext;
  frontComponentHostCommunicationApi: FrontComponentHostCommunicationApi;
  onError: (error?: Error) => void;
};

const SharedFrontComponentRendererBridge =
  SharedFrontComponentRenderer as unknown as (
    props: SharedFrontComponentRendererProps,
  ) => ReactElement | null;

type FrontComponentRendererWithSdkClientProps = {
  colorScheme: 'light' | 'dark';
  componentUrl: string;
  applicationAccessToken: string;
  applicationId: string;
  executionContext: FrontComponentExecutionContext;
  frontComponentHostCommunicationApi: FrontComponentHostCommunicationApi;
  onError: (error?: Error) => void;
};

export const FrontComponentRendererWithSdkClient = ({
  colorScheme,
  componentUrl,
  applicationAccessToken,
  applicationId,
  executionContext,
  frontComponentHostCommunicationApi,
  onError,
}: FrontComponentRendererWithSdkClientProps) => {
  const sdkClientState = useAtomValue(
    sdkClientFamilyState.atomFamily(applicationId),
  );

  return (
    <>
      <SdkClientBlobUrlsEffect
        applicationId={applicationId}
        accessToken={applicationAccessToken}
        onError={onError}
      />
      {sdkClientState.status === 'loaded' && (
        <SharedFrontComponentRendererBridge
          colorScheme={colorScheme}
          componentUrl={componentUrl}
          applicationAccessToken={applicationAccessToken}
          apiUrl={REACT_APP_SERVER_BASE_URL}
          sdkClientUrls={sdkClientState.blobUrls}
          executionContext={executionContext}
          frontComponentHostCommunicationApi={
            frontComponentHostCommunicationApi
          }
          onError={onError}
        />
      )}
    </>
  );
};
