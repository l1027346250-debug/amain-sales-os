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
## 2026-04-22 独立站分配规则成员选择器补充
- 独立站分配规则表单中的 `assigneeIds` 已从手填逗号字符串改为真实 workspace 成员数组，前端直接复用 `currentWorkspaceMembersState` 做负责人勾选列表。
- `fixed_user` 与 `round_robin` 分配类型保存前会校验至少选择一位负责人，避免空负责人规则落库。
- 规则保存现在直接提交成员 ID 数组，与单条询盘人工处置、批量处置使用的负责人来源保持一致。
- 本轮已通过 `node .\\.yarn\\releases\\yarn-4.13.0.cjs nx typecheck twenty-front`。

## 2026-04-22 企业管理模块复核与下一阶段计划
- 已完成蓝图复核：确认 8 个页面、后端模块、迁移、核心 API 均有落点。
- 已修复报告模板 API 与技术蓝图不一致的问题，补齐 PATCH、content、enabled、DELETE 兼容接口。
- 已修复本地运行脚本在当前 Windows 环境中找不到 `netstat` 的启动阻塞。
- 已完成验证：`nx build twenty-server` 通过，`nx typecheck twenty-front` 通过，本地运行环境启动成功，企业管理前端路由 200，后端企业 API 进入 403 鉴权层。
- 下一阶段优先级：1）企业管理权限码落地；2）字段中心配置到 Trade CRM 客户页/导出/筛选的完整联动；3）客户导出权限和字段过滤补强；4）企业管理页面组件拆分；5）缓存失效策略落地；6）E2E 冒烟脚本。

## 2026-04-22 企业管理权限基础设施补充
- 新增企业管理蓝图权限码常量与前端权限 hook：以 `enterprise.*` 权限码作为页面和操作调用口，当前映射到 Twenty 现有 `ENTERPRISE/WORKSPACE` 权限 flag，后续可替换为真实细粒度权限服务。
- 企业管理左侧菜单已支持按页面权限码过滤子菜单。
- `EnterprisePermissionGuard` 支持传入 `requiredPermission`，保留登录态和企业入口校验。
- 客户导出页已接入 `enterprise.customerExport.read/create/download`：页面读权限、创建任务、重新执行、下载按钮和执行入口都有权限判断。
- 本轮过程中曾因 PowerShell 批量写文件导致中文 TSX 编码损坏，已恢复并重新校验；后续禁止用 `Set-Content` 批量重写含中文 TSX 页面。
- 验证：`node .\\.yarn\\releases\\yarn-4.13.0.cjs nx typecheck twenty-front` 通过；`node .\\.yarn\\releases\\yarn-4.13.0.cjs nx build twenty-server` 通过。

## 2026-04-22 企业管理后端权限服务与客户导出闭环
- 新增后端 `EnterprisePermissionService` 与 `EnterprisePermissionCode` 类型，业务控制器可以用蓝图 `enterprise.*` 权限码调用权限检查。
- 当前后端权限实现采用 Twenty 现有 `ENTERPRISE` 或 `WORKSPACE` permission flag 作为 fallback，后续可替换为真实细粒度权限表，不需要改业务 controller 调用方式。
- 客户导出 REST API 已接入权限检查：预估/列表/详情使用 `enterprise.customerExport.read`，创建/重试使用 `enterprise.customerExport.create`，文件访问/下载使用 `enterprise.customerExport.download`。
- 前端客户导出页与后端权限码保持一致：读权限控制页面，创建/重试/下载控制按钮和执行入口。
- 验证：`node .\\.yarn\\releases\\yarn-4.13.0.cjs nx build twenty-server` 通过；`node .\\.yarn\\releases\\yarn-4.13.0.cjs nx typecheck twenty-front` 通过。

## 2026-04-22 企业管理字段与报告权限补充
- 后端字段中心 API 已接入 `EnterprisePermissionService`：字段列表/详情/选项读取使用 `enterprise.field.read`，新增使用 `enterprise.field.create`，编辑/保存选项使用 `enterprise.field.update`，删除使用 `enterprise.field.delete`。
- 后端字段显示 API 已接入权限：读取使用 `enterprise.fieldLayout.read`，保存布局使用 `enterprise.fieldLayout.update`。
- 后端报告模板 API 已接入权限：列表/详情/版本/预览使用 `enterprise.reportTemplate.read`，创建使用 `enterprise.reportTemplate.create`，更新/启停/默认模板使用 `enterprise.reportTemplate.update`，删除使用 `enterprise.reportTemplate.delete`。
- 当前已形成权限闭环的后端模块：字段中心、字段显示、客户导出、报告模板。
- 验证：`node .\\.yarn\\releases\\yarn-4.13.0.cjs nx build twenty-server` 通过；`node .\\.yarn\\releases\\yarn-4.13.0.cjs nx typecheck twenty-front` 通过。

## 2026-04-22 企业管理权限闭环补齐
- 后端剩余企业管理控制器已接入 `EnterprisePermissionService`：回收站、获客来源流转、独立站管理、销售助手管理。
- 后端操作权限码已覆盖：`enterprise.recycle.read/restore/purge`、`enterprise.sourceConvert.read/update/blacklist.read/blacklist.update`、`enterprise.independentStation.read/bind/update/unbind`、`enterprise.salesPlaybook.read/create/update`。
- 前端回收站、来源流转、独立站、销售助手页面已接入 `useEnterprisePermissions` 和 `requiredPermission`，读权限控制页面入口，写权限控制按钮与函数入口。
- 当前企业管理权限落地仍以 Twenty 现有 `ENTERPRISE/WORKSPACE` flag 作为 fallback，业务代码已使用蓝图 `enterprise.*` 权限码，后续可替换为独立细粒度权限表。
- 验证：`node .\.yarn\releases\yarn-4.13.0.cjs nx build twenty-server` 通过，`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front` 通过。

## 2026-04-22 企业管理细粒度权限持久化第一步
- 新增 `enterpriseRolePermission` core 表与 TypeORM 实体，用于按 workspace + role + `enterprise.*` permission code 保存企业管理细粒度授权结果。
- 新增迁移 `1776100000000-add-enterprise-role-permission.ts`，包含角色外键、工作区外键、唯一索引和查询索引。
- `EnterprisePermissionService` 现在优先解析当前 user workspace / API key / application 对应角色，并读取 `enterpriseRolePermission`；角色没有任何企业权限配置时继续 fallback 到 Twenty 现有 `ENTERPRISE/WORKSPACE` flag，保证兼容当前工作区。
- 新增权限管理 API：`GET /api/enterprise/permissions`、`GET /api/enterprise/permissions/roles/:roleId`、`PUT /api/enterprise/permissions/roles/:roleId`，支持读取权限目录、读取角色授权、替换角色授权，并写入企业管理审计日志。
- 新增权限码：`enterprise.permissions.read`、`enterprise.permissions.update`；前端权限常量同步补齐。
- 验证：`node .\.yarn\releases\yarn-4.13.0.cjs nx build twenty-server` 通过，`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front` 通过。
- 本地开发库已执行迁移：`node .\.yarn\releases\yarn-4.13.0.cjs nx run twenty-server:database:migrate:prod -- --force`，输出 `Executed 1 migration(s): AddEnterpriseRolePermission1776100000000`。首次未加 `--force` 时被 Apple workspace 版本检查拦截，随后按本地开发库场景强制跳过版本检查。

## 2026-04-22 企业权限配置页落地
- 新增企业管理安全权限入口：`/enterprise/security/permissions`，并接入企业管理导航、主菜单和应用路由。
- 新增前端 `EnterprisePermissionsPage`：支持读取权限目录、读取角色列表、选择角色、查看角色企业权限、按权限组全选/清空、保存角色授权。
- 页面读权限使用 `enterprise.permissions.read`，保存入口使用 `enterprise.permissions.update`；无更新权限时按钮禁用并阻断执行函数。
- 后端细粒度权限表、REST API 与前端配置页已形成闭环：角色未配置时继续 fallback 到 Twenty 既有 `ENTERPRISE/WORKSPACE` 权限；一旦保存企业权限配置，则按 `enterprise.*` 明细权限执行。
- 本轮验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`、`node .\.yarn\releases\yarn-4.13.0.cjs nx build twenty-server`。
- `nx lint:diff-with-main twenty-front` 与 `nx lint:diff-with-main twenty-server` 命令通过，但脚本仍输出 `No changed files`，只能作为命令可运行参考。

## 2026-04-22 企业权限配置页可见文案修复
- 复查发现 `EnterprisePermissionsPage` 新增页面存在可见中文文案乱码风险，已重写页面文案为正常 UTF-8 中文。
- 页面仍保留角色列表、权限目录、按组全选/清空、保存授权、只读/更新权限控制等功能。
- 复测通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`。

## 2026-04-22 客户详情企业字段值闭环第一步
- 后端 `EnterpriseFieldValueController` 已接入细粒度权限：读取字段值需要 `enterprise.field.read`，保存字段值需要 `enterprise.field.update`，避免字段值 API 绕过角色授权。
- 新增前端 hook `useTradeCrmEnterpriseCustomerFields`，统一加载客户实体的企业字段定义、字段选项、当前客户字段值，并封装保存到 `enterpriseFieldValue` 的动作。
- Trade CRM 客户详情 Profile tab 新增 “Enterprise Custom Fields” 编辑区：支持 text、textarea、number、date、select、multiSelect、boolean 类型字段展示与编辑。
- 客户详情 Profile 摘要区同步展示企业自定义字段值，新增字段不再只停留在企业管理配置页，已进入客户详情实际业务页面。
- 布尔字段空值已按 null 保存，避免“未选择”被误写成 false。
- 本轮验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`、`node .\.yarn\releases\yarn-4.13.0.cjs nx build twenty-server`。
- `nx lint:diff-with-main twenty-front/server` 命令通过，但仍输出 `No changed files`，只能作为命令可运行参考。

## 2026-04-22 客户列表企业字段筛选与展示补充
- `useTradeCrmEnterpriseCustomerFields` 扩展为同时支持客户详情单记录字段值和客户列表多记录字段值加载，复用企业字段定义、选项和值格式化逻辑。
- Trade CRM 客户列表工具栏已接入 `searchable=true` 的企业客户字段：文本/数字/日期/multiSelect 使用输入过滤，select/boolean 使用下拉过滤。
- 客户列表表格支持动态列数，前两个可搜索企业字段会作为列表列展示，字段值来自独立 `enterpriseFieldValue`，不依赖 Twenty 原生字段。
- 当前列表筛选先在当前已加载客户集合内执行，避免立即改 GraphQL schema；后续需要下沉到后端分页查询，解决大数据量全局筛选。
- 本轮验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`；`nx lint:diff-with-main twenty-front` 命令通过但仍输出 `No changed files`。

## 2026-04-22 客户字段值批量读取与导出权限补强
- 后端字段值 API 新增批量读取：`GET /api/enterprise/records/:entityType/field-values?recordIds=...`，返回按 `recordId` 分组的 `enterpriseFieldValue`，并继续使用 `enterprise.field.read` 权限。
- Trade CRM 客户列表企业字段值加载已从逐条请求改为批量请求，减少列表筛选和字段列展示的 N+1 请求。
- 客户导出前端字段选择只展示 `enabled && exportable` 的企业客户字段。
- 客户导出后端新增强制过滤：创建任务和处理任务时都会把字段编码限制在基础字段 + `exportable=true` 企业字段内，避免通过手写字段编码绕过前端限制。
- 导出标签和字段值解析也只读取可导出的企业字段，确保不可导出字段不会进入 CSV。
- 本轮验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx build twenty-server`、`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`。
- `nx lint:diff-with-main twenty-front/server` 命令通过，但仍输出 `No changed files`，只能作为命令可运行参考。

## 2026-04-22 客户导出企业字段条件过滤落地
- 客户导出 filter 新增 `enterpriseFieldFilters`，支持按企业字段定义 ID、操作符和值过滤导出范围。
- 后端导出预估数量和实际导出文件生成已共用企业字段过滤逻辑，避免预估数量与实际 CSV 行数不一致。
- 当前支持操作符：`contains`、`equals`、`isEmpty`、`isNotEmpty`；字段类型覆盖 text/textarea/select/multiSelect/number/boolean/date。
- 企业字段过滤只允许 `searchable=true` 的客户字段参与，防止不可搜索字段被手工请求用于筛选。
- 客户导出页面新增“企业字段筛选”区域，展示 `searchable=true` 的企业客户字段；预估数量和创建任务都会提交同一组企业字段条件。
- 本轮验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx build twenty-server`、`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`。
- `nx lint:diff-with-main twenty-front/server` 命令通过，但仍输出 `No changed files`，只能作为命令可运行参考。

## 2026-04-22 客户列表企业字段后端筛选落地
- 客户列表 GraphQL 参数新增 `enterpriseFieldFilters`，支持 `contains`、`equals`、`isEmpty`、`isNotEmpty` 操作符。
- `CustomerWorkspaceListService` 已接入 `enterpriseEntityBinding`、`enterpriseFieldDefinition`、`enterpriseFieldValue`，按 `searchable=true` 的企业客户字段在后端计算匹配客户 ID，再参与客户列表返回结果。
- Trade CRM 客户列表前端新增企业字段定义预加载，把工具栏里的企业字段筛选转换为后端过滤 payload；select/multiSelect 使用 optionCode 提交，boolean 使用 true/false 提交。
- 列表仍保留当前页企业字段值展示和兜底二次过滤，确保后端过滤与表格动态列显示一致。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx build twenty-server`、`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`。
- `nx lint:diff-with-main twenty-front/server` 命令通过，但脚本仍输出 `No changed files`，只能作为命令可运行参考。

## 2026-04-22 客户列表企业字段列接入字段布局
- `useTradeCrmEnterpriseCustomerFieldDefinitions` 新增读取 `pageScene=list` 的字段布局配置，按 `visible=true` 与 `sortOrder` 生成客户列表企业字段列。
- Trade CRM 客户列表表格列不再固定使用前两个 `searchable` 字段；有列表布局时按企业管理“字段显示 / 列表页”配置展示，没有布局时才回退到前两个 searchable 字段。
- 字段布局读取失败不会阻断客户字段定义加载，会自动回退默认列，避免缺少布局读权限或接口异常导致客户列表不可用。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`、`node .\.yarn\releases\yarn-4.13.0.cjs nx build twenty-server`。
- `nx lint:diff-with-main twenty-front/server` 命令通过，但脚本仍输出 `No changed files`，只能作为命令可运行参考。

## 2026-04-22 客户详情企业字段接入 detail/edit 布局
- `useTradeCrmEnterpriseCustomerFields` 新增读取 `pageScene=detail` 与 `pageScene=edit` 的字段布局配置，输出 `detailFields` 与 `editFields`。
- 客户详情 Profile 摘要区改为按 `detail` 布局展示企业字段，支持 visible 与 sortOrder 控制；无布局时回退所有 enabled 字段。
- 企业字段编辑区改为按 `edit` 布局展示，支持 visible、sortOrder、readonly、required；只读字段禁用输入，必填字段为空时阻断保存。
- 保存仍写入 `enterpriseFieldValue` 独立字段值表，布局只控制 UI 显示与编辑约束，不改变底层值存储。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`、`node .\.yarn\releases\yarn-4.13.0.cjs nx build twenty-server`。
- `nx lint:diff-with-main twenty-front/server` 命令通过，但脚本仍输出 `No changed files`，只能作为命令可运行参考。

## 2026-04-22 客户新建表单接入 create 字段布局
- `useTradeCrmEnterpriseCustomerFieldDefinitions` 已新增读取 `pageScene=create` 字段布局，输出 `createFields`，按 `visible/sortOrder/readonly/required` 控制新增客户表单字段。
- Trade CRM 客户列表顶部“Create company customer”入口已渲染 create 布局字段，支持 text、number、date、select、multiSelect、boolean 字段录入；必填字段为空会阻止创建。
- 创建流程改为先创建公司客户主记录，再调用 `PUT /api/enterprise/records/customer/:recordId/field-values` 保存企业字段值，字段值继续写入独立 `enterpriseFieldValue` 表。
- 已复用统一字段值归一化函数，避免新增表单和详情编辑对 number、boolean、multiSelect、空值的保存语义不一致。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`、`node .\.yarn\releases\yarn-4.13.0.cjs nx build twenty-server`、`nx lint:diff-with-main twenty-front/server`；lint diff 仍输出 `No changed files`，只能作为命令可运行参考。

## 2026-04-22 客户企业字段 multiSelect 控件化
- 客户新增 create 布局中的 `multiSelect` 字段已从逗号分隔输入改为正式复选项控件，选项来源继续使用企业字段选项 API 返回的 `optionCode/optionLabel`。
- 客户详情 Profile 的企业字段编辑区同步改为复选项控件，新增和编辑的多选字段交互保持一致。
- 保存语义不变：前端仍提交 `string[]`，后端继续写入独立 `enterpriseFieldValue.valueStringArray`，不依赖 Twenty 原生字段。
- 未配置选项的 `multiSelect` 字段会显示配置缺失提示，避免运营手填 option code 造成脏数据。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`。

## 2026-04-22 客户企业字段输入组件抽取
- 新增 `TradeCrmEnterpriseCustomerFieldInput` 通用组件，统一承载 text、textarea、number、date、select、multiSelect、boolean 企业字段输入控件。
- 客户新增 create 布局和客户详情 Profile 企业字段编辑区已改为复用同一组件，避免两个入口分别维护字段类型渲染逻辑。
- 组件保持现有保存语义：select/boolean 提交单值，multiSelect 提交 `string[]`，空值仍由保存归一化逻辑处理。
- 未配置选项的 multiSelect 支持传入业务侧提示文案，后续可统一引导到企业管理字段中心补选项。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`、`node .\.yarn\releases\yarn-4.13.0.cjs nx lint:diff-with-main twenty-front`；lint diff 仍输出 `No changed files`。

## 2026-04-22 客户导出企业字段筛选接入通用字段组件
- 客户导出页的企业字段筛选区已复用 `TradeCrmEnterpriseCustomerFieldInput`，按字段类型渲染 text、textarea、number、date、select、multiSelect、boolean 控件。
- 导出页现在会为 searchable=true 的 select/multiSelect 企业字段加载字段选项，筛选时展示选项标签并提交 optionCode / string[]，不再要求运营手工输入选项编码。
- `enterpriseFilterValues` 状态已从纯字符串改为企业字段草稿值类型，支持 boolean 和 string[]；预估数量与创建导出任务继续共用同一组 `enterpriseFieldFilters`。
- 企业字段筛选仍只暴露 searchable=true 字段；导出列仍只允许基础字段 + exportable=true 企业字段，保持筛选和导出列权限语义分离。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`、`node .\.yarn\releases\yarn-4.13.0.cjs nx lint:diff-with-main twenty-front`；lint diff 仍输出 `No changed files`。

## 2026-04-22 客户导出企业字段筛选摘要补充
- 客户导出页新增企业字段筛选摘要，会把当前已启用的 searchable 企业字段条件展示为字段名和值，select/multiSelect 使用选项标签显示。
- 新增“清空企业字段筛选”操作，只清理企业字段条件并同步重置预估数量，避免继续显示旧筛选口径下的预估值。
- 任一企业字段筛选值变更时会清空旧预估数量，提示运营重新预估，减少导出范围误判。
- 摘要、预估数量和创建导出任务共用同一份 `enterpriseFilterValues`，保证页面展示与提交 payload 一致。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`、`node .\.yarn\releases\yarn-4.13.0.cjs nx lint:diff-with-main twenty-front`；lint diff 仍输出 `No changed files`。

## 2026-04-22 企业字段输入组件校验补充
- `TradeCrmEnterpriseCustomerFieldInput` 新增统一字段级校验提示能力，并导出企业字段值校验函数。
- 校验覆盖必填为空、number 非法、date 非法，以及 multiSelect 选项配置缺失等场景；控件会设置 `aria-invalid` 并在字段下方展示错误文案。
- 客户新增 create 布局、客户详情企业字段编辑区、客户导出企业字段筛选区已接入同一套校验消息。
- 客户新增和详情编辑在存在企业字段校验错误时阻止创建/保存；客户导出在筛选条件校验错误时阻止预估数量和创建导出任务。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`、`node .\.yarn\releases\yarn-4.13.0.cjs nx lint:diff-with-main twenty-front`；lint diff 仍输出 `No changed files`。

## 2026-04-22 客户导出企业字段筛选后端单测补充
- 新增 `enterprise-customer-export.service.spec.ts`，用 mock query builder 覆盖客户导出企业字段筛选的后端核心逻辑。
- 已覆盖 text contains、select equals、number equals、boolean equals、date equals、multiSelect 数组 overlap 六类字段过滤，验证生成的 SQL 条件和参数符合 `enterpriseFieldValue` 存储列语义。
- 已覆盖 `searchable=false` 字段被拒绝参与筛选：服务返回空 customer id 集合，并且不会访问字段值 query builder，防止手工请求绕过 searchable 限制。
- 验证通过：`npx jest src/modules/enterprise/customer-export/services/enterprise-customer-export.service.spec.ts --config=packages/twenty-server/jest.config.mjs`，7 个测试全部通过。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx build twenty-server`。

## 2026-04-22 客户导出页组件拆分
- 将客户导出页的导出字段选择抽为 `EnterpriseCustomerExportFieldSelection`，并补上至少保留一个导出字段的前端限制，避免创建空字段导出任务。
- 将导出任务表格抽为 `EnterpriseCustomerExportJobList`，状态文案、状态颜色、下载和重新执行入口集中维护，主页面只负责加载和动作编排。
- 新增 `enterprise-customer-export.types.ts` 统一承载导出字段选项、任务和状态 tone 类型，减少页面内重复类型定义。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx lint:diff-with-main twenty-front`，脚本仍输出 `No changed files`，仅作为命令通过参考。

## 2026-04-22 客户导出页组件拆分第二步
- 将新建导出任务表单抽为 `EnterpriseCustomerExportTaskForm`，任务名称、关键词、负责人 ID、预估数量和创建任务按钮集中维护，主页面只保留状态和回调。
- 将企业字段筛选区抽为 `EnterpriseCustomerExportEnterpriseFilterSection`，筛选摘要、清空筛选、字段控件渲染和字段级校验展示从主页面移出。
- 将企业字段结构和筛选摘要类型补入 `enterprise-customer-export.types.ts`，减少页面与组件之间的隐式结构耦合。
- 拆分后 `EnterpriseCustomerExportPage.tsx` 约 603 行，新增组件分别约 173/159/96/190 行，后续可以按组件补测试。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx lint:diff-with-main twenty-front`，脚本仍输出 `No changed files`，仅作为命令通过参考。

## 2026-04-23 客户导出字段逻辑 hook 抽取
- 新增 `useEnterpriseCustomerExportFields`，统一封装客户导出字段加载、`enabled/exportable/searchable` 分流、select/multiSelect 选项加载、筛选摘要、字段级校验消息和 `enterpriseFieldFilters` payload 构建。
- `EnterpriseCustomerExportPage` 不再直接维护企业字段定义、字段选项、筛选摘要和筛选 payload 构建逻辑，页面职责收敛为权限、任务 API、轮询和子组件编排。
- `EnterpriseCustomerExportPage.tsx` 从约 603 行降到约 371 行，客户导出模块形成 page + hook + 4 个子组件 + types 的结构。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx lint:diff-with-main twenty-front`，脚本仍输出 `No changed files`，仅作为命令通过参考。

## 2026-04-23 客户导出 hook 测试补齐
- 新增 `useEnterpriseCustomerExportFields.test.ts`，mock 企业字段 API 与字段选项 API，覆盖客户导出字段 hook 的核心规则。
- 测试覆盖：只把 `enabled && exportable` 字段放入导出字段列表；只把 `enabled && searchable` 字段放入企业字段筛选；select/multiSelect 选项过滤 disabled 并按 sortOrder 排序。
- 测试覆盖：企业字段筛选摘要使用 optionLabel 展示，payload 中 text 使用 `contains` 且会 trim，select/multiSelect 使用 `equals` 并提交 optionCode/string[]。
- 测试覆盖：number 非法值会触发字段级校验错误，清空筛选后 payload 为空且错误状态恢复。
- 定向测试通过：`node .\.yarn\releases\yarn-4.13.0.cjs jest packages/twenty-front/src/pages/enterprise/customer-export/hooks/__tests__/useEnterpriseCustomerExportFields.test.ts --config=packages/twenty-front/jest.config.mjs`，3 个测试通过。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx lint:diff-with-main twenty-front`，脚本仍输出 `No changed files`，仅作为命令通过参考。

## 2026-04-23 客户导出组件测试补齐
- 新增 `EnterpriseCustomerExportComponents.test.tsx`，覆盖客户导出拆分后的字段选择、任务表单和任务列表组件。
- 字段选择测试覆盖：最后一个已选导出字段不可取消，新增勾选和取消勾选会回传正确的字段 code 列表。
- 任务表单测试覆盖：企业字段校验错误时禁用预估和创建；缺少创建权限时只禁用创建按钮。
- 任务列表测试覆盖：缺少下载权限时 completed 任务下载按钮禁用且不触发回调；failed 任务在有创建权限时触发重新执行回调。
- 定向测试通过：`node .\.yarn\releases\yarn-4.13.0.cjs jest packages/twenty-front/src/pages/enterprise/customer-export/components/__tests__/EnterpriseCustomerExportComponents.test.tsx --config=packages/twenty-front/jest.config.mjs`，6 个测试通过。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx typecheck twenty-front`。
- 验证通过：`node .\.yarn\releases\yarn-4.13.0.cjs nx lint:diff-with-main twenty-front`，脚本仍输出 `No changed files`，仅作为命令通过参考。
# 2026-04-28 进度日志

- 建立当前主线 TODO 板，开始按任务板推进而不是口头跟踪。
- 已完成 Customers / Opportunities 语义回归与截图复核。
- 已在 `customer-lead-conversion.service.ts` 中加入幂等性逻辑：
  - 重复 lead 转化复用既有 customer / contact
  - 重复联系人邮箱复用既有 person
  - 精确同名 company 复用既有 customer
- 已新增 `customer-lead-conversion.service.spec.ts`，覆盖：
  - 已转过的 lead 会直接复用既有 customer / contact
  - 重复邮箱 contact 会复用 person 而不是重复插入
- 已扩展 `ConvertLeadToCustomerResultDTO`，返回：
  - `alreadyConverted`
  - `customerReused`
  - `contactReused`
- 批量 lead 转化命令现在会展示更明确的结果摘要，不再只有成功/失败两档。
## 2026-04-29 Mail module progress

- Refactored the Mail workspace toward a Xiaoman-style dense operating surface instead of a dashboard-style layout.
- Compressed the inbox / customer / subordinate top areas and removed operational metrics clutter from the main working views.
- Fixed a backend GraphQL schema boot error by declaring `pendingUpdatedAt` explicitly as a Date field on `TimelineThreadDTO`.
- Identified the inbox toast root cause as a `connectedAccounts` filter compatibility error on `accountOwnerId`.
- Reworked the account hooks to fetch workspace connected accounts first and filter by the current workspace member on the client side.
- Replaced pending-mail task handoff with a real Task drawer action so pending replies now create an actual Task record instead of only redirecting to the task workspace.
- Fixed the Mail customer view to use the core Apollo client for business queries so customer conversations no longer hit `/metadata`.
- Tuned the customer / subordinate three-column proportions toward the Xiaoman reference and re-ran browser regression on both scopes.
- Removed the subordinate view read-only `select` warning by giving the fixed filter control an explicit no-op `onChange`.
- Cleared the remaining `GetMyCustomerMailCompanies` permission error by reading company-thread aggregation through the system repository path with bypassed object-permission checks.
- Revalidated the Mail relationship workbench in-browser: customer view no longer throws GraphQL permission errors, subordinate view is warning-free.
- Removed the customer-view fallback to static workspace list items so the page no longer pretends sample customers are real CRM-linked mail records.
- Added actionable customer-view empty-state links for “go to mail search and attach CRM context” and “open customers workspace”.
## 2026-04-29 Mail task deep-link progress

- Added a lightweight Task lookup inside the pending-replies workbench so Mail can surface an existing follow-up task before falling back to task creation.
- Pending-replies now deep-links to a real Task record with Mail source context preserved, and keeps `新增跟进任务` as a secondary action when a live task already exists.
- Revalidated this change with `npx nx typecheck twenty-front` and `corepack yarn nx build twenty-front`.
- Browser navigation to `http://localhost:3001/trade-crm/mail?scope=mail&view=pending` still resolves cleanly after the change.

## 2026-04-29 Mail thread-task binding progress

- Added a new core `tradeCrmMailThreadTaskLink` entity, migration, and Timeline Messaging GraphQL read/write endpoints so Mail can bind a pending thread to an exact Task record.
- Updated `useOpenCreateActivityDrawer` to return the created activity id, then used that id in Mail pending-replies to immediately upsert `threadId -> taskId` after `创建跟进任务`.
- Pending Mail now resolves existing tasks by exact thread binding first and only falls back to target-based `opportunity/company/person` matching when no thread link exists yet.
- Verified with targeted tests: `useOpenCreateActivityDrawer.test.tsx` and `get-messages.service.spec.ts`, plus `npx nx typecheck twenty-front`, `corepack yarn nx build twenty-front`, and `npx nx build twenty-server`.
- Added fallback pending thread ids and switched the pending thread-link query/mutation to `useApolloCoreClient()` so dev runtime now reads the exact thread-task binding through the same core GraphQL path as the rest of Mail.
- Browser regression on `http://localhost:3001/trade-crm/mail?scope=mail&view=pending` now shows `打开跟进任务`; the pending queue is reading a real `threadId -> taskId` binding instead of falling back to task creation only.
- Added a Task-specific Mail context banner in `RecordShowPage`, so a task opened from pending replies now visibly shows `Mail / 待处理邮件`, the `threadId`, and a direct return link back to the pending queue.
- Browser regression on `/object/task/ae203ca0-75d1-48bd-a9ef-206015b37a3e?...sourceWorkspace=mail...` confirms the task page renders the new Mail follow-up context instead of hiding that information in URL params only.
- Extended `MainNavigationDrawerScrollableItems` to treat `sourceWorkspace/sourceHref` from AMAIN CRM as first-class surface context, so `/object/task/...` opened from Mail no longer shows the legacy workspace/favorites navigation block.
- Browser regression on the task record page now confirms `工作区` and `Sales Workbench` are gone while the Mail follow-up context banner remains visible.
## 2026-04-30 AMAIN Mailbox Phase 1 design progress

- Locked the mailbox strategy to admin-managed Alibaba mailboxes instead of end-user self-binding.
- Locked the transport strategy to IMAP + SMTP as the primary path for receive, folders, send, reply, and forward.
- Chose the layered implementation path: reuse Twenty substrate, add AMAIN mailbox domain, rebuild the AMAIN mail workbench and admin control surface.
- Wrote the formal design spec to `docs/superpowers/specs/2026-04-30-amain-mailbox-phase1-design.md`.
- The current stop gate is design review. No implementation work should start until the user approves the written spec.

## 2026-04-30 AMAIN Mailbox backend progress

- Added the first AMAIN mailbox core tables and entities:
  - `enterpriseMailboxProfile`
  - `enterpriseMailboxAssignment`
  - `enterpriseMailboxPermission`
  - `enterpriseMailboxRule`
  - `enterpriseMailThreadCrmLink`
- Added migration `1774900000000-add-enterprise-mailbox-control.ts`.
- Added `EnterpriseMailboxProfileService` with the first mailbox profile creation path and audit logging.
- Added `EnterpriseMailboxAssignmentService` with mailbox-to-user assignment and permission row creation.
- Added `EnterpriseMailboxHealthService` for admin mailbox health listing.
- Added enterprise mailbox REST controllers for profile list/create/validate, assignment create, and health list.
- Registered the new entities, services, and controllers in `EnterpriseManagementModule`.
- Added and passed targeted tests:
  - `enterprise-mailbox-profile.service.spec.ts`
  - `enterprise-mailbox-assignment.service.spec.ts`
- Verified `npx nx build twenty-server` passes after the backend mailbox additions.
