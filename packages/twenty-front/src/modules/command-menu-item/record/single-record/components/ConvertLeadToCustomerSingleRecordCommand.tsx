import { Command } from '@/command-menu-item/display/components/Command';
import { useSelectedRecordIdOrThrow } from '@/command-menu-item/record/single-record/hooks/useSelectedRecordIdOrThrow';
import { getTradeCrmCustomerPath } from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';

export const ConvertLeadToCustomerSingleRecordCommand = () => {
  const leadId = useSelectedRecordIdOrThrow();

  const handleConvertLeadToCustomer = () => {
    window.location.assign(
      `${getTradeCrmCustomerPath('list')}?leadIdToConvert=${leadId}&autoConvertLead=1&afterConvert=create-opportunity`,
    );
  };

  return <Command onClick={handleConvertLeadToCustomer} />;
};
