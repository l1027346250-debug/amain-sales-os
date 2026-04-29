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
- 后续剩余点：把 target-based `opportunity/company/person` 近似匹配继续降为纯兜底，并在 Task 详情页补可见的 Mail thread 来源上下文。
