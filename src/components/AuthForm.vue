<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (mode.value === 'login') {
      await authStore.signIn(email.value, password.value)
    } else {
      await authStore.signUp(email.value, password.value)
      successMessage.value = 'Compte créé ! Vérifiez votre email pour confirmer.'
      mode.value = 'login'
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Une erreur est survenue'
  }
}

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  errorMessage.value = ''
  successMessage.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div class="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
      <h1 class="text-xl font-bold text-white mb-6 text-center">
        PEA Tracker
      </h1>

      <h2 class="text-lg text-gray-300 mb-4 text-center">
        {{ mode === 'login' ? 'Connexion' : 'Inscription' }}
      </h2>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="votre@email.com"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-1">Mot de passe</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            class="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        <div v-if="errorMessage" class="text-red-400 text-sm">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="text-green-400 text-sm">
          {{ successMessage }}
        </div>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded transition-colors"
        >
          {{ authStore.loading ? 'Chargement...' : (mode === 'login' ? 'Se connecter' : 'Créer un compte') }}
        </button>
      </form>

      <div class="mt-4 text-center">
        <button
          @click="toggleMode"
          class="text-blue-400 hover:text-blue-300 text-sm"
        >
          {{ mode === 'login' ? 'Pas encore de compte ? Inscrivez-vous' : 'Déjà un compte ? Connectez-vous' }}
        </button>
      </div>

      <div class="mt-6 pt-4 border-t border-gray-700">
        <p class="text-gray-500 text-xs text-center">
          Mode hors-ligne disponible.<br>
          Connectez-vous pour synchroniser vos données.
        </p>
      </div>
    </div>
  </div>
</template>
