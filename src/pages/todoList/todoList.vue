<script setup lang="ts">
import { ref, computed } from 'vue'
import BackBar from '@/components/BackBar/BackBar.vue'
import WdPopup from 'wot-design-uni/components/wd-popup/wd-popup.vue'
import { API } from '@/api'
import type { TodoItem } from '@/types/todo'
import { onShow } from "@dcloudio/uni-app";
import { withAsyncLock } from '@/utils/index'

type TodoSectionKey = 'urgent' | 'habit' | 'negativeHabit' | 'todo' | 'progress'

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
const loading = ref(false)
const paging = ref<any>(null)
const activeSectionKey = ref<TodoSectionKey | null>('urgent')

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

const isSectionExpanded = (key: TodoSectionKey) => activeSectionKey.value === key

const sortTasks = (tasks: TodoItem[]) => {
  return [...tasks].sort((a, b) => {
    const aCompleted = isCompleted(a);
    const bCompleted = isCompleted(b);

    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1;
    }

    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });
}

const isCompleted = (task: TodoItem) => {
  if (task.category === 'progress') {
    return task.progress_percentage !== undefined && task.progress_percentage >= 100;
  }
  return !!task.is_completed;
}

const getPendingCount = (tasks: TodoItem[]) => {
  return tasks.filter(task => !isCompleted(task)).length
}

const getPendingTag = (tasks: TodoItem[]) => {
  const count = getPendingCount(tasks)
  return count > 0 ? `${count} 项未完成` : '已清空'
}

const getFirstPendingTask = (tasks: TodoItem[]) => {
  return tasks.find(task => !isCompleted(task))
}

const getCommonSummary = (tasks: TodoItem[], emptyText: string) => {
  const firstPending = getFirstPendingTask(tasks)
  if (firstPending) return `最近：${firstPending.title}`
  return tasks.length > 0 ? '已全部完成' : emptyText
}

const getHabitSummary = (tasks: TodoItem[], emptyText: string) => {
  const firstPending = getFirstPendingTask(tasks)
  if (firstPending) return `待打卡：${firstPending.title}`
  return tasks.length > 0 ? '今日已完成' : emptyText
}

const getProgressTag = () => {
  const count = getPendingCount(progressTasks.value)
  return count > 0 ? `${count} 项进行中` : '已达成'
}

const getProgressSummary = () => {
  const firstPending = getFirstPendingTask(progressTasks.value)
  if (!firstPending) return progressTasks.value.length > 0 ? '全部目标已达成' : '暂无长期进度'
  return `${firstPending.title} · ${firstPending.progress_percentage || 0}%`
}

const toggleSection = (key: TodoSectionKey) => {
  activeSectionKey.value = activeSectionKey.value === key ? null : key
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  const h = date.getHours().toString().padStart(2, '0')
  const min = date.getMinutes().toString().padStart(2, '0')
  return `${m}-${d} ${h}:${min}`
}



const fetchTodos = async () => {
  try {
    const data = await API.todo.getTodos()
    todos.value = data
  } catch (e) {
    console.error('Failed to fetch todos:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

const handleToggle = withAsyncLock(async (task: TodoItem) => {
  uni.showLoading({ title: '更新中...' })
  try {
    if (task.category === 'positive_habit' || task.category === 'negative_habit') {
      await API.todo.toggleHabitRecord(task.id, true)
    } else {
      await API.todo.toggleTodoComplete(task.id)
    }
    // 操作成功后统一重新获取列表
    await fetchTodos()
    uni.hideLoading()
  } catch (e) {
    console.error('Failed to update todo:', e)
    uni.hideLoading()
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
})

// --- Progress Popup ---
const progressPopupVisible = ref(false)
const progressModalTask = ref<TodoItem | null>(null)
const progressInput = ref(0)

const openProgressModal = (task: TodoItem) => {
  progressModalTask.value = task
  progressInput.value = task.current_value || 0
  progressPopupVisible.value = true
}

const closeProgressModal = () => {
  progressPopupVisible.value = false
  progressModalTask.value = null
}

const handleProgressPopupClose = () => {
  progressPopupVisible.value = false
  progressModalTask.value = null
}

const handleUpdateProgress = withAsyncLock(async () => {
  const task = progressModalTask.value
  if (!task) return

  const newProgress = Number(progressInput.value)
  if (isNaN(newProgress) || newProgress < 0) {
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
// --- End Progress Popup ---

const openAddPage = () => {
  uni.navigateTo({
    url: '/pages-sub/editTodo/editTodo?mode=add'
  })
}

const openEditPage = (task: TodoItem) => {
  uni.navigateTo({
    url: `/pages-sub/editTodo/editTodo?mode=edit&id=${task.id}`
  })
}

const goHome = () => {
  uni.navigateBack({
    fail: () => {
      // Fallback if no history
      uni.reLaunch({ url: '/pages/index/index' })
    }
  })
}

const goToPage = (pageName: string) => {
  uni.navigateTo({
    url: `/pages-sub/${pageName}/${pageName}`
  })
}

onShow(() => {
  paging.value.reload();
})
</script>
<template>
  <z-paging ref="paging" bg-color="#f6f6f6" v-model="todos"
            @query="fetchTodos"
            :use-page-scroll="false"
            :loading-more-enabled="false"
            :show-scrollbar="false"
            :auto-show-system-loading="true"
  >
    <template #top>
      <BackBar bgColor="#ffffff" :custom-left="true">
        <template #left>
          <view class="flex items-center ml-[20rpx] h-full" @click="goHome">
            <view class="w-[40rpx] h-[40rpx] i-fa6-solid:house flex items-center justify-center"></view>
            <text class="text-[#0f172a] text-[40rpx] font-bold  ml-[16rpx]">打卡管理</text>
          </view>
        </template>
        <template #right>
          <view class="flex items-center justify-center text-[32rpx] font-bold text-[#0f172a] h-full"
            @click="openAddPage">新增</view>
        </template>
      </BackBar>
    </template>


    <!-- Top Navigation -->
    <view class="flex flex-row justify-around bg-white px-[32rpx] border-b-[2rpx] border-b-solid border-[#e2e8f0]">
      <view class="py-[24rpx] px-[32rpx] text-[28rpx] text-[#2b6cee] font-600 ">
        打卡</view>
      <view class="py-[24rpx] px-[32rpx] text-[28rpx] text-[#64748b] cursor-pointer" @click="goToPage('todoCharts')">
        数据
      </view>
      <view class="py-[24rpx] px-[32rpx] text-[28rpx] text-[#64748b] cursor-pointer" @click="openAddPage">
        编辑</view>
    </view>

    <!-- 待办分组：收起显示摘要，展开显示可操作任务列表 -->
    <view class="flex-1 flex flex-col h-full">
      <view class="flex flex-col gap-[20rpx] p-[32rpx] box-border">
        <view v-for="section in todoSections" :key="section.key"
          class="rounded-[28rpx] bg-white overflow-hidden border-[2rpx] border-solid border-[#eef2f7]"
          :style="{ boxShadow: section.style.shadow }">
          <view class="flex items-center min-h-[128rpx] p-[28rpx] box-border" @click="toggleSection(section.key)">
            <view class="w-[8rpx] h-[72rpx] rounded-[999rpx] shrink-0"
              :style="{ backgroundColor: section.style.accent }"></view>
            <view class="w-[64rpx] h-[64rpx] rounded-[20rpx] flex items-center justify-center ml-[20rpx] shrink-0"
              :style="{ backgroundColor: section.style.iconBg, color: section.style.text }">
              <text class="text-[26rpx] font-700">{{ section.title.slice(0, 1) }}</text>
            </view>
            <view class="flex-1 min-w-0 ml-[20rpx]">
              <view class="flex items-center">
                <text class="text-[30rpx] font-700 text-[#0f172a]">{{ section.title }}</text>
                <text class="ml-[12rpx] text-[20rpx] py-[4rpx] px-[12rpx] rounded-[999rpx]"
                  :style="{ backgroundColor: section.style.softBg, color: section.style.text }">{{ section.tag }}</text>
              </view>
              <text class="block mt-[10rpx] text-[24rpx] text-[#64748b] overflow-hidden whitespace-nowrap text-ellipsis">
                {{ section.summary }}
              </text>
            </view>
            <view class="flex flex-col items-end ml-[20rpx] shrink-0">
              <text class="text-[34rpx] font-800" :style="{ color: section.style.text }">{{ section.count }}</text>
              <view class="w-[32rpx] h-[32rpx] flex items-center justify-center mt-[4rpx]"
                :class="isSectionExpanded(section.key) ? 'i-fa6-solid:chevron-up' : 'i-fa6-solid:chevron-down'"
                :style="{ color: section.style.text }"></view>
            </view>
          </view>

          <!-- 展开区域：当前分组展示完整任务操作，其他分组只保留摘要入口 -->
          <view v-if="isSectionExpanded(section.key)"
            class="px-[28rpx] pb-[28rpx] border-t-[2rpx] border-t-solid border-[#eef2f7]">
            <view class="h-[20rpx]"></view>

            <view class="flex flex-col gap-[16rpx]">
              <view v-for="task in section.tasks" :key="task.id + '-' + section.key + '-' + task.is_completed + '-' + task.progress_percentage"
                class="rounded-[18rpx] p-[18rpx] text-[24rpx] flex flex-col"
                :style="{ backgroundColor: section.style.softBg, color: section.style.text }"
                @longpress="openEditPage(task)"
                @click="section.key === 'progress' ? openProgressModal(task) : handleToggle(task)">
                <template v-if="section.key === 'progress'">
                  <view class="flex justify-between text-[22rpx] mb-[10rpx]">
                    <text class="flex-1 overflow-hidden whitespace-nowrap text-ellipsis mr-[10rpx]"
                      :class="{ 'line-through opacity-70': task.progress_percentage !== undefined && task.progress_percentage >= 100 }">
                      {{ task.title }}
                    </text>
                    <text class="shrink-0"
                      :class="{ 'line-through opacity-70': task.progress_percentage !== undefined && task.progress_percentage >= 100 }">
                      {{ task.current_value || 0 }}/{{ task.target_value || 0 }}{{ task.unit }}
                    </text>
                  </view>
                  <view class="flex items-center">
                    <view class="w-full h-[12rpx] rounded-[999rpx] overflow-hidden bg-[rgba(255,255,255,0.7)]">
                      <view class="h-full rounded-[999rpx]"
                        :style="{ width: (task.progress_percentage || 0) + '%', backgroundColor: section.style.accent }"></view>
                    </view>
                    <text class="ml-[12rpx] text-[20rpx] shrink-0">{{ task.progress_percentage || 0 }}%</text>
                  </view>
                </template>
                <template v-else>
                  <view class="flex items-center">
                    <view
                      class="w-[34rpx] h-[34rpx] border-[2rpx] border-solid rounded-[8rpx] flex items-center justify-center shrink-0"
                      :style="{ borderColor: section.style.text }">
                      <view v-if="task.is_completed" class="i-fa6-solid:check text-[20rpx]"
                        :style="{ color: section.style.text }"></view>
                    </view>
                    <text class="ml-[12rpx] flex-1 overflow-hidden whitespace-nowrap text-ellipsis"
                      :class="{ 'line-through opacity-70': task.is_completed }">{{ task.title }}</text>
                  </view>
                  <view v-if="section.key === 'habit' || section.key === 'negativeHabit'"
                    class="text-[20rpx] opacity-80 text-right mt-[8rpx]">
                    坚持 {{ task.streak_days || 0 }} 天
                  </view>
                  <view class="mt-[8rpx] text-[20rpx] opacity-80" v-else-if="task.deadline">
                    {{ formatDate(task.deadline) }}
                  </view>
                </template>
              </view>

              <!-- 空状态：展开分组没有任务时提示当前分类暂无内容 -->
              <view v-if="section.tasks.length === 0" class="text-[24rpx] opacity-60 text-center py-[48rpx]"
                :style="{ color: section.style.text }">
                {{ section.emptyText }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 进度更新弹窗：使用 Wot UI Popup 从底部弹出 -->
    <wd-popup v-model="progressPopupVisible" position="bottom" :z-index="999" :safe-area-inset-bottom="true"
      custom-style="border-radius: 32rpx 32rpx 0 0; overflow: hidden;" @close="handleProgressPopupClose">
      <view class="bg-[#ffffff] w-full max-h-[80vh] flex flex-col overflow-hidden box-border">
        <view class="py-[32rpx] px-[40rpx] border-b-[2rpx] border-b-solid border-[#e2e8f0] flex justify-between items-center">
          <text class="text-[36rpx] font-700 text-[#101622]">更新进度</text>
          <view class="w-[48rpx] h-[48rpx] i-fa6-solid:xmark text-[#64748b]" @click="closeProgressModal"></view>
        </view>
        <view class="flex-1 p-[40rpx] overflow-y-auto overflow-x-hidden">
          <view v-if="progressModalTask" class="flex flex-col gap-[32rpx] pb-[40rpx] w-full box-border overflow-hidden">
            <view class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
              <text class="text-[28rpx] font-600 text-[#44474e]">任务：{{ progressModalTask.title }}</text>
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
                  class="w-full box-border py-[24rpx] px-[32rpx] rounded-[16rpx] border-[2rpx] border-solid border-[#c4c6cf] bg-[#fcfcfd] text-[26rpx] text-[#101622]"
                  v-model.number="progressInput" type="number"
                  :placeholder="String(progressModalTask.current_value || 0)" />
              </view>
              <text class="text-[24rpx] text-[#74777f] mt-[8rpx]">当前：{{ progressModalTask.current_value || 0 }} / {{
                progressModalTask.target_value || 0 }}{{ progressModalTask.unit }}（{{
                  progressModalTask.progress_percentage
                  || 0 }}%）</text>
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
.bg-white-50 {
  background-color: rgba(255, 255, 255, 0.5);
}
</style>
