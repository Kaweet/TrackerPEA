# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

## [1.1.1] - 2026-01-07

### Fixed
- Correction du calcul des gains par période (semaine/mois/année) qui utilisait une référence incohérente

## [1.1.0] - 2026-01-07

### Changed
- Authentification simplifiée: connexion Google uniquement (plus de création de compte email)

## [1.0.0] - 2026-01-07

### Changed
- Section plafond PEA reformulée en "Objectif plafond PEA" avec pourcentage atteint
- Affichage du total versé incluant le montant initial configuré
- Estimation du temps pour atteindre le plafond basée sur le DCA configuré

### Fixed
- Correction de tous les accents français manquants dans l'interface

### Added
- Authentification utilisateur avec Supabase
  - Inscription / connexion par email
  - Chaque utilisateur a ses propres données isolées (Row Level Security)
- Synchronisation cloud des données entre appareils

### Previously Added
- Vue calendrier mensuelle avec navigation
- Saisie quotidienne du capital (calcul automatique de la performance)
- Dashboard avec récapitulatif des gains (jour/semaine/mois/année/total)
- Gestion des versements ponctuels
- Configuration DCA (Dollar Cost Averaging)
  - Premier et deuxième jour du mois configurables
  - Gestion automatique des weekends (décalage vendredi/lundi)
- Barre de progression vers le plafond PEA (150 000€)
- Statistiques: meilleur/pire jour, jours positifs/négatifs, moyenne
- PWA installable avec service worker
- Persistance localStorage
- ESLint + Prettier configurés

### Technical
- Vue 3 Composition API + TypeScript
- Pinia pour le state management
- TailwindCSS pour le styling
- date-fns pour la gestion des dates
- vite-plugin-pwa pour la PWA
- Supabase pour l'authentification et la base de données
