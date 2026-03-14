<!-- 用于网络图片的统一处理 ,传入网络url类型的图片时用这个组件 -->
<script setup>
import { getEnvBaseUrl } from '@/utils'

const props = defineProps({
  src: { type: String, default: '' },
  height: { type: String, default: '100rpx' },
  width: { type: String, default: '100rpx' },
  mode: { type: String, default: 'aspectFill' },
  isPreview: { type: Boolean, default: false },
})
// 控制图片透明度
const imageOpacity = ref(0)

const defaultImage = '/static/images/default.svg'

// 计算最终显示的图片地址
const imageSrc = computed(() => {
  if (!props.src)
    return defaultImage
  if (!JSON.stringify(props.src).includes('http')) {
    console.log(`${getEnvBaseUrl()}${props.src}`)
    return `${getEnvBaseUrl()}${props.src}`
  }
  else {
    return props.src
  }
})

// 图片加载错误时的处理
function handleImageError() {
  // 当图片加载错误时，我们可以设置图片的透明度为0，这样背景图片就会显示出来
  imageOpacity.value = 1
  console.log('img - err')
}

function preview() {
  if (!props.isPreview)
    return
  uni.previewImage({
    urls: [imageSrc.value],
  })
}
</script>

<template>
  <view style="position: relative" @click="preview">
    <image
      class="bg-image"
      :src="defaultImage"
      :style="{ width, height }"
      mode="aspectFill"
    />
    <image
      :style="{ width, height }"
      :src="imageSrc"
      :mode="mode"
      @error="handleImageError"
    />
  </view>
</template>

<style scoped lang="scss">
.bg-image {
  position: absolute;
  z-index: 10;
  opacity: v-bind(imageOpacity);
}
</style>
