<script lang="ts">
import { computed, defineComponent } from 'vue'

export default defineComponent({
  props: {
    value: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    isPickerOpen: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    showClearBtn: { type: Boolean, default: false },
    minWidth: { type: [String, Number], default: '260px' },
  },
  setup(props) {
    const styleObject = computed(() => {
      return {
        minWidth: typeof props.minWidth === 'number' ? `${props.minWidth}px` : props.minWidth,
      }
    })

    return {
      styleObject,
    }
  },
})
</script>

<template>
  <div class="custom-input text-black bg-white" :style="styleObject">
    <!-- Input 本體 -->
    <slot name="input">
      <div class="custom-input__value" :class="{ open: isPickerOpen, disabled, clearable: showClearBtn }">
        <span class="truncate" :class="{ 'text-gray-600': !value }">{{ value || placeholder }}</span>
      </div>
    </slot>
    <div class="absolute transform top-1/2 -translate-y-1/2 right-3 flex items-center">
      <!-- 清除按鈕 -->
      <div v-if="showClearBtn" class="mr-2" @click.stop="$emit('clear')">
        <svg class="text-gray-600 cursor-pointer" width="14" height="14" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192s192-86 192-192Z" /><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M320 320L192 192m0 128l128-128" /></svg>
      </div>
      <!-- 下拉箭頭 -->
      <svg
        class="transform transition-transform duration-200 pointer-events-none"
        :class="{ 'rotate-180 text-orange-500': isPickerOpen, 'text-gray-200': disabled }" width="20" height="20" viewBox="0 0 512 512"
      ><path d="M256 294.1L383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0l127.1 127z" fill="currentColor" /></svg>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.custom-input {
  position: relative;
  background-color: #fff;

  &__value {
    width: 100%;
    height: 40px;
    min-height: 40px;
    padding: 0 36px 0 12px;
    border: 1px solid #c1c1c2;
    border-radius: 4px;
    font-size: 15px;
    // letter-spacing: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    cursor: text;

    &:hover {
      @apply border-black;
    }

    &.open {
      @apply text-orange-500 border-orange-500;
    }

    &.disabled {
      @apply text-gray-200 border-gray-200 bg-gray-300;
    }

    &.clearable {
      padding-right: 65px;
    }
  }
}
</style>
