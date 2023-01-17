<script lang="ts">
import type { PropType } from 'vue'
import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useDebounceFn, watchDebounced } from '@vueuse/core'

enum PickerType {
  Day = 'day',
  Hour = 'hour',
  Minute = 'minute',
}

export default defineComponent({
  props: {
    modelValue: { type: String as PropType<string | null> },
    isPickerOpen: { type: Boolean, default: false },
    useCrossDay: { type: Boolean, default: false },
    minTime: { type: String as PropType<string | null>, default: null },
    maxTime: { type: String as PropType<string | null>, default: null },
    minuteInterval: { type: Number, default: 15 },
  },
  setup(props, ctx) {
    const isStopObserver = ref(true)
    const observers = ref<IntersectionObserver[]>([])

    const timePickerRef = ref<HTMLElement | null>(null)
    const columnRefs = ref<HTMLElement[] | null>(null)

    const minuteInterval = computed(() => props.minuteInterval || 15)

    /** 跨日 */
    const crossDay = computed({
      get() {
        if (!props.modelValue)
          return false

        return +props.modelValue.split(':')[0] >= 24
      },
      set(value) {
        emitValue(value, hour.value, minute.value)
      },
    })

    /** 時 */
    const hour = computed({
      get() {
        if (!props.modelValue)
          return null

        return +props.modelValue.split(':')[0] % 24
      },
      set(value) {
        emitValue(crossDay.value, value, minute.value)
      },
    })

    /** 分 */
    const minute = computed({
      get() {
        if (!props.modelValue)
          return null

        return +props.modelValue.split(':')[1] || 0
      },
      set(value) {
        emitValue(crossDay.value, hour.value, value)
      },
    })

    /** 最小「時」: 若選了翌日，則不限制最小 */
    const minHour = computed(() => (crossDay.value || !props.minTime ? 0 : +props.minTime.split(':')[0]))
    /** 最小「分」: 若選了翌日，則不限制最小 */
    const minMinute = computed(() => (crossDay.value || !props.minTime ? 0 : +props.minTime.split(':')[1]))
    /** 最大「時」: 若有啟用跨日設定，但不是選翌日，則不限制最大 */
    const maxHour = computed(() => {
      if (props.useCrossDay && !crossDay.value)
        return 23

      return !props.maxTime ? 23 : +props.maxTime.split(':')[0]
    })
    /** 最大「分」: 若有啟用跨日設定，但不是選翌日，則不限制最大 */
    const maxMinute = computed(() => {
      if (props.useCrossDay && !crossDay.value)
        return 60 - minuteInterval.value

      return !props.maxTime ? 60 - minuteInterval.value : +props.maxTime?.split(':')[1]
    })

    /** 選項：當日、翌日 */
    const days = computed(() => {
      return props.useCrossDay
        ? [
            { value: 0, text: '當日', isDisabled: false, isActive: !crossDay.value },
            { value: 1, text: '翌日', isDisabled: false, isActive: crossDay.value },
          ]
        : []
    })

    /** 選項：時 */
    const hours = computed(() => {
      return Array(24)
        .fill('')
        .map((_, idx) => {
          const bellowMin = idx < minHour.value
          const aboveMax = idx > maxHour.value

          return {
            value: idx,
            text: `${idx}`.padStart(2, '0'),
            isDisabled: bellowMin || aboveMax,
            isActive: idx === hour.value,
          }
        })
    })

    /** 選項：分 */
    const minutes = computed(() => {
      const interval = minuteInterval.value
      const len = Math.floor(60 / interval)

      return Array(len)
        .fill('')
        .map((_, idx) => {
          const number = idx * interval
          const bellowMin = checkBellowMin(number)
          const aboveMax = checkAboveMin(number)

          return {
            value: number,
            text: `${number}`.padStart(2, '0'),
            isDisabled: bellowMin || aboveMax,
            isActive: number === minute.value,
          }
        })
    })

    /** 日,時,分 按鈕組 */
    const columns = computed(() => {
      return (days.value.length ? [{ type: PickerType.Day, items: days.value }] : []).concat([
        { type: PickerType.Hour, items: hours.value },
        { type: PickerType.Minute, items: minutes.value },
      ])
    })

    watchDebounced(
      () => props.isPickerOpen,
      (boolVal) => {
        if (boolVal) {
          initPosition()
        }
        else {
          /**
           * 當 Picker 關閉時 set isStopObserver = true
           * 避免下次點開 Picker 時因為 initPosition 初始化 scroll 位置時觸發 observer
           */
          isStopObserver.value = true
        }
      },
      { immediate: true, debounce: 100 },
    )
    watchDebounced(
      [maxHour, maxMinute, minHour, minMinute, () => props.modelValue],
      () => {
        checkValue()
        initPosition()
      },
      { immediate: true, debounce: 100 },
    )

    onMounted(() => {
      observers.value
        = columnRefs.value?.map((columnEl) => {
          const type = columnEl.getAttribute('data-type') as PickerType
          const observer = new IntersectionObserver(
            (entries) => {
              if (isStopObserver.value)
                return

              entries
                .filter(entry => entry.isIntersecting)
                .forEach((entry) => {
                  const disabled = entry.target.getAttribute('disabled') === 'disabled'
                  if (disabled && type) {
                    initPositionDebounce()
                    return
                  }

                  const value = entry.target.getAttribute('data-value')
                  if (type && value) {
                    setValue(type, +value)
                    initPositionDebounce()
                  }
                })
            },
            { threshold: 0.7, root: columnEl, rootMargin: '-140px 0px' },
          )

          columnEl.querySelectorAll('div').forEach((buttonEl) => {
            observer.observe(buttonEl)
          })

          return observer
        }) ?? []
    })
    onUnmounted(() => {
      observers.value.forEach(observer => observer.disconnect())
    })

    /** 判斷當前 hour = 最小 hour 時，是否小於最小 minute */
    function checkBellowMin(minute: number) {
      return hour.value === minHour.value && minute < minMinute.value
    }
    /** 判斷當前 hour = 最大 hour 時，是否大於最大 minute */
    function checkAboveMin(minute: number) {
      return hour.value === maxHour.value && minute > maxMinute.value
    }

    /** 檢查時,分的值是否在限制範圍內 */
    function checkValue() {
      if (hour.value !== null) {
        if (hour.value < minHour.value)
          hour.value = minHour.value

        if (hour.value > maxHour.value)
          hour.value = maxHour.value
      }

      if (minute.value !== null) {
        const bellowMin = checkBellowMin(minute.value)
        const aboveMax = checkAboveMin(minute.value)

        if (bellowMin)
          minute.value = minMinute.value

        if (aboveMax)
          minute.value = maxMinute.value
      }
    }

    /** emit input & change event */
    function emitValue(crossDay: boolean | null, hour: number | null, minute: number | null) {
      const hourText = `${(crossDay ? 24 : 0) + (hour || 0)}`.padStart(2, '0')
      const minuteText = `${minute || 0}`.padStart(2, '0')

      const value = `${hourText}:${minuteText}`
      ctx.emit('update:modelValue', value)
      ctx.emit('change', value)
    }

    /** 選擇 day, hour, minute 值 */
    function setValue(type: PickerType, value: number) {
      switch (type) {
        case PickerType.Day:
          crossDay.value = !!value
          break
        case PickerType.Hour:
          hour.value = value
          break
        case PickerType.Minute:
          minute.value = value
          break
      }
    }

    /** 點擊 日,時,分 按鈕 */
    function onButtonClick(type: PickerType, value: number) {
      setValue(type, value)
      scrollToCenter(type)
    }

    /** 置中歸位 日,時,分 的按鈕 */
    const initPositionDebounce = useDebounceFn(initPosition, 100)
    async function initPosition() {
      scrollToCenter(PickerType.Day)
      scrollToCenter(PickerType.Hour)
      scrollToCenter(PickerType.Minute)
    }

    /** 將按鈕置中歸位 */
    async function scrollToCenter(type: PickerType) {
      if (!props.isPickerOpen)
        return

      await nextTick()

      let index = 0
      switch (type) {
        case PickerType.Day:
          index = days.value.findIndex(item => item.isActive)
          break
        case PickerType.Hour:
          index = hours.value.findIndex(item => item.isActive)
          if (index < 0)
            index = hours.value.findIndex(item => !item.isDisabled)

          break
        case PickerType.Minute:
          index = minutes.value.findIndex(item => item.isActive)
          if (index < 0)
            index = minutes.value.findIndex(item => !item.isDisabled)

          break
      }

      const scrollEl = timePickerRef.value?.querySelector(`.js-time-picker-scroll-${type}`)
      scrollEl?.scrollTo({ top: 40 * index })
    }

    return {
      timePickerRef,
      columnRefs,
      columns,
      isStopObserver,

      setValue,
      onButtonClick,
    }
  },
})
</script>

<template>
  <div ref="timePickerRef" class="inline-flex justify-center bg-white select-none -mx-1 h-80">
    <div v-for="column in columns" ref="columnRefs" :key="column.type" :data-type="column.type">
      <div
        class="time-picker-scroll"
        :class="`js-time-picker-scroll-${column.type}`"
        @wheel="isStopObserver = false"
        @mouseleave="isStopObserver = true"
        @touchmove="isStopObserver = false"
      >
        <div
          v-for="item in column.items"
          :key="item.value"
          class="h-8 rounded text-normal text-center py-[5px] px-1 my-1 snap-center"
          :class="{
            'min-w-[54px]': useCrossDay,
            'min-w-16': !useCrossDay,
            'bg-orange-500 text-white': item.isActive,
            'hover:(text-white bg-orange-500 opacity-60)': !item.isActive,
            'cursor-pointer': !item.isDisabled,
            'pointer-events-none opacity-50': item.isDisabled,
          }"
          :data-value="item.value"
          :disabled="item.isDisabled"
          text
          @click="onButtonClick(column.type, item.value)"
        >
          {{ item.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.time-picker-scroll {
  @apply flex flex-1 flex-col;
  @apply overflow-y-auto overflow overscroll-contain scroll
  @apply h-full;
  @apply px-1 py-140px;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
