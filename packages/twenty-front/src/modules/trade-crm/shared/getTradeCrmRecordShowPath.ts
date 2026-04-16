import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';

export type TradeCrmRecordSourceContext = {
  sourceHref?: string;
  sourceWorkspace?: string;
  sourceView?: string;
  sourceLabel?: string;
  sourceTrail?: string;
};

export const getTradeCrmRecordShowPath = ({
  objectNameSingular,
  objectRecordId,
  sourceHref,
  sourceWorkspace,
  sourceView,
  sourceLabel,
  sourceTrail,
}: {
  objectNameSingular: string;
  objectRecordId: string;
} & TradeCrmRecordSourceContext) => {
  const basePath = getAppPath(AppPath.RecordShowPage, {
    objectNameSingular,
    objectRecordId,
  });

  const query = new URLSearchParams();

  if (sourceWorkspace) {
    query.set('sourceWorkspace', sourceWorkspace);
  }

  if (sourceView) {
    query.set('sourceView', sourceView);
  }

  if (sourceHref) {
    query.set('sourceHref', sourceHref);
  }

  if (sourceLabel) {
    query.set('sourceLabel', sourceLabel);
  }

  if (sourceTrail) {
    query.set('sourceTrail', sourceTrail);
  }

  const queryString = query.toString();

  return queryString.length > 0 ? `${basePath}?${queryString}` : basePath;
};
