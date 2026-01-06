# PEA Tracker - Guide de developpement

## Modele de donnees

### Configuration initiale (InitialConfig)
L'utilisateur configure une fois au demarrage:
- `startDate`: date de debut du suivi
- `startCapital`: valeur du PEA a cette date
- `startDeposited`: total deja verse avant le suivi

### Saisie quotidienne (DailyEntry)
L'utilisateur entre uniquement le capital total du jour. La performance est calculee automatiquement par rapport a l'entree precedente.

### Calcul des performances
- **Performance d'un jour**: `(capital - capitalVeille - versementsDuJour) / (capitalVeille + versementsDuJour) * 100`
- **Gain d'une periode**: difference entre le dernier et premier point de la periode, moins les versements
- **Pas d'interpolation**: si des jours manquent, on calcule entre les points disponibles

### Stores
- `config.ts`: configuration initiale (localStorage: `pea-config`)
- `entries.ts`: entrees quotidiennes (localStorage: `pea-entries`)
- `deposits.ts`: versements et DCA (localStorage: `pea-deposits`, `pea-dca`)

## Stack technique

- **Vue 3** avec Composition API + `<script setup>`
- **TypeScript** en mode strict
- **Vite** pour le build
- **Pinia** pour le state management
- **TailwindCSS** pour le styling
- **date-fns** pour les dates
- **PWA** avec vite-plugin-pwa

## Structure du projet

```
src/
├── components/     # Composants Vue
├── stores/         # Stores Pinia
├── types/          # Types TypeScript
├── utils/          # Fonctions utilitaires
├── App.vue         # Composant racine
├── main.ts         # Point d'entrée
└── style.css       # Styles globaux + Tailwind
```

## Bonnes pratiques Vue 3

### Composition API
```typescript
// Toujours utiliser <script setup lang="ts">
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Props typées
const props = defineProps<{
  title: string
  count?: number
}>()

// Emits typés
const emit = defineEmits<{
  update: [value: string]
  close: []
}>()

// Refs
const isOpen = ref(false)

// Computed
const doubleCount = computed(() => (props.count ?? 0) * 2)

// Watch
watch(() => props.title, (newVal) => {
  console.log('Title changed:', newVal)
})
</script>
```

### Conventions de nommage
- Composants: PascalCase (`DayCell.vue`)
- Props/events: camelCase
- CSS classes: kebab-case (Tailwind)

## Bonnes pratiques Pinia

### Store avec Composition API
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMyStore = defineStore('myStore', () => {
  // State
  const items = ref<Item[]>([])

  // Getters (computed)
  const itemCount = computed(() => items.value.length)

  // Actions (functions)
  function addItem(item: Item) {
    items.value.push(item)
    saveToStorage()
  }

  // Persistence localStorage
  function loadFromStorage() {
    const stored = localStorage.getItem('my-key')
    if (stored) items.value = JSON.parse(stored)
  }

  function saveToStorage() {
    localStorage.setItem('my-key', JSON.stringify(items.value))
  }

  // Init
  loadFromStorage()

  return { items, itemCount, addItem }
})
```

### Accès entre stores
```typescript
// Appeler useOtherStore() DANS les fonctions, pas au top level
function calculateTotal() {
  const otherStore = useOtherStore()
  return otherStore.value + localValue.value
}
```

## Bonnes pratiques TypeScript

### Types stricts
```typescript
// Définir les interfaces dans src/types/index.ts
export interface DailyEntry {
  date: string      // format YYYY-MM-DD
  capital: number
  note?: string     // optionnel avec ?
}

// Éviter any, utiliser unknown si nécessaire
// Utiliser les assertions avec parcimonie
const item = array[0] as MyType  // OK si on est sûr
const item = array[0]!           // Non-null assertion
```

### Gestion du null/undefined
```typescript
// Nullish coalescing
const value = maybeNull ?? defaultValue

// Optional chaining
const name = user?.profile?.name

// Type guards
function isEntry(obj: unknown): obj is DailyEntry {
  return typeof obj === 'object' && obj !== null && 'date' in obj
}
```

## Bonnes pratiques PWA

### Manifest
- Icônes: 192x192 et 512x512 minimum
- `display: standalone` pour mode app
- `theme_color` = couleur de la status bar

### Service Worker
- Stratégie: `generateSW` de Workbox (auto)
- Précache les assets statiques
- Cache-first pour les assets, network-first pour les API

### Mobile-first
```css
/* Base = mobile */
.card { padding: 1rem; }

/* Desktop */
@media (min-width: 640px) {
  .card { padding: 2rem; }
}
```

## Bonnes pratiques Tailwind

### Classes utiles
```html
<!-- Flexbox -->
<div class="flex items-center justify-between gap-4">

<!-- Grid -->
<div class="grid grid-cols-7 gap-1">

<!-- Responsive -->
<div class="p-4 sm:p-6 lg:p-8">

<!-- Dark mode (si activé) -->
<div class="bg-white dark:bg-gray-800">

<!-- États -->
<button class="hover:bg-gray-700 focus:ring-2 disabled:opacity-50">
```

### Couleurs du projet
- Background: `bg-gray-900` (principal), `bg-gray-800` (cards)
- Texte: `text-white`, `text-gray-400` (secondaire)
- Accents: `text-blue-500`, `text-green-400`, `text-red-400`

## Gestion des dates avec date-fns

```typescript
import { format, parseISO, startOfMonth, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'

// Formater
format(new Date(), 'yyyy-MM-dd')  // "2024-01-15"
format(new Date(), 'd MMMM yyyy', { locale: fr })  // "15 janvier 2024"

// Parser
const date = parseISO('2024-01-15')

// Manipuler
const nextWeek = addDays(new Date(), 7)
const monthStart = startOfMonth(new Date())
```

## Commandes

```bash
npm run dev      # Serveur de développement
npm run build    # Build production
npm run preview  # Preview du build
npm run lint     # Linter (ESLint)
npm run format   # Formatter (Prettier)
```

## Checklist avant commit

- [ ] `npm run lint` passe sans erreur
- [ ] `npm run build` compile sans erreur
- [ ] Tester sur mobile (responsive)
- [ ] Vérifier les types TypeScript
