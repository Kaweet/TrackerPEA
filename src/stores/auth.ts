import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  async function initialize() {
    loading.value = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user ?? null

      // Écouter les changements d'auth
      supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user ?? null
      })
    } catch (e) {
      console.error('Auth initialization error:', e)
    } finally {
      loading.value = false
    }
  }

  async function signInWithGoogle() {
    loading.value = true
    error.value = null
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/TrackerPEA/'
        }
      })
      if (authError) throw authError
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la connexion Google'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    loading.value = true
    error.value = null
    try {
      const { error: authError } = await supabase.auth.signOut()
      if (authError) throw authError
      user.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la déconnexion'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    initialize,
    signInWithGoogle,
    signOut
  }
})
