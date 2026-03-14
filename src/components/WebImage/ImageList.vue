<!-- 用于展示图片列表的组件 -->
<script setup lang="ts">
import WebImage from '@/components/WebImage/WebImage.vue' // 假设 WebImage 组件路径

defineProps<{
  images: string[]
}>()
</script>

<template>
  <view class="images-container">
    <view v-for="(photo, index) in images" :key="index" class="image-item">
      <WebImage :src="photo" mode="aspectFill" width="180rpx" height="180rpx" :is-preview="true" />
    </view>
  </view>
</template>

<style scoped lang="scss">
.images-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx; // Spacing between images
  margin-top: 10rpx;

  .image-item {
    width: calc((100% - 20rpx) / 3); // 3 images per row with 10rpx gap
    height: 160rpx; // Default height, can be overridden by props
    overflow: hidden;
  }
}
</style>
