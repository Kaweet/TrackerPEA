# PEA Tracker

Application PWA de suivi de Plan d'Épargne en Actions (PEA).

## Objectif

Suivre quotidiennement la performance de son PEA de manière simple et visuelle :
- Saisir son capital chaque jour
- Visualiser les gains/pertes sur un calendrier
- Suivre ses versements et le DCA programmé
- Avoir un dashboard récapitulatif

## Fonctionnalités

### Calendrier
- Vue mensuelle avec navigation
- Indicateur visuel par jour : vert (gain), rouge (perte), gris (neutre)
- Clic sur un jour pour saisir/modifier le capital

### Saisie quotidienne
- Renseigner uniquement le capital total
- Performance calculée automatiquement par rapport à la veille
- Prise en compte des versements du jour dans le calcul

### Dashboard
- Gains/pertes : aujourd'hui, semaine, mois, année, depuis le début
- Capital actuel vs total versé
- Performance globale en %
- Statistiques : meilleur/pire jour, moyenne, jours positifs/négatifs

### Versements
- Versements ponctuels
- DCA programmé (configurable : jours du mois, gestion weekend)
- Barre de progression vers le plafond PEA (150 000€)

## Stack technique

- Vue 3 Composition API + TypeScript
- Vite
- Pinia (state management)
- TailwindCSS
- date-fns
- PWA (installable, hors-ligne)

## Installation

```bash
npm install
npm run dev
```

## Commandes

```bash
npm run dev      # Serveur de développement
npm run build    # Build production
npm run preview  # Preview du build
npm run lint     # Linter ESLint
npm run format   # Formatter Prettier
```

## Structure

```
src/
├── components/     # Composants Vue
├── stores/         # Stores Pinia
├── types/          # Types TypeScript
├── utils/          # Fonctions utilitaires
├── App.vue
├── main.ts
└── style.css
```

## PWA

L'application est installable sur mobile (iOS/Android) et fonctionne hors-ligne.
Les données sont stockées dans le localStorage du navigateur.
