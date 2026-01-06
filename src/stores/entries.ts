import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DailyEntry, DayPerformance } from '../types'
import { useDepositsStore } from './deposits'
import { useConfigStore } from './config'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  addDays,
  parseISO,
  subWeeks,
  subMonths
} from 'date-fns'

const STORAGE_KEY = 'pea-entries'

export const useEntriesStore = defineStore('entries', () => {
  const entries = ref<Map<string, DailyEntry>>(new Map())

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as DailyEntry[]
      entries.value = new Map(parsed.map(e => [e.date, e]))
    }
  }

  function saveToStorage() {
    const data = Array.from(entries.value.values())
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  function addEntry(entry: DailyEntry) {
    entries.value.set(entry.date, entry)
    saveToStorage()
  }

  function getEntry(date: string): DailyEntry | undefined {
    return entries.value.get(date)
  }

  function deleteEntry(date: string) {
    entries.value.delete(date)
    saveToStorage()
  }

  const allEntries = computed(() =>
    Array.from(entries.value.values()).sort((a, b) => a.date.localeCompare(b.date))
  )

  const latestEntry = computed(() => {
    const sorted = allEntries.value
    return sorted.length > 0 ? (sorted[sorted.length - 1] ?? null) : null
  })

  const currentCapital = computed(() => {
    if (latestEntry.value) return latestEntry.value.capital
    const configStore = useConfigStore()
    if (configStore.isConfigured) return configStore.startCapital
    return 0
  })

  // Trouve l'entrée précédente la plus proche
  function getPreviousEntry(date: string): DailyEntry | null {
    const sorted = allEntries.value.filter(e => e.date < date)
    return sorted.length > 0 ? (sorted[sorted.length - 1] ?? null) : null
  }

  // Récupère le capital de référence (entrée précédente ou config initiale)
  function getReferenceCapital(date: string): number {
    const previousEntry = getPreviousEntry(date)
    if (previousEntry) return previousEntry.capital

    // Sinon, utiliser le capital initial si configuré et date >= startDate
    const configStore = useConfigStore()
    if (configStore.isConfigured && date >= configStore.startDate) {
      return configStore.startCapital
    }
    return 0
  }

  // Calcule la performance d'un jour
  function calculateDayPerformance(date: string): DayPerformance | null {
    const entry = entries.value.get(date)
    if (!entry) return null

    const depositsStore = useDepositsStore()
    const configStore = useConfigStore()
    const previousEntry = getPreviousEntry(date)
    const previousCapital = getReferenceCapital(date)

    // Trouver la date de reference (entree precedente ou date de config)
    let refDate: string
    if (previousEntry) {
      refDate = previousEntry.date
    } else if (configStore.isConfigured) {
      refDate = configStore.startDate
    } else {
      refDate = date
    }

    // Prendre tous les versements entre la date de ref (exclue) et la date actuelle (incluse)
    // On utilise le jour apres la ref comme debut pour exclure les versements du jour de ref
    const dayAfterRef = format(addDays(parseISO(refDate), 1), 'yyyy-MM-dd')
    const depositsSinceRef = depositsStore.getDepositsInRange(dayAfterRef, date)

    // Base de calcul = capital veille + versements depuis
    const baseCapital = previousCapital + depositsSinceRef

    // Gain = capital actuel - base
    const gainAmount = entry.capital - baseCapital

    // Performance % = gain / base (si base > 0)
    const gainPercent = baseCapital > 0 ? (gainAmount / baseCapital) * 100 : 0

    return {
      date,
      capital: entry.capital,
      previousCapital,
      depositsOfDay: depositsSinceRef,
      gainAmount,
      gainPercent
    }
  }

  // Récupère les performances dans une plage de dates
  function getPerformancesInRange(start: Date, end: Date): DayPerformance[] {
    const startStr = format(start, 'yyyy-MM-dd')
    const endStr = format(end, 'yyyy-MM-dd')

    return allEntries.value
      .filter(entry => entry.date >= startStr && entry.date <= endStr)
      .map(entry => calculateDayPerformance(entry.date))
      .filter((p): p is DayPerformance => p !== null)
  }

  // Calcule le gain entre premier et dernier point d'une période
  // Prend en compte les versements effectués pendant la période
  function calculatePeriodGain(start: Date, end: Date): number {
    const startStr = format(start, 'yyyy-MM-dd')
    const endStr = format(end, 'yyyy-MM-dd')

    // Trouver le premier et dernier point dans la période
    const entriesInPeriod = allEntries.value.filter(
      e => e.date >= startStr && e.date <= endStr
    )

    if (entriesInPeriod.length === 0) return 0

    const firstEntry = entriesInPeriod[0]!
    const lastEntry = entriesInPeriod[entriesInPeriod.length - 1]!

    // Capital de référence avant le premier point
    const refCapital = getReferenceCapital(firstEntry.date)

    // Versements pendant la période (entre ref et dernier point)
    const depositsStore = useDepositsStore()
    const depositsInPeriod = depositsStore.getDepositsInRange(startStr, lastEntry.date)

    // Gain = capital final - capital initial de ref - versements
    return lastEntry.capital - refCapital - depositsInPeriod
  }

  const todayPerformance = computed(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return calculateDayPerformance(today)
  })

  const todayGain = computed(() => todayPerformance.value?.gainAmount ?? 0)

  const weekGain = computed(() => {
    const now = new Date()
    return calculatePeriodGain(
      startOfWeek(now, { weekStartsOn: 1 }),
      endOfWeek(now, { weekStartsOn: 1 })
    )
  })

  const lastWeekGain = computed(() => {
    const lastWeek = subWeeks(new Date(), 1)
    return calculatePeriodGain(
      startOfWeek(lastWeek, { weekStartsOn: 1 }),
      endOfWeek(lastWeek, { weekStartsOn: 1 })
    )
  })

  const monthGain = computed(() => {
    const now = new Date()
    return calculatePeriodGain(startOfMonth(now), endOfMonth(now))
  })

  const lastMonthGain = computed(() => {
    const lastMonth = subMonths(new Date(), 1)
    return calculatePeriodGain(startOfMonth(lastMonth), endOfMonth(lastMonth))
  })

  const yearGain = computed(() => {
    const now = new Date()
    return calculatePeriodGain(startOfYear(now), endOfYear(now))
  })

  const totalGain = computed(() => {
    const configStore = useConfigStore()
    const depositsStore = useDepositsStore()

    if (!configStore.isConfigured && allEntries.value.length === 0) return 0

    // Total versé = versements initiaux + versements enregistrés
    const totalDeposited = configStore.startDeposited + depositsStore.totalDeposited

    return currentCapital.value - totalDeposited
  })

  const stats = computed(() => {
    const performances = allEntries.value
      .map(e => calculateDayPerformance(e.date))
      .filter((p): p is DayPerformance => p !== null)

    if (performances.length === 0) {
      return {
        bestDay: null as DayPerformance | null,
        worstDay: null as DayPerformance | null,
        positiveDays: 0,
        negativeDays: 0,
        averagePerformance: 0
      }
    }

    let bestDay = performances[0]!
    let worstDay = performances[0]!
    let positiveDays = 0
    let negativeDays = 0
    let totalPerf = 0

    for (const perf of performances) {
      if (perf.gainPercent > bestDay.gainPercent) bestDay = perf
      if (perf.gainPercent < worstDay.gainPercent) worstDay = perf
      if (perf.gainPercent > 0) positiveDays++
      if (perf.gainPercent < 0) negativeDays++
      totalPerf += perf.gainPercent
    }

    return {
      bestDay,
      worstDay,
      positiveDays,
      negativeDays,
      averagePerformance: totalPerf / performances.length
    }
  })

  // Initialize
  loadFromStorage()

  return {
    entries,
    allEntries,
    latestEntry,
    currentCapital,
    todayPerformance,
    todayGain,
    weekGain,
    lastWeekGain,
    monthGain,
    lastMonthGain,
    yearGain,
    totalGain,
    stats,
    addEntry,
    getEntry,
    deleteEntry,
    getPreviousEntry,
    calculateDayPerformance,
    getPerformancesInRange
  }
})
