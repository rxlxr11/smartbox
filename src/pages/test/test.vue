<template>
  <view class="test-page">
    <!-- 示例1：只启用右侧插槽（左滑打开） -->
    <view class="section">
      <text class="section-title">仅右侧按钮组（左滑打开）</text>
      <SlideCard
        v-model="sideRightOnly"
        radius="20rpx"
        :use-left-slot="false"
        :use-right-slot="true"
        right-move="180rpx"
        :open-threshold="0.1"
        class="demo-card"
      >
        <template #right="{ close }">
          <view class="actions-row">
            <view class="btn btn-blue" @tap.stop="handleAction('收藏'); close()">
              <text class="btn-text">收藏</text>
            </view>
            <view class="btn btn-red" @tap.stop="handleAction('删除'); close()">
              <text class="btn-text">删除</text>
            </view>
          </view>
        </template>

        <view class="card-content">
          <text class="card-title">右侧插槽卡片</text>
          <text class="card-desc">左滑后显示右侧按钮组，主体与容器同尺寸</text>
        </view>
      </SlideCard>
      <text class="side-text">当前状态：{{ sideRightOnly }}</text>
    </view>

    <!-- 示例2：左右都启用 -->
    <view class="section">
      <text class="section-title">左右都启用（先回中间，再开另一侧）</text>
      <SlideCard
        v-model="sideBoth"
        radius="20rpx"
        :use-left-slot="true"
        :use-right-slot="true"
        right-move="180rpx"
        class="demo-card"
      >
        <template #left="{ close }">
          <view class="actions-row">
            <view class="btn btn-emerald narrow-btn" @tap.stop="handleAction('已读'); close()">
              <text class="btn-text">已读</text>
            </view>
          </view>
        </template>

        <template #right="{ close }">
          <view class="actions-row">
            <view class="btn btn-cyan" @tap.stop="handleAction('置顶'); close()">
              <text class="btn-text">置顶</text>
            </view>
            <view class="btn btn-indigo" @tap.stop="handleAction('归档'); close()">
              <text class="btn-text">归档</text>
            </view>
          </view>
        </template>

        <view class="card-content">
          <text class="card-title">双侧插槽卡片</text>
          <text class="card-desc">
            先左滑打开右侧后，右滑会先回到主体，再次右滑才会打开左侧
          </text>
        </view>
      </SlideCard>
      <text class="side-text">当前状态：{{ sideBoth }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SlideCard from '@/components/SlideCard/SlideCard.vue';

// 当前侧状态：center(中间) / left(左槽打开) / right(右槽打开)
const sideRightOnly = ref<'center' | 'left' | 'right'>('center');
const sideBoth = ref<'center' | 'left' | 'right'>('center');

const handleAction = (name: string) => {
  uni.showToast({
    title: name,
    icon: 'none',
  });
};
</script>

<style scoped lang="scss">
.test-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 32rpx;
  background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
}

.section {
  margin-bottom: 38rpx;
}

.section-title {
  display: block;
  margin-bottom: 18rpx;
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 700;
}

.demo-card {
  margin-bottom: 12rpx;
}

.side-text {
  color: #334155;
  font-size: 24rpx;
}

.card-content {
  box-sizing: border-box;
  width: 100%;
  min-height: 120rpx;
  padding: 24rpx 28rpx;
  background: #ffffff;
  border: 2rpx solid #dbe2ea;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-title {
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}

.card-desc {
  color: #475569;
  font-size: 24rpx;
  line-height: 1.5;
}

.actions-row {
  height: 100%;
  display: flex;
  align-items: stretch;
}

.btn {
  width: 180rpx;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.narrow-btn {
  width: 180rpx;
}

.btn-text {
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
}

.btn-blue { background: #3b82f6; }
.btn-red { background: #ef4444; }
.btn-cyan { background: #06b6d4; }
.btn-indigo { background: #6366f1; }
.btn-emerald { background: #059669; }
</style>
