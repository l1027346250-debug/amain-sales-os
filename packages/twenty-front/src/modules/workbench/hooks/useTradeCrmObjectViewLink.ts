import { useQuery } from '@apollo/client/react';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { ViewKey } from '@/views/types/ViewKey';
import { FindManyViewsDocument, ViewType } from '~/generated-metadata/graphql';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';

export const useTradeCrmObjectViewLink = ({
  objectNameSingular,
  preferredViewName,
}: {
  objectNameSingular: string;
  preferredViewName?: string;
}) => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const { objectMetadataItems } = useObjectMetadataItems();
  const objectMetadataItem = objectMetadataItems.find(
    (item) => item.nameSingular === objectNameSingular,
  );

  const { data } = useQuery(FindManyViewsDocument, {
    errorPolicy: 'all',
    skip: !objectMetadataItem || !currentWorkspaceMember?.id,
    variables: {
      objectMetadataId: objectMetadataItem?.id ?? '',
      viewTypes: [ViewType.TABLE, ViewType.KANBAN],
    },
  });

  if (!objectMetadataItem) {
    return AppPath.Index;
  }

  const fallbackPath = getAppPath(AppPath.RecordIndexPage, {
    objectNamePlural: objectMetadataItem.namePlural,
  });

  const preferredView = preferredViewName
    ? data?.getViews.find((view) => view.name === preferredViewName)
    : undefined;

  if (preferredView) {
    return getAppPath(
      AppPath.RecordIndexPage,
      {
        objectNamePlural: objectMetadataItem.namePlural,
      },
      { viewId: preferredView.id },
    );
  }

  const indexView = data?.getViews.find((view) => view.key === ViewKey.INDEX);

  if (indexView) {
    return getAppPath(
      AppPath.RecordIndexPage,
      {
        objectNamePlural: objectMetadataItem.namePlural,
      },
      { viewId: indexView.id },
    );
  }

  return fallbackPath;
};
