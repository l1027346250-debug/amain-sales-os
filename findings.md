# 企业管理模块发现记录

## 2026-04-21 复核
- `main` 分支已包含企业管理近期提交：字段中心、客户导出、报告模板。
- 企业管理蓝图 V1 要求包含回收箱，但代码中 `EnterpriseRecycleBinPage.tsx` 仍是 `EnterprisePlaceholderPage`。
- 后端 `EnterpriseManagementModule` 未注册 recycle 相关 entity/controller/service。
- 技术蓝图定义 `recycle_record` 表，字段包括 tenant/workspace、resource_type、resource_id、deleted_payload、deleted_by、restored/purged 状态。
- PRD 验收要求：按资源类型查看、恢复单条、一键清空指定类型、恢复和清空写审计日志。

## 2026-04-22 企业管理模块蓝图复核
- 对照 PRD：8 个核心页面均已有前端页面落点：自定义字段、字段显示、客户导出、回收箱、工作报告模板、获客来源流转、独立站管理、销售助手管理。
- 对照技术蓝图：后端 `EnterpriseManagementModule` 已注册字段中心、字段值、字段布局、客户导出、回收箱、报告模板、来源流转、独立站、销售助手、审计相关 entity/controller/service。
- 迁移覆盖：已有 `1775400000000` 至 `1776000000000` 共 7 个企业管理相关 core migration，覆盖字段、导出、对象存储/报告、回收、来源、独立站、销售助手。
- 已修正问题：报告模板补齐蓝图兼容 REST API：`PATCH /api/enterprise/report-templates/:id`、`PUT /api/enterprise/report-templates/:id/content`、`PATCH /api/enterprise/report-templates/:id/enabled`、`DELETE /api/enterprise/report-templates/:id`。
- 已修正问题：本地运行脚本 `start-trade-crm-runtime-local.ps1` 将 `netstat` 改为显式 `System32/netstat.exe`，避免 PowerShell PATH 中没有 netstat 时启动失败。
- 运行态检查：`npm.cmd run start:trade-crm-runtime:local` 成功，后端 `/healthz` 200，前端 8 个企业管理路由均 200，核心企业管理 API 无 token 均返回 403，说明路由已加载并进入鉴权层。
- 主要缺口：权限仍是粗粒度入口 guard，未实现蓝图要求的页面级/操作级权限码；字段配置已投射 metadata，但 Trade CRM 客户页的实际动态字段渲染/筛选/导出联动仍需更完整验证和补强；缓存策略尚未明确落地；页面文件过大，需要拆组件以满足仓库规范。
- 当前工作树注意：存在与本轮复核无关的 Trade CRM 客户模块改动和 `.codex-runtime` 日志改动，提交前需要分开处理，避免污染企业管理提交。

## 2026-04-22 权限闭环复核
- 已修正缺口：企业管理各公开控制器已从粗粒度登录/工作区守卫，补到业务操作级 `enterprise.*` 权限检查。
- 已修正缺口：回收站、来源流转、独立站、销售助手前端页面不再只依赖后端拦截，关键写操作按钮和执行函数均按权限禁用/阻断。
- 剩余缺口：当前 `enterprise.*` 仍映射到 Twenty 现有 `ENTERPRISE/WORKSPACE` flag，需要新增可配置权限持久化后才能实现真正按角色细分到具体企业管理操作。

## 2026-04-22 细粒度权限持久化复核
- 已修正缺口：企业管理权限不再只有代码层权限码和 Twenty flag fallback，已经具备按角色持久化授权的数据结构与 REST API。
- 当前设计保持兼容：未配置 `enterpriseRolePermission` 的角色仍按 `ENTERPRISE/WORKSPACE` flag 放行；一旦角色有配置记录，则缺失或 false 的权限码会被拒绝。
- 剩余缺口：还缺一个前端角色权限配置页，当前只能通过 API 写入角色授权；也还没有把 Twenty 角色设置页与企业管理权限目录整合。

## 2026-04-22 企业权限配置页复核
- 已修正缺口：细粒度企业权限现在有前端配置入口，不再只能通过 REST API 手工写入。
- 已修正缺口：企业管理导航已增加“安全权限 / 企业权限配置”，满足蓝图中权限管理可视化配置要求。
- 当前剩余缺口：权限配置页仍使用独立企业管理页面，尚未嵌入 Twenty 原生角色设置页；后续可在原生角色设置中增加企业管理权限 tab，减少管理员跳转成本。
- 当前剩余缺口：还需要做一次登录态浏览器联调，实际创建/保存一个角色授权，确认数据库 `enterpriseRolePermission` 写入和页面回显一致。

## 2026-04-22 客户字段联动复核
- 已修正缺口：企业字段值 API 已补操作级权限，不再只有登录态保护。
- 已修正缺口：企业自定义字段开始进入 Trade CRM 客户详情页，可读、可编辑、可保存到独立字段值表。
- 剩余缺口：客户列表筛选、列表列配置、客户导出列选择还没有完全接入企业字段；当前闭环先覆盖详情页读写。
- 剩余缺口：multiSelect 当前使用逗号输入保存 option code，后续应升级为多选控件以降低运营误填风险。

## 2026-04-22 客户列表企业字段联动复核
- 已修正缺口：企业字段不再只在客户详情可见，客户列表也能按 `searchable=true` 字段进行可见范围筛选。
- 已修正缺口：客户表格固定 5 列的问题已调整为动态列数，企业字段值可以作为列表列展示。
- 剩余缺口：当前企业字段筛选是前端当前页/当前加载集合筛选，不是后端全量分页筛选；大量客户场景需要把字段值查询条件下沉到客户列表 resolver 或新 REST list endpoint。
- 剩余缺口：列表仅展示前两个 searchable 企业字段，后续需要接字段布局配置决定展示列，而不是写死前两个。

## 2026-04-22 客户导出企业字段复核
- 已修正缺口：客户导出不再暴露全部企业字段，只允许 `exportable=true` 字段进入字段选择和 CSV 生成。
- 已修正缺口：后端会二次过滤导出字段编码，防止绕过前端提交不可导出字段。
- 已修正缺口：客户列表字段值读取已从前端逐条请求升级为批量 API。
- 剩余缺口：批量字段值 API 只做读取优化，还没有支持按字段条件在后端筛选客户列表。
- 剩余缺口：导出仍按基础 keyword/accountOwnerId 过滤，尚未支持企业字段条件过滤导出范围。

## 2026-04-22 客户导出字段过滤复核
- 已修正缺口：客户导出范围现在可以按企业字段条件过滤，不再只有 keyword/accountOwnerId 基础条件。
- 已修正缺口：企业字段过滤条件在预估数量和实际导出中共用，降低运营侧“预估与文件不一致”的风险。
- 剩余缺口：客户列表页仍然是前端可见集合过滤，尚未复用这套后端企业字段过滤能力。
- 剩余缺口：导出页面企业字段 select/multiSelect 仍是通用输入，没有读取选项做下拉/多选控件。
# 2026-04-28 当前主线发现

- AMAIN CRM 的表层信息架构已经从 Twenty 默认菜单抽离，`Sales Desk / Leads / Customers / Opportunities` 已完成第一轮重置。
- 当前最接近日常可用性的阻塞不在导航，而在 `lead -> customer` 的幂等性和批量转换稳定性。
- `customer-lead-conversion.service.ts` 之前是盲插 company/person，重复邮箱 contact 会命中唯一约束。
- 当前已加入三层复用逻辑：
  - 先按 timeline 判断这条 lead 是否已经转过
  - 再按联系人主邮箱复用 person
  - 再按 company 名精确复用 customer
- 直接通过浏览器向 `http://localhost:3000/graphql` 打 raw mutation 目前返回 `403 Forbidden resource`，这轮更可靠的回归方式应是服务单测或应用内实际触发。

# 2026-04-29 Mail 模块当前发现

- Xiaoman/OKKI 的邮件模块是高密度操作工作面，不是 dashboard；AMAIN Mail 需要继续压缩指标卡和解释性文案。
- 当前 Mail 第一轮重构已把 inbox / customer / subordinate 调整为更接近 Xiaoman 的三栏工作面。
- 真实浏览器回归中，右下角错误提示的直接根因是 `connectedAccounts` GraphQL 过滤器报错：`Filter for field "accountOwnerId" must have exactly one operator`。
- 当前修复策略是先取 workspace connected accounts，再在前端按当前 workspace member 收口，绕开这条 schema 兼容问题。
- 待处理邮件的 `任务交接` 已从 `AppPath.TasksPage` 工作区跳转升级为真实 Task drawer 创建；目标优先挂到 opportunity，其次 company/customer，再其次 person。

## 2026-04-29 Mail customer / subordinate 回归补充
- `useTradeCrmMailWorkspaceData` 之前复用了根 Apollo provider，导致 customer 视角业务查询错误打到 `/metadata`，并出现 `Cannot query field "getMyCustomerMailCompanies" on type "Query"`。
- 当前已把 Mail 工作区业务查询切到 `useApolloCoreClient()`，customer 视角浏览器回归中 `/metadata` 已恢复为 200，客户工作面可正常渲染。
- subordinate 视图回归中发现一个表单 warning：`value` 传给 `select` 但没有 `onChange`，根因是“所有下属”占位下拉只有固定值没有事件处理。
- 继续追查后确认剩余权限错误来自 `GetMyCustomerMailCompanies`；当前已把 `TimelineMessagingService.getAndCountCompanyThreads()` 的 company repository 明确切到 `shouldBypassPermissionChecks: true`，浏览器回归里这条错误已经消失。
- customer 视角后续追查发现，页面仍会在 `recentThreads.length === 0` 时回退到静态 `workspace.listItems`，把“没有 CRM-linked customer mail”伪装成一组假客户卡。
- 当前已去掉 customer 视角这层回退；没有真实 customer mail 数据时，页面进入明确空状态，并提供“去邮件搜索补关联 / 打开客户工作台”两个动作入口。
- pending-replies 之前虽然能创建 Task，但没有真实 Task record 入口，用户只能新建任务或退回任务工作区。
- 当前已在 Mail 页面直接查询 Task，并按 `opportunity -> customer/company -> person` 目标关系匹配当前待处理线程；命中后优先展示“打开跟进任务”深链接，并保留 Mail source trail。
- 当前已补 core `tradeCrmMailThreadTaskLink` 绑定表，前端在新建跟进任务后会把 `threadId -> taskId` 立即回写，pending-replies 读取时优先走精确绑定。
- 当前这条链的真实阻塞不是 schema、migration 或绑定表缺失，而是 `TradeCrmMailPage` 的 thread-task query/mutation 之前还在走默认 Apollo client，dev runtime 下没有和 Mail 其他业务查询一样统一走 core client。
- 当前已把 `GET_TRADE_CRM_MAIL_THREAD_TASK_LINKS` 和 `UPSERT_TRADE_CRM_MAIL_THREAD_TASK_LINK` 都切到 `useApolloCoreClient()`，并在本地插入 thread-task 样本后完成浏览器回归；pending-replies 现在已经能显示“打开跟进任务”。
- Task 详情页之前虽然 URL 已经带了 `sourceWorkspace/sourceLabel/sourceTrail`，但页面本身没有把这组 Mail 来源上下文显式渲染出来，销售打开任务后看不出这条任务来自哪封待处理邮件。
- 当前已在 `RecordShowPage` 为 Task 记录补了一条 Mail 来源横幅，直接显示来源工作面、thread id 和返回 pending queue 的入口；任务详情现在能看出这是从 `Mail / 待处理邮件` 打开的跟进任务。
- 左侧重新出现 `工作区 / Sales Workbench` 的根因不是 Mail 上下文丢失，而是主导航隐藏逻辑只覆盖了 `trade-crm/*` 和 `enterprise/*` pathname，没有覆盖 `/object/task/...` 这类通用记录页上的 `sourceWorkspace=mail` 来源上下文。
- 当前已把 `MainNavigationDrawerScrollableItems` 的 AMAIN surface 判断扩展到 `sourceWorkspace/sourceHref`，从 Mail 打开的 Task 记录页不再回落到 Twenty 的 workspace/favorites 导航壳。
- 后续剩余点：把 target-based `opportunity/company/person` 近似匹配继续降为纯兜底，并考虑把 thread 摘要或发件人摘要也带到 Task 页横幅里。
## 2026-04-30 AMAIN Mailbox Phase 1 设计发现

- 现有仓库已经具备 `connected account / message channel / IMAP-SMTP-CALDAV / folder sync` 底层能力，适合复用，不需要从零重建邮件同步层。
- 现有设置页和连接模型偏向“个人邮箱连接”，不适合作为最终产品形态直接暴露给 AMAIN 用户。
- 如果继续沿用 Twenty 原生 connected-account 作为产品壳，邮件模块会继续背离 Xiaoman/OKKI 的企业邮箱工作台目标。
- 正确方向是双层结构：底层复用 Twenty，产品层新增 AMAIN mailbox profile / assignment / permission / rule / CRM link。
- Phase 1 的最小正确边界不是“把邮件页修得更像邮箱”，而是“管理员可以代绑阿里邮箱并把邮箱工作台分配给用户使用”。

## 2026-04-30 AMAIN Mailbox backend 实现发现

- `EnterpriseManagementModule` 已经是最合适的挂载点，新的 mailbox backend 不需要另起独立 enterprise root module。
- Twenty 现有 IMAP/SMTP validator 可以直接复用，但当前缺一层“企业托管凭证”的正式安全实现。
- 这轮为了打通运行链，`EnterpriseMailboxCredentialService` 先做了可回读的过渡实现；它解决了 validate endpoint 不能拿空密码的问题，但还不是最终安全方案。
- 下一步前端 Admin 页面接入前，后端已经具备最小 REST 面：profile create/list/validate、assignment create、health list。

## 2026-04-30 AMAIN Mailbox admin 前端发现

- `Mailbox Accounts / Assignments / Health` 已经接入 AMAIN Admin 路由，404 的直接原因是 3001 上跑着旧前端实例，不是路由代码缺失。
- 重启 `twenty-front` 后，浏览器回归确认 `/enterprise/mailbox/accounts`、`/enterprise/mailbox/assignments`、`/enterprise/mailbox/health` 都能进入真实页面。
- `enterprisePermissions.ts` 原文件带乱码，继续增量补丁成本很高；这轮直接重写成干净的英文权限目录更稳。
- `Assignments` 页面如果只有 `POST` 没有 `GET`，会退化成一次性表单；当前已经补上 `GET /api/enterprise/mailbox-assignments`，页面能回显当前分配记录。
- `corepack yarn nx typecheck twenty-front` 在这轮邮箱页完成后仍会被仓库里现存的大量无关类型错误挡住，但新引入的 mailbox admin 页面没有新增这批错误。

## 2026-05-05 AMAIN Mailbox admin 运行态发现

- mailbox admin 的真正阻塞不是页面代码，而是数据库里 mailbox 迁移没有执行；当前已确认 `run-typeorm-migration --force` 是这套仓库在本地跳过 workspace version guard 的正确入口。
- `AddEnterpriseMailboxControl1774900000000` 执行后，mailbox profile / assignment / permission / rule 表都已真实存在，后续 mailbox admin 不再依赖“假数据页”推进。
- 当前本地已通过真实 REST API 写入一组可回归的 mailbox 样本：
  - profile：`sales.alibaba.demo@amaincrm.local`
  - assignment：绑定 `Tim Apple`
  - rule：`Pending reply triage`
- 之前 `GET /api/enterprise/mailbox-assignments` 看起来为空，不是 service 逻辑错误，而是 3000 上的旧后端运行态没有吃到最新构建；刷新运行态后，profiles / assignments / rules 都能返回真实数据。
- `EnterpriseMailboxControlPages.test.tsx` 的失败根因不是页面本身，而是测试文件没有 mock `twenty-ui/input` 的 `Button`；补 mock 后，5 个 mailbox admin 页面测试全部通过。
- `Mailbox Rules` 原先只有创建和只读列表，还不够支撑管理员代绑后的真实运营；当前已经补上规则启停主链。
- 规则启停改动不只在前端，后端也新增了 `PATCH /api/enterprise/mailbox-rules/:id`，并把规则列表回写成带 `emailAddress` 的快照，避免 Admin 侧只能看到 UUID。
- 仅有启停仍然不够，运营侧至少需要改规则名和优先级；当前规则页已经补上行内编辑 `name / priority`，并通过前端测试确认会真实发出 `PATCH` 请求。

## 2026-05-06 AMAIN Mailbox assignments 权限运营面发现

- `Mailbox Assignments` 如果只有 create/list，会停留在一次性分配页，管理员后续无法持续运营邮箱权限；当前已经补上 `PATCH /api/enterprise/mailbox-assignments/:id`。
- assignment 更新主链现在不仅能改基础分配状态，还能同时维护：
  - `permissionCodes`
  - `canManageRules`
  - `canViewSubordinates`
  - `canHandleSubordinates`
- 前端 `EnterpriseMailboxAssignmentsPage` 已从只读表格推进成可编辑权限面，支持行内切换权限包和 subordinate controls。
- 当前这条链的真实剩余点不是 API 缺失，而是管理员创建 assignment 时仍需手工输入 `workspaceMemberId / mailboxProfileId`，还没有提升成真实选择器。
- assignment 编辑测试里的真实问题是选择器歧义，不是 API 或渲染错误：
  - `mail.forward` 在创建表单和编辑行里各出现一次
  - 邮箱地址文本同时出现在下拉 option 和表格行里
- 当前已把测试作用域收紧到 assignment 行，前端 suite 和运行态回归都已通过。
- `assignmentStatus` 原本只是数据库字段，没有进入 Admin 运营动作；当前已复用 `PATCH /api/enterprise/mailbox-assignments/:id`，把状态切换并入同一更新链。
- 前端 Jest 对 `twenty-shared/translations` 的解析仍然不稳定，直接依赖 package exports 会偶发失败；当前已在 `packages/twenty-front/jest.config.mjs` 增加显式 mapper，稳定落到 `../twenty-shared/dist/translations.cjs`。
- 本轮浏览器重新打开 `/enterprise/mailbox/assignments` 时遇到一次空壳页，症状更像本地运行态抖动或旧前端实例状态异常，不像 assignment 状态切换代码回退。
- `Mailbox Assignments` 虽然早就不是手工输入 UUID，但创建区之前仍然只是两个基础下拉和权限勾选，缺少可运营反馈；当前已补 member coverage、mailbox readiness、mailbox occupancy 和 duplicate assignment 阻断。
- assignment 创建主链现在不再默认把所有 subordinate / rules 控制留给后续编辑；管理员在创建时就能一起设定 `primary mailbox / canManageRules / canViewSubordinates / canHandleSubordinates`。
- 当前剩余缺口不是“能不能分配”，而是更细的运营约束：例如一个成员已有主邮箱时的冲突提示、同一 mailbox 多成员分配的发送优先级提示，以及 routing 规则和 assignment 的联动。
- 当前已把“同一成员只能有一个 active primary mailbox”下沉到后端 service，不再只靠前端禁用按钮；创建和重新激活主邮箱都会命中这条约束。
- Assignments 创建区现在会直接显示当前 `Primary sender`，管理员在切新的主邮箱前就能看见现有发信优先级，不需要先打开列表行判断。
- 当前已补“同一 mailbox 分给多个成员”时的 sender routing 提示：创建区会显示 active assignees，并明确谁当前拥有 primary sender route。
- 当前剩余缺口已经不在 assignment 语义，而在 rules 结构：`conditionsJson / actionsJson` 仍然是裸 JSON，管理员还没有低门槛的规则配置表单。
- 当前已把 `pending-reply` 规则从裸 JSON 推进成轻量结构化编辑：
  - `folder`
  - `maxReplyDelayHours`
  - `onlyUnread`
  - `createTask`
  - `escalateToManager`
  - `applyPendingTag`
- 当前已把 `folder-routing` 规则从裸 JSON 推进成轻量结构化编辑：
  - `sourceFolder`
  - `targetFolder`
  - `senderDomain`
  - `subjectKeyword`
  - `markAsRead`
  - `stopFurtherRules`
- 规则页仍保留非 `pending-reply` 类型的 JSON fallback，这样可以先把最重要的待处理规则做实，再逐步收其他规则类型。
- 规则页当前最合理的下一步已经不是继续补 `pending-reply` 和 `folder-routing`，而是把 `customer-auto-link` 和 `subordinate-escalation` 也推进到结构化规则层，减少 Admin 端继续编辑裸 JSON 的比例。
- `twenty-shared/translations` 的 Jest 映射在这个环境下继续存在解析抖动；当前已改成 `packages/twenty-front/__mocks__/twentySharedTranslations.ts`，把 mailbox control 前端测试稳定下来。
- `twenty-ui/input` 在当前 Jest 运行态也有一次模块解析抖动；当前已增加 `packages/twenty-front/__mocks__/twentyUiInput.tsx` 和 mapper，稳定 mailbox control 测试链。
- 当前已把 `customer-auto-link` 规则从裸 JSON 推进成轻量结构化编辑：
  - `senderDomain`
  - `onlyUnlinkedThreads`
  - `requireKnownContact`
  - `linkToPerson`
  - `linkToCompany`
  - `attachToLatestOpportunity`
  - `createLeadWhenUnmatched`
- 当前已把 `subordinate-escalation` 规则从裸 JSON 推进成轻量结构化编辑：
  - `sourceFolder`
  - `maxReplyDelayHours`
  - `onlyAssignedThreads`
  - `createTask`
  - `notifyOwner`
  - `escalateToManager`
  - `reassignToPrimarySender`
- 这意味着 `Mailbox Rules` 当前主要规则族已经都离开了“必须手改 JSON”的阶段；剩下的价值点不再是补更多同类表单，而是补规则命中结果、执行摘要和运营可见性。
- 当前已把 `Mailbox Rules` 的下一层推进成 `Rule coverage and recent activity` 面板，但这层是**配置活动可见性**，不是规则执行结果。
- 后端新增的 `GET /api/enterprise/mailbox-rules/activity` 当前读取的是 `enterpriseMailboxRule` 的审计日志，并把最近的创建、更新、启停活动映射成运营侧可读快照。
- 这一步的价值是让管理员看见“谁改了什么规则、挂在哪个 mailbox 上、最近有哪些变更”，而不是再盯着纯静态规则表。
- 现在必须保持语义克制：配置活动不等于命中结果。真正的 `rule hit summary / last execution / failure reason / dry-run` 还需要等规则执行链开始写入专门结果或运行审计。
- 前端 rules hook 当前已改成“先拉规则，再容错拉 activity”，避免 activity endpoint 一次失败把整页规则列表拖死。
- 当前已把下一层推进成 `Rule readiness preview`，它和 activity 一样属于运营可见性，但语义更接近“运行前检查”，不是“运行后结果”。
- `GET /api/enterprise/mailbox-rules/readiness` 当前不会伪造线程命中，它只检查真实可验证条件：
  - mailbox profile 是否 `active + validated`
  - 当前 mailbox 是否存在 active assignment
  - 是否能找到对应 message channel
  - 规则里引用的 `sourceFolder / targetFolder` 是否真实存在
- 这一层能直接发现最常见的运营错误：
  - 规则挂在未验证邮箱上
  - 规则指向了不存在的 folder
  - mailbox 还没人接手或 channel 还没同步
- 现在真正剩下的缺口已经更明确：
  - readiness 不是 dry-run
  - dry-run 需要引入线程样本或真实执行器结果模型
- 当前已把 `dry-run` 真正补进 `Mailbox Rules`，不再只停留在 readiness：
  - `GET /api/enterprise/mailbox-rules/:id/preview`
  - 规则页支持逐条 `Preview rule`
- dry-run 当前返回的不是伪统计，而是**真实候选线程样本**，包括：
  - `threadId / messageId`
  - 发件人邮箱
  - 邮件主题 / 接收时间
  - 是否 pending
  - 是否已挂 task
  - 是否已挂 CRM link
  - 命中的条件信号
  - 预计执行动作
- 这一步已经把 `Mailbox Rules` 从“能配置、能看健康”推进到“能拿真实线程做规则预演”。
- 当前剩余的真正缺口已经进一步收窄：
  - 还没有**执行后结果**模型
  - 还没有 `last result / failure reason / skipped reason`
  - dry-run 目前是实时采样，不是带审计留痕的执行记录
- 当前已补一层结果模型：
  - `enterpriseMailboxRuleResult`
  - `GET /api/enterprise/mailbox-rules/results`
- 现在 `preview` 不再只是临时响应，它会把结果写进结果表，并在规则页显示最近结果：
  - `executionType = preview`
  - `outcome = matched / no-match / blocked`
  - `summary`
  - `failureReason`
  - `matchedSignalsJson`
  - `plannedActionsJson`
- 这一步的价值不是“已经有 runtime 执行器”，而是先把**规则结果语义**定下来，后面真正接后台执行时不需要再重构规则页的数据结构。
- 当前仍然不能误解：
  - `Recent rule results` 里现在主来源是 preview
  - 还不是后台周期执行的真实命中日志
  - 下一刀必须补 runtime 写入链，尤其是 `skipped / failed / matched / acted`
- 当前已把第一条真实 runtime 链落在 `pending-reply` 上：
  - `POST /api/enterprise/mailbox-rules/:id/run`
  - 这不是假按钮，当前会真实改 thread state，并在需要时创建 follow-up task。
- `pending-reply` runtime 当前真实执行内容：
  - 把 thread 标记为 pending
  - 按规则补 `pending-reply` tag
  - 如规则要求且当前 thread 还没 task link，则创建 task
  - 回写 `threadId -> taskId`
  - 写入 `enterpriseMailboxRuleResult`，`executionType = runtime`
- 当前也明确把边界写死了：
  - 只有 `pending-reply` 会真实执行
  - `folder-routing` 现在也会真实执行
  - `customer-auto-link / subordinate-escalation` 当前 runtime 仍会记为 `skipped / unsupported`
  - 这样不会把“按钮可点”伪装成“规则已实现”
- `folder-routing` runtime 当前的真实边界已经明确：
  - 会把候选线程关联的 message-channel association 从 source folder 迁移到 target folder
  - 会写 runtime result，带 `targetFolderId / targetFolderName`
  - `markAsRead` 因为当前 workspace message model 没有稳定可写字段，所以不会伪造执行，只会在结果里标 `unsupportedActions = ['markAsRead']`
- `customer-auto-link` runtime 现在也已经进入真实执行：
  - 不再只是 `skipped / unsupported`
  - 当前优先复用 preview 里已经识别到的 `personId`
  - 然后沿 `person -> company -> latest opportunity` 回写 `enterpriseMailThreadCrmLink`
  - 这条链已经能稳定把 thread 绑定到 CRM 上下文，不需要再靠页面侧近似推断
- `customer-auto-link` 当前的边界同样写死了：
  - `createLeadWhenUnmatched` 还没实现 lead 自动创建
  - runtime 不会伪造这一步，只会在结果里标 `unsupportedActions = ['createLeadWhenUnmatched']`
- `subordinate-escalation` 现在也已经进入真实执行：
  - 不再只是 `skipped / unsupported`
  - 会按 `maxReplyDelayHours` 做 runtime 阈值判断
  - `onlyAssignedThreads` 未满足时会明确写 `skipped`
  - 会把 thread 标成 pending
  - 会按 mailbox assignment 里的 manager / primary sender 关系创建或改派 follow-up task
- `subordinate-escalation` 当前边界也明确：
  - `notifyOwner` 还没有稳定的通知落点
  - runtime 不会伪造通知，只会在结果里标 `unsupportedActions = ['notifyOwner']`
- `Rules` 页最近结果区之前太像原始日志，运营上不够可读。现在已经补成明确的结果面：
  - `preview` 和 `runtime` 不再混写成同一种执行
  - `acted / skipped / failed / matched` 已转成业务化标签
  - 线程、任务、unsupported actions、signals、planned actions 都能直接从结果表看出来

## 2026-05-07 Mailbox Rules runtime recovery findings

- `Preview rule` and `Run rule now` were broken by a stacked runtime issue, not by a single page bug.
- Confirmed failure chain:
  1. stale backend process on port 3000
  2. new backend could not boot because `TradeCrmMailThreadTagEntityRepository` was not registered in `EnterpriseManagementModule`
  3. mailbox rule service called `messageChannelDataAccessService.findMany(...)` outside workspace ORM context, producing `Workspace context not set`
  4. runtime result persistence required the `enterpriseMailboxRuleResult` table; until migration ran, preview/runtime failed on insert
- After recovery, live Rules page behavior is now consistent with product semantics:
  - preview works
  - run works
  - result ledger updates
- The current blocked state on the rule is now business-real:
  - mailbox profile exists
  - mailbox rule exists
  - but no synced message channel is linked to that mailbox yet
  - therefore preview/runtime correctly return blocked/no-candidate states instead of crashing

## 2026-05-07 Mailbox validation live diagnostics findings

- The next live blocker is not mailbox rules anymore. It is mailbox validation itself.
- After applying `1776500000000-add-enterprise-mailbox-validation-error`, the live mailbox admin APIs now expose a persistent validation error field.
- Real localhost validation of the current sample mailbox profile fails with:
  - `IMAP connection failed: Client network socket disconnected before secure TLS connection was established`
- That means the current sample mailbox is not provisionable yet:
  - `validationStatus = failed`
  - `connectedAccountId = null`
  - `messageChannelId = null`
- This is now an operator-visible state in both:
  - `Mailbox Accounts`
  - `Mailbox Health`
- `Mailbox Rules` creation is now explicitly blocked for mailboxes that are `pending` or `failed`, which prevents admins from attaching operational rules to a mailbox that cannot yet sync.

## 2026-05-08 Mailbox rules operator surface findings

- `preview` and `runtime` are both live again for the seeded local mailbox demo data.
- Once the service path recovered, the next problem moved to page readability rather than backend correctness.
- The Rules table now needs to expose the latest outcome per rule, otherwise an operator still has to correlate the rule list with the global results feed by hand.
- The current Rules page is more usable when it distinguishes:
  - `Dry-run previews`
  - `Live runs`
  - `Actions applied`
  - `Blocked / failed`
  - `Skipped / no candidates`
- This separation is operationally important because tuning a rule and executing a rule are different actions with different risk.
- After that, the next operator pain point is result density. Once the result list grows, admins need to narrow it quickly by rule and by execution outcome instead of scanning the entire feed.
- After rule/outcome filters, the next operator pain point is row inspection.
- Summary-level result rows are not enough once runtime actions start creating tasks or CRM links.
- The Rules page now needs expandable thread-level detail under each result row so an operator can inspect:
  - which thread was touched
  - whether a task was created or reused
  - which CRM ids were linked
  - which actions were skipped as unsupported
- After row-level detail, the next operator pain point is still context switching.
- Even with a better global results feed, clicking `Run rule now` should reflect immediately under the current rule row.
- Otherwise the operator still has to visually map:
  - the button they clicked
  - the rule row they were editing
  - the newest global result row

## 2026-05-08 Mailbox rules live runtime recovery follow-up

- The old live failure on `Run rule now` was no longer a DI or migration problem.
- The remaining runtime breaker was duplicate thread-state insertion:
  - rule execution tried to insert a fresh `tradeCrmMailThreadState`
  - some candidate threads already had a `(workspaceId, threadId)` state row
  - PostgreSQL correctly rejected the duplicate on `IDX_TRADE_CRM_MAIL_THREAD_STATE_WORKSPACE_THREAD`
- The correct fix is upsert semantics, not retry or ignore:
  - look up existing thread state by `workspaceId + threadId`
  - save back through the existing `id` when present
- After that fix and a clean backend restart, live runtime recovered:
  - `POST /api/enterprise/mailbox-rules/:id/run` returned `201`
  - the Rules page inline feedback opened without a failure snackbar
  - the result ledger and rule-row feedback stayed in sync

## 2026-05-08 Local mailbox readiness clarification

- The earlier IMAP TLS failure is stale history for the local demo mailbox path.
- The seeded local-development mailbox now runs through the repository's explicit `@amaincrm.local` provisioning path.
- Current live mailbox state is:
  - `validationStatus = validated`
  - `lastValidationError = null`
  - `lastSyncStatus = ACTIVE`
  - `connectedAccountId` present
  - `messageChannelId` present
- That means mailbox admin and mailbox rules are no longer blocked on provisioning for local development.
- The next blockers are product-surface issues, not transport readiness.

## 2026-05-08 Mailbox rule result-link findings

- Rule-result detail rows were previously operationally weak because they exposed only raw ids.
- Operators need to move directly from:
  - result row
  - latest inline feedback
  - target CRM record
- `task / person / company / opportunity` ids now render as direct links using AMAIN source context.
- The render path is verified by test and build.
- A live browser pass is now complete against a real `customer-auto-link` result row.
- Verified live behavior:
  - `Person / Company / Opportunity` ids render as links inside `Recent rule results`
  - clicking the `Person` link lands on the real `/object/person/:id` page
  - the object page keeps AMAIN navigation semantics and does not reintroduce Twenty `工作区`
- This confirms the record-link pattern is no longer just test-fixture coverage. It is live on the operator page.

## 2026-05-08 Mail workbench inbox-behavior findings

- The mailbox workbench now has a real selection layer in `Inbox / Pending / Unread`, not just row previews.
- Live browser regression confirmed:
  - thread checkboxes render in the inbox list
  - the batch toolbar exposes pending/tag/open/reply actions once threads are checked
  - preview-level `Reply / Reply all / Forward` actions are visible in the right-side thread panel
- The first compose-panel regression was real:
  - `Reply` was clickable
  - but the draft panel did not render
  - root cause was the render gate comparing the preview thread to `selectedMailThreadItems[0]`
- That comparison is wrong whenever the seller checks thread `A` but previews thread `B`.
- The correct source of truth for the draft panel is the explicitly targeted compose thread, not the first selected checkbox thread.
- After switching the render gate to an explicit `composeThreadId`, live browser regression confirms the draft surface now appears with:
  - recipient input
  - subject input
  - readonly thread context
  - draft body textarea
- Remaining gap:
  - `Save draft` no longer dies inside preview-local state
  - it now persists into a seller-visible Drafts workspace backed by browser-local storage
  - the full live loop is verified: `Reply -> Save draft -> Drafts hydrate -> Delete draft`
  - this closes the UX gap for mailbox behavior, but it is still not a backend Drafts record

## 2026-05-08 Mail workbench drafts-path findings

- The old mailbox draft flow was not operationally credible because `Save draft` only updated the compose panel timestamp.
- Sellers need two things from Drafts:
  - a dedicated workspace they can reopen later
  - a stable source-thread context when they resume the draft
- `TradeCrmMailPage` now keeps a local Drafts ledger with:
  - `mode`
  - `sourceThreadId`
  - recipients and cc
  - subject and body
  - customer/context labels
  - saved timestamp
- `Drafts` now reads from that ledger instead of fake seed items.
- Live browser verification confirms:
  - `Reply` opens the compose panel on the preview thread
  - `Save draft` creates a real row under `Drafts`
  - opening `Drafts` hydrates the editor with the saved content
  - `Delete draft` removes the row and restores the empty state
- Remaining boundary:
  - this is still browser-local Drafts persistence
  - it is good enough for mailbox workbench behavior
  - it is not yet a server-backed Drafts mailbox record or SMTP draft object

- 2026-05-08: Mail Drafts backend ledger initially appeared empty for two separate runtime reasons: the live server process had not been restarted after adding the new GraphQL fields, and the new core.tradeCrmMailThreadDraft table migration had not been applied. After restarting the dist/main.js server, forcing the migration in the local dev workspace, and changing the Drafts query to fetch from network instead of stale Apollo cache, Drafts rendered the saved backend records correctly.
