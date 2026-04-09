<script setup lang="ts">
// Logic can be added here
import { ref } from "vue";
import BackBar from "@/components/BackBar/BackBar.vue";

const naviTo = (url: string) => {
  uni.navigateTo({
    url: url
  })
}
</script>

<template>
  <z-paging bg-color="#f6f6f6" :loading-more-enabled="false">
    <template #top>
      <BackBar :customLeft="true">
        <template #left>
          <view class="flex ml-[20rpx] items-center h-full">
            <image src="/static/logo.png" class="h-[60rpx] w-[60rpx]" />
            <text class="text-[#0f172a] text-[40rpx] font-bold leading-5 ml-[16rpx]">SmartBox</text>
          </view>
        </template>
      </BackBar>
    </template>


    <!-- Main Content -->
    <view class="flex flex-col px-[32rpx] py-[48rpx] w-full box-border">
      <!-- Modules List -->
      <view class="flex flex-col w-full">
        <!-- Game -->
        <view
          class="flex flex-row items-center w-full box-border bg-white p-[32rpx] rounded-[24rpx] border-[2rpx] border-solid border-[#f1f5f9] shadow-[0_2rpx_4rpx_0_rgba(0,0,0,0.05)] mb-[24rpx]"
          @click="naviTo('/pages/game/game')">
          <view
            class="w-[96rpx] h-[96rpx] rounded-[16rpx] flex items-center justify-center shrink-0 mr-[32rpx] bg-[rgba(43,108,238,0.1)]">
            <text class="text-[48rpx] text-[#2b6cee]">🎮</text>
          </view>
          <view class="flex-1">
            <text class="text-[#0f172a] text-[32rpx] font-600 block mb-[4rpx]">游戏中心</text>
            <text class="text-[#64748b] text-[24rpx] block">休闲娱乐，放松一下</text>
          </view>
          <view class="text-[#94a3b8] shrink-0 ml-[32rpx]">
            <text class="text-[40rpx] font-bold">›</text>
          </view>
        </view>

        <!-- Check-in -->
        <view
          class="flex flex-row items-center w-full box-border bg-white p-[32rpx] rounded-[24rpx] border-[2rpx] border-solid border-[#f1f5f9] shadow-[0_2rpx_4rpx_0_rgba(0,0,0,0.05)] mb-[24rpx]"
          @click="naviTo('/pages/todoList/todoList')">
          <view
            class="w-[96rpx] h-[96rpx] rounded-[16rpx] flex items-center justify-center shrink-0 mr-[32rpx] bg-[rgba(16,185,129,0.1)]">
            <text class="text-[48rpx] text-[#10b981]">📅</text>
          </view>
          <view class="flex-1">
            <text class="text-[#0f172a] text-[32rpx] font-600 block mb-[4rpx]">习惯打卡</text>
            <text class="text-[#64748b] text-[24rpx] block">记录日常，坚持目标</text>
          </view>
          <view class="text-[#94a3b8] shrink-0 ml-[32rpx]">
            <text class="text-[40rpx] font-bold">›</text>
          </view>
        </view>

        <!-- Notes -->
        <view
          class="flex flex-row items-center w-full box-border bg-white p-[32rpx] rounded-[24rpx] border-[2rpx] border-solid border-[#f1f5f9] shadow-[0_2rpx_4rpx_0_rgba(0,0,0,0.05)] mb-[24rpx]">
          <view
            class="w-[96rpx] h-[96rpx] rounded-[16rpx] flex items-center justify-center shrink-0 mr-[32rpx] bg-[rgba(245,158,11,0.1)]">
            <text class="text-[48rpx] text-[#f59e0b]">📝</text>
          </view>
          <view class="flex-1">
            <text class="text-[#0f172a] text-[32rpx] font-600 block mb-[4rpx]">随手笔记</text>
            <text class="text-[#64748b] text-[24rpx] block">捕捉灵感，沉淀思考</text>
          </view>
          <view class="text-[#94a3b8] shrink-0 ml-[32rpx]">
            <text class="text-[40rpx] font-bold">›</text>
          </view>
        </view>

        <!-- Tools -->
        <view
          class="flex flex-row items-center w-full box-border bg-white p-[32rpx] rounded-[24rpx] border-[2rpx] border-solid border-[#f1f5f9] shadow-[0_2rpx_4rpx_0_rgba(0,0,0,0.05)] mb-0">
          <view
            class="w-[96rpx] h-[96rpx] rounded-[16rpx] flex items-center justify-center shrink-0 mr-[32rpx] bg-[rgba(168,85,247,0.1)]">
            <text class="text-[48rpx] text-[#a855f7]">🧰</text>
          </view>
          <view class="flex-1">
            <text class="text-[#0f172a] text-[32rpx] font-600 block mb-[4rpx]">实用工具</text>
            <text class="text-[#64748b] text-[24rpx] block">效率神器，一键直达</text>
          </view>
          <view class="text-[#94a3b8] shrink-0 ml-[32rpx]">
            <text class="text-[40rpx] font-bold">›</text>
          </view>
        </view>
      </view>
    </view>

  </z-paging>

</template>

<style>
/* Reset & Base */
view,
text,
scroll-view {
  box-sizing: border-box;
}
</style>