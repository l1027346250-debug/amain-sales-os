# Trade CRM 一期线索分配规则说明

更新日期：2026-04-08  
适用范围：Trade CRM 一期 `Lead Auto Assignment` 与 `Lead 12h First Response Reminder`  
当前方向：产品类别优先，员工分级与具体业务员后置维护

## 1. 使用目的

这份说明用于控制一期 Lead 先按 `productCategory` 进入待分配池/分级池，而不是上线前就写死到具体业务员。

## 2. 一期标准产品类别

| Product Category | 中文说明 | 一期状态 |
| --- | --- | --- |
| `Ultrasound Machine` | 超声设备 | 启用 |
| `Operating Technology and Operating equipment` | 手术及手术室设备 | 启用 |
| `OB/GYN and infant and gynecology` | 妇产、婴儿及妇科设备 | 启用 |
| `Diagnostics equipment` | 诊断设备 | 启用 |
| `Hospital furniture` | 医院家具 | 启用 |

## 3. 当前维护原则

1. 先按产品类别承接线索。
2. 一期先进入待分配池/公共池，不要求上线前指定具体业务员。
3. 员工分级、人员池成员、池内分配规则，运行后再维护。
4. 后续若新增产品类别，应继续保持标准字典，不允许自由输入。

## 4. 当前确认表字段说明

| 字段 | 含义 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `productCategory` | 产品类别 | 是 | 必须使用标准字典值 |
| `categoryEnabled` | 是否启用该类别 | 是 | `true/false` |
| `assignmentMode` | 分配模式 | 是 | 一期建议先用 `POOL` |
| `targetPool` | 目标待分配池 | 是 | 如 `ultrasound-pool` |
| `targetStaffLevel` | 目标员工等级 | 否 | 可先留空，运行后补齐 |
| `postLaunchOwnerConfig` | 运行后是否补人员配置 | 是 | 一期建议填 `true` |
| `decisionStatus` | 是否已确认 | 是 | 建议使用 `Approved` / `Confirmed` / `Pending` |
| `businessNotes` | 业务备注 | 否 | 记录类目说明或池策略 |

## 5. 一期建议承接方式

| Product Category | 建议分配模式 | 目标池 | 说明 |
| --- | --- | --- | --- |
| `Ultrasound Machine` | `POOL` | `ultrasound-pool` | 超声设备先入池 |
| `Operating Technology and Operating equipment` | `POOL` | `operating-pool` | 手术设备先入池 |
| `OB/GYN and infant and gynecology` | `POOL` | `obgyn-pool` | 妇产设备先入池 |
| `Diagnostics equipment` | `POOL` | `diagnostics-pool` | 诊断设备先入池 |
| `Hospital furniture` | `POOL` | `furniture-pool` | 家具类先入池 |

## 6. 推荐维护方式

1. 先确认产品类别和池结构。
2. 再在业务确认表里更新 `decisionStatus`。
3. 员工等级和具体业务员后续运行后维护。
4. 不要在一期把邮箱写死为发布前提。

## 7. 上线前待确认

1. 这 5 个产品类别是否作为一期正式标准字典。
2. 每个产品类别是否都采用待分配池。
3. 是否允许所有类别先统一进一个公共池。
4. 员工等级是否在系统运行后再逐步补齐。
