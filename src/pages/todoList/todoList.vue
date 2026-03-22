<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BackBar from '@/components/BackBar/BackBar.vue'
import { API } from '@/api'
import type { TodoItem, TodoCategory } from '@/types/todo'
import { TODO_TYPE_MAP } from '@/types/todo'
import { onShow } from "@dcloudio/uni-app";
import AddTaskDialog from './AddTaskDialog.vue'
import EditTaskDialog from './EditTaskDialog.vue'
import { withAsyncLock } from '@/utils/index'

const todos = ref<TodoItem[]>([])
const loading = ref(false)

const sortTasks = (tasks: TodoItem[]) => {
  return [...tasks].sort((a, b) => {
    const isCompleted = (t: TodoItem) => {
      if (t.category === 'progress') {
        return t.progress_percentage !== undefined && t.progress_percentage >= 100;
      }
      return !!t.is_completed;
    };

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

const urgentTasks = computed(() => sortTasks(todos.value.filter(t => t.category === 'urgent')))
const pHabitTasks = computed(() => sortTasks(todos.value.filter(t => t.category === 'positive_habit')))
const nHabitTasks = computed(() => sortTasks(todos.value.filter(t => t.category === 'negative_habit')))

const isPositiveHabit = ref(true)
const habitTasks = computed(() => isPositiveHabit.value ? pHabitTasks.value : nHabitTasks.value)
const toggleHabitType = () => {
  isPositiveHabit.value = !isPositiveHabit.value
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

const todoTasks = computed(() => sortTasks(todos.value.filter(t => t.category === 'todo')))
const progressTasks = computed(() => sortTasks(todos.value.filter(t => t.category === 'progress')))

// --- Modal State & Logic ---
const showModal = ref(false)
const initialModalType = ref<number | undefined>(undefined)

const openModal = (category?: string | Event) => {
  initialModalType.value = undefined
  if (typeof category === 'string') {
    if (category === 'habit') {
      initialModalType.value = isPositiveHabit.value ? 1 : 0
    }
  }
  showModal.value = true
}

const handleSaveTask = async (payload: any) => {
  uni.showLoading({ title: '保存中...' })
  try {
    await API.todo.addTodo(payload)
    await fetchTodos()
    showModal.value = false
    uni.hideLoading()
    uni.showToast({ title: '添加成功', icon: 'success' })
  } catch (e) {
    console.error('Failed to add todo:', e)
    uni.hideLoading()
    uni.showToast({ title: '添加失败', icon: 'none' })
  }
}
// --- End Modal Logic ---

// --- Edit Modal Logic ---
const showEditModal = ref(false)
const editModalTask = ref<TodoItem | null>(null)

const openEditModal = (task: TodoItem) => {
  editModalTask.value = task
  showEditModal.value = true
}

const handleEditSave = async (id: number, payload: any) => {
  uni.showLoading({ title: '保存中...' })
  try {
    await API.todo.updateTodo(id, payload)
    await fetchTodos()
    showEditModal.value = false
    uni.hideLoading()
    uni.showToast({ title: '修改成功', icon: 'success' })
  } catch (e) {
    console.error('Failed to update todo:', e)
    uni.hideLoading()
    uni.showToast({ title: '修改失败', icon: 'none' })
  }
}

const handleEditDelete = (id: number) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' })
        try {
          await API.todo.deleteTodo(id)
          await fetchTodos()
          showEditModal.value = false
          uni.hideLoading()
          uni.showToast({ title: '已删除', icon: 'success' })
        } catch (e) {
          console.error('Failed to delete todo:', e)
          uni.hideLoading()
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}
// --- End Edit Modal Logic ---

const fetchTodos = async () => {
  loading.value = true
  try {
    const data = await API.todo.getTodos()
    todos.value = data
  } catch (e) {
    console.error('Failed to fetch todos:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
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

const handleDelete = (id: number) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' })
        try {
          await API.todo.deleteTodo(id)
          await fetchTodos()
          uni.hideLoading()
          uni.showToast({ title: '已删除', icon: 'success' })
        } catch (e) {
          console.error('Failed to delete todo:', e)
          uni.hideLoading()
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

// --- Progress Modal ---
const showProgressModal = ref(false)
const progressModalTask = ref<TodoItem | null>(null)
const progressInput = ref(0)

const openProgressModal = (task: TodoItem) => {
  progressModalTask.value = task
  progressInput.value = task.current_value || 0
  showProgressModal.value = true
}

const closeProgressModal = () => {
  showProgressModal.value = false
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
// --- End Progress Modal ---


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
  fetchTodos()
})
</script>
<template>
  <z-paging ref="paging" bg-color="#f6f6f6" v-model="todos" @query="fetchTodos" :use-page-scroll="false"
    :loading-more-enabled="false" :show-scrollbar="false">

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
            @click="openModal">新增</view>
        </template>
      </BackBar>
      <!-- Top Navigation -->
      <view class="flex flex-row justify-around bg-white px-[32rpx] border-b-[2rpx] border-b-solid border-[#e2e8f0]">
        <view class="py-[24rpx] px-[32rpx] text-[28rpx] text-[#2b6cee] font-600 ">
          打卡</view>
        <view class="py-[24rpx] px-[32rpx] text-[28rpx] text-[#64748b] cursor-pointer" @click="goToPage('todoCharts')">
          数据
        </view>
        <view class="py-[24rpx] px-[32rpx] text-[28rpx] text-[#64748b] cursor-pointer" @click="goToPage('todoEdit')">
          编辑</view>
      </view>
    </template>

    <!-- Main Content Grid -->
    <view class="flex-1 flex flex-col h-full">
      <view class="flex flex-col gap-[24rpx] p-[32rpx] box-border">
        <!-- 紧急事务 (Urgent Tasks) -->
        <view
          class="rounded-[24rpx] p-[32rpx] flex flex-col shadow-[0_2rpx_4rpx_rgba(0,0,0,0.05)] h-[360rpx] box-border bg-[#fee2e2] overflow-hidden">
          <view class="flex justify-between items-start mb-[16rpx] shrink-0">
            <text class="text-[32rpx] font-700 text-[#991b1b]">紧急事务</text>
          </view>
          <scroll-view scroll-y class="flex-1 overflow-y-auto h-0">
            <view class="flex flex-col gap-[16rpx]">
              <view v-for="task in urgentTasks" :key="task.id"
                class="rounded-[16rpx] p-[16rpx] text-[24rpx] flex flex-col bg-white-50 text-[#991b1b]"
                @longpress="openEditModal(task)" @click="handleToggle(task)">
                <view class="flex items-center">
                  <view
                    class="w-[32rpx] h-[32rpx] border-[2rpx] border-solid border-[#991b1b] rounded-[6rpx] flex items-center justify-center shrink-0">
                    <view v-if="task.is_completed" class="i-fa6-solid:check text-[20rpx] text-[#991b1b]"></view>
                  </view>
                  <text class="ml-[10rpx] flex-1 overflow-hidden whitespace-nowrap text-ellipsis"
                    :class="{ 'line-through opacity-70': task.is_completed }">{{ task.title }}</text>
                </view>
                <view class="mt-[8rpx] text-[20rpx] opacity-80" v-if="task.deadline">
                  {{ formatDate(task.deadline) }}
                </view>
              </view>
              <view v-if="urgentTasks.length === 0"
                class="text-[24rpx] opacity-60 text-center mt-[40rpx] text-[#991b1b]">
                暂无事项
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 日常习惯 (Daily Habits) -->
        <view
          class="rounded-[24rpx] p-[32rpx] flex flex-col shadow-[0_2rpx_4rpx_rgba(0,0,0,0.05)] h-[360rpx] box-border bg-[#dcfce7] overflow-hidden">
          <view class="flex justify-between items-start mb-[16rpx] shrink-0">
            <text class="text-[32rpx] font-700 text-[#166534]">日常习惯</text>
            <view class="flex items-center gap-[8rpx]">
              <view
                class="text-[20rpx] py-[4rpx] px-[12rpx] rounded-[8rpx] font-500 text-[#166534] bg-[rgba(255,255,255,0.5)]"
                @click="toggleHabitType">
                <text class="text-[32rpx] leading-1">{{ isPositiveHabit ? '😊' : '😈' }}</text>
              </view>
            </view>
          </view>
          <scroll-view scroll-y class="flex-1 overflow-y-auto h-0">
            <view class="flex flex-col gap-[16rpx]">
              <view v-for="task in habitTasks" :key="task.id"
                class="rounded-[16rpx] p-[16rpx] text-[24rpx] flex flex-col bg-white-50 text-[#166534] relative"
                @longpress="openEditModal(task)" @click="handleToggle(task)">
                <view class="flex items-center">
                  <view
                    class="w-[32rpx] h-[32rpx] border-[2rpx] border-solid border-[#166534] rounded-[6rpx] flex items-center justify-center shrink-0">
                    <view v-if="task.is_completed" class="i-fa6-solid:check text-[20rpx] text-[#166534]"></view>
                  </view>
                  <text class="ml-[10rpx] flex-1 overflow-hidden whitespace-nowrap text-ellipsis"
                    :class="{ 'line-through opacity-70': task.is_completed }">{{ task.title }}</text>
                </view>
                <view class="text-[20rpx] opacity-80 text-right mt-[8rpx]">
                  坚持 {{ task.streak_days || 0 }} 天
                </view>
              </view>
              <view v-if="habitTasks.length === 0"
                class="text-[24rpx] opacity-60 text-center mt-[40rpx] text-[#166534]">
                暂无习惯
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 待办事项 (To-do List) -->
        <view
          class="rounded-[24rpx] p-[32rpx] flex flex-col shadow-[0_2rpx_4rpx_rgba(0,0,0,0.05)] h-[360rpx] box-border bg-[#e0f2fe] overflow-hidden">
          <view class="flex justify-between items-start mb-[16rpx] shrink-0">
            <text class="text-[32rpx] font-700 text-[#075985]">待办事项</text>
          </view>
          <scroll-view scroll-y class="flex-1 overflow-y-auto h-0">
            <view class="flex flex-col gap-[16rpx]">
              <view v-for="task in todoTasks" :key="task.id"
                class="rounded-[16rpx] p-[16rpx] text-[24rpx] flex flex-col bg-white-50 text-[#075985]"
                @longpress="openEditModal(task)" @click="handleToggle(task)">
                <view class="flex items-center">
                  <view
                    class="w-[32rpx] h-[32rpx] border-[2rpx] border-solid border-[#075985] rounded-[6rpx] flex items-center justify-center shrink-0">
                    <view v-if="task.is_completed" class="i-fa6-solid:check text-[20rpx] text-[#075985]"></view>
                  </view>
                  <text class="ml-[10rpx] flex-1 overflow-hidden whitespace-nowrap text-ellipsis"
                    :class="{ 'line-through opacity-70': task.is_completed }">{{ task.title }}</text>
                </view>
                <view class="mt-[8rpx] text-[20rpx] opacity-80" v-if="task.deadline">
                  {{ formatDate(task.deadline) }}
                </view>
              </view>
              <view v-if="todoTasks.length === 0" class="text-[24rpx] opacity-60 text-center mt-[40rpx] text-[#075985]">
                暂无待办
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 长期进度 (Long-term Progress) -->
        <view
          class="rounded-[24rpx] p-[32rpx] flex flex-col shadow-[0_2rpx_4rpx_rgba(0,0,0,0.05)] h-[360rpx] box-border bg-[#f3e8ff] overflow-hidden">
          <view class="flex justify-between items-start mb-[16rpx] shrink-0">
            <text class="text-[32rpx] font-700 text-[#6b21a8]">长期进度</text>
          </view>
          <scroll-view scroll-y class="flex-1 overflow-y-auto h-0">
            <view class="flex flex-col gap-[16rpx]">
              <view v-for="task in progressTasks" :key="task.id"
                class="rounded-[16rpx] p-[16rpx] flex flex-col bg-white-50" @longpress="openEditModal(task)"
                @click="openProgressModal(task)">
                <view class="flex justify-between text-[20rpx] mb-[8rpx] text-[#6b21a8]">
                  <text class="flex-1 overflow-hidden whitespace-nowrap text-ellipsis mr-[10rpx]"
                    :class="{ 'line-through opacity-70': task.progress_percentage !== undefined && task.progress_percentage >= 100 }">{{
                      task.title
                    }}</text>
                  <text class="shrink-0"
                    :class="{ 'line-through opacity-70': task.progress_percentage !== undefined && task.progress_percentage >= 100 }">{{
                      task.current_value || 0 }}/{{ task.target_value || 0 }}{{ task.unit
                    }}</text>
                </view>
                <view class="flex items-center">
                  <view class="w-full h-[12rpx] rounded-[999rpx] overflow-hidden bg-[rgba(255,255,255,0.5)]">
                    <view class="h-full rounded-[999rpx] bg-[#6b21a8]"
                      :style="{ width: (task.progress_percentage || 0) + '%' }"></view>
                  </view>
                  <text class="text-[#6b21a8] ml-2 text-[20rpx] shrink-0">{{ task.progress_percentage || 0 }}%</text>
                </view>
              </view>
              <view v-if="progressTasks.length === 0"
                class="text-[24rpx] opacity-60 text-center mt-[40rpx] text-[#6b21a8]">
                暂无进度
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>

    <!-- Add Task Modal Component -->
    <AddTaskDialog v-model:visible="showModal" :initial-type="initialModalType" @save="handleSaveTask" />

    <!-- Edit Task Modal Component -->
    <EditTaskDialog v-model:visible="showEditModal" :task="editModalTask" @save="handleEditSave"
      @delete="handleEditDelete" />

    <!-- Progress Update Modal -->
    <view v-if="showProgressModal"
      class="fixed top-0 left-0 right-0 bottom-0 bg-[rgba(16,22,34,0.4)] z-[999] flex items-center justify-center p-[32rpx]"
      style="backdrop-filter: blur(4px);" @click="closeProgressModal">
      <view
        class="bg-[#ffffff] w-[680rpx] max-w-[900rpx] rounded-[24rpx] shadow-[0_20rpx_50rpx_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] overflow-hidden box-border max-w-[600rpx]"
        @click.stop>
        <view
          class="py-[32rpx] px-[40rpx] border-b-[2rpx] border-b-solid border-[#c4c6cf] flex justify-between items-center">
          <text class="text-[36rpx] font-700 text-[#101622]">更新进度</text>
        </view>
        <view class="flex-1 p-[40rpx] overflow-y-auto overflow-x-hidden">
          <view v-if="progressModalTask" class="flex flex-col gap-[32rpx] pb-[40rpx] w-full box-border overflow-hidden">
            <view class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
              <text class="text-[28rpx] font-600 text-[#44474e]">任务：{{ progressModalTask.title }}</text>
            </view>
            <view class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
              <text class="text-[28rpx] font-600 text-[#44474e]">目标总量</text>
              <view class="flex items-center w-[500rpx]">
                <view
                  class="w-[600rpx] box-content py-[24rpx] px-[32rpx] rounded-[16rpx] border-[2rpx] border-solid border-[#c4c6cf] text-[26rpx] text-[#101622] bg-[#f1f1f4] text-[#44474e]">
                  <text>{{ progressModalTask.target_value || 0 }} {{ progressModalTask.unit }}</text>
                </view>
              </view>
            </view>
            <view class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
              <text class="text-[28rpx] font-600 text-[#44474e]">当前进度 <text class="text-[#ba1a1a]">*</text></text>
              <view class="flex items-center w-[500rpx]">
                <input
                  class="w-[600rpx] box-content py-[24rpx] px-[32rpx] rounded-[16rpx] border-[2rpx] border-solid border-[#c4c6cf] bg-[#fcfcfd] text-[26rpx] text-[#101622]"
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
        <view
          class="flex justify-end gap-[24rpx] p-[32rpx] border-t-[2rpx] border-t-solid border-[#c4c6cf] bg-[#fcfcfd]">
          <view
            class="py-[20rpx] px-[48rpx] rounded-[999rpx] text-[28rpx] font-600 flex items-center justify-center transition-all duration-200 text-[#44474e] bg-transparent border-[2rpx] border-solid border-[#74777f]"
            @click="closeProgressModal">取消</view>
          <view
            class="py-[20rpx] px-[48rpx] rounded-[999rpx] text-[28rpx] font-600 flex items-center justify-center transition-all duration-200 text-white bg-[#0a56d1] shadow-[0_2rpx_6rpx_rgba(0,0,0,0.1)]"
            @click="handleUpdateProgress">更新</view>
        </view>
      </view>
    </view>

  </z-paging>

</template>

<style scoped>
.bg-white-50 {
  background-color: rgba(255, 255, 255, 0.5);
}
</style>