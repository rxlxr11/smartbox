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

        <GameDialog
          :visible="Boolean(showStartMask)"
          title="准备好了吗？"
          :description="`按顺序从1点击到${gridSize * gridSize}，挑战你的专注力与速度。`"
          icon-class="i-fa6-solid:rocket"
          :show-top-line="true"
        >
          <template #actions>
            <button
              class="w-full h-[88rpx] mb-[20rpx] border-none rounded-[999rpx] text-white text-[32rpx] leading-[88rpx] bg-[linear-gradient(90deg,#c084fc_0%,#8b5cf6_100%)] shadow-[0_10rpx_26rpx_rgba(139,92,246,0.35)]"
              @click="handleStartGame"
            >开始挑战 ▶</button>
          </template>
          <template #footer>
            <text class="text-[24rpx] text-[#8b91a1]">返回大厅</text>
          </template>
        </GameDialog>

        <GameDialog
          :visible="game.status === 'ended'"
          :title="isChallengeSuccess ? '挑战成功！' : '挑战失败'"
          :description="isChallengeSuccess ? '节奏很好，继续保持。' : '别气馁，再试一次就能突破。'"
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
              <text class="text-[22rpx] text-[#8a93a3]">错误次数</text>
              <text class="text-[38rpx] font-bold text-[#4f46e5] mt-[8rpx]">{{ game.currentErrors }}</text>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import GameLayout from '@/layout/gameLayout.vue';
import GameDialog from '@/components/GameDialog/GameDialog.vue';
import { SchulteGridGame } from '@/lib/game/games/SchulteGridGame';
import { getGameById } from '@/lib/game/game';

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

const isChallengeSuccess = computed(() => {
  if (!game.value) return false;
  return game.value.checkSuccess();
});

const getNumberColor = (num: number) => {
  return numberColors[(num - 1) % numberColors.length];
};

const handleCellClick = (num: number) => {
  if (!game.value || game.value.status !== 'playing') return;

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

const initGame = async () => {
  const gameInfo = await getGameById('schulte-grid');
  if (!gameInfo) {
    throw new Error('Game config not found: schulte-grid');
  }

  const difficultyDict = gameInfo.difficulty_dict ?? {};
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
