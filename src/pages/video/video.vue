<template>
  <view class="video-container">
    <video
      class="video-player"
      :src="videoUrl"
      controls
      autoplay
    ></video>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const videoUrl = ref('https://rxlxr.oss-cn-hangzhou.aliyuncs.com/mini-program/IMG_0552.mov');
</script>

<style scoped lang="scss">
.video-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000;
}

.video-player {
  width: 100%;
  height: 100%;
}
</style>
