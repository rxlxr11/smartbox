<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BackBar from '@/components/BackBar/BackBar.vue'
import { API } from '@/api'
import type { TodoItem, TodoCategory } from '@/types/todo'
import { TODO_TYPE_MAP } from '@/types/todo'
import {onShow} from "@dcloudio/uni-app";

const todos = ref<TodoItem[]>([])
const loading = ref(false)

const urgentTasks = computed(() => todos.value.filter(t => t.category === 'urgent'))
const pHabitTasks = computed(() => todos.value.filter(t => t.category === 'positive_habit'))
const nHabitTasks = computed(() => todos.value.filter(t => t.category === 'negative_habit'))

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

const todoTasks = computed(() => todos.value.filter(t => t.category === 'todo'))
const progressTasks = computed(() => todos.value.filter(t => t.category === 'progress'))

// --- Modal State & Logic ---
const showModal = ref(false)
const typeOptions = ['反向日常', '正向日常', '待办', '长期', '紧急']
const labelOptions = [
  { name: '工作', colorClass: 'badge-blue' },
  { name: '个人', colorClass: 'badge-green' },
  { name: '健康', colorClass: 'badge-orange' },
  { name: '学习', colorClass: 'badge-purple' }
]

const defaultFormData = () => ({
  title: '',
  desc: '',
  type: 2, // Default to '待办' (Todo)
  label: '个人',
  deadline: '',
  time: '',
  max: undefined as number | undefined,
  unit: '',
  days: 0,
})

const formData = ref(defaultFormData())

const typeIndex = computed(() => formData.value.type)
const onTypeChange = (e: any) => {
  formData.value.type = Number(e.detail.value)
}

const openModal = (category?: string) => {
  formData.value = defaultFormData()
  if (category) {
    if (category === 'habit') {
      formData.value.type = isPositiveHabit.value ? 1 : 0
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleSaveTask = async () => {
  // Validation
  if (!formData.value.title.trim()) {
    return uni.showToast({ title: '请输入任务名称', icon: 'none' })
  }
  if (formData.value.type === 4 && !formData.value.deadline) {
    return uni.showToast({ title: '紧急任务需选择日期', icon: 'none' })
  }
  if (formData.value.type === 3 && (!formData.value.max || formData.value.max <= 0)) {
    return uni.showToast({ title: '请填写有效的目标总量', icon: 'none' })
  }

  try {
    const payload: any = {
      title: formData.value.title,
      type: formData.value.type,
      desc: formData.value.desc,
      label: formData.value.label,
      if_complete: false,
      if_use: true,
    }

    if (formData.value.type !== 0 && formData.value.type !== 1 && formData.value.deadline) {
      // Append time value if exists, otherwise default to end of day
      const timeStr = formData.value.time || '23:59:59'
      payload.deadline = `${formData.value.deadline}T${timeStr}Z`
    }

    if (formData.value.type === 3) {
      payload.max = Number(formData.value.max)
      payload.progress = 0
      payload.unit = formData.value.unit
    }

    if (formData.value.type === 0 || formData.value.type === 1) {
      payload.days = Number(formData.value.days) || 0
    }

    const newTodo = await API.todo.addTodo(payload)
    todos.value.unshift(newTodo)
    uni.showToast({ title: '添加成功', icon: 'success' })
    closeModal()
  } catch (e) {
    console.error('Failed to add todo:', e)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}
// --- End Modal Logic ---

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

const handleToggle = async (task: TodoItem) => {
  // Optimistic update
  const originalStatus = task.if_complete
  const originalMappedStatus = task.is_completed

  task.if_complete = !originalStatus
  task.is_completed = !originalMappedStatus // Update mapped prop for UI

  try {
    await API.todo.updateTodo(task.id, { if_complete: task.if_complete })
  } catch (e) {
    // Revert on failure
    task.if_complete = originalStatus
    task.is_completed = originalMappedStatus
    console.error('Failed to update todo:', e)
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
}

const handleDelete = (id: number) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await API.todo.deleteTodo(id)
          todos.value = todos.value.filter(t => t.id !== id)
          uni.showToast({ title: '已删除', icon: 'success' })
        } catch (e) {
          console.error('Failed to delete todo:', e)
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
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
    url: `/pages/${pageName}/${pageName}`
  })
}

onShow(() => {
  fetchTodos()
})
</script>
<template>
  <view class="page-container">
    <!-- Header -->
    <BackBar bgColor="#ffffff" :custom-left="true">
      <template #left>
        <view class="header-left" @click="goHome">
          <image src="/static/home.svg" class="header-icon" />
          <text class="header-title">打卡管理</text>
        </view>
      </template>
      <template #right>
        <view class="header-right" @click="openModal">新增</view>
      </template>
    </BackBar>

    <!-- Top Navigation -->
    <view class="top-nav-bar">
      <view class="nav-tab active">打卡</view>
      <view class="nav-tab" @click="goToPage('todoChart')">数据</view>
      <view class="nav-tab" @click="goToPage('todoEdit')">编辑</view>
    </view>

    <!-- Main Content Grid -->
    <scroll-view scroll-y class="main-content">
      <view class="grid-container">
        <!-- 紧急事务 (Urgent Tasks) -->
        <view class="card urgent-card">
          <view class="card-header">
            <text class="card-title text-urgent">紧急事务</text>
          </view>
          <view class="card-body">
            <view 
              v-for="task in urgentTasks" 
              :key="task.id" 
              class="task-item bg-white-60 text-urgent"
              @longpress="handleDelete(task.id)"
              @click="handleToggle(task)"
            >
              <text class="task-icon check-box">{{ task.is_completed ? '☑' : '☐' }}</text>
              <view class="task-info">
                <text class="task-text" :class="{ 'line-through opacity-70': task.is_completed }">{{ task.title }}</text>
                <text class="task-meta" v-if="task.deadline">{{ formatDate(task.deadline) }}</text>
              </view>
            </view>
            <view v-if="urgentTasks.length === 0" class="empty-tip text-urgent">暂无事项</view>
          </view>
        </view>

        <!-- 日常习惯 (Daily Habits) -->
        <view class="card habit-card">
          <view class="card-header">
            <text class="card-title text-habit">日常习惯</text>
            <view class="header-actions">
              <view class="toggle-btn text-habit bg-white-50" @click="toggleHabitType">
                <text class="habit-icon">{{ isPositiveHabit ? '😊' : '😈' }}</text>
              </view>
            </view>
          </view>
          <view class="card-body">
            <view 
              v-for="task in habitTasks" 
              :key="task.id" 
              class="task-item bg-white-60 text-habit"
              @longpress="handleDelete(task.id)"
              @click="handleToggle(task)"
            >
              <text class="task-icon check-box">{{ task.is_completed ? '☑' : '☐' }}</text>
              <view class="task-info">
                <text class="task-text" :class="{ 'line-through opacity-70': task.is_completed }">{{ task.title }}</text>
                <text class="task-meta">坚持 {{ task.days || 0 }} 天</text>
              </view>
            </view>
            <view v-if="habitTasks.length === 0" class="empty-tip text-habit">暂无习惯</view>
          </view>
        </view>

        <!-- 待办事项 (To-do List) -->
        <view class="card todo-card">
          <view class="card-header">
            <text class="card-title text-todo">待办事项</text>

          </view>
          <view class="card-body">
            <view 
              v-for="task in todoTasks" 
              :key="task.id" 
              class="task-item bg-white-60 text-todo"
              @longpress="handleDelete(task.id)"
              @click="handleToggle(task)"
            >
              <text class="task-icon check-box">{{ task.is_completed ? '☑' : '☐' }}</text>
              <text class="task-text" :class="{ 'line-through opacity-70': task.is_completed }">{{ task.title }}</text>
            </view>
            <view v-if="todoTasks.length === 0" class="empty-tip text-todo">暂无待办</view>
          </view>
        </view>

        <!-- 长期进度 (Long-term Progress) -->
        <view class="card progress-card">
          <view class="card-header">
            <text class="card-title text-progress">长期进度</text>
          </view>
          <view class="card-body">
            <view 
              v-for="task in progressTasks" 
              :key="task.id" 
              class="progress-item"
              @longpress="handleDelete(task.id)"
            >
              <view class="progress-info text-progress">
                <text class="progress-name">{{ task.title }}</text>
                <text class="progress-val">{{ task.progress || 0 }}/{{ task.max || 0 }}{{ task.unit }}</text>
              </view>
              <view class="progress-bar-row">
                <view class="progress-bar-bg bg-white-50">
                  <view class="progress-bar-fill bg-progress-fill" :style="{ width: (task.progress_percentage || 0) + '%' }"></view>
                </view>
                <text class="progress-percent text-progress">{{ task.progress_percentage || 0 }}%</text>
              </view>
            </view>
            <view v-if="progressTasks.length === 0" class="empty-tip text-progress">暂无进度</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- Add Task Modal -->
    <view v-if="showModal" class="modal-overlay" @click="closeModal">
      <view class="modal-content" @click.stop>
        <!-- Header -->
        <view class="modal-header">
          <text class="modal-title">新建任务</text>
        </view>

        <!-- Form Content -->
        <scroll-view scroll-y class="modal-body">
          <view class="form-container">
            <!-- Task Title -->
            <view class="form-group">
              <text class="label">任务名称</text>
              <view class="input-container">
                <input class="input" v-model="formData.title" placeholder="例如：读书" type="text" />
              </view>

            </view>

            <!-- Task Type -->
            <view class="form-group">
              <text class="label">任务类型</text>
              <view class="label-badges">
                 <view 
                  v-for="(type, index) in typeOptions" 
                  :key="index"
                  class="badge"
                  :class="formData.type === index ? 'badge-blue active' : 'badge-default'"
                  @click="formData.type = index"
                >
                  <text>{{ type }}</text>
                </view>
              </view>
            </view>

            <!-- Label Badges -->
            <view class="form-group">
              <text class="label">标签</text>
              <view class="label-badges">
                <view 
                  v-for="(badge, index) in labelOptions" 
                  :key="index"
                  class="badge"
                  :class="[badge.colorClass, { active: formData.label === badge.name }]"
                  @click="formData.label = badge.name"
                >
                  <text>{{ badge.name }}</text>
                </view>
              </view>
            </view>

            <!-- Description -->
            <view class="form-group">
              <text class="label">描述</text>
              <view class="input-container">
                <textarea class="textarea" v-model="formData.desc" placeholder="添加一些备注..." auto-height :maxlength="-1"></textarea>
              </view>
            </view>

            <!-- Deadline (Not for Habits) -->
            <view v-if="formData.type !== 0 && formData.type !== 1" class="form-group">
              <text class="label">截止日期 <text v-if="formData.type === 4" class="required">*</text></text>
              <view class="datetime-col">

                  <picker mode="date" :value="formData.deadline" @change="(e: any) => formData.deadline = e.detail.value">
                    <view class="input-container">
                    <view class="picker-view">
                      <text :class="{'text-placeholder': !formData.deadline}">{{ formData.deadline || '日期' }}</text>
                      <text class="picker-icon">📅</text>
                    </view>
                    </view>
                  </picker>


                  <picker mode="time" :value="formData.time" @change="(e: any) => formData.time = e.detail.value">
                    <view class="input-container">
                    <view class="picker-view">
                      <text :class="{'text-placeholder': !formData.time}">{{ formData.time || '时间' }}</text>
                      <text class="picker-icon">⏰</text>
                    </view>
                    </view>
                  </picker>

              </view>
            </view>

            <!-- Goal Tracking (Progress only) -->
            <view v-if="formData.type === 3" class="goal-tracking">
              <view class="goal-header">
                <text class="goal-icon">🎯</text>
                <text class="goal-title">目标追踪</text>
              </view>
              <view class="goal-row">
                <view class="goal-col">
                  <text class="label">目标总量 <text class="required">*</text></text>
                  <view class="input-container" style="width: 200rpx">
                    <input class="input bg-white" v-model.number="formData.max" type="number" placeholder="0" />
                  </view>
                </view>
                <view class="goal-col">
                  <text class="label">单位</text>
                  <view class="input-container" style="width: 200rpx">
                    <input class="input bg-white" v-model="formData.unit" type="text" placeholder="例如：页" />
                  </view>
                </view>
              </view>
            </view>

            <!-- Estimated Duration (Just visual/optional mapping to days if needed) -->

          </view>
        </scroll-view>

        <!-- Footer -->
        <view class="modal-footer">
          <view class="btn cancel-btn" @click="closeModal">取消</view>
          <view class="btn save-btn" @click="handleSaveTask">保存任务</view>
        </view>
      </view>
    </view>

  </view>
</template>



<style scoped>
/* Base Layout */
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f6f6f8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  position: relative; /* For FAB positioning context */
}

/* Top Navigation Bar */
.top-nav-bar {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  background-color: #ffffff;
  padding: 0 32rpx;
  border-bottom: 2rpx solid #e2e8f0;
}

.nav-tab {
  padding: 24rpx 32rpx;
  font-size: 28rpx;
  color: #64748b;
  position: relative;
  cursor: pointer;
}

.nav-tab.active {
  color: #2b6cee;
  font-weight: 600;
}

.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  border-radius: 6rpx 6rpx 0 0;
  background-color: #2b6cee;
}

/* FAB Styles */
.fab-btn {
  position: absolute;
  right: 40rpx;
  bottom: 160rpx; /* Above bottom nav */
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background-color: #2b6cee;
  box-shadow: 0 8rpx 12rpx rgba(43, 108, 238, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.fab-icon {
  color: white;
  font-size: 60rpx;
  font-weight: bold;
  line-height: 1;
}

/* Header - Removed since BackBar handles it */
/* But keep necessary styles for components inside BackBar */
.header-btn {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.more-btn { justify-content: flex-end; }

.icon {
  font-size: 40rpx;
  color: #0f172a;
}

/* Main Content Grid */
.main-content {
  flex: 1;
  /* Remove height: 0 to allow flex grow */
  /* height: 0; */ 
  /* Padding handled in grid-container to avoid scroll issues */
  display: flex;
  flex-direction: column;
}

.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Two columns */
  grid-template-rows: 1fr 1fr; /* Two equal rows */
  gap: 24rpx;
  padding: 32rpx;
  height: 100%; /* Fill the scroll view */
  box-sizing: border-box;
}

/* Card Common Styles */
.card {
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.05);
  height: 100%; /* Fill the grid cell */
  box-sizing: border-box;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.card-title {
  font-size: 32rpx; /* Slightly smaller to fit 2 cols */
  font-weight: 700;
}

.card-body {
  margin-top: auto; /* Push content to bottom like flex-end */
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  flex: 1; /* Allow body to take remaining space */
  overflow-y: auto; /* Allow scrolling within card if many items */
}

.empty-tip {
  font-size: 24rpx;
  opacity: 0.6;
  text-align: center;
  margin-top: 40rpx;
}

.add-btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.icon-add {
  font-size: 36rpx;
  line-height: 1;
  font-weight: bold;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.toggle-btn {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-weight: 500;
}

/* Task Items */
.task-item {
  border-radius: 16rpx;
  padding: 16rpx;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-text {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.task-icon {
  font-size: 28rpx;
  margin-left: 16rpx;
}
.check-box {
  margin-left: 0;
  margin-right: 16rpx;
}

.bold {
  font-weight: 700;
  font-size: 24rpx;
}

.line-through {
  text-decoration: line-through;
}

.opacity-70 {
  opacity: 0.7;
}

/* Theme Specifics */
/* Urgent */
.urgent-card { background-color: #fee2e2; }
.text-urgent { color: #991b1b; }

/* Habit */
.habit-card { background-color: #dcfce7; }
.text-habit { color: #166534; }

/* Todo */
.todo-card { background-color: #e0f2fe; }
.text-todo { color: #075985; }

/* Progress */
.progress-card { background-color: #f3e8ff; }
.text-progress { color: #6b21a8; }
.bg-progress-fill { background-color: #6b21a8; }

/* Utilities */
.bg-white-60 { background-color: rgba(255, 255, 255, 0.6); }
.bg-white-50 { background-color: rgba(255, 255, 255, 0.5); }
.hover-bg-white:active { background-color: rgba(255, 255, 255, 0.5); }

/* Progress Bar Specifics */
.progress-item {
  margin-bottom: 8rpx;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 20rpx;
  margin-bottom: 8rpx;
}

.progress-bar-bg {
  width: 100%;
  height: 12rpx;
  border-radius: 999rpx;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 999rpx;
}

/* --- Modal Styles --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(16, 22, 34, 0.4);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
}

.modal-content {
  background-color: #ffffff;
  width: 680rpx;
  max-width: 900rpx;
  border-radius: 24rpx;
  box-shadow: 0 20rpx 50rpx rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
  box-sizing: border-box;
}

.modal-header {
  padding: 32rpx 40rpx;
  border-bottom: 2rpx solid #c4c6cf;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #101622;
}

.close-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  transition: background-color 0.2s;
}

.close-btn:active {
  background-color: #f1f1f4;
}

.icon-close {
  font-size: 48rpx;
  color: #44474e;
  line-height: 1;
}

.modal-body {
  flex: 1;
  padding: 40rpx;
  overflow-y: auto;
  overflow-x: hidden;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  padding-bottom: 40rpx;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.label {
  font-size: 28rpx;
  font-weight: 600;
  color: #44474e;
}

.required {
  color: #ba1a1a;
}
.input-container {
  display: flex;
  align-items: center;
  width: 600rpx;

}
.input, .textarea, .picker-view {
  width:600rpx;
  box-sizing: content-box;
  padding: 24rpx 32rpx;
  border-radius: 16rpx;
  border: 2rpx solid #c4c6cf;
  background-color: #fcfcfd;
  font-size: 26rpx;
  color: #101622;
}

.datetime-col {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.badge-default {
  background-color: #f1f5f9;
  color: #64748b;
  border: 2rpx solid #e2e8f0;
}

.picker-container {
  width: 100%;
  position: relative;
}


.picker-view {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.habit-icon {
  font-size: 32rpx;
  line-height: 1;
}

.text-placeholder {
  color: #74777f;
}

.picker-arrow, .picker-icon {
  color: #74777f;
  font-size: 24rpx;
}

.textarea {
  min-height: 160rpx;
  max-width: 100%;
}

.label-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.badge {
  padding: 8rpx 24rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 500;
  border: 2rpx solid transparent;
  transition: all 0.2s;
}

.badge-blue { background-color: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }
.badge-green { background-color: #dcfce7; color: #15803d; border-color: #bbf7d0; }
.badge-orange { background-color: #ffedd5; color: #c2410c; border-color: #fed7aa; }
.badge-purple { background-color: #f3e8ff; color: #7e22ce; border-color: #e9d5ff; }

.badge.active {
  /* Using standard active ring or darker border */
  border-color: currentColor;
  opacity: 0.8;
  transform: scale(0.95);
}

.goal-tracking {
  width: 600rpx;
  padding: 32rpx;
  background-color: #ffffff;
  border: 2rpx solid #c4c6cf;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  box-sizing: border-box;
}

.goal-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.goal-icon {
  font-size: 32rpx;
}

.goal-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #2b6cee;
}

.goal-row {
  display: flex;
  gap: 24rpx;
}

.goal-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  min-width: 0;
  overflow: hidden;
}

.bg-white {
  background-color: #ffffff;
}

.duration-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.duration-input {
  width: 240rpx;
  min-width: 0;
  flex-shrink: 0;
}

.duration-hint {
  font-size: 24rpx;
  color: #74777f;
}

.modal-footer {
  padding: 32rpx 40rpx;
  border-top: 2rpx solid #c4c6cf;
  background-color: #ffffff;
  display: flex;
  justify-content: flex-end;
  gap: 24rpx;
}

.btn {
  padding: 20rpx 48rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 600;
  text-align: center;
}

.cancel-btn {
  border: 2rpx solid #74777f;
  color: #44474e;
  background-color: transparent;
}

.cancel-btn:active {
  background-color: #f1f1f4;
}

.save-btn {
  background-color: #2b6cee;
  color: #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(43, 108, 238, 0.3);
}

.save-btn:active {
  transform: scale(0.95);
  background-color: #0048b4;
}
/* --- End Modal Styles --- */

/* Bottom Navigation */
.bottom-nav {
  display: flex;
  flex-direction: row;
  border-top: 2rpx solid #e2e8f0;
  background-color: #ffffff;
  padding: 16rpx 32rpx 48rpx 32rpx;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
  color: #64748b;
}

.nav-item.active {
  color: #2b6cee;
}

.nav-icon {
  font-size: 48rpx;
}

.nav-label {
  font-size: 20rpx;
  font-weight: 500;
}

/* Header Elements (in BackBar) */
.header-left {
  display: flex;
  align-items: center;
  margin-left: 20rpx;
  height: 100%;
}

.header-icon {
  width: 48rpx;
  height: 48rpx;
  margin-right: 12rpx;
}

.header-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1e293b;
}

.header-right {
  font-size: 28rpx;
  color: #2b6cee;
  font-weight: 600;
  padding: 8rpx 16rpx;
  margin-right: 20rpx;
}

/* New Styles for Updated Lists */
.task-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  justify-content: center;
}

.task-meta {
  font-size: 20rpx;
  opacity: 0.7;
  margin-top: 4rpx;
}

.progress-bar-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  width: 100%;
}

.progress-bar-bg {
  flex: 1;
  /* Override previous width: 100% if needed, but flex:1 handles it */
}

.progress-percent {
  font-size: 22rpx;
  font-weight: 600;
  min-width: 60rpx;
  text-align: right;
}
</style>