import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Deposit, DCAConfig } from '../types'
import {
  format,
  parseISO,
  getDay,
  subDays,
  addDays,
  startOfMonth,
  endOfMonth,
  setDate,
  isWeekend
} from 'date-fns'

const STORAGE_KEY = 'pea-deposits'
const DCA_CONFIG_KEY = 'pea-dca-config'
const PEA_CEILING = 150000

export const useDepositsStore = defineStore('deposits', () => {
  const deposits = ref<Deposit[]>([])
  const dcaConfig = ref<DCAConfig>({
    enabled: false,
    amount: 500,
    dayOfMonth1: 1,
    dayOfMonth2: 15,
    adjustWeekend: 'after'
  })

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      deposits.value = JSON.parse(stored)
    }
    const storedDCA = localStorage.getItem(DCA_CONFIG_KEY)
    if (storedDCA) {
      dcaConfig.value = JSON.parse(storedDCA)
    }
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deposits.value))
  }

  function saveDCAConfig() {
    localStorage.setItem(DCA_CONFIG_KEY, JSON.stringify(dcaConfig.value))
  }

  function updateDCAConfig(config: Partial<DCAConfig>) {
    dcaConfig.value = { ...dcaConfig.value, ...config }
    saveDCAConfig()
  }

  // Ajuste une date si elle tombe un weekend
  function adjustForWeekend(date: Date, mode: 'before' | 'after' | 'none'): Date {
    if (mode === 'none' || !isWeekend(date)) return date

    const dayOfWeek = getDay(date)
    if (mode === 'before') {
      // Vendredi précédent
      return dayOfWeek === 0 ? subDays(date, 2) : subDays(date, 1)
    } else {
      // Lundi suivant
      return dayOfWeek === 0 ? addDays(date, 1) : addDays(date, 2)
    }
  }

  // Génère les dates DCA pour un mois donné
  function getDCADatesForMonth(year: number, month: number): string[] {
    if (!dcaConfig.value.enabled) return []

    const dates: string[] = []
    const monthStart = startOfMonth(new Date(year, month))
    const monthEnd = endOfMonth(monthStart)

    // Premier jour DCA
    let date1 = setDate(monthStart, Math.min(dcaConfig.value.dayOfMonth1, monthEnd.getDate()))
    date1 = adjustForWeekend(date1, dcaConfig.value.adjustWeekend)
    dates.push(format(date1, 'yyyy-MM-dd'))

    // Deuxième jour DCA (optionnel)
    if (dcaConfig.value.dayOfMonth2) {
      let date2 = setDate(monthStart, Math.min(dcaConfig.value.dayOfMonth2, monthEnd.getDate()))
      date2 = adjustForWeekend(date2, dcaConfig.value.adjustWeekend)
      dates.push(format(date2, 'yyyy-MM-dd'))
    }

    return dates
  }

  // Vérifie si une date est une date DCA
  function isDCADate(dateStr: string): boolean {
    const date = parseISO(dateStr)
    const dcaDates = getDCADatesForMonth(date.getFullYear(), date.getMonth())
    return dcaDates.includes(dateStr)
  }

  // Récupère le montant DCA prévu pour une date
  function getDCAAmountForDate(dateStr: string): number {
    if (!dcaConfig.value.enabled) return 0
    return isDCADate(dateStr) ? dcaConfig.value.amount : 0
  }

  function addDeposit(deposit: Omit<Deposit, 'id'>) {
    const newDeposit: Deposit = {
      ...deposit,
      id: crypto.randomUUID()
    }
    deposits.value.push(newDeposit)
    deposits.value.sort((a, b) => a.date.localeCompare(b.date))
    saveToStorage()
  }

  function deleteDeposit(id: string) {
    const index = deposits.value.findIndex(d => d.id === id)
    if (index !== -1) {
      deposits.value.splice(index, 1)
      saveToStorage()
    }
  }

  // Récupère tous les versements pour une date (manuels + DCA prévus)
  function getDepositsForDate(dateStr: string): number {
    const manualDeposits = deposits.value
      .filter(d => d.date === dateStr)
      .reduce((sum, d) => sum + d.amount, 0)

    return manualDeposits
  }

  // Récupère les versements dans une plage de dates
  function getDepositsInRange(startDate: string, endDate: string): number {
    return deposits.value
      .filter(d => d.date >= startDate && d.date <= endDate)
      .reduce((sum, d) => sum + d.amount, 0)
  }

  const totalDeposited = computed(() => deposits.value.reduce((sum, d) => sum + d.amount, 0))

  const remainingToCeiling = computed(() => Math.max(0, PEA_CEILING - totalDeposited.value))

  const ceilingPercentage = computed(() =>
    Math.min(100, (totalDeposited.value / PEA_CEILING) * 100)
  )

  const sortedDeposits = computed(() =>
    [...deposits.value].sort((a, b) => b.date.localeCompare(a.date))
  )

  // Initialize
  loadFromStorage()

  return {
    deposits,
    dcaConfig,
    sortedDeposits,
    totalDeposited,
    remainingToCeiling,
    ceilingPercentage,
    PEA_CEILING,
    addDeposit,
    deleteDeposit,
    updateDCAConfig,
    getDepositsForDate,
    getDepositsInRange,
    getDCADatesForMonth,
    getDCAAmountForDate,
    isDCADate
  }
})
