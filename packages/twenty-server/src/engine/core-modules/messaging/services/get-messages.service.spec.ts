import { GetMessagesService } from 'src/engine/core-modules/messaging/services/get-messages.service';

describe('GetMessagesService thread task links', () => {
  const tradeCrmMailThreadStateRepository = {
    findOneBy: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const tradeCrmMailThreadTagRepository = {
    delete: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const tradeCrmMailThreadTaskLinkRepository = {
    findOneBy: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const globalWorkspaceOrmManager = {
    executeInWorkspaceContext: jest.fn(),
    getRepository: jest.fn(),
  };

  const timelineMessagingService = {
    getAndCountMessageThreads: jest.fn(),
    getThreadParticipantsByThreadId: jest.fn(),
    getThreadVisibilityByThreadId: jest.fn(),
    getThreadReadByThreadId: jest.fn(),
  };

  const service = new GetMessagesService(
    tradeCrmMailThreadStateRepository as never,
    tradeCrmMailThreadTagRepository as never,
    tradeCrmMailThreadTaskLinkRepository as never,
    globalWorkspaceOrmManager as never,
    timelineMessagingService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a thread task link when none exists for the thread', async () => {
    tradeCrmMailThreadTaskLinkRepository.findOneBy.mockResolvedValue(null);
    tradeCrmMailThreadTaskLinkRepository.save.mockImplementation(
      async (value) => value,
    );

    const result = await service.upsertTradeCrmMailThreadTaskLink(
      'workspace-1',
      'thread-1',
      'task-1',
    );

    expect(tradeCrmMailThreadTaskLinkRepository.findOneBy).toHaveBeenCalledWith(
      {
        workspaceId: 'workspace-1',
        threadId: 'thread-1',
      },
    );
    expect(tradeCrmMailThreadTaskLinkRepository.save).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      threadId: 'thread-1',
      taskId: 'task-1',
    });
    expect(result.taskId).toBe('task-1');
  });

  it('should update the task id when the thread already has a linked task', async () => {
    tradeCrmMailThreadTaskLinkRepository.findOneBy.mockResolvedValue({
      id: 'link-1',
      workspaceId: 'workspace-1',
      threadId: 'thread-1',
      taskId: 'task-old',
    });
    tradeCrmMailThreadTaskLinkRepository.save.mockImplementation(
      async (value) => value,
    );

    const result = await service.upsertTradeCrmMailThreadTaskLink(
      'workspace-1',
      'thread-1',
      'task-new',
    );

    expect(tradeCrmMailThreadTaskLinkRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'link-1',
        taskId: 'task-new',
      }),
    );
    expect(result.taskId).toBe('task-new');
  });

  it('should return links indexed by thread id for exact lookup', async () => {
    tradeCrmMailThreadTaskLinkRepository.find.mockResolvedValue([
      {
        id: 'link-1',
        workspaceId: 'workspace-1',
        threadId: 'thread-1',
        taskId: 'task-1',
      },
      {
        id: 'link-2',
        workspaceId: 'workspace-1',
        threadId: 'thread-2',
        taskId: 'task-2',
      },
    ]);

    const result = await service.getThreadTaskLinksByThreadId('workspace-1', [
      'thread-1',
      'thread-2',
    ]);

    expect(tradeCrmMailThreadTaskLinkRepository.find).toHaveBeenCalled();
    expect(result).toEqual({
      'thread-1': 'task-1',
      'thread-2': 'task-2',
    });
  });
});
