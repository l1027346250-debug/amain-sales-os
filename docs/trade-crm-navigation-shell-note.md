# Trade CRM Navigation Shell Note

## Summary

This round adds the first executable Trade CRM business shell inside the
current Twenty frontend. The goal is not to replace Twenty object navigation,
but to layer a Xiaoman-informed business workspace on top of the existing CRM
core.

## Delivered

- A dedicated `trade-crm` frontend module with:
  - business navigation config
  - route map
  - manager visibility rules
  - shared workspace layouts
  - business workspace entry pages
- New business routes for:
  - Workbench
  - Prospecting
  - Mail
  - Customers
  - Opportunities
  - Collaboration
  - Team Analytics
- A dedicated `Trade CRM` settings page inside the current settings shell.
- An upgraded AI floating entry that recognizes the new Trade CRM routes and
  loads route-aware prompt suggestions.
- A hierarchical navigation model for `trade-crm`:
  - level 1 = stable business domains
  - level 2 = domain workspaces and operating queues
  - level 3 = page-local tabs, filters, and queue switches
- `Trade CRM / Customers` now consumes `?view=` query scopes and renders a
  queue-style customer workspace instead of a static concept page.
- `Trade CRM / Opportunities` now also consumes `?view=` query scopes and
  switches among pipeline board, my opportunities, quotation follow-up,
  stalled, and lost analysis workspaces.
- `Trade CRM / Team Data` now also consumes `?view=` query scopes and switches
  among execution overview, lead conversion, mail efficiency, pipeline funnel,
  team performance, and source impact workspaces.
- `Trade CRM / Prospecting` now also consumes `?view=` query scopes and
  switches among lead pool, today new leads, first-response risk, channel
  intake, and assignment review workspaces.
- `Trade CRM / Mail` now also consumes `?view=` query scopes and switches
  among inbox, pending replies, sent, templates, sequences, and tracking
  workspaces.
- `Trade CRM / Workbench` now also consumes `?view=` query scopes and switches
  among my tasks, first response, follow-up, overdue, and manager board
  workspaces.
- `Trade CRM / Collaboration` now also consumes `?view=` query scopes and
  switches among tasks, calendar, and approvals workspaces.
- `Trade CRM / Settings` now also consumes `?view=` query scopes and switches
  among fields and dictionaries, stages and status, assignment rules, sources
  and dedup, automation rules, AI config, and integrations workspaces.

## Current Navigation Structure

The executable shell now follows the Xiaoman-inspired information architecture
without copying the original menu breadth one-to-one.

### Level 1

- `工作台`
- `获客`
- `邮件`
- `客户`
- `商机`
- `协同`
- `团队数据`
- `设置`

### Level 2

The active level-1 menu expands into scoped level-2 entries:

- `工作台`: `我的待办` / `待首响` / `待跟进` / `超时提醒` / `主管看板`
- `获客`: `线索池` / `渠道线索` / `AI 开发线索` / `沟通轨迹` / `分配与回收`
- `邮件`: `收件箱` / `待回复` / `已发送` / `模板` / `序列` / `追踪分析`
- `客户`: `客户列表` / `公海客户` / `联系人` / `客户分层` / `客户 360`
- `商机`: `商机看板` / `我的商机` / `报价跟进` / `Stalled 商机` / `输单分析`
- `协同`: `任务` / `日程` / `审批`
- `团队数据`: `目标完成` / `线索转化` / `邮件效率` / `销售漏斗` / `成员表现` /
  `来源效果`
- `设置`: `字段与字典` / `阶段与状态` / `分配规则` / `来源与去重` /
  `自动化规则` / `AI 配置` / `集成配置`

## Boundary Notes

- This round keeps Twenty as the CRM core.
- It does not move integration logic into the frontend.
- It does not let AI directly change CRM key states.
- It does not replace the standard record pages with a full Customer 360 or
  Opportunity 360 yet.

## Next Iteration Focus

- `Trade CRM / Workbench` now reuses the live seller workbench instead of a
  static shell page.
- The new level-2 menu URLs currently use lightweight `?view=` query scopes so
  the menu system is executable before every child workspace gets its own page.
- `Trade CRM / Customers` is the first page that actively consumes those
  query-scoped menus to switch tabs, left-rail focus, and operating cards.
- `Trade CRM / Opportunities` is the second page that consumes those
  query-scoped menus, using stage-first columns and queue links instead of a
  fixed static board.
- `Trade CRM / Team Data` is the third page that consumes those query-scoped
  menus, reusing live manager signals instead of introducing a separate BI
  system.
- `Trade CRM / Team Data` now also surfaces integration-hub quote follow-up
  and stalled reminder signals in both execution-overview and pipeline-funnel
  views so managers can move directly from metric cards into action queues.
- `Trade CRM / Prospecting` is the fourth page that consumes those
  query-scoped menus, keeping acquisition work in queue form instead of adding
  disconnected intake pages.
- `Trade CRM / Mail` is the fifth page that consumes those query-scoped menus,
  while still routing real work to email accounts, domains, tasks, customers,
  and opportunities instead of faking a standalone mailbox product.
- `Trade CRM / Workbench` is the sixth page that consumes those query-scoped
  menus, keeping the seller and manager entry point action-first instead of
  fixed to one default queue snapshot.
- `Trade CRM / Collaboration` is the seventh page that consumes those
  query-scoped menus, while still keeping collaboration scoped to task,
  calendar rhythm, and lightweight handoff instead of OA expansion.
- `Trade CRM / Settings` is the eighth page that consumes those query-scoped
  menus, while still routing real configuration work to the existing Twenty
  settings modules instead of building a second admin system.
- `Trade CRM / Settings > Automation Rules` now links back to Team Data
  execution-overview and pipeline-funnel so rule governance and runtime
  reminder signals stay in one management loop.
- `Trade CRM / Prospecting` now points to live lead views and shows queue
  status based on current CRM and integration-hub data.
- `Trade CRM / Prospecting` now also exposes direct record-shell handoff
  links when real lead records exist, so qualification work can continue
  inside the actual lead detail page instead of stopping at queue entry.
- `Trade CRM / Prospecting` now also carries live lead context into the
  workspace AI and queue shell when a real lead record exists, so queue work
  and detail-page execution stay anchored to the same CRM record.
- `Trade CRM / Customers` now points to live company and contact lists and
  shows basic CRM coverage status instead of staying a static concept page.
- `Trade CRM / Customers` now also exposes direct record-shell handoff links
  when real company, people, or opportunity records exist, so the workspace
  can move into actual CRM detail pages instead of stopping at list entry.
- `Trade CRM / Opportunities` now points to live opportunity records and the
  pipeline hygiene queue instead of staying a static stage-board concept page.
- `Trade CRM / Opportunities` now also exposes direct record-shell handoff
  links when real opportunity records exist, so pipeline and quotation work
  can continue inside the actual opportunity detail page.
- `Trade CRM / Mail` now routes to real email account settings, domain
  settings, follow-up tasks, and CRM-linked workspaces instead of presenting a
  fake inbox.
- Company, person, and opportunity `RecordShowPage` views now get a lightweight
  Trade CRM operating shell above the standard record layout, using existing
  record data rather than a second detail page system.
- The Trade CRM record shell now also renders object-specific operating
  checklists so lead, customer, contact, and opportunity detail pages expose
  immediate execution gaps instead of only summary cards.
- The Trade CRM record shell now also exposes quick-action links so detail
  pages can hand users directly into the next workspace or related CRM record
  instead of stopping at passive inspection.
- The Trade CRM record shell now also renders context-anchor rows so lead,
  customer, contact, and opportunity pages expose the current related account,
  contact, owner, and pipeline anchors without leaving the detail page.
- The next focused step is still customer and opportunity operating context,
  but only after the main seller entry paths are stable.
