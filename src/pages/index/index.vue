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
  <view class="page-container">
    <view class="content-wrapper">
      <!-- Header -->
      <view class="sticky-header">
        <BackBar :customLeft="true" bgColor="transparent">
          <template #left>
            <view class="brand-container">
              <image src="/static/logo.png" class="logo-icon" />
              <text class="title">SmartBox</text>
            </view>
          </template>
        </BackBar>
      </view>

      <!-- Main Content -->
      <scroll-view scroll-y class="main-content">
        <!-- Hero / Welcome -->

        <!-- Modules List -->
        <view class="modules-list">
          <!-- Game -->
          <view class="module-card">
            <view class="module-icon-box bg-primary-light">
              <text class="module-icon text-primary">🎮</text>
            </view>
            <view class="module-info">
              <text class="module-title">游戏中心</text>
              <text class="module-desc">休闲娱乐，放松一下</text>
            </view>
            <view class="module-arrow">
              <text class="arrow-icon">›</text>
            </view>
          </view>

          <!-- Check-in -->
          <view class="module-card" @click="naviTo('/pages/todoList/todoList')">
            <view class="module-icon-box bg-emerald-light">
              <text class="module-icon text-emerald">📅</text>
            </view>
            <view class="module-info">
              <text class="module-title">习惯打卡</text>
              <text class="module-desc">记录日常，坚持目标</text>
            </view>
            <view class="module-arrow">
              <text class="arrow-icon">›</text>
            </view>
          </view>

          <!-- Notes -->
          <view class="module-card">
            <view class="module-icon-box bg-amber-light">
              <text class="module-icon text-amber">📝</text>
            </view>
            <view class="module-info">
              <text class="module-title">随手笔记</text>
              <text class="module-desc">捕捉灵感，沉淀思考</text>
            </view>
            <view class="module-arrow">
              <text class="arrow-icon">›</text>
            </view>
          </view>

          <!-- Tools -->
          <view class="module-card">
            <view class="module-icon-box bg-purple-light">
              <text class="module-icon text-purple">🧰</text>
            </view>
            <view class="module-info">
              <text class="module-title">实用工具</text>
              <text class="module-desc">效率神器，一键直达</text>
            </view>
            <view class="module-arrow">
              <text class="arrow-icon">›</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- Bottom Navigation -->
    </view>
  </view>
</template>



<style>
/* Reset & Base */
view, text, scroll-view {
  box-sizing: border-box;
}

.page-container {
  background-color: #f6f6f8;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  /* System fonts */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.content-wrapper {
  margin: 0 auto;
  width: 750rpx;
  background-color: #f6f6f8;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Header */
.sticky-header {
  background-color: rgba(255, 255, 255, 0.8);
  /* backdrop-filter not supported in all mp, but useful for h5 */
  backdrop-filter: blur(24rpx);
  /* position: sticky; removed for flex layout */
  z-index: 10;
}

.brand-container {
  display: flex;
  margin-left: 20rpx;
  align-items: center;
  height: 100%;
}

.logo-container {
  color: #2b6cee;
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  height: 60rpx;
  width: 60rpx;
  /* font-size: 56rpx; removed as it's an image now */
}

.title {
  color: #0f172a;
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1.25;
  margin-left: 16rpx; /* Spacing for custom header */
}

/* BackBar overrides or specific slots */
.search-btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 9999rpx;
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #334155;
}

.search-icon {
  font-size: 40rpx;
}

/* Main Content */
.main-content {
  flex: 1;
  overflow-y: hidden;
  padding: 48rpx 32rpx;
  /* overflow-y handled by scroll-view */
}

/* Hero Section */
.hero-section {
  margin-bottom: 64rpx;
  padding: 0 16rpx;
}

.hero-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #0f172a;
  display: block;
  margin-bottom: 8rpx;
}

.hero-subtitle {
  font-size: 28rpx;
  color: #64748b;
  display: block;
}

/* Modules List */
.modules-list {
  display: flex;
  flex-direction: column;
  /* gap: 24rpx; removed for compatibility */
}

.module-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  /* gap: 32rpx; removed for compatibility */
  background-color: #ffffff;
  padding: 32rpx;
  border-radius: 24rpx;
  border: 2rpx solid #f1f5f9;
  box-shadow: 0 2rpx 4rpx 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 24rpx;
}

.module-card:last-child {
  margin-bottom: 0;
}

.module-icon-box {
  width: 96rpx;
  height: 96rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 32rpx;
}

.module-icon {
  font-size: 48rpx;
}

.module-info {
  flex: 1;
}

.module-title {
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 4rpx;
}

.module-desc {
  color: #64748b;
  font-size: 24rpx;
  display: block;
}

.module-arrow {
  color: #94a3b8;
  flex-shrink: 0;
  margin-left: 32rpx;
}

.arrow-icon {
  font-size: 40rpx;
  font-weight: bold;
}

/* Colors for Icons */
.bg-primary-light { background-color: rgba(43, 108, 238, 0.1); }
.text-primary { color: #2b6cee; }

.bg-emerald-light { background-color: rgba(16, 185, 129, 0.1); }
.text-emerald { color: #10b981; }

.bg-amber-light { background-color: rgba(245, 158, 11, 0.1); }
.text-amber { color: #f59e0b; }

.bg-purple-light { background-color: rgba(168, 85, 247, 0.1); }
.text-purple { color: #a855f7; }

/* Bottom Navigation */
.bottom-nav {
  display: flex;
  flex-direction: row;
  /* gap: 16rpx; removed */
  border-top: 2rpx solid #f1f5f9;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 16rpx 32rpx 64rpx 32rpx; /* Extra padding for bottom safe area */
  margin-top: auto;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  /* gap: 8rpx; removed */
  color: #94a3b8;
}

.nav-item.active {
  color: #2b6cee;
}

.nav-icon-box {
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8rpx;
}

.nav-icon {
  font-size: 48rpx;
}

.nav-label {
  font-size: 20rpx;
  font-weight: 500;
}
</style>