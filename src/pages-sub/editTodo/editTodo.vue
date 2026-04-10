<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BackBar from '@/components/BackBar/BackBar.vue'
import { API } from '@/api'
import type { TodoItem } from '@/types/todo'

type EditMode = 'add' | 'edit'

const mode = ref<EditMode>('add')
const taskId = ref<number | null>(null)
const loading = ref(false)
const paging = ref<any>(null)
const pagingData = ref<any[]>([])

const handlePagingQuery = () => {
  paging.value?.complete([])
}

const typeOptions = ['反向习惯', '正向习惯', '待办事项', '进度管理', '紧急事务']
const labelOptions = [
  { name: '工作', colorClass: 'badge-blue' },
  { name: '个人', colorClass: 'badge-green' },
  { name: '学习', colorClass: 'badge-orange' },
  { name: '健康', colorClass: 'badge-purple' },
]

const defaultFormData = () => ({
  type: 2,
  title: '',
  description: '',
  label: '个人',
  deadline: '',
  time: '',
  target_value: undefined as number | undefined,
  unit: '',
  streak_days: 0,
  repeat_pattern: [0] as number[]
})

const formData = ref(defaultFormData())

const dayNames: Record<number, string> = {
  1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '日'
}

const getDayName = (day: number) => dayNames[day]

const isDaily = () => {
  return formData.value.repeat_pattern.length === 1 && formData.value.repeat_pattern[0] === 0
}

const setDaily = () => {
  formData.value.repeat_pattern = [0]
}

const setCustomDays = () => {
  formData.value.repeat_pattern = [1, 2, 3, 4, 5]
}

const isDaySelected = (day: number) => {
  if (isDaily()) return false
  return formData.value.repeat_pattern.includes(day)
}

const toggleDay = (day: number) => {
  if (isDaily()) {
    formData.value.repeat_pattern = [day]
    return
  }

  let days = [...formData.value.repeat_pattern]
  if (days.includes(day)) {
    days = days.filter(d => d !== day)
  } else {
    days.push(day)
  }

  if (days.length === 0) {
    formData.value.repeat_pattern = [0]
  } else {
    days.sort((a, b) => a - b)
    formData.value.repeat_pattern = days
  }
}

const parseRepeatPattern = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    const parsed = value.map(v => Number(v)).filter(v => !Number.isNaN(v))
    return parsed.length ? parsed : [0]
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return [0]

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const content = trimmed.slice(1, -1)
      const parsed = content
        .split(',')
        .map(v => Number(v.trim()))
        .filter(v => !Number.isNaN(v))
      return parsed.length ? parsed : [0]
    }
  }

  return [0]
}

const loadTask = async (id: number) => {
  loading.value = true
  try {
    const task = await API.todo.getTodoById(id)
    const t = task as TodoItem

    let deadline = ''
    let time = ''
    if (t.deadline) {
      const dt = new Date(t.deadline)
      deadline = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
      time = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
    }

    formData.value = {
      type: t.type,
      title: t.title,
      description: t.description || '',
      label: t.label || '个人',
      deadline,
      time,
      target_value: t.target_value,
      unit: t.unit || '',
      streak_days: t.streak_days || 0,
      repeat_pattern: parseRepeatPattern(t.repeat_pattern)
    }
  } catch (e) {
    console.error('Failed to load todo:', e)
    uni.showToast({ title: '加载任务失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  const rawMode = options?.mode
  mode.value = rawMode === 'edit' ? 'edit' : 'add'

  const type = Number(options?.type)
  if (!Number.isNaN(type) && type >= 0 && type <= 4) {
    formData.value.type = type
  }

  if (mode.value === 'edit') {
    const id = Number(options?.id)
    if (Number.isNaN(id) || id <= 0) {
      uni.showToast({ title: '任务参数无效', icon: 'none' })
      setTimeout(() => {
        goBack()
      }, 300)
      return
    }

    taskId.value = id
    loadTask(id)
    return
  }

  formData.value = defaultFormData()
  if (!Number.isNaN(type) && type >= 0 && type <= 4) {
    formData.value.type = type
  }
})

const goBack = () => {
  uni.navigateBack({
    fail: () => {
      uni.reLaunch({ url: '/pages/todoList/todoList' })
    }
  })
}

const validateForm = () => {
  if (!formData.value.title.trim()) {
    uni.showToast({ title: '请输入任务名称', icon: 'none' })
    return false
  }
  if (formData.value.type === 4 && !formData.value.deadline) {
    uni.showToast({ title: '紧急任务需选择日期', icon: 'none' })
    return false
  }
  if (formData.value.type === 3 && (!formData.value.target_value || formData.value.target_value <= 0)) {
    uni.showToast({ title: '请填写有效的目标总量', icon: 'none' })
    return false
  }

  return true
}

const buildPayload = () => {
  const payload: Record<string, any> = {
    type: formData.value.type,
    title: formData.value.title,
    description: formData.value.description,
    label: formData.value.label,
  }

  if (mode.value === 'add') {
    payload.is_completed = false
    payload.is_active = true
  }

  if (formData.value.type !== 0 && formData.value.type !== 1 && formData.value.deadline) {
    const timeStr = formData.value.time || '23:59:59'
    payload.deadline = `${formData.value.deadline}T${timeStr}Z`
  }

  if (formData.value.type === 3) {
    payload.target_value = Number(formData.value.target_value)
    payload.unit = formData.value.unit
    if (mode.value === 'add') {
      payload.current_value = 0
    }
  }

  if (formData.value.type === 0 || formData.value.type === 1) {
    if (mode.value === 'add') {
      payload.streak_days = Number(formData.value.streak_days) || 0
    }
    payload.repeat_pattern = `{${formData.value.repeat_pattern.join(',')}}`
  }

  return payload
}

const handleSave = async () => {
  if (!validateForm()) return
  const payload = buildPayload()

  uni.showLoading({ title: '保存中...' })
  try {
    if (mode.value === 'edit') {
      if (!taskId.value) {
        uni.hideLoading()
        return uni.showToast({ title: '任务参数无效', icon: 'none' })
      }
      await API.todo.updateTodo(taskId.value, payload)
      uni.hideLoading()
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await API.todo.addTodo(payload)
      uni.hideLoading()
      uni.showToast({ title: '添加成功', icon: 'success' })
    }

    setTimeout(() => {
      goBack()
    }, 250)
  } catch (e) {
    console.error('Failed to save todo:', e)
    uni.hideLoading()
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

const handleDelete = () => {
  if (mode.value !== 'edit' || !taskId.value) return

  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    success: async (res) => {
      if (!res.confirm || !taskId.value) return

      uni.showLoading({ title: '删除中...' })
      try {
        await API.todo.deleteTodo(taskId.value)
        uni.hideLoading()
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => {
          goBack()
        }, 250)
      } catch (e) {
        console.error('Failed to delete todo:', e)
        uni.hideLoading()
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  })
}
</script>

<template>
  <view class="min-h-screen bg-[#f6f6f6] flex flex-col">
    <z-paging ref="paging" bg-color="#f6f6f6"  :use-page-scroll="false"
              :loading-more-enabled="false" :show-scrollbar="false">
      <template #top>
        <BackBar bgColor="#ffffff" :custom-left="true">
          <template #left>
            <view class="flex items-center ml-[20rpx] h-full" @click="goBack">
              <view class="w-[40rpx] h-[40rpx] i-fa6-solid:chevron-left flex items-center justify-center text-[#0f172a]"></view>
              <text class="text-[#0f172a] text-[36rpx] font-bold ml-[16rpx]">{{ mode === 'edit' ? '编辑任务' : '新建任务' }}</text>
            </view>
          </template>
        </BackBar>
      </template>

      <view class="p-[32rpx] box-border">
        <view class="bg-white rounded-[24rpx] p-[32rpx] shadow-[0_2rpx_8rpx_rgba(0,0,0,0.05)]">
          <view v-if="loading" class="text-[28rpx] text-[#64748b] text-center py-[60rpx]">加载中...</view>

          <view v-else class="flex flex-col gap-[32rpx]">
            <view class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
              <text class="text-[28rpx] font-600 text-[#44474e]">任务名称</text>
              <view class="flex items-center w-[600rpx]">
                <input
                    class="w-[600rpx] box-content py-[24rpx] px-[32rpx] rounded-[16rpx] border-[2rpx] border-solid border-[#c4c6cf] bg-[#fcfcfd] text-[26rpx] text-[#101622]"
                    v-model="formData.title" placeholder="例如：读书" type="text" />
              </view>
            </view>

            <view class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
              <text class="text-[28rpx] font-600 text-[#44474e]">任务类型</text>
              <view class="flex flex-wrap gap-[16rpx]">
                <view v-for="(type, index) in typeOptions" :key="index"
                      class="py-[8rpx] px-[24rpx] rounded-[999rpx] text-[24rpx] font-500 border-[2rpx] border-solid transition-all duration-200"
                      :class="formData.type === index ? 'bg-[#dbeafe] text-[#1d4ed8] border-[#bfdbfe] opacity-80 scale-95' : 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]'"
                      @click="formData.type = index">
                  <text>{{ type }}</text>
                </view>
              </view>
            </view>

            <view class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
              <text class="text-[28rpx] font-600 text-[#44474e]">标签</text>
              <view class="flex flex-wrap gap-[16rpx]">
                <view v-for="(badge, index) in labelOptions" :key="index"
                      class="py-[8rpx] px-[24rpx] rounded-[999rpx] text-[24rpx] font-500 border-[2rpx] border-solid transition-all duration-200"
                      :class="[
                  badge.colorClass === 'badge-blue' ? 'bg-[#dbeafe] text-[#1d4ed8] border-[#bfdbfe]' :
                    badge.colorClass === 'badge-green' ? 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]' :
                      badge.colorClass === 'badge-orange' ? 'bg-[#ffedd5] text-[#c2410c] border-[#fed7aa]' :
                        badge.colorClass === 'badge-purple' ? 'bg-[#f3e8ff] text-[#7e22ce] border-[#e9d5ff]' : '',
                  { 'opacity-80 scale-95 border-current': formData.label === badge.name }
                ]" @click="formData.label = badge.name">
                  <text>{{ badge.name }}</text>
                </view>
              </view>
            </view>

            <view class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
              <text class="text-[28rpx] font-600 text-[#44474e]">描述</text>
              <view class="flex items-center w-[600rpx]">
              <textarea
                  class="min-h-[160rpx] max-w-full w-[600rpx] box-content py-[24rpx] px-[32rpx] rounded-[16rpx] border-[2rpx] border-solid border-[#c4c6cf] bg-[#fcfcfd] text-[26rpx] text-[#101622]"
                  v-model="formData.description" placeholder="添加一些备注..." auto-height :maxlength="-1"></textarea>
              </view>
            </view>

            <view v-if="formData.type === 0 || formData.type === 1" class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
              <text class="text-[28rpx] font-600 text-[#44474e]">重复规律</text>
              <view class="flex flex-col gap-[16rpx]">
                <view class="flex items-center gap-[16rpx]">
                  <view
                      class="py-[8rpx] px-[24rpx] rounded-[999rpx] text-[24rpx] font-500 border-[2rpx] border-solid transition-all duration-200"
                      :class="isDaily() ? 'bg-[#dbeafe] text-[#1d4ed8] border-[#bfdbfe] opacity-80 scale-95' : 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]'"
                      @click="setDaily()">每天</view>
                  <view
                      class="py-[8rpx] px-[24rpx] rounded-[999rpx] text-[24rpx] font-500 border-[2rpx] border-solid transition-all duration-200"
                      :class="!isDaily() ? 'bg-[#dbeafe] text-[#1d4ed8] border-[#bfdbfe] opacity-80 scale-95' : 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]'"
                      @click="setCustomDays()">自定义星期</view>
                </view>

                <view v-if="!isDaily()" class="flex flex-wrap gap-[16rpx] mt-[8rpx]">
                  <view v-for="day in [1, 2, 3, 4, 5, 6, 7]" :key="day"
                        class="w-[60rpx] h-[60rpx] rounded-full flex items-center justify-center text-[24rpx] border-[2rpx] border-solid transition-all duration-200"
                        :class="isDaySelected(day) ? 'bg-[#1d4ed8] text-white border-[#1d4ed8]' : 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]'"
                        @click="toggleDay(day)">
                    {{ getDayName(day) }}
                  </view>
                </view>
              </view>
            </view>

            <view v-if="formData.type !== 0 && formData.type !== 1" class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
              <text class="text-[28rpx] font-600 text-[#44474e]">截止日期 <text v-if="formData.type === 4" class="text-[#ba1a1a]">*</text></text>
              <view class="flex flex-col gap-[16rpx]">
                <picker mode="date" :value="formData.deadline" @change="(e: any) => formData.deadline = e.detail.value">
                  <view class="flex items-center w-[600rpx]">
                    <view
                        class="flex justify-between items-center w-[600rpx] box-content py-[24rpx] px-[32rpx] rounded-[16rpx] border-[2rpx] border-solid border-[#c4c6cf] bg-[#fcfcfd] text-[26rpx] text-[#101622]">
                      <text :class="{ 'text-[#74777f]': !formData.deadline }">{{ formData.deadline || '日期' }}</text>
                      <text class="text-[#74777f] text-[24rpx]">📅</text>
                    </view>
                  </view>
                </picker>

                <picker mode="time" :value="formData.time" @change="(e: any) => formData.time = e.detail.value">
                  <view class="flex items-center w-[600rpx]">
                    <view
                        class="flex justify-between items-center w-[600rpx] box-content py-[24rpx] px-[32rpx] rounded-[16rpx] border-[2rpx] border-solid border-[#c4c6cf] bg-[#fcfcfd] text-[26rpx] text-[#101622]">
                      <text :class="{ 'text-[#74777f]': !formData.time }">{{ formData.time || '时间' }}</text>
                      <text class="text-[#74777f] text-[24rpx]">⏰</text>
                    </view>
                  </view>
                </picker>
              </view>
            </view>

            <view v-if="formData.type === 3" class="w-[600rpx]">
              <view class="mb-[16rpx]">
                <text class="mr-[8rpx]">🎯</text>
                <text class="font-600">目标追踪</text>
              </view>
              <view class="flex gap-[32rpx]">
                <view class="flex-1">
                  <text class="text-[28rpx] font-600 text-[#44474e]">目标总量 <text class="text-[#ba1a1a]">*</text></text>
                  <view class="flex items-center w-[200rpx]">
                    <input
                        class="bg-white w-[600rpx] box-content py-[24rpx] px-[32rpx] rounded-[16rpx] border-[2rpx] border-solid border-[#c4c6cf] text-[26rpx] text-[#101622]"
                        v-model.number="formData.target_value" type="number" placeholder="0" />
                  </view>
                </view>
                <view class="flex-1">
                  <text class="text-[28rpx] font-600 text-[#44474e]">单位</text>
                  <view class="flex items-center w-[200rpx]">
                    <input
                        class="bg-white w-[600rpx] box-content py-[24rpx] px-[32rpx] rounded-[16rpx] border-[2rpx] border-solid border-[#c4c6cf] text-[26rpx] text-[#101622]"
                        v-model="formData.unit" type="text" placeholder="例如：页" />
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>


      </view>
      <template #bottom>
        <view class="flex justify-between gap-[24rpx] p-[32rpx] bg-white border-t-[2rpx] border-t-solid border-[#e2e8f0]">
          <view v-if="mode === 'edit'"
                class="i-fa6-solid:trash-can text-[40rpx] text-[#ef4444] ml-[16rpx] self-center" @click="handleDelete">
          </view>
          <view v-else></view>
          <view class="flex gap-[24rpx]">
            <view
                class="py-[20rpx] px-[48rpx] rounded-[999rpx] text-[28rpx] font-600 flex items-center justify-center transition-all duration-200 text-[#44474e] bg-transparent border-[2rpx] border-solid border-[#74777f]"
                @click="goBack">取消</view>
            <view
                class="py-[20rpx] px-[48rpx] rounded-[999rpx] text-[28rpx] font-600 flex items-center justify-center transition-all duration-200 text-white bg-[#0a56d1] shadow-[0_2rpx_6rpx_rgba(0,0,0,0.1)]"
                @click="handleSave">{{ mode === 'edit' ? '保存修改' : '保存任务' }}</view>
          </view>
        </view>
      </template>
    </z-paging>
  </view>
</template>

<style scoped>
</style>
