<script lang="ts">
import type { PropType } from 'vue'
import { computed, defineComponent, ref } from 'vue'
import type { ConfigType } from 'dayjs'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

dayjs.extend(isBetween)

export default defineComponent({
  props: {
    showDate: { type: [String, Number, Object, Date] as PropType<ConfigType>, default: () => new Date() },
    dateStart: { type: [String, Number, Object, Date] as PropType<ConfigType> },
    dateEnd: { type: [String, Number, Object, Date] as PropType<ConfigType> },
    dateSelected: { type: [String, Number, Object, Date, Array] as PropType<ConfigType | ConfigType[]> },
    minDate: { type: [String, Number, Object, Date] as PropType<ConfigType> },
    maxDate: { type: [String, Number, Object, Date] as PropType<ConfigType> },
    disabledDates: { type: Function as PropType<(date: Date) => boolean> },
  },
  emits: ['dayClick', 'dayHover'],
  setup(props, ctx) {
    const currentDate = ref(dayjs())

    const weekdays = computed(() => [
      '日',
      '一',
      '二',
      '三',
      '四',
      '五',
      '六',
    ])
    const showMonth = computed(() => dayjs(props.showDate).startOf('month'))
    const year = computed(() => showMonth.value.year())
    const month = computed(() => showMonth.value.month())
    const days = computed(() => {
      const daysInMonth = dayjs(showMonth.value).daysInMonth()
      const firstDayWeekday = dayjs(showMonth.value).startOf('month').day()

      return [
        ...Array(firstDayWeekday).fill(''),
        ...Array(daysInMonth)
          .fill('')
          .map((_, i) => i + 1),
      ].map((dayNumber) => {
        const thisDay = dayjs(new Date(year.value, month.value, dayNumber))

        const isSelected
          = !!dayNumber
          && (Array.isArray(props.dateSelected)
            ? props.dateSelected.some(selected => thisDay.isSame(selected, 'day'))
            : !!props.dateSelected && thisDay.isSame(props.dateSelected, 'day'))
        const isToday = !!dayNumber && thisDay.isSame(currentDate.value, 'day')
        const isPast = !!dayNumber && thisDay.isBefore(currentDate.value, 'day')
        const isFuture = !!dayNumber && thisDay.isAfter(currentDate.value, 'day')
        const isSaturday = !!dayNumber && thisDay.day() === 6
        const isSunday = !!dayNumber && thisDay.day() === 0
        const isWeekend = !!dayNumber && (isSaturday || isSunday)
        const isInRange = !!dayNumber && !!props.dateStart && !!props.dateEnd && thisDay.isBetween(props.dateStart, props.dateEnd, 'day', '[]')
        const isStart = !!dayNumber && !!props.dateStart && thisDay.isSame(props.dateStart, 'day')
        const isEnd = !!dayNumber && !!props.dateEnd && thisDay.isSame(props.dateEnd, 'day')
        const isLastDayOfMonth = dayNumber === daysInMonth
        const isFirstDayOfMonth = dayNumber === 1
        const isDisabled
          = !dayNumber
          || (!!props.minDate && thisDay.isBefore(props.minDate, 'day'))
          || (!!props.maxDate && thisDay.isAfter(props.maxDate, 'day'))
          || (props.disabledDates ? props.disabledDates(thisDay.toDate()) : false)
        const formattedDate = dayNumber ? thisDay.format('YYYY-MM-DD') : null

        /**
         * 隱藏外層方匡背景色（只需要內層 date 圈圈的背景色
         * - 不在範圍內
         * - 開始日與結束日相同
         * - 開始日是週六
         * - 開始日是該月最後一天
         * - 結束日是週日
         * - 結束日是該月第一天
         * - 該月第一天日週六
         * - 該月最後一天是週日
         */
        const hideSquareBg
          = !isInRange
          || (isStart && isEnd)
          || (isStart && isSaturday)
          || (isStart && isLastDayOfMonth)
          || (isEnd && isSunday)
          || (isEnd && isFirstDayOfMonth)
          || (isSunday && isLastDayOfMonth)
          || (isSaturday && isFirstDayOfMonth)
        /** 顯示外層方匡背景色右半邊 = 有背景色 & 週日 或 開始日 或 該月第一天 */
        const showSquareHalfRightBg = !hideSquareBg && (isSunday || isStart || isFirstDayOfMonth)
        /** 顯示外層方匡背景色僅左半邊 = 有背景色 & 週六 或 結束 或 該月最後一天 */
        const showSquareHalfLeftBg = !hideSquareBg && (isSaturday || isEnd || isLastDayOfMonth)
        /** 顯示完整的方匡背景色 */
        const showSquareFullBg = !hideSquareBg && !showSquareHalfRightBg && !showSquareHalfLeftBg

        /** 顯示「選取的日」或「開始日」或「結束日」的樣式 */
        const showActiveClass = isSelected || isStart || isEnd
        /** 顯示「當日」的樣式 */
        const showTodayClass = isToday && !showActiveClass
        /** 顯示「在範圍內」的樣式（不是開始也不是結束） */
        const showInRangeClass = isInRange && !showActiveClass
        /** 顯示「hover」樣式 = 沒有被 disabled 且也不是（被選取日、開始、結束、範圍內） */
        const showHoverClass = !isDisabled && !showActiveClass && !showInRangeClass

        return {
          date: thisDay.toDate(),
          number: dayNumber,
          isSelected,
          isToday,
          isPast,
          isFuture,
          isSaturday,
          isSunday,
          isWeekend,
          isInRange,
          isStart,
          isEnd,
          isFirstDayOfMonth,
          isLastDayOfMonth,
          isDisabled,
          formattedDate,
          hideSquareBg,
          showSquareHalfRightBg,
          showSquareHalfLeftBg,
          showSquareFullBg,
          showActiveClass,
          showTodayClass,
          showInRangeClass,
          showHoverClass,
        }
      })
    })

    function onDayClick(date: Date) {
      ctx.emit('dayClick', date)
    }

    function onDayHover(date: Date) {
      ctx.emit('dayHover', date)
    }

    return {
      weekdays,
      days,

      onDayClick,
      onDayHover,
    }
  },
})
</script>

<template>
  <div class="min-w-[252px] bg-white select-none">
    <div key="header">
      <slot name="header" />
    </div>
    <div key="body">
      <div class="grid grid-cols-7">
        <div v-for="weekday in weekdays" :key="weekday" class="text-center text-xs text-black mb-2">
          {{ weekday }}
        </div>
        <div
          v-for="(day, index) in days"
          :key="index"
          class="flex items-center justify-center my-1 px-0.5"
          :class="{
            'cursor-pointer': day.date,
            'pointer-events-none': day.isDisabled,
            'bg-orange-100': day.showSquareFullBg,
            'half-right-bg': day.showSquareHalfRightBg,
            'half-left-bg': day.showSquareHalfLeftBg,
            /**
             * bg-none = background-image: none;
             * bg-transparent = background-color: transparent;
             */
            '!bg-none !bg-transparent': day.hideSquareBg,
          }"
          :data-date="day.formattedDate"
          @click="onDayClick(day.date)"
          @mouseover="onDayHover(day.date)"
        >
          <div
            class="w-8 h-8 flex items-center justify-center rounded-full relative"
            :class="{
              'text-white bg-orange-500': day.showActiveClass,
              'text-orange-500': day.showTodayClass,
              'bg-orange-100': day.showInRangeClass,
              'hover:bg-gray-300': day.showHoverClass,
              '!text-gray-200': day.isDisabled,
            }"
          >
            <slot name="date" v-bind="day">
              {{ day.number }}
            </slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.half-right-bg {
  background: linear-gradient(to right, transparent 50%, rgba(255, 237, 213) 50%);
}
.half-left-bg {
  background: linear-gradient(to left, transparent 50%, rgba(255, 237, 213) 50%);
}
</style>
