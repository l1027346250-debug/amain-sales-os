
## 2026-04-22 复核后下一阶段执行计划

### 当前状态
- 8 个企业管理页面均已接入路由。
- 后端模块与迁移已覆盖蓝图主要数据结构。
- 本轮已修复报告模板 REST API 兼容性和本地运行脚本启动问题。
- 本地运行环境可启动，企业管理前端路由可访问，后端企业 API 已进入鉴权层。

### 下一阶段开发计划
1. 权限落地：已完成第一轮页面/操作权限码映射，前后端均使用蓝图 `enterprise.*` 权限码，当前底层仍 fallback 到 Twenty `ENTERPRISE/WORKSPACE` flag。
2. 字段联动闭环：把 `field_definition + field_layout_config + field_value` 与 Trade CRM 客户新建/编辑/详情/筛选/导出打通，验证新增字段能真实影响业务页面。
3. 客户导出补强：按字段权限过滤导出列，按数据权限过滤导出范围，补导出任务失败原因和下载审计。
4. 细粒度权限持久化：已新增角色权限表、实体、迁移和 REST API；下一步补前端角色权限配置页，并评估是否接入 Twenty 原生角色设置。
5. 缓存策略：字段定义、字段布局、来源规则、销售助手内容接入明确缓存键与失效点，避免配置变更后页面读旧数据。
6. 页面拆分：优先拆 `EnterpriseIndependentStationPage`、`EnterpriseSalesPlaybookPage`、`EnterpriseReportTemplatesPage`，把表格、编辑器、工具栏拆成子组件，降低维护风险。
7. 联调自动化：新增企业管理 smoke 脚本，覆盖 8 个路由、关键 API 鉴权、报告模板增删改、独立站规则保存、客户导出任务创建。

### 风险控制
- 提交前排除 `.codex-runtime` 和无关 Trade CRM 客户模块改动。
- `twenty-server` 全量 typecheck 曾受非企业模块既有错误影响，企业管理后端以 `nx build twenty-server` 和定向测试作为主要验证。

## 2026-04-22 下一阶段计划补充
1. 权限联调闭环：登录本地环境，进入 `/enterprise/security/permissions`，对一个非管理员角色保存部分 `enterprise.*` 权限，验证 API 拦截、页面按钮禁用、数据库回显三者一致。
2. 字段联动闭环：把独立字段定义、字段值表、字段布局继续打到 Trade CRM 客户新增/编辑/详情/筛选/导出，确保蓝图“客户管理不是依赖 Twenty 原生字段”真正可用。
3. 数据权限与导出：客户导出按字段权限过滤列，按角色/负责人范围过滤数据，并补下载审计、失败原因和过期文件清理可见性。
4. 组件拆分：优先拆 `EnterpriseIndependentStationPage`、`EnterpriseSalesPlaybookPage`、`EnterprisePermissionsPage`，避免单页文件继续膨胀。
5. 自动化联调：新增企业管理 smoke 脚本，覆盖 8 个路由、权限配置保存、报告模板 CRUD、独立站询盘处理、客户导出任务创建。

## 2026-04-22 下一阶段计划补充（二）
1. 将企业字段接入客户列表筛选：只暴露 `searchable=true` 字段，支持文本包含、选项等值、布尔等值、日期区间。
2. 将企业字段接入客户导出：只暴露 `exportable=true` 字段，并按角色字段权限过滤导出列。
3. 将客户详情企业字段编辑器拆成独立组件，补 select/multiSelect 正式控件和字段校验提示。
4. 为字段值读写增加 smoke 测试：创建字段、保存客户字段值、刷新回显、权限不足返回 403。

## 2026-04-22 下一阶段计划补充（三）
1. 将客户列表企业字段筛选下沉到后端：支持按 fieldDefinitionId + operator + value 查询 `enterpriseFieldValue`，并与客户列表分页合并。
2. 将客户列表企业字段展示列接入字段布局配置：按 `field_layout_config` 控制列顺序、显示/隐藏和默认列。
3. 将企业字段接入客户导出任务：导出预览和导出文件同时支持 `exportable=true` 字段。
4. 给客户字段值补后端批量读取 API，替代当前前端对可见客户逐条请求字段值。

## 2026-04-22 下一阶段计划补充（四）
1. 给客户列表增加后端企业字段过滤条件：`fieldDefinitionId/operator/value`，支持 contains、equals、date range、boolean equals。
2. 给客户导出 filter 增加企业字段条件，使导出范围与客户列表企业字段筛选一致。
3. 把客户列表企业字段列改为读取字段布局配置，不再固定展示前两个 searchable 字段。
4. 给批量字段值 API 增加定向测试：无权限 403、空 recordIds 返回空结果、多 recordIds 分组正确。

## 2026-04-22 下一阶段计划补充（五）
1. 将客户列表企业字段筛选改为后端 API 或 GraphQL resolver 参数，复用导出中的 `enterpriseFieldFilters` 语义。
2. 给导出页面企业字段筛选加载字段选项，select 使用下拉，multiSelect 使用多选，减少运营输入 option code 的风险。
3. 给企业字段过滤补单元测试，覆盖 contains/equals/multiSelect/boolean/date 以及不可搜索字段被拒绝的场景。
4. 将字段布局配置接入客户列表企业字段列展示，替换当前 “前两个 searchable 字段” 的临时策略。

## 2026-04-22 下一阶段计划补充（六）
1. 将客户详情企业字段编辑器接入 `field_layout_config` 的 detail/edit 场景，按 visible、readonly、required、sortOrder 渲染。
2. 将客户新建表单接入 `field_layout_config` 的 create 场景，保存基础客户字段后同步保存企业字段值。
3. 给企业字段布局读取补前端兜底测试：无 layout 时使用默认列，有 layout 时按 visible/sortOrder 渲染。
4. 给客户列表企业字段过滤补后端定向测试，覆盖不可搜索字段被忽略、select optionCode、boolean、multiSelect。

## 2026-04-22 下一阶段计划补充（七）
1. 将客户新建表单接入 `field_layout_config` 的 create 场景：先创建客户主记录，再保存企业字段值。
2. 给企业字段编辑器补正式 multiSelect 控件，替代逗号分隔 option code 输入。
3. 给 detail/edit 布局补前端 smoke：隐藏字段不显示，只读字段禁用，必填为空无法保存。
4. 将字段布局读取逻辑抽为通用 hook，供客户列表、客户详情、新建表单、导出页复用。

## 2026-04-22 下一阶段计划补充（八）
1. 给新增客户 create 布局表单补正式 multiSelect 复选控件，替代逗号分隔输入。
2. 把客户新增、详情编辑、列表展示共用的企业字段渲染逻辑抽成组件，减少 `TradeCrmCustomersPage` 膨胀。
3. 给企业字段值读写补定向前后端测试：create 布局必填校验、创建后保存字段值、刷新详情回显。
4. 继续把字段布局读取抽为通用 hook，供客户列表、客户新增、客户详情、导出页统一复用。

## 2026-04-22 下一阶段计划补充（九）
1. 抽出企业字段通用渲染组件，统一新增、详情编辑、后续导出筛选里的 text/select/multiSelect/boolean/date 控件。
2. 给 create/detail 企业字段表单补字段级错误提示，替代当前只禁用保存按钮的粗粒度提示。
3. 补客户字段值 smoke 测试：新增客户带企业字段、详情修改多选字段、刷新后回显。
4. 给字段选项配置缺失场景增加页面提示入口，引导管理员回到企业管理字段中心补选项。

## 2026-04-22 下一阶段计划补充（十）
1. 把企业字段通用输入组件继续接入客户导出企业字段筛选区，使筛选表单也使用字段类型和选项配置。
2. 给企业字段输入组件补字段级校验展示：必填为空、number 非法、date 非法、多选无选项。
3. 拆分客户列表页里的创建客户 ActionBar，降低 `TradeCrmCustomersPage` 文件复杂度。
4. 增加字段值端到端 smoke：create 布局录入、详情回显、详情修改、列表列展示一致。

## 2026-04-22 下一阶段计划补充（十一）
1. 给客户导出企业字段筛选补“清空筛选”和已启用筛选摘要，方便运营确认导出范围。
2. 给企业字段输入组件增加字段级校验提示，并在客户新增、详情编辑、导出筛选三处统一复用。
3. 为客户导出企业字段筛选补后端定向测试：select、multiSelect、boolean、不可搜索字段拒绝。
4. 把客户导出页拆分为筛选表单、字段选择、任务列表三个组件，降低页面复杂度。

## 2026-04-22 下一阶段计划补充（十二）
1. 给企业字段输入组件增加统一校验提示：必填为空、number 非法、date 非法、multiSelect 无选项。
2. 把客户新增、详情编辑、导出筛选三处的字段级错误提示接入同一套组件 props。
3. 给客户导出企业字段筛选补后端定向测试，覆盖 select/multiSelect/boolean 和不可搜索字段拒绝。
4. 拆分客户导出页为任务表单、字段筛选、字段选择、任务列表组件。

## 2026-04-22 下一阶段计划补充（十三）
1. 给客户导出企业字段筛选补后端定向测试，覆盖 select、multiSelect、boolean、number、date 和不可搜索字段拒绝。
2. 把客户导出页拆分为任务表单、企业字段筛选、字段选择、任务列表组件。
3. 给客户新增 create 布局和客户详情企业字段编辑补前端 smoke 测试，验证必填和非法值拦截。
4. 检查企业字段通用组件是否适合迁移到更通用的 enterprise/shared 层，供后续其他实体复用。

## 2026-04-22 下一阶段计划补充（十四）
1. 拆分客户导出页为任务表单、企业字段筛选、字段选择、任务列表组件，降低单页复杂度。
2. 给客户新增 create 布局和详情企业字段编辑补前端 smoke 测试，覆盖字段级校验提示和提交阻断。
3. 将企业字段输入组件评估迁移到 enterprise/shared 层，为后续供应商、产品等实体复用做准备。
4. 补客户导出任务创建的集成路径测试：preview-count 与 create-job 共用同一份 enterpriseFieldFilters。

## 2026-04-22 下一阶段计划补充（十五）
1. 继续拆分客户导出页：把任务创建表单和企业字段筛选区拆成独立组件，页面只保留数据加载、权限和 API 动作。
2. 给客户导出字段选择组件补前端单测或 smoke，覆盖最后一个字段不可取消、字段勾选变更正确回传。
3. 给导出任务列表补状态行为 smoke，覆盖 completed 下载、failed/expired 重新执行、无权限按钮禁用。
4. 复核企业管理 8 个页面的大文件体积，优先拆 `EnterpriseIndependentStationPage` 和 `EnterpriseSalesPlaybookPage` 的表格/表单区。

## 2026-04-22 下一阶段计划补充（十六）
1. 给客户导出四个子组件补前端测试或轻量 smoke：任务表单按钮禁用、字段筛选清空、字段选择最后一个不可取消、任务列表操作按钮权限。
2. 将 `EnterpriseCustomerExportPage` 内的字段筛选构建和字段选项加载逻辑抽成 hook，进一步让页面只保留权限、加载和 API 动作。
3. 继续拆企业管理大页面，优先处理 `EnterpriseIndependentStationPage` 的询盘表格和规则表单。
4. 回测企业管理 8 个路由的本地可渲染状态，确保近期拆分没有影响导航和页面加载。

## 2026-04-23 下一阶段计划补充（一）
1. 给客户导出 hook 补单元测试：字段加载分流、选项排序、筛选摘要、payload 构建和校验错误汇总。
2. 给客户导出组件补轻量前端测试：任务表单按钮禁用、字段选择最后一个不可取消、任务列表权限按钮。
3. 开始拆 `EnterpriseIndependentStationPage`：先拆询盘运营表格，再拆站点设置和分配规则表单。
4. 回测企业管理 8 个页面路由可渲染状态，补齐拆分后可能遗漏的导入路径和空状态。

## 2026-04-23 下一阶段计划补充（二）
1. 给客户导出组件补测试：字段选择最后一个不可取消、任务列表按权限禁用下载/重新执行、任务表单校验错误时禁用按钮。
2. 开始拆 `EnterpriseIndependentStationPage` 的询盘运营表格，抽出列表、筛选工具栏、批量处置工具栏和单条处置行组件。
3. 对照企业管理蓝图复核独立站模块：站点绑定、表单映射、分配规则、webhook 安全、询盘重处理、CRM 同步、备注同步是否都有测试或手工验证记录。
4. 回测企业管理路由：客户字段、字段布局、客户导出、回收站、来源流转、独立站、销售助手、报告模板、权限配置。

## 2026-04-23 下一阶段计划补充（三）
1. 开始拆 `EnterpriseIndependentStationPage` 的询盘运营表格，先抽 `EnterpriseWebsiteInquiryTable`，再抽筛选/批量操作工具栏。
2. 给独立站询盘表格补测试：状态筛选、分页、单条重处理、批量处置、负责人下拉显示 workspace member。
3. 对独立站后端补定向测试：webhook secret、字段映射缺失、CRM Person/Company 同步、note 同步、单条/批量重处理。
4. 回测企业管理 8 个路由，并记录页面是否可渲染、关键 API 是否进入鉴权层或返回业务数据。
## 2026-04-23 客户模块重开发进度核查与下一阶段计划

### 当前进度核查
- 已落地：客户模块保留 `trade-crm/customers` 路由命名空间，覆盖客户列表、公海客户、客户详情、客户查重、客户设置中心、客户导入配置入口。
- 已落地：后端客户域已拆出聚合 resolver/service，包括列表、公海、详情、查重、时间线、配置、导入、合并、线索转客户、商业摘要、AI insight、文档和操作历史。
- 已落地：客户主实体继续以 `company` 为准，联系人以 `person` 为从实体；前端详情页、列表页和新建入口已经围绕公司客户推进。
- 已落地：客户设置中心已从 localStorage 草稿升级为 workspace 持久化配置，并补充保存校验、未保存离开拦截、配置审计、快照导出/预览/选择性应用/风险确认/预览报告。
- 已落地：企业字段体系已接入客户列表筛选、列表列展示、新建客户、客户详情展示/编辑和客户导出筛选/导出字段，部分能力已下沉到后端过滤。
- 部分完成：公海规则执行、单个/批量认领、移入公海审计与时间线已接入，但仍需要规则执行定时化、角色权限和真实运营测试补齐。
- 部分完成：导入任务已支持任务记录、映射保存、提交、结果查看、CSV 下载、基础失败日志；仍缺真实文件解析、模板校验、多联系人归并和失败日志后端下载。
- 部分完成：详情页已接入时间线、资料、商机/交易摘要、文档、AI 容器、操作历史、企业字段；仍需更完整的报价/订单/邮件/聊天/日程事件回写验收。
- 已落地：客户配置快照逻辑已抽到 util，快照导入预览面板已拆成 `TradeCrmCustomerConfigSnapshotImportPanel`，设置中心保存/离开拦截/快照应用状态已拆成 `TradeCrmCustomerConfigStatusPanels`，配置审计历史已拆成 `TradeCrmCustomerConfigHistoryPanel`，公海规则已拆成 `TradeCrmCustomerConfigPublicPoolRulesPanel` 并补执行前校验，分组树编辑器已拆成 `TradeCrmCustomerConfigGroupTreeEditor`，客户导入设置与任务记录已拆成 `TradeCrmCustomerConfigImportPanel`，标签/来源字典已拆成 `TradeCrmCustomerConfigDictionaryPanels`，匹配规则已拆成 `TradeCrmCustomerConfigMatchingRulesPanel`，客户列表操作条已拆成 `TradeCrmCustomerListActionPanels`，客户列表筛选工具栏已拆成 `TradeCrmCustomerListToolbar`，客户列表内容区已拆成 `TradeCrmCustomerListContentPanels`，客户列表筛选/企业字段过滤/表格行构造已下沉到 `tradeCrmCustomerListUtils`，客户模块顶部 Tabs/侧边栏/设置二级 Tabs 已下沉到 `tradeCrmCustomerNavigation`，客户配置运行时草稿与公海分组聚合已下沉到 `useTradeCrmCustomerRuntimeConfig`，设置中心内容编排已拆成 `TradeCrmCustomerConfigContent`，配置 section label/未保存判断/公海分组聚合已下沉到 `tradeCrmCustomerConfigWorkspace`，快照预览/选择性应用/单 section 应用/预览状态重置已下沉到 `useTradeCrmCustomerConfigSnapshotManager` 并补 hook 测试，分组/标签/来源/导入文件名等本地编辑器状态已下沉到 `useTradeCrmCustomerConfigEditorState` 并补 hook 测试，未保存离开提醒/路由拦截/保存后继续/放弃草稿继续等导航守卫已下沉到 `useTradeCrmCustomerConfigNavigationGuard` 并补 hook 测试，配置工作区的 hero/insights/sidebar/workspaceContext 组装已下沉到 `tradeCrmCustomerConfigLayout` 并补工具测试，详情工作区的 hero/insights/sidebar/workspaceContext 组装已下沉到 `tradeCrmCustomerDetailLayout` 并补工具测试，公海客户搜索/认领/规则摘要已拆成 `TradeCrmCustomerPublicPoolPanels`，客户查重搜索/合并/范围说明已拆成 `TradeCrmCustomerDedupPanels`，页面只保留状态编排和持久化动作。
- 已落地：客户列表工作区的 hero/insights/sidebar/workspaceContext 组装已下沉到 `tradeCrmCustomerListLayout` 并补工具测试，`TradeCrmCustomersPage` 继续收敛为路由级装配与业务动作编排。
- 已落地：公海工作区的 hero/insights/sidebar/workspaceContext 组装已下沉到 `tradeCrmCustomerPublicPoolLayout` 并补工具测试，公海页继续保留搜索、认领和规则摘要动作，页面职责进一步收敛。
- 已落地：查重工作区的 hero/insights/sidebar/workspaceContext 组装已下沉到 `tradeCrmCustomerDedupLayout` 并补工具测试，查重页继续保留搜索、合并和命中列表动作，页面职责进一步收敛。
- 已落地：配置快照下载和预览报告下载已下沉到 `tradeCrmCustomerConfigDownload` 并补浏览器下载单测，主页面继续剥离纯函数工具逻辑。
- 已落地：顶部运营指标卡已拆成 `TradeCrmCustomerSignalsCards` 独立组件并补轻量渲染测试，主页面继续剥离纯展示结构。
- 已落地：公海页双栏布局壳已拆成 `TradeCrmCustomerTwoColumnWorkspaceSection` 独立组件并补轻量渲染测试，主页面不再保留双栏样式定义。
- 风险：`TradeCrmCustomersPage.tsx` 仍然过大，列表、设置、导入 UI 仍需继续拆组件和补测试。

### 下一阶段任务
1. 测试优先：为客户配置快照 util 补单元测试，覆盖兼容版本、旧版快照、结构错误、风险提示、选择性应用、报告导出 payload。
2. 组件拆分：继续拆 `TradeCrmCustomersPage.tsx`，优先拆客户模块路由壳和剩余纯函数到 util。
3. 导入增强：把客户导入从任务壳推进到真实文件解析、模板字段校验、同公司多联系人归并、失败日志后端持久化和下载。
4. 公海运营：补公海规则定时执行入口、执行结果可视化、规则命中预估、角色权限控制和批量认领权限校验。
5. 跨模块联动：补商机/报价/订单/邮件/聊天/日程事件的客户时间线回写验收用例，确保详情工作台不是静态拼装。
6. 回归自动化：新增客户模块 smoke，覆盖 `/trade-crm/customers/list`、`public`、`dedup`、`config/*`、详情页基础渲染和关键按钮禁用逻辑。

## 2026-04-23 客户模块后续开发计划与试运行记录

- 已新增详细计划文档：`客户模块后续开发计划与试运行记录.md`。
- 试运行通过：`nx lint:diff-with-main twenty-front`、客户模块 15 个测试文件共 32 个测试、`nx typecheck twenty-front`。
- 构建试运行：`nx build twenty-front` 中 Vite 已完成生产打包，输出 `TradeCrmCustomersPage` chunk；Nx 最终失败在 Windows 环境缺少 `sh` 的后置步骤，非客户模块编译错误。
- 下一步推荐：优先抽 `useTradeCrmCustomerCreateCustomerForm`，将客户新建表单状态、企业字段校验和保存逻辑从 `TradeCrmCustomersPage.tsx` 下沉。
## 2026-04-28 AMAIN CRM Xiaoman 对齐开发 TODO

### 目标
- 用明确的 TODO 板约束开发方向
- 优先解决影响试运行的核心业务问题
- 逐项收口，不再零散修补

### 当前任务状态
1. `completed` 修复 `lead -> customer` 幂等性
2. `completed` 为 lead conversion 增加最小单测
3. `completed` 为批量 lead 转化增加结果摘要
4. `completed` 收口 `Team` 的 Xiaoman 语义
5. `completed` 按 Xiaoman Page Contract 重构 Mail 工作面
6. `pending` 收口 `Automation / Settings / Admin` 的 Xiaoman 语义
7. `in_progress` 补 Mail / Customer / Opportunity 的上下文联动
8. `completed` 把待处理邮件动作联动到真实 Tasks，而不是只停留在工作区跳转
9. `completed` 修复 Mail `connectedAccounts` 查询过滤兼容问题，清掉 inbox 右下角错误提示
10. `completed` 修复 Mail customer 视角错误走 `/metadata` 的 GraphQL client 绑定问题
11. `completed` 将 Mail customer / subordinate 工作面比例压到更接近 Xiaoman 的三栏密度
12. `completed` 清理 Mail customer / subordinate 视角的主要运行态错误
13. `in_progress` 继续深链 Mail -> Customer / Opportunity / Task 的真实业务动作
    - 已完成：customer 视角去掉静态 workspace list 回退，避免把无数据状态伪装成假客户卡
    - 已完成：customer 视角空状态补可操作入口，直接给出“去邮件搜索补关联 / 打开客户工作台”
    - 已完成：pending-replies 视图现在会查询并匹配已存在 Task，优先给出“打开跟进任务”深链接
    - 已完成：Task 深链接保留 Mail source trail，打开真实任务记录时能回到 pending queue 上下文
    - 已完成：新增 core `tradeCrmMailThreadTaskLink` 绑定表与 GraphQL 读写口，pending-replies 现在优先按 `threadId -> taskId` 精确命中 Task
    - 已完成：`useOpenCreateActivityDrawer` 现在返回新建 activity id，Mail 在“创建跟进任务”后会立刻回写线程绑定
    - 已完成：`TradeCrmMailPage` 里的 thread-task query/mutation 明确切到 `useApolloCoreClient()`，dev runtime 现在能稳定读到 thread-task 精确绑定
    - 已完成：浏览器回归里 `pending-replies` 已出现“打开跟进任务”，不再只停留在“创建跟进任务”
    - 已完成：Task 详情页已经补上 Mail 来源横幅，能直接显示 `Mail / 待处理邮件`、`threadId` 和返回 pending queue 的入口
    - 已完成：从 Mail 打开的 `/object/task/...` 记录页已隐藏 Twenty 的 `工作区 / favorites` 导航壳，不再混回 `Sales Workbench`
    - 下一步：逐步把 `opportunity/company/person` 的近似匹配降为纯兜底，并考虑在 Task 页横幅里补 thread 摘要 / 发件人摘要

### 当前验收标准
- 同一条 lead 重复转换不会重复创建 customer / contact
- 同邮箱 contact 再次转换不会触发唯一约束失败
- 批量转换遇到历史重复数据不会整批中断
- Mail customer / subordinate 视角不再把业务查询错误打到 `/metadata`
- Mail customer / subordinate 视角需要稳定通过浏览器回归，且不再出现表单只读 warning
- 每完成一项都同步写入 `progress.md`

### 当前阻塞
- `twenty-server` 全量 typecheck 有仓库既有错误，不能作为本任务唯一收口标准
- 本地 raw GraphQL mutation 直连 `convertLeadToCustomer` 当前返回 403，运行回归需改用更稳定入口或单测
- 待处理邮件和客户视角已经完成浏览器级回归，但本地部分线程缺少 CRM 关联数据，深链接会按设计回退到工作区
- 外网字体请求在本地回归中会出现 `ERR_CONNECTION_CLOSED`，不影响主流程，但属于运行态噪音

## 2026-04-30 AMAIN Mailbox Phase 1 设计门槛

### 目标
- 将 Mail 模块从 CRM 邮件视图推进为企业邮箱工作台
- 采用管理员代绑阿里邮箱的模式
- 使用 IMAP + SMTP 作为主协议
- 保留 Twenty 的连接与同步底座，但由 AMAIN 接管产品层语义

### 当前任务状态
1. `completed` 明确 Phase 1 目标为完整邮箱台，而不是只做收件箱
2. `completed` 锁定管理员代绑模式，不走用户自绑主链
3. `completed` 锁定协议主链为 IMAP + SMTP，不以 POP3 为主
4. `completed` 确认实现策略为“复用 Twenty substrate + 新增 AMAIN mailbox domain + 重建 AMAIN mail workbench”
5. `completed` 输出正式设计文档 `docs/superpowers/specs/2026-04-30-amain-mailbox-phase1-design.md`
6. `pending` 等待用户审阅并确认设计文档
7. `pending` 用户确认后进入实现计划编写

### 当前验收标准
- 设计文档必须覆盖信息架构、数据模型、管理员分配流程、协议方案、权限模型、邮件工作台契约与验收标准
- 设计文档不得再以 Twenty 原生 connected-account 菜单为最终产品形态
- 后续实现必须围绕“管理员代绑 + 阿里邮箱 + IMAP/SMTP + 完整邮箱台”

## 2026-04-30 AMAIN Mailbox Phase 1 执行状态

### 当前任务状态
1. `completed` 落地 enterprise mailbox domain 实体：
   - `enterpriseMailboxProfile`
   - `enterpriseMailboxAssignment`
   - `enterpriseMailboxPermission`
   - `enterpriseMailboxRule`
   - `enterpriseMailThreadCrmLink`
2. `completed` 落地迁移 `1774900000000-add-enterprise-mailbox-control.ts`
3. `completed` 新增 profile service 与 assignment service 的最小单测
4. `completed` 新增后台 REST 入口：
   - `POST /api/enterprise/mailbox-profiles`
   - `GET /api/enterprise/mailbox-profiles`
   - `POST /api/enterprise/mailbox-profiles/:id/validate`
   - `GET /api/enterprise/mailbox-assignments`
   - `POST /api/enterprise/mailbox-assignments`
   - `GET /api/enterprise/mailbox-health`
5. `completed` 把 mailbox backend 注册进 `EnterpriseManagementModule`
6. `completed` Admin 前端 Mailbox Control 路由与页面
   - 已接入 `Mailbox Accounts / Assignments / Rules / Health` 路由
   - 已接入 Admin 菜单、权限码和企业导航分组
   - 已通过浏览器回归确认 3 个主页面真实可打开
7. `in_progress` Mailbox Assignments 列表继续补运营信息
   - 已完成：后端 `GET /api/enterprise/mailbox-assignments`
   - 已完成：Assignments 页面当前分配列表回显
   - 下一步：补 mailbox profile 选择器与 workspace member 选择器，替换手工输入 id
8. `pending` Mail 工作台完整邮箱行为

### 当前验收结果
- `enterprise-mailbox-profile.service.spec.ts` 通过
- `enterprise-mailbox-assignment.service.spec.ts` 通过
- `EnterpriseMailboxControlPages.test.tsx` 通过
- `npx nx build twenty-server` 通过
- `corepack yarn nx build twenty-front` 通过

## 2026-05-05 AMAIN Mailbox Admin 当前推进

### 当前任务状态
1. `completed` 找到并使用 mailbox 迁移的正确强制执行入口
   - 命令：`node dist/command/command.js run-typeorm-migration --force`
   - 结果：`AddEnterpriseMailboxControl1774900000000` 已实际执行
2. `completed` 确认 mailbox core 表已落库
   - `enterpriseMailboxProfile`
   - `enterpriseMailboxAssignment`
   - `enterpriseMailboxPermission`
   - `enterpriseMailboxRule`
3. `completed` 通过真实 REST API 创建本地 mailbox 样本数据
   - mailbox profile：`sales.alibaba.demo@amaincrm.local`
   - assignment：绑定到 `Tim Apple`
   - rule：`Pending reply triage`
4. `completed` 确认 `GET /api/enterprise/mailbox-profiles`
   - `GET /api/enterprise/mailbox-assignments`
   - `GET /api/enterprise/mailbox-rules`
   在当前运行态都能返回真实数据
5. `completed` 收口 mailbox admin 页面测试阻塞
   - 为 `EnterpriseMailboxControlPages.test.tsx` 补 `twenty-ui/input` 的 `Button` mock
6. `in_progress` 清理 mailbox admin 页面和 hooks 的历史乱码/过渡实现
   - 已完成：`EnterpriseMailboxAccountsPage`
   - 已完成：`EnterpriseMailboxHealthPage`
   - 已完成：profiles / assignments / health hooks
7. `pending` 把 `Mailbox Assignments` 的手工输入彻底替换为真实选择器工作流
8. `in_progress` 把 `Mailbox Rules` 从当前基础列表推进到可编辑规则台
   - 已完成：后端新增 `PATCH /api/enterprise/mailbox-rules/:id`
   - 已完成：规则列表现在回显 `emailAddress`
   - 已完成：规则页支持 `Enable rule / Disable rule`
   - 已完成：规则页支持行内编辑 `name / priority`
   - 下一步：补规则条件/动作 JSON 的受控编辑入口，不再只停留在基础元信息
9. `in_progress` 把 `Mailbox Assignments` 推进成可维护的权限运营面
   - 已完成：后端新增 `PATCH /api/enterprise/mailbox-assignments/:id`
   - 已完成：assignment service 支持更新 `permissionCodes`
   - 已完成：assignment service 支持更新
     - `canManageRules`
     - `canViewSubordinates`
     - `canHandleSubordinates`
   - 已完成：Assignments 页面支持行内编辑权限包和 subordinate controls
   - 已完成：Assignments 页面支持 `Suspend assignment / Reactivate assignment`
   - 已完成：Assignments 创建区支持真实 workspace member / mailbox account 选择器
   - 已完成：Assignments 创建区支持 `primary mailbox / canManageRules / canViewSubordinates / canHandleSubordinates`
   - 已完成：Assignments 创建区支持 mailbox readiness / duplicate assignment 提示，并阻止重复分配
   - 已完成：后端阻止同一成员出现第二个 `active primary mailbox`
   - 已完成：创建区提示当前 primary sender，并阻止主邮箱冲突分配
   - 已完成：创建区提示 `shared mailbox mode`，展示当前 primary sender route 和 active assignees
10. `in_progress` 把 `Mailbox Rules` 推进成轻量结构化编辑台
   - 已完成：pending reply rule 创建区不再依赖裸 JSON，已支持结构化配置
     - `folder`
     - `maxReplyDelayHours`
     - `onlyUnread`
     - `createTask`
     - `escalateToManager`
     - `applyPendingTag`
   - 已完成：pending reply rule 行内编辑不再依赖裸 JSON，已支持结构化配置
   - 已完成：folder routing rule 创建区不再依赖裸 JSON，已支持结构化配置
     - `sourceFolder`
     - `targetFolder`
     - `senderDomain`
     - `subjectKeyword`
     - `markAsRead`
     - `stopFurtherRules`
   - 已完成：folder routing rule 行内编辑不再依赖裸 JSON，已支持结构化配置
   - 已完成：保留非 pending-reply 规则的 JSON fallback，避免挡住其他规则类型
   - 已完成：customer auto-link 创建区不再依赖裸 JSON，已支持结构化配置
     - `senderDomain`
     - `onlyUnlinkedThreads`
     - `requireKnownContact`
     - `linkToPerson`
     - `linkToCompany`
     - `attachToLatestOpportunity`
     - `createLeadWhenUnmatched`
   - 已完成：customer auto-link 行内编辑不再依赖裸 JSON，已支持结构化配置
   - 已完成：subordinate escalation 创建区不再依赖裸 JSON，已支持结构化配置
     - `sourceFolder`
     - `maxReplyDelayHours`
     - `onlyAssignedThreads`
     - `createTask`
     - `notifyOwner`
     - `escalateToManager`
     - `reassignToPrimarySender`
   - 已完成：subordinate escalation 行内编辑不再依赖裸 JSON，已支持结构化配置
   - 已完成：规则页新增 `Rule coverage and recent activity` 运营摘要面板
   - 已完成：后端新增 `GET /api/enterprise/mailbox-rules/activity`
   - 已完成：规则页回显
     - `Active rules`
     - `Managed mailboxes`
     - `Pending reply rules`
     - `Routing and linking rules`
   - 已完成：规则页回显最近配置活动
     - `When`
     - `Action`
     - `Rule`
     - `Mailbox`
     - `Type`
   - 已完成：规则页新增 `Rule readiness preview`
   - 已完成：后端新增 `GET /api/enterprise/mailbox-rules/readiness`
   - 已完成：readiness preview 当前检查
     - mailbox `status / validationStatus`
     - active assignee 数量
     - primary sender 数量
     - message channel 是否已接通
     - source/target folder 是否存在于当前 channel
   - 已完成：规则页支持逐条 `Preview rule`
   - 已完成：后端新增 `GET /api/enterprise/mailbox-rules/:id/preview`
   - 已完成：dry-run preview 当前返回真实线程候选样本
     - `threadId / messageId`
     - sender handle
     - subject / receivedAt
     - pending / task linked / CRM linked
     - matched signals
     - planned actions
   - 已完成：规则页新增 `Recent rule results`
   - 已完成：后端新增 `GET /api/enterprise/mailbox-rules/results`
   - 已完成：preview 调用现在会写入结果表，明确区分
     - `executionType = preview`
     - `outcome = matched / no-match / blocked`
   - 已完成：规则页支持 `Run rule now`
   - 已完成：后端新增 `POST /api/enterprise/mailbox-rules/:id/run`
   - 已完成：`pending-reply` 规则 runtime 当前会真实执行
     - thread state -> `isPending = true`
     - optional `pending-reply` tag
     - optional follow-up task creation
     - thread -> task link 回写
     - runtime result 写入 `enterpriseMailboxRuleResult`
   - 已完成：`folder-routing` 规则 runtime 当前会真实执行
     - message-channel association 从 source folder 迁移到 target folder
     - runtime result 明确记录 `targetFolderId / targetFolderName`
     - `markAsRead` 当前不伪造执行，会写入 `unsupportedActions = ['markAsRead']`
   - 已完成：`customer-auto-link` 规则 runtime 当前会真实执行
     - 复用 preview 命中的 `personId`
     - 通过 `person -> company -> latest opportunity` 回写 thread CRM link
     - runtime result 明确记录 `personId / companyId / opportunityId`
     - `createLeadWhenUnmatched` 当前不伪造执行，会写入 `unsupportedActions = ['createLeadWhenUnmatched']`
   - 已完成：`subordinate-escalation` 规则 runtime 当前会真实执行
     - 按 `maxReplyDelayHours` 做 runtime 阈值判断
     - `onlyAssignedThreads` 未满足时会明确写 `skipped`
     - 会把 thread 标成 pending
     - 可创建 escalation follow-up task
     - 可把任务指派给 manager handler 或 primary sender
     - `notifyOwner` 当前不伪造执行，会写入 `unsupportedActions = ['notifyOwner']`
   - 当前下一步：补浏览器回归，并把 runtime 结果在 Rules 页面上更明确地区分 preview / acted / skipped / failed

### 当前验收结果
- `npx jest packages/twenty-front/src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx --config=packages/twenty-front/jest.config.mjs --runInBand` 通过
- `npx jest packages/twenty-front/src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx --config=packages/twenty-front/jest.config.mjs --runInBand` 13/13 通过
- `npx jest packages/twenty-front/src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx --config=packages/twenty-front/jest.config.mjs --runInBand` 15/15 通过
- `npx jest packages/twenty-front/src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx --config=packages/twenty-front/jest.config.mjs --runInBand` 19/19 通过
- `npx jest src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-rule.service.spec.ts --config=jest.config.mjs` 通过
- `npx jest src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-rule.service.spec.ts --config=jest.config.mjs --runInBand` 7/7 通过
- `npx jest src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-rule.service.spec.ts --config=jest.config.mjs --runInBand` 8/8 通过
- `npx jest src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-rule.service.spec.ts --config=jest.config.mjs --runInBand` 9/9 通过
- `npx jest packages/twenty-front/src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx --config=packages/twenty-front/jest.config.mjs --runInBand` 6/6 通过
- `corepack yarn nx typecheck twenty-front` 通过
- `corepack yarn nx build twenty-front` 通过
- `npx nx build twenty-server` 通过
- 当前 mailbox admin 真实运行依赖已满足，后续阻塞不再是“表不存在”或“页面测试挂掉”
- assignment 权限编辑链路已经具备前后端闭环，当前待确认点只剩浏览器运行态回归和一次前端 Jest 模块解析抖动
- 已完成：`Rules` 页结果面已经改成运营可读视图
  - 区分 `Dry-run preview / Live run`
  - 区分 `Preview would act / Actions applied / Skipped by guardrail / Execution failed`
  - 回显 `Thread / Task / Unsupported actions / Signals / Planned actions`
  - 回显结果摘要计数：
    - `Dry-run previews`
    - `Actions applied`
    - `Skipped / no candidates`
    - `Failed runs`
- 当前下一步：对 `Rules` 页做一次浏览器回归，确认 `Run rule now` 后结果列表在真实页面上清晰可读

- [x] Recover live `Mailbox Rules` preview/run runtime on the real Rules page
  - [x] fix backend DI for `TradeCrmMailThreadTagEntityRepository`
  - [x] wrap mailbox message-channel reads with workspace ORM context
  - [x] apply `AddEnterpriseMailboxRuleResult1776200000000` migration
  - [x] verify `preview / run / results` return `200/201` on localhost
  - [x] verify `/enterprise/mailbox/rules` shows live result rows
- [x] Connect a validated mailbox profile to a synced local-development message channel so rules can operate on candidate threads
  - [x] local `@amaincrm.local` mailbox profile now provisions `connectedAccountId` and `messageChannelId`
  - [x] live `preview / run / results` paths now operate on candidate threads instead of failing on readiness
- [x] Add live mailbox validation diagnostics and persist the failure reason on mailbox profiles
  - [x] migration `1776500000000-add-enterprise-mailbox-validation-error` applied through `npx nx run twenty-server:database:migrate`
  - [x] `GET /api/enterprise/mailbox-profiles` and `GET /api/enterprise/mailbox-health` now return `lastValidationError`
  - [x] live `POST /api/enterprise/mailbox-profiles/:id/validate` now fails with the real IMAP TLS error instead of a generic failure
  - [x] Mailbox Accounts now surfaces the exact validation error
  - [x] Mailbox Rules creation is blocked when the selected mailbox is still `pending` or `failed`
- [x] Replace the old demo-mailbox blocker with a stable local-development mailbox transport
  - [x] current seeded mailbox `sales.alibaba.demo@amaincrm.local` is `validated`
  - [x] current seeded mailbox reports `lastSyncStatus = ACTIVE`
  - [x] mailbox admin is no longer blocked by the old IMAP TLS sample failure
- [x] Make `Rules` results surface read like an operator panel instead of a raw log
  - [x] add per-rule `Last result` summary to the rules table
  - [x] split result summary into `Dry-run previews / Live runs / Actions applied / Blocked-failed / Skipped-no candidates`
  - [x] keep `preview / runtime` visibly distinct on the page
  - [x] verify via mailbox-control page test, `typecheck`, and `twenty-front` build
- [x] Run browser-level regression on `/enterprise/mailbox/rules` and confirm `Last result` plus runtime counters render clearly in the live page
  - [x] live screenshot and JSON report captured for the operator-surface pass
- [x] Add result filters to `Rules` so operators can isolate one rule or one execution outcome
  - [x] `Filter by rule`
  - [x] `Filter by result type`
  - [x] summary cards now recalculate from the filtered result set
  - [x] mailbox-control rules page test updated and passing
- [x] Add expandable thread-level result details under each runtime row
  - [x] keep the current summary row intact
  - [x] add `Show result details / Hide result details`
  - [x] expand thread, task, CRM link, matched signals, planned actions, and unsupported actions inline
  - [x] mailbox-control rules page test updated and passing
- [x] Show per-rule run feedback directly under the current rule row after `Run rule now`
  - [x] add `Show latest run feedback / Hide latest run feedback`
  - [x] auto-expand the current rule after a successful `Run rule now`
  - [x] surface execution, outcome, time, summary, and thread/task/CRM detail inline
  - [x] mailbox-control rules page test updated and passing
- [x] Run browser-level regression on `/enterprise/mailbox/rules` and confirm the new rule-row feedback panel reads cleanly next to `Preview rule` and `Run rule now`
  - [x] live `Run rule now` now expands inline feedback without showing a failure snackbar
  - [x] current rule row and global results ledger stay in sync after a successful run

- [x] Recover live `Run rule now` runtime when thread state already exists
  - [x] replace blind thread-state inserts with `workspaceId + threadId` upsert logic
  - [x] verify live `POST /api/enterprise/mailbox-rules/:id/run` returns `201` with `executedCount`
  - [x] restart stable backend so localhost serves the fixed runtime path
- [x] Make mailbox-rule result ids actionable links
  - [x] `task / person / company / opportunity` ids now render as record links in result details
  - [x] per-rule latest feedback panel reuses the same record links
  - [x] re-run a browser click-path against a live result row that includes CRM ids and confirm navigation keeps AMAIN navigation semantics
  - [x] verified person-record navigation from `Recent rule results`
  - [x] verified record page does not reintroduce Twenty `工作区` navigation

- [ ] Next: move back to the mailbox workbench and add more true inbox behavior
  - [ ] batch toolbar actions for selected threads
  - [ ] reply / forward surface on selected-thread detail
  - [ ] make pending / inbox / unread behave like a real mailbox first, not just a CRM-adjacent thread list
