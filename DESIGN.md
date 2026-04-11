# SmartBox 3.1 代码层设计规范（Engineering Design Spec）

> 本文档不是视觉稿规范，而是**代码实现规范**。  
> 目标：统一 API 调用方式、列表分页方式（z-paging）、异步交互方式，降低页面实现分叉和维护成本。

---

## 1. 核心原则

1. **数据统一从 API 层进入页面**：页面不直接调用 Supabase/HTTP。  
2. **业务逻辑下沉到 `src/api/*`**：页面只做状态编排和交互。  
3. **列表页统一使用 z-paging 作为数据容器**。  
4. **异步交互统一采用“锁 + loading + toast”模式**。  
5. **RPC 参数统一 `p_` 前缀，返回统一做 normalize**。

---

## 2. 分层与目录规范

### 2.1 推荐分层

- `src/api/*`：领域 API（todo/game）
- `src/api/index.ts`：统一聚合导出
- `src/pages*/*.vue`：页面状态与交互
- `src/lib/*`：可复用业务类（例如 game runtime）

### 2.2 聚合出口（必须）

```ts
// src/api/index.ts
import { todoApi } from '@/api/todo/todo'
import { gameApi } from '@/api/game/game'

export const API = {
  todo: { ...todoApi },
  game: { ...gameApi },
}
```

约束：

- 页面优先 `import { API } from '@/api'`。
- 仅在特殊场景（如 lib 层）可直接 import 模块函数。

---

## 3. API 层规范（Supabase RPC）

### 3.1 必须使用 RPC 包装，不允许页面直连

✅ 正确（API 层）：

```ts
const { data, error } = await supabase.rpc('todo_get_todos', {
  p_today: today,
})

if (error) throw error
return ((data as TodoTable[]) || []).map(mapToTodoItem)
```

❌ 错误（页面层直连）：

```ts
// page.vue 里直接 supabase.rpc / supabase.from
// 不允许
```

### 3.2 RPC 参数命名

- 一律 `p_` 前缀（`p_id`、`p_today`、`p_game_id`）。
- 与 SQL function 参数保持 1:1 对齐。

### 3.3 返回值 normalize（必须）

由于 RPC 可能返回数组/对象/标量，API 层必须统一转换后再向页面输出。

示例（已在项目中使用）：

```ts
const getSingleRow = <T>(data: unknown): T | null => {
  if (Array.isArray(data)) return (data[0] ?? null) as T | null
  return (data ?? null) as T | null
}

const getBooleanResult = (data: unknown): boolean => {
  if (typeof data === 'boolean') return data
  if (Array.isArray(data)) return getBooleanResult(data[0])
  if (data && typeof data === 'object') {
    const value = Object.values(data)[0]
    return typeof value === 'boolean' ? value : false
  }
  return false
}
```

### 3.4 DTO 映射责任

- `mapToTodoItem` / `mapToGameInfo` 这类映射函数必须留在 API 层。
- 页面不得重复写 category/progress/状态推导逻辑。

---

## 4. 错误处理规范

### 4.1 API 层

默认策略：

- RPC 报错后 `throw error`。
- 需要兜底返回值的接口（如高分/排行榜）可在 API 层 `catch` 后返回 `null` 或 `[]`。

示例：

```ts
export async function getPersonalHighScore(gameId: string) {
  try {
    const { data, error } = await supabase.rpc('game_get_personal_high_score', {
      p_game_id: gameId,
      p_is_ascending: true,
    })
    if (error) throw error
    return getNullableNumber(data)
  } catch {
    return null
  }
}
```

### 4.2 页面层

- 必须处理失败反馈（toast / fallback UI）。
- 用户触发动作使用统一提示节奏：`showLoading -> await -> hideLoading -> toast`。

---

## 5. z-paging 规范（列表页强制）

### 5.1 基础模板

```vue
<z-paging
  ref="paging"
  v-model="list"
  @query="fetchList"
  :use-page-scroll="false"
  :loading-more-enabled="false"
  :show-scrollbar="false"
>
  <template #top>
    <BackBar title="页面标题" />
  </template>

  <!-- 列表内容 -->
</z-paging>
```

### 5.2 `@query` 处理规则

当前项目主流是“全量列表”模式：

```ts
const fetchList = async () => {
  loading.value = true
  try {
    list.value = await API.todo.getTodos()
  } finally {
    loading.value = false
  }
}
```

如果后续接入真分页接口，统一切换到 z-paging `complete/completeByTotal` 模式，不再仅赋值 `v-model`。

### 5.3 刷新时机

页面回到前台统一触发：

```ts
onShow(() => {
  paging.value.reload()
})
```

### 5.4 top 区域规范

- 顶部导航/筛选栏统一放 `#top`。
- `use-page-scroll=true` 时必须注意顶部高度变化同步（避免遮挡）。

---

## 6. 异步交互规范（防重复提交）

### 6.1 用户动作统一加锁

项目已有工具 `withAsyncLock`，所有“按钮触发 + 网络写操作”都必须包裹。

```ts
const handleToggle = withAsyncLock(async (task: TodoItem) => {
  uni.showLoading({ title: '更新中...' })
  try {
    await API.todo.toggleTodoComplete(task.id)
    await fetchTodos()
    uni.hideLoading()
  } catch {
    uni.hideLoading()
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
})
```

### 6.2 页面内异步状态

- 读取：`loading` 布尔值控制骨架/空态/禁用态。
- 写入：使用 `showLoading` 与 toast 反馈。

---

## 7. 调用方式约束

### 7.1 页面调用 API（推荐）

```ts
import { API } from '@/api'

const data = await API.todo.getTodos()
```

### 7.2 lib 层调用 API（允许）

`src/lib/game/games/SchulteGridGame.ts` 这类纯业务类可直接 import 领域函数：

```ts
import { recordGameScore, getPersonalHighScore } from '@/api/game/game'
```

约束：

- 仅限业务引擎/基础设施层。
- 页面层优先聚合 API，避免 import 路径分裂。

---

## 8. 代码示例：Good / Bad

### 8.1 API 访问

✅ Good

```ts
// page
const save = async () => {
  await API.todo.updateTodo(id, payload)
}
```

❌ Bad

```ts
// page
await supabase.rpc('todo_update', { p_id: id, p_updates: payload })
```

### 8.2 列表容器

✅ Good

```vue
<z-paging ref="paging" v-model="todos" @query="fetchTodos" :loading-more-enabled="false" />
```

❌ Bad

```vue
<!-- 列表页绕过 z-paging 自己维护全部滚动和空态 -->
<scroll-view>...</scroll-view>
```

### 8.3 异步点击

✅ Good

```ts
const submit = withAsyncLock(async () => {
  uni.showLoading({ title: '提交中...' })
  try {
    await API.todo.addTodo(payload)
  } finally {
    uni.hideLoading()
  }
})
```

❌ Bad

```ts
const submit = async () => {
  await API.todo.addTodo(payload) // 连点会重复提交
}
```

---

## 9. 交付检查清单（PR 前必查）

1. 页面是否只通过 `API` 访问数据？
2. 是否新增了页面直连 Supabase/HTTP 的代码？（必须为否）
3. 新列表页是否接入 `z-paging`？
4. `@query` 是否是统一数据入口？
5. 页面返回/切换后是否通过 `paging.reload()` 刷新？
6. 写操作是否使用 `withAsyncLock`？
7. 是否保证了失败态反馈（toast / 空态 / loading 关闭）？
8. RPC 参数是否都使用 `p_` 前缀？
9. API 层是否对返回值做了 normalize / map，而不是把裸数据抛给页面？

---

## 10. 演进方向

1. 统一抽象 `createRpcHandler`，减少重复 `data/error` 模板代码。  
2. 逐步统一 game/todo 的错误策略（全部抛错或全部兜底，避免混用）。  
3. 对 z-paging 建立“全量模式 / 分页模式”两个官方脚手架模板。  
4. 增加 ESLint 规则：禁止页面层 import `supabase`。

---

## 11. 游戏通用模板设计（Game Generic Template）

本节定义“新游戏接入”的统一模板，目标是保证所有游戏在页面结构、状态管理、数据同步、难度初始化上保持一致。

### 11.1 文件组织模板（必须）

新增一个游戏时，至少包含以下文件：

```text
src/
  api/game/game.ts                    # 游戏配置/分数接口
  lib/game/BaseGame.ts                # 抽象基类
  lib/game/games/<YourGame>.ts        # 具体游戏实现
  pages-sub/game/<YourGame>/<YourGame>.vue
  layout/gameLayout.vue               # 通用游戏布局（复用）
  types/game.ts                       # Game 接口与类型
```

约束：

- 不允许在页面里实现核心玩法算法（应在 `lib/game/games/*`）。
- 不允许在页面里写 Supabase 访问（应走 `api/game/game.ts`）。

### 11.2 页面模板（必须复用 `GameLayout`）

```vue
<template>
  <view v-if="game" class="w-full h-[100vh]">
    <GameLayout :game="game">
      <template #top>
        <!-- 可覆盖顶部状态展示 -->
      </template>

      <!-- 游戏主体区：网格/画布/交互控件 -->

      <template #bottom>
        <!-- 可复用默认底栏，也可按游戏覆盖 -->
      </template>
    </GameLayout>
  </view>

  <view v-else class="w-full h-[100vh] flex items-center justify-center text-[#6b7280]">
    加载中...
  </view>
</template>
```

约束：

- 必须有 `v-if="game"` 初始化保护，避免配置未加载前空引用。
- 顶部/底部优先通过 slot 扩展，不复制一套新布局。

### 11.3 初始化流程模板（必须）

```ts
const initGame = async () => {
  const gameInfo = await getGameById('your-game-id')
  if (!gameInfo) throw new Error('Game config not found')

  const difficultyDict = buildDifficultyDict(gameInfo.difficulty_levels)
  const difficultyKeys = Object.keys(difficultyDict)
  if (difficultyKeys.length === 0) throw new Error('No difficulty levels configured')

  const instance = new YourGame({
    id: gameInfo.id,
    name: gameInfo.name,
    maxErrors: gameInfo.max_errors ?? null,
    difficultyDict,
  })

  game.value = instance
  instance.setDifficulty(difficultyKeys.includes('normal') ? 'normal' : difficultyKeys[0])
  instance.onGameLogic()
  instance.status = 'idle'

  const highScore = await instance.getHighScore()
  instance.highScore = highScore
}
```

约束：

- 游戏元信息与难度配置必须来自接口，不允许本地硬编码。
- `onMounted` 只负责调用 `initGame` 与错误提示（toast）。

### 11.4 生命周期与状态同步模板

```ts
watch(
  () => game.value?.status,
  (status) => {
    if (!game.value) return

    if (status === 'playing') {
      startTimer()
      return
    }

    if (status === 'ended') {
      stopTimer()
      return
    }

    stopTimer()
  }
)
```

约束：

- 计时器/动画必须由 `status` 驱动，不能靠零散点击事件维护。
- `onUnmounted` 必须清理定时器。

### 11.5 新游戏接入检查清单

1. 是否复用了 `GameLayout`？
2. 是否通过 `getGameById` 拉取配置并构建 `difficultyDict`？
3. 是否由 `BaseGame` 子类承载核心玩法逻辑？
4. 是否实现 `updateHighScore/getHighScore` 并接入 API？
5. 是否通过 `watch(status)` 管理计时与状态副作用？

---

## 12. `Game.ts` 接口与通用继承实现设计

本节定义 `src/types/game.ts` 与 `src/lib/game/BaseGame.ts` 的长期通用化设计，确保不同游戏实现风格一致。

### 12.1 现状基线（当前已落地）

当前结构已满足统一抽象：

- `Game` 接口定义统一生命周期与状态。
- `BaseGame` 实现通用流程（start/pause/resume/restart/setDifficulty/recordError/checkGameOver）。
- 子类实现三类抽象方法：
  - `checkSuccess()`
  - `updateHighScore()`
  - `getHighScore()`
  - `onGameLogic()`

这是本项目游戏继承体系的基础，不应绕开。

### 12.2 通用继承约束（必须遵守）

#### A. 接口层（`types/game.ts`）

- `Game` 只定义“跨游戏稳定契约”，不放具体玩法字段。
- 玩法特有字段（如 `grid`, `expectedNumber`）放在子类。
- `DifficultyConfig` 必须至少包含 `label/value/params`。

#### B. 基类层（`BaseGame.ts`）

- 只实现通用状态机，不实现具体玩法。
- `start()` 必须调用 `onGameLogic()`，保证每个游戏有统一启动入口。
- `restart()` 统一“归零 -> start”语义，禁止子类自行改变重启语义。

#### C. 子类层（`games/*.ts`）

- 子类只处理：玩法数据结构、交互判定、成绩计算。
- 子类写库时只调用 API 函数，不处理 RPC 细节。
- 子类应在构造函数接收配置对象（由页面/API 注入），禁止写死 name/difficulty。

### 12.3 推荐的接口拆分（演进建议）

为避免 `Game` 接口持续膨胀，建议逐步拆分能力接口：

```ts
export interface GameLifecycle {
  start(): void
  pause(): void
  resume(): void
  restart(): void
}

export interface GameScoring {
  updateHighScore(): Promise<void>
  getHighScore(): Promise<number>
}

export interface GameDifficultyControl {
  setDifficulty(difficulty: string): void
  difficultyDict: Record<string, DifficultyConfig>
  currentDifficulty: string
}

export interface GameCore extends GameLifecycle, GameScoring, GameDifficultyControl {
  readonly id: string
  readonly name: string
  readonly maxErrors: number | null
  currentErrors: number
  score: number
  status: GameStatus
  recordError(): void
  checkGameOver(): boolean
  checkSuccess(): boolean
  onGameLogic(): void
}
```

> 说明：这是演进方向，用于后续多游戏扩展时减少接口耦合；当前实现仍以 `Game` 为主。

### 12.4 通用子类模板（建议直接复制）

```ts
import { BaseGame } from '../BaseGame'
import type { DifficultyConfig } from '@/types/game'
import { recordGameScore, getPersonalHighScore } from '@/api/game/game'

type GameConfig = {
  id: string
  name: string
  maxErrors: number | null
  difficultyDict: Record<string, DifficultyConfig>
}

export class DemoGame extends BaseGame {
  readonly id: string
  readonly name: string
  readonly maxErrors: number | null
  readonly difficultyDict: Record<string, DifficultyConfig>

  constructor(config: GameConfig) {
    super()
    this.id = config.id
    this.name = config.name
    this.maxErrors = config.maxErrors
    this.difficultyDict = config.difficultyDict
  }

  onGameLogic(): void {
    // 初始化玩法数据
  }

  checkSuccess(): boolean {
    // 判定成功条件
    return false
  }

  async updateHighScore(): Promise<void> {
    await recordGameScore({
      game_id: this.id,
      score: this.score,
      extra_data: { difficulty: this.currentDifficulty },
    })
  }

  async getHighScore(): Promise<number> {
    const score = await getPersonalHighScore(this.id, false)
    return score ?? 0
  }
}
```

### 12.5 禁止事项

1. 禁止页面直接操作 `game.status` 以外的内部玩法字段（如直接改 `grid`）。
2. 禁止在子类里直接写 `supabase.rpc`。
3. 禁止把 UI 状态（弹窗开关、动画态）放入 `BaseGame`。
4. 禁止在 `Game` 接口加入页面专用字段（保持领域纯度）。
