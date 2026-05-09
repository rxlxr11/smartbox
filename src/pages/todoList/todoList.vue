<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BackBar from '@/components/BackBar/BackBar.vue'
import { API } from '@/api'
import type { TodoItem } from '@/types/todo'
import { withAsyncLock } from '@/utils/index'
import TodoChartsPanel from './components/TodoChartsPanel.vue'
import TodoCheckinPanel from './components/TodoCheckinPanel.vue'
import TodoEditPanel from './components/TodoEditPanel.vue'

type TodoSectionKey = 'urgent' | 'habit' | 'negativeHabit' | 'todo' | 'progress'
type TodoTabKey = 'checkin' | 'charts' | 'edit'

interface TodoTab {
  name: TodoTabKey
  title: string
}

interface TodoSection {
  key: TodoSectionKey
  title: string
  tag: string
  count: number
  summary: string
  emptyText: string
  tasks: TodoItem[]
  style: {
    accent: string
    text: string
    softBg: string
    iconBg: string
    shadow: string
  }
}

const TODO_SECTION_STYLES: Record<TodoSectionKey, TodoSection['style']> = {
  urgent: {
    accent: '#ef4444',
    text: '#991b1b',
    softBg: '#fff1f2',
    iconBg: '#fee2e2',
    shadow: '0 12rpx 32rpx rgba(153, 27, 27, 0.08)'
  },
  habit: {
    accent: '#22c55e',
    text: '#166534',
    softBg: '#f0fdf4',
    iconBg: '#dcfce7',
    shadow: '0 12rpx 32rpx rgba(22, 101, 52, 0.08)'
  },
  negativeHabit: {
    accent: '#f97316',
    text: '#9a3412',
    softBg: '#fff7ed',
    iconBg: '#ffedd5',
    shadow: '0 12rpx 32rpx rgba(154, 52, 18, 0.08)'
  },
  todo: {
    accent: '#0ea5e9',
    text: '#075985',
    softBg: '#f0f9ff',
    iconBg: '#e0f2fe',
    shadow: '0 12rpx 32rpx rgba(7, 89, 133, 0.08)'
  },
  progress: {
    accent: '#9333ea',
    text: '#6b21a8',
    softBg: '#faf5ff',
    iconBg: '#f3e8ff',
    shadow: '0 12rpx 32rpx rgba(107, 33, 168, 0.08)'
  }
}

const todos = ref<TodoItem[]>([])
const paging = ref<any>(null)
const activeTab = ref<TodoTabKey>('checkin')
const activeSectionKey = ref<TodoSectionKey | null>('urgent')

const progressPopupVisible = ref(false)
const progressModalTask = ref<TodoItem | null>(null)
const progressInput = ref(0)

const todoTabs: TodoTab[] = [
  { name: 'checkin', title: '打卡' },
  { name: 'charts', title: '数据' },
  { name: 'edit', title: '编辑' }
]

const urgentTasks = computed(() => sortTasks(todos.value.filter(t => t.category === 'urgent')))
const pHabitTasks = computed(() => sortTasks(todos.value.filter(t => t.category === 'positive_habit')))
const nHabitTasks = computed(() => sortTasks(todos.value.filter(t => t.category === 'negative_habit')))
const todoTasks = computed(() => sortTasks(todos.value.filter(t => t.category === 'todo')))
const progressTasks = computed(() => sortTasks(todos.value.filter(t => t.category === 'progress')))
const todoSections = computed<TodoSection[]>(() => [
  {
    key: 'urgent',
    title: '紧急事务',
    tag: getPendingTag(urgentTasks.value),
    count: getPendingCount(urgentTasks.value),
    summary: getCommonSummary(urgentTasks.value, '暂无紧急事务'),
    emptyText: '暂无事项',
    tasks: urgentTasks.value,
    style: TODO_SECTION_STYLES.urgent
  },
  {
    key: 'habit',
    title: '日常习惯',
    tag: getPendingTag(pHabitTasks.value),
    count: getPendingCount(pHabitTasks.value),
    summary: getHabitSummary(pHabitTasks.value, '暂无日常习惯'),
    emptyText: '暂无习惯',
    tasks: pHabitTasks.value,
    style: TODO_SECTION_STYLES.habit
  },
  {
    key: 'negativeHabit',
    title: '反向习惯',
    tag: getPendingTag(nHabitTasks.value),
    count: getPendingCount(nHabitTasks.value),
    summary: getHabitSummary(nHabitTasks.value, '暂无反向习惯'),
    emptyText: '暂无反向习惯',
    tasks: nHabitTasks.value,
    style: TODO_SECTION_STYLES.negativeHabit
  },
  {
    key: 'todo',
    title: '待办事项',
    tag: getPendingTag(todoTasks.value),
    count: getPendingCount(todoTasks.value),
    summary: getCommonSummary(todoTasks.value, '暂无待办事项'),
    emptyText: '暂无待办',
    tasks: todoTasks.value,
    style: TODO_SECTION_STYLES.todo
  },
  {
    key: 'progress',
    title: '长期进度',
    tag: getProgressTag(),
    count: getPendingCount(progressTasks.value),
    summary: getProgressSummary(),
    emptyText: '暂无进度',
    tasks: progressTasks.value,
    style: TODO_SECTION_STYLES.progress
  }
])

/**
 * 按完成状态和创建时间排序任务。
 * @param {TodoItem[]} tasks 任务列表
 * @returns {TodoItem[]} 排序后的任务列表
 */
function sortTasks(tasks: TodoItem[]) {
  return [...tasks].sort((a, b) => {
    const aCompleted = isCompleted(a)
    const bCompleted = isCompleted(b)

    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1
    }

    const timeA = new Date(a.created_at || 0).getTime()
    const timeB = new Date(b.created_at || 0).getTime()
    return timeB - timeA
  })
}

/**
 * 判断任务是否已完成。
 * @param {TodoItem} task 任务项
 * @returns {boolean} 是否完成
 */
function isCompleted(task: TodoItem) {
  if (task.category === 'progress') {
    return task.progress_percentage !== undefined && task.progress_percentage >= 100
  }
  return !!task.is_completed
}

/**
 * 获取未完成任务数量。
 * @param {TodoItem[]} tasks 任务列表
 * @returns {number} 未完成数量
 */
function getPendingCount(tasks: TodoItem[]) {
  return tasks.filter(task => !isCompleted(task)).length
}

/**
 * 获取普通任务分组标签。
 * @param {TodoItem[]} tasks 任务列表
 * @returns {string} 分组标签
 */
function getPendingTag(tasks: TodoItem[]) {
  const count = getPendingCount(tasks)
  return count > 0 ? `${count} 项未完成` : '已清空'
}

/**
 * 获取首个未完成任务。
 * @param {TodoItem[]} tasks 任务列表
 * @returns {TodoItem | undefined} 首个未完成任务
 */
function getFirstPendingTask(tasks: TodoItem[]) {
  return tasks.find(task => !isCompleted(task))
}

/**
 * 获取普通任务分组摘要。
 * @param {TodoItem[]} tasks 任务列表
 * @param {string} emptyText 空状态文案
 * @returns {string} 分组摘要
 */
function getCommonSummary(tasks: TodoItem[], emptyText: string) {
  const firstPending = getFirstPendingTask(tasks)
  if (firstPending) return `最近：${firstPending.title}`
  return tasks.length > 0 ? '已全部完成' : emptyText
}

/**
 * 获取习惯分组摘要。
 * @param {TodoItem[]} tasks 任务列表
 * @param {string} emptyText 空状态文案
 * @returns {string} 分组摘要
 */
function getHabitSummary(tasks: TodoItem[], emptyText: string) {
  const firstPending = getFirstPendingTask(tasks)
  if (firstPending) return `待打卡：${firstPending.title}`
  return tasks.length > 0 ? '今日已完成' : emptyText
}

/**
 * 获取长期进度分组标签。
 * @returns {string} 进度标签
 */
function getProgressTag() {
  const count = getPendingCount(progressTasks.value)
  return count > 0 ? `${count} 项进行中` : '已达成'
}

/**
 * 获取长期进度分组摘要。
 * @returns {string} 进度摘要
 */
function getProgressSummary() {
  const firstPending = getFirstPendingTask(progressTasks.value)
  if (!firstPending) return progressTasks.value.length > 0 ? '全部目标已达成' : '暂无长期进度'
  return `${firstPending.title} · ${firstPending.progress_percentage || 0}%`
}

/**
 * 切换打卡分组展开状态。
 * @param {TodoSectionKey} key 分组 key
 * @returns {void}
 */
function toggleSection(key: TodoSectionKey) {
  activeSectionKey.value = activeSectionKey.value === key ? null : key
}

/**
 * 切换顶部标签内容。
 * @param {TodoTabKey} tab 标签 key
 * @returns {void}
 */
function switchTab(tab: TodoTabKey) {
  activeTab.value = tab
}

/**
 * 切换任务完成或习惯打卡状态。
 * @param {TodoItem} task 任务项
 * @returns {Promise<void>}
 */
const handleToggle = withAsyncLock(async (task: TodoItem) => {
  uni.showLoading({ title: '更新中...' })
  try {
    if (task.category === 'positive_habit' || task.category === 'negative_habit') {
      await API.todo.toggleHabitRecord(task.id, true)
    } else {
      await API.todo.toggleTodoComplete(task.id)
    }
    await fetchTodos()
    uni.hideLoading()
  } catch (e) {
    console.error('Failed to update todo:', e)
    uni.hideLoading()
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
})

/**
 * 获取任务列表数据。
 * @returns {Promise<void>}
 */
async function fetchTodos() {
  try {
    const data = await API.todo.getTodos()
    todos.value = data
  } catch (e) {
    console.error('Failed to fetch todos:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

/**
 * 打开进度更新弹窗。
 * @param {TodoItem} task 长期进度任务
 * @returns {void}
 */
function openProgressModal(task: TodoItem) {
  progressModalTask.value = task
  progressInput.value = task.current_value || 0
  progressPopupVisible.value = true
}

/**
 * 关闭进度更新弹窗。
 * @returns {void}
 */
function closeProgressModal() {
  progressPopupVisible.value = false
  progressModalTask.value = null
}

/**
 * 更新长期进度。
 * @returns {Promise<void>}
 */
const handleUpdateProgress = withAsyncLock(async () => {
  const task = progressModalTask.value
  if (!task) return

  const newProgress = Number(progressInput.value)
  if (Number.isNaN(newProgress) || newProgress < 0) {
    return uni.showToast({ title: '请输入有效的进度值', icon: 'none' })
  }
  if (task.target_value && newProgress > task.target_value) {
    return uni.showToast({ title: `进度不能超过目标 ${task.target_value}`, icon: 'none' })
  }

  uni.showLoading({ title: '更新中...' })
  try {
    await API.todo.updateTodoProgress(task.id, newProgress)
    await fetchTodos()
    uni.hideLoading()
    uni.showToast({ title: '进度已更新', icon: 'success' })
    closeProgressModal()
  } catch (e) {
    console.error('Failed to update progress:', e)
    uni.hideLoading()
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
})

/**
 * 打开新增任务页。
 * @returns {void}
 */
function openAddPage() {
  uni.navigateTo({
    url: '/pages-sub/editTodo/editTodo?mode=add'
  })
}

/**
 * 打开任务编辑页。
 * @param {TodoItem} task 任务项
 * @returns {void}
 */
function openEditPage(task: TodoItem) {
  uni.navigateTo({
    url: `/pages-sub/editTodo/editTodo?mode=edit&id=${task.id}`
  })
}

/**
 * 删除任务并刷新当前页面列表。
 * @param {TodoItem} task 任务项
 * @returns {void}
 */
function handleDeleteTask(task: TodoItem) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除「${task.title}」吗？`,
    success: async (res) => {
      if (!res.confirm) return

      uni.showLoading({ title: '删除中...' })
      try {
        await API.todo.deleteTodo(task.id)
        await fetchTodos()
        uni.hideLoading()
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (e) {
        console.error('Failed to delete todo:', e)
        uni.hideLoading()
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  })
}

/**
 * 返回首页。
 * @returns {void}
 */
function goHome() {
  uni.navigateBack({
    fail: () => {
      uni.reLaunch({ url: '/pages/index/index' })
    }
  })
}

onShow(() => {
  paging.value?.reload?.()
})
</script>

<template>
  <z-paging ref="paging" bg-color="#f6f6f6" v-model="todos"
            @query="fetchTodos"
            :use-page-scroll="false"
            :loading-more-enabled="false"
            :show-scrollbar="false"
  >
    <template #top>
      <view class="todo-page-top bg-white">
        <BackBar bgColor="#ffffff" :custom-left="true">
          <template #left>
            <view class="flex items-center ml-[20rpx] h-full" @click="goHome">
              <view class="w-[40rpx] h-[40rpx] i-fa6-solid:house flex items-center justify-center"></view>
              <text class="text-[#0f172a] text-[40rpx] font-bold ml-[16rpx]">打卡管理</text>
            </view>
          </template>
          <template #right>
            <view class="flex items-center justify-center text-[32rpx] font-bold text-[#0f172a] h-full"
              @click="openAddPage">新增</view>
          </template>
        </BackBar>

        <!-- 顶部标签：随 BackBar 一起放入 z-paging top，避免滚动内容切换时顶部区域错位 -->
        <view class="todo-top-tabs flex items-center border-b-[2rpx] border-b-solid border-[#e2e8f0]">
          <view v-for="tab in todoTabs" :key="tab.name"
            class="todo-top-tab relative flex-1 h-[88rpx] flex items-center justify-center text-[28rpx] font-600"
            :class="activeTab === tab.name ? 'text-[#2b6cee]' : 'text-[#64748b]'"
            @click="switchTab(tab.name)">
            <text>{{ tab.title }}</text>
            <view v-if="activeTab === tab.name"
              class="absolute bottom-[0] left-1/2 translate-x-[-50%] w-[52rpx] h-[6rpx] rounded-[999rpx] bg-[#2b6cee]"></view>
          </view>
        </view>
      </view>
    </template>

    <!-- 页面内容：根据顶部标签展示打卡、数据或编辑面板 -->
    <TodoCheckinPanel v-if="activeTab === 'checkin'"
      :sections="todoSections"
      :active-section-key="activeSectionKey"
      @toggle-section="toggleSection"
      @toggle-task="handleToggle"
      @open-progress="openProgressModal"
    />
    <TodoChartsPanel v-else-if="activeTab === 'charts'" />
    <TodoEditPanel v-else
      :sections="todoSections"
      @add="openAddPage"
      @edit="openEditPage"
      @delete="handleDeleteTask"
    />

    <!-- 进度更新弹窗：打卡页长期进度使用底部弹出框更新当前值 -->
    <wd-popup v-model="progressPopupVisible" position="bottom" :z-index="999" :safe-area-inset-bottom="true"
      custom-style="border-radius: 32rpx 32rpx 0 0; overflow: hidden;" @close="closeProgressModal">
      <view class="bg-[#ffffff] w-full max-h-[80vh] flex flex-col overflow-hidden box-border">
        <view class="py-[32rpx] px-[40rpx] border-b-[2rpx] border-b-solid border-[#e2e8f0] flex justify-between items-center">
          <text class="text-[36rpx] font-700 text-[#101622]">更新进度</text>
          <view class="w-[48rpx] h-[48rpx] i-fa6-solid:xmark text-[#64748b]" @click="closeProgressModal"></view>
        </view>
        <view class="flex-1 p-[40rpx] overflow-y-auto overflow-x-hidden">
          <view v-if="progressModalTask" class="flex flex-col gap-[32rpx] pb-[40rpx] w-full box-border overflow-hidden">
            <view class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
              <text class="text-[28rpx] font-600 text-[#44474e] break-words">任务：{{ progressModalTask.title }}</text>
            </view>
            <view class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
              <text class="text-[28rpx] font-600 text-[#44474e]">目标总量</text>
              <view class="flex items-center w-full">
                <view
                  class="w-full box-border py-[24rpx] px-[32rpx] rounded-[16rpx] border-[2rpx] border-solid border-[#c4c6cf] text-[26rpx] bg-[#f1f1f4] text-[#44474e]">
                  <text>{{ progressModalTask.target_value || 0 }} {{ progressModalTask.unit }}</text>
                </view>
              </view>
            </view>
            <view class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
              <text class="text-[28rpx] font-600 text-[#44474e]">当前进度 <text class="text-[#ba1a1a]">*</text></text>
              <view class="flex items-center w-full">
                <input
                  class="w-full h-[96rpx] min-h-[96rpx] leading-[96rpx] box-border px-[32rpx] rounded-[16rpx] border-[2rpx] border-solid border-[#c4c6cf] bg-[#fcfcfd] text-[30rpx] text-[#101622]"
                  v-model.number="progressInput" type="number"
                  :placeholder="String(progressModalTask.current_value || 0)" />
              </view>
              <text class="text-[24rpx] text-[#74777f] mt-[8rpx] leading-[1.5] break-words">
                当前：{{ progressModalTask.current_value || 0 }} / {{ progressModalTask.target_value || 0 }}{{ progressModalTask.unit }}（{{ progressModalTask.progress_percentage || 0 }}%）
              </text>
            </view>
          </view>
        </view>
        <view class="flex justify-end gap-[24rpx] p-[32rpx] border-t-[2rpx] border-t-solid border-[#e2e8f0] bg-[#fcfcfd]">
          <view
            class="py-[20rpx] px-[48rpx] rounded-[999rpx] text-[28rpx] font-600 flex items-center justify-center transition-all duration-200 text-[#44474e] bg-transparent border-[2rpx] border-solid border-[#74777f]"
            @click="closeProgressModal">取消</view>
          <view
            class="py-[20rpx] px-[48rpx] rounded-[999rpx] text-[28rpx] font-600 flex items-center justify-center transition-all duration-200 text-white bg-[#0a56d1] shadow-[0_2rpx_6rpx_rgba(0,0,0,0.1)]"
            @click="handleUpdateProgress">更新</view>
        </view>
      </view>
    </wd-popup>
  </z-paging>
</template>

<style scoped>
.todo-page-top {
  background: #ffffff;
}

.todo-top-tabs {
  height: 88rpx;
  background: #ffffff;
}

.todo-top-tab {
  min-width: 0;
}
</style>
