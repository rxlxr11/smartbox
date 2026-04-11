<template>
  <view class="flex flex-col h-[100vh] bg-[#fafafa]">
    <view class="shrink-0 bg-white border-b-[2rpx] border-solid border-[#f0f0f0] z-20">
      <BackBar :title="game.name" bgColor="#ffffff" iconColor="#333" />
      <view class="px-[28rpx] pb-[20rpx]">
        <slot name="top">
          <view class="flex items-center justify-between bg-[#f8fafc] rounded-[16rpx] px-[20rpx] py-[14rpx]">
            <text class="text-[24rpx] text-[#666]">成绩记录：{{ game.highScore || '--' }}</text>
            <text v-if="game.maxErrors !== null" class="text-[24rpx] text-[#666]">错误次数：{{ game.currentErrors }}/{{ game.maxErrors }}</text>
            <text v-else class="text-[24rpx] text-[#666]">错误次数：{{ game.currentErrors }}</text>
          </view>
        </slot>
      </view>
    </view>

    <view class="flex-1 relative overflow-hidden">
      <slot></slot>

      <GameDialog
        v-if="game.status === 'paused'"
        :visible="game.status === 'paused'"
        title="游戏暂停"
        description="休息一下。点击下方按钮可继续训练，或重开本局重新挑战。"
        icon-class="i-fa6-solid:pause"
        icon-wrap-class="bg-[#e6e4ff]"
        :show-top-line="false"
      >
        <template #actions>
          <button
            class="w-full h-[88rpx] mb-[20rpx] border-none rounded-[999rpx] text-white text-[32rpx] leading-[88rpx] bg-[linear-gradient(90deg,#5d5bf6_0%,#4338ca_100%)] shadow-[0_10rpx_26rpx_rgba(79,70,229,0.35)]"
            @click="game.resume()"
          >▶ 继续游戏</button>

          <button
            class="w-full h-[88rpx] border-[2rpx] border-solid border-[#e3e5ef] rounded-[999rpx] bg-[#f8f8fb] text-[#4f46e5] text-[32rpx] leading-[84rpx]"
            @click="handlePauseRestart"
          >↻ 重新开始</button>
        </template>

        <template #footer>
          <text class="text-[24rpx] text-[#a1a7b5] mt-[26rpx]">退出当前局</text>
        </template>
      </GameDialog>
    </view>

    <view class="shrink-0 bg-white border-t-[2rpx] border-solid border-[#eee] px-[28rpx] pt-[16rpx] pb-[calc(16rpx+env(safe-area-inset-bottom))] z-20">
      <slot name="bottom">
        <view class="flex items-center gap-[24rpx]">
          <view class="flex items-center gap-[24rpx]">
            <view class="flex flex-col items-center justify-center w-[92rpx]" @click="handleAction">
              <view :class="actionIconClass" class="text-[38rpx] text-[#007aff]"></view>
              <text class="text-[22rpx] text-[#4b5563] mt-[4rpx]">{{ actionText }}</text>
            </view>
            <view class="flex flex-col items-center justify-center w-[92rpx]" @click="handleRestart">
              <view class="i-fa6-solid:rotate-right text-[38rpx] text-[#007aff]"></view>
              <text class="text-[22rpx] text-[#4b5563] mt-[4rpx]">重开</text>
            </view>
          </view>

          <picker class="flex-1" mode="selector" :range="difficultyLabels" :value="difficultyIndex" @change="handleDifficultyChange">
            <view class="h-[72rpx] rounded-[14rpx] bg-[#f8fafc] border-[2rpx] border-solid border-[#e5e7eb] px-[20rpx] flex items-center justify-between">
              <text class="text-[24rpx] text-[#374151]">难度：{{ difficultyLabels[difficultyIndex] || '请选择' }}</text>
              <view class="i-fa6-solid:caret-down text-[22rpx] text-[#6b7280]"></view>
            </view>
          </picker>
        </view>
      </slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Game } from '@/types/game';
import BackBar from '@/components/BackBar/BackBar.vue';
import GameDialog from '@/components/GameDialog/GameDialog.vue';

type PickerChangeEvent = {
  detail: {
    value: number | string;
  };
};

const props = defineProps<{
  game: Game;
}>();

const difficultyKeys = computed(() => Object.keys(props.game.difficultyDict));

const difficultyLabels = computed(() => difficultyKeys.value.map((key) => props.game.difficultyDict[key].label));

const difficultyIndex = computed(() => {
  const index = difficultyKeys.value.indexOf(props.game.currentDifficulty);
  return index >= 0 ? index : 0;
});

const actionText = computed(() => {
  if (props.game.status === 'playing') return '暂停';
  if (props.game.status === 'paused') return '继续';
  return '开始';
});

const actionIconClass = computed(() => {
  if (props.game.status === 'playing') return 'i-fa6-solid:pause';
  return 'i-fa6-solid:play';
});

const handleAction = () => {
  if (props.game.status === 'playing') {
    props.game.pause();
    return;
  }

  if (props.game.status === 'paused') {
    props.game.resume();
    return;
  }

  props.game.start();
};

const handleRestart = () => {
  props.game.restart();
};

const handlePauseRestart = () => {
  props.game.restart();
};

const handleDifficultyChange = (event: PickerChangeEvent) => {
  const picked = Number(event.detail.value);
  if (Number.isNaN(picked) || picked < 0 || picked >= difficultyKeys.value.length) {
    return;
  }

  props.game.setDifficulty(difficultyKeys.value[picked]);
  props.game.restart();
};
</script>

<style scoped>
/* 移除了大部分样式，仅保留可能有特定需求的样式（这里其实可以全删） */
</style>
