<template>
  <view class="w-full h-[100vh]">
    <GameLayout :game="game">
      <view class="flex flex-col items-center w-full p-[40rpx] box-border">
        <view class="flex justify-between w-full mb-[40rpx] px-[20rpx] text-[32rpx] font-bold">
          <text>下一个目标: {{ game.expectedNumber }}</text>
          <text>已用时间: {{ timeSpent }}s</text>
        </view>
        
        <view class="grid w-full max-w-[800rpx] aspect-square gap-[20rpx] p-[20rpx] bg-[#f5f5f5] rounded-[24rpx]" :style="gridStyle">
          <view
            v-for="(num, index) in game.grid"
            :key="index"
            class="flex justify-center items-center bg-white rounded-[16rpx] shadow-[0_4rpx_12rpx_rgba(0,0,0,0.1)] transition-all duration-200 active:scale-[0.95]"
            :class="{
              'bg-[#e0e0e0] text-[#999]': num < game.expectedNumber,
              'bg-[#ffcccc] animate-[shake_0.3s]': errorCell === num
            }"
            @click="handleCellClick(num)"
          >
            <text class="text-[48rpx] font-bold" :class="num < game.expectedNumber ? 'text-[#999]' : 'text-[#333]'">{{ num }}</text>
          </view>
        </view>
        
        <view v-if="game.status === 'ended'" class="absolute top-0 left-0 right-0 bottom-0 bg-[rgba(0,0,0,0.6)] flex justify-center items-center z-10">
          <view class="bg-white py-[60rpx] px-[80rpx] rounded-[32rpx] flex flex-col items-center gap-[30rpx]">
            <text class="text-[48rpx] font-bold text-[#4caf50]">挑战成功！</text>
            <text class="text-[36rpx] text-[#666]">耗时：{{ game.getTimeSpent() }}秒</text>
            <button class="mt-[20rpx] bg-[#007aff] text-white border-none rounded-[40rpx] py-[20rpx] px-[60rpx] text-[32rpx] leading-normal" @click="game.restart()">再来一局</button>
          </view>
        </view>
      </view>
    </GameLayout>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import GameLayout from '@/layout/gameLayout.vue';
import { SchulteGridGame } from '@/lib/game/games/SchulteGridGame';

// 使用 reactive 包装游戏实例以保持响应式
const game = reactive(new SchulteGridGame());

const errorCell = ref<number | null>(null);
const timeSpent = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const gridSize = computed(() => {
  return game.difficultyDict[game.currentDifficulty].params.size;
});

const gridStyle = computed(() => {
  const size = gridSize.value;
  return {
    gridTemplateColumns: `repeat(${size}, 1fr)`,
    gridTemplateRows: `repeat(${size}, 1fr)`
  };
});

const handleCellClick = (num: number) => {
  if (game.status !== 'playing') return;
  
  if (num < game.expectedNumber) return; // 已经点过的
  
  const isCorrect = game.clickCell(num);
  if (!isCorrect) {
    // 错误动画提示
    errorCell.value = num;
    setTimeout(() => {
      errorCell.value = null;
    }, 300);
  } else {
    // 检查是否结束
    if ((game.status as string) === 'ended') {
      stopTimer();
    }
  }
};

const startTimer = () => {
  stopTimer();
  timer = setInterval(() => {
    if (game.status === 'playing') {
      timeSpent.value = game.getTimeSpent();
    }
  }, 100);
};

const stopTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

onMounted(() => {
  startTimer();
});

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10rpx); }
  75% { transform: translateX(10rpx); }
}
</style>
