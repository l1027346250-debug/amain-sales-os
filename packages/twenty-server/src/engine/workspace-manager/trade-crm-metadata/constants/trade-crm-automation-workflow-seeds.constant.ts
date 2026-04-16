import { WorkflowStatus } from 'src/modules/workflow/common/standard-objects/workflow.workspace-entity';
import {
  WorkflowActionType,
  type WorkflowAction,
} from 'src/modules/workflow/workflow-executor/workflow-actions/types/workflow-action.type';
import {
  WorkflowTriggerType,
  type WorkflowTrigger,
} from 'src/modules/workflow/workflow-trigger/types/workflow-trigger.type';

const DEFAULT_ERROR_HANDLING_OPTIONS = {
  retryOnFailure: { value: true },
  continueOnFailure: { value: false },
} as const;

const LEAD_FIRST_RESPONSE_TASK_STEP_ID =
  '4bdc3d68-b445-45a1-88cc-5089f8158306';
const LEAD_AUTO_ASSIGNMENT_STEP_ID =
  'f0c7a5db-1d31-47f1-8e2a-366a6f89d142';
const LEAD_12H_DELAY_STEP_ID = 'f23366f8-52e7-417e-8bb8-bfd33727e0b5';
const LEAD_12H_FIND_STEP_ID = 'a8e038dc-9626-4b7e-bf88-772ef6545dc2';
const LEAD_12H_DECISION_STEP_ID = 'a46d08df-5b94-4950-95bf-4df354b422d0';
const LEAD_12H_CREATE_TASK_STEP_ID = '35a62e73-a484-449e-a9e9-b08053cb7e02';
const LEAD_12H_FILTER_GROUP_ID = '7467ca19-1658-4d7c-bc86-c88ca595862f';
const LEAD_12H_IF_FILTER_GROUP_ID = '92f556a7-0263-4a34-8171-64c0636ff062';
const LEAD_12H_IF_BRANCH_ID = 'f17818a7-2f08-41ec-aa51-a7410e85bfb8';
const LEAD_12H_ELSE_BRANCH_ID = '132c8622-693c-49ee-9286-aa90233716e9';
const OPPORTUNITY_QUOTATION_DELAY_STEP_ID =
  'e11a8f4f-a8a7-4670-9f35-6924bc0ef249';
const OPPORTUNITY_QUOTATION_FIND_STEP_ID =
  '9066587d-476a-4eea-8798-a271bd7932f7';
const OPPORTUNITY_QUOTATION_DECISION_STEP_ID =
  '6eab2834-eb10-4f2a-bc6e-cd2fbe9ef736';
const OPPORTUNITY_QUOTATION_CREATE_TASK_STEP_ID =
  '86fa6882-5310-4417-8946-4f5305f2615f';
const OPPORTUNITY_QUOTATION_FILTER_GROUP_ID =
  '0ed44cbe-b71d-4bd2-b784-1d266db88f11';
const OPPORTUNITY_QUOTATION_IF_FILTER_GROUP_ID =
  '4153f70a-cbc4-47d1-af9d-a1880169667d';
const OPPORTUNITY_QUOTATION_IF_BRANCH_ID =
  'fbb8ff59-2a38-4b39-b53f-b81bff81a0c7';
const OPPORTUNITY_QUOTATION_ELSE_BRANCH_ID =
  '9707d2fe-3ce4-4c1c-9a8b-a5d970858fd6';
const OPPORTUNITY_STALLED_DELAY_STEP_ID =
  '6e4d175a-6d77-48b8-ac8a-0fe11afbe865';
const OPPORTUNITY_STALLED_FIND_STEP_ID =
  'a0f421e6-9ef5-4b31-b48c-65d24069a928';
const OPPORTUNITY_STALLED_DECISION_STEP_ID =
  '4e3bc6db-4b54-4d13-b9df-77fdb4e69a9e';
const OPPORTUNITY_STALLED_UPDATE_STEP_ID =
  'd1a1f5f7-2341-4c5b-8b15-d61429d3a06a';
const OPPORTUNITY_STALLED_FILTER_GROUP_ID =
  '2997ae75-e92e-47d3-8f3b-85844ee4b0fd';
const OPPORTUNITY_STALLED_IF_FILTER_GROUP_ID =
  '6ef03f03-41f0-4944-9ddf-88be203267e5';
const OPPORTUNITY_STALLED_IF_BRANCH_ID =
  'b7e35484-e253-4b1a-bbe6-08d89851508d';
const OPPORTUNITY_STALLED_ELSE_BRANCH_ID =
  'e0bff022-b884-425f-8b59-18589879db0b';

export const TRADE_CRM_LEAD_AUTO_ASSIGNMENT_WORKFLOW_NAME =
  '[Draft] Trade CRM - Lead Auto Assignment';
export const TRADE_CRM_LEAD_12H_FIRST_RESPONSE_REMINDER_WORKFLOW_NAME =
  '[Draft] Trade CRM - Lead 12h First Response Reminder';
export const TRADE_CRM_OPPORTUNITY_QUOTATION_3D_FOLLOW_UP_WORKFLOW_NAME =
  '[Draft] Trade CRM - Opportunity Quotation 3d Follow-up';
export const TRADE_CRM_OPPORTUNITY_7D_STALLED_MARKER_WORKFLOW_NAME =
  '[Draft] Trade CRM - Opportunity 7d Stalled Marker';

export type TradeCrmAutomationWorkflowSeed = {
  name: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  steps: WorkflowAction[];
};

type TradeCrmLeadAssignmentWorkflowRule = {
  workspaceMemberId: string;
  source?: string;
  country?: string;
  productCategory?: string;
  priority?: number;
};

export const TRADE_CRM_AUTOMATION_WORKFLOW_SEEDS: TradeCrmAutomationWorkflowSeed[] =
  [
    {
      name: 'Trade CRM - Lead First Response Task',
      status: WorkflowStatus.ACTIVE,
      trigger: {
        name: 'Lead Created',
        type: WorkflowTriggerType.DATABASE_EVENT,
        settings: {
          eventName: 'lead.created',
          outputSchema: {},
        },
        nextStepIds: [LEAD_FIRST_RESPONSE_TASK_STEP_ID],
        position: { x: 80, y: 120 },
      },
      steps: [
        {
          id: LEAD_FIRST_RESPONSE_TASK_STEP_ID,
          name: 'Create First Response Task',
          type: WorkflowActionType.CREATE_RECORD,
          valid: true,
          nextStepIds: [],
          position: { x: 420, y: 120 },
          settings: {
            input: {
              objectName: 'task',
              objectRecord: {
                title:
                  'First response: {{trigger.properties.after.leadName}}',
              },
            },
            outputSchema: {},
            errorHandlingOptions: DEFAULT_ERROR_HANDLING_OPTIONS,
          },
        },
      ],
    },
    {
      name: TRADE_CRM_LEAD_AUTO_ASSIGNMENT_WORKFLOW_NAME,
      status: WorkflowStatus.DRAFT,
      trigger: {
        name: 'Lead Created',
        type: WorkflowTriggerType.DATABASE_EVENT,
        settings: {
          eventName: 'lead.created',
          outputSchema: {},
        },
        position: { x: 80, y: 120 },
      },
      steps: [],
    },
    {
      name: TRADE_CRM_LEAD_12H_FIRST_RESPONSE_REMINDER_WORKFLOW_NAME,
      status: WorkflowStatus.DRAFT,
      trigger: {
        name: 'Hourly Lead Reminder Sweep',
        type: WorkflowTriggerType.CRON,
        settings: {
          type: 'HOURS',
          schedule: { hour: 1, minute: 0 },
          outputSchema: {},
        },
        position: { x: 80, y: 120 },
      },
      steps: [],
    },
    {
      name: TRADE_CRM_OPPORTUNITY_QUOTATION_3D_FOLLOW_UP_WORKFLOW_NAME,
      status: WorkflowStatus.DRAFT,
      trigger: {
        name: 'Daily Opportunity Follow-up Sweep',
        type: WorkflowTriggerType.CRON,
        settings: {
          type: 'DAYS',
          schedule: { day: 1, hour: 9, minute: 0 },
          outputSchema: {},
        },
        position: { x: 80, y: 120 },
      },
      steps: [],
    },
    {
      name: TRADE_CRM_OPPORTUNITY_7D_STALLED_MARKER_WORKFLOW_NAME,
      status: WorkflowStatus.DRAFT,
      trigger: {
        name: 'Daily Opportunity Stalled Sweep',
        type: WorkflowTriggerType.CRON,
        settings: {
          type: 'DAYS',
          schedule: { day: 1, hour: 9, minute: 30 },
          outputSchema: {},
        },
        position: { x: 80, y: 120 },
      },
      steps: [],
    },
  ];

export const buildTradeCrmLeadAutoAssignmentWorkflowSeed = ({
  rules,
}: {
  rules: TradeCrmLeadAssignmentWorkflowRule[];
}): TradeCrmAutomationWorkflowSeed => ({
  name: 'Trade CRM - Lead Auto Assignment',
  status: WorkflowStatus.ACTIVE,
  trigger: {
    name: 'Lead Created',
    type: WorkflowTriggerType.DATABASE_EVENT,
    settings: {
      eventName: 'lead.created',
      outputSchema: {},
    },
    nextStepIds: [LEAD_AUTO_ASSIGNMENT_STEP_ID],
    position: { x: 80, y: 120 },
  },
  steps: [
    {
      id: LEAD_AUTO_ASSIGNMENT_STEP_ID,
      name: 'Route Lead Assignment',
      type: WorkflowActionType.IF_ELSE,
      valid: true,
      nextStepIds: [],
      position: { x: 420, y: 120 },
      settings: {
        input: {
          stepFilterGroups: rules.map((rule, index) => ({
            id: `lead-auto-assignment-filter-group-${index + 1}`,
            logicalOperator: 'AND',
          })),
          stepFilters: rules.flatMap((rule, index) => {
            const groupId = `lead-auto-assignment-filter-group-${index + 1}`;
            const filters = [];

            if (rule.source) {
              filters.push({
                id: `lead-auto-assignment-source-filter-${index + 1}`,
                type: 'string',
                value: rule.source,
                operand: 'IS',
                stepOutputKey: '{{trigger.properties.after.source}}',
                stepFilterGroupId: groupId,
                positionInStepFilterGroup: filters.length,
                isFullRecord: false,
              });
            }

            if (rule.country) {
              filters.push({
                id: `lead-auto-assignment-country-filter-${index + 1}`,
                type: 'string',
                value: rule.country,
                operand: 'IS',
                stepOutputKey: '{{trigger.properties.after.country}}',
                stepFilterGroupId: groupId,
                positionInStepFilterGroup: filters.length,
                isFullRecord: false,
              });
            }

            if (rule.productCategory) {
              filters.push({
                id: `lead-auto-assignment-product-category-filter-${index + 1}`,
                type: 'string',
                value: rule.productCategory,
                operand: 'IS',
                stepOutputKey: '{{trigger.properties.after.productCategory}}',
                stepFilterGroupId: groupId,
                positionInStepFilterGroup: filters.length,
                isFullRecord: false,
              });
            }

            if (filters.length === 0) {
              filters.push({
                id: `lead-auto-assignment-catch-all-filter-${index + 1}`,
                type: 'string',
                value: '{{trigger.properties.after.id}}',
                operand: 'IS_NOT_EMPTY',
                stepOutputKey: '{{trigger.properties.after.id}}',
                stepFilterGroupId: groupId,
                positionInStepFilterGroup: 0,
                isFullRecord: false,
              });
            }

            return filters;
          }),
          branches: [
            ...rules.map((rule, index) => ({
              id: `lead-auto-assignment-branch-${index + 1}`,
              filterGroupId: `lead-auto-assignment-filter-group-${index + 1}`,
              nextStepIds: [`lead-auto-assignment-update-step-${index + 1}`],
            })),
            {
              id: 'lead-auto-assignment-no-match-branch',
              nextStepIds: [],
            },
          ],
        },
        outputSchema: {},
        errorHandlingOptions: DEFAULT_ERROR_HANDLING_OPTIONS,
      },
    },
    ...rules.map(
      (rule, index): WorkflowAction => ({
        id: `lead-auto-assignment-update-step-${index + 1}`,
        name: `Assign Lead Rule ${index + 1}`,
        type: WorkflowActionType.UPDATE_RECORD,
        valid: true,
        nextStepIds: [],
        position: { x: 760, y: 120 + index * 120 },
        settings: {
          input: {
            objectName: 'lead',
            objectRecordId: '{{trigger.properties.after.id}}',
            objectRecord: {
              assignedToId: rule.workspaceMemberId,
            },
            fieldsToUpdate: ['assignedToId'],
          },
          outputSchema: {},
          errorHandlingOptions: DEFAULT_ERROR_HANDLING_OPTIONS,
        },
      }),
    ),
  ],
});

export const buildTradeCrmLead12hFirstResponseReminderWorkflowSeed = ({
  leadIdFieldMetadataId,
  leadFirstResponseTimeFieldMetadataId,
}: {
  leadIdFieldMetadataId: string;
  leadFirstResponseTimeFieldMetadataId: string;
}): TradeCrmAutomationWorkflowSeed => ({
  name: 'Trade CRM - Lead 12h First Response Reminder',
  status: WorkflowStatus.ACTIVE,
  trigger: {
    name: 'Lead Created',
    type: WorkflowTriggerType.DATABASE_EVENT,
    settings: {
      eventName: 'lead.created',
      outputSchema: {},
    },
    nextStepIds: [LEAD_12H_DELAY_STEP_ID],
    position: { x: 80, y: 120 },
  },
  steps: [
    {
      id: LEAD_12H_DELAY_STEP_ID,
      name: 'Wait 12 Hours',
      type: WorkflowActionType.DELAY,
      valid: true,
      nextStepIds: [LEAD_12H_FIND_STEP_ID],
      position: { x: 360, y: 120 },
      settings: {
        input: {
          delayType: 'DURATION',
          duration: {
            hours: 12,
          },
        },
        outputSchema: {},
        errorHandlingOptions: DEFAULT_ERROR_HANDLING_OPTIONS,
      },
    },
    {
      id: LEAD_12H_FIND_STEP_ID,
      name: 'Find Overdue Lead',
      type: WorkflowActionType.FIND_RECORDS,
      valid: true,
      nextStepIds: [LEAD_12H_DECISION_STEP_ID],
      position: { x: 650, y: 120 },
      settings: {
        input: {
          objectName: 'lead',
          limit: 1,
          filter: {
            recordFilterGroups: [
              {
                id: LEAD_12H_FILTER_GROUP_ID,
                logicalOperator: 'AND',
              },
            ],
            recordFilters: [
              {
                id: '2a7c9462-5635-4954-a50f-98d7d9b8de17',
                fieldMetadataId: leadIdFieldMetadataId,
                type: 'UUID',
                value: '["{{trigger.properties.after.id}}"]',
                operand: 'IS',
                recordFilterGroupId: LEAD_12H_FILTER_GROUP_ID,
              },
              {
                id: '5f5de918-2cd3-4a0d-8f27-74939b35e611',
                fieldMetadataId: leadFirstResponseTimeFieldMetadataId,
                type: 'DATE_TIME',
                value: '',
                operand: 'IS_EMPTY',
                recordFilterGroupId: LEAD_12H_FILTER_GROUP_ID,
              },
            ],
          },
        },
        outputSchema: {},
        errorHandlingOptions: DEFAULT_ERROR_HANDLING_OPTIONS,
      },
    },
    {
      id: LEAD_12H_DECISION_STEP_ID,
      name: 'Lead Still Awaiting First Response?',
      type: WorkflowActionType.IF_ELSE,
      valid: true,
      nextStepIds: [],
      position: { x: 940, y: 120 },
      settings: {
        input: {
          stepFilterGroups: [
            {
              id: LEAD_12H_IF_FILTER_GROUP_ID,
              logicalOperator: 'AND',
            },
          ],
          stepFilters: [
            {
              id: '3f34452d-2b7b-40d0-a7d6-f7e8587b2208',
              type: 'number',
              value: '1',
              operand: 'GREATER_THAN_OR_EQUAL',
              isFullRecord: false,
              stepOutputKey: `{{${LEAD_12H_FIND_STEP_ID}.totalCount}}`,
              stepFilterGroupId: LEAD_12H_IF_FILTER_GROUP_ID,
              positionInStepFilterGroup: 0,
            },
          ],
          branches: [
            {
              id: LEAD_12H_IF_BRANCH_ID,
              filterGroupId: LEAD_12H_IF_FILTER_GROUP_ID,
              nextStepIds: [LEAD_12H_CREATE_TASK_STEP_ID],
            },
            {
              id: LEAD_12H_ELSE_BRANCH_ID,
              nextStepIds: [],
            },
          ],
        },
        outputSchema: {},
        errorHandlingOptions: DEFAULT_ERROR_HANDLING_OPTIONS,
      },
    },
    {
      id: LEAD_12H_CREATE_TASK_STEP_ID,
      name: 'Create First Response Reminder Task',
      type: WorkflowActionType.CREATE_RECORD,
      valid: true,
      nextStepIds: [],
      position: { x: 1240, y: 120 },
      settings: {
        input: {
          objectName: 'task',
          objectRecord: {
            title: 'Lead 12h no response: {{trigger.properties.after.leadName}}',
            assigneeId: `{{${LEAD_12H_FIND_STEP_ID}.first.assignedToId}}`,
            status: 'TODO',
          },
        },
        outputSchema: {},
        errorHandlingOptions: DEFAULT_ERROR_HANDLING_OPTIONS,
      },
    },
  ],
});

export const buildTradeCrmOpportunityQuotation3dFollowUpWorkflowSeed = ({
  opportunityIdFieldMetadataId,
  opportunityStageFieldMetadataId,
  quotationSentStageValue,
}: {
  opportunityIdFieldMetadataId: string;
  opportunityStageFieldMetadataId: string;
  quotationSentStageValue: string;
}): TradeCrmAutomationWorkflowSeed => ({
  name: 'Trade CRM - Opportunity Quotation 3d Follow-up',
  status: WorkflowStatus.ACTIVE,
  trigger: {
    name: 'Opportunity Updated',
    type: WorkflowTriggerType.DATABASE_EVENT,
    settings: {
      eventName: 'opportunity.updated',
      outputSchema: {},
    },
    nextStepIds: [OPPORTUNITY_QUOTATION_DELAY_STEP_ID],
    position: { x: 80, y: 120 },
  },
  steps: [
    {
      id: OPPORTUNITY_QUOTATION_DELAY_STEP_ID,
      name: 'Wait 3 Days',
      type: WorkflowActionType.DELAY,
      valid: true,
      nextStepIds: [OPPORTUNITY_QUOTATION_FIND_STEP_ID],
      position: { x: 360, y: 120 },
      settings: {
        input: {
          delayType: 'DURATION',
          duration: {
            days: 3,
          },
        },
        outputSchema: {},
        errorHandlingOptions: DEFAULT_ERROR_HANDLING_OPTIONS,
      },
    },
    {
      id: OPPORTUNITY_QUOTATION_FIND_STEP_ID,
      name: 'Find Opportunity Still In Quotation',
      type: WorkflowActionType.FIND_RECORDS,
      valid: true,
      nextStepIds: [OPPORTUNITY_QUOTATION_DECISION_STEP_ID],
      position: { x: 650, y: 120 },
      settings: {
        input: {
          objectName: 'opportunity',
          limit: 1,
          filter: {
            recordFilterGroups: [
              {
                id: OPPORTUNITY_QUOTATION_FILTER_GROUP_ID,
                logicalOperator: 'AND',
              },
            ],
            recordFilters: [
              {
                id: '7e4783cb-6d33-4b3f-82d9-c6c520f9cb35',
                fieldMetadataId: opportunityIdFieldMetadataId,
                type: 'UUID',
                value: '["{{trigger.properties.after.id}}"]',
                operand: 'IS',
                recordFilterGroupId: OPPORTUNITY_QUOTATION_FILTER_GROUP_ID,
              },
              {
                id: '4bc2436f-7820-4814-a624-d0d9bfd0f3a7',
                fieldMetadataId: opportunityStageFieldMetadataId,
                type: 'SELECT',
                value: quotationSentStageValue,
                operand: 'IS',
                recordFilterGroupId: OPPORTUNITY_QUOTATION_FILTER_GROUP_ID,
              },
            ],
          },
        },
        outputSchema: {},
        errorHandlingOptions: DEFAULT_ERROR_HANDLING_OPTIONS,
      },
    },
    {
      id: OPPORTUNITY_QUOTATION_DECISION_STEP_ID,
      name: 'Still Needs Quotation Follow-up?',
      type: WorkflowActionType.IF_ELSE,
      valid: true,
      nextStepIds: [],
      position: { x: 950, y: 120 },
      settings: {
        input: {
          stepFilterGroups: [
            {
              id: OPPORTUNITY_QUOTATION_IF_FILTER_GROUP_ID,
              logicalOperator: 'AND',
            },
          ],
          stepFilters: [
            {
              id: '5f17eb89-f897-4d4d-8164-1cb8b54d3c3d',
              type: 'number',
              value: '1',
              operand: 'GREATER_THAN_OR_EQUAL',
              isFullRecord: false,
              stepOutputKey: `{{${OPPORTUNITY_QUOTATION_FIND_STEP_ID}.totalCount}}`,
              stepFilterGroupId: OPPORTUNITY_QUOTATION_IF_FILTER_GROUP_ID,
              positionInStepFilterGroup: 0,
            },
            {
              id: '03397e10-913d-4b91-b927-0a4d0183e725',
              type: 'string',
              value: '{{trigger.properties.after.lastActivityDate}}',
              operand: 'IS',
              isFullRecord: false,
              stepOutputKey: `{{${OPPORTUNITY_QUOTATION_FIND_STEP_ID}.first.lastActivityDate}}`,
              stepFilterGroupId: OPPORTUNITY_QUOTATION_IF_FILTER_GROUP_ID,
              positionInStepFilterGroup: 1,
            },
          ],
          branches: [
            {
              id: OPPORTUNITY_QUOTATION_IF_BRANCH_ID,
              filterGroupId: OPPORTUNITY_QUOTATION_IF_FILTER_GROUP_ID,
              nextStepIds: [OPPORTUNITY_QUOTATION_CREATE_TASK_STEP_ID],
            },
            {
              id: OPPORTUNITY_QUOTATION_ELSE_BRANCH_ID,
              nextStepIds: [],
            },
          ],
        },
        outputSchema: {},
        errorHandlingOptions: DEFAULT_ERROR_HANDLING_OPTIONS,
      },
    },
    {
      id: OPPORTUNITY_QUOTATION_CREATE_TASK_STEP_ID,
      name: 'Create Quotation Follow-up Task',
      type: WorkflowActionType.CREATE_RECORD,
      valid: true,
      nextStepIds: [],
      position: { x: 1250, y: 120 },
      settings: {
        input: {
          objectName: 'task',
          objectRecord: {
            title:
              'Quotation follow-up: {{trigger.properties.after.name}}',
            status: 'TODO',
          },
        },
        outputSchema: {},
        errorHandlingOptions: DEFAULT_ERROR_HANDLING_OPTIONS,
      },
    },
  ],
});

export const buildTradeCrmOpportunity7dStalledMarkerWorkflowSeed = ({
  opportunityIdFieldMetadataId,
  stalledStageValue,
}: {
  opportunityIdFieldMetadataId: string;
  stalledStageValue: string;
}): TradeCrmAutomationWorkflowSeed => ({
  name: 'Trade CRM - Opportunity 7d Stalled Marker',
  status: WorkflowStatus.ACTIVE,
  trigger: {
    name: 'Opportunity Updated',
    type: WorkflowTriggerType.DATABASE_EVENT,
    settings: {
      eventName: 'opportunity.updated',
      outputSchema: {},
    },
    nextStepIds: [OPPORTUNITY_STALLED_DELAY_STEP_ID],
    position: { x: 80, y: 120 },
  },
  steps: [
    {
      id: OPPORTUNITY_STALLED_DELAY_STEP_ID,
      name: 'Wait 7 Days',
      type: WorkflowActionType.DELAY,
      valid: true,
      nextStepIds: [OPPORTUNITY_STALLED_FIND_STEP_ID],
      position: { x: 360, y: 120 },
      settings: {
        input: {
          delayType: 'DURATION',
          duration: {
            days: 7,
          },
        },
        outputSchema: {},
        errorHandlingOptions: DEFAULT_ERROR_HANDLING_OPTIONS,
      },
    },
    {
      id: OPPORTUNITY_STALLED_FIND_STEP_ID,
      name: 'Find Opportunity For Stalled Check',
      type: WorkflowActionType.FIND_RECORDS,
      valid: true,
      nextStepIds: [OPPORTUNITY_STALLED_DECISION_STEP_ID],
      position: { x: 650, y: 120 },
      settings: {
        input: {
          objectName: 'opportunity',
          limit: 1,
          filter: {
            recordFilterGroups: [
              {
                id: OPPORTUNITY_STALLED_FILTER_GROUP_ID,
                logicalOperator: 'AND',
              },
            ],
            recordFilters: [
              {
                id: '50e86286-6d1d-4cf2-bb95-95c2f3465997',
                fieldMetadataId: opportunityIdFieldMetadataId,
                type: 'UUID',
                value: '["{{trigger.properties.after.id}}"]',
                operand: 'IS',
                recordFilterGroupId: OPPORTUNITY_STALLED_FILTER_GROUP_ID,
              },
            ],
          },
        },
        outputSchema: {},
        errorHandlingOptions: DEFAULT_ERROR_HANDLING_OPTIONS,
      },
    },
    {
      id: OPPORTUNITY_STALLED_DECISION_STEP_ID,
      name: 'Opportunity Still Stalled?',
      type: WorkflowActionType.IF_ELSE,
      valid: true,
      nextStepIds: [],
      position: { x: 950, y: 120 },
      settings: {
        input: {
          stepFilterGroups: [
            {
              id: OPPORTUNITY_STALLED_IF_FILTER_GROUP_ID,
              logicalOperator: 'AND',
            },
          ],
          stepFilters: [
            {
              id: '674aa465-030a-41be-a1c1-82c8d6f1f234',
              type: 'number',
              value: '1',
              operand: 'GREATER_THAN_OR_EQUAL',
              isFullRecord: false,
              stepOutputKey: `{{${OPPORTUNITY_STALLED_FIND_STEP_ID}.totalCount}}`,
              stepFilterGroupId: OPPORTUNITY_STALLED_IF_FILTER_GROUP_ID,
              positionInStepFilterGroup: 0,
            },
            {
              id: 'a23c3011-9d80-45eb-baa7-05866c21f7b0',
              type: 'string',
              value: '{{trigger.properties.after.lastActivityDate}}',
              operand: 'IS',
              isFullRecord: false,
              stepOutputKey: `{{${OPPORTUNITY_STALLED_FIND_STEP_ID}.first.lastActivityDate}}`,
              stepFilterGroupId: OPPORTUNITY_STALLED_IF_FILTER_GROUP_ID,
              positionInStepFilterGroup: 1,
            },
            {
              id: '2d3fb4a6-b9aa-4df0-bf05-a4ec703b3954',
              type: 'string',
              value: 'WON',
              operand: 'IS_NOT',
              isFullRecord: false,
              stepOutputKey: `{{${OPPORTUNITY_STALLED_FIND_STEP_ID}.first.stage}}`,
              stepFilterGroupId: OPPORTUNITY_STALLED_IF_FILTER_GROUP_ID,
              positionInStepFilterGroup: 2,
            },
            {
              id: 'c216cf7f-5f8d-43dd-a001-e56ea8d5c4c9',
              type: 'string',
              value: 'LOST',
              operand: 'IS_NOT',
              isFullRecord: false,
              stepOutputKey: `{{${OPPORTUNITY_STALLED_FIND_STEP_ID}.first.stage}}`,
              stepFilterGroupId: OPPORTUNITY_STALLED_IF_FILTER_GROUP_ID,
              positionInStepFilterGroup: 3,
            },
            {
              id: '0b152f7f-dddd-49c1-9de4-67b48f26d678',
              type: 'string',
              value: stalledStageValue,
              operand: 'IS_NOT',
              isFullRecord: false,
              stepOutputKey: `{{${OPPORTUNITY_STALLED_FIND_STEP_ID}.first.stage}}`,
              stepFilterGroupId: OPPORTUNITY_STALLED_IF_FILTER_GROUP_ID,
              positionInStepFilterGroup: 4,
            },
          ],
          branches: [
            {
              id: OPPORTUNITY_STALLED_IF_BRANCH_ID,
              filterGroupId: OPPORTUNITY_STALLED_IF_FILTER_GROUP_ID,
              nextStepIds: [OPPORTUNITY_STALLED_UPDATE_STEP_ID],
            },
            {
              id: OPPORTUNITY_STALLED_ELSE_BRANCH_ID,
              nextStepIds: [],
            },
          ],
        },
        outputSchema: {},
        errorHandlingOptions: DEFAULT_ERROR_HANDLING_OPTIONS,
      },
    },
    {
      id: OPPORTUNITY_STALLED_UPDATE_STEP_ID,
      name: 'Mark Opportunity As Stalled',
      type: WorkflowActionType.UPDATE_RECORD,
      valid: true,
      nextStepIds: [],
      position: { x: 1250, y: 120 },
      settings: {
        input: {
          objectName: 'opportunity',
          objectRecordId: '{{trigger.properties.after.id}}',
          objectRecord: {
            stage: stalledStageValue,
          },
          fieldsToUpdate: ['stage'],
        },
        outputSchema: {},
        errorHandlingOptions: DEFAULT_ERROR_HANDLING_OPTIONS,
      },
    },
  ],
});
