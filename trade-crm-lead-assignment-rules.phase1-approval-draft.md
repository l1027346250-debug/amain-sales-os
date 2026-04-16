# Trade CRM 一期 Lead 分配规则待确认稿

更新日期：2026-04-08  
适用范围：Trade CRM 一期 `Lead Auto Assignment` / `Lead 12h First Response Reminder`  
当前业务方向：**先按产品类别分流，员工分级和具体业务员在系统运行后再维护**

对应技术文件：
- `trade-crm-lead-assignment-rules.phase1-product-category-confirmation.csv`
- `trade-crm-lead-assignment-rules.phase1-guide.md`
- `trade-crm-lead-assignment-rules.phase1-register.csv`
- `packages/twenty-server/scripts/review-trade-crm-lead-assignment-business-confirmation.js`

## 1. 本文目的

这份文档不是新的产品方案，而是把当前一期 Lead 分配方向整理成“正式待确认稿”，用于业务方、销售负责人、实施负责人共同确认：

1. 一期先按哪些产品类别接住 Lead
2. 一期是否先进入待分配池/公共池，而不是直接分给具体业务员
3. 员工分级与人员池是否运行后再维护
4. 运行后新增、删除、调整员工和等级时，是否允许直接更新配置

本文确认后，后续文档和 CSV 都将围绕“产品类别优先、人员后置”推进，而不是围绕固定业务员邮箱推进。

## 2. 当前业务约束

根据当前已确认的业务要求：

1. Lead 分配应优先按产品类别进行
2. 产品类别以 Alibaba 店铺大分类为准
3. 具体业务员先不锁定
4. 员工分级与人员池运行后再新增、删除、调整

这意味着一期不应再把“指定具体业务员邮箱”作为上线前置条件。

## 3. 一期产品类别标准字典

当前建议直接采用店铺公开大分类，作为一期 `productCategory` 标准字典：

| 编号 | Product Category | 中文说明 | 一期是否上线 |
| --- | --- | --- | --- |
| PC-01 | `Ultrasound Machine` | 超声设备 | 是 |
| PC-02 | `Operating Technology and Operating equipment` | 手术及手术室设备 | 是 |
| PC-03 | `OB/GYN and infant and gynecology` | 妇产、婴儿及妇科设备 | 是 |
| PC-04 | `Diagnostics equipment` | 诊断设备 | 是 |
| PC-05 | `Hospital furniture` | 医院家具 | 是 |

## 4. 一期建议采用的分配结构

### 4.1 一期分配思路

一期建议改成以下结构：

1. 先识别并标准化 `productCategory`
2. 按 `productCategory` 进入对应待分配池/分级池
3. 暂不要求每个类别上线前就绑定具体业务员
4. 运行后再逐步补齐：
   - 员工分级
   - 人员池
   - 类别到等级/池的映射
   - 类别到具体人员的映射

### 4.2 一期建议的最小承接方式

| Product Category | 一期承接方式 | 上线前是否必须指定业务员 | 运行后是否可调整 |
| --- | --- | --- | --- |
| `Ultrasound Machine` | 进入超声待分配池 | 否 | 是 |
| `Operating Technology and Operating equipment` | 进入手术设备待分配池 | 否 | 是 |
| `OB/GYN and infant and gynecology` | 进入妇产设备待分配池 | 否 | 是 |
| `Diagnostics equipment` | 进入诊断设备待分配池 | 否 | 是 |
| `Hospital furniture` | 进入家具待分配池 | 否 | 是 |

## 5. 员工分级与人员池的建议位置

### 5.1 一期建议先确认结构，不确认人员

一期建议只先确认：

- 是否有员工分级
- 分级名称是什么
- 类别先进入哪个池/哪个等级池

而不要求现在就确认：

- 每个池里有哪些具体人员
- 每个等级现在有哪些业务员
- 某个类别最终分给哪个邮箱

### 5.2 建议的后置配置维度

运行后可维护的配置建议包括：

| 配置项 | 当前是否先定死 | 运行后是否允许维护 |
| --- | --- | --- |
| `productCategory` 标准字典 | 是 | 可增补 |
| `staffLevel` | 否 | 是 |
| `assigneePool` | 否 | 是 |
| `productCategory -> assigneePool` | 否 | 是 |
| `productCategory -> staffLevel` | 否 | 是 |
| `pool -> member list` | 否 | 是 |

## 6. 与提醒规则的关系

当前设计里：

- `Lead Auto Assignment` 原本直接写入 `lead.assignedToId`
- `Lead 12h First Response Reminder` 跟随 `lead.assignedToId`

但在现在的新要求下，一期更合理的策略是：

1. 先完成 `productCategory` 分类
2. Lead 暂进入待分配池/公共池
3. 具体 `assignedToId` 可延后到运行后维护

这意味着：

- 一期不应再把“提醒负责人已确定”当成前提
- 提醒和分配逻辑后续要改成兼容池/待分配模式

## 7. 必须确认的业务问题

以下问题仍然必须确认，但重点已经从“具体业务员是谁”转为“类别和池怎么管理”：

### 7.1 产品类别是否最终采用这 5 个大类

必须确认：

- 是否按当前 5 个店铺大类作为一期标准字典
- 是否允许后续新增子类或扩展类目

### 7.2 一期是否采用待分配池/公共池

必须确认：

- 每个产品类别是否先进入独立待分配池
- 是否允许先统一进入一个公共池，再人工二次分配

### 7.3 员工分级是否运行后维护

必须确认：

- 运行后是否允许新增等级
- 运行后是否允许删除等级
- 运行后是否允许把人员从一个等级池调到另一个等级池

### 7.4 具体业务员是否后置维护

必须确认：

- 上线前是否可以完全不锁定具体业务员
- 系统运行后是否通过配置逐步补齐人员池

## 8. 建议确认结果格式

建议业务最终确认时，用下面这个最小表格即可：

| productCategory | categoryEnabled | assignmentMode | targetPool | targetStaffLevel | postLaunchOwnerConfig | notes |
| --- | --- | --- | --- | --- | --- | --- |
| Ultrasound Machine | true | POOL | ultrasound-pool | 待定 | 是 | 一期先入池 |
| Operating Technology and Operating equipment | true | POOL | operating-pool | 待定 | 是 | 一期先入池 |
| OB/GYN and infant and gynecology | true | POOL | obgyn-pool | 待定 | 是 | 一期先入池 |
| Diagnostics equipment | true | POOL | diagnostics-pool | 待定 | 是 | 一期先入池 |
| Hospital furniture | true | POOL | furniture-pool | 待定 | 是 | 一期先入池 |

## 9. 当前结论

当前技术链路已经足够支撑一期先做“产品类别标准化 + 待分配池承接”。  
真正未完成的不是工具链，而是：

1. 类别字典的业务确认
2. 待分配池/公共池策略确认
3. 员工分级与人员池运行后维护方式确认

在这 3 点确认前，建议暂停把“具体业务员邮箱”作为发布前置条件。
