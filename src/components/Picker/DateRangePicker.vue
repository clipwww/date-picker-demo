<script lang="ts">
import type { PropType } from 'vue'
import { computed, defineComponent, ref } from 'vue'
import type { ConfigType } from 'dayjs'
import dayjs from 'dayjs'
import { onClickOutside } from '@vueuse/core'

import { dateHelpers } from '../../helpers'

import { useDoubleDatePanel } from '../../composable/use-date-picker'
import { useIsMobile } from '../../composable/use-is-mobile'
import BaseDatePicker from './BaseDatePicker.vue'
import CustomInput from './CustomInput.vue'

export default defineComponent({
  components: {
    BaseDatePicker,
    CustomInput,
  },
  props: {
    modelValue: { type: Object as PropType<{ start: ConfigType; end: ConfigType }>, required: true },
    placeholder: { type: String, default: '請選擇日期區間' },
    minDate: { type: [String, Date] as PropType<ConfigType>, default: () => dayjs().startOf('day').toDate() },
    maxDate: { type: [String, Date] as PropType<ConfigType>, default: () => dayjs().add(23, 'month').endOf('month').toDate() },
    maxRange: { type: Number, default: 180 },
    valueFormat: { type: String, default: 'YYYY-MM-DD' },
    /** 顯示訂單 Badges */
    showHasOrderBadges: { type: Boolean, default: true },
    /** 顯示店休日 Badges */
    showDayOffBadges: { type: Boolean, default: true },
    /** 店休日不可點選 */
    disabledDayOff: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  setup(props, ctx) {
    const { leftDate, rightDate, datePanels, isNextDisabled, isPrevDisabled, prevMonth, nextMonth } = useDoubleDatePanel({
      maxDate: computed(() => props.maxDate),
      minDate: computed(() => props.minDate),
    })

    const isPickerOpen = ref(false)
    /** 選取中 */
    const isInSelection = ref(false)
    const hoverDateEnd = ref<ConfigType>('')
    const dateStart = ref<ConfigType>('')
    const dateEnd = ref<ConfigType>('')

    const targetRef = ref(null)
    const isMobile = useIsMobile()
    onClickOutside(targetRef, () => {
      if (!isMobile.value)
        onClose()
    })

    const isConfirmButtonDisabled = computed(() => !dateStart.value || !dateEnd.value)
    const isClearButtonDisabled = computed(() => !dateStart.value && !dateEnd.value)

    /** 顯示在 Input 上的 Label */
    const displayLabel = computed(() => {
      const { start, end } = props.modelValue
      return !start || !end ? '' : `${dateHelpers.formatDate(start)} - ${dateHelpers.formatDate(end)}`
    })
    /** 顯示在 BaseDatePicker 上顯示的開始, 結束 */
    const displayDateRange = computed(() => {
      if (!isInSelection.value) {
        /** 非選取中 */
        return {
          dateStart: dateStart.value,
          dateEnd: dateEnd.value,
        }
      }

      if (dayjs(hoverDateEnd.value).isBefore(dateStart.value)) {
        /** 選取結束日中 - 且 hoverDateEnd 早於 dateStart */
        return {
          dateStart: hoverDateEnd.value,
          dateEnd: dateStart.value,
        }
      }

      /** 選取結束日中 */
      return {
        dateStart: dateStart.value,
        dateEnd: hoverDateEnd.value,
      }
    })

    const mobilePanel = computed(() => datePanels.value?.[0])

    function onInput(isOpen: boolean) {
      /** Picker 打開時 */
      leftDate.value = dayjs(props.modelValue.start || undefined).startOf('month')
      dateStart.value = props.modelValue.start
      dateEnd.value = props.modelValue.end
    }

    function onDayClick(value: Date) {
      if (!isInSelection.value) {
        /** 選擇開始日期 */
        dateStart.value = value
        dateEnd.value = ''
        isInSelection.value = true
        return
      }

      if (dayjs(value).isBefore(dateStart.value)) {
        /** 選擇的結束日比開始日還早  交換 */
        dateEnd.value = dateStart.value
        dateStart.value = value
        isInSelection.value = false
        return
      }

      const limitEndDate = dayjs(dateStart.value).add(props.maxRange, 'day')
      if (limitEndDate.isBefore(value)) {
        dateEnd.value = limitEndDate.toDate()
        isInSelection.value = false
        leftDate.value = limitEndDate.clone().add(-1, 'month')
        return
      }

      dateEnd.value = value
      isInSelection.value = false
    }

    function onDayHover(value: Date) {
      if (!isInSelection.value) {
        hoverDateEnd.value = null
        return
      }

      hoverDateEnd.value = value
    }

    function onClear() {
      hoverDateEnd.value = null
      dateEnd.value = null
      dateStart.value = null
      isInSelection.value = false

      ctx.emit('clear')
    }

    function onClose() {
      hoverDateEnd.value = null
      isInSelection.value = false
      isPickerOpen.value = false
    }

    function onConfirm() {
      const value = {
        start: dateStart.value ? dayjs(dateStart.value).format(props.valueFormat) : null,
        end: dateEnd.value ? dayjs(dateEnd.value).format(props.valueFormat) : null,
      }
      ctx.emit('update:modelValue', value)
      ctx.emit('confirm', value)

      isPickerOpen.value = false
    }

    return {
      targetRef,
      datePanels,
      mobilePanel,
      dateStart,
      dateEnd,
      displayLabel,
      displayDateRange,
      isMobile,
      isNextDisabled,
      isPrevDisabled,
      leftDate,
      rightDate,
      isInSelection,
      isPickerOpen,
      isConfirmButtonDisabled,
      isClearButtonDisabled,

      prevMonth,
      nextMonth,
      onInput,
      onDayClick,
      onDayHover,
      onClear,
      onClose,
      onConfirm,
    }
  },
})
</script>

<template>
  <div ref="targetRef" class="relative">
    <div class="h-min" @click="isPickerOpen = !isPickerOpen;onInput(isPickerOpen)">
      <CustomInput :value="displayLabel" :placeholder="placeholder" :is-picker-open="isPickerOpen" :disabled="disabled">
        <template #input>
          <slot name="input" />
        </template>
      </CustomInput>
    </div>
    <Transition name="drawer">
      <div v-if="isPickerOpen && isMobile" class="drawer-overlay" @click="onClose">
        <div class="drawer-panel" @click.stop>
          <div class="drawer-header">
            <div class="text-sm text-gray-600">請選擇日期區間</div>
            <button class="drawer-close" type="button" @click="onClose">X</button>
          </div>
          <div class="drawer-body">
            <div v-if="mobilePanel" class="select-none">
              <div class="grid grid-cols-7 mb-3 items-center">
                <div class="cursor-pointer" :class="{ 'pointer-events-none text-gray-200': isPrevDisabled }" @click="prevMonth">
                  <svg width="21" height="21" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6l6 6l1.41-1.41z" /></svg>
                </div>
                <div class="w-full text-center col-span-5">
                  {{ mobilePanel.label }}
                </div>
                <div class="cursor-pointer" :class="{ 'pointer-events-none text-gray-200': isNextDisabled }" @click="nextMonth">
                  <svg width="21" height="21" viewBox="0 0 24 24"><path fill="currentColor" d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6l-6 6l-1.41-1.41z" /></svg>
                </div>
              </div>
              <BaseDatePicker
                :show-date="mobilePanel.date"
                :date-start="displayDateRange.dateStart"
                :date-end="displayDateRange.dateEnd"
                :min-date="minDate"
                :max-date="maxDate"
                @day-click="onDayClick"
                @day-hover="onDayHover"
              >
                <template #date="{ number }">
                  <span class="text-sm">{{ number }}</span>
                </template>
              </BaseDatePicker>
            </div>
          </div>
          <div class="drawer-footer">
            <div class="flex items-center gap-2">
              <div
                class="text-orange-500 border border-solid border-orange-500 rounded px-4 py-1"
                :class="{ 'pointer-events-none text-gray-200 border-gray-200': isClearButtonDisabled }"
                @click="onClear"
              >
                清除
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="text-black bg-gray-200 rounded px-4 py-1" @click="onClose">取消</div>
              <div
                class="text-white bg-orange-500 rounded px-4 py-1"
                :class="{ disabled: isConfirmButtonDisabled }"
                @click="onConfirm"
              >
                確認
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition>
      <div v-if="isPickerOpen && !isMobile" class="bg-white text-black shadow p-5 absolute top-[40px] left-0 z-10">
        <div class="flex select-none">
          <div
            v-for="(datePanel, index) in datePanels"
            :key="index"
            :class="{ 'mr-6 pr-6 border-0 border-r border-solid border-gray-400': index === 0 }"
          >
            <div class="grid grid-cols-7 mb-3">
              <div
                v-if="datePanel.isLeft"
                class="cursor-pointer"
                :class="{ 'pointer-events-none text-gray-200': isPrevDisabled }"
                @click="prevMonth"
              >
                <svg width="21" height="21" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6l6 6l1.41-1.41z" /></svg>
              </div>
              <div v-else class="text-orange-50 whitespace-nowrap" />
              <div class="w-full text-center col-span-5">
                {{ datePanel.label }}
              </div>
              <div
                v-if="datePanel.isRight"
                class="cursor-pointer"
                :class="{ 'pointer-events-none text-gray-200': isNextDisabled }"
                @click="nextMonth"
              >
                <svg width="21" height="21" viewBox="0 0 24 24"><path fill="currentColor" d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6l-6 6l-1.41-1.41z" /></svg>
              </div>
              <div v-else class="text-orange-500 relative">
                <span
                  class="cursor-pointer absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 whitespace-nowrap"
                  :class="{ 'text-gray-200 pointer-events-none': isClearButtonDisabled }"
                  @click="onClear"
                >
                  清除
                </span>
              </div>
            </div>
            <BaseDatePicker
              :show-date="datePanel.date"
              :date-start="displayDateRange.dateStart"
              :date-end="displayDateRange.dateEnd"
              :min-date="minDate"
              :max-date="maxDate"
              @day-click="onDayClick"
              @day-hover="onDayHover"
            >
              <template #date="{ number }">
                <span class="text-sm">{{ number }}</span>
              </template>
            </BaseDatePicker>
          </div>
        </div>
        <div class="flex items-center justify-end mt-6">
          <div class="inline-block text-black bg-gray-200 rounded py-1 px-4 mr-4" elevation="0" max-height="32" @click="onClose">
            取消
          </div>
          <div
            class="text-white bg-orange-500 rounded py-1 px-4"
            :class="{ disabled: isConfirmButtonDisabled }"
            elevation="0"
            max-height="32"
            color="orange50"
            @click="onConfirm"
          >
            確認
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: flex-end;
  z-index: 50;
}

.drawer-panel {
  background: #fff;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.drawer-close {
  background: transparent;
  border: 0;
  padding: 4px 8px;
  font-size: 16px;
  cursor: pointer;
}

.drawer-body {
  padding: 12px 16px;
  overflow-y: auto;
}

.drawer-footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

:global(.drawer-enter-active),
:global(.drawer-leave-active) {
  transition: all 0.25s ease;
}

:global(.drawer-enter-from),
:global(.drawer-leave-to) {
  opacity: 0;
  transform: translateY(20px);
}
</style>
