# Trade CRM 一期收敛基线（2026-04-15）

## 1. 文档基线与覆盖规则

### 1.1.1 主线基线冻结

- 当前主线文档（A 层）:
  - `../外贸CRM重构版开发计划（结构化模块_可独立开发维护）.md`
  - `../本项目Agent编排使用手册（阶段_产物_验收）.md`
- 稳定边界文档（B 层）:
  - `../外贸CRM全局详细设计方案（全栈架构_模块关系_落地步骤）.md`
  - `../Twenty实施版对象创建与配置顺序.md`
  - `../一期字段配置表（后台版_导入模板版_示例数据版）.md`
  - `../一期标准字典清单.md`
  - `../一期自动化规则清单.md`
  - `../销售每日使用动作清单（系统操作版）.md`
  - `../主管每日检查版SOP与周复盘模板.md`
  - `../一期上线后的销售使用规范与管理规则.md`
- 固定验收命令集合:
  - `npm run verify:trade-crm-phase1-readiness`
  - `npm run verify:trade-crm-phase1-readiness:full`
  - `npm run verify:trade-crm-smoke:local`
  - `npm run verify:trade-crm-phase1-business-trial-readiness`
  - `npm run prepare:trade-crm-phase1-business-trial-pack`
  - `npm run review:trade-crm-phase1-business-trial-pack`
  - `npm run verify:trade-crm-phase1-convergence`

### 1.2.1 文档一致性修复

- 参考类文档（C 层）仅用于历史追踪，不再单独作为主线约束:
  - `../task_plan.md`
  - `../progress.md`
  - `../findings.md`
- 冲突处理规则:
  - 同主题冲突时，以 A 层主线文档为准。
  - C 层保留历史信息，但冲突内容标记为“已被覆盖”。

## 2. 主工作面验收基线

### 2.1.1 销售工作台主路径验收

- 主路径:
  - 新 Lead 进入
  - 自动分配负责人
  - 自动生成首响任务
  - 超时提醒与跟进进入下一动作
- 验收证据来源:
  - `tmp/trade-crm-smoke/last-smoke-summary.json`
  - `tmp/trade-crm-smoke/ops-report.md`
  - `tmp/trade-crm-smoke/ops-weekly-summary.md`

### 2.2.1 Lead 工作面验收

- 验收点:
  - 字段完整性
  - 状态流转
  - 任务联动
  - 负责人规则加载
- 命令:
  - `npm run verify:trade-crm-smoke:local`
  - `npm --workspace packages/twenty-server run verify:trade-crm-automations`

### 2.3.1 客户/商机工作面验收

- 验收点:
  - Quotation Sent 3 天自动跟进
  - Opportunity 7 天未更新标记 stalled
  - 主管检查面可复现关键指标
- 证据:
  - `tmp/trade-crm-smoke/last-smoke-summary.json`
  - `tmp/trade-crm-smoke/post-launch-assignment-stack-report/post-launch-assignment-stack-report.md`

## 3. 自动化与安全边界

### 3.1.1 一期自动化规则收敛矩阵

| 规则 | 触发 | 动作 | 验证命令 | 证据 |
| --- | --- | --- | --- | --- |
| 新 Lead 自动分配负责人 | Lead 入站 | 写入 owner | `verify:trade-crm-smoke:local` | `last-smoke-summary.json` |
| 新 Lead 自动生成首响任务 | Lead 创建后 | 创建任务 | `verify:first-response-flow` | `ops-state.json` |
| Lead 12 小时未首响提醒 | SLA 超时 | 生成提醒任务/状态 | `verify:first-response-flow` | `ops-exceptions.json` |
| Quotation Sent 后 3 天未更新自动跟进 | 商机停留 | 生成跟进任务 | `verify:trade-crm-automations` | `last-smoke-summary.json` |
| Opportunity 7 天未更新标记 stalled | 商机停留 | 标记 stalled 并联动任务 | `verify:trade-crm-automations` | `last-smoke-summary.json` |

### 3.2.1 自动化安全边界复核

- AI 只提供建议，不直接改关键状态:
  - 代码边界信号: `integration-hub/src/modules/ai-assistant/ai-assistant.service.ts` 中 `stateMutationAllowed: false`
- 禁止越权:
  - 不允许自动关闭、自动赢单、自动失单。
  - 主状态变更必须通过 CRM 业务动作链显式触发。

## 4. integration-hub 一期定版

### 4.1.1 最小生产配置

`integration-hub/src/config/env.ts` 的一期最小必需配置:

- `TWENTY_BASE_URL`
- `TWENTY_API_KEY`
- `TWENTY_WEBHOOK_SECRET`
- `ALIBABA_SHARED_SECRET`
- `REDIS_URL`
- `INTEGRATION_HUB_STATE_BACKEND`
- `INTEGRATION_HUB_STATE_PG_URL`（当 state backend 为 postgres）

### 4.2.1 失败路径可运维化

- 重试入口:
  - `POST /scheduler/retry-sweep?force=true`
- 健康检查入口:
  - `POST /scheduler/health-check`
  - `GET /scheduler/status`
- 运维观察面:
  - `GET /ops/state`
  - `GET /ops/exceptions`
- 必要产物:
  - `tmp/trade-crm-smoke/ops-state.json`
  - `tmp/trade-crm-smoke/ops-exceptions.json`
  - `tmp/trade-crm-smoke/ops-report.md`
  - `tmp/trade-crm-smoke/ops-weekly-summary.md`

## 5. 上线前组织闭环与 UAT

### 5.1.1 组织配置闭环

- 负责人和级别维护文件:
  - `trade-crm-lead-assignment.phase1-pool-staffing-template.csv`
  - `trade-crm-lead-assignment.phase1-pool-staff-level-template.csv`
- 激活审批:
  - `trade-crm-post-launch-runtime-assignment-activation.approval.template.json`
  - `trade-crm-post-launch-runtime-assignment-activation.approval.json`
- 闭环判断:
  - `npm --workspace packages/twenty-server run review:trade-crm-post-launch-assignment-stack`
  - 目标状态: `stack_ready_for_runtime_wiring`

### 5.2.1 UAT 演示脚本（销售/主管双视角）

销售视角:

1. 进入 `trade-crm/workbench`
2. 处理 Today New Leads
3. 处理 Tasks Due Today
4. 处理 My Pipeline Needing Next Action
5. 查看 Lead First Response Risk 并执行跟进

主管视角:

1. 查看新线索处理及时性
2. 查看首响超时与风险项
3. 查看 stalled 商机与跟进动作
4. 复核团队执行节奏与下周修正动作

## 6. 阶段交付与进度机制

### 6.1.1 阶段验收与交付包

- 标准交付包最小内容:
  - 代码状态（本次变更范围）
  - 验证结果（命令 + 产物文件）
  - 已知风险
  - 下一阶段入口
- 统一汇总命令:
  - `npm run verify:trade-crm-phase1-convergence`
- 汇总产物:
  - `tmp/trade-crm-convergence/phase1-convergence-summary.json`
  - `tmp/trade-crm-convergence/phase1-convergence-summary.md`

### 6.2.1 周报/进度机制统一

- 周报与进度统一模板:
  - `docs/trade-crm-phase1-progress-weekly-template.md`
- 输出要求:
  - 必须引用实际命令结果和实际文件
  - 不允许脱离代码现状的空泛描述
