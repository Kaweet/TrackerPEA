<script setup lang="ts">
import { computed } from 'vue'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useEntriesStore } from '../stores/entries'
import { useDepositsStore } from '../stores/deposits'
import { useConfigStore } from '../stores/config'
import { formatCurrency, formatPercent, calculatePerformance } from '../utils/calculations'

const entriesStore = useEntriesStore()
const depositsStore = useDepositsStore()
const configStore = useConfigStore()

const totalDeposited = computed(() => configStore.startDeposited + depositsStore.totalDeposited)

const globalPerformance = computed(() =>
  calculatePerformance(totalDeposited.value, entriesStore.currentCapital)
)

const stats = computed(() => entriesStore.stats)

function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM yyyy', { locale: fr })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Performance cards -->
    <div class="bg-gray-800 rounded-xl p-4">
      <h2 class="text-lg font-semibold text-white mb-4">Performance</h2>

      <div class="grid grid-cols-2 gap-3">
        <!-- Today -->
        <div class="bg-gray-700/50 rounded-lg p-3">
          <div class="text-xs text-gray-400">Aujourd'hui</div>
          <div
            class="text-lg font-semibold"
            :class="{
              'text-green-400': entriesStore.todayGain > 0,
              'text-red-400': entriesStore.todayGain < 0,
              'text-gray-400': entriesStore.todayGain === 0
            }"
          >
            {{ entriesStore.todayGain > 0 ? '+' : '' }}{{ formatCurrency(entriesStore.todayGain) }}
          </div>
        </div>

        <!-- This Week -->
        <div class="bg-gray-700/50 rounded-lg p-3">
          <div class="text-xs text-gray-400">Cette semaine</div>
          <div
            class="text-lg font-semibold"
            :class="{
              'text-green-400': entriesStore.weekGain > 0,
              'text-red-400': entriesStore.weekGain < 0,
              'text-gray-400': entriesStore.weekGain === 0
            }"
          >
            {{ entriesStore.weekGain > 0 ? '+' : '' }}{{ formatCurrency(entriesStore.weekGain) }}
          </div>
        </div>

        <!-- Last Week -->
        <div class="bg-gray-700/50 rounded-lg p-3">
          <div class="text-xs text-gray-400">Semaine dern.</div>
          <div
            class="text-lg font-semibold"
            :class="{
              'text-green-400': entriesStore.lastWeekGain > 0,
              'text-red-400': entriesStore.lastWeekGain < 0,
              'text-gray-400': entriesStore.lastWeekGain === 0
            }"
          >
            {{ entriesStore.lastWeekGain > 0 ? '+' : '' }}{{ formatCurrency(entriesStore.lastWeekGain) }}
          </div>
        </div>

        <!-- This Month -->
        <div class="bg-gray-700/50 rounded-lg p-3">
          <div class="text-xs text-gray-400">Ce mois</div>
          <div
            class="text-lg font-semibold"
            :class="{
              'text-green-400': entriesStore.monthGain > 0,
              'text-red-400': entriesStore.monthGain < 0,
              'text-gray-400': entriesStore.monthGain === 0
            }"
          >
            {{ entriesStore.monthGain > 0 ? '+' : '' }}{{ formatCurrency(entriesStore.monthGain) }}
          </div>
        </div>

        <!-- Last Month -->
        <div class="bg-gray-700/50 rounded-lg p-3">
          <div class="text-xs text-gray-400">Mois dernier</div>
          <div
            class="text-lg font-semibold"
            :class="{
              'text-green-400': entriesStore.lastMonthGain > 0,
              'text-red-400': entriesStore.lastMonthGain < 0,
              'text-gray-400': entriesStore.lastMonthGain === 0
            }"
          >
            {{ entriesStore.lastMonthGain > 0 ? '+' : '' }}{{ formatCurrency(entriesStore.lastMonthGain) }}
          </div>
        </div>

        <!-- Year -->
        <div class="bg-gray-700/50 rounded-lg p-3">
          <div class="text-xs text-gray-400">Cette annee</div>
          <div
            class="text-lg font-semibold"
            :class="{
              'text-green-400': entriesStore.yearGain > 0,
              'text-red-400': entriesStore.yearGain < 0,
              'text-gray-400': entriesStore.yearGain === 0
            }"
          >
            {{ entriesStore.yearGain > 0 ? '+' : '' }}{{ formatCurrency(entriesStore.yearGain) }}
          </div>
        </div>
      </div>

      <!-- Total since start -->
      <div class="mt-3 bg-gray-700/50 rounded-lg p-4">
        <div class="text-xs text-gray-400">Depuis le début</div>
        <div
          class="text-2xl font-bold"
          :class="{
            'text-green-400': entriesStore.totalGain > 0,
            'text-red-400': entriesStore.totalGain < 0,
            'text-gray-400': entriesStore.totalGain === 0
          }"
        >
          {{ entriesStore.totalGain > 0 ? '+' : '' }}{{ formatCurrency(entriesStore.totalGain) }}
        </div>
      </div>
    </div>

    <!-- Capital overview -->
    <div class="bg-gray-800 rounded-xl p-4">
      <h2 class="text-lg font-semibold text-white mb-4">Capital</h2>

      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-gray-400">Capital actuel</span>
          <span class="text-white font-semibold">{{
            formatCurrency(entriesStore.currentCapital)
          }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-400">Total verse</span>
          <span class="text-white font-semibold">{{
            formatCurrency(totalDeposited)
          }}</span>
        </div>
        <div class="border-t border-gray-700 pt-3 flex justify-between items-center">
          <span class="text-gray-400">Performance globale</span>
          <span
            class="font-semibold"
            :class="{
              'text-green-400': globalPerformance > 0,
              'text-red-400': globalPerformance < 0,
              'text-gray-400': globalPerformance === 0
            }"
          >
            {{ formatPercent(globalPerformance) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="bg-gray-800 rounded-xl p-4">
      <h2 class="text-lg font-semibold text-white mb-4">Statistiques</h2>

      <div class="space-y-3">
        <!-- Best/Worst day -->
        <div v-if="stats.bestDay" class="flex justify-between items-center">
          <span class="text-gray-400">Meilleur jour</span>
          <span class="text-green-400 font-medium">
            {{ formatPercent(stats.bestDay.gainPercent) }}
            <span class="text-xs text-gray-500 ml-1">({{ formatDate(stats.bestDay.date) }})</span>
          </span>
        </div>

        <div v-if="stats.worstDay" class="flex justify-between items-center">
          <span class="text-gray-400">Pire jour</span>
          <span class="text-red-400 font-medium">
            {{ formatPercent(stats.worstDay.gainPercent) }}
            <span class="text-xs text-gray-500 ml-1">({{ formatDate(stats.worstDay.date) }})</span>
          </span>
        </div>

        <!-- Days count -->
        <div class="flex justify-between items-center">
          <span class="text-gray-400">Jours positifs</span>
          <span class="text-green-400 font-medium">{{ stats.positiveDays }}</span>
        </div>

        <div class="flex justify-between items-center">
          <span class="text-gray-400">Jours négatifs</span>
          <span class="text-red-400 font-medium">{{ stats.negativeDays }}</span>
        </div>

        <!-- Average -->
        <div class="border-t border-gray-700 pt-3 flex justify-between items-center">
          <span class="text-gray-400">Performance moyenne</span>
          <span
            class="font-semibold"
            :class="{
              'text-green-400': stats.averagePerformance > 0,
              'text-red-400': stats.averagePerformance < 0,
              'text-gray-400': stats.averagePerformance === 0
            }"
          >
            {{ formatPercent(stats.averagePerformance) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
