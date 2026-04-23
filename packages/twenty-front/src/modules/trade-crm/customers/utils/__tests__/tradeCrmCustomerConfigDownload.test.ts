jest.mock('@/trade-crm/customers/utils/tradeCrmCustomerConfigSnapshot', () => ({
  buildCustomerConfigSnapshotExport: jest.fn(() => ({
    kind: 'snapshot-export',
  })),
  buildCustomerConfigSnapshotPreviewReport: jest.fn(() => ({
    kind: 'snapshot-preview-report',
  })),
}));

import {
  buildCustomerConfigSnapshotExport,
  buildCustomerConfigSnapshotPreviewReport,
} from '@/trade-crm/customers/utils/tradeCrmCustomerConfigSnapshot';
import {
  downloadTradeCrmCustomerConfigSnapshot,
  downloadTradeCrmCustomerConfigSnapshotPreviewReport,
} from '@/trade-crm/customers/utils/tradeCrmCustomerConfigDownload';

describe('tradeCrmCustomerConfigDownload', () => {
  const createObjectURL = jest.fn(() => 'blob:customer-config');
  const revokeObjectURL = jest.fn();
  let clickSpy: jest.SpyInstance<void, [], HTMLAnchorElement>;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-23T12:34:56.000Z'));
    jest.clearAllMocks();

    Object.defineProperty(window, 'URL', {
      configurable: true,
      value: {
        createObjectURL,
        revokeObjectURL,
      },
    });
    clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should download a config snapshot export file', () => {
    const configDraft = {} as Parameters<
      typeof downloadTradeCrmCustomerConfigSnapshot
    >[0]['configDraft'];

    downloadTradeCrmCustomerConfigSnapshot({
      activeSection: 'sources',
      configDraft,
    });

    expect(buildCustomerConfigSnapshotExport).toHaveBeenCalledWith({
      activeSection: 'sources',
      configDraft,
      exportedAt: '2026-04-23T12:34:56.000Z',
    });
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:customer-config');
  });

  it('should download a snapshot preview report file', () => {
    const snapshotPreview = { summary: 'preview' } as never;

    downloadTradeCrmCustomerConfigSnapshotPreviewReport({
      applyNotice: null,
      selectedSectionKeys: ['sources'],
      snapshotPreview,
      warningsAcknowledged: true,
    });

    expect(buildCustomerConfigSnapshotPreviewReport).toHaveBeenCalledWith({
      applyNotice: null,
      exportedAt: '2026-04-23T12:34:56.000Z',
      selectedSectionKeys: ['sources'],
      snapshotPreview,
      warningsAcknowledged: true,
    });
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:customer-config');
  });
});
