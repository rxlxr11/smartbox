<script setup>
import { onMounted } from 'vue'

const props = defineProps({
  title: { type: String, default: '标题为空!' },
  bgColor: { type: String, default: '#fff' },
  iconColor: { type: String, default: '#333' },
  customLeft: { type: Boolean, default: false },
  beforeBack: { type: Function, default: null },
})
/**
 * 带返回键和标题以及插槽的顶部导航栏
 */
const safeAreaInsets = uni.getWindowInfo().safeArea
const screen = uni.getWindowInfo().screenWidth

let height = uni.upx2px(80)
let _right = 10

// #ifdef MP-WEIXIN
const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
height = (menuButtonInfo.top - safeAreaInsets.top) * 2 + menuButtonInfo.height
_right = menuButtonInfo.width + screen - menuButtonInfo.right
// #endif

// 返回
async function back() {
  // 如果有前置函数，先执行前置函数
  if (props.beforeBack) {
    try {
      const result = await props.beforeBack()
      // 如果前置函数返回 false，则阻止返回
      if (result === false) {
        return
      }
    }
    catch (error) {
      console.error('前置函数执行失败:', error)
      return
    }
  }

  // 执行默认返回逻辑
  uni.navigateBack().catch(() => {
    uni.switchTab({
      url: '/pages/index/index',
    })
  })
}

onMounted(() => {})
</script>

<template>
  <!-- 带标题和返回的导航栏 -->
  <view :style="{ paddingTop: `${safeAreaInsets?.top}px`, backgroundColor: bgColor }">
    <view class="entire-nav" :style="{ height: `${height}px` }">
      <view v-if="!customLeft" class="left large-bold-title" style="margin-left: 25rpx" @click="back">
        <view class="i-fa6-solid:chevron-left text-32rpx" :style="{ color: iconColor }" />
        <text style="margin-left: 20rpx" class="large-bold-title min-w-100rpx">
          {{ title }}
        </text>
      </view>
      <view v-else class="left">
        <slot name="left" />
      </view>
      <view class="right" :style="{ paddingRight: `${_right}px` }">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
//导航栏区域样式
.entire-nav {
  display: flex;
  width: 750rpx;
  justify-content: space-between;
  align-items: center;
  .left {
    display: flex;
    min-width: 300rpx;
    align-items: center;
  }
  .right {
    height: 40rpx;
    display: flex;
    align-items: center;
    margin-right: 20rpx;
    margin-bottom: 8rpx;
  }
}
</style>
