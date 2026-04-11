<template>
  <view v-if="game" class="w-full h-[100vh]">
    <GameLayout :game="game">
      <template #top>
        <view class="flex items-center justify-between bg-[#f8fafc] rounded-[16rpx] px-[20rpx] py-[14rpx]">
          <text class="text-[24rpx] text-[#666]">成绩记录：{{ highScoreText }}</text>
          <text class="text-[24rpx] text-[#666]">错误次数：{{ game.currentErrors }}</text>
        </view>
      </template>

      <view class="relative w-full h-full flex flex-col items-center justify-center p-[40rpx] box-border">
        <view class="absolute top-[24rpx] right-[20rpx] text-[32rpx] font-bold z-[2]">
          <text>已用时间: {{ timeSpent }}s</text>
        </view>
        
        <view class="grid w-full max-w-[800rpx] aspect-square gap-[20rpx] p-[20rpx] bg-[#f5f5f5] rounded-[24rpx]" :style="gridStyle">
          <view
            v-for="(num, index) in game.grid"
            :key="index"
            class="flex justify-center items-center bg-white rounded-[16rpx] shadow-[0_4rpx_12rpx_rgba(0,0,0,0.1)] transition-all duration-200 active:scale-[0.95]"
            :class="{
              'bg-[#ffcccc] animate-[shake_0.3s]': errorCell === num
            }"
            @click="handleCellClick(num)"
          >
            <text class="text-[48rpx] font-bold" :style="{ color: getNumberColor(num) }">{{ num }}</text>
          </view>
        </view>

        <view
          v-if="showStartMask"
          class="absolute top-0 left-0 right-0 bottom-0 bg-[rgba(148,153,166,0.62)] backdrop-blur-[6rpx] flex items-center justify-center z-20"
        >
          <view class="relative w-[84%] max-w-[640rpx] bg-[#f8f8fb] border-[2rpx] border-solid border-[#ececf5] rounded-[48rpx] px-[48rpx] pt-[54rpx] pb-[42rpx] shadow-[0_24rpx_72rpx_rgba(15,23,42,0.22)] flex flex-col items-center overflow-hidden">
            <view class="absolute top-0 left-0 right-0 h-[10rpx] bg-[linear-gradient(90deg,#5d5bf6_0%,#a78bfa_100%)]"></view>
            <view class="w-[92rpx] h-[92rpx] rounded-full bg-[#e9e6ff] flex items-center justify-center mb-[28rpx]">
              <view class="i-fa6-solid:rocket text-[38rpx] text-[#4f46e5]"></view>
            </view>
            <text class="text-[48rpx] font-bold text-[#202534] mb-[18rpx]">准备好了吗？</text>
            <text class="text-[25rpx] text-[#6b7280] leading-[1.7] text-center mb-[34rpx]">按顺序从1点击到{{ gridSize * gridSize }}，挑战你的专注力与速度。</text>
            <button
              class="w-full h-[88rpx] mb-[20rpx] border-none rounded-[999rpx] text-white text-[32rpx] leading-[88rpx] bg-[linear-gradient(90deg,#c084fc_0%,#8b5cf6_100%)] shadow-[0_10rpx_26rpx_rgba(139,92,246,0.35)]"
              @click="handleStartGame"
            >开始挑战 ▶</button>
            <text class="text-[24rpx] text-[#8b91a1]">返回大厅</text>
          </view>
        </view>
        
        <view v-if="game.status === 'ended'" class="absolute top-0 left-0 right-0 bottom-0 bg-[rgba(0,0,0,0.6)] flex justify-center items-center z-10">
          <view class="bg-white py-[60rpx] px-[80rpx] rounded-[32rpx] flex flex-col items-center gap-[30rpx]">
            <text class="text-[48rpx] font-bold text-[#4caf50]">挑战成功！</text>
            <text class="text-[36rpx] text-[#666]">耗时：{{ game.getTimeSpent() }}秒</text>
            <button class="mt-[20rpx] bg-[#007aff] text-white border-none rounded-[40rpx] py-[20rpx] px-[60rpx] text-[32rpx] leading-normal" @click="handleRestartGame">再来一局</button>
          </view>
        </view>
      </view>
    </GameLayout>
  </view>
  <view v-else class="w-full h-[100vh] flex items-center justify-center text-[#6b7280]">
    加载中...
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { DifficultyConfig } from '@/types/game';
import GameLayout from '@/layout/gameLayout.vue';
import { SchulteGridGame } from '@/lib/game/games/SchulteGridGame';
import { getGameById } from '@/api/game/game';

const game = ref<SchulteGridGame | null>(null);

const errorCell = ref<number | null>(null);
const timeSpent = ref(0);
const hasStarted = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

const numberColors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

const gridSize = computed(() => {
  if (!game.value) return 0;
  return Number(game.value.difficultyDict[game.value.currentDifficulty]?.params?.size ?? 0);
});

const gridStyle = computed(() => {
  const size = gridSize.value;
  return {
    gridTemplateColumns: `repeat(${size}, 1fr)`,
    gridTemplateRows: `repeat(${size}, 1fr)`
  };
});

const highScoreText = computed(() => {
  if (!game.value) return '--';
  return game.value.highScore > 0 ? `${game.value.highScore}s` : '--';
});

const showStartMask = computed(() => !hasStarted.value && game.value?.status === 'idle');

const getNumberColor = (num: number) => {
  return numberColors[(num - 1) % numberColors.length];
};

const handleCellClick = (num: number) => {
  if (!game.value || game.value.status !== 'playing') return;
  
  if (num < game.value.expectedNumber) return;
  
  const isCorrect = game.value.clickCell(num);
  if (!isCorrect) {
    // 错误动画提示
    errorCell.value = num;
    setTimeout(() => {
      errorCell.value = null;
    }, 300);
  }
};

const handleRestartGame = () => {
  if (!game.value) return;
  errorCell.value = null;
  timeSpent.value = 0;
  game.value.restart();
};

const handleStartGame = () => {
  if (!game.value) return;
  game.value.start();
};

const startTimer = () => {
  stopTimer();
  timer = setInterval(() => {
    if (game.value?.status === 'playing') {
      timeSpent.value = game.value.getTimeSpent();
    }
  }, 100);
};

const stopTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

watch(
  () => game.value?.status,
  (status) => {
    if (!game.value) return;

    if (status === 'playing') {
      hasStarted.value = true;
      startTimer();
      return;
    }

    if (status === 'ended') {
      timeSpent.value = game.value.getTimeSpent();
      stopTimer();
      return;
    }

    if (status === 'idle') {
      timeSpent.value = 0;
      return;
    }

    stopTimer();
  }
);

const buildDifficultyDict = (raw: unknown): Record<string, DifficultyConfig> => {
  if (!Array.isArray(raw)) {
    return {};
  }

  return raw.reduce<Record<string, DifficultyConfig>>((acc, item) => {
    if (!item || typeof item !== 'object') {
      return acc;
    }

    const value = (item as { value?: unknown }).value;
    const label = (item as { label?: unknown }).label;
    const params = (item as { params?: unknown }).params;

    if (typeof value !== 'string' || typeof label !== 'string') {
      return acc;
    }

    acc[value] = {
      value,
      label,
      params: (params && typeof params === 'object') ? (params as Record<string, unknown>) : {}
    };
    return acc;
  }, {});
};

const initGame = async () => {
  const gameInfo = await getGameById('schulte-grid');
  if (!gameInfo) {
    throw new Error('Game config not found: schulte-grid');
  }

  const difficultyDict = buildDifficultyDict(gameInfo.difficulty_levels);
  const difficultyKeys = Object.keys(difficultyDict);
  if (difficultyKeys.length === 0) {
    throw new Error('No difficulty levels configured for schulte-grid');
  }

  const instance = new SchulteGridGame({
    id: gameInfo.id,
    name: gameInfo.name,
    maxErrors: gameInfo.max_errors ?? null,
    difficultyDict
  });

  game.value = instance;
  instance.setDifficulty(difficultyKeys.includes('normal') ? 'normal' : difficultyKeys[0]);
  instance.onGameLogic();
  instance.status = 'idle';
  instance.endTime = 0;

  const highScore = await instance.getHighScore();
  instance.highScore = highScore;
};

onMounted(() => {
  timeSpent.value = 0;
  initGame().catch((error) => {
    console.error('Failed to initialize schulte game:', error);
    uni.showToast({
      title: '游戏配置加载失败',
      icon: 'none'
    });
  });
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
