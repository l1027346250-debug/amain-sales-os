# AMAIN Sales OS 软件开发情况整理

> 整理日期：2026-10-13
> 代码基线：`amainCRM` 仓库 `main` 分支（HEAD `48c0e595`，2026-05-08）
> 项目版本：`v0.3.0-dev`（开发版）

---

## 一、项目定位（一句话结论）

**AMAIN Sales OS 是一套面向外贸团队的「销售操作系统」**，基于开源 CRM 平台 **Twenty** 二次开发，对标小满 CRM / OKKI，目标是把外贸销售从「线索接入 → 首响跟进 → 客户转化 → 商机推进 → 邮件沟通 → 主管检查」的全链路，收敛进一个可日常作业的工作台。

产品定位已从早期的「在 Twenty 上挂一层 Trade CRM 页面」正式升级为「以 Twenty 为平台底座、允许按外贸业务语义改造核心的外贸 CRM 产品」。该转向记录在 `docs/amaincrm-xiaoman-aligned-rebuild-plan.md`（2026-04-24）与 `docs/amaincrm-phase1-xiaoman-aligned-blueprint.md`（2026-04-28）两份主线文档中。

---

## 二、技术栈与工程结构

| 层次 | 技术选型 |
| --- | --- |
| 仓库形态 | Nx Monorepo + Yarn 4（19 个 workspace 包） |
| 前端 | React 18 + TypeScript + Jotai（状态）+ Linaria（样式）+ Vite |
| 后端 | NestJS + TypeORM + PostgreSQL + Redis + GraphQL（GraphQL Yoga）+ BullMQ |
| 集成中台 | 独立 `integration-hub` 服务（NestJS，与主系统解耦） |
| 许可 | AGPL-3.0（继承自上游 Twenty） |

**职责边界（三方分工）：**

- **Twenty Core = CRM 核心**：Lead / Company / People / Opportunity / Task 等对象、字段、视图、最小自动化。
- **integration-hub = 集成与编排中台**：阿里国际站 / 邮件 / WhatsApp / ERP 等外部系统接入，去重匹配、规则编排、webhook、scheduler / retry / queue / 同步状态 / 日志。
- **AI = 增强层**：线索评分、摘要、跟进建议、内容生成；严禁直接改写关键业务主状态。

---

## 三、自研代码规模

| 统计口径 | 数量 |
| --- | --- |
| 仓库受管文件总数（git tracked） | 20,526 |
| 自研前端模块 `trade-crm/` | 124 个文件（11 个子域） |
| 自研前端模块 `enterprise/` | 10 个文件 |
| 企业管理前端页面 | 13 个页面（`pages/enterprise/`） |
| `integration-hub` 源码 | 100 个受管文件 / 16 个功能模块 |
| 企业管理后端模块（含 entity/dto/service/controller） | 约 202 个文件 |
| 自研 core 迁移（migration） | 40 个（覆盖字段、导出、回收、来源、独立站、销售助手、邮箱、权限等） |
| 项目文档 `docs/` | 31 个 |
| 验证 / 交付脚本 `scripts/` | 26 个 |
| 开发日志 | 176 轮（`docs/dev-log.md`，4,295 行） |
| Git 提交 | 43 次（2026-04-16 首次提交 → 2026-05-08 最新） |

**前端 `trade-crm/` 子域：** analytics、collaboration、customers、mail、navigation、opportunities、prospecting、record-show、settings、shared、workbench。

**`integration-hub` 模块：** ai-assistant、audit-log、classification、deduplication、health、inbound、lead-intake、lead-monitoring、opportunity-monitoring、ops、outbox、routing、scheduler、sync-jobs、twenty-client、webhooks。

---

## 四、功能模块完成情况

### 4.1 一级工作面（前端信息架构）

| 工作面 | 页面文件 | 状态 |
| --- | --- | --- |
| Sales Workbench 销售工作台 | `TradeCrmWorkbenchPage` | 已重构为 action-first 工作面 |
| Prospecting / Leads 线索 | `TradeCrmProspectingPage` | 第一轮 IA 重置完成 |
| Customers 客户 | `TradeCrmCustomersPage` | 列表 / 公海 / 详情 / 查重 / 设置 / 导入 |
| Opportunities 商机 | `TradeCrmOpportunitiesPage` | 看板 / 报价跟进 / stalled / 丢单分析 |
| Mail 邮件 | `TradeCrmMailPage` | 三栏工作面（收件箱 / 客户 / 下属）重构 |
| Collaboration 协作 | `TradeCrmCollaborationPage` | 已落地 |
| Analytics 分析 | `TradeCrmAnalyticsPage` | 已落地 |
| Settings 设置 | `TradeCrmSettingsPage` | 已落地 |

### 4.2 企业管理（Enterprise Operations，13 个页面）

| 页面 | 能力 | 状态 |
| --- | --- | --- |
| 自定义字段 / 字段中心 | 字段定义、字段值、字段布局 | 已落地，接入客户页读写 |
| 字段布局 | create / detail / edit / list 场景渲染 | 已落地 |
| 客户导出 | 任务创建、字段过滤、权限过滤、下载审计 | 已落地 |
| 回收箱 | 按资源类型查看 / 恢复 / 永久清空 | V1 已落地 |
| 工作报告模板 | CRUD + 内容 + 启停 | 已落地（兼容 REST API 已补齐） |
| 获客来源流转 | 来源分类、转化规则、黑名单 | V2 已落地 |
| 独立站管理 | 站点绑定、字段映射、分配规则、webhook 入站 | V2 已落地，含安全密钥、重处理、CRM 同步 |
| 销售助手管理 | 标准流程、阶段维护、阶段内容 | V3 已落地 |
| 企业权限配置 | 角色权限持久化 + 前端配置页 | 已落地（细粒度权限可持久化） |
| 邮箱账号管理 | 邮箱账号维护 | 已落地 |
| 邮箱分配 | 账号分配规则 | 已落地 |
| 邮箱健康 | 运行诊断 | 已落地 |
| 邮箱规则 | 邮箱规则运行时 | 已落地 |

### 4.3 integration-hub 一期

已交付：基础骨架、Twenty API client、webhook handler、lead ingestion、deduplication、scheduler / retry skeleton，并扩展到分类、路由、outbox、审计、AI 助手、监控等 16 个模块。

### 4.4 一期自动化

新 Lead 自动分配负责人 / 自动生成首响任务 / 12 小时未首响提醒 / 报价后 3 天未更新跟进 / Opportunity 7 天未更新标记 stalled —— 均已纳入 `workspace-init-trade-crm-automations` 命令体系。

---

## 五、已通过的验证与交付里程碑

| 日期 | 里程碑 | 结论 |
| --- | --- | --- |
| 2026-04-13 | Trade CRM Phase 1 交付验收（`9.3.1`–`9.3.6`） | **accepted**，无失败项 |
| 2026-04-15 | Phase 1 收敛基线（模块 `1.1.1`–`6.2.1`） | 已固化 |
| 2026-04-21 ~ 04-22 | 企业管理模块复核 | 8+ 页面路由 200，后端 API 进入鉴权层（403） |
| 2026-04-24 | 小满对齐重建计划启动 | 主线转向 |
| 2026-04-28 | Phase 1 小满对齐蓝图 | 阶段执行契约 |
| 2026-05-08 | 最新提交：邮箱规则运行时与诊断打磨 | — |

**验证体系（26 个脚本）：** smoke（开发/CI/严格 CI）、readiness、delivery-audit、convergence、business-trial、trial-run、UAT demo、handoff package、weekly report 等，配套 `.github/workflows/ci-trade-crm-smoke.yaml`。

**已通过的关键检查项：** `frontend-typecheck`、`integration-hub-typecheck`、`phase1-delivery-audit`、`sales-workbench-runtime-walkthrough`（4 张工作面卡片全部挂载、无 console error）、`phase1-business-trial-readiness`。

---

## 六、当前进行中工作（截至最新提交）

1. **小满对齐的工作面深化**：`Sales Desk / Leads / Customers / Opportunities` 已完成第一轮信息架构重置，正在向「操作系统级」业务深度推进。
2. **Mail 邮件工作面**：已把 inbox / customer / subordinate 调整为接近小满的三栏高密度工作面，正在压缩指标卡与解释性文案。
3. **Lead → Customer 转换幂等性**：`customer-lead-conversion.service.ts` 已加入三层复用逻辑（timeline 判断 → 主邮箱复用 person → 公司名复用 customer），解决重复邮箱命中唯一约束问题。
4. **邮件线程草稿**：新增 `trade-crm-mail-thread-draft` 实体与 GraphQL mutations（未提交变更）。
5. **UI 基线统一**：Round 174/175 建立 warm editorial 风格 token，并扩展到客户 / 商机工作面。

---

## 七、已知缺口与风险

| 级别 | 缺口 / 风险 |
| --- | --- |
| P0 | 仓库存在**未提交改动**（6 个新增文件 + 7 个修改文件），需先收敛提交 |
| P0 | 本地登录链路不自动写入 `tokenPair` cookie，联调需手工注入 token |
| P1 | 客户列表企业字段筛选仍为前端当前页过滤，未完全下沉后端全量分页 |
| P1 | `twenty-server` 全量 typecheck 受上游非企业模块既有类型问题影响，后端以 `nx build` 为验证口径 |
| P1 | 企业管理页面文件偏大（`EnterpriseIndependentStationPage` / `EnterpriseSalesPlaybookPage` 等），需继续拆组件 |
| P1 | `enterprise.*` 权限码底层仍 fallback 到 Twenty `ENTERPRISE/WORKSPACE` flag |
| P2 | 部分内层记录块仍保留 Twenty 默认样式，未完成全仓视觉统一 |
| P2 | 手机号登录为前端占位，后端 SMS 流程未实现 |
| P2 | `docs/dev-log.md` 中部分历史路径（如 `twenty-1.20.0`）已失效，属历史记录 |

---

## 八、下一阶段计划

1. 收敛未提交改动并形成稳定提交基线。
2. 继续拆分企业管理大页面，降低单页复杂度。
3. 客户列表企业字段筛选下沉后端，复用导出的 `enterpriseFieldFilters` 语义。
4. 邮箱模块（账号 / 分配 / 健康 / 规则）运行态联调与回归。
5. 完善企业管理 smoke 脚本，覆盖 8+ 路由与关键 API 鉴权。
6. 建立发布流程：开发版 tag、源码包、GitHub Release。

---

## 九、项目重命名与发布说明

- **原名称**：包名 `twenty`（上游继承），目录名 `amainCRM`，产品内部称 AMAIN CRM / Trade CRM。
- **新名称**：**AMAIN Sales OS**（包名 `amain-sales-os`）。
- **重命名落地**：`package.json` 的 `name` 与 `version`、`README.md` 品牌头、本状态文档。
- **开发版本**：`v0.3.0-dev`。
- **发布物**：全量源码包（排除 node_modules / dist / .git / 运行产物）+ GitHub 开发版 Release。
