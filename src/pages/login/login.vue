<template>
  <view class="p-10 min-h-100vh bg-[#f8f9fa] box-border">
    <view class="mt-[100rpx] mb-[80rpx]">
      <text class="text-[56rpx] font-bold text-[#333]">欢迎登录</text>
    </view>

    <!-- 登录方式切换 -->
    <view class="flex mb-[60rpx] border-b-[2rpx] border-b-solid border-[#eee]">
      <text class="text-[32rpx] text-[#999] px-[40rpx] py-[20rpx] relative transition-all duration-300"
        :class="{ 'text-[#333] font-500 after:content-empty after:absolute after:bottom-[-2rpx] after:left-1/2 after:-translate-x-1/2 after:w-[40rpx] after:h-[6rpx] after:bg-[#007aff] after:rounded-[4rpx]': loginType === 'password' }"
        @click="loginType = 'password'">密码登录</text>
      <text class="text-[32rpx] text-[#999] px-[40rpx] py-[20rpx] relative transition-all duration-300"
        :class="{ 'text-[#333] font-500 after:content-empty after:absolute after:bottom-[-2rpx] after:left-1/2 after:-translate-x-1/2 after:w-[40rpx] after:h-[6rpx] after:bg-[#007aff] after:rounded-[4rpx]': loginType === 'otp' }"
        @click="loginType = 'otp'">验证码登录</text>
    </view>

    <!-- 表单区域 -->
    <view>
      <view class="mb-[40rpx] bg-white rounded-[16rpx] px-[30rpx] py-[20rpx] shadow-[0_2rpx_10rpx_rgba(0,0,0,0.02)]">
        <input class="h-[80rpx] text-[30rpx] w-full" type="text" v-model="email" placeholder="请输入邮箱地址" />
      </view>

      <view class="mb-[40rpx] bg-white rounded-[16rpx] px-[30rpx] py-[20rpx] shadow-[0_2rpx_10rpx_rgba(0,0,0,0.02)]"
        v-if="loginType === 'password'">
        <input class="h-[80rpx] text-[30rpx] w-full" type="password" v-model="password" placeholder="请输入密码" />
      </view>

      <view
        class="mb-[40rpx] bg-white rounded-[16rpx] py-[20rpx] pl-[30rpx] pr-[10rpx] shadow-[0_2rpx_10rpx_rgba(0,0,0,0.02)] flex items-center justify-between"
        v-if="loginType === 'otp'">
        <input class="h-[80rpx] text-[30rpx] flex-1" type="number" v-model="otpCode" placeholder="请输入6位验证码"
          maxlength="6" />
        <button
          class="m-0 text-[26rpx] text-[#007aff] bg-transparent px-[20rpx] min-w-[180rpx] h-[60rpx] leading-[60rpx] after:border-none disabled:text-[#999]"
          :disabled="countdown > 0 || !email" @click="handleSendOtp">
          {{ countdown > 0 ? `${countdown}s后重发` : '获取验证码' }}
        </button>
      </view>

      <button
        class="mt-[80rpx] bg-[#007aff] text-white rounded-[16rpx] text-[32rpx] h-[90rpx] leading-[90rpx] after:border-none active:opacity-80"
        :loading="loading" @click="handleLogin">
        登录
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { supabase } from '../../lib/supabase'

// 状态
const loginType = ref<'password' | 'otp'>('password')
const email = ref('')
const password = ref('')
const otpCode = ref('')
const loading = ref(false)
const countdown = ref(0)
let timer: any = null

// 组件卸载时清除定时器
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// 发送验证码
const handleSendOtp = async () => {
  if (!email.value) {
    uni.showToast({ title: '请输入邮箱', icon: 'none' })
    return
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: {
        shouldCreateUser: true // 允许未注册用户自动创号
      }
    })

    if (error) throw error

    uni.showToast({ title: '验证码已发送，请查收邮箱', icon: 'none' })

    // 开启倒计时
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)

  } catch (error: any) {
    uni.showToast({ title: error.message || '发送失败', icon: 'none' })
  }
}

// 登录处理
const handleLogin = async () => {
  if (!email.value) {
    uni.showToast({ title: '请输入邮箱', icon: 'none' })
    return
  }

  loading.value = true

  try {
    let error = null
    let data = null

    if (loginType.value === 'password') {
      if (!password.value) {
        uni.showToast({ title: '请输入密码', icon: 'none' })
        loading.value = false
        return
      }

      const res = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      error = res.error
      data = res.data

    } else if (loginType.value === 'otp') {
      if (!otpCode.value) {
        uni.showToast({ title: '请输入验证码', icon: 'none' })
        loading.value = false
        return
      }

      const res = await supabase.auth.verifyOtp({
        email: email.value,
        token: otpCode.value,
        type: 'email',
      })
      error = res.error
      data = res.data
    }

    if (error) throw error

    uni.showToast({ title: '登录成功', icon: 'success' })

    // 登录成功后跳转到首页或其他页面 (假设有/pages/index/index)
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1500)

  } catch (err: any) {
    uni.showToast({ title: err.message || '登录失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss"></style>
