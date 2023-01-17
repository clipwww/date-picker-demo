import type { ConfigType } from 'dayjs'
import dayjs from 'dayjs'

function formatDate(input: ConfigType) {
  const dayjsInstance = dayjs(input)
  if (!input || !dayjsInstance.isValid())
    return ''

  return dayjsInstance.format('YYYY/MM/DD')
}

function formatDateTime(input: ConfigType) {
  const dayjsInstance = dayjs(input)
  if (!input || !dayjsInstance.isValid())
    return ''

  return dayjsInstance.format('YYYY/MM/DD HH:mm')
}

/**
 * 如果是跨日設定 hour 的欄位會超過 24
 * ex: 隔日 4:30 則拿到的資料會是 28:30
 * @param {string} time HH
 */
function checkCrossDay(time: string) {
  const [hour] = time.split(':')
  return +hour >= 24
}

/**
 * 將跨日的 HH:mm 轉為 validated time
 * 如果是跨日設定 hour 的欄位會超過 24，因此需先減 24
 * ex: 隔日 4:30 則拿到的資料會是 28:30
 */
function adapterValidatedTime(time: string) {
  const [hour, minute] = time.split(':')
  const newHour = `${checkCrossDay(time) ? +hour - 24 : hour}`.padStart(2, '0')
  return `${newHour}:${minute}`
}

export const dateHelpers = {
  formatDate,
  formatDateTime,
  checkCrossDay,
  adapterValidatedTime,
}
