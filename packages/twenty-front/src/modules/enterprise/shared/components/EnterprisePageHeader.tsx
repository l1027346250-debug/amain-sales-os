import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { IconBriefcase } from 'twenty-ui/display';

export const EnterprisePageHeader = ({
  title,
}: {
  title: string;
}) => {
  return <PageHeader title={title} Icon={IconBriefcase} />;
};
