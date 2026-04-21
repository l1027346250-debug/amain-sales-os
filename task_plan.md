# 企业管理模块开发计划

## 当前复核时间
2026-04-21

## 总目标
按 `G:\codex\xiaomanCRM\docs\enterprise-management-prd-page-field-list.md` 与 `G:\codex\xiaomanCRM\docs\enterprise-management-technical-blueprint.md` 落地企业管理模块，不做纯前端壳，必须包含表结构、API、权限入口、前端交互和可验证闭环。

## 当前落地状态
- 已落地：企业管理入口、二级菜单、权限 guard、本地开发放行。
- 已落地：自定义字段 `field_definition`、字段选项、字段显示、字段值表、metadata projection 基础链路。
- 已落地：客户导出异步任务、对象存储文件、签名下载、过期清理、失败重试。
- 已落地：工作报告模板、模板版本、预览、默认模板、启停。
- 已落地：回收箱后端表/API/恢复/清空/审计，前端资源 tabs、列表、快照、恢复、清空。
- 已落地：获客来源流转配置后端和外部来源执行器，前端来源 tabs、规则表、规则编辑、黑名单。
- 已落地：独立站管理、站点绑定、表单映射、分配规则、webhook 入站落库骨架。
- 已落地：销售助手 Playbook、阶段内容、业务侧读取接口，前端流程、阶段、内容三栏工作台。
- 风险：最近提交包含 `.codex-runtime`、`.playwright-cli`、`.npm-cache` 等运行产物，后续提交需要只纳入业务代码。

## 下一阶段计划
1. 回收箱 V1：新增 recycle record entity、迁移、service、controller，支持 list/detail/restore/purge/purge resource type，并写审计。
2. 回收箱前端：替换 placeholder，做资源 tabs、列表、详情快照、恢复、清空确认、状态展示。
3. 回收箱验证：server/front typecheck，必要时跑迁移和接口冒烟。
4. 来源流转 V2：source convert rule/blacklist 表与 API，前端规则表和编辑抽屉。
5. 独立站 V2：site binding/form mapping/assignment rule/webhook 入站骨架。（已完成）
6. 销售助手 V3：playbook/stage/item 表与 API，前端阶段和内容编辑。（已完成）

## 当前执行切片
已完成回收箱 V1、来源流转 V2、独立站 V2、销售助手 V3；下一步进入联调清理和业务侧深集成。
