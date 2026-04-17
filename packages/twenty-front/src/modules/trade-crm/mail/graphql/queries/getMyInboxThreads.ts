import { gql } from '@apollo/client';

export const GET_MY_INBOX_THREADS = gql`
  query GetMyInboxThreads(
    $page: Int!
    $pageSize: Int!
    $direction: MessageDirection
    $filter: String
    $search: String
    $tag: String
    $receivedAtFrom: String
    $receivedAtTo: String
  ) {
    getMyInboxThreads(
      page: $page
      pageSize: $pageSize
      direction: $direction
      filter: $filter
      search: $search
      tag: $tag
      receivedAtFrom: $receivedAtFrom
      receivedAtTo: $receivedAtTo
    ) {
      totalNumberOfThreads
      timelineThreads {
        id
        read
        tags
        visibility
        lastMessageReceivedAt
        lastMessageBody
        subject
        numberOfMessagesInThread
        participantCount
        firstParticipant {
          personId
          workspaceMemberId
          firstName
          lastName
          displayName
          avatarUrl
          handle
        }
        lastTwoParticipants {
          personId
          workspaceMemberId
          firstName
          lastName
          displayName
          avatarUrl
          handle
        }
      }
    }
  }
`;
