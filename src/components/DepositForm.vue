<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { useDepositsStore } from '../stores/deposits'
import { useConfigStore } from '../stores/config'
import { formatCurrency } from '../utils/calculations'

const depositsStore = useDepositsStore()
const configStore = useConfigStore()

// Total versé incluant le montant initial
const totalVerse = computed(() => configStore.startDeposited + depositsStore.totalDeposited)

// Estimation du temps pour atteindre le plafond
const timeToReachCeiling = computed(() => {
  if (!depositsStore.dcaConfig.enabled || depositsStore.dcaConfig.amount <= 0) {
    return null
  }

  const remaining = depositsStore.PEA_CEILING - totalVerse.value
  if (remaining <= 0) return null

  // Calcul du montant mensuel DCA
  const versementsParMois = depositsStore.dcaConfig.dayOfMonth2 ? 2 : 1
  const montantMensuel = depositsStore.dcaConfig.amount * versementsParMois

  const moisRestants = Math.ceil(remaining / montantMensuel)
  const annees = Math.floor(moisRestants / 12)
  const mois = moisRestants % 12

  if (annees > 0 && mois > 0) {
    return `${annees} an${annees > 1 ? 's' : ''} et ${mois} mois`
  } else if (annees > 0) {
    return `${annees} an${annees > 1 ? 's' : ''}`
  } else {
    return `${mois} mois`
  }
})

// Form pour versement ponctuel
const date = ref(format(new Date(), 'yyyy-MM-dd'))
const amount = ref(0)

// DCA config
const dcaEnabled = ref(depositsStore.dcaConfig.enabled)
const dcaAmount = ref(depositsStore.dcaConfig.amount)
const dcaDay1 = ref(depositsStore.dcaConfig.dayOfMonth1)
const dcaDay2 = ref(depositsStore.dcaConfig.dayOfMonth2 ?? 15)
const dcaDay2Enabled = ref(!!depositsStore.dcaConfig.dayOfMonth2)
const dcaAdjustWeekend = ref(depositsStore.dcaConfig.adjustWeekend)

const showDCASettings = ref(false)

function saveDeposit() {
  if (amount.value <= 0) return

  depositsStore.addDeposit({
    date: date.value,
    amount: amount.value
  })

  date.value = format(new Date(), 'yyyy-MM-dd')
  amount.value = 0
}

function saveDCAConfig() {
  depositsStore.updateDCAConfig({
    enabled: dcaEnabled.value,
    amount: dcaAmount.value,
    dayOfMonth1: dcaDay1.value,
    dayOfMonth2: dcaDay2Enabled.value ? dcaDay2.value : undefined,
    adjustWeekend: dcaAdjustWeekend.value
  })
  showDCASettings.value = false
}

function deleteDeposit(id: string) {
  if (confirm('Supprimer ce versement ?')) {
    depositsStore.deleteDeposit(id)
  }
}

// Prochaines dates DCA
const nextDCADates = computed(() => {
  if (!depositsStore.dcaConfig.enabled) return []

  const now = new Date()
  const dates: string[] = []

  for (let i = 0; i < 2; i++) {
    const month = (now.getMonth() + i) % 12
    const year = now.getFullYear() + Math.floor((now.getMonth() + i) / 12)
    dates.push(...depositsStore.getDCADatesForMonth(year, month))
  }

  const today = format(now, 'yyyy-MM-dd')
  return dates.filter(d => d >= today).slice(0, 4)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Progress to ceiling -->
    <div class="bg-gray-800 rounded-xl p-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-gray-400">Objectif plafond PEA</span>
        <span class="text-white font-medium">
          {{ formatCurrency(totalVerse) }} /
          {{ formatCurrency(depositsStore.PEA_CEILING) }}
        </span>
      </div>

      <div class="w-full bg-gray-700 rounded-full h-3">
        <div
          class="h-3 rounded-full transition-all duration-300"
          :class="
            (totalVerse / depositsStore.PEA_CEILING) * 100 >= 100 ? 'bg-green-500' : 'bg-blue-500'
          "
          :style="{ width: `${Math.min(100, (totalVerse / depositsStore.PEA_CEILING) * 100)}%` }"
        />
      </div>

      <div class="mt-2 flex justify-between items-center text-sm">
        <span class="text-gray-400">
          {{ ((totalVerse / depositsStore.PEA_CEILING) * 100).toFixed(1) }}% atteint
        </span>
        <span v-if="timeToReachCeiling" class="text-blue-400">
          Plafond dans ~{{ timeToReachCeiling }}
        </span>
        <span v-else-if="totalVerse >= depositsStore.PEA_CEILING" class="text-green-400">
          Plafond atteint !
        </span>
      </div>
    </div>

    <!-- DCA Summary -->
    <div class="bg-gray-800 rounded-xl p-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold text-white">DCA Programmé</h2>
        <button
          class="text-sm text-blue-400 hover:text-blue-300"
          @click="showDCASettings = !showDCASettings"
        >
          {{ showDCASettings ? 'Fermer' : 'Configurer' }}
        </button>
      </div>

      <!-- DCA Settings -->
      <div v-if="showDCASettings" class="space-y-4 mb-4 pb-4 border-b border-gray-700">
        <div class="flex items-center gap-3">
          <input
            id="dca-enabled"
            v-model="dcaEnabled"
            type="checkbox"
            class="w-5 h-5 rounded bg-gray-700 border-gray-600"
          />
          <label for="dca-enabled" class="text-white">Activer le DCA</label>
        </div>

        <div v-if="dcaEnabled" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Montant par versement</label>
            <input
              v-model.number="dcaAmount"
              type="number"
              min="0"
              class="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">Premier jour du mois</label>
            <input
              v-model.number="dcaDay1"
              type="number"
              min="1"
              max="28"
              class="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div class="flex items-center gap-3">
            <input
              id="dca-day2"
              v-model="dcaDay2Enabled"
              type="checkbox"
              class="w-5 h-5 rounded bg-gray-700 border-gray-600"
            />
            <label for="dca-day2" class="text-white">Deuxième versement</label>
          </div>

          <div v-if="dcaDay2Enabled">
            <label class="block text-sm text-gray-400 mb-1">Deuxième jour du mois</label>
            <input
              v-model.number="dcaDay2"
              type="number"
              min="1"
              max="28"
              class="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">Si weekend</label>
            <select
              v-model="dcaAdjustWeekend"
              class="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="before">Décaler au vendredi</option>
              <option value="after">Décaler au lundi</option>
              <option value="none">Ne pas décaler</option>
            </select>
          </div>

          <button
            class="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            @click="saveDCAConfig"
          >
            Enregistrer la configuration
          </button>
        </div>
      </div>

      <!-- DCA Status -->
      <div v-if="!showDCASettings">
        <div v-if="depositsStore.dcaConfig.enabled" class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Montant</span>
            <span class="text-white">{{ formatCurrency(depositsStore.dcaConfig.amount) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Jours</span>
            <span class="text-white">
              {{ depositsStore.dcaConfig.dayOfMonth1 }}
              <span v-if="depositsStore.dcaConfig.dayOfMonth2">
                et {{ depositsStore.dcaConfig.dayOfMonth2 }}
              </span>
              du mois
            </span>
          </div>
          <div v-if="nextDCADates.length > 0" class="pt-2">
            <div class="text-xs text-gray-500 mb-1">Prochains versements</div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="d in nextDCADates"
                :key="d"
                class="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded"
              >
                {{ d }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="text-gray-500 text-sm">DCA non configuré</div>
      </div>
    </div>

    <!-- Add deposit form -->
    <div class="bg-gray-800 rounded-xl p-4">
      <h2 class="text-lg font-semibold text-white mb-4">Versement ponctuel</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Date</label>
          <input
            v-model="date"
            type="date"
            class="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-1">Montant</label>
          <input
            v-model.number="amount"
            type="number"
            step="0.01"
            min="0"
            class="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="0.00"
          />
        </div>

        <button
          :disabled="amount <= 0"
          class="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="saveDeposit"
        >
          Ajouter le versement
        </button>
      </div>
    </div>

    <!-- Deposits history -->
    <div class="bg-gray-800 rounded-xl p-4">
      <h2 class="text-lg font-semibold text-white mb-4">Historique des versements</h2>

      <div v-if="depositsStore.sortedDeposits.length === 0" class="text-gray-500 text-center py-4">
        Aucun versement enregistré
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="deposit in depositsStore.sortedDeposits"
          :key="deposit.id"
          class="flex items-center justify-between bg-gray-700/50 rounded-lg p-3"
        >
          <div>
            <div class="text-white font-medium">{{ formatCurrency(deposit.amount) }}</div>
            <div class="text-sm text-gray-400">{{ deposit.date }}</div>
          </div>
          <button
            class="p-2 text-gray-400 hover:text-red-400 transition-colors"
            @click="deleteDeposit(deposit.id)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
