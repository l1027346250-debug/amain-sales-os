# 企业管理模块进度

## 2026-04-21
- 已完成开发状态复核。
- 已确认下一阶段从回收箱 V1 开始补齐前后端闭环。

## 2026-04-21 回收箱 V1
- 新增后端回收记录实体、状态类型、service、controller。
- 新增 core migration：`1775700000000-add-enterprise-recycle-record.ts`。
- `EnterpriseManagementModule` 已注册 recycle entity/controller/service。
- 前端 `EnterpriseRecycleBinPage` 已从 placeholder 替换为资源 tabs、状态筛选、列表、删除快照、恢复、永久清空、一键清空指定资源类型。
- 已通过 `nx typecheck twenty-server`、`nx typecheck twenty-front`。
- 已通过 `nx lint:diff-with-main twenty-server`、`nx lint:diff-with-main twenty-front`，但脚本输出 `No changed files`，只作为命令通过参考。
- 已执行迁移，输出 `Executed 1 migration(s): AddEnterpriseRecycleRecord1775700000000`。
- 无 token 访问 `/api/enterprise/recycle/email` 返回 403 Missing authentication token，确认运行后端已加载 route。

## 2026-04-21 来源流转 V2
- 新增来源流转后端实体：`enterpriseSourceChannel`、`enterpriseSourceConvertRule`、`enterpriseSourceBlacklistRule`。
- 新增来源流转 API：categories、rules list/detail/update/enabled、blacklist list/create/delete、internal execute decision endpoint。
- `EnterpriseSourceConvertService` 首次访问会为 workspace 初始化 8 类默认来源渠道和规则。
- 前端 `EnterpriseSourceConvertPage` 已从 placeholder 替换为来源 tabs、规则表、规则设置面板和黑名单设置。
- 已通过 `nx typecheck twenty-server`、`nx typecheck twenty-front`。
- 已通过 `nx lint:diff-with-main twenty-server`、`nx lint:diff-with-main twenty-front`，但脚本仍输出 `No changed files`。
- `nx build twenty-server` 的 SWC 编译成功，但 Windows 下仓库脚本 `mkdir -p && cp` 资源复制失败；已手动复制 SDK 资产后继续迁移。
- 已执行迁移，输出 `Executed 1 migration(s): AddEnterpriseSourceConvert1775800000000`。
- 无 token 访问 `/api/enterprise/source-convert/categories` 返回 403 Missing authentication token，确认运行后端已加载 route。

## 2026-04-21 独立站 V2
- 新增独立站后端实体：`enterpriseWebsiteBinding`、`enterpriseInquiryFormMapping`、`enterpriseInquiryAssignmentRule`、`enterpriseWebsiteInquiry`。
- 新增独立站 API：站点绑定 list/create/update/unbind、表单映射 get/replace、分配规则 get/replace。
- 新增 webhook 入站：`POST /webhooks/independent-station/:tenantKey/inquiries`，支持按网站绑定或 workspace 解析、必填字段校验、分配规则决策、询盘入站落库、重复外部询盘幂等返回。
- `EnterpriseManagementModule` 已注册 independent-station entity/controller/service/webhook controller。
- 前端 `EnterpriseIndependentStationPage` 已从 placeholder 替换为绑定网站、询盘通知设置、字段映射和分配规则工作台。
- 已通过 `nx typecheck twenty-server`、`nx typecheck twenty-front`。
- 已通过 `nx lint:diff-with-main twenty-server`、`nx lint:diff-with-main twenty-front`，但脚本仍输出 `No changed files`。
- `nx build twenty-server` 的 SWC 编译成功，仍被 Windows 下 `mkdir -p && cp` 资源复制脚本阻断；已手动复制 SDK 资产后继续迁移。
- 已执行迁移，输出 `Executed 1 migration(s): AddEnterpriseIndependentStation1775900000000`。
- 无 token 访问 `/api/enterprise/independent-stations` 返回 403，确认受保护 route 已加载；未配置站点访问 webhook 返回 404，符合未找到绑定站点业务结果。

## 2026-04-21 销售助手 V3
- 新增销售助手后端实体：`enterpriseSalesPlaybook`、`enterpriseSalesPlaybookStage`、`enterpriseSalesPlaybookItem`。
- 新增销售助手 API：playbook list/create/update、stage get/replace、item get/replace、业务侧读取 `GET /api/sales-assistant/contextual-content`。
- `EnterpriseSalesPlaybookService` 首次访问会初始化默认谈单指南和 13 个标准阶段：线索到达、商机、询盘首回、建立链接、需求画像、报价和确认报价、样品环节、大货单确认、备货中、发货后、好评邀请、售后问题、输单。
- 前端 `EnterpriseSalesPlaybookPage` 已从 placeholder 替换为销售标准流程、阶段维护、阶段内容编辑三栏工作台。
- 已通过 `nx typecheck twenty-front`。
- 后端 typecheck 首次出现 `twenty-shared/*` 模块解析瞬态失败；执行 `nx build twenty-shared` 后重跑 `nx typecheck twenty-server` 通过，Nx 标记 `twenty-server:typecheck` 为 flaky task。
- 已通过 `nx lint:diff-with-main twenty-server`、`nx lint:diff-with-main twenty-front`，但脚本仍输出 `No changed files`。
- `nx build twenty-server` 的 SWC 编译成功，仍被 Windows 下 `mkdir -p && cp` 资源复制脚本阻断；已手动复制 SDK 资产后继续迁移。
- 已执行迁移，输出 `Executed 1 migration(s): AddEnterpriseSalesPlaybook1776000000000`。
- 无 token 访问 `/api/enterprise/sales-playbooks` 返回 403；`/api/sales-assistant/contextual-content` 当前运行进程返回 404，需重启完整本地环境后复测业务侧读取路由。
- 补充修正：保存阶段时会同步清理旧阶段内容，避免阶段重建后留下孤儿 item；修正后 `nx typecheck twenty-server` 通过。

## 2026-04-21 本地联调阻断修复
- 修复 `twenty-server` Windows build 阻断：将 `project.json` 中 Unix-only 的 `mkdir -p && cp` 替换为 Node 复制脚本 `packages/twenty-server/scripts/copy-client-sdk-assets.js`。
- `nx build twenty-server` 已完整通过，不再需要手动复制 SDK assets。
- 已重启 3000 后端进程，新进程 PID 为当前监听端口进程。
- 重启后接口探测：`/healthz` 返回 200，`/api/enterprise/sales-playbooks` 返回 403，`/api/sales-assistant/contextual-content` 返回 403，确认销售助手业务侧读取路由已加载并进入鉴权层。

## 2026-04-21 页面联调补充
- 使用 Playwright 打开 `http://localhost:3001/enterprise/sales/playbook`，确认销售助手管理页面可渲染，默认谈单指南、阶段维护、阶段内容工作台可见。
- 发现本地登录表单不会自动写入 `tokenPair` cookie；通过 `/metadata` 的 `signIn` + `getAuthTokensFromLoginToken` 换取 workspace access token 后注入浏览器完成联调。该问题属于本地登录状态链路，不是企业管理页面路由缺失。
- 修正 `EnterpriseSalesPlaybookPage` 阶段表格中 `button` 内嵌 `input` 的非法 DOM：改为可聚焦 `div role="button"` 容器，保留点击/键盘选中阶段能力。
- 使用 Playwright 打开 `http://localhost:3001/enterprise/integrations/independent-station`，确认独立站管理页面可渲染，绑定网站、字段映射、分配规则入口可见。
- 已重跑 `nx typecheck twenty-front`、`nx typecheck twenty-server`，均通过。
- 同步修复 Trade CRM `FilterSidebar` 的 `$active` DOM 透传 warning，改为 `data-active` CSS 状态，避免 React 控制台被无效属性污染；剩余控制台错误来自 twenty-icons 远程图标 400 和本地 3020 lead-monitoring 服务未启动。

## 2026-04-21 独立站业务闭环补充
- Webhook 有效询盘现在会同步进入 CRM 工作区对象：按邮箱查找/复用/恢复 Person，缺失 Person 时创建客户；按工作邮箱域名或公司名查找/恢复/创建 Company，并把公司关联到新建客户。
- 阻断询盘不会写入 CRM 客户数据，只保留企业管理询盘记录和缺失字段原因，避免污染客户库。
- 新增独立站询盘查询 API：`GET /api/enterprise/independent-stations/:id/inquiries`，返回最近 50 条入站记录。
- 前端独立站页面新增“最近询盘入站记录”，展示客户、来源、状态、缺失字段、分配结果、CRM 写入动作、关联客户/公司 ID。
- 前端独立站页面将 tab/list 的状态样式从 DOM `active` 属性改为 `data-active`，避免 React 非法属性 warning。
- 已通过 `nx typecheck twenty-server`、`nx typecheck twenty-front`。
- 已通过 `nx lint:diff-with-main twenty-server`、`nx lint:diff-with-main twenty-front`，脚本仍输出 `No changed files`，仅作为命令通过参考。

## 2026-04-21 独立站 Webhook 安全补充
- 独立站 webhook 支持请求头 `x-enterprise-webhook-secret`，站点配置了密钥后会校验入站请求，缺失或错误返回 401。
- 站点密钥不保存明文：保存配置时后端将 `webhookSecret` 转为 `webhookSecretHash`，仅返回 `webhookSecretHint` 作为前端提示。
- 前端独立站设置区新增 Webhook 密钥输入和“生成密钥”操作，保存后独立站推送需要携带同名请求头。
- 旧站点未配置密钥时保持兼容，不阻断现有 webhook 联调；上线前应为每个站点配置密钥。
- 已通过 `nx typecheck twenty-server`、`nx typecheck twenty-front`、`nx build twenty-server`。
## 2026-04-21 独立站询盘重处理补充
- 新增询盘重处理 API：`POST /api/enterprise/independent-stations/:id/inquiries/:inquiryId/reprocess`。
- 重处理会基于当前表单映射和分配规则重新计算缺失字段、负责人、询盘状态，并重新执行 CRM Person/Company 同步。
- 重处理会写入企业管理审计日志，保留处理前后的状态、负责人、CRM 记录和决策 JSON。
- 前端“最近询盘入站记录”新增“重处理”操作，便于修正字段映射或分配规则后重新跑闭环。
- 已通过 `nx typecheck twenty-server`、`nx typecheck twenty-front`、`nx lint:diff-with-main twenty-server`、`nx lint:diff-with-main twenty-front`、`nx build twenty-server`。
## 2026-04-21 独立站询盘批量重处理补充
- 新增批量重处理 API：`POST /api/enterprise/independent-stations/:id/inquiries/reprocess`。
- 默认批量处理最近 50 条 `blocked` 与 `pending_assignment` 询盘，支持传入 `statuses` 覆盖目标状态集合。
- 前端“最近询盘入站记录”新增“批量重处理异常询盘”按钮，适合修正字段映射或分配规则后一次性重跑异常询盘。
- 已通过 `nx typecheck twenty-front`、`nx lint:diff-with-main twenty-server`、`nx lint:diff-with-main twenty-front`、`nx build twenty-server`。
- `nx typecheck twenty-server` 当前被仓库级既有异常类型/测试类型问题阻断，错误集中在 auth、billing、workspace、workflow 等非企业模块；本轮后端构建通过。
## 2026-04-21 独立站询盘备注同步补充
- 独立站询盘的留言内容现在会同步生成或更新 CRM Note，避免客户写入后只剩空壳 Person/Company。
- 同一条询盘的备注采用幂等维护：首次入站创建备注，后续重处理复用同一条 note 并更新内容与挂载目标。
- 备注正文会写入联系人、邮箱、电话、公司、国家、来源页和原始留言内容；若询盘没有留言，则不创建备注。
- 备注会同时挂到目标客户和目标公司，前端询盘表格已展示 `noteId`，便于联调确认。
- 已通过 `nx typecheck twenty-front`、`nx build twenty-server`；`nx typecheck twenty-server` 仍被仓库级既有非企业模块错误阻断。## 2026-04-22 独立站询盘运营台补充
- 独立站询盘列表从固定最近 50 条升级为可搜索、可状态筛选、可分页的运营列表，后端 `GET /api/enterprise/independent-stations/:id/inquiries` 支持 `page`、`pageSize`、`search`、`statuses` 查询参数。
- 搜索范围覆盖外部询盘号、姓名、邮箱、公司、来源页；列表返回 `items/page/pageSize/total`，前端补齐总数、页码和每页条数控制。
- 新增人工处置接口 `PATCH /api/enterprise/independent-stations/:id/inquiries/:inquiryId`，支持手工修改询盘状态与负责人，并把人工覆盖写入 `decisionJson.manualOverride` 与企业管理审计日志。
- 前端询盘表格已补状态下拉、负责人输入和“保存处置”操作，结合已有“重处理”按钮，形成筛选、人工修正、规则重跑的闭环。
- 本轮已通过 `node .\\.yarn\\releases\\yarn-4.13.0.cjs nx typecheck twenty-front` 与 `node .\\.yarn\\releases\\yarn-4.13.0.cjs nx build twenty-server`。
## 2026-04-22 独立站询盘成员分配与批量处置补充
- 前端独立站询盘表格已接入 `currentWorkspaceMembersState`，负责人编辑从自由文本升级为真实 workspace 成员下拉，并在列表展示时优先解析为成员姓名。
- 询盘表格新增本页勾选、全选、批量负责人、批量状态和批量保存处置，支持运营按页批量修正异常询盘。
- 后端新增批量处置接口 `PATCH /api/enterprise/independent-stations/:id/inquiries`，支持对多条询盘统一更新负责人/状态，并逐条写入 `manualOverride` 与审计日志。
- 单条询盘人工处置逻辑已抽为共享更新逻辑，保证单条保存与批量保存写入行为一致。
- 本轮已通过 `node .\\.yarn\\releases\\yarn-4.13.0.cjs nx typecheck twenty-front` 与 `node .\\.yarn\\releases\\yarn-4.13.0.cjs nx build twenty-server`。
