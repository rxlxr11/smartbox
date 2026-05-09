<script setup lang="ts">
import type { TodoItem } from '@/types/todo'

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

defineProps<{
  sections: TodoSection[]
  activeSectionKey: TodoSectionKey | null
}>()

const emit = defineEmits<{
  (e: 'toggle-section', key: TodoSectionKey): void
  (e: 'toggle-task', task: TodoItem): void
  (e: 'open-progress', task: TodoItem): void
}>()

/**
 * 判断当前分组是否处于展开状态。
 * @param {TodoSectionKey} sectionKey 分组 key
 * @param {TodoSectionKey | null} activeSectionKey 当前展开分组 key
 * @returns {boolean} 是否展开
 */
function isSectionExpanded(sectionKey: TodoSectionKey, activeSectionKey: TodoSectionKey | null) {
  return activeSectionKey === sectionKey
}

/**
 * 格式化任务截止时间。
 * @param {string} dateStr 截止时间
 * @returns {string} MM-DD HH:mm 格式时间
 */
function formatDate(dateStr?: string) {
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
  <!-- 待办分组：收起显示摘要，展开显示可操作任务列表 -->
  <view class="flex-1 flex flex-col h-full">
    <view class="flex flex-col gap-[20rpx] p-[32rpx] box-border">
      <view v-for="section in sections" :key="section.key"
        class="rounded-[28rpx] bg-white overflow-hidden border-[2rpx] border-solid border-[#eef2f7]"
        :style="{ boxShadow: section.style.shadow }">
        <view class="flex items-center min-h-[128rpx] p-[28rpx] box-border" @click="emit('toggle-section', section.key)">
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
              :class="isSectionExpanded(section.key, activeSectionKey) ? 'i-fa6-solid:chevron-up' : 'i-fa6-solid:chevron-down'"
              :style="{ color: section.style.text }"></view>
          </view>
        </view>

        <!-- 展开区域：当前分组展示完整任务操作，其他分组只保留摘要入口 -->
        <view v-if="isSectionExpanded(section.key, activeSectionKey)"
          class="px-[28rpx] pb-[28rpx] border-t-[2rpx] border-t-solid border-[#eef2f7]">
          <view class="h-[20rpx]"></view>

          <!-- 任务状态：有任务展示可操作列表，空分组展示当前分类空态 -->
          <view class="flex flex-col gap-[16rpx]">
            <view v-for="task in section.tasks" :key="task.id + '-' + section.key + '-' + task.is_completed + '-' + task.progress_percentage"
              class="rounded-[18rpx] p-[18rpx] text-[24rpx] flex flex-col"
              :style="{ backgroundColor: section.style.softBg, color: section.style.text }"
              @click="section.key === 'progress' ? emit('open-progress', task) : emit('toggle-task', task)">
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
                  <view class="w-full h-[12rpx] rounded-[999rpx] overflow-hidden bg-[#e2e8f0]">
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
</template>
