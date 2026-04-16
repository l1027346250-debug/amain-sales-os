import {
  getTradeCrmRecordShowPath,
  type TradeCrmRecordSourceContext,
} from '@/trade-crm/shared/getTradeCrmRecordShowPath';

export type TradeCrmRecordSourceDescriptor<
  TWorkspace extends string = string,
  TView extends string = string,
> = {
  href: string;
  workspaceKey: TWorkspace;
  workspaceLabel: string;
  viewKey: TView;
  viewLabel: string;
  trail?: string;
};

export const createTradeCrmRecordSource = ({
  href,
  workspaceKey,
  workspaceLabel,
  viewKey,
  viewLabel,
  trail,
}: TradeCrmRecordSourceDescriptor): TradeCrmRecordSourceContext => ({
  sourceHref: href,
  sourceWorkspace: workspaceKey,
  sourceView: viewKey,
  sourceLabel: `${workspaceLabel} / ${viewLabel}`,
  sourceTrail: trail,
});

export const getTradeCrmRecordPathFromSource = ({
  objectNameSingular,
  objectRecordId,
  source,
}: {
  objectNameSingular: string;
  objectRecordId: string;
  source: TradeCrmRecordSourceContext;
}) =>
  getTradeCrmRecordShowPath({
    objectNameSingular,
    objectRecordId,
    ...source,
  });
