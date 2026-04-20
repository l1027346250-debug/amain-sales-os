import { gql } from '@apollo/client';

export const GET_MY_CUSTOMER_MAIL_COMPANIES = gql`
  query GetMyCustomerMailCompanies($page: Int!, $pageSize: Int!) {
    getMyCustomerMailCompanies(page: $page, pageSize: $pageSize) {
      totalNumberOfCompanies
      timelineCompanyThreads {
        companyId
        latestThreadId
        companyName
        latestMessageReceivedAt
        latestMessageBody
        subject
        totalNumberOfThreads
      }
    }
  }
`;
