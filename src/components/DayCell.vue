<script setup lang="ts">
import { computed } from 'vue'
import type { DayPerformance, DayStatus } from '../types'

const props = defineProps<{
  day: number | null
  performance?: DayPerformance | null
  hasEntry: boolean
  isToday: boolean
  isSelected: boolean
  isDCADay: boolean
}>()

defineEmits<{
  select: []
}>()

const status = computed((): DayStatus => {
  if (!props.hasEntry) return 'empty'
  if (!props.performance) return 'neutral'
  if (props.performance.gainPercent > 0.01) return 'positive'
  if (props.performance.gainPercent < -0.01) return 'negative'
  return 'neutral'
})

const displayPercent = computed(() => {
  if (!props.performance) return null
  const p = props.performance.gainPercent
  const sign = p > 0 ? '+' : ''
  return `${sign}${p.toFixed(1)}%`
})
</script>

<template>
  <button
    v-if="day"
    class="aspect-square w-full rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all relative"
    :class="{
      'bg-green-500/20 text-green-400 hover:bg-green-500/30': status === 'positive',
      'bg-red-500/20 text-red-400 hover:bg-red-500/30': status === 'negative',
      'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30': status === 'neutral',
      'bg-gray-800/50 text-gray-500 hover:bg-gray-700/50': status === 'empty',
      'ring-2 ring-blue-500': isSelected,
      'ring-2 ring-yellow-500/50': isToday && !isSelected
    }"
    @click="$emit('select')"
  >
    <!-- DCA indicator -->
    <span v-if="isDCADay" class="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-blue-400" />

    <span>{{ day }}</span>
    <span v-if="displayPercent" class="text-[10px] mt-0.5">
      {{ displayPercent }}
    </span>
  </button>
  <div v-else class="aspect-square w-full" />
</template>
