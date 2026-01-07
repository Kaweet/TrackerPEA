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

  async function signUp(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password
      })
      if (authError) throw authError
      return data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de l\'inscription'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function signIn(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (authError) throw authError
      user.value = data.user
      return data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la connexion'
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
    signUp,
    signIn,
    signOut
  }
})
