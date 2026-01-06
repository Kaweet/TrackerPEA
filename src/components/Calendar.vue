<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getISOWeek,
  getDay
} from 'date-fns'
import { fr } from 'date-fns/locale'
import DayCell from './DayCell.vue'
import { useEntriesStore } from '../stores/entries'
import { useDepositsStore } from '../stores/deposits'

const emit = defineEmits<{
  selectDate: [date: string]
}>()

const entriesStore = useEntriesStore()
const depositsStore = useDepositsStore()
const currentMonth = ref(new Date())
const selectedDate = ref<string | null>(null)

const monthLabel = computed(() => format(currentMonth.value, 'MMMM yyyy', { locale: fr }))

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']

// Structure: tableau de semaines, chaque semaine contient le numero et les 5 jours ouvrés
interface WeekRow {
  weekNumber: number
  weekStart: Date
  days: { date: Date; day: number | null }[]
}

const calendarWeeks = computed((): WeekRow[] => {
  const start = startOfWeek(startOfMonth(currentMonth.value), { weekStartsOn: 1 })
  const end = endOfMonth(currentMonth.value)
  const weeks: WeekRow[] = []

  let current = start
  while (current <= end || weeks.length === 0) {
    const weekNumber = getISOWeek(current)
    const weekStart = startOfWeek(current, { weekStartsOn: 1 })
    const days: { date: Date; day: number | null }[] = []

    // Parcourir les 7 jours de la semaine mais ne garder que lun-ven
    for (let i = 0; i < 7; i++) {
      const dayOfWeek = getDay(current) // 0=dim, 1=lun, ..., 6=sam
      // Ne garder que lun(1) a ven(5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        if (isSameMonth(current, currentMonth.value)) {
          days.push({ date: current, day: current.getDate() })
        } else {
          days.push({ date: current, day: null })
        }
      }
      current = addDays(current, 1)
    }

    weeks.push({ weekNumber, weekStart, days })

    // Arreter si on a depasse la fin du mois
    if (current > end && weeks.length > 0) break
    if (weeks.length >= 6) break
  }

  return weeks
})

// Calcule le gain d'une semaine
function getWeekGain(weekStart: Date): number {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const startStr = format(weekStart, 'yyyy-MM-dd')
  const endStr = format(weekEnd, 'yyyy-MM-dd')

  const entriesInWeek = entriesStore.allEntries.filter(
    (e) => e.date >= startStr && e.date <= endStr
  )

  if (entriesInWeek.length === 0) return 0

  const firstEntry = entriesInWeek[0]!
  const lastEntry = entriesInWeek[entriesInWeek.length - 1]!

  const refCapital = entriesStore.getPreviousEntry(firstEntry.date)?.capital ?? 0
  const depositsInWeek = depositsStore.deposits
    .filter((d) => d.date >= startStr && d.date <= lastEntry.date)
    .reduce((sum, d) => sum + d.amount, 0)

  return lastEntry.capital - (refCapital || firstEntry.capital) - depositsInWeek
}

// Calcule le gain du mois affiche
const monthGain = computed(() => {
  const monthStart = startOfMonth(currentMonth.value)
  const monthEnd = endOfMonth(currentMonth.value)
  const startStr = format(monthStart, 'yyyy-MM-dd')
  const endStr = format(monthEnd, 'yyyy-MM-dd')

  const entriesInMonth = entriesStore.allEntries.filter(
    (e) => e.date >= startStr && e.date <= endStr
  )

  if (entriesInMonth.length === 0) return 0

  const firstEntry = entriesInMonth[0]!
  const lastEntry = entriesInMonth[entriesInMonth.length - 1]!

  const refCapital = entriesStore.getPreviousEntry(firstEntry.date)?.capital ?? 0
  const depositsInMonth = depositsStore.deposits
    .filter((d) => d.date >= startStr && d.date <= lastEntry.date)
    .reduce((sum, d) => sum + d.amount, 0)

  return lastEntry.capital - (refCapital || firstEntry.capital) - depositsInMonth
})

function formatGain(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(0)}€`
}

function prevMonth() {
  currentMonth.value = subMonths(currentMonth.value, 1)
}

function nextMonth() {
  currentMonth.value = addMonths(currentMonth.value, 1)
}

function goToToday() {
  currentMonth.value = new Date()
}

function selectDay(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd')
  selectedDate.value = dateStr
  emit('selectDate', dateStr)
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

function isSelected(date: Date): boolean {
  return selectedDate.value === format(date, 'yyyy-MM-dd')
}

function getDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}
</script>

<template>
  <div class="bg-gray-800 rounded-xl p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <button class="p-2 rounded-lg hover:bg-gray-700 text-gray-400" @click="prevMonth">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <div class="flex flex-col items-center">
        <button
          class="text-lg font-semibold text-white capitalize hover:text-blue-400 transition-colors"
          @click="goToToday"
        >
          {{ monthLabel }}
        </button>
        <span
          v-if="monthGain !== 0"
          class="text-xs font-medium"
          :class="monthGain >= 0 ? 'text-green-400' : 'text-red-400'"
        >
          {{ formatGain(monthGain) }}
        </span>
      </div>

      <button class="p-2 rounded-lg hover:bg-gray-700 text-gray-400" @click="nextMonth">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Week days header -->
    <div class="grid grid-cols-[auto_repeat(5,1fr)] gap-1 mb-2">
      <div class="text-center text-xs text-gray-500 font-medium py-1 w-12">S.</div>
      <div
        v-for="day in weekDays"
        :key="day"
        class="text-center text-xs text-gray-500 font-medium py-1"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar grid par semaine -->
    <div class="space-y-1">
      <div
        v-for="week in calendarWeeks"
        :key="week.weekNumber"
        class="grid grid-cols-[auto_repeat(5,1fr)] gap-1"
      >
        <!-- Numero de semaine + gain -->
        <div class="w-12 flex flex-col items-center justify-center">
          <span class="text-xs text-gray-600 font-medium">{{ week.weekNumber }}</span>
          <span
            v-if="getWeekGain(week.weekStart) !== 0"
            class="text-[9px] font-medium"
            :class="getWeekGain(week.weekStart) >= 0 ? 'text-green-400' : 'text-red-400'"
          >
            {{ formatGain(getWeekGain(week.weekStart)) }}
          </span>
        </div>
        <!-- Jours de la semaine -->
        <DayCell
          v-for="(item, index) in week.days"
          :key="index"
          :day="item.day"
          :has-entry="item.day ? !!entriesStore.getEntry(getDateStr(item.date)) : false"
          :performance="item.day ? entriesStore.calculateDayPerformance(getDateStr(item.date)) : null"
          :is-today="item.day ? isToday(item.date) : false"
          :is-selected="item.day ? isSelected(item.date) : false"
          :is-d-c-a-day="item.day ? depositsStore.isDCADate(getDateStr(item.date)) : false"
          @select="selectDay(item.date)"
        />
      </div>
    </div>
  </div>
</template>
