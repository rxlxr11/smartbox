<template>
  <z-paging bg-color="#f6f6f6" :loading-more-enabled="false">
    <template #top>
      <BackBar title="游戏中心" />
    </template>

    <view class="flex flex-col gap-[30rpx]">
      <view
        class="bg-white rounded-[32rpx] p-[40rpx] flex items-center shadow-[0_8rpx_24rpx_rgba(0,0,0,0.05)] active:scale-[0.98] transition-transform duration-200"
        v-for="game in games" :key="game.id" @click="goToGame(game.path)">
        <view
          class="text-[80rpx] mr-[30rpx] w-[120rpx] h-[120rpx] flex justify-center items-center bg-[#f0f4f8] rounded-[24rpx] shrink-0">
          {{ game.icon }}</view>
        <view class="flex-1 flex flex-col">
          <text class="text-[36rpx] font-bold text-[#333] mb-[8rpx]">{{ game.name }}</text>
          <text class="text-[26rpx] text-[#999]">{{ game.description }}</text>
        </view>
        <view
          class="bg-[#007aff] text-white py-[12rpx] px-[32rpx] rounded-[40rpx] text-[28rpx] font-medium shrink-0 ml-[20rpx]">
          开始</view>
      </view>
    </view>
  </z-paging>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BackBar from "@/components/BackBar/BackBar.vue";

const games = ref([
  {
    id: 'schulte-table',
    name: '舒尔特方格',
    icon: '🔢',
    description: '经典舒尔特方格注意力训练',
    path: '/pages-sub/game/SchulteTable/SchulteTable'
  }
]);

const goToGame = (path: string) => {
  uni.navigateTo({
    url: path
  });
};
</script>

<style scoped>
/* 移除了大部分样式，因为使用了 UnoCSS */
</style>
