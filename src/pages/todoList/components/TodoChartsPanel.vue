<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { API } from '@/api'
import type { TodoItem } from '@/types/todo'

const progressTasks = ref<TodoItem[]>([])
const selectedProgressIndex = ref(0)
const lineChartData = ref<any>({})
const timeRanges = ['1个月', '6个月', '1年']
const selectedTimeRangeIndex = ref(0)
const columnChartData = ref<any>({})
const pieChartData = ref<any>({})

/**
 * 获取长期进度任务，并初始化折线图。
 * @returns {Promise<void>}
 */
const fetchProgressTasks = async () => {
  try {
    const tasks = await API.todo.getTodosByType(3)
    progressTasks.value = tasks
    if (tasks.length > 0) {
      await updateLineChart()
    }
  } catch (e) {
    console.error('Failed to fetch progress tasks:', e)
  }
}

/**
 * 切换长期进度任务后刷新折线图。
 * @param {any} e picker 切换事件
 * @returns {void}
 */
const onProgressChange = (e: any) => {
  selectedProgressIndex.value = e.detail.value
  updateLineChart()
}

/**
 * 根据当前长期进度任务生成折线图数据。
 * @returns {Promise<void>}
 */
const updateLineChart = async () => {
  const task = progressTasks.value[selectedProgressIndex.value]
  if (!task) return

  try {
    const records = await API.todo.getTaskRecordsByTaskId(task.id)
    const categories = records.map(r => {
      const d = new Date(r.record_date)
      return `${d.getMonth() + 1}/${d.getDate()}`
    })
    const data = records.map(r => r.value || 0)

    lineChartData.value = {
      categories: categories.length ? categories : ['暂无数据'],
      series: [
        {
          name: task.title,
          data: data.length ? data : [0]
        }
      ]
    }
  } catch (e) {
    console.error('Failed to fetch progress records:', e)
  }
}

/**
 * 切换习惯统计周期后刷新柱状图。
 * @param {any} e picker 切换事件
 * @returns {void}
 */
const onTimeRangeChange = (e: any) => {
  selectedTimeRangeIndex.value = e.detail.value
  updateColumnChart()
}

/**
 * 根据当前周期生成习惯柱状图数据。
 * @returns {Promise<void>}
 */
const updateColumnChart = async () => {
  const range = timeRanges[selectedTimeRangeIndex.value]
  const endDate = new Date()
  const startDate = new Date()

  if (range === '1个月') {
    startDate.setMonth(startDate.getMonth() - 1)
  } else if (range === '6个月') {
    startDate.setMonth(startDate.getMonth() - 6)
  } else if (range === '1年') {
    startDate.setFullYear(startDate.getFullYear() - 1)
  }

  try {
    const habits = await API.todo.getHabitsWithRecords(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    )
    const categories = habits.map((h: any) => h.title)
    const data = habits.map((h: any) => h.streak_days)

    columnChartData.value = {
      categories: categories.length ? categories : ['暂无数据'],
      series: [
        {
          name: '坚持天数',
          data: data.length ? data : [0]
        }
      ]
    }
  } catch (e) {
    console.error('Failed to fetch habit records:', e)
  }
}

/**
 * 生成近七天完成任务时间段饼图数据。
 * @returns {Promise<void>}
 */
const updatePieChart = async () => {
  try {
    const records = await API.todo.getRecentCompletedRecords(7)
    const periodCounts = new Array(12).fill(0)

    records.forEach(r => {
      if (!r.created_at) return
      const d = new Date(r.created_at)
      const hour = d.getHours()
      const periodIndex = Math.floor(hour / 2)
      periodCounts[periodIndex]++
    })

    const pieSeriesData = periodCounts
      .map((count, index) => {
        const start = index * 2
        const end = start + 2
        return {
          name: `${start}:00-${end}:00`,
          value: count
        }
      })
      .filter(item => item.value > 0)

    pieChartData.value = {
      series: [
        {
          data: pieSeriesData.length ? pieSeriesData : [{ name: '无数据', value: 1 }]
        }
      ]
    }
  } catch (e) {
    console.error('Failed to fetch recent records:', e)
  }
}

onMounted(() => {
  fetchProgressTasks()
  updateColumnChart()
  updatePieChart()
})
</script>

<template>
  <!-- 数据图表：展示长期进度、习惯坚持和完成时段统计 -->
  <view class="flex flex-col gap-[32rpx] p-[32rpx] box-border">
    <view class="bg-white rounded-[24rpx] p-[32rpx] shadow-[0_2rpx_8rpx_rgba(0,0,0,0.05)]">
      <view class="flex justify-between items-center mb-[24rpx]">
        <text class="text-[32rpx] text-gray-800 font-bold">长期进度折线图</text>
        <picker mode="selector" :range="progressTasks" range-key="title" :value="selectedProgressIndex"
          @change="onProgressChange">
          <view class="flex items-center bg-[#f1f5f9] px-[20rpx] py-[10rpx] rounded-[12rpx]">
            <text class="text-[26rpx] text-[#475569] mr-[8rpx]">
              {{ progressTasks[selectedProgressIndex]?.title || '选择进度任务' }}
            </text>
            <view class="i-fa6-solid:caret-down text-[24rpx] text-[#475569]"></view>
          </view>
        </picker>
      </view>
      <view class="box-border h-[500rpx] w-full flex items-center justify-center bg-white p-[12rpx]">
        <qiun-data-charts type="line" :chart-data="lineChartData" canvas2d canvas-id="todoListProgressLineChart" />
      </view>
    </view>

    <view class="bg-white rounded-[24rpx] p-[32rpx] shadow-[0_2rpx_8rpx_rgba(0,0,0,0.05)]">
      <view class="flex justify-between items-center mb-[24rpx]">
        <text class="text-[32rpx] text-gray-800 font-bold">习惯柱状图</text>
        <picker mode="selector" :range="timeRanges" :value="selectedTimeRangeIndex" @change="onTimeRangeChange">
          <view class="flex items-center bg-[#f1f5f9] px-[20rpx] py-[10rpx] rounded-[12rpx]">
            <text class="text-[26rpx] text-[#475569] mr-[8rpx]">
              {{ timeRanges[selectedTimeRangeIndex] }}
            </text>
            <view class="i-fa6-solid:caret-down text-[24rpx] text-[#475569]"></view>
          </view>
        </picker>
      </view>
      <view class="box-border h-[500rpx] w-full flex items-center justify-center bg-white p-[12rpx]">
        <qiun-data-charts type="column" :chart-data="columnChartData" canvas2d canvas-id="todoListHabitColumnChart" />
      </view>
    </view>

    <view class="bg-white rounded-[24rpx] p-[32rpx] shadow-[0_2rpx_8rpx_rgba(0,0,0,0.05)]">
      <view class="mb-[24rpx]">
        <text class="text-[32rpx] text-gray-800 font-bold">近七天任务完成时间段</text>
      </view>
      <view class="box-border h-[500rpx] w-full flex items-center justify-center bg-white p-[12rpx]">
        <qiun-data-charts type="pie" :chart-data="pieChartData" canvas2d canvas-id="todoListTimePieChart" />
      </view>
    </view>
  </view>
</template>
