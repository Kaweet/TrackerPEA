<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { useConfigStore } from '../stores/config'
import { useEntriesStore } from '../stores/entries'
import { useDepositsStore } from '../stores/deposits'
import { formatCurrency } from '../utils/calculations'

const configStore = useConfigStore()
const entriesStore = useEntriesStore()
const depositsStore = useDepositsStore()

const startDate = ref(configStore.startDate || format(new Date(), 'yyyy-MM-dd'))
const startCapital = ref(configStore.startCapital || 0)
const startDeposited = ref(configStore.startDeposited || 0)

const showResetConfirm = ref(false)

onMounted(() => {
  if (configStore.isConfigured) {
    startDate.value = configStore.startDate
    startCapital.value = configStore.startCapital
    startDeposited.value = configStore.startDeposited
  }
})

function saveConfig() {
  configStore.setConfig({
    startDate: startDate.value,
    startCapital: startCapital.value,
    startDeposited: startDeposited.value
  })

  // Creer automatiquement une entree pour la date de debut
  // si elle n'existe pas deja
  if (!entriesStore.getEntry(startDate.value)) {
    entriesStore.addEntry({
      date: startDate.value,
      capital: startCapital.value
    })
  }
}

function resetAllData() {
  if (confirm('Supprimer TOUTES les donnees (config, entrees, versements) ?')) {
    configStore.clearConfig()
    localStorage.removeItem('pea-entries')
    localStorage.removeItem('pea-deposits')
    localStorage.removeItem('pea-dca')
    window.location.reload()
  }
  showResetConfirm.value = false
}
</script>

<template>
  <div class="space-y-4">
    <!-- Initial config -->
    <div class="bg-gray-800 rounded-xl p-4">
      <h2 class="text-lg font-semibold text-white mb-4">Configuration initiale</h2>

      <p class="text-sm text-gray-400 mb-4">
        Renseignez les informations de votre PEA au moment ou vous commencez le suivi.
        Cela permet de calculer correctement vos gains meme si votre PEA existait deja.
      </p>

      <div class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Date de debut du suivi</label>
          <input
            v-model="startDate"
            type="date"
            class="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-1">Capital a cette date</label>
          <input
            v-model.number="startCapital"
            type="number"
            step="0.01"
            min="0"
            class="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="0.00"
          />
          <p class="text-xs text-gray-500 mt-1">
            Valeur totale de votre PEA au debut du suivi
          </p>
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-1">Total deja verse a cette date</label>
          <input
            v-model.number="startDeposited"
            type="number"
            step="0.01"
            min="0"
            class="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="0.00"
          />
          <p class="text-xs text-gray-500 mt-1">
            Somme de tous vos versements avant le debut du suivi
          </p>
        </div>

        <button
          class="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          @click="saveConfig"
        >
          {{ configStore.isConfigured ? 'Mettre a jour' : 'Enregistrer' }}
        </button>
      </div>
    </div>

    <!-- Current state summary -->
    <div v-if="configStore.isConfigured" class="bg-gray-800 rounded-xl p-4">
      <h2 class="text-lg font-semibold text-white mb-4">Resume</h2>

      <div class="space-y-3">
        <div class="flex justify-between text-sm">
          <span class="text-gray-400">Date de debut</span>
          <span class="text-white">{{ configStore.startDate }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-400">Capital initial</span>
          <span class="text-white">{{ formatCurrency(configStore.startCapital) }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-400">Deja verse au depart</span>
          <span class="text-white">{{ formatCurrency(configStore.startDeposited) }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-400">Versements enregistres</span>
          <span class="text-white">{{ formatCurrency(depositsStore.totalDeposited) }}</span>
        </div>
        <div class="flex justify-between text-sm border-t border-gray-700 pt-3">
          <span class="text-gray-400">Total verse</span>
          <span class="text-white font-medium">
            {{ formatCurrency(configStore.startDeposited + depositsStore.totalDeposited) }}
          </span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-400">Capital actuel</span>
          <span class="text-white font-medium">{{ formatCurrency(entriesStore.currentCapital) }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-400">Gain total</span>
          <span
            class="font-medium"
            :class="entriesStore.totalGain >= 0 ? 'text-green-400' : 'text-red-400'"
          >
            {{ entriesStore.totalGain >= 0 ? '+' : '' }}{{ formatCurrency(entriesStore.totalGain) }}
          </span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-400">Entrees enregistrees</span>
          <span class="text-white">{{ entriesStore.allEntries.length }}</span>
        </div>
      </div>
    </div>

    <!-- Danger zone -->
    <div class="bg-gray-800 rounded-xl p-4 border border-red-900/50">
      <h2 class="text-lg font-semibold text-red-400 mb-4">Zone de danger</h2>

      <p class="text-sm text-gray-400 mb-4">
        Ces actions sont irreversibles. Vos donnees seront definitivement supprimees.
      </p>

      <button
        class="w-full py-3 rounded-lg bg-red-600/20 text-red-400 font-medium hover:bg-red-600/30 border border-red-600/50 transition-colors"
        @click="resetAllData"
      >
        Reinitialiser toutes les donnees
      </button>
    </div>
  </div>
</template>
