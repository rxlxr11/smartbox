<script setup lang="ts">
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
}>()

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

      <!-- 分类任务状态：有任务展示可编辑列表，空分类展示空态提示 -->
      <view v-if="section.tasks.length > 0" class="flex flex-col">
        <view v-for="task in section.tasks" :key="task.id + '-' + section.key"
          class="flex items-center px-[28rpx] py-[24rpx] border-b-[2rpx] border-b-solid border-[#f1f5f9]"
          @click="emit('edit', task)">
          <view class="w-[56rpx] h-[56rpx] rounded-[18rpx] flex items-center justify-center shrink-0"
            :style="{ backgroundColor: section.style.iconBg, color: section.style.text }">
            <view class="i-fa6-solid:pen-to-square text-[24rpx]"></view>
          </view>
          <view class="flex-1 min-w-0 ml-[18rpx]">
            <text class="block text-[28rpx] font-600 text-[#0f172a] overflow-hidden whitespace-nowrap text-ellipsis">
              {{ task.title }}
            </text>
            <text class="block mt-[8rpx] text-[22rpx] text-[#64748b] overflow-hidden whitespace-nowrap text-ellipsis">
              {{ task.deadline ? formatDate(task.deadline) : (task.description || '点击编辑任务详情') }}
            </text>
          </view>
          <view class="i-fa6-solid:chevron-right text-[24rpx] text-[#94a3b8] ml-[16rpx] shrink-0"></view>
        </view>
      </view>
      <view v-else class="text-[24rpx] text-[#94a3b8] text-center py-[48rpx]">
        暂无可编辑任务
      </view>
    </view>
  </view>
</template>
