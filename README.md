# SmartBox 3.1

> 一款聚合多功能的跨平台小程序，集成习惯打卡、游戏中心、随手笔记、实用工具等模块。

## 📱 项目概览

SmartBox 是一个基于 **uni-app + Vue 3 + TypeScript** 开发的聚合型小程序，后端使用 **Supabase** 提供数据存储和实时同步服务。

### 支持平台

- ✅ 微信小程序 (主要平台)
- ✅ H5

---

## 🎯 功能模块

| 模块 | 状态 | 描述 |
|------|------|------|
| 🎮 游戏中心 | 🚧 开发中 | 休闲娱乐游戏集合 |
| 📅 习惯打卡 | ✅ 已完成 | 日常习惯追踪、目标管理、进度统计 |
| 📝 随手笔记 | 🚧 规划中 | 快速记录灵感、沉淀思考 |
| 🧰 实用工具 | 🚧 规划中 | 效率工具集合 |
| 📊 AI 计划 | 🚧 规划中 | AI 智能排序、每日任务规划 |
| 🗺️ 记忆旅游 | 🚧 规划中 | 旅游路线记录与规划、足迹打卡、照片留言与地点收藏 |

### 习惯打卡功能详情

支持五种任务类型：

| 类型 | 代码 | 说明 | 示例 |
|------|------|------|------|
| 正向习惯 | 1 | 每日需要完成的好习惯 | 喝水、运动、早起 |
| 反向习惯 | 0 | 每日需要避免的坏习惯 | 戒烟、不熬夜、少刷手机 |
| 待办事项 | 2 | 一次性任务 | 买菜、交报告 |
| 长期进度 | 3 | 有明确目标的长期任务 | 读完一本书、学习课程 |
| 紧急事务 | 4 | 高优先级任务 | 紧急会议、截止日期任务 |

---

## 🛠️ 技术栈

### 前端
- **框架**: uni-app 3.0 + Vue 3.4
- **语言**: TypeScript 4.9
- **构建**: Vite 5.2

### 后端
- **BaaS**: Supabase
  - PostgreSQL 数据库
  - 实时订阅
  - Row Level Security (RLS)
  - Edge Functions (规划中)
- **SDK**: supabase-wechat-stable-v2 (微信小程序适配)

---

## 📁 项目结构

```
smartbox-3.1/
├── src/
│   ├── api/                    # API 接口层
│   │   ├── index.ts            # API 统一导出
│   │   └── todo/               # 打卡模块 API
│   │       └── todo.ts
│   ├── components/             # 公共组件
│   │   ├── BackBar/            # 导航栏组件
│   │   └── WebImage/           # 图片组件
│   ├── dict/                   # 字典/枚举
│   │   └── httpEnum.ts         # HTTP 状态码枚举
│   ├── http/                   # HTTP 请求封装
│   │   └── http.ts
│   ├── layout/                 # 布局组件
│   ├── lib/                    # 第三方库配置
│   │   └── supabase.ts         # Supabase 客户端初始化
│   ├── pages/                  # 主包页面
│   │   ├── index/              # 首页（模块入口）
│   │   └── todoList/           # 打卡列表页
│   ├── pages-sub/              # 分包页面
│   │   └── todoCharts/         # 打卡统计图表
│   ├── static/                 # 静态资源
│   ├── types/                  # TypeScript 类型定义
│   │   └── todo.ts             # 打卡模块类型
│   ├── uni_modules/            # uni-app 插件
│   ├── App.vue                 # 应用入口
│   ├── main.ts                 # 主入口
│   ├── pages.json              # 页面路由配置
│   ├── manifest.json           # 应用配置
│   └── uni.scss                # 全局样式变量
├── dist/                       # 构建输出
├── patches/                    # 依赖补丁
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

创建 `.env` 文件：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

### 开发命令

```bash
# H5 开发
pnpm run dev:h5

# 微信小程序开发
pnpm run dev:mp-weixin
```

### 构建命令

```bash
# H5 构建
pnpm build:h5

# 微信小程序构建
pnpm build:mp-weixin
```

### 类型检查

```bash
pnpm type-check
```

---

## 🗄️ 数据库设计

为支持以下新功能，需要重构数据库：
- ✅ 习惯每日打卡记录（支持历史回溯）
- ✅ AI 智能排序与计划生成
- ✅ 最近七天任务展示
- ✅ 任务预计开始时间与持续时间
- ✅ 用户多端同步

---

### 1. `tasks` - 任务主表

存储所有任务的基本信息。

#### 基本信息

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | BIGINT | ✅ | 自增 | 主键 |
| created_at | TIMESTAMPTZ | ✅ | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | ✅ | NOW() | 更新时间 |
| title | TEXT | ✅ | - | 任务标题 |
| description | TEXT | - | - | 任务描述 |
| type | INTEGER | ✅ | - | 类型：0反向习惯/1正向习惯/2待办/3进度/4紧急 |
| label | TEXT | - | - | 标签分类 |

#### 状态控制

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| is_active | BOOLEAN | ✅ | TRUE | 是否启用 |
| is_deleted | BOOLEAN | ✅ | FALSE | 软删除标记 |
| is_completed | BOOLEAN | ✅ | FALSE | 是否完成（用于待办/紧急） |

#### 时间规划

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| scheduled_start_time | TIMESTAMPTZ | - | - | 预计开始时间 |
| estimated_duration | INTEGER | - | - | 预计持续时间（分钟） |
| deadline | TIMESTAMPTZ | - | - | 截止时间 |

#### 进度类任务专用

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| target_value | REAL | - | - | 目标值（如：读100页） |
| current_value | REAL | - | 0 | 当前进度值 |
| unit | TEXT | - | - | 单位（如：页、章、小时） |

#### AI 排序辅助

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| priority | INTEGER | - | 0 | 优先级（可由AI计算） |
| urgency_score | REAL | - | 0 | 紧急程度分数（0-100，AI计算） |

#### 习惯统计

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| streak_days | INTEGER | - | 0 | 连续打卡天数 |
| total_completions | INTEGER | - | 0 | 总完成次数 |
| completed_at | TIMESTAMPTZ | - | - | 完成时间 |

#### 用户关联

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| user_id | UUID | - | - | 关联 auth.users(id) |

#### 索引

| 索引名 | 字段 | 说明 |
|--------|------|------|
| idx_tasks_type | type | 按类型查询 |
| idx_tasks_user_active | user_id, is_active, is_deleted | 用户活跃任务 |
| idx_tasks_deadline | deadline | 截止时间查询（部分索引） |
| idx_tasks_scheduled | scheduled_start_time | 计划时间查询（部分索引） |
| idx_tasks_priority | priority DESC, urgency_score DESC | AI排序查询 |

---

### 2. `task_records` - 任务记录表

记录每次任务的完成情况，**解决习惯类任务的每日打卡记录需求**。

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | BIGINT | ✅ | 自增 | 主键 |
| task_id | BIGINT | ✅ | - | 外键，关联 tasks(id)，级联删除 |
| record_date | DATE | ✅ | - | 记录日期（用于按天统计） |
| completed_at | TIMESTAMPTZ | ✅ | NOW() | 完成时刻 |
| duration | INTEGER | - | - | 实际花费时间（分钟） |
| value | REAL | - | - | 完成数值（用于进度类：今天读了多少页） |
| note | TEXT | - | - | 备注 |
| is_success | BOOLEAN | - | TRUE | 是否成功（反向习惯用：今天有没有破戒） |
| created_at | TIMESTAMPTZ | ✅ | NOW() | 创建时间 |

#### 约束

| 约束名 | 类型 | 说明 |
|--------|------|------|
| unique_task_daily_record | UNIQUE | (task_id, record_date) 确保每个任务每天只有一条记录 |

#### 索引

| 索引名 | 字段 | 说明 |
|--------|------|------|
| idx_task_records_task | task_id | 按任务查询 |
| idx_task_records_date | record_date | 按日期查询 |
| idx_task_records_week | record_date | 最近7天查询（部分索引） |

---

### 3. `daily_plans` - 每日计划表

用于 AI 排序和每日任务规划。

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | BIGINT | ✅ | 自增 | 主键 |
| plan_date | DATE | ✅ | - | 计划日期 |
| task_order | JSONB | ✅ | '[]' | 任务排序列表 |
| ai_suggestions | JSONB | - | - | AI建议（优化建议、风险提示） |
| ai_generated_at | TIMESTAMPTZ | - | - | AI生成时间 |
| is_confirmed | BOOLEAN | - | FALSE | 用户是否确认计划 |
| confirmed_at | TIMESTAMPTZ | - | - | 确认时间 |
| created_at | TIMESTAMPTZ | ✅ | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | ✅ | NOW() | 更新时间 |
| user_id | UUID | - | - | 关联 auth.users(id) |

#### task_order 格式

```json
[
  {"task_id": 1, "order": 1, "planned_start": "09:00", "planned_duration": 30},
  {"task_id": 2, "order": 2, "planned_start": "09:30", "planned_duration": 60}
]
```

#### 约束

| 约束名 | 类型 | 说明 |
|--------|------|------|
| unique_user_daily_plan | UNIQUE | (user_id, plan_date) 确保每用户每天只有一个计划 |

#### 索引

| 索引名 | 字段 | 说明 |
|--------|------|------|
| idx_daily_plans_date | plan_date | 按日期查询 |
| idx_daily_plans_user_date | user_id, plan_date | 按用户和日期查询 |

---

### 4. `task_reminders` - 任务提醒表

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | BIGINT | ✅ | 自增 | 主键 |
| task_id | BIGINT | ✅ | - | 外键，关联 tasks(id)，级联删除 |
| remind_at | TIMESTAMPTZ | ✅ | - | 提醒时间 |
| remind_type | TEXT | - | 'notification' | 提醒方式：notification / alarm |
| is_sent | BOOLEAN | - | FALSE | 是否已发送 |
| created_at | TIMESTAMPTZ | ✅ | NOW() | 创建时间 |

#### 索引

| 索引名 | 字段 | 说明 |
|--------|------|------|
| idx_reminders_pending | remind_at | 待发送提醒（部分索引：is_sent = FALSE） |

---

### 5. `game_scores` - 游戏积分表（规划中）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | BIGINT | ✅ | 自增 | 主键 |
| user_id | UUID | - | - | 关联 auth.users(id) |
| game_id | TEXT | ✅ | - | 游戏标识 |
| score | INTEGER | ✅ | 0 | 分数 |
| level | INTEGER | - | 1 | 等级 |
| played_at | TIMESTAMPTZ | ✅ | NOW() | 游戏时间 |
| duration | INTEGER | - | - | 游戏时长（秒） |
| extra_data | JSONB | - | - | 游戏特定数据 |
| created_at | TIMESTAMPTZ | ✅ | NOW() | 创建时间 |

#### 索引

| 索引名 | 字段 | 说明 |
|--------|------|------|
| idx_game_scores_user | user_id | 按用户查询 |
| idx_game_scores_game | game_id | 按游戏查询 |
| idx_game_scores_ranking | game_id, score DESC | 排行榜查询 |

---

### 6. `notes` - 笔记表（规划中）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | BIGINT | ✅ | 自增 | 主键 |
| user_id | UUID | - | - | 关联 auth.users(id) |
| title | TEXT | - | - | 标题 |
| content | TEXT | ✅ | - | 内容 |
| tags | TEXT[] | - | - | 标签数组 |
| is_pinned | BOOLEAN | - | FALSE | 是否置顶 |
| is_deleted | BOOLEAN | - | FALSE | 软删除标记 |
| created_at | TIMESTAMPTZ | ✅ | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | ✅ | NOW() | 更新时间 |

#### 索引

| 索引名 | 字段 | 说明 |
|--------|------|------|
| idx_notes_user | user_id, is_deleted | 用户笔记查询 |
| idx_notes_tags | tags (GIN) | 标签搜索 |

---

### 7. `travel_routes` - 旅游路线表（规划中）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | BIGINT | ✅ | 自增 | 主键 |
| user_id | UUID | - | - | 关联 auth.users(id) |
| title | TEXT | ✅ | - | 路线名称（如：2023云南之旅） |
| description | TEXT | - | - | 路线描述或计划说明 |
| status | TEXT | ✅ | 'planned' | 状态：planned(计划中) / active(进行中) / completed(已完成) |
| start_date | DATE | - | - | 开始日期 |
| end_date | DATE | - | - | 结束日期 |
| created_at | TIMESTAMPTZ | ✅ | NOW() | 创建时间 |

#### 索引

| 索引名 | 字段 | 说明 |
|--------|------|------|
| idx_travel_routes_user | user_id | 按用户查询路线 |

---

### 8. `travel_checkins` - 旅游打卡点表（规划中）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | BIGINT | ✅ | 自增 | 主键 |
| route_id | BIGINT | - | - | 关联 travel_routes(id)，可为空（表示散点打卡或收藏） |
| user_id | UUID | - | - | 关联 auth.users(id) |
| location_name | TEXT | ✅ | - | 地点名称 |
| address | TEXT | - | - | 详细地址 |
| latitude | REAL | ✅ | - | 纬度（高德 API） |
| longitude | REAL | ✅ | - | 经度（高德 API） |
| type | TEXT | ✅ | 'visited' | 类型：visited(已打卡) / wishlist(想去/收藏) |
| message | TEXT | - | - | 在该点的留言/感受 |
| photos | TEXT[] | - | - | 照片 URL 数组 |
| visit_time | TIMESTAMPTZ | - | - | 实际打卡/访问时间 |
| created_at | TIMESTAMPTZ | ✅ | NOW() | 创建时间 |

#### 索引

| 索引名 | 字段 | 说明 |
|--------|------|------|
| idx_travel_checkins_route | route_id | 按路线查询打卡点 |
| idx_travel_checkins_user | user_id, type | 用户收藏或足迹查询 |

---



## 🎮 游戏中心开发计划

### 页面结构

```
首页 (index)
  └── 点击"游戏中心"
        └── 游戏首页 (gameHome)
              ├── 游戏1 入口
              ├── 游戏2 入口
              └── 游戏N 入口
                    └── 游戏页面 (gamePage)
                          ├── 顶部：控制栏
                          ├── 中部：游戏主体
                          └── 底部：难度选择
```

### 页面路由规划

| 页面 | 路径 | 说明 |
|------|------|------|
| 游戏首页 | `/pages-sub/game/gameHome` | 游戏列表入口 |
| 游戏页面 | `/pages-sub/game/gamePage` | 通用游戏页面，通过参数加载不同游戏 |

---

### 游戏页面布局 (GameLayout)

游戏页面采用上中下三层结构的通用布局模板：

#### 顶部控制栏 (Header)

| 元素 | 说明 |
|------|------|
| 游戏名称 | 当前游戏标题 |
| 开始按钮 | 开始游戏 |
| 暂停按钮 | 暂停游戏 |
| 犯错次数 | 当前错误次数 / 允许错误次数（如有限制） |
| 最高成绩 | 历史最高分 |

#### 中部主体 (Main)

| 元素 | 说明 |
|------|------|
| 游戏区域 | 插槽，由具体游戏组件填充 |

#### 底部控制栏 (Footer)

| 元素 | 说明 |
|------|------|
| 难度选择器 | 根据游戏的难度字典动态渲染难度选项 |

---

### Game 接口设计

所有游戏通过实现 `Game` 接口来保证统一的行为规范。

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| id | `string` | 游戏唯一标识 |
| name | `string` | 游戏名称 |
| difficultyDict | `Record<string, DifficultyConfig>` | 难度字典 |
| maxErrors | `number \| null` | 允许的最大错误次数，null 表示无限制 |
| currentDifficulty | `string` | 当前选择的难度 |
| currentErrors | `number` | 当前错误次数 |
| highScore | `number` | 最高分 |
| score | `number` | 当前分数 |
| status | `GameStatus` | 游戏状态：idle / playing / paused / ended |

#### 难度配置 (DifficultyConfig)

| 字段 | 类型 | 说明 |
|------|------|------|
| label | `string` | 难度显示名称 |
| value | `string` | 难度标识 |
| params | `Record<string, any>` | 难度相关参数（速度、数量等） |

#### 游戏状态 (GameStatus)

| 状态 | 说明 |
|------|------|
| idle | 未开始 |
| playing | 游戏中 |
| paused | 已暂停 |
| ended | 已结束 |

#### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `start()` | `void` | 开始游戏 |
| `pause()` | `void` | 暂停游戏 |
| `resume()` | `void` | 恢复游戏 |
| `restart()` | `void` | 重新开始游戏 |
| `setDifficulty(difficulty: string)` | `void` | 设置难度 |
| `recordError()` | `void` | 记录一次错误 |
| `checkGameOver()` | `boolean` | 判断游戏是否结束 |
| `checkSuccess()` | `boolean` | 判断游戏是否成功 |
| `updateHighScore()` | `Promise<void>` | 更新最高分到数据库 |
| `getHighScore()` | `Promise<number>` | 从数据库获取最高分 |
| `onGameLogic()` | `void` | 游戏自身独特的逻辑（抽象方法，子类实现） |

---

### TypeScript 接口定义

```typescript
// src/types/game.ts

/** 游戏状态 */
export type GameStatus = 'idle' | 'playing' | 'paused' | 'ended';

/** 难度配置 */
export interface DifficultyConfig {
  label: string;
  value: string;
  params: Record<string, any>;
}

/** 游戏接口 */
export interface Game {
  // 属性
  readonly id: string;
  readonly name: string;
  readonly difficultyDict: Record<string, DifficultyConfig>;
  readonly maxErrors: number | null;
  
  currentDifficulty: string;
  currentErrors: number;
  highScore: number;
  score: number;
  status: GameStatus;
  
  // 生命周期方法
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  
  // 难度控制
  setDifficulty(difficulty: string): void;
  
  // 错误处理
  recordError(): void;
  
  // 状态判断
  checkGameOver(): boolean;
  checkSuccess(): boolean;
  
  // 分数管理
  updateHighScore(): Promise<void>;
  getHighScore(): Promise<number>;
  
  // 游戏独特逻辑
  onGameLogic(): void;
}

/** 游戏注册信息 */
export interface GameInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  component: () => Promise<any>; // 动态导入组件
}
```

---

### 游戏基类实现

```typescript
// src/lib/game/BaseGame.ts

import type { Game, GameStatus, DifficultyConfig } from '@/types/game';

export abstract class BaseGame implements Game {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly difficultyDict: Record<string, DifficultyConfig>;
  abstract readonly maxErrors: number | null;
  
  currentDifficulty: string = 'normal';
  currentErrors: number = 0;
  highScore: number = 0;
  score: number = 0;
  status: GameStatus = 'idle';
  
  start(): void {
    this.status = 'playing';
    this.score = 0;
    this.currentErrors = 0;
  }
  
  pause(): void {
    if (this.status === 'playing') {
      this.status = 'paused';
    }
  }
  
  resume(): void {
    if (this.status === 'paused') {
      this.status = 'playing';
    }
  }
  
  restart(): void {
    this.status = 'idle';
    this.score = 0;
    this.currentErrors = 0;
    this.start();
  }
  
  setDifficulty(difficulty: string): void {
    if (this.difficultyDict[difficulty]) {
      this.currentDifficulty = difficulty;
    }
  }
  
  recordError(): void {
    this.currentErrors++;
    if (this.checkGameOver()) {
      this.status = 'ended';
    }
  }
  
  checkGameOver(): boolean {
    if (this.maxErrors === null) return false;
    return this.currentErrors >= this.maxErrors;
  }
  
  abstract checkSuccess(): boolean;
  abstract updateHighScore(): Promise<void>;
  abstract getHighScore(): Promise<number>;
  abstract onGameLogic(): void;
}
```

---

### 游戏注册表

```typescript
// src/lib/game/gameRegistry.ts

import type { GameInfo } from '@/types/game';

export const gameRegistry: GameInfo[] = [
  {
    id: 'memory-cards',
    name: '记忆翻牌',
    icon: '🃏',
    description: '考验记忆力的翻牌配对游戏',
    component: () => import('@/components/games/MemoryCards.vue')
  },
  {
    id: 'number-puzzle',
    name: '数字华容道',
    icon: '🔢',
    description: '经典滑块拼图游戏',
    component: () => import('@/components/games/NumberPuzzle.vue')
  },
  {
    id: 'reaction-test',
    name: '反应测试',
    icon: '⚡',
    description: '测试你的反应速度',
    component: () => import('@/components/games/ReactionTest.vue')
  }
  // 更多游戏...
];
```

---

### 文件结构规划

```
src/
├── components/
│   └── games/                    # 游戏组件
│       ├── GameLayout.vue        # 游戏通用布局模板
│       ├── MemoryCards.vue       # 记忆翻牌游戏
│       ├── NumberPuzzle.vue      # 数字华容道
│       └── ReactionTest.vue      # 反应测试
├── lib/
│   └── game/                     # 游戏核心逻辑
│       ├── BaseGame.ts           # 游戏基类
│       ├── gameRegistry.ts       # 游戏注册表
│       └── games/                # 具体游戏实现
│           ├── MemoryCardsGame.ts
│           ├── NumberPuzzleGame.ts
│           └── ReactionTestGame.ts
├── pages-sub/
│   └── game/                     # 游戏页面
│       ├── gameHome.vue          # 游戏首页
│       └── gamePage.vue          # 通用游戏页面
├── api/
│   └── game/                     # 游戏API
│       └── game.ts               # 分数记录等接口
└── types/
    └── game.ts                   # 游戏类型定义
```

---

### 游戏首页设计

游戏首页展示所有可用游戏的卡片列表：

| 元素 | 说明 |
|------|------|
| 游戏卡片 | 显示游戏图标、名称、描述 |
| 最高分徽章 | 显示该游戏的历史最高分 |
| 点击跳转 | 跳转到 `/pages-sub/game/gamePage?id={gameId}` |

---

### 数据流

```
用户点击开始
    ↓
GameLayout 调用 game.start()
    ↓
Game 实例状态变为 playing
    ↓
游戏组件渲染游戏内容，调用 game.onGameLogic()
    ↓
用户操作 → 更新 score / 调用 recordError()
    ↓
checkGameOver() / checkSuccess()
    ↓
游戏结束 → updateHighScore() → 保存到 Supabase
```

---

## 🗺️ 记忆旅游开发计划

### 核心功能目标
1. **过往足迹展示**：接入高德地图 API，在地图上直观展示用户过去的旅游路线和历史打卡点。
2. **打卡点互动**：点击地图上的历史打卡点，可以弹出抽屉或浮层，查看当时留下的心情留言以及上传的旅游照片。
3. **未来路线规划**：允许用户在地图上选择多个地点，自动生成未来的旅游路线规划，并保存到待办路线中。
4. **想去地点收藏**：遇到感兴趣的地点可以一键收藏（Wishlist），随时可以在地图上查看，作为后续旅游规划的备选点。

### 页面路由规划

| 页面 | 路径 | 说明 |
|------|------|------|
| 旅游地图首页 | `/pages-sub/travel/travelMap` | 接入高德地图的主页面，展示路线和散点 |
| 路线管理页 | `/pages-sub/travel/routeList` | 查看和管理已规划、已完成的旅游路线列表 |
| 地点详情/编辑 | `/pages-sub/travel/locationDetail` | 查看打卡点照片留言，或编辑想去的地点信息 |

### 技术实现要点
- **地图选型**：使用高德地图小程序 SDK（`amap-wx.js`）及 uni-app 的 `<map>` 组件。
- **标记点渲染**：通过 `markers` 属性将数据库中的 `travel_checkins` 渲染到地图上，根据 `type`（已打卡/想去）显示不同的图标样式。
- **路线绘制**：利用高德的路线规划 API，将同属于一个 `route_id` 的坐标点连接起来，使用 `<map>` 的 `polyline` 属性进行绘制。
- **多媒体存储**：打卡点的照片通过 Supabase Storage 进行云端存储，数据库中仅保存访问链接（URL）。

---

## 📄 License

MIT
