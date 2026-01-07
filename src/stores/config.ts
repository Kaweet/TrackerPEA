import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { InitialConfig } from '../types'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

const STORAGE_KEY = 'pea-config'

export const useConfigStore = defineStore('config', () => {
  const config = ref<InitialConfig | null>(null)
  const loading = ref(false)

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      config.value = JSON.parse(stored)
    }
  }

  function saveToStorage() {
    if (config.value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
    }
  }

  async function loadFromSupabase() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('config')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows

      if (data) {
        config.value = {
          startDate: data.start_date,
          startCapital: Number(data.start_capital),
          startDeposited: Number(data.start_deposited)
        }
        saveToStorage()
      }
    } catch (e) {
      console.error('Error loading config from Supabase:', e)
    } finally {
      loading.value = false
    }
  }

  async function saveToSupabase() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated || !authStore.user || !config.value) return

    try {
      const { error } = await supabase
        .from('config')
        .upsert({
          user_id: authStore.user.id,
          start_date: config.value.startDate,
          start_capital: config.value.startCapital,
          start_deposited: config.value.startDeposited,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error
    } catch (e) {
      console.error('Error saving config to Supabase:', e)
    }
  }

  async function setConfig(newConfig: InitialConfig) {
    config.value = newConfig
    saveToStorage()
    await saveToSupabase()
  }

  async function clearConfig() {
    const authStore = useAuthStore()

    config.value = null
    localStorage.removeItem(STORAGE_KEY)

    if (authStore.isAuthenticated) {
      try {
        await supabase.from('config').delete().neq('id', '')
      } catch (e) {
        console.error('Error deleting config from Supabase:', e)
      }
    }
  }

  async function syncWithSupabase() {
    await loadFromSupabase()
  }

  const isConfigured = computed(() => config.value !== null)

  const startDate = computed(() => config.value?.startDate ?? '')
  const startCapital = computed(() => config.value?.startCapital ?? 0)
  const startDeposited = computed(() => config.value?.startDeposited ?? 0)

  // Initialize from localStorage
  loadFromStorage()

  return {
    config,
    loading,
    isConfigured,
    startDate,
    startCapital,
    startDeposited,
    setConfig,
    clearConfig,
    syncWithSupabase
  }
})
