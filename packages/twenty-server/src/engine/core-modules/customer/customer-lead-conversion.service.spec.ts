import { CustomerLeadConversionService } from 'src/engine/core-modules/customer/customer-lead-conversion.service';

const executeInWorkspaceContextMock = jest.fn();
const getRepositoryMock = jest.fn();
const findOneWithinWorkspaceMock = jest.fn();

const createQueryBuilderMock = (getOne: jest.Mock) => ({
  andWhere: jest.fn().mockReturnThis(),
  getOne,
  orderBy: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
});

describe('CustomerLeadConversionService', () => {
  const workspaceId = 'workspace-id';
  const workspaceMemberId = 'member-id';
  const leadId = 'lead-id';

  const createService = () =>
    new CustomerLeadConversionService(
      {
        executeInWorkspaceContext: executeInWorkspaceContextMock.mockImplementation(
          async (callback: () => Promise<unknown>) => callback(),
        ),
        getRepository: getRepositoryMock,
      } as never,
      {
        findOneWithinWorkspace: findOneWithinWorkspaceMock,
      } as never,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    findOneWithinWorkspaceMock.mockResolvedValue({});
  });

  it('should reuse the existing customer and contact when the lead was already converted', async () => {
    const leadRepository = {
      findOne: jest.fn().mockResolvedValue({
        assignedToId: 'owner-1',
        id: leadId,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const companyRepository = {
      findOne: jest.fn().mockResolvedValue({
        accountOwnerId: 'owner-1',
        id: 'customer-1',
      }),
      insert: jest.fn(),
    };
    const timelineRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(
        createQueryBuilderMock(
          jest.fn().mockResolvedValue({
            properties: {
              contactId: 'contact-1',
              customerId: 'customer-1',
              leadId,
            },
            targetCompanyId: 'customer-1',
          }),
        ),
      ),
      insert: jest.fn(),
    };

    getRepositoryMock.mockImplementation(
      async (_currentWorkspaceId: string, objectNameSingular: string) => {
        if (objectNameSingular === 'lead') {
          return leadRepository;
        }

        if (objectNameSingular === 'company') {
          return companyRepository;
        }

        if (objectNameSingular === 'timelineActivity') {
          return timelineRepository;
        }

        throw new Error(`Unexpected repository ${objectNameSingular}`);
      },
    );

    const service = createService();

    const result = await service.convertLeadToCustomer({
      input: { leadId },
      workspaceId,
      workspaceMemberId,
    });

    expect(result).toEqual({
      alreadyConverted: true,
      contactId: 'contact-1',
      contactReused: true,
      customerId: 'customer-1',
      customerReused: true,
      leadId,
      ownerId: 'owner-1',
    });
    expect(leadRepository.update).toHaveBeenCalledTimes(1);
    expect(companyRepository.insert).not.toHaveBeenCalled();
    expect(timelineRepository.insert).not.toHaveBeenCalled();
  });

  it('should reuse an existing contact by email instead of inserting a new person', async () => {
    const leadRepository = {
      findOne: jest.fn().mockResolvedValue({
        assignedToId: 'owner-2',
        contactName: 'Alice',
        email: 'alice@example.com',
        id: leadId,
        leadName: 'Example Trading',
        notes: 'Existing contact should be reused',
        phone: '123456',
        source: 'Manual Import',
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const companyRepository = {
      findOne: jest.fn(),
      insert: jest.fn(),
    };
    const personRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(
        createQueryBuilderMock(
          jest.fn().mockResolvedValue({
            companyId: 'customer-2',
            id: 'contact-2',
          }),
        ),
      ),
      insert: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const timelineRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(
        createQueryBuilderMock(jest.fn().mockResolvedValue(null)),
      ),
      insert: jest.fn().mockResolvedValue(undefined),
    };
    const operationLogRepository = {
      insert: jest.fn().mockResolvedValue(undefined),
    };

    getRepositoryMock.mockImplementation(
      async (_currentWorkspaceId: string, objectNameSingular: string) => {
        if (objectNameSingular === 'lead') {
          return leadRepository;
        }

        if (objectNameSingular === 'company') {
          return companyRepository;
        }

        if (objectNameSingular === 'person') {
          return personRepository;
        }

        if (objectNameSingular === 'timelineActivity') {
          return timelineRepository;
        }

        if (objectNameSingular === 'customerOperationLog') {
          return operationLogRepository;
        }

        throw new Error(`Unexpected repository ${objectNameSingular}`);
      },
    );

    const service = createService();

    const result = await service.convertLeadToCustomer({
      input: { leadId },
      workspaceId,
      workspaceMemberId,
    });

    expect(result).toEqual({
      alreadyConverted: false,
      contactId: 'contact-2',
      contactReused: true,
      customerId: 'customer-2',
      customerReused: true,
      leadId,
      ownerId: 'owner-2',
    });
    expect(companyRepository.insert).not.toHaveBeenCalled();
    expect(personRepository.insert).not.toHaveBeenCalled();
    expect(personRepository.update).toHaveBeenCalledWith(
      'contact-2',
      expect.objectContaining({
        companyId: 'customer-2',
      }),
    );
    expect(timelineRepository.insert).toHaveBeenCalledTimes(1);
    expect(operationLogRepository.insert).toHaveBeenCalledTimes(1);
  });
});
