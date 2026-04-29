import { Injectable } from '@nestjs/common';

import { MessageParticipantRole } from 'twenty-shared/types';
import { In } from 'typeorm';

import { type TimelineCompanyThreadDTO } from 'src/engine/core-modules/messaging/dtos/timeline-company-thread.dto';
import { type TimelineThreadDTO } from 'src/engine/core-modules/messaging/dtos/timeline-thread.dto';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { type MessageChannelMessageAssociationWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel-message-association.workspace-entity';
import { MessageChannelVisibility } from 'src/modules/messaging/common/standard-objects/message-channel.workspace-entity';
import { type MessageParticipantWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-participant.workspace-entity';
import { type MessageThreadWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-thread.workspace-entity';
import { MessageDirection } from 'src/modules/messaging/common/enums/message-direction.enum';

@Injectable()
export class TimelineMessagingService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  public async getThreadReadByThreadId(
    messageThreadIds: string[],
    workspaceId: string,
  ): Promise<Record<string, boolean>> {
    if (messageThreadIds.length === 0) {
      return {};
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const associationRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageChannelMessageAssociationWorkspaceEntity>(
            workspaceId,
            'messageChannelMessageAssociation',
          );

        const latestDirections = await associationRepository
          .createQueryBuilder('association')
          .distinctOn(['message.messageThreadId'])
          .innerJoin('association.message', 'message')
          .select('message.messageThreadId', 'messageThreadId')
          .addSelect('association.direction', 'direction')
          .where('message.messageThreadId = ANY(:messageThreadIds)', {
            messageThreadIds,
          })
          .orderBy('message.messageThreadId', 'ASC')
          .addOrderBy('message.receivedAt', 'DESC')
          .getRawMany<{
            messageThreadId: string;
            direction: MessageDirection;
          }>();

        return latestDirections.reduce<Record<string, boolean>>(
          (accumulator, latestDirection) => {
            accumulator[latestDirection.messageThreadId] =
              latestDirection.direction !== MessageDirection.INCOMING;

            return accumulator;
          },
          {},
        );
      },
      authContext,
    );
  }

  public async getAndCountMessageThreads(
    personIds: string[],
    workspaceId: string,
    offset: number,
    pageSize: number,
  ): Promise<{
    messageThreads: Omit<
      TimelineThreadDTO,
      | 'firstParticipant'
      | 'lastTwoParticipants'
      | 'participantCount'
      | 'read'
      | 'visibility'
    >[];
    totalNumberOfThreads: number;
  }> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const messageThreadRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageThreadWorkspaceEntity>(
            workspaceId,
            'messageThread',
          );

        const totalNumberOfThreads = await messageThreadRepository
          .createQueryBuilder('messageThread')
          .innerJoin('messageThread.messages', 'messages')
          .innerJoin('messages.messageParticipants', 'messageParticipants')
          .where('messageParticipants.personId IN(:...personIds)', {
            personIds,
          })
          .groupBy('messageThread.id')
          .getCount();

        const threadIdsQuery = await messageThreadRepository
          .createQueryBuilder('messageThread')
          .select('messageThread.id', 'id')
          .addSelect('MAX(messages.receivedAt)', 'max_received_at')
          .innerJoin('messageThread.messages', 'messages')
          .innerJoin('messages.messageParticipants', 'messageParticipants')
          .where('messageParticipants.personId IN (:...personIds)', {
            personIds,
          })
          .groupBy('messageThread.id')
          .orderBy('max_received_at', 'DESC')
          .offset(offset)
          .limit(pageSize)
          .getRawMany();

        const messageThreadIds = threadIdsQuery.map((thread) => thread.id);

        const messageThreads = await messageThreadRepository.find({
          where: {
            id: In(messageThreadIds),
          },
          order: {
            messages: {
              receivedAt: 'DESC',
            },
          },
          relations: ['messages'],
        });

        return {
          messageThreads: messageThreads.map((messageThread) => {
            const lastMessage = messageThread.messages[0];
            const firstMessage =
              messageThread.messages[messageThread.messages.length - 1];

            return {
              id: messageThread.id,
              subject: firstMessage.subject ?? '',
              lastMessageBody: lastMessage.text ?? '',
              lastMessageReceivedAt: lastMessage.receivedAt ?? new Date(),
              numberOfMessagesInThread: messageThread.messages.length,
              tags: [],
            };
          }),
          totalNumberOfThreads,
        };
      },
      authContext,
    );
  }

  public async getAndCountMessageThreadsForWorkspaceMember(
    workspaceMemberId: string,
    workspaceId: string,
    offset: number,
    pageSize: number,
    direction?: MessageDirection,
    search?: string,
  ): Promise<{
    messageThreads: Omit<
      TimelineThreadDTO,
      | 'firstParticipant'
      | 'lastTwoParticipants'
      | 'participantCount'
      | 'read'
      | 'visibility'
    >[];
    totalNumberOfThreads: number;
  }> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const messageThreadRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageThreadWorkspaceEntity>(
            workspaceId,
            'messageThread',
          );

        const totalNumberOfThreadsQuery = messageThreadRepository
          .createQueryBuilder('messageThread')
          .innerJoin('messageThread.messages', 'message')
          .innerJoin(
            'message.messageChannelMessageAssociations',
            'messageChannelMessageAssociation',
          )
          .innerJoin(
            'messageChannelMessageAssociation.messageChannel',
            'messageChannel',
          )
          .innerJoin('messageChannel.connectedAccount', 'connectedAccount')
          .where('connectedAccount.accountOwnerId = :workspaceMemberId', {
            workspaceMemberId,
          });

        if (direction) {
          totalNumberOfThreadsQuery.andWhere(
            'messageChannelMessageAssociation.direction = :direction',
            { direction },
          );
        }

        if (search) {
          totalNumberOfThreadsQuery
            .leftJoin('message.messageParticipants', 'searchParticipant')
            .andWhere(
              `(
                LOWER(COALESCE(message.subject, '')) LIKE LOWER(:searchPattern)
                OR LOWER(COALESCE(message.text, '')) LIKE LOWER(:searchPattern)
                OR LOWER(COALESCE(searchParticipant.handle, '')) LIKE LOWER(:searchPattern)
                OR LOWER(COALESCE(searchParticipant.displayName, '')) LIKE LOWER(:searchPattern)
              )`,
              {
                searchPattern: `%${search}%`,
              },
            );
        }

        const totalNumberOfThreads = await totalNumberOfThreadsQuery
          .groupBy('messageThread.id')
          .getCount();

        const threadIdsQuery = messageThreadRepository
          .createQueryBuilder('messageThread')
          .select('messageThread.id', 'id')
          .addSelect('MAX(message.receivedAt)', 'max_received_at')
          .innerJoin('messageThread.messages', 'message')
          .innerJoin(
            'message.messageChannelMessageAssociations',
            'messageChannelMessageAssociation',
          )
          .innerJoin(
            'messageChannelMessageAssociation.messageChannel',
            'messageChannel',
          )
          .innerJoin('messageChannel.connectedAccount', 'connectedAccount')
          .where('connectedAccount.accountOwnerId = :workspaceMemberId', {
            workspaceMemberId,
          });

        if (direction) {
          threadIdsQuery.andWhere(
            'messageChannelMessageAssociation.direction = :direction',
            { direction },
          );
        }

        if (search) {
          threadIdsQuery
            .leftJoin('message.messageParticipants', 'searchParticipant')
            .andWhere(
              `(
                LOWER(COALESCE(message.subject, '')) LIKE LOWER(:searchPattern)
                OR LOWER(COALESCE(message.text, '')) LIKE LOWER(:searchPattern)
                OR LOWER(COALESCE(searchParticipant.handle, '')) LIKE LOWER(:searchPattern)
                OR LOWER(COALESCE(searchParticipant.displayName, '')) LIKE LOWER(:searchPattern)
              )`,
              {
                searchPattern: `%${search}%`,
              },
            );
        }

        const threadIds = await threadIdsQuery
          .groupBy('messageThread.id')
          .orderBy('max_received_at', 'DESC')
          .offset(offset)
          .limit(pageSize)
          .getRawMany();

        const messageThreadIds = threadIds.map((thread) => thread.id);

        if (messageThreadIds.length === 0) {
          return {
            messageThreads: [],
            totalNumberOfThreads,
          };
        }

        const messageThreads = await messageThreadRepository.find({
          where: {
            id: In(messageThreadIds),
          },
          order: {
            messages: {
              receivedAt: 'DESC',
            },
          },
          relations: ['messages'],
        });

        return {
          messageThreads: messageThreads.map((messageThread) => {
            const lastMessage = messageThread.messages[0];
            const firstMessage =
              messageThread.messages[messageThread.messages.length - 1];

            return {
              id: messageThread.id,
              subject: firstMessage.subject ?? '',
              lastMessageBody: lastMessage.text ?? '',
              lastMessageReceivedAt: lastMessage.receivedAt ?? new Date(),
              numberOfMessagesInThread: messageThread.messages.length,
              tags: [],
            };
          }),
          totalNumberOfThreads,
        };
      },
      authContext,
    );
  }

  public async getAndCountCompanyThreads(
    workspaceId: string,
    offset: number,
    pageSize: number,
  ): Promise<{
    companyThreads: TimelineCompanyThreadDTO[];
    totalNumberOfCompanies: number;
  }> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const companyRepository =
          await this.globalWorkspaceOrmManager.getRepository<CompanyWorkspaceEntity>(
            workspaceId,
            'company',
            { shouldBypassPermissionChecks: true },
          );

        const companyThreadsBaseQuery = companyRepository
          .createQueryBuilder('company')
          .innerJoin('company.people', 'person')
          .innerJoin('person.messageParticipants', 'messageParticipant')
          .innerJoin('messageParticipant.message', 'message')
          .innerJoin('message.messageThread', 'messageThread')
          .where('company.deletedAt IS NULL')
          .andWhere('person.deletedAt IS NULL')
          .andWhere('message.deletedAt IS NULL');

        const totalNumberOfCompanies = await companyThreadsBaseQuery
          .clone()
          .select('company.id')
          .groupBy('company.id')
          .getCount();

        const companyIdsResult = await companyThreadsBaseQuery
          .clone()
          .select('company.id', 'companyId')
          .addSelect('MAX(message.receivedAt)', 'latestMessageReceivedAt')
          .groupBy('company.id')
          .orderBy('latestMessageReceivedAt', 'DESC')
          .offset(offset)
          .limit(pageSize)
          .getRawMany<{ companyId: string }>();

        const companyIds = companyIdsResult.map((result) => result.companyId);

        if (companyIds.length === 0) {
          return {
            companyThreads: [],
            totalNumberOfCompanies,
          };
        }

        const threadCountRows = await companyThreadsBaseQuery
          .clone()
          .select('company.id', 'companyId')
          .addSelect('COUNT(DISTINCT messageThread.id)', 'totalNumberOfThreads')
          .andWhere('company.id IN (:...companyIds)', { companyIds })
          .groupBy('company.id')
          .getRawMany<{
            companyId: string;
            totalNumberOfThreads: string;
          }>();

        const latestThreadRows = await companyThreadsBaseQuery
          .clone()
          .select('company.id', 'companyId')
          .addSelect('company.name', 'companyName')
          .addSelect('messageThread.id', 'latestThreadId')
          .addSelect('message.subject', 'subject')
          .addSelect('message.text', 'latestMessageBody')
          .addSelect('message.receivedAt', 'latestMessageReceivedAt')
          .andWhere('company.id IN (:...companyIds)', { companyIds })
          .distinctOn(['company.id'])
          .orderBy('company.id', 'ASC')
          .addOrderBy('message.receivedAt', 'DESC')
          .getRawMany<{
            companyId: string;
            companyName: string | null;
            latestThreadId: string;
            subject: string | null;
            latestMessageBody: string | null;
            latestMessageReceivedAt: Date | null;
          }>();

        const threadCountByCompanyId = new Map(
          threadCountRows.map((row) => [
            row.companyId,
            Number(row.totalNumberOfThreads),
          ]),
        );

        const latestThreadByCompanyId = new Map(
          latestThreadRows.map((row) => [row.companyId, row]),
        );

        return {
          companyThreads: companyIds.flatMap((companyId) => {
            const latestThread = latestThreadByCompanyId.get(companyId);

            if (!latestThread?.latestThreadId) {
              return [];
            }

            return [
              {
                companyId,
                latestThreadId: latestThread.latestThreadId,
                companyName: latestThread.companyName ?? 'Unknown company',
                latestMessageReceivedAt:
                  latestThread.latestMessageReceivedAt ?? new Date(),
                latestMessageBody: latestThread.latestMessageBody ?? '',
                subject: latestThread.subject ?? '',
                totalNumberOfThreads:
                  threadCountByCompanyId.get(companyId) ?? 0,
              },
            ];
          }),
          totalNumberOfCompanies,
        };
      },
      authContext,
    );
  }

  public async getThreadParticipantsByThreadId(
    messageThreadIds: string[],
    workspaceId: string,
  ): Promise<{
    [key: string]: MessageParticipantWorkspaceEntity[];
  }> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const messageParticipantRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageParticipantWorkspaceEntity>(
            workspaceId,
            'messageParticipant',
          );

        const threadParticipants = await messageParticipantRepository
          .createQueryBuilder()
          .select('messageParticipant')
          .addSelect('message.messageThreadId')
          .addSelect('message.receivedAt')
          .leftJoinAndSelect('messageParticipant.person', 'person')
          .leftJoinAndSelect(
            'messageParticipant.workspaceMember',
            'workspaceMember',
          )
          .leftJoin('messageParticipant.message', 'message')
          .where('message.messageThreadId = ANY(:messageThreadIds)', {
            messageThreadIds,
          })
          .andWhere('messageParticipant.role = :role', {
            role: MessageParticipantRole.FROM,
          })
          .orderBy('message.messageThreadId')
          .distinctOn(['message.messageThreadId', 'messageParticipant.handle'])
          .getMany();

        const orderedThreadParticipants = threadParticipants.sort(
          (a, b) =>
            (a.message.receivedAt ?? new Date()).getTime() -
            (b.message.receivedAt ?? new Date()).getTime(),
        );

        const threadParticipantsWithCompositeFields =
          orderedThreadParticipants.map((threadParticipant) => ({
            ...threadParticipant,
            person: {
              id: threadParticipant.person?.id,
              name: {
                //oxlint-disable-next-line
                //@ts-ignore
                firstName: threadParticipant.person?.nameFirstName,
                //oxlint-disable-next-line
                //@ts-ignore
                lastName: threadParticipant.person?.nameLastName,
              },
              avatarUrl: threadParticipant.person?.avatarUrl,
            },
            workspaceMember: {
              id: threadParticipant.workspaceMember?.id,
              name: {
                //oxlint-disable-next-line
                //@ts-ignore
                firstName: threadParticipant.workspaceMember?.nameFirstName,
                //oxlint-disable-next-line
                //@ts-ignore
                lastName: threadParticipant.workspaceMember?.nameLastName,
              },
              avatarUrl: threadParticipant.workspaceMember?.avatarUrl,
            },
          }));

        return threadParticipantsWithCompositeFields.reduce(
          (threadParticipantsAcc, threadParticipant) => {
            if (!threadParticipant.message.messageThreadId)
              return threadParticipantsAcc;

            if (
              // @ts-expect-error legacy noImplicitAny
              !threadParticipantsAcc[threadParticipant.message.messageThreadId]
            )
              // @ts-expect-error legacy noImplicitAny
              threadParticipantsAcc[threadParticipant.message.messageThreadId] =
                [];

            // @ts-expect-error legacy noImplicitAny
            threadParticipantsAcc[
              threadParticipant.message.messageThreadId
            ].push(threadParticipant);

            return threadParticipantsAcc;
          },
          {},
        );
      },
      authContext,
    );
  }

  public async getThreadVisibilityByThreadId(
    messageThreadIds: string[],
    workspaceMemberId: string,
    workspaceId: string,
  ): Promise<{
    [key: string]: MessageChannelVisibility;
  }> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const messageThreadRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageThreadWorkspaceEntity>(
            workspaceId,
            'messageThread',
          );

        const threadVisibility = await messageThreadRepository
          .createQueryBuilder()
          .select('messageThread.id', 'id')
          .addSelect('messageChannel.visibility', 'visibility')
          .addSelect('connectedAccount.accountOwnerId', 'accountOwnerId')
          .leftJoin('messageThread.messages', 'message')
          .leftJoin(
            'message.messageChannelMessageAssociations',
            'messageChannelMessageAssociation',
          )
          .leftJoin(
            'messageChannelMessageAssociation.messageChannel',
            'messageChannel',
          )
          .leftJoin('messageChannel.connectedAccount', 'connectedAccount')
          .where('messageThread.id = ANY(:messageThreadIds)', {
            messageThreadIds: messageThreadIds,
          })
          .getRawMany();

        const visibilityValues = Object.values(MessageChannelVisibility);

        const threadVisibilityByThreadId: {
          [key: string]: MessageChannelVisibility;
        } = threadVisibility.reduce((threadVisibilityAcc, threadVisibility) => {
          if (threadVisibility.accountOwnerId === workspaceMemberId) {
            threadVisibilityAcc[threadVisibility.id] =
              MessageChannelVisibility.SHARE_EVERYTHING;

            return threadVisibilityAcc;
          }

          threadVisibilityAcc[threadVisibility.id] =
            visibilityValues[
              Math.max(
                visibilityValues.indexOf(threadVisibility.visibility),
                visibilityValues.indexOf(
                  threadVisibilityAcc[threadVisibility.id] ??
                    MessageChannelVisibility.METADATA,
                ),
              )
            ];

          return threadVisibilityAcc;
        }, {});

        return threadVisibilityByThreadId;
      },
      authContext,
    );
  }
}
