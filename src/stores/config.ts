import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { InitialConfig } from '../types'

const STORAGE_KEY = 'pea-config'

export const useConfigStore = defineStore('config', () => {
  const config = ref<InitialConfig | null>(null)

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

  function setConfig(newConfig: InitialConfig) {
    config.value = newConfig
    saveToStorage()
  }

  function clearConfig() {
    config.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  const isConfigured = computed(() => config.value !== null)

  const startDate = computed(() => config.value?.startDate ?? '')
  const startCapital = computed(() => config.value?.startCapital ?? 0)
  const startDeposited = computed(() => config.value?.startDeposited ?? 0)

  // Initialize
  loadFromStorage()

  return {
    config,
    isConfigured,
    startDate,
    startCapital,
    startDeposited,
    setConfig,
    clearConfig
  }
})
