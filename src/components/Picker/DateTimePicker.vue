<script lang="ts">
import type { PropType } from 'vue'
import { computed, defineComponent, ref } from 'vue'
import type { ConfigType } from 'dayjs'
import dayjs from 'dayjs'
import { onClickOutside } from '@vueuse/core'

import { useSingleDatePanel } from '../../composable/use-date-picker'
import { dateHelpers } from '../../helpers'

import BaseDatePicker from './BaseDatePicker.vue'
import BaseTimePicker from './BaseTimePicker.vue'
import CustomInput from './CustomInput.vue'

enum PickerTypeEnum {
  Date = 'date',
  DateTime = 'datetime',
  Time = 'time',
  MultipleDate = 'multiple-date',
}

type PickerType = `${PickerTypeEnum}`

export default defineComponent({
  components: {
    BaseDatePicker,
    BaseTimePicker,
    CustomInput,
  },
  props: {
    modelValue: { type: [String, Number, Object, Date, Array] as PropType<ConfigType | Array<ConfigType>> },
    type: { type: String as PropType<PickerType>, default: 'date' },
    placeholder: { type: String, default: () => '請選擇日期' },
    minDate: { type: [String, Date] as PropType<ConfigType>, default: () => dayjs().startOf('day').toDate() },
    maxDate: { type: [String, Date] as PropType<ConfigType> },
    /** 下拉 content 靠右  */
    right: { type: Boolean, default: true },
    /** 多選模式的上限  */
    maxLength: { type: Number },
    /** 顯示訂單 Badges */
    showHasOrderBadges: { type: Boolean, default: true },
    /** 顯示店休日 Badges */
    showDayOffBadges: { type: Boolean, default: true },
    /** 可清除 */
    clearable: { type: Boolean, default: false },
    /** 使用跨日（僅限 Time Mode） */
    useCrossDay: { type: Boolean, default: false },
    /** 禁用 */
    disabled: { type: Boolean, default: false },
    /** 不用按確認就會更新值 */
    autoApply: { type: Boolean, default: true },
    /** 分間隔 */
    minuteInterval: { type: Number, default: 15 },
  },
  setup(props, ctx) {
    const dateFormat = 'YYYY-MM-DD'
    const timeFormat = 'HH:mm'

    const { showDate, datePanel, isNextDisabled, isPrevDisabled, isTodayDisabled, prevMonth, nextMonth } = useSingleDatePanel({
      maxDate: computed(() => props.maxDate),
      minDate: computed(() => props.minDate),
    })

    const isPickerOpen = ref(false)
    const dateSelected = ref<string | string[] | null>(null)
    const timeSelected = ref<string | null>(null)

    const targetRef = ref(null)
    onClickOutside(targetRef, () => isPickerOpen.value = false)

    /** 選日期模式 */
    const isDateMode = computed(() => props.type === PickerTypeEnum.Date)
    /** 選時間模式 */
    const isTimeMode = computed(() => props.type === PickerTypeEnum.Time)
    /** 選日期時間模式 */
    const isDateTimeMode = computed(() => props.type === PickerTypeEnum.DateTime)
    /** 選多個日期 */
    const isMultipleDateMode = computed(() => props.type === PickerTypeEnum.MultipleDate)

    const isConfirmButtonDisabled = computed(() => {
      switch (props.type) {
        case PickerTypeEnum.Date:
          return !dateSelected.value
        case PickerTypeEnum.Time:
          return !timeSelected.value
        case PickerTypeEnum.DateTime:
          return !dateSelected.value || !timeSelected.value
        case PickerTypeEnum.MultipleDate:
          return Array.isArray(dateSelected.value) && dateSelected.value.length <= 0
        default:
          return false
      }
    })
    const showClearBtn = computed(() => props.clearable && (Array.isArray(props.modelValue) ? props.modelValue.length > 0 : !!props.modelValue))

    /** 最小可選時間 */
    const minTime = computed(() => {
      if (isMultipleDateMode.value || Array.isArray(dateSelected.value)) {
        // 選多個日期模式不會有 TimePicker
        return null
      }

      const minTime = dayjs(props.minDate).format(timeFormat)
      // 選時間模式 | 選日期時間模式：目前選擇的日期與最小可選日期為同天 = 限制最小可選時間
      const useMinTime = isTimeMode.value || dayjs(dateSelected.value).isSame(props.minDate, 'day')

      return useMinTime ? minTime : null
    })
    /** 最大可選時間 */
    const maxTime = computed(() => {
      if (!props.maxDate || isMultipleDateMode.value || Array.isArray(dateSelected.value)) {
        // 選多個日期模式不會有 TimePicker
        return null
      }
      const maxTime = dayjs(props.maxDate).format(timeFormat)
      // 選時間模式 | 選日期時間模式：目前選擇的日期與最大可選日期為同天 = 限制最大可選時間
      const useMaxTime = isTimeMode.value || dayjs(dateSelected.value).isSame(props.maxDate, 'day')

      return useMaxTime ? maxTime : null
    })

    /** 顯示在 Input 上的 Label */
    const displayLabel = computed(() => {
      if (!props.modelValue)
        return ''

      if (Array.isArray(props.modelValue)) {
        // isMultipleDateMode 的 value 會是 array
        return props.modelValue.map(date => dayjs(date).format('YYYY/MM/DD')).join(', ')
      }

      switch (props.type) {
        case PickerTypeEnum.Date:
          return dateHelpers.formatDate(props.modelValue)
        case PickerTypeEnum.Time:
          // 選時間模式可能會有跨日（翌日）
          return dateHelpers.checkCrossDay(`${props.modelValue}`)
            ? `翌日 ${dateHelpers.adapterValidatedTime(`${props.modelValue}`)}`
            : `${props.modelValue}`
        case PickerTypeEnum.DateTime:
          return dateHelpers.formatDateTime(props.modelValue)
        default:
          return `${props.modelValue}`
      }
    })

    /** emit input & change event */
    async function emitValue() {
      let value: string | string[] | null
      switch (props.type) {
        case PickerTypeEnum.Time:
          value = timeSelected.value
          break
        case PickerTypeEnum.DateTime:
          value = `${dateSelected.value} ${timeSelected.value}`
          break

        case PickerTypeEnum.Date:
        case PickerTypeEnum.MultipleDate:
        default:
          value = dateSelected.value
          break
      }

      ctx.emit('update:modelValue', value)
      ctx.emit('change', value)
    }

    /** 選擇當下時間 */
    function onNowClick() {
      const now = dayjs()
      showDate.value = now
      setDay(now.toDate(), true)
    }

    /** 選擇日期 */
    function setDay(date: Date, now = false) {
      try {
        const dateInstance = dayjs(date)

        // 為多選日期的模式
        if (isMultipleDateMode.value && Array.isArray(dateSelected.value)) {
          const index = dateSelected.value.findIndex(value => dateInstance.isSame(value, 'day'))
          if (index >= 0) {
            // 已經存在的日期：刪除
            dateSelected.value.splice(index, 1)
            return
          }

          if (!props.maxLength || dateSelected.value.length < props.maxLength) {
            // 不存在的日期 且 沒有數量上限或還沒達到可選上限：加入
            dateSelected.value.push(dayjs(date).format(dateFormat))
          }
          return
        }

        dateSelected.value = dateInstance.format(dateFormat)
        if (!timeSelected.value || now) {
          // 如果點選日期時 時間還是空值 => 預設時間
          timeSelected.value = dateInstance.format(timeFormat)
        }
      }
      finally {
        if (props.autoApply) {
          emitValue()
          if (isDateMode.value) {
            // autoApply + 日期模式 = 點選一個日期後就關閉
            isPickerOpen.value = false
          }
        }
      }
    }

    /** handle TimePicker change event */
    function onTimeChange() {
      if (!dateSelected.value) {
        // 如果日期還是空值，給預設最小日期或今日
        dateSelected.value = dayjs(isTodayDisabled.value && props.minDate ? props.minDate : undefined).format(dateFormat)
      }
      if (props.autoApply)
        emitValue()
    }

    /** handle VMenu input event */
    function onInput(isOpen: boolean) {
      if (!isOpen) {
        // Picker 關閉時
        return
      }

      if (Array.isArray(props.modelValue)) {
        // isMultipleDateMode 的 value 會是 array
        dateSelected.value = props.modelValue.map(date => dayjs(date).format(dateFormat))
        showDate.value = dayjs(props.modelValue?.[0])
        return
      }

      if (isTimeMode.value) {
        timeSelected.value = props.modelValue ? `${props.modelValue}` : null
        return
      }

      if (isDateTimeMode.value)
        timeSelected.value = props.modelValue ? dayjs(props.modelValue).format(timeFormat) : null

      dateSelected.value = props.modelValue ? dayjs(props.modelValue).format(dateFormat) : null
      /**
       * 開起 Picker 時預設顯示的月份
       * 有 value 以 value 為主
       * 還沒有 value 的話 -> 看當下是否早於 minDate
       * - 是： minDate
       * - 否： 當下
       */
      showDate.value = dayjs(props.modelValue || (props.minDate && dayjs().isBefore(props.minDate) ? props.minDate : undefined))
    }

    async function onConfirm() {
      emitValue()
      ctx.emit('confirm')
      isPickerOpen.value = false
    }

    async function onClear() {
      ctx.emit('update:modelValue', isMultipleDateMode.value ? [] : null)
      ctx.emit('change', null)
      ctx.emit('clear')
      isPickerOpen.value = false
    }

    function disabledDates(date: Date) {
      /** 多選已達上限，disable 掉除了已選日期外的其他日 */
      if (isMultipleDateMode.value && Array.isArray(dateSelected.value) && props.maxLength && dateSelected.value.length >= props.maxLength)
        return !dateSelected.value.some(selectedDate => dayjs(selectedDate).isSame(date, 'day'))

      return false
    }

    return {
      targetRef,
      showDate,
      datePanel,
      dateSelected,
      timeSelected,
      displayLabel,
      isPickerOpen,
      isDateMode,
      isTimeMode,
      isDateTimeMode,
      isMultipleDateMode,
      isConfirmButtonDisabled,
      isPrevDisabled,
      isNextDisabled,
      isTodayDisabled,
      showClearBtn,
      minTime,
      maxTime,

      disabledDates,
      prevMonth,
      nextMonth,
      setDay,
      onTimeChange,
      onNowClick,
      onInput,
      onConfirm,
      onClear,
    }
  },
})
</script>

<template>
  <div ref="targetRef" class="relative">
    <!-- Input -->
    <div class="h-min" @click="isPickerOpen = !isPickerOpen;onInput(isPickerOpen)">
      <CustomInput
        :value="displayLabel"
        :placeholder="placeholder"
        :is-picker-open="isPickerOpen"
        :disabled="disabled"
        :show-clear-btn="showClearBtn"
        min-width="188px"
        @clear="onClear"
      >
        <template #input>
          <slot name="input" />
        </template>
      </CustomInput>
    </div>

    <!-- content -->
    <Transition>
      <div v-if="isPickerOpen" class="bg-white text-black shadow absolute top-[40px] left-0 z-10">
        <div class="flex" :class="right ? 'justify-end' : 'justify-start'">
          <div class="bg-white text-black rounded elevation-4 pointer-events-auto">
            <div class="flex select-none">
              <!-- 選日期/選日期時間/選多個日期模式：使用 DatePicker -->
              <div v-if="isDateMode || isDateTimeMode || isMultipleDateMode" class="py-3 px-5 flex flex-col">
                <div class="grid grid-cols-7 mb-3 items-center">
                  <!-- 上個月 btn -->
                  <div class="cursor-pointer" :class="{ 'pointer-events-none text-gray-200': isPrevDisabled }" @click="prevMonth">
                    <svg width="21" height="21" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6l6 6l1.41-1.41z" /></svg>
                  </div>
                  <!-- 年/月 Label -->
                  <div class="w-full text-center col-span-5">
                    {{ datePanel.label }}
                  </div>
                  <!-- 選取今日 btn & 下個月 btn -->
                  <div class="relative">
                    <div
                      class="cursor-pointer absolute top-1/2 transform -translate-y-1/2 right-[40px] z-1"
                      :class="{ 'pointer-events-none text-gray-200': isTodayDisabled }"
                      @click="onNowClick"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M5 22q-.825 0-1.413-.587Q3 20.825 3 20V6q0-.825.587-1.412Q4.175 4 5 4h1V2h2v2h8V2h2v2h1q.825 0 1.413.588Q21 5.175 21 6v14q0 .825-.587 1.413Q19.825 22 19 22Zm0-2h14V10H5v10Z" /></svg>
                    </div>

                    <div class="cursor-pointer" :class="{ 'pointer-events-none text-gray-200': isNextDisabled }" @click="nextMonth">
                      <svg width="21" height="21" viewBox="0 0 24 24"><path fill="currentColor" d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6l-6 6l-1.41-1.41z" /></svg>
                    </div>
                  </div>
                </div>
                <!-- DatePicker -->
                <div class="flex-1">
                  <BaseDatePicker
                    :show-date="showDate"
                    :date-selected="dateSelected"
                    :min-date="minDate"
                    :max-date="maxDate"
                    :disabled-dates="disabledDates"
                    @day-click="setDay"
                  >
                    <template #date="{ number }">
                      <span class="text-normal">{{ number }}</span>
                    </template>
                  </BaseDatePicker>
                </div>

                <div class="flex items-center justify-between mt-3">
                  <!-- Badge 說明 -->
                  <div />
                  <!-- 取消 / 確認 btn：僅在沒有使用 TimePicker (選日期/選多日期模式) 時出現的樣式 -->
                  <div v-if="isDateMode || isMultipleDateMode" class="text-right">
                    <template v-if="!autoApply">
                      <div class="inline-block text-black bg-gray-200 rounded py-1 px-4 mr-4" elevation="0" max-height="32" @click="isPickerOpen = false">
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
                    </template>
                  </div>
                </div>
              </div>
              <!-- 選日期時間模式 DatePicker & TimePicker 中間隔一條線 -->
              <div v-if="isDateTimeMode" class="w-[1px] bg-gray-400" />
              <!-- 選時間/選日期時間模式：使用 TimePicker -->
              <div v-if="isTimeMode || isDateTimeMode" class="px-[14px] py-3">
                <BaseTimePicker
                  v-model="timeSelected"
                  :is-picker-open="isPickerOpen"
                  :use-cross-day="isTimeMode && useCrossDay"
                  :min-time="minTime"
                  :max-time="maxTime"
                  :minute-interval="minuteInterval"
                  @change="onTimeChange"
                />
                <!-- 確認 btn：使用 TimePicker (選日期時間/選時間模式) 時使用的樣式 -->
                <div class="mt-3 border border-solid border-orange-500 rounded text-orange-500" :class="{ disabled: isConfirmButtonDisabled }" @click="onConfirm">
                  確認
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss">
.contain-layout {
  /**
   * .v-menu__content 自帶 contain: content = layout paint
   * https://developer.mozilla.org/en-US/docs/Web/CSS/contain
   * paint 會使內部的元素無法 render 超出 parent 的範圍（有點類似 overflow: hidden）
   */
  contain: layout;
}
</style>
