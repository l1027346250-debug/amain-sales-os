# 企业管理模块发现记录

## 2026-04-21 复核
- `main` 分支已包含企业管理近期提交：字段中心、客户导出、报告模板。
- 企业管理蓝图 V1 要求包含回收箱，但代码中 `EnterpriseRecycleBinPage.tsx` 仍是 `EnterprisePlaceholderPage`。
- 后端 `EnterpriseManagementModule` 未注册 recycle 相关 entity/controller/service。
- 技术蓝图定义 `recycle_record` 表，字段包括 tenant/workspace、resource_type、resource_id、deleted_payload、deleted_by、restored/purged 状态。
- PRD 验收要求：按资源类型查看、恢复单条、一键清空指定类型、恢复和清空写审计日志。
