## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        A["React 18 + TypeScript"]
        B["React Router 路由"]
        C["Zustand 状态管理"]
        D["TailwindCSS 样式"]
        E["Recharts 图表"]
        F["Lucide React 图标"]
    end
    subgraph "数据层"
        G["Mock 数据 (本地JSON)"]
        H["LocalStorage 持久化"]
    end
    subgraph "组件层"
        I["布局组件 Layout"]
        J["业务页面组件 Pages"]
        K["通用基础组件 Components"]
        L["自定义 Hooks"]
    end
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    J --> I
    J --> K
    J --> L
    C --> G
    C --> H
```

## 2. 技术描述

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **路由管理**: React Router DOM v6
- **状态管理**: Zustand
- **UI样式**: TailwindCSS 3
- **图表库**: Recharts
- **图标库**: Lucide React
- **日期处理**: date-fns
- **后端**: 无后端，纯前端 Mock 数据
- **数据持久化**: LocalStorage

## 3. 路由定义

| 路由 | 页面 | 用途 |
|------|------|------|
| /dashboard | 仪表板 | 生产概览、统计数据 |
| /process-cards | 工艺卡片列表 | 工艺卡片管理 |
| /process-cards/new | 新增工艺卡片 |
| /process-cards/:id | 工艺卡片详情/编辑 |
| /furnace-planning | 装炉排产 | 装炉排产管理 |
| /carburizing | 渗碳淬火 | 渗碳淬火记录 |
| /tempering | 回火处理 | 回火处理记录 |
| /metallography | 金相检测 | 金相检测记录 |
| /hardness | 硬度检验 | 硬度检验记录 |
| /deformation | 变形矫正 | 变形矫正记录 |
| /traceability | 质量追溯 | 炉次追溯查询 |

## 4. 数据模型

### 4.1 实体关系图

```mermaid
erDiagram
    PROCESS_CARD ||--o{ FURNACE_BATCH : "基于工艺"
    FURNACE_BATCH ||--o{ CARBURIZING_RECORD : "渗碳记录"
    FURNACE_BATCH ||--o{ TEMPERING_RECORD : "回火记录"
    FURNACE_BATCH ||--o{ METALLOGRAPHY_RECORD : "金相记录"
    FURNACE_BATCH ||--o{ HARDNESS_RECORD : "硬度记录"
    FURNACE_BATCH ||--o{ DEFORMATION_RECORD : "变形记录"
    FURNACE_BATCH ||--o{ PART_ITEM : "包含零件"

    PROCESS_CARD {
        string id PK
        string code
        string name
        string material
        number carburizing_temp
        number carburizing_time
        number quenching_temp
        string quenching_medium
        number tempering_temp
        number tempering_time
    }
    FURNACE_BATCH {
        string id PK
        string furnace_no
        string batch_no
        string process_card_id FK
        string status
        datetime start_time
        datetime end_time
        string operator
    }
    PART_ITEM {
        string id PK
        string batch_id FK
        string part_no
        string part_name
        int quantity
        string position
    }
    CARBURIZING_RECORD {
        string id PK
        string batch_id FK
        number layer_depth
        json temp_curve
        string medium_temp
    }
    TEMPERING_RECORD {
        string id PK
        string batch_id FK
        json temp_curve
        number holding_time
    }
    METALLOGRAPHY_RECORD {
        string id PK
        string batch_id FK
        string sample_no
        string structure_level
        string result
    }
    HARDNESS_RECORD {
        string id PK
        string batch_id FK
        string part_no
        json surface_values
        json core_values
        string result
    }
    DEFORMATION_RECORD {
        string id PK
        string batch_id FK
        string part_no
        number before_value
        number after_value
        string correction_method
    }
```

## 5. 项目目录结构

```
src/
├── components/          # 通用组件
│   ├── Layout/        # 布局组件
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── index.tsx
│   ├── ui/           # 基础UI组件
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Modal.tsx
│   │   ├── Form.tsx
│   │   └── Chart.tsx
│   └── common/       # 业务通用组件
├── pages/             # 页面组件
│   ├── Dashboard.tsx
│   ├── ProcessCards/
│   ├── FurnacePlanning/
│   ├── Carburizing/
│   ├── Tempering/
│   ├── Metallography/
│   ├── Hardness/
│   ├── Deformation/
│   └── Traceability/
├── store/             # Zustand状态管理
│   └── index.ts
├── data/              # Mock数据
│   └── mockData.ts
├── types/             # TypeScript类型定义
│   └── index.ts
├── utils/             # 工具函数
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css
```
