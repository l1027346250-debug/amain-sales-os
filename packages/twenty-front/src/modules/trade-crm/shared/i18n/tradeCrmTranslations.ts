const exactChineseTranslations: Record<string, string> = {
  'Trade CRM': '\u5916\u8d38 CRM',
  Workbench: '\u5de5\u4f5c\u53f0',
  Prospecting: '\u83b7\u5ba2',
  Mail: '\u90ae\u4ef6',
  Customers: '\u5ba2\u6237',
  Opportunities: '\u5546\u673a',
  Collaboration: '\u534f\u540c',
  'Team Data': '\u56e2\u961f\u6570\u636e',
  Settings: '\u8bbe\u7f6e',
  'Trade CRM Settings': '\u5916\u8d38 CRM \u8bbe\u7f6e',
  'My Tasks': '\u6211\u7684\u4efb\u52a1',
  'First Response': '\u9996\u54cd\u8ddf\u8fdb',
  'Follow-up': '\u8ddf\u8fdb\u6267\u884c',
  'Overdue Alerts': '\u8d85\u65f6\u63d0\u9192',
  'Manager Board': '\u4e3b\u7ba1\u770b\u677f',
  'Lead Pool': '\u7ebf\u7d22\u6c60',
  'Today New Leads': '\u4eca\u65e5\u65b0\u589e\u7ebf\u7d22',
  'First Response Risk': '\u9996\u54cd\u98ce\u9669',
  'Channel Intake': '\u6e20\u9053\u5bfc\u5165',
  'Assignment Review': '\u5206\u914d\u590d\u6838',
  Inbox: '\u6536\u4ef6\u7bb1',
  'Pending Replies': '\u5f85\u56de\u590d',
  Sent: '\u5df2\u53d1\u9001',
  Templates: '\u6a21\u677f',
  Sequences: '\u5e8f\u5217',
  Tracking: '\u8ffd\u8e2a\u5206\u6790',
  'Customer List': '\u5ba2\u6237\u5217\u8868',
  Contacts: '\u8054\u7cfb\u4eba',
  Segmentation: '\u5ba2\u6237\u5206\u5c42',
  'Public Pool': '\u516c\u6d77/\u79c1\u6d77',
  'Customer 360': '\u5ba2\u6237 360',
  'Pipeline Board': '\u5546\u673a\u770b\u677f',
  'My Opportunities': '\u6211\u7684\u5546\u673a',
  'Quotation Follow-up': '\u62a5\u4ef7\u8ddf\u8fdb',
  Stalled: '\u505c\u6ede\u5546\u673a',
  'Lost Analysis': '\u8f93\u5355\u5206\u6790',
  Tasks: '\u4efb\u52a1',
  Calendar: '\u65e5\u7a0b',
  Approvals: '\u5ba1\u6279',
  'Execution Overview': '\u6267\u884c\u603b\u89c8',
  'Lead Conversion': '\u7ebf\u7d22\u8f6c\u5316',
  'Mail Efficiency': '\u90ae\u4ef6\u6548\u7387',
  'Pipeline Funnel': '\u9500\u552e\u6f0f\u6597',
  'Team Performance': '\u56e2\u961f\u8868\u73b0',
  'Source Impact': '\u6765\u6e90\u6548\u679c',
  'Fields & Dictionaries': '\u5b57\u6bb5\u4e0e\u5b57\u5178',
  'Stages & Status': '\u9636\u6bb5\u4e0e\u72b6\u6001',
  'Assignment Rules': '\u5206\u914d\u89c4\u5219',
  'Sources & Dedup': '\u6765\u6e90\u4e0e\u53bb\u91cd',
  'Automation Rules': '\u81ea\u52a8\u5316\u89c4\u5219',
  'AI Config': 'AI \u914d\u7f6e',
  Integrations: '\u96c6\u6210\u914d\u7f6e',
  'Generate workspace brief': '\u751f\u6210\u5de5\u4f5c\u533a\u6458\u8981',
  'Summarize current context': '\u603b\u7ed3\u5f53\u524d\u4e0a\u4e0b\u6587',
  'Recommend next action': '\u5efa\u8bae\u4e0b\u4e00\u6b65\u52a8\u4f5c',
  'Draft follow-up': '\u751f\u6210\u8ddf\u8fdb\u8349\u7a3f',
  'Loading AI context...': '\u6b63\u5728\u52a0\u8f7d AI \u4e0a\u4e0b\u6587...',
  'Generating output...': '\u6b63\u5728\u751f\u6210\u5185\u5bb9...',
  Summary: '\u6458\u8981',
  Draft: '\u8349\u7a3f',
  'Next actions': '\u4e0b\u4e00\u6b65\u52a8\u4f5c',
  'Open AI assistant': '\u6253\u5f00 AI \u52a9\u624b',
  AI: 'AI',
  'Operating intent': '\u64cd\u4f5c\u610f\u56fe',
  'Open queue': '\u6253\u5f00\u961f\u5217',
  'Open detail': '\u6253\u5f00\u8be6\u60c5',
  Open: '\u6253\u5f00',
  'Daily operating intent': '\u6bcf\u65e5\u6267\u884c\u91cd\u70b9',
  'Mail guardrails and discipline': '\u90ae\u4ef6\u8fb9\u754c\u4e0e\u6267\u884c\u89c4\u5219',
  'Collaboration boundary': '\u534f\u540c\u8fb9\u754c',
  'Workbench views': '\u5de5\u4f5c\u53f0\u89c6\u56fe',
  'Prospecting workspace': '\u83b7\u5ba2\u5de5\u4f5c\u533a',
  'Mail workspace': '\u90ae\u4ef6\u5de5\u4f5c\u533a',
  'Customer Workspace': '\u5ba2\u6237\u5de5\u4f5c\u533a',
  'Collaboration workspace': '\u534f\u540c\u5de5\u4f5c\u533a',
  'Lead execution rules': '\u7ebf\u7d22\u6267\u884c\u89c4\u5219',
  'AI is suggestion-only. State changes still require manual confirmation.':
    'AI \u4ec5\u63d0\u4f9b\u5efa\u8bae\uff0c\u4e1a\u52a1\u4e3b\u72b6\u6001\u4ecd\u9700\u4eba\u5de5\u786e\u8ba4\u3002',
  'AI suggestions require integration-hub API configuration before live context can be loaded.':
    'AI \u5efa\u8bae\u4f9d\u8d56 integration-hub API \u914d\u7f6e\uff0c\u914d\u7f6e\u5b8c\u6210\u540e\u624d\u80fd\u52a0\u8f7d\u5b9e\u65f6\u4e0a\u4e0b\u6587\u3002',
  Chinese: '\u4e2d\u6587',
  English: 'English',
  'Keep the main column action-heavy, use the left rail to stay in the right queue, and let the right rail explain risk and next action.':
    '\u4e2d\u95f4\u4e3b\u5217\u627f\u8f7d\u4e3b\u8981\u52a8\u4f5c\uff0c\u5de6\u4fa7\u7528\u4e8e\u4fdd\u6301\u961f\u5217\u805a\u7126\uff0c\u53f3\u4fa7\u7528\u4e8e\u89e3\u91ca\u98ce\u9669\u4e0e\u4e0b\u4e00\u6b65\u3002',
  'The workbench should reduce decision overhead and tell sellers or managers which queue needs movement first.':
    '\u5de5\u4f5c\u53f0\u5e94\u964d\u4f4e\u5224\u65ad\u6210\u672c\uff0c\u76f4\u63a5\u544a\u8bc9\u9500\u552e\u6216\u4e3b\u7ba1\u5f53\u524d\u6700\u8be5\u63a8\u8fdb\u54ea\u4e2a\u961f\u5217\u3002',
  'This workspace should answer what came in, who owns it, which leads are at response risk, and where supervisors need to intervene.':
    '\u8fd9\u4e2a\u5de5\u4f5c\u533a\u5e94\u56de\u7b54\u56db\u4e2a\u95ee\u9898\uff1a\u8fdb\u6765\u4e86\u4ec0\u4e48\u3001\u8c01\u8d1f\u8d23\u3001\u54ea\u4e9b\u7ebf\u7d22\u6709\u9996\u54cd\u98ce\u9669\u3001\u4e3b\u7ba1\u5e94\u5728\u54ea\u4e9b\u70b9\u4ecb\u5165\u3002',
  'The mail workspace remains bounded by CRM linkage, human confirmation, and AI assistance. It does not become a detached mailbox product in phase one.':
    '\u90ae\u4ef6\u5de5\u4f5c\u533a\u53d7 CRM \u5173\u8054\u3001\u4eba\u5de5\u786e\u8ba4\u548c AI \u8f85\u52a9\u4e09\u6761\u8fb9\u754c\u7ea6\u675f\uff0c\u4e00\u671f\u4e0d\u4f1a\u6f14\u53d8\u6210\u72ec\u7acb\u90ae\u7bb1\u4ea7\u54c1\u3002',
  'The collaboration module stays narrow. It serves CRM execution and handoff instead of expanding into a general office platform.':
    '\u534f\u540c\u6a21\u5757\u4fdd\u6301\u8f7b\u91cf\uff0c\u53ea\u670d\u52a1 CRM \u6267\u884c\u4e0e\u4ea4\u63a5\uff0c\u4e0d\u6269\u5f20\u6210\u901a\u7528\u529e\u516c\u5e73\u53f0\u3002',
};

const translateDynamicTextToChinese = (text: string) => {
  const exactMatch = exactChineseTranslations[text];

  if (exactMatch) {
    return exactMatch;
  }

  const dynamicRules: Array<[RegExp, (...matches: string[]) => string]> = [
    [/^(.+) workspace$/u, (_match, value) => `${translateTradeCrmText(value, true)} \u5de5\u4f5c\u533a`],
    [/^(.+) pipeline$/u, (_match, value) => `${translateTradeCrmText(value, true)} \u6f0f\u6597`],
    [/^(.+) operating center$/u, (_match, value) => `${translateTradeCrmText(value, true)} \u8fd0\u8425\u4e2d\u5fc3`],
    [/^(.+) control layer$/u, (_match, value) => `${translateTradeCrmText(value, true)} \u63a7\u5236\u5c42`],
    [/^Current (.+)$/u, (_match, value) => `\u5f53\u524d ${translateTradeCrmText(value, true)}`],
    [/^Top priority (.+)$/u, (_match, value) => `\u6700\u9ad8\u4f18\u5148\u7ea7 ${translateTradeCrmText(value, true)}`],
    [/^Open attention (\d+)$/u, (_match, count) => `\u5f85\u5904\u7406 ${count}`],
    [/^(\d+) companies$/u, (_match, count) => `${count} \u4e2a\u516c\u53f8`],
    [/^(\d+) contacts$/u, (_match, count) => `${count} \u4e2a\u8054\u7cfb\u4eba`],
    [/^(\d+) opportunities$/u, (_match, count) => `${count} \u4e2a\u5546\u673a`],
    [/^(\d+) tasks$/u, (_match, count) => `${count} \u4e2a\u4efb\u52a1`],
    [/^(\d+) need action$/u, (_match, count) => `${count} \u4e2a\u5f85\u8865\u52a8\u4f5c`],
    [/^(\d+) quote follow-up$/u, (_match, count) => `${count} \u4e2a\u62a5\u4ef7\u8ddf\u8fdb`],
    [/^(\d+) stalled$/u, (_match, count) => `${count} \u4e2a\u505c\u6ede\u5546\u673a`],
    [/^Today new leads (\d+)$/u, (_match, count) => `\u4eca\u65e5\u65b0\u589e\u7ebf\u7d22 ${count}`],
    [/^First-response risk (\d+)$/u, (_match, count) => `\u9996\u54cd\u98ce\u9669 ${count}`],
    [/^Lead pool available$/u, () => '\u7ebf\u7d22\u6c60\u5df2\u5c31\u7eea'],
    [/^Lead pool not ready$/u, () => '\u7ebf\u7d22\u6c60\u672a\u5c31\u7eea'],
    [/^integration-hub connected$/u, () => 'integration-hub \u5df2\u8fde\u63a5'],
    [/^integration-hub not configured$/u, () => 'integration-hub \u672a\u914d\u7f6e'],
    [/^AI fallback mode: (.+)$/u, (_match, value) => `AI \u964d\u7ea7\u6a21\u5f0f\uff1a${value}`],
    [/^Lead score (.+) \/ (.+)$/u, (_match, level, score) => `\u7ebf\u7d22\u8bc4\u5206 ${level} / ${score}`],
    [/^Focus: (.+)$/u, (_match, value) => `\u91cd\u70b9\uff1a${value}`],
    [/^Workspace: (.+)$/u, (_match, value) => `\u5de5\u4f5c\u533a\uff1a${translateTradeCrmText(value, true)}`],
    [/^Current view: (.+)$/u, (_match, value) => `\u5f53\u524d\u89c6\u56fe\uff1a${translateTradeCrmText(value, true)}`],
    [/^Current mode: (.+)$/u, (_match, value) => `\u5f53\u524d\u6a21\u5f0f\uff1a${translateTradeCrmText(value, true)}`],
    [/^Priority: (.+)$/u, (_match, value) => `\u4f18\u5148\u7ea7\uff1a${translateTradeCrmText(value, true)}`],
  ];

  for (const [pattern, resolver] of dynamicRules) {
    const match = text.match(pattern);

    if (match) {
      return resolver(...match);
    }
  }

  return text;
};

export const translateTradeCrmText = (
  text: string,
  isChinese: boolean,
): string => {
  if (!isChinese || text.trim().length === 0) {
    return text;
  }

  return translateDynamicTextToChinese(text);
};
