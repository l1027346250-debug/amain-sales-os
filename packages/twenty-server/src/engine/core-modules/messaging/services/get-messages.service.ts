import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';
import { TIMELINE_THREADS_DEFAULT_PAGE_SIZE } from 'src/engine/core-modules/messaging/constants/messaging.constants';
import { type TimelineCompanyThreadsWithTotalDTO } from 'src/engine/core-modules/messaging/dtos/timeline-company-threads-with-total.dto';
import { type TimelineThreadsWithTotalDTO } from 'src/engine/core-modules/messaging/dtos/timeline-threads-with-total.dto';
import { TradeCrmMailThreadTagEntity } from 'src/engine/core-modules/messaging/entities/trade-crm-mail-thread-tag.entity';
import { TradeCrmMailThreadTaskLinkEntity } from 'src/engine/core-modules/messaging/entities/trade-crm-mail-thread-task-link.entity';
import { TradeCrmMailThreadStateEntity } from 'src/engine/core-modules/messaging/entities/trade-crm-mail-thread-state.entity';
import { TimelineMessagingService } from 'src/engine/core-modules/messaging/services/timeline-messaging.service';
import { formatThreads } from 'src/engine/core-modules/messaging/utils/format-threads.util';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { MessageDirection } from 'src/modules/messaging/common/enums/message-direction.enum';

export type TradeCrmMailboxViewFilter = 'ALL' | 'UNREAD' | 'PENDING' | 'TAGGED';

@Injectable()
export class GetMessagesService {
  constructor(
    @InjectRepository(TradeCrmMailThreadStateEntity)
    private readonly tradeCrmMailThreadStateRepository: Repository<TradeCrmMailThreadStateEntity>,
    @InjectRepository(TradeCrmMailThreadTagEntity)
    private readonly tradeCrmMailThreadTagRepository: Repository<TradeCrmMailThreadTagEntity>,
    @InjectRepository(TradeCrmMailThreadTaskLinkEntity)
    private readonly tradeCrmMailThreadTaskLinkRepository: Repository<TradeCrmMailThreadTaskLinkEntity>,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly timelineMessagingService: TimelineMessagingService,
  ) {}

  async updateTradeCrmMailThreadState(
    workspaceId: string,
    threadId: string,
    isPending: boolean,
    pendingReason?: string,
  ): Promise<TradeCrmMailThreadStateEntity> {
    const existingThreadState =
      await this.tradeCrmMailThreadStateRepository.findOneBy({
        workspaceId,
        threadId,
      });

    if (existingThreadState) {
      existingThreadState.isPending = isPending;
      existingThreadState.pendingReason = isPending
        ? (pendingReason ?? existingThreadState.pendingReason)
        : null;

      return this.tradeCrmMailThreadStateRepository.save(existingThreadState);
    }

    return this.tradeCrmMailThreadStateRepository.save({
      workspaceId,
      threadId,
      isPending,
      pendingReason: isPending ? (pendingReason ?? null) : null,
      metadata: null,
    });
  }

  async updateTradeCrmMailThreadTag(
    workspaceId: string,
    threadId: string,
    mode: string,
    tag?: string,
  ): Promise<boolean> {
    if (mode === 'CLEAR_ALL') {
      await this.tradeCrmMailThreadTagRepository.delete({
        workspaceId,
        threadId,
      });

      return true;
    }

    if (mode !== 'ADD') {
      throw new BadRequestException('Unsupported thread tag mode.');
    }

    const normalizedTag = tag?.trim();

    if (!normalizedTag) {
      throw new BadRequestException(
        'Tag is required when adding a thread tag.',
      );
    }

    const existingThreadTag =
      await this.tradeCrmMailThreadTagRepository.findOneBy({
        workspaceId,
        threadId,
        tag: normalizedTag,
      });

    if (!existingThreadTag) {
      await this.tradeCrmMailThreadTagRepository.save({
        workspaceId,
        threadId,
        tag: normalizedTag,
      });
    }

    return true;
  }

  async upsertTradeCrmMailThreadTaskLink(
    workspaceId: string,
    threadId: string,
    taskId: string,
  ): Promise<TradeCrmMailThreadTaskLinkEntity> {
    const existingThreadTaskLink =
      await this.tradeCrmMailThreadTaskLinkRepository.findOneBy({
        workspaceId,
        threadId,
      });

    if (existingThreadTaskLink) {
      existingThreadTaskLink.taskId = taskId;

      return this.tradeCrmMailThreadTaskLinkRepository.save(
        existingThreadTaskLink,
      );
    }

    return this.tradeCrmMailThreadTaskLinkRepository.save({
      workspaceId,
      threadId,
      taskId,
    });
  }

  async getTradeCrmMailThreadTaskLinks(
    workspaceId: string,
    threadIds: string[],
  ): Promise<TradeCrmMailThreadTaskLinkEntity[]> {
    if (threadIds.length === 0) {
      return [];
    }

    return this.tradeCrmMailThreadTaskLinkRepository.find({
      where: {
        workspaceId,
        threadId: In(threadIds),
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async getThreadTaskLinksByThreadId(
    workspaceId: string,
    threadIds: string[],
  ): Promise<Record<string, string>> {
    const threadTaskLinks = await this.getTradeCrmMailThreadTaskLinks(
      workspaceId,
      threadIds,
    );

    return threadTaskLinks.reduce<Record<string, string>>(
      (accumulator, threadTaskLink) => {
        accumulator[threadTaskLink.threadId] = threadTaskLink.taskId;

        return accumulator;
      },
      {},
    );
  }

  private async getThreadTagsByThreadId(
    workspaceId: string,
    messageThreadIds: string[],
  ): Promise<Record<string, string[]>> {
    if (messageThreadIds.length === 0) {
      return {};
    }

    const threadTags = await this.tradeCrmMailThreadTagRepository.find({
      where: {
        workspaceId,
        threadId: In(messageThreadIds),
      },
      order: {
        updatedAt: 'DESC',
      },
    });

    return threadTags.reduce<Record<string, string[]>>(
      (
        accumulator: Record<string, string[]>,
        threadTag: TradeCrmMailThreadTagEntity,
      ) => {
        accumulator[threadTag.threadId] = [
          ...(accumulator[threadTag.threadId] ?? []),
          threadTag.tag,
        ];

        return accumulator;
      },
      {},
    );
  }

  async getMessagesFromPersonIds(
    workspaceMemberId: string,
    personIds: string[],
    workspaceId: string,
    page = 1,
    pageSize: number = TIMELINE_THREADS_DEFAULT_PAGE_SIZE,
  ): Promise<TimelineThreadsWithTotalDTO> {
    const offset = (page - 1) * pageSize;

    const { messageThreads, totalNumberOfThreads } =
      await this.timelineMessagingService.getAndCountMessageThreads(
        personIds,
        workspaceId,
        offset,
        pageSize,
      );

    if (!messageThreads) {
      return {
        totalNumberOfThreads: 0,
        timelineThreads: [],
      };
    }

    const messageThreadIds = messageThreads.map(
      (messageThread) => messageThread.id,
    );

    const threadParticipantsByThreadId =
      await this.timelineMessagingService.getThreadParticipantsByThreadId(
        messageThreadIds,
        workspaceId,
      );

    const threadVisibilityByThreadId =
      await this.timelineMessagingService.getThreadVisibilityByThreadId(
        messageThreadIds,
        workspaceMemberId,
        workspaceId,
      );

    return {
      totalNumberOfThreads,
      timelineThreads: formatThreads(
        messageThreads,
        threadParticipantsByThreadId,
        threadVisibilityByThreadId,
      ),
    };
  }

  async getMessagesFromCompanyId(
    workspaceMemberId: string,
    companyId: string,
    workspaceId: string,
    page = 1,
    pageSize: number = TIMELINE_THREADS_DEFAULT_PAGE_SIZE,
  ): Promise<TimelineThreadsWithTotalDTO> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const personRepository =
          await this.globalWorkspaceOrmManager.getRepository<PersonWorkspaceEntity>(
            workspaceId,
            'person',
            { shouldBypassPermissionChecks: true },
          );
        const personIds = (
          await personRepository.find({
            where: {
              companyId,
            },
            select: {
              id: true,
            },
          })
        ).map((person) => person.id);

        if (personIds.length === 0) {
          return {
            totalNumberOfThreads: 0,
            timelineThreads: [],
          };
        }

        const messageThreads = await this.getMessagesFromPersonIds(
          workspaceMemberId,
          personIds,
          workspaceId,
          page,
          pageSize,
        );

        return messageThreads;
      },
      authContext,
    );
  }

  async getMessagesFromOpportunityId(
    workspaceMemberId: string,
    opportunityId: string,
    workspaceId: string,
    page = 1,
    pageSize: number = TIMELINE_THREADS_DEFAULT_PAGE_SIZE,
  ): Promise<TimelineThreadsWithTotalDTO> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const opportunityRepository =
          await this.globalWorkspaceOrmManager.getRepository<OpportunityWorkspaceEntity>(
            workspaceId,
            'opportunity',
            { shouldBypassPermissionChecks: true },
          );

        const opportunity = await opportunityRepository.findOne({
          where: {
            id: opportunityId,
          },
          select: {
            companyId: true,
          },
        });

        if (!opportunity?.companyId) {
          return {
            totalNumberOfThreads: 0,
            timelineThreads: [],
          };
        }

        const messageThreads = await this.getMessagesFromCompanyId(
          workspaceMemberId,
          opportunity.companyId,
          workspaceId,
          page,
          pageSize,
        );

        return messageThreads;
      },
      authContext,
    );
  }

  async getMessagesForWorkspaceMember(
    workspaceMemberId: string,
    workspaceId: string,
    page = 1,
    pageSize: number = TIMELINE_THREADS_DEFAULT_PAGE_SIZE,
    direction?: MessageDirection,
    filter: TradeCrmMailboxViewFilter = 'ALL',
    search?: string,
    tag?: string,
    receivedAtFrom?: string,
    receivedAtTo?: string,
  ): Promise<TimelineThreadsWithTotalDTO> {
    const offset = (page - 1) * pageSize;

    const { messageThreads, totalNumberOfThreads } =
      await this.timelineMessagingService.getAndCountMessageThreadsForWorkspaceMember(
        workspaceMemberId,
        workspaceId,
        offset,
        pageSize,
        direction,
        search,
      );

    if (!messageThreads.length) {
      return {
        totalNumberOfThreads,
        timelineThreads: [],
      };
    }

    const messageThreadIds = messageThreads.map(
      (messageThread) => messageThread.id,
    );

    const threadParticipantsByThreadId =
      await this.timelineMessagingService.getThreadParticipantsByThreadId(
        messageThreadIds,
        workspaceId,
      );

    const threadVisibilityByThreadId =
      await this.timelineMessagingService.getThreadVisibilityByThreadId(
        messageThreadIds,
        workspaceMemberId,
        workspaceId,
      );

    const threadReadByThreadId =
      await this.timelineMessagingService.getThreadReadByThreadId(
        messageThreadIds,
        workspaceId,
      );

    const pendingThreadStatesByThreadId = (
      await this.tradeCrmMailThreadStateRepository.find({
        where: {
          workspaceId,
          threadId: In(messageThreadIds),
        },
        order: {
          updatedAt: 'DESC',
        },
      })
    ).reduce<Record<string, TradeCrmMailThreadStateEntity>>(
      (
        accumulator: Record<string, TradeCrmMailThreadStateEntity>,
        threadState: TradeCrmMailThreadStateEntity,
      ) => {
        accumulator[threadState.threadId] = threadState;

        return accumulator;
      },
      {},
    );
    const threadTagsByThreadId = await this.getThreadTagsByThreadId(
      workspaceId,
      messageThreadIds,
    );

    const formattedThreads = formatThreads(
      messageThreads,
      threadParticipantsByThreadId,
      threadVisibilityByThreadId,
      threadReadByThreadId,
      threadTagsByThreadId,
      pendingThreadStatesByThreadId,
    );

    const filteredThreads = formattedThreads.filter((thread) => {
      if (filter === 'UNREAD') {
        return thread.read === false;
      }

      if (filter === 'PENDING') {
        return pendingThreadStatesByThreadId[thread.id]?.isPending === true;
      }

      if (filter === 'TAGGED') {
        return (thread.tags?.length ?? 0) > 0;
      }

      if (tag && !thread.tags?.includes(tag)) {
        return false;
      }

      if (receivedAtFrom) {
        const receivedAtFromDate = new Date(receivedAtFrom);

        if (thread.lastMessageReceivedAt < receivedAtFromDate) {
          return false;
        }
      }

      if (receivedAtTo) {
        const receivedAtToDate = new Date(receivedAtTo);

        if (thread.lastMessageReceivedAt > receivedAtToDate) {
          return false;
        }
      }

      return true;
    });

    return {
      totalNumberOfThreads:
        filter === 'ALL' ? totalNumberOfThreads : filteredThreads.length,
      timelineThreads: filteredThreads,
    };
  }

  async getMessagesGroupedByCompany(
    workspaceId: string,
    page = 1,
    pageSize: number = TIMELINE_THREADS_DEFAULT_PAGE_SIZE,
  ): Promise<TimelineCompanyThreadsWithTotalDTO> {
    const offset = (page - 1) * pageSize;

    const { companyThreads, totalNumberOfCompanies } =
      await this.timelineMessagingService.getAndCountCompanyThreads(
        workspaceId,
        offset,
        pageSize,
      );

    return {
      totalNumberOfCompanies,
      timelineCompanyThreads: companyThreads,
    };
  }
}
