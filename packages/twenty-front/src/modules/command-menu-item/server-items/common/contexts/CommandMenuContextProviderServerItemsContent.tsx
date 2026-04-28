import {
  CommandMenuContext,
  type CommandMenuContextType,
} from '@/command-menu-item/contexts/CommandMenuContext';
import { ConvertLeadToCustomerSingleRecordCommand } from '@/command-menu-item/record/single-record/components/ConvertLeadToCustomerSingleRecordCommand';
import { ConvertLeadsToCustomersMultipleRecordsCommand } from '@/command-menu-item/record/multiple-records/components/ConvertLeadsToCustomersMultipleRecordsCommand';
import { useCommandMenuItemsFromBackend } from '@/command-menu-item/server-items/common/hooks/useCommandMenuItemsFromBackend';
import { CommandMenuItemScope } from '@/command-menu-item/types/CommandMenuItemScope';
import { CommandMenuItemType } from '@/command-menu-item/types/CommandMenuItemType';
import { type CommandMenuContextApi } from 'twenty-shared/types';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { IconTargetArrow } from 'twenty-ui/display';

type CommandMenuContextProviderServerItemsContentProps = {
  isInSidePanel: CommandMenuContextType['isInSidePanel'];
  displayType: CommandMenuContextType['displayType'];
  containerType: CommandMenuContextType['containerType'];
  children: React.ReactNode;
};

export const CommandMenuContextProviderServerItemsContent = ({
  isInSidePanel,
  displayType,
  containerType,
  children,
  commandMenuContextApi,
}: CommandMenuContextProviderServerItemsContentProps & {
  commandMenuContextApi: CommandMenuContextApi;
}) => {
  const commandMenuItems = useCommandMenuItemsFromBackend(
    commandMenuContextApi,
  );
  const shouldShowLeadConversionCommand =
    commandMenuContextApi.objectMetadataItem.nameSingular === 'lead' &&
    commandMenuContextApi.selectedRecords.length === 1;
  const shouldShowBulkLeadConversionCommand =
    commandMenuContextApi.objectMetadataItem.nameSingular === 'lead' &&
    commandMenuContextApi.selectedRecords.length > 1 &&
    commandMenuContextApi.selectedRecords.length <= 20;
  const localTradeCrmCommandMenuItems = shouldShowLeadConversionCommand
    ? [
        {
          type: CommandMenuItemType.Standard,
          scope: CommandMenuItemScope.RecordSelection,
          key: 'trade-crm-convert-lead-to-customer',
          label: 'Convert to customer',
          shortLabel: 'Convert',
          position: 1.5,
          isPinned: true,
          Icon: IconTargetArrow,
          shouldBeRegistered: () => true,
          component: <ConvertLeadToCustomerSingleRecordCommand />,
        },
      ]
    : shouldShowBulkLeadConversionCommand
      ? [
          {
            type: CommandMenuItemType.Standard,
            scope: CommandMenuItemScope.RecordSelection,
            key: 'trade-crm-convert-selected-leads-to-customers',
            label: 'Convert selected leads to customers',
            shortLabel: 'Convert selected leads',
            position: 14.5,
            isPinned: true,
            Icon: IconTargetArrow,
            shouldBeRegistered: () => true,
            component: <ConvertLeadsToCustomersMultipleRecordsCommand />,
          },
        ]
    : [];

  return (
    <CommandMenuContext.Provider
      value={{
        isInSidePanel,
        displayType,
        containerType,
        commandMenuItems: [...localTradeCrmCommandMenuItems, ...commandMenuItems],
      }}
    >
      {children}
    </CommandMenuContext.Provider>
  );
};
