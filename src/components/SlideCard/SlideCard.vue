<script setup lang="ts">
import { computed, ref, watch } from 'vue';

/**
 * SlideCard（三插槽版）
 *
 * 结构定义：
 * - 默认插槽（中间）：卡片主体内容
 * - left 插槽（左侧）：右滑后露出的按钮组
 * - right 插槽（右侧）：左滑后露出的按钮组
 *
 * 交互规则：
 * - 左滑打开 right，右滑打开 left
 * - 当已打开一侧时，反向滑动先回到 center，不允许一次手势直接切到另一侧
 */
type SlideSide = 'center' | 'left' | 'right';

type SlideCardProps = {
  /** v-model 值：'center' | 'left' | 'right' */
  modelValue?: SlideSide;
  /** 容器宽度 */
  width?: string | number;
  /** 容器高度 */
  height?: string | number;
  /** 最外层圆角 */
  radius?: string | number;
  /** 是否禁用滑动 */
  disabled?: boolean;
  /** 是否启用左侧插槽（右滑显示） */
  useLeftSlot?: boolean;
  /** 是否启用右侧插槽（左滑显示） */
  useRightSlot?: boolean;
  /** 主体向右移动距离（用于显示左侧插槽） */
  leftMove?: string | number;
  /** 主体向左移动距离（用于显示右侧插槽） */
  rightMove?: string | number;
  /** 滑动阈值：达到该比例后吸附到目标侧，否则回中间 */
  openThreshold?: number;
  /** 点击主体时，若已展开，是否自动回中间 */
  closeOnContentTap?: boolean;
};

const props = withDefaults(defineProps<SlideCardProps>(), {
  modelValue: 'center',
  width: '100%',
  height: 'auto',
  radius: '0',
  disabled: false,
  useLeftSlot: false,
  useRightSlot: true,
  leftMove: '180rpx',
  rightMove: '180rpx',
  openThreshold: 0.35,
  closeOnContentTap: true,
});

/**
 * 事件说明：
 * - update:modelValue: 同步当前侧（center/left/right）
 * - change: 侧边状态变化
 * - open-left/open-right/close: 语义事件
 * - content-click: 点击主体内容
 */
const emit = defineEmits<{
  (e: 'update:modelValue', value: SlideSide): void;
  (e: 'change', value: SlideSide): void;
  (e: 'open-left'): void;
  (e: 'open-right'): void;
  (e: 'close'): void;
  (e: 'content-click'): void;
}>();

/** 当前侧：center（中间）、left（显示左槽）、right（显示右槽） */
const side = ref<SlideSide>('center');
/** 主体实际位移（px）：>0 向右，<0 向左 */
const offsetX = ref(0);
/** 是否处于拖拽中 */
const isDragging = ref(false);

// 手势过程状态
const startX = ref(0);
const startY = ref(0);
const startOffsetX = ref(0);
const hasDirection = ref(false);
const isHorizontalDrag = ref(false);
const maxMoveDistance = ref(0);
const suppressTapUntil = ref(0);

const normalizeSize = (value?: string | number): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value;
};

/**
 * 尺寸转换：用于运算，支持 number / px / rpx(upx)
 */
const toPx = (value?: string | number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return 0;
  const v = value.trim();
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v.endsWith('px')) {
    const n = Number.parseFloat(v.slice(0, -2));
    return Number.isFinite(n) ? n : 0;
  }
  if (v.endsWith('rpx') || v.endsWith('upx')) {
    const n = Number.parseFloat(v.slice(0, -3));
    return Number.isFinite(n) ? uni.upx2px(n) : 0;
  }
  return 0;
};

/** 阈值防御：限制到 [0.05, 0.95] */
const normalizedThreshold = computed(() => {
  const n = Number(props.openThreshold);
  if (Number.isNaN(n)) return 0.35;
  return Math.min(0.95, Math.max(0.05, n));
});

/** 左/右移动距离（px） */
const leftMovePx = computed(() => Math.max(0, toPx(props.leftMove)));
const rightMovePx = computed(() => Math.max(0, toPx(props.rightMove)));

/** 当前是否允许打开左右槽 */
const canOpenLeft = computed(() => props.useLeftSlot && leftMovePx.value > 0);
const canOpenRight = computed(() => props.useRightSlot && rightMovePx.value > 0);

/** 容器样式：主体大小与容器一致，主体内部样式由用户插槽自定义 */
const cardStyle = computed(() => ({
  width: normalizeSize(props.width),
  height: normalizeSize(props.height),
  borderRadius: normalizeSize(props.radius),
}));

const leftSlotStyle = computed(() => ({
  width: `${leftMovePx.value}px`,
}));

const rightSlotStyle = computed(() => ({
  width: `${rightMovePx.value}px`,
}));

/** 主体位移动画样式 */
const contentTransformStyle = computed(() => ({
  transform: `translate3d(${offsetX.value}px, 0, 0)`,
  transition: isDragging.value ? 'none' : 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
}));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * 规范化侧边状态：
 * - left 未启用时不能进入 left
 * - right 未启用时不能进入 right
 * - disabled 时强制 center
 */
const normalizeSide = (next: SlideSide): SlideSide => {
  if (props.disabled) return 'center';
  if (next === 'left' && !canOpenLeft.value) return 'center';
  if (next === 'right' && !canOpenRight.value) return 'center';
  return next;
};

/** 根据 side 同步 offsetX */
const syncOffsetBySide = (target: SlideSide) => {
  if (target === 'left') {
    offsetX.value = leftMovePx.value;
    return;
  }
  if (target === 'right') {
    offsetX.value = -rightMovePx.value;
    return;
  }
  offsetX.value = 0;
};

/**
 * 状态切换统一入口：
 * - 外部 v-model
 * - 手势结束吸附
 * - 方法调用（openLeft/openRight/close）
 */
const applySide = (next: SlideSide, notify = true) => {
  const finalSide = normalizeSide(next);
  const changed = side.value !== finalSide;

  side.value = finalSide;
  syncOffsetBySide(finalSide);

  if (!notify || !changed) return;
  emit('update:modelValue', finalSide);
  emit('change', finalSide);
  if (finalSide === 'left') emit('open-left');
  else if (finalSide === 'right') emit('open-right');
  else emit('close');
};

const openLeft = () => applySide('left');
const openRight = () => applySide('right');
const close = () => applySide('center');
const toggle = () => {
  if (side.value === 'center') {
    if (canOpenRight.value) openRight();
    else if (canOpenLeft.value) openLeft();
    return;
  }
  close();
};

const getTouchPoint = (event: any) => event?.touches?.[0] ?? event?.changedTouches?.[0] ?? null;

/**
 * 拖拽边界计算（关键）：
 * - 从 center 开始：可在 [-rightMovePx, leftMovePx] 内移动
 * - 从 right 开始：只允许在 [-rightMovePx, 0] 内移动（先回中间，不能一把切到 left）
 * - 从 left 开始：只允许在 [0, leftMovePx] 内移动（先回中间，不能一把切到 right）
 */
const getDragBounds = () => {
  if (startOffsetX.value < 0) {
    return { min: canOpenRight.value ? -rightMovePx.value : 0, max: 0 };
  }
  if (startOffsetX.value > 0) {
    return { min: 0, max: canOpenLeft.value ? leftMovePx.value : 0 };
  }
  return {
    min: canOpenRight.value ? -rightMovePx.value : 0,
    max: canOpenLeft.value ? leftMovePx.value : 0,
  };
};

const handleTouchStart = (event: any) => {
  if (props.disabled || (!canOpenLeft.value && !canOpenRight.value)) return;
  const point = getTouchPoint(event);
  if (!point) return;

  isDragging.value = true;
  startX.value = point.clientX;
  startY.value = point.clientY;
  startOffsetX.value = offsetX.value;
  hasDirection.value = false;
  isHorizontalDrag.value = false;
  maxMoveDistance.value = 0;
};

const handleTouchMove = (event: any) => {
  if (!isDragging.value) return;
  const point = getTouchPoint(event);
  if (!point) return;

  const deltaX = point.clientX - startX.value;
  const deltaY = point.clientY - startY.value;
  maxMoveDistance.value = Math.max(maxMoveDistance.value, Math.abs(deltaX));

  if (!hasDirection.value && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
    hasDirection.value = true;
    isHorizontalDrag.value = Math.abs(deltaX) >= Math.abs(deltaY);
  }

  if (!isHorizontalDrag.value) return;
  if (typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  const { min, max } = getDragBounds();
  offsetX.value = clamp(startOffsetX.value + deltaX, min, max);
};

/**
 * 计算松手后目标侧：
 * 1. 若从某一侧开始拖拽，只在“该侧/center”之间判定
 * 2. 若从 center 开始，根据 offsetX 正负决定尝试打开哪一侧
 */
const resolveTargetSideAfterDrag = (): SlideSide => {
  if (startOffsetX.value < 0) {
    if (!canOpenRight.value) return 'center';
    const ratio = Math.abs(offsetX.value) / rightMovePx.value;
    return ratio >= normalizedThreshold.value ? 'right' : 'center';
  }

  if (startOffsetX.value > 0) {
    if (!canOpenLeft.value) return 'center';
    const ratio = Math.abs(offsetX.value) / leftMovePx.value;
    return ratio >= normalizedThreshold.value ? 'left' : 'center';
  }

  if (offsetX.value < 0) {
    if (!canOpenRight.value) return 'center';
    const ratio = Math.abs(offsetX.value) / rightMovePx.value;
    return ratio >= normalizedThreshold.value ? 'right' : 'center';
  }

  if (offsetX.value > 0) {
    if (!canOpenLeft.value) return 'center';
    const ratio = Math.abs(offsetX.value) / leftMovePx.value;
    return ratio >= normalizedThreshold.value ? 'left' : 'center';
  }

  return 'center';
};

const handleTouchEnd = () => {
  if (!isDragging.value) return;
  isDragging.value = false;

  if (!isHorizontalDrag.value) return;
  if (maxMoveDistance.value > 6) {
    suppressTapUntil.value = Date.now() + 220;
  }

  applySide(resolveTargetSideAfterDrag());
};

const handleContentTap = () => {
  if (Date.now() < suppressTapUntil.value) return;
  emit('content-click');
  if (props.closeOnContentTap && side.value !== 'center') {
    close();
  }
};

watch(
  () => props.modelValue,
  (value) => {
    if (value !== 'left' && value !== 'right' && value !== 'center') return;
    applySide(value, false);
  },
  { immediate: true }
);

watch(
  () => [props.useLeftSlot, props.useRightSlot, props.leftMove, props.rightMove, props.disabled] as const,
  () => {
    applySide(side.value, false);
  }
);

defineExpose({
  openLeft,
  openRight,
  close,
  toggle,
  side,
});
</script>

<template>
  <view class="slide-card" :style="cardStyle">
    <!-- 左侧插槽：主体右滑后露出 -->
    <view v-if="useLeftSlot" class="slide-card__left" :style="leftSlotStyle">
      <slot
        name="left"
        :side="side"
        :openLeft="openLeft"
        :openRight="openRight"
        :close="close"
      />
    </view>

    <!-- 右侧插槽：主体左滑后露出 -->
    <view v-if="useRightSlot" class="slide-card__right" :style="rightSlotStyle">
      <slot
        name="right"
        :side="side"
        :openLeft="openLeft"
        :openRight="openRight"
        :close="close"
      />
    </view>

    <!-- 主体插槽：与容器同尺寸 -->
    <view
      class="slide-card__content"
      :style="contentTransformStyle"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
      @tap="handleContentTap"
    >
      <slot />
    </view>
  </view>
</template>

<style scoped lang="scss">
.slide-card {
  position: relative;
  overflow: hidden;
}

.slide-card__left,
.slide-card__right {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  align-items: stretch;
}

.slide-card__left {
  left: 0;
}

.slide-card__right {
  right: 0;
}

.slide-card__content {
  position: relative;
  z-index: 2;
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  will-change: transform;
}
</style>
