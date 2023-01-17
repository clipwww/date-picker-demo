import type { Ref } from 'vue'
import { computed, ref } from 'vue'
import { syncRefs, useNow } from '@vueuse/core'
import type { ConfigType } from 'dayjs'
import dayjs from 'dayjs'

/**
 * 單一日期 Panel，用於 DateTimePicker / DatePicker
 */
export function useSingleDatePanel(options: {
  defaultDate?: ConfigType
  maxDate?: Ref<ConfigType>
  minDate?: Ref<ConfigType>
}) {
  const { defaultDate = new Date(), maxDate, minDate } = options

  const { isTodayDisabled } = useToday({ maxDate, minDate })

  const showDate = ref(dayjs(defaultDate))

  /**
   * ! year 可能為不同曆法（ex 佛曆）格式，務必注意不要用來處理傳給 API 的資料
   */
  const datePanel = computed(() => {
    const year = showDate.value.year()
    const month = showDate.value.month() + 1
    return {
      date: showDate.value,
      year,
      month,
      day: showDate.value.day(),
      label: `${year} 年 ${month} 月`,
    }
  })
  const isNextDisabled = computed(() => maxDate?.value && dayjs(showDate.value).add(1, 'month').isAfter(maxDate.value, 'month'))
  const isPrevDisabled = computed(() => minDate?.value && dayjs(showDate.value).add(-1, 'month').isBefore(minDate.value, 'month'))

  function prevMonth() {
    if (isPrevDisabled.value)
      return

    showDate.value = dayjs(showDate.value).add(-1, 'month')
  }

  function nextMonth() {
    if (isNextDisabled.value)
      return

    showDate.value = dayjs(showDate.value).add(1, 'month')
  }

  return {
    showDate,
    datePanel,
    isNextDisabled,
    isPrevDisabled,
    isTodayDisabled,

    prevMonth,
    nextMonth,
  }
}

/**
 * 雙日期 Panel，用於 DateRangePicker
 */
export function useDoubleDatePanel(options: { maxDate?: Ref<ConfigType>; minDate?: Ref<ConfigType> }) {
  const { showDate: leftDate, datePanel: leftDatePanel, isPrevDisabled, prevMonth } = useSingleDatePanel(options)
  const { showDate: rightDate, datePanel: rightDatePanel, isNextDisabled } = useSingleDatePanel(options)

  syncRefs(() => dayjs(leftDate.value).add(1, 'month').startOf('month'), rightDate, {
    immediate: true,
  })

  const datePanels = computed(() => [
    {
      ...leftDatePanel.value,
      isLeft: true,
      isRight: false,
    },
    {
      ...rightDatePanel.value,
      isLeft: false,
      isRight: true,
    },
  ])

  function nextMonth() {
    if (isNextDisabled.value)
      return

    leftDate.value = dayjs(leftDate.value).add(1, 'month')
  }

  return {
    leftDate,
    rightDate,
    leftDatePanel,
    rightDatePanel,
    datePanels,
    isNextDisabled,
    isPrevDisabled,

    prevMonth,
    nextMonth,
  }
}

/**
 * 今日相關
 */
export function useToday(options: { maxDate?: Ref<ConfigType>; minDate?: Ref<ConfigType> }) {
  const { maxDate, minDate } = options

  /** 每 1 小時更新一次當下時間 */
  const today = useNow({ interval: 1000 * 60 * 60 })
  const todayMoment = computed(() => dayjs(today.value))

  /** 今日 < minDate | 今日 > maxDate | 若店休日不可選時今日為店休日 */
  const isTodayDisabled = computed(
    () =>
      (minDate?.value && todayMoment.value.isBefore(minDate.value, 'day'))
      || (maxDate?.value && todayMoment.value.isAfter(maxDate.value, 'day')),
  )

  return {
    today,
    isTodayDisabled,
  }
}
