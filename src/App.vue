<script setup lang="ts">
import { ref } from 'vue'
import Calendar from './components/Calendar.vue'
import EntryForm from './components/EntryForm.vue'
import Dashboard from './components/Dashboard.vue'
import DepositForm from './components/DepositForm.vue'
import Settings from './components/Settings.vue'

type Tab = 'calendar' | 'dashboard' | 'deposits' | 'settings'

const currentTab = ref<Tab>('calendar')
const selectedDate = ref<string | null>(null)

function onSelectDate(date: string) {
  selectedDate.value = date
}

function closeForm() {
  selectedDate.value = null
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white pb-20">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800">
      <div class="px-4 py-3">
        <h1 class="text-xl font-bold text-center">PEA Tracker</h1>
      </div>
    </header>

    <!-- Main content -->
    <main class="p-4 max-w-lg mx-auto">
      <Calendar v-if="currentTab === 'calendar'" @select-date="onSelectDate" />

      <Dashboard v-if="currentTab === 'dashboard'" />

      <DepositForm v-if="currentTab === 'deposits'" />

      <Settings v-if="currentTab === 'settings'" />
    </main>

    <!-- Entry form modal -->
    <EntryForm v-if="selectedDate" :date="selectedDate" @close="closeForm" />

    <!-- Bottom navigation -->
    <nav
      class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 safe-area-bottom"
    >
      <div class="flex justify-around max-w-lg mx-auto">
        <button
          class="flex-1 py-3 flex flex-col items-center gap-1 transition-colors"
          :class="currentTab === 'calendar' ? 'text-blue-500' : 'text-gray-400'"
          @click="currentTab = 'calendar'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span class="text-xs">Calendrier</span>
        </button>

        <button
          class="flex-1 py-3 flex flex-col items-center gap-1 transition-colors"
          :class="currentTab === 'dashboard' ? 'text-blue-500' : 'text-gray-400'"
          @click="currentTab = 'dashboard'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span class="text-xs">Dashboard</span>
        </button>

        <button
          class="flex-1 py-3 flex flex-col items-center gap-1 transition-colors"
          :class="currentTab === 'deposits' ? 'text-blue-500' : 'text-gray-400'"
          @click="currentTab = 'deposits'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="text-xs">Versements</span>
        </button>

        <button
          class="flex-1 py-3 flex flex-col items-center gap-1 transition-colors"
          :class="currentTab === 'settings' ? 'text-blue-500' : 'text-gray-400'"
          @click="currentTab = 'settings'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span class="text-xs">Reglages</span>
        </button>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
