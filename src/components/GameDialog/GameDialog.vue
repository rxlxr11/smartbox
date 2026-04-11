<template>
  <view
    v-if="visible"
    class="fixed top-0 left-0 right-0 bottom-0 z-50 backdrop-blur-[6rpx] flex items-center justify-center"
    style="background-color: rgba(148,153,166,0.62)"
  >
    <view
      class="relative w-[686rpx] box-border bg-[#f8f8fb] border-[2rpx] border-solid border-[#ececf5] rounded-[48rpx] px-[48rpx] pt-[54rpx] pb-[42rpx]  flex flex-col items-center overflow-hidden"
      :class="panelClass"
    >
      <view v-if="showTopLine" class="absolute top-0 left-0 right-0 h-[10rpx] game-dialog-top-line"></view>

      <view
        v-if="iconClass"
        class="w-[92rpx] h-[92rpx] rounded-full bg-[#e9e6ff] flex items-center justify-center mb-[28rpx]"
        :class="iconWrapClass"
      >
        <view class="text-[38rpx] text-[#4f46e5]" :class="[iconClass, iconClassName]"></view>
      </view>

      <text v-if="title" class="text-[48rpx] font-bold text-[#202534] mb-[18rpx]">{{ title }}</text>
      <text v-if="description" class="text-[25rpx] text-[#6b7280] leading-[1.7] text-center mb-[34rpx]">{{ description }}</text>

      <slot></slot>
      <slot name="actions"></slot>
      <slot name="footer"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  visible: boolean;
  title?: string;
  description?: string;
  iconClass?: string;
  iconWrapClass?: string;
  iconClassName?: string;
  panelClass?: string;
  showTopLine?: boolean;
}>(), {
  title: '',
  description: '',
  iconClass: '',
  iconWrapClass: '',
  iconClassName: '',
  panelClass: '',
  showTopLine: false,
});
</script>

<style scoped>
.game-dialog-top-line {
  background: linear-gradient(90deg, #5d5bf6 0%, #a78bfa 100%);
}
</style>
