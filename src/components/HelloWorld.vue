<script setup lang="ts">
import { ref } from 'vue'
import DateRangePicker from '../components/Picker/DateRangePicker.vue'
import DateTimePicker from '../components/Picker/DateTimePicker.vue'

const time = ref('36:30')
const show = ref(true)
const dateTime = ref(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 15, 30))
const dateRange = ref({
  start: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
  end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1),
})
const date = ref(new Date())
const dateArray = ref([new Date(), new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1)])
</script>

<template>
  <DateRangePicker
    class="mb-4"
    v-model="dateRange"
    :min-date="new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1)"
    :show-has-order-badges="show"
  />
  <DateTimePicker
    key="TimeMode"
    class="mb-4"
    v-model="time"
    type="time"
    use-cross-day
    :min-date="new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1)"
    :right="false"
  />
  <DateTimePicker
    key="1111"
    class="mb-4"
    v-model="dateTime"
    type="datetime"
    :min-date="new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1)"
    :max-date="new Date(new Date().getFullYear(), new Date().getMonth() + 2, new Date().getDate())"
    clearable
    :right="false"
  />
  <DateTimePicker
    key="2222"
    class="mb-4"
    v-model="date"
    type="date"
    :min-date="new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1)"
    :max-date="new Date(new Date().getFullYear(), new Date().getMonth() + 2, new Date().getDate() - 1)"
    clearable
    :right="false"
  />
  <DateTimePicker
    key="3333"
    v-model="dateArray"
    type="multiple-date"
    :max-length="5"
    :min-date="new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1)"
    :max-date="new Date(new Date().getFullYear(), new Date().getMonth() + 2, new Date().getDate() - 1)"
    clearable
    :right="false"
  />
</template>

<style>
</style>
