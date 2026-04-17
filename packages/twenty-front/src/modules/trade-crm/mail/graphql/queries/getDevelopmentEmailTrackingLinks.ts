import { gql } from '@apollo/client';

export const GET_DEVELOPMENT_EMAIL_TRACKING_LINKS = gql`
  query GetDevelopmentEmailTrackingLinks(
    $input: GenerateDevelopmentEmailTrackingLinksInput!
  ) {
    getDevelopmentEmailTrackingLinks(input: $input) {
      openTrackingUrl
      clickTrackingUrl
      expiresAt
    }
  }
`;
