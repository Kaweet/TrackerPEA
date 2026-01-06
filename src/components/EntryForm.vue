<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useEntriesStore } from '../stores/entries'
import { useDepositsStore } from '../stores/deposits'
import { formatCurrency } from '../utils/calculations'

const props = defineProps<{
  date: string
}>()

const emit = defineEmits<{
  close: []
}>()

const entriesStore = useEntriesStore()
const depositsStore = useDepositsStore()

const capital = ref(0)
const note = ref('')

const formattedDate = computed(() =>
  format(parseISO(props.date), 'EEEE d MMMM yyyy', { locale: fr })
)

// Données de la veille
const previousEntry = computed(() => entriesStore.getPreviousEntry(props.date))
const previousCapital = computed(() => previousEntry.value?.capital ?? 0)

// Versements du jour
const depositsOfDay = computed(() => depositsStore.getDepositsForDate(props.date))
const isDCADay = computed(() => depositsStore.isDCADate(props.date))
const dcaAmount = computed(() => depositsStore.getDCAAmountForDate(props.date))

// Performance calculée
const baseCapital = computed(() => previousCapital.value + depositsOfDay.value)
const calculatedGain = computed(() => capital.value - baseCapital.value)
const calculatedPercent = computed(() =>
  baseCapital.value > 0 ? (calculatedGain.value / baseCapital.value) * 100 : 0
)

// Load existing entry if exists
watch(
  () => props.date,
  newDate => {
    const existing = entriesStore.getEntry(newDate)
    if (existing) {
      capital.value = existing.capital
      note.value = existing.note || ''
    } else {
      // Pre-fill with last known capital + deposits of day
      capital.value = previousCapital.value + depositsOfDay.value
      note.value = ''
    }
  },
  { immediate: true }
)

function save() {
  entriesStore.addEntry({
    date: props.date,
    capital: capital.value,
    note: note.value || undefined
  })
  emit('close')
}

function deleteEntry() {
  if (confirm('Supprimer cette entrée ?')) {
    entriesStore.deleteEntry(props.date)
    emit('close')
  }
}

const hasExisting = computed(() => !!entriesStore.getEntry(props.date))
</script>

<template>
  <div class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
    <div class="bg-gray-800 rounded-xl w-full max-w-md p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-white capitalize">{{ formattedDate }}</h2>
        <button class="text-gray-400 hover:text-white" @click="$emit('close')">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Info veille -->
      <div class="bg-gray-700/50 rounded-lg p-3 space-y-1">
        <div class="flex justify-between text-sm">
          <span class="text-gray-400">Capital veille</span>
          <span class="text-white">{{ formatCurrency(previousCapital) }}</span>
        </div>
        <div v-if="depositsOfDay > 0" class="flex justify-between text-sm">
          <span class="text-gray-400">Versement du jour</span>
          <span class="text-blue-400">+{{ formatCurrency(depositsOfDay) }}</span>
        </div>
        <div v-if="isDCADay && depositsOfDay === 0" class="flex justify-between text-sm">
          <span class="text-gray-400">DCA prévu</span>
          <span class="text-yellow-400">{{ formatCurrency(dcaAmount) }} (non enregistré)</span>
        </div>
      </div>

      <!-- Form -->
      <div class="space-y-4">
        <!-- Capital -->
        <div>
          <label class="block text-sm text-gray-400 mb-1">Capital total du jour (€)</label>
          <input
            v-model.number="capital"
            type="number"
            step="0.01"
            class="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
            placeholder="0.00"
          />
        </div>

        <!-- Calculated performance -->
        <div class="bg-gray-700/50 rounded-lg p-3 space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-400">Performance calculée</span>
            <span
              class="font-semibold"
              :class="{
                'text-green-400': calculatedPercent > 0,
                'text-red-400': calculatedPercent < 0,
                'text-gray-400': calculatedPercent === 0
              }"
            >
              {{ calculatedPercent > 0 ? '+' : '' }}{{ calculatedPercent.toFixed(2) }}%
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-400">Gain/Perte</span>
            <span
              class="text-xl font-semibold"
              :class="{
                'text-green-400': calculatedGain > 0,
                'text-red-400': calculatedGain < 0,
                'text-gray-400': calculatedGain === 0
              }"
            >
              {{ calculatedGain > 0 ? '+' : '' }}{{ formatCurrency(calculatedGain) }}
            </span>
          </div>
        </div>

        <!-- Note -->
        <div>
          <label class="block text-sm text-gray-400 mb-1">Note (optionnel)</label>
          <textarea
            v-model="note"
            rows="2"
            class="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Remarques du jour..."
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-2">
        <button
          v-if="hasExisting"
          class="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          @click="deleteEntry"
        >
          Supprimer
        </button>
        <button
          class="flex-1 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          @click="save"
        >
          Enregistrer
        </button>
      </div>
    </div>
  </div>
</template>
