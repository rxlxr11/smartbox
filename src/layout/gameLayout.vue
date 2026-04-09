<template>
    <view class="flex flex-col h-[100vh] bg-[#fafafa]">
        <!-- 顶部控制栏 -->
        <BackBar :title="game.name" bgColor="#ffffff" iconColor="#333">
            <template #right>
                <view class="flex items-center gap-[20rpx]">
                    <text v-if="game.maxErrors !== null" class="text-[24rpx] text-[#666]">
                        错误: {{ game.currentErrors }}/{{ game.maxErrors }}
                    </text>
                    <text v-else class="text-[24rpx] text-[#666]">
                        错误: {{ game.currentErrors }}
                    </text>
                    <text class="text-[24rpx] text-[#666] ml-[10rpx]">最佳: {{ game.highScore }}</text>
                </view>
            </template>
        </BackBar>

        <view
            class="flex justify-center gap-[30rpx] p-[20rpx] bg-white border-t-[2rpx] border-solid border-[#eee] shadow-[0_4rpx_8rpx_rgba(0,0,0,0.02)] z-10">
            <button
                class="text-[28rpx] py-[10rpx] px-[40rpx] m-0 rounded-[40rpx] bg-[#f0f0f0] border-[2rpx] border-solid border-[#ddd] active:bg-[#e0e0e0] leading-normal"
                @click="handleAction">
                {{ game.status === 'playing' ? '暂停' : (game.status === 'paused' ? '继续' : '开始') }}
            </button>
            <button
                class="text-[28rpx] py-[10rpx] px-[40rpx] m-0 rounded-[40rpx] bg-[#f0f0f0] border-[2rpx] border-solid border-[#ddd] active:bg-[#e0e0e0] leading-normal"
                @click="game.restart()" v-if="game.status !== 'idle'">重新开始</button>
        </view>

        <!-- 中部主体 -->
        <view class="flex-1 relative flex justify-center items-center overflow-hidden">
            <slot></slot>

            <!-- 暂停遮罩 -->
            <view v-if="game.status === 'paused'"
                class="absolute top-0 left-0 right-0 bottom-0 bg-[rgba(255,255,255,0.8)] flex flex-col justify-center items-center z-10">
                <text class="text-[40rpx] font-bold text-[#333] mb-[40rpx]">游戏已暂停</text>
                <button class="bg-[#007aff] text-white border-none rounded-[40rpx] py-[20rpx] px-[60rpx] leading-normal"
                    @click="game.resume()">继续游戏</button>
            </view>
        </view>

        <!-- 底部难度选择 -->
        <view class="p-[40rpx] bg-white border-t-[2rpx] border-solid border-[#eee]"
            v-if="game.status === 'idle' || game.status === 'ended'">
            <text class="text-[28rpx] text-[#666] mb-[20rpx] block">选择难度：</text>
            <view class="flex gap-[20rpx]">
                <view v-for="(config, key) in game.difficultyDict" :key="key"
                    class="flex-1 text-center py-[20rpx] bg-[#f5f5f5] rounded-[16rpx] text-[28rpx] text-[#333] border-[2rpx] border-solid border-transparent"
                    :class="{ 'bg-[#e6f2ff] text-[#007aff] border-[#007aff]': game.currentDifficulty === key }"
                    @click="game.setDifficulty(String(key))">
                    {{ config.label }}
                </view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import type { Game } from '@/types/game';
import BackBar from '@/components/BackBar/BackBar.vue';

const props = defineProps<{
    game: Game;
}>();

const handleAction = () => {
    if (props.game.status === 'playing') {
        props.game.pause();
    } else if (props.game.status === 'paused') {
        props.game.resume();
    } else {
        props.game.start();
    }
};
</script>

<style scoped>
/* 移除了大部分样式，仅保留可能有特定需求的样式（这里其实可以全删） */
</style>
