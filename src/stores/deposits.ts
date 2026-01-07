import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Deposit, DCAConfig } from '../types'
import { useAuthStore } from './auth'
import { supabase } from '../lib/supabase'
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
  const loading = ref(false)

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

  async function loadFromSupabase() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    loading.value = true
    try {
      // Load deposits
      const { data: depositsData, error: depositsError } = await supabase
        .from('deposits')
        .select('*')
        .order('date', { ascending: true })

      if (depositsError) throw depositsError

      if (depositsData) {
        deposits.value = depositsData.map(d => ({
          id: d.id,
          date: d.date,
          amount: Number(d.amount),
          note: d.note ?? undefined
        }))
        saveToStorage()
      }

      // Load DCA config
      const { data: dcaData, error: dcaError } = await supabase
        .from('dca_config')
        .select('*')
        .single()

      if (dcaError && dcaError.code !== 'PGRST116') throw dcaError

      if (dcaData) {
        dcaConfig.value = {
          enabled: dcaData.enabled,
          amount: Number(dcaData.amount),
          dayOfMonth1: dcaData.day_of_month_1,
          dayOfMonth2: dcaData.day_of_month_2 ?? undefined,
          adjustWeekend: 'after' // Default, not stored in DB for simplicity
        }
        saveDCAConfig()
      }
    } catch (e) {
      console.error('Error loading deposits from Supabase:', e)
    } finally {
      loading.value = false
    }
  }

  async function saveDepositToSupabase(deposit: Deposit) {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated || !authStore.user) return

    try {
      const { error } = await supabase
        .from('deposits')
        .upsert({
          id: deposit.id,
          user_id: authStore.user.id,
          date: deposit.date,
          amount: deposit.amount,
          note: deposit.note ?? null
        })

      if (error) throw error
    } catch (e) {
      console.error('Error saving deposit to Supabase:', e)
    }
  }

  async function deleteDepositFromSupabase(id: string) {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    try {
      const { error } = await supabase
        .from('deposits')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (e) {
      console.error('Error deleting deposit from Supabase:', e)
    }
  }

  async function saveDCAConfigToSupabase() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated || !authStore.user) return

    try {
      const { error } = await supabase
        .from('dca_config')
        .upsert({
          user_id: authStore.user.id,
          enabled: dcaConfig.value.enabled,
          amount: dcaConfig.value.amount,
          day_of_month_1: dcaConfig.value.dayOfMonth1,
          day_of_month_2: dcaConfig.value.dayOfMonth2 ?? null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error
    } catch (e) {
      console.error('Error saving DCA config to Supabase:', e)
    }
  }

  async function updateDCAConfig(config: Partial<DCAConfig>) {
    dcaConfig.value = { ...dcaConfig.value, ...config }
    saveDCAConfig()
    await saveDCAConfigToSupabase()
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

  async function addDeposit(deposit: Omit<Deposit, 'id'>) {
    const newDeposit: Deposit = {
      ...deposit,
      id: crypto.randomUUID()
    }
    deposits.value.push(newDeposit)
    deposits.value.sort((a, b) => a.date.localeCompare(b.date))
    saveToStorage()
    await saveDepositToSupabase(newDeposit)
  }

  async function deleteDeposit(id: string) {
    const index = deposits.value.findIndex(d => d.id === id)
    if (index !== -1) {
      deposits.value.splice(index, 1)
      saveToStorage()
      await deleteDepositFromSupabase(id)
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

  async function syncWithSupabase() {
    await loadFromSupabase()
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
    loading,
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
    isDCADate,
    syncWithSupabase
  }
})
