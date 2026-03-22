<template>
  <view v-if="visible"
    class="fixed top-0 left-0 right-0 bottom-0 bg-[rgba(16,22,34,0.4)] z-[999] flex items-center justify-center p-[32rpx]"
    style="backdrop-filter: blur(4px);" @click="close">
    <view
      class="bg-[#ffffff] w-[680rpx] max-w-[900rpx] rounded-[24rpx] shadow-[0_20rpx_50rpx_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] overflow-hidden box-border"
      @click.stop>
      <!-- Header -->
      <view
        class="py-[32rpx] px-[40rpx] border-b-[2rpx] border-b-solid border-[#c4c6cf] flex justify-between items-center">
        <text class="text-[36rpx] font-700 text-[#101622]">新建任务</text>
      </view>

      <!-- Form Content -->
      <scroll-view scroll-y class="flex-1 p-[40rpx] overflow-y-auto overflow-x-hidden">
        <view class="flex flex-col gap-[32rpx] pb-[40rpx] w-full box-border overflow-hidden">
          <!-- Task Title -->
          <view class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
            <text class="text-[28rpx] font-600 text-[#44474e]">任务名称</text>
            <view class="flex items-center w-[600rpx]">
              <input
                class="w-[600rpx] box-content py-[24rpx] px-[32rpx] rounded-[16rpx] border-[2rpx] border-solid border-[#c4c6cf] bg-[#fcfcfd] text-[26rpx] text-[#101622]"
                v-model="formData.title" placeholder="例如：读书" type="text" />
            </view>
          </view>

          <!-- Task Type -->
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

          <!-- Label Badges -->
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

          <!-- Description -->
          <view class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
            <text class="text-[28rpx] font-600 text-[#44474e]">描述</text>
            <view class="flex items-center w-[600rpx]">
              <textarea
                class="min-h-[160rpx] max-w-full w-[600rpx] box-content py-[24rpx] px-[32rpx] rounded-[16rpx] border-[2rpx] border-solid border-[#c4c6cf] bg-[#fcfcfd] text-[26rpx] text-[#101622]"
                v-model="formData.description" placeholder="添加一些备注..." auto-height :maxlength="-1"></textarea>
            </view>
          </view>

          <!-- Repeat Pattern (For Habits Only) -->
          <view v-if="formData.type === 0 || formData.type === 1"
            class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
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

          <!-- Deadline (Not for Habits) -->
          <view v-if="formData.type !== 0 && formData.type !== 1"
            class="flex flex-col gap-[16rpx] w-full box-border overflow-hidden">
            <text class="text-[28rpx] font-600 text-[#44474e]">截止日期 <text v-if="formData.type === 4"
                class="text-[#ba1a1a]">*</text></text>
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

          <!-- Goal Tracking (Progress only) -->
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
      </scroll-view>

      <!-- Footer -->
      <view class="flex justify-end gap-[24rpx] p-[32rpx] border-t-[2rpx] border-t-solid border-[#c4c6cf] bg-[#fcfcfd]">
        <view
          class="py-[20rpx] px-[48rpx] rounded-[999rpx] text-[28rpx] font-600 flex items-center justify-center transition-all duration-200 text-[#44474e] bg-transparent border-[2rpx] border-solid border-[#74777f]"
          @click="close">取消</view>
        <view
          class="py-[20rpx] px-[48rpx] rounded-[999rpx] text-[28rpx] font-600 flex items-center justify-center transition-all duration-200 text-white bg-[#0a56d1] shadow-[0_2rpx_6rpx_rgba(0,0,0,0.1)]"
          @click="handleSave">保存任务</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean;
  initialType?: number;
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'save', data: any): void;
}>()

const typeOptions = ['反向习惯', '正向习惯', '待办事项', '进度管理', '紧急事务']
const labelOptions = [
  { name: '工作', colorClass: 'badge-blue' },
  { name: '个人', colorClass: 'badge-green' },
  { name: '学习', colorClass: 'badge-orange' },
  { name: '健康', colorClass: 'badge-purple' },
]

const defaultFormData = () => ({
  title: '',
  description: '',
  type: 2, // Default to '待办'
  label: '个人',
  deadline: '',
  time: '',
  target_value: undefined as number | undefined,
  unit: '',
  streak_days: 0,
  repeat_pattern: [0] // [0] means daily, [1,2,3] means Monday, Tuesday, Wednesday
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
  formData.value.repeat_pattern = [1, 2, 3, 4, 5] // Default to weekdays
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
    formData.value.repeat_pattern = [0] // Fallback to daily if nothing selected
  } else {
    days.sort((a, b) => a - b)
    formData.value.repeat_pattern = days
  }
}

// Watch for visibility and reset/set form
watch(() => props.visible, (newVal) => {
  if (newVal) {
    formData.value = defaultFormData()
    if (props.initialType !== undefined) {
      formData.value.type = props.initialType
    }
  }
})

const close = () => {
  emit('update:visible', false)
}

const handleSave = () => {
  // Validation
  if (!formData.value.title.trim()) {
    return uni.showToast({ title: '请输入任务名称', icon: 'none' })
  }
  if (formData.value.type === 4 && !formData.value.deadline) {
    return uni.showToast({ title: '紧急任务需选择日期', icon: 'none' })
  }
  if (formData.value.type === 3 && (!formData.value.target_value || formData.value.target_value <= 0)) {
    return uni.showToast({ title: '请填写有效的目标总量', icon: 'none' })
  }

  const payload: any = {
    title: formData.value.title,
    type: formData.value.type,
    description: formData.value.description,
    label: formData.value.label,
    is_completed: false,
    is_active: true,
  }

  if (formData.value.type !== 0 && formData.value.type !== 1 && formData.value.deadline) {
    // Append time value if exists, otherwise default to end of day
    const timeStr = formData.value.time || '23:59:59'
    payload.deadline = `${formData.value.deadline}T${timeStr}Z`
  }

  if (formData.value.type === 3) {
    payload.target_value = Number(formData.value.target_value)
    payload.current_value = 0
    payload.unit = formData.value.unit
  }

  if (formData.value.type === 0 || formData.value.type === 1) {
    payload.streak_days = Number(formData.value.streak_days) || 0
    // Make sure we send a proper PostgreSQL array string literal '{0}' or '{1,2,3}'
    payload.repeat_pattern = `{${formData.value.repeat_pattern.join(',')}}`
  }

  emit('save', payload)
}
</script>