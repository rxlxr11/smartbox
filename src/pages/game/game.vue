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
import { onMounted, ref } from 'vue';
import BackBar from "@/components/BackBar/BackBar.vue";
import { getGames } from '@/api/game/game';

type GameCard = {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
};

const gameRouteMap: Record<string, string> = {
  'schulte-grid': '/pages-sub/game/SchulteTable/SchulteTable'
};

const gameIconMap: Record<string, string> = {
  'schulte-grid': '🔢'
};

const games = ref<GameCard[]>([]);

const loadGames = async () => {
  try {
    const list = await getGames(true);
    games.value = list
      .filter(item => Boolean(gameRouteMap[item.id]))
      .map(item => ({
        id: item.id,
        name: item.name,
        description: item.description ?? '暂无描述',
        icon: gameIconMap[item.id] ?? '🎮',
        path: gameRouteMap[item.id]
      }));
  } catch (error) {
    console.error('Failed to load game list:', error);
    games.value = [];
  }
};

const goToGame = (path: string) => {
  uni.navigateTo({
    url: path
  });
};

onMounted(() => {
  loadGames();
});
</script>

<style scoped>
/* 移除了大部分样式，因为使用了 UnoCSS */
</style>
