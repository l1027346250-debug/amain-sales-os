import { gql } from '@apollo/client';

export const GET_DEVELOPMENT_EMAIL_REPORT_EXPORT = gql`
  query GetDevelopmentEmailReportExport {
    getDevelopmentEmailReportExport {
      fileName
      csvContent
      rowCount
    }
  }
`;
