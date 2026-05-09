<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TodoItem } from '@/types/todo'

interface TodoEditSection {
  key: string
  title: string
  tag: string
  summary: string
  tasks: TodoItem[]
  style: {
    accent: string
    text: string
    softBg: string
    iconBg: string
    shadow: string
  }
}

defineProps<{
  sections: TodoEditSection[]
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'edit', task: TodoItem): void
  (e: 'delete', task: TodoItem): void
}>()

const detailPopupVisible = ref(false)
const detailTask = ref<TodoItem | null>(null)

const taskTypeTextMap: Record<number, string> = {
  0: '反向习惯',
  1: '正向习惯',
  2: '待办事项',
  3: '进度管理',
  4: '紧急事务'
}

const detailStatusText = computed(() => {
  const task = detailTask.value
  if (!task) return ''
  if (task.category === 'progress') {
    return (task.progress_percentage || 0) >= 100 ? '已达成' : `进行中 ${task.progress_percentage || 0}%`
  }
  return task.is_completed ? '已完成' : '未完成'
})

/**
 * 格式化任务截止时间，便于编辑列表快速识别任务。
 * @param {string} dateStr 截止时间
 * @returns {string} MM-DD HH:mm 格式时间
 */
const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  const h = date.getHours().toString().padStart(2, '0')
  const min = date.getMinutes().toString().padStart(2, '0')
  return `${m}-${d} ${h}:${min}`
}

/**
 * 打开任务详情弹窗。
 * @param {TodoItem} task 任务项
 * @returns {void}
 */
function openDetailPopup(task: TodoItem) {
  detailTask.value = task
  detailPopupVisible.value = true
}

/**
 * 关闭任务详情弹窗。
 * @returns {void}
 */
function closeDetailPopup() {
  detailPopupVisible.value = false
  detailTask.value = null
}
</script>

<template>
  <!-- 编辑入口：同页展示任务管理列表，具体表单仍复用原编辑页 -->
  <view class="flex flex-col gap-[24rpx] p-[32rpx] box-border">
    <view
      class="flex items-center justify-center gap-[12rpx] rounded-[20rpx] bg-[#0a56d1] py-[24rpx] text-white text-[30rpx] font-700"
      @click="emit('add')">
      <view class="i-fa6-solid:plus text-[26rpx]"></view>
      <text>新增任务</text>
    </view>

    <view v-for="section in sections" :key="section.key"
      class="rounded-[24rpx] bg-white overflow-hidden border-[2rpx] border-solid border-[#eef2f7]"
      :style="{ boxShadow: section.style.shadow }">
      <view class="flex items-center p-[28rpx] border-b-[2rpx] border-b-solid border-[#eef2f7]">
        <view class="w-[8rpx] h-[56rpx] rounded-[999rpx] shrink-0" :style="{ backgroundColor: section.style.accent }"></view>
        <view class="flex-1 min-w-0 ml-[20rpx]">
          <view class="flex items-center">
            <text class="text-[30rpx] font-700 text-[#0f172a]">{{ section.title }}</text>
            <text class="ml-[12rpx] text-[20rpx] py-[4rpx] px-[12rpx] rounded-[999rpx]"
              :style="{ backgroundColor: section.style.softBg, color: section.style.text }">{{ section.tag }}</text>
          </view>
          <text class="block mt-[8rpx] text-[24rpx] text-[#64748b] overflow-hidden whitespace-nowrap text-ellipsis">
            {{ section.summary }}
          </text>
        </view>
      </view>

      <!-- 分类任务状态：有任务展示可左滑操作列表，空分类展示空态提示 -->
      <view v-if="section.tasks.length > 0" class="flex flex-col">
        <wd-swipe-action v-for="task in section.tasks" :key="task.id + '-' + section.key">
          <view
            class="flex items-center px-[28rpx] py-[24rpx] bg-white border-b-[2rpx] border-b-solid border-[#f1f5f9]"
            @click="openDetailPopup(task)">
            <view class="w-[56rpx] h-[56rpx] rounded-[18rpx] flex items-center justify-center shrink-0"
              :style="{ backgroundColor: section.style.iconBg, color: section.style.text }">
              <view class="i-fa6-solid:circle-info text-[24rpx]"></view>
            </view>
            <view class="flex-1 min-w-0 ml-[18rpx]">
              <text class="block text-[28rpx] font-600 text-[#0f172a] overflow-hidden whitespace-nowrap text-ellipsis">
                {{ task.title }}
              </text>
              <text class="block mt-[8rpx] text-[22rpx] text-[#64748b] overflow-hidden whitespace-nowrap text-ellipsis">
                {{ task.deadline ? formatDate(task.deadline) : (task.description || '点击查看任务详情') }}
              </text>
            </view>
            <view class="i-fa6-solid:chevron-left text-[24rpx] text-[#94a3b8] ml-[16rpx] shrink-0"></view>
          </view>

          <template #right>
            <view class="h-full w-[176rpx] flex items-center justify-center gap-[20rpx] bg-[#f8fafc]">
              <view
                class="w-[64rpx] h-[64rpx] rounded-[999rpx] bg-[#fee2e2] text-[#b91c1c] flex items-center justify-center"
                @click.stop="emit('delete', task)">
                <view class="i-fa6-solid:trash-can text-[26rpx]"></view>
              </view>
              <view
                class="w-[64rpx] h-[64rpx] rounded-[999rpx] bg-[#dbeafe] text-[#1d4ed8] flex items-center justify-center"
                @click.stop="emit('edit', task)">
                <view class="i-fa6-solid:pen-to-square text-[26rpx]"></view>
              </view>
            </view>
          </template>
        </wd-swipe-action>
      </view>
      <view v-else class="text-[24rpx] text-[#94a3b8] text-center py-[48rpx]">
        暂无可编辑任务
      </view>
    </view>

    <!-- 详情弹窗：点击编辑列表任务时展示，不直接进入编辑页 -->
    <wd-popup v-model="detailPopupVisible" position="bottom" :z-index="999" :safe-area-inset-bottom="true"
      custom-style="border-radius: 32rpx 32rpx 0 0; overflow: hidden;" @close="closeDetailPopup">
      <view class="bg-white w-full max-h-[80vh] flex flex-col overflow-hidden box-border">
        <view class="py-[32rpx] px-[40rpx] border-b-[2rpx] border-b-solid border-[#e2e8f0] flex justify-between items-center">
          <text class="text-[36rpx] font-700 text-[#101622]">任务详情</text>
          <view class="w-[48rpx] h-[48rpx] i-fa6-solid:xmark text-[#64748b]" @click="closeDetailPopup"></view>
        </view>

        <view v-if="detailTask" class="flex-1 p-[40rpx] overflow-y-auto overflow-x-hidden">
          <view class="flex flex-col gap-[28rpx] pb-[40rpx]">
            <view class="flex flex-col gap-[10rpx]">
              <text class="text-[24rpx] text-[#64748b]">任务名称</text>
              <text class="text-[32rpx] font-700 text-[#0f172a] break-words">{{ detailTask.title }}</text>
            </view>

            <view class="grid grid-cols-2 gap-[20rpx]">
              <view class="rounded-[18rpx] bg-[#f8fafc] p-[24rpx]">
                <text class="block text-[22rpx] text-[#64748b]">类型</text>
                <text class="block mt-[10rpx] text-[28rpx] font-600 text-[#0f172a]">{{ taskTypeTextMap[detailTask.type] || '任务' }}</text>
              </view>
              <view class="rounded-[18rpx] bg-[#f8fafc] p-[24rpx]">
                <text class="block text-[22rpx] text-[#64748b]">状态</text>
                <text class="block mt-[10rpx] text-[28rpx] font-600 text-[#0f172a]">{{ detailStatusText }}</text>
              </view>
            </view>

            <view v-if="detailTask.category === 'progress'" class="rounded-[18rpx] bg-[#f8fafc] p-[24rpx]">
              <view class="flex justify-between text-[24rpx] text-[#334155]">
                <text>{{ detailTask.current_value || 0 }}/{{ detailTask.target_value || 0 }}{{ detailTask.unit }}</text>
                <text>{{ detailTask.progress_percentage || 0 }}%</text>
              </view>
              <view class="mt-[16rpx] h-[14rpx] rounded-[999rpx] overflow-hidden bg-[#e2e8f0]">
                <view class="h-full rounded-[999rpx] bg-[#9333ea]"
                  :style="{ width: (detailTask.progress_percentage || 0) + '%' }"></view>
              </view>
            </view>

            <view v-if="detailTask.deadline" class="flex flex-col gap-[10rpx]">
              <text class="text-[24rpx] text-[#64748b]">截止时间</text>
              <text class="text-[28rpx] text-[#0f172a]">{{ formatDate(detailTask.deadline) }}</text>
            </view>

            <view class="flex flex-col gap-[10rpx]">
              <text class="text-[24rpx] text-[#64748b]">描述</text>
              <text class="text-[28rpx] text-[#0f172a] leading-[1.6] break-words">{{ detailTask.description || '暂无描述' }}</text>
            </view>
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>
