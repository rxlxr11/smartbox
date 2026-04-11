<template>
  <view v-if="game" class="w-full h-[100vh]">
    <GameLayout :game="game">
      <template #top>
        <view class="flex items-center justify-between bg-[#f8fafc] rounded-[16rpx] px-[20rpx] py-[14rpx]">
          <text class="text-[24rpx] text-[#666]">最佳耗时：{{ highScoreText }}</text>
          <text class="text-[24rpx] text-[#666]">步数：{{ game.score }}</text>
        </view>
      </template>

      <view class="relative w-full h-full flex flex-col items-center justify-center p-[40rpx] box-border">
        <view class="absolute top-[24rpx] right-[20rpx] text-[32rpx] font-bold z-[2]">
          <text>已用时间: {{ timeSpent }}s</text>
        </view>

        <view class="grid w-full max-w-[800rpx] aspect-square gap-[16rpx] p-[20rpx] bg-[#f5f5f5] rounded-[24rpx]" :style="gridStyle">
          <view
            v-for="(num, index) in game.board"
            :key="index"
            class="relative flex justify-center items-center rounded-[16rpx] shadow-[0_4rpx_12rpx_rgba(0,0,0,0.1)] transition-all duration-200"
            :class="tileClass(num, index)"
            @click="handleTileClick(index)"
          >
            <text v-if="num !== 0" class="text-[44rpx] font-bold text-[#1f2937]">{{ num }}</text>
          </view>
        </view>

        <text class="mt-[28rpx] text-[24rpx] text-[#6b7280]">将数字按 1 ~ {{ totalTiles - 1 }} 排列，空白格放到右下角</text>

        <GameDialog
          :visible="Boolean(showStartMask)"
          title="数字华容道"
          description="每次只能移动与空白相邻的数字块，用最短时间完成排序。"
          icon-class="i-fa6-solid:puzzle-piece"
          :show-top-line="true"
        >
          <template #actions>
            <button
              class="w-full h-[88rpx] mb-[20rpx] border-none rounded-[999rpx] text-white text-[32rpx] leading-[88rpx] bg-[linear-gradient(90deg,#22c55e_0%,#16a34a_100%)] shadow-[0_10rpx_26rpx_rgba(34,197,94,0.35)]"
              @click="handleStartGame"
            >开始挑战 ▶</button>
          </template>
        </GameDialog>

        <GameDialog
          :visible="game.status === 'ended'"
          :title="isChallengeSuccess ? '闯关成功！' : '挑战失败'"
          :description="isChallengeSuccess ? '手感很稳，继续冲击更快纪录。' : '状态差一点，再来一局就能过。'"
          :icon-class="isChallengeSuccess ? 'i-fa6-solid:trophy' : 'i-fa6-solid:face-frown'"
          :icon-wrap-class="isChallengeSuccess ? 'bg-[#ede9fe]' : 'bg-[#ffe4e6]'"
          :icon-class-name="isChallengeSuccess ? 'text-[#7c3aed]' : 'text-[#e11d48]'"
        >
          <view class="w-full bg-[#eceff3] rounded-[28rpx] px-[26rpx] py-[20rpx] mb-[24rpx] flex items-center justify-between">
            <view class="flex flex-col items-center flex-1">
              <text class="text-[22rpx] text-[#8a93a3]">完成用时</text>
              <text class="text-[38rpx] font-bold text-[#4f46e5] mt-[8rpx]">{{ game.getTimeSpent() }}s</text>
            </view>
            <view class="w-[2rpx] h-[56rpx] bg-[#d7dce5]"></view>
            <view class="flex flex-col items-center flex-1">
              <text class="text-[22rpx] text-[#8a93a3]">移动步数</text>
              <text class="text-[38rpx] font-bold text-[#4f46e5] mt-[8rpx]">{{ game.score }}</text>
            </view>
          </view>

          <template #actions>
            <button class="w-full h-[88rpx] border-none rounded-[999rpx] text-white text-[32rpx] leading-[88rpx] bg-[linear-gradient(90deg,#5d5bf6_0%,#4338ca_100%)] shadow-[0_10rpx_26rpx_rgba(79,70,229,0.35)]" @click="handleRestartGame">重新开始</button>
          </template>
          <template #footer>
            <text class="text-[24rpx] text-[#8b91a1] mt-[24rpx]">退出游戏</text>
          </template>
        </GameDialog>
      </view>
    </GameLayout>
  </view>

  <view v-else class="w-full h-[100vh] flex items-center justify-center text-[#6b7280]">
    加载中...
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import GameLayout from '@/layout/gameLayout.vue';
import GameDialog from '@/components/GameDialog/GameDialog.vue';
import { SlidingPuzzleGame } from '@/lib/game/games/SlidingPuzzleGame';
import { getGameById } from '@/lib/game/game';

const game = ref<SlidingPuzzleGame | null>(null);
const timeSpent = ref(0);
const hasStarted = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

const gridSize = computed(() => {
  if (!game.value) return 0;
  return game.value.getBoardSize();
});

const totalTiles = computed(() => gridSize.value * gridSize.value);

const gridStyle = computed(() => {
  const size = gridSize.value;
  return {
    gridTemplateColumns: `repeat(${size}, 1fr)`,
    gridTemplateRows: `repeat(${size}, 1fr)`,
  };
});

const highScoreText = computed(() => {
  if (!game.value) return '--';
  return game.value.highScore > 0 ? `${game.value.highScore}s` : '--';
});

const showStartMask = computed(() => !hasStarted.value && game.value?.status === 'idle');

const isChallengeSuccess = computed(() => {
  if (!game.value) return false;
  return game.value.checkSuccess();
});

const tileClass = (num: number, index: number) => {
  if (!game.value) return '';

  if (num === 0) {
    return 'bg-[rgba(203,213,225,0.45)] shadow-none';
  }

  const isAdjacent = isIndexAdjacent(index, game.value.blankIndex, game.value.getBoardSize());
  return isAdjacent
    ? 'bg-white active:scale-[0.95] border-[2rpx] border-solid border-[#bfdbfe]'
    : 'bg-white';
};

const isIndexAdjacent = (index: number, blankIndex: number, size: number) => {
  const row = Math.floor(index / size);
  const col = index % size;
  const blankRow = Math.floor(blankIndex / size);
  const blankCol = blankIndex % size;
  return Math.abs(row - blankRow) + Math.abs(col - blankCol) === 1;
};

const handleTileClick = (index: number) => {
  if (!game.value || game.value.status !== 'playing') return;
  game.value.clickCell(index);
};

const handleRestartGame = () => {
  if (!game.value) return;
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

const initGame = async () => {
  const gameInfo = await getGameById('sliding-puzzle');
  if (!gameInfo) {
    throw new Error('Game config not found: sliding-puzzle');
  }

  const difficultyDict = gameInfo.difficulty_dict ?? {};
  const difficultyKeys = Object.keys(difficultyDict);
  if (difficultyKeys.length === 0) {
    throw new Error('No difficulty levels configured for sliding-puzzle');
  }

  const instance = new SlidingPuzzleGame({
    id: gameInfo.id,
    name: gameInfo.name,
    maxErrors: gameInfo.max_errors ?? null,
    difficultyDict,
  });

  game.value = instance;
  instance.setDifficulty(difficultyKeys.includes('normal') ? 'normal' : difficultyKeys[0]);
  instance.onGameLogic();
  instance.status = 'idle';

  const highScore = await instance.getHighScore();
  instance.highScore = highScore;
};

onMounted(() => {
  timeSpent.value = 0;
  initGame().catch((error) => {
    console.error('Failed to initialize sliding puzzle game:', error);
    uni.showToast({
      title: '游戏配置加载失败',
      icon: 'none',
    });
  });
});

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
</style>
