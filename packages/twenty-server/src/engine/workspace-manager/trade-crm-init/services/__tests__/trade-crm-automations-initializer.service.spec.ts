import { v4 as uuidv4 } from 'uuid';

import {
  TRADE_CRM_LEAD_12H_FIRST_RESPONSE_REMINDER_WORKFLOW_NAME,
  TRADE_CRM_LEAD_AUTO_ASSIGNMENT_WORKFLOW_NAME,
} from 'src/engine/workspace-manager/trade-crm-metadata/constants/trade-crm-automation-workflow-seeds.constant';
import { TradeCrmAutomationsInitializerService } from 'src/engine/workspace-manager/trade-crm-init/services/trade-crm-automations-initializer.service';
import { WorkflowVersionStatus } from 'src/modules/workflow/common/standard-objects/workflow-version.workspace-entity';
import { WorkflowStatus } from 'src/modules/workflow/common/standard-objects/workflow.workspace-entity';

describe('TradeCrmAutomationsInitializerService', () => {
  const workspaceId = uuidv4();

  const buildWorkflowRepository = () => ({
    findOne: jest.fn(),
    create: jest.fn(({ id, ...rest }) => ({ id, ...rest })),
    save: jest.fn(async (value) => value),
    update: jest.fn(),
  });

  const buildWorkflowVersionRepository = () => ({
    findOne: jest.fn(),
    create: jest.fn(({ id, ...rest }) => ({ id, ...rest })),
    save: jest.fn(async (value) => value),
    update: jest.fn(),
  });

  const buildWorkspaceMemberRepository = (members: Array<{ id: string }>) => ({
    find: jest.fn().mockResolvedValue(members),
  });

  const buildMetadataDataSource = ({
    leadObjectMetadataId = 'lead-object-metadata',
    fields = [
      {
        id: 'lead-id-field',
        name: 'id',
      },
      {
        id: 'lead-first-response-time-field',
        name: 'firstResponseTime',
      },
    ],
  }: {
    leadObjectMetadataId?: string;
    fields?: Array<{ id: string; name: string }>;
  } = {}) => ({
    getRepository: jest.fn((entity) => {
      if (entity.name === 'ObjectMetadataEntity') {
        return {
          findOne: jest.fn().mockResolvedValue({
            id: leadObjectMetadataId,
            nameSingular: 'lead',
          }),
        };
      }

      if (entity.name === 'FieldMetadataEntity') {
        return {
          find: jest.fn().mockResolvedValue(fields),
        };
      }

      throw new Error(`Unexpected metadata repository ${entity.name}`);
    }),
  });

  it('should create active lead auto assignment when workspace has a single member', async () => {
    const workflowRepository = buildWorkflowRepository();
    const workflowVersionRepository = buildWorkflowVersionRepository();
    const workspaceMemberRepository = buildWorkspaceMemberRepository([
      { id: 'workspace-member-1' },
    ]);

    workflowRepository.findOne.mockImplementation(async ({ where }) => {
      if (
        where.name === 'Trade CRM - Lead Auto Assignment' ||
        where.name === TRADE_CRM_LEAD_AUTO_ASSIGNMENT_WORKFLOW_NAME
      ) {
        return null;
      }

      return { id: uuidv4(), name: where.name };
    });

    const getRepository = jest.fn(async (_workspaceId, tableName) => {
      if (tableName === 'workflow') {
        return workflowRepository;
      }

      if (tableName === 'workflowVersion') {
        return workflowVersionRepository;
      }

      if (tableName === 'workspaceMember') {
        return workspaceMemberRepository;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    const service = new TradeCrmAutomationsInitializerService(
      {
        executeInWorkspaceContext: jest.fn(async (callback) => callback()),
        getRepository,
        getGlobalWorkspaceDataSource: jest
          .fn()
          .mockResolvedValue(buildMetadataDataSource()),
      } as never,
      {
        buildRecordPosition: jest.fn().mockResolvedValue(0),
      } as never,
      {
        activateWorkflowVersion: jest.fn().mockResolvedValue(undefined),
      } as never,
    );

    await service.initializeAutomations(workspaceId);

    expect(workflowRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Trade CRM - Lead Auto Assignment',
        statuses: [WorkflowStatus.DRAFT],
      }),
    );
    expect(workflowVersionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({
          settings: expect.objectContaining({ eventName: 'lead.created' }),
        }),
        steps: expect.arrayContaining([
          expect.objectContaining({
            type: 'IF_ELSE',
            settings: expect.objectContaining({
              input: expect.objectContaining({
                branches: expect.arrayContaining([
                  expect.objectContaining({
                    nextStepIds: ['lead-auto-assignment-update-step-1'],
                  }),
                ]),
              }),
            }),
          }),
          expect.objectContaining({
            type: 'UPDATE_RECORD',
            settings: expect.objectContaining({
              input: expect.objectContaining({
                objectName: 'lead',
                objectRecordId: '{{trigger.properties.after.id}}',
                objectRecord: expect.objectContaining({
                  assignedToId: 'workspace-member-1',
                }),
              }),
            }),
          }),
        ]),
      }),
    );
  });

  it('should upgrade existing draft auto assignment to active when workspace has a single member', async () => {
    const workflowRepository = buildWorkflowRepository();
    const workflowVersionRepository = buildWorkflowVersionRepository();
    const workspaceMemberRepository = buildWorkspaceMemberRepository([
      { id: 'workspace-member-1' },
    ]);
    const activateWorkflowVersion = jest.fn().mockResolvedValue(undefined);

    workflowRepository.findOne.mockImplementation(async ({ where }) => {
      if (where.name === 'Trade CRM - Lead Auto Assignment') {
        return {
          id: 'workflow-auto-assignment',
          name: TRADE_CRM_LEAD_AUTO_ASSIGNMENT_WORKFLOW_NAME,
          lastPublishedVersionId: null,
        };
      }

      return { id: uuidv4(), name: where.name, lastPublishedVersionId: 'published' };
    });

    workflowVersionRepository.findOne.mockResolvedValue({
      id: 'workflow-version-draft',
      workflowId: 'workflow-auto-assignment',
      status: WorkflowVersionStatus.DRAFT,
    });

    const getRepository = jest.fn(async (_workspaceId, tableName) => {
      if (tableName === 'workflow') {
        return workflowRepository;
      }

      if (tableName === 'workflowVersion') {
        return workflowVersionRepository;
      }

      if (tableName === 'workspaceMember') {
        return workspaceMemberRepository;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    const service = new TradeCrmAutomationsInitializerService(
      {
        executeInWorkspaceContext: jest.fn(async (callback) => callback()),
        getRepository,
        getGlobalWorkspaceDataSource: jest
          .fn()
          .mockResolvedValue(buildMetadataDataSource()),
      } as never,
      {
        buildRecordPosition: jest.fn().mockResolvedValue(0),
      } as never,
      {
        activateWorkflowVersion,
      } as never,
    );

    await service.initializeAutomations(workspaceId);

    expect(workflowVersionRepository.update).toHaveBeenCalledWith(
      'workflow-version-draft',
      expect.objectContaining({
        steps: expect.arrayContaining([
          expect.objectContaining({ type: 'IF_ELSE' }),
          expect.objectContaining({ type: 'UPDATE_RECORD' }),
        ]),
      }),
    );
    expect(activateWorkflowVersion).toHaveBeenCalledWith(
      'workflow-version-draft',
      workspaceId,
    );
    expect(workflowRepository.update).toHaveBeenCalledWith(
      'workflow-auto-assignment',
      expect.objectContaining({
        name: 'Trade CRM - Lead Auto Assignment',
        statuses: [WorkflowStatus.ACTIVE],
        lastPublishedVersionId: 'workflow-version-draft',
      }),
    );
  });

  it('should create active 12h first response reminder automation when workspace has a single member and lead metadata is available', async () => {
    const workflowRepository = buildWorkflowRepository();
    const workflowVersionRepository = buildWorkflowVersionRepository();
    const workspaceMemberRepository = buildWorkspaceMemberRepository([
      { id: 'workspace-member-1' },
    ]);

    workflowRepository.findOne.mockImplementation(async ({ where }) => {
      if (
        where.name === 'Trade CRM - Lead 12h First Response Reminder' ||
        where.name === TRADE_CRM_LEAD_12H_FIRST_RESPONSE_REMINDER_WORKFLOW_NAME
      ) {
        return null;
      }

      return { id: uuidv4(), name: where.name, lastPublishedVersionId: 'published' };
    });

    const getRepository = jest.fn(async (_workspaceId, tableName) => {
      if (tableName === 'workflow') {
        return workflowRepository;
      }

      if (tableName === 'workflowVersion') {
        return workflowVersionRepository;
      }

      if (tableName === 'workspaceMember') {
        return workspaceMemberRepository;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    const service = new TradeCrmAutomationsInitializerService(
      {
        executeInWorkspaceContext: jest.fn(async (callback) => callback()),
        getRepository,
        getGlobalWorkspaceDataSource: jest
          .fn()
          .mockResolvedValue(buildMetadataDataSource()),
      } as never,
      {
        buildRecordPosition: jest.fn().mockResolvedValue(0),
      } as never,
      {
        activateWorkflowVersion: jest.fn().mockResolvedValue(undefined),
      } as never,
    );

    await service.initializeAutomations(workspaceId);

    expect(workflowRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Trade CRM - Lead 12h First Response Reminder',
      }),
    );
    expect(workflowVersionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({
          settings: expect.objectContaining({ eventName: 'lead.created' }),
        }),
        steps: expect.arrayContaining([
          expect.objectContaining({ type: 'DELAY' }),
          expect.objectContaining({ type: 'FIND_RECORDS' }),
          expect.objectContaining({ type: 'IF_ELSE' }),
          expect.objectContaining({
            type: 'CREATE_RECORD',
            settings: expect.objectContaining({
              input: expect.objectContaining({
                objectName: 'task',
                objectRecord: expect.objectContaining({
                  assigneeId:
                    '{{a8e038dc-9626-4b7e-bf88-772ef6545dc2.first.assignedToId}}',
                  status: 'TODO',
                }),
              }),
            }),
          }),
        ]),
      }),
    );
  });

  it('should upgrade existing draft 12h first response reminder automation to active when workspace has a single member', async () => {
    const workflowRepository = buildWorkflowRepository();
    const workflowVersionRepository = buildWorkflowVersionRepository();
    const workspaceMemberRepository = buildWorkspaceMemberRepository([
      { id: 'workspace-member-1' },
    ]);
    const activateWorkflowVersion = jest.fn().mockResolvedValue(undefined);

    workflowRepository.findOne.mockImplementation(async ({ where }) => {
      if (where.name === 'Trade CRM - Lead 12h First Response Reminder') {
        return {
          id: 'workflow-reminder',
          name: TRADE_CRM_LEAD_12H_FIRST_RESPONSE_REMINDER_WORKFLOW_NAME,
          lastPublishedVersionId: null,
        };
      }

      return { id: uuidv4(), name: where.name, lastPublishedVersionId: 'published' };
    });

    workflowVersionRepository.findOne.mockResolvedValue({
      id: 'workflow-version-reminder-draft',
      workflowId: 'workflow-reminder',
      status: WorkflowVersionStatus.DRAFT,
    });

    const getRepository = jest.fn(async (_workspaceId, tableName) => {
      if (tableName === 'workflow') {
        return workflowRepository;
      }

      if (tableName === 'workflowVersion') {
        return workflowVersionRepository;
      }

      if (tableName === 'workspaceMember') {
        return workspaceMemberRepository;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    const service = new TradeCrmAutomationsInitializerService(
      {
        executeInWorkspaceContext: jest.fn(async (callback) => callback()),
        getRepository,
        getGlobalWorkspaceDataSource: jest
          .fn()
          .mockResolvedValue(buildMetadataDataSource()),
      } as never,
      {
        buildRecordPosition: jest.fn().mockResolvedValue(0),
      } as never,
      {
        activateWorkflowVersion,
      } as never,
    );

    await service.initializeAutomations(workspaceId);

    expect(workflowVersionRepository.update).toHaveBeenCalledWith(
      'workflow-version-reminder-draft',
      expect.objectContaining({
        steps: expect.arrayContaining([
          expect.objectContaining({ type: 'DELAY' }),
          expect.objectContaining({ type: 'FIND_RECORDS' }),
          expect.objectContaining({ type: 'IF_ELSE' }),
          expect.objectContaining({ type: 'CREATE_RECORD' }),
        ]),
      }),
    );
    expect(activateWorkflowVersion).toHaveBeenCalledWith(
      'workflow-version-reminder-draft',
      workspaceId,
    );
    expect(workflowRepository.update).toHaveBeenCalledWith(
      'workflow-reminder',
      expect.objectContaining({
        name: 'Trade CRM - Lead 12h First Response Reminder',
        statuses: [WorkflowStatus.ACTIVE],
        lastPublishedVersionId: 'workflow-version-reminder-draft',
      }),
    );
  });

  it('should create active lead auto assignment from configured lead assignment rules in a multi-member workspace', async () => {
    const workflowRepository = buildWorkflowRepository();
    const workflowVersionRepository = buildWorkflowVersionRepository();
    const workspaceMemberRepository = buildWorkspaceMemberRepository([
      { id: 'workspace-member-1', userEmail: 'north@example.com' },
      { id: 'workspace-member-2', userEmail: 'south@example.com' },
    ]);

    workflowRepository.findOne.mockImplementation(async ({ where }) => {
      if (
        where.name === 'Trade CRM - Lead Auto Assignment' ||
        where.name === TRADE_CRM_LEAD_AUTO_ASSIGNMENT_WORKFLOW_NAME
      ) {
        return null;
      }

      return { id: uuidv4(), name: where.name, lastPublishedVersionId: 'published' };
    });

    const getRepository = jest.fn(async (_workspaceId, tableName) => {
      if (tableName === 'workflow') {
        return workflowRepository;
      }

      if (tableName === 'workflowVersion') {
        return workflowVersionRepository;
      }

      if (tableName === 'workspaceMember') {
        return workspaceMemberRepository;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    const service = new TradeCrmAutomationsInitializerService(
      {
        executeInWorkspaceContext: jest.fn(async (callback) => callback()),
        getRepository,
        getGlobalWorkspaceDataSource: jest
          .fn()
          .mockResolvedValue(buildMetadataDataSource()),
      } as never,
      {
        buildRecordPosition: jest.fn().mockResolvedValue(0),
      } as never,
      {
        activateWorkflowVersion: jest.fn().mockResolvedValue(undefined),
      } as never,
    );

    await service.initializeAutomations(workspaceId, {
      leadAssignmentRules: [
        {
          userEmail: 'north@example.com',
          source: 'ALIBABA',
          country: 'US',
        },
        {
          userEmail: 'south@example.com',
          source: 'WHATSAPP',
        },
      ],
    });

    expect(workflowVersionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: expect.arrayContaining([
          expect.objectContaining({
            type: 'IF_ELSE',
            settings: expect.objectContaining({
              input: expect.objectContaining({
                branches: expect.arrayContaining([
                  expect.objectContaining({
                    nextStepIds: ['lead-auto-assignment-update-step-1'],
                  }),
                  expect.objectContaining({
                    nextStepIds: ['lead-auto-assignment-update-step-2'],
                  }),
                ]),
                stepFilters: expect.arrayContaining([
                  expect.objectContaining({
                    stepOutputKey: '{{trigger.properties.after.source}}',
                    value: 'ALIBABA',
                  }),
                  expect.objectContaining({
                    stepOutputKey: '{{trigger.properties.after.country}}',
                    value: 'US',
                  }),
                  expect.objectContaining({
                    stepOutputKey: '{{trigger.properties.after.source}}',
                    value: 'WHATSAPP',
                  }),
                ]),
              }),
            }),
          }),
          expect.objectContaining({
            id: 'lead-auto-assignment-update-step-1',
            type: 'UPDATE_RECORD',
            settings: expect.objectContaining({
              input: expect.objectContaining({
                objectRecord: expect.objectContaining({
                  assignedToId: 'workspace-member-1',
                }),
              }),
            }),
          }),
          expect.objectContaining({
            id: 'lead-auto-assignment-update-step-2',
            type: 'UPDATE_RECORD',
            settings: expect.objectContaining({
              input: expect.objectContaining({
                objectRecord: expect.objectContaining({
                  assignedToId: 'workspace-member-2',
                }),
              }),
            }),
          }),
        ]),
      }),
    );
  });
});
