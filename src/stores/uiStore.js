import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Store pour la gestion des états d'interface utilisateur
export const useUIStore = create(
  persist(
    devtools(
      (set, get) => ({
        // === PANNEAUX ET SECTIONS ===
        openPanels: new Set(['character-sheet']), // Panneaux ouverts par défaut
        collapsedSections: new Set(),

        // === MODALES ===
        activeModal: null,
        modalData: null,
        modalHistory: [],

        // === NOTIFICATIONS ===
        notifications: [],
        notificationCounter: 0,

        // === RESPONSIVE ET LAYOUT ===
        isMobile: typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
        sidebarCollapsed: false,
        screenSize: typeof window !== 'undefined' ? 
          (window.innerWidth <= 480 ? 'mobile' : window.innerWidth <= 768 ? 'tablet' : 'desktop') : 'desktop',

        // === INTERFACE DE COMBAT ===
        showCombatDetails: true,
        showHealthBars: true,
        showInitiativeOrder: true,
        combatAnimationsEnabled: true,

        // === PRÉFÉRENCES D'AFFICHAGE ===
        theme: 'default',
        showTooltips: true,
        autoScrollLogs: true,
        compactMode: false,

        // === ÉTATS TEMPORAIRES ===
        loading: false,
        loadingMessage: '',
        hoveredElement: null,
        focusedElement: null,

        // === ACTIONS POUR LES PANNEAUX ===

        openPanel: (panelId) => set((state) => ({
          openPanels: new Set([...state.openPanels, panelId])
        })),

        closePanel: (panelId) => set((state) => {
          const newPanels = new Set(state.openPanels)
          newPanels.delete(panelId)
          return { openPanels: newPanels }
        }),

        togglePanel: (panelId) => set((state) => {
          const newPanels = new Set(state.openPanels)
          if (newPanels.has(panelId)) {
            newPanels.delete(panelId)
          } else {
            newPanels.add(panelId)
          }
          return { openPanels: newPanels }
        }),

        closeAllPanels: () => set({ openPanels: new Set() }),

        resetPanels: () => set({ openPanels: new Set(['character-sheet']) }),

        // === ACTIONS POUR LES SECTIONS ===

        collapseSection: (sectionId) => set((state) => ({
          collapsedSections: new Set([...state.collapsedSections, sectionId])
        })),

        expandSection: (sectionId) => set((state) => {
          const newSections = new Set(state.collapsedSections)
          newSections.delete(sectionId)
          return { collapsedSections: newSections }
        }),

        toggleSection: (sectionId) => set((state) => {
          const newSections = new Set(state.collapsedSections)
          if (newSections.has(sectionId)) {
            newSections.delete(sectionId)
          } else {
            newSections.add(sectionId)
          }
          return { collapsedSections: newSections }
        }),

        // === ACTIONS POUR LES MODALES ===

        openModal: (modalType, data = null) => set((state) => ({
          modalHistory: state.activeModal 
            ? [...state.modalHistory, { type: state.activeModal, data: state.modalData }]
            : state.modalHistory,
          activeModal: modalType,
          modalData: data
        })),

        closeModal: () => set((state) => {
          if (state.modalHistory.length > 0) {
            const previous = state.modalHistory[state.modalHistory.length - 1]
            return {
              activeModal: previous.type,
              modalData: previous.data,
              modalHistory: state.modalHistory.slice(0, -1)
            }
          }
          return {
            activeModal: null,
            modalData: null,
            modalHistory: []
          }
        }),

        closeAllModals: () => set({
          activeModal: null,
          modalData: null,
          modalHistory: []
        }),

        // === ACTIONS POUR LES NOTIFICATIONS ===

        addNotification: (notification) => set((state) => ({
          notifications: [...state.notifications, {
            id: `notif-${state.notificationCounter}`,
            timestamp: Date.now(),
            type: 'info',
            duration: 5000,
            ...notification
          }],
          notificationCounter: state.notificationCounter + 1
        })),

        removeNotification: (notificationId) => set((state) => ({
          notifications: state.notifications.filter(n => n.id !== notificationId)
        })),

        clearNotifications: () => set({ notifications: [] }),

        // Notifications typées
        showSuccess: (message, options = {}) => get().addNotification({
          type: 'success',
          message,
          ...options
        }),

        showError: (message, options = {}) => get().addNotification({
          type: 'error',
          message,
          duration: 8000,
          ...options
        }),

        showWarning: (message, options = {}) => get().addNotification({
          type: 'warning',
          message,
          duration: 6000,
          ...options
        }),

        showInfo: (message, options = {}) => get().addNotification({
          type: 'info',
          message,
          ...options
        }),

        // === RESPONSIVE ET LAYOUT ===

        updateScreenSize: () => set((state) => {
          const width = window.innerWidth
          let screenSize = 'desktop'
          let isMobile = false

          if (width <= 480) {
            screenSize = 'mobile'
            isMobile = true
          } else if (width <= 768) {
            screenSize = 'tablet'
          }

          // Only update if values have changed
          if (state.isMobile !== isMobile || state.screenSize !== screenSize) {
            return { isMobile, screenSize }
          }
          
          // Return current state if no changes (prevents re-render)
          return state
        }),

        toggleSidebar: () => set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed
        })),

        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

        // === INTERFACE DE COMBAT ===

        toggleCombatDetails: () => set((state) => ({
          showCombatDetails: !state.showCombatDetails
        })),

        toggleHealthBars: () => set((state) => ({
          showHealthBars: !state.showHealthBars
        })),

        toggleInitiativeOrder: () => set((state) => ({
          showInitiativeOrder: !state.showInitiativeOrder
        })),

        toggleCombatAnimations: () => set((state) => ({
          combatAnimationsEnabled: !state.combatAnimationsEnabled
        })),

        setCombatUISettings: (settings) => set((state) => ({
          showCombatDetails: settings.showDetails ?? state.showCombatDetails,
          showHealthBars: settings.showHealthBars ?? state.showHealthBars,
          showInitiativeOrder: settings.showInitiativeOrder ?? state.showInitiativeOrder,
          combatAnimationsEnabled: settings.animationsEnabled ?? state.combatAnimationsEnabled
        })),

        // === PRÉFÉRENCES ===

        setTheme: (theme) => set({ theme }),

        toggleTooltips: () => set((state) => ({
          showTooltips: !state.showTooltips
        })),

        toggleAutoScrollLogs: () => set((state) => ({
          autoScrollLogs: !state.autoScrollLogs
        })),

        toggleCompactMode: () => set((state) => ({
          compactMode: !state.compactMode
        })),

        updatePreferences: (preferences) => set((state) => ({
          theme: preferences.theme ?? state.theme,
          showTooltips: preferences.showTooltips ?? state.showTooltips,
          autoScrollLogs: preferences.autoScrollLogs ?? state.autoScrollLogs,
          compactMode: preferences.compactMode ?? state.compactMode
        })),

        // === ÉTATS TEMPORAIRES ===

        setLoading: (loading, message = '') => set({
          loading,
          loadingMessage: loading ? message : ''
        }),

        setHoveredElement: (elementId) => set({ hoveredElement: elementId }),

        setFocusedElement: (elementId) => set({ focusedElement: elementId }),

        clearHover: () => set({ hoveredElement: null }),

        clearFocus: () => set({ focusedElement: null }),

        // === UTILITAIRES ===

        resetUI: () => set({
          openPanels: new Set(['character-sheet']),
          collapsedSections: new Set(),
          activeModal: null,
          modalData: null,
          modalHistory: [],
          notifications: [],
          sidebarCollapsed: false,
          showCombatDetails: true,
          showHealthBars: true,
          showInitiativeOrder: true,
          combatAnimationsEnabled: true,
          hoveredElement: null,
          focusedElement: null,
          loading: false,
          loadingMessage: ''
        }),

        // Sauvegarder les préférences (persistées automatiquement)
        savePreferences: () => {
          // Les préférences sont automatiquement sauvegardées grâce au middleware persist
          console.log('Preferences saved automatically')
        }
      }),
      { name: 'ui-store' }
    ),
    {
      name: 'rpg-ui-preferences',
      // Ne persister que certaines préférences
      partialize: (state) => ({
        theme: state.theme,
        showTooltips: state.showTooltips,
        autoScrollLogs: state.autoScrollLogs,
        compactMode: state.compactMode,
        sidebarCollapsed: state.sidebarCollapsed,
        showCombatDetails: state.showCombatDetails,
        showHealthBars: state.showHealthBars,
        showInitiativeOrder: state.showInitiativeOrder,
        combatAnimationsEnabled: state.combatAnimationsEnabled,
        openPanels: Array.from(state.openPanels), // Convert Set to Array for persistence
        collapsedSections: Array.from(state.collapsedSections)
      }),
      // Reconstruire les Sets après la désérialisation
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.openPanels = new Set(state.openPanels || ['character-sheet'])
          state.collapsedSections = new Set(state.collapsedSections || [])
        }
      }
    }
  )
)

// Initialize resize listener when the store is created
if (typeof window !== 'undefined') {
  const handleResize = () => {
    useUIStore.getState().updateScreenSize()
  }
  
  window.addEventListener('resize', handleResize)
}

// Sélecteurs optimisés
export const uiSelectors = {
  isPanelOpen: (state, panelId) => state.openPanels.has(panelId),
  
  isSectionCollapsed: (state, sectionId) => state.collapsedSections.has(sectionId),
  
  hasActiveModal: (state) => state.activeModal !== null,
  
  getActiveModal: (state) => ({
    type: state.activeModal,
    data: state.modalData
  }),
  
  getNotifications: (state) => state.notifications,
  
  hasNotifications: (state) => state.notifications.length > 0,
  
  getRecentNotifications: (state, count = 5) => 
    state.notifications.slice(-count),
  
  isLoading: (state) => state.loading,
  
  getLoadingState: (state) => ({
    loading: state.loading,
    message: state.loadingMessage
  }),
  
  isMobile: (state) => state.isMobile,
  
  getScreenSize: (state) => state.screenSize,
  
  isSidebarCollapsed: (state) => state.sidebarCollapsed,
  
  getCombatUISettings: (state) => ({
    showDetails: state.showCombatDetails,
    showHealthBars: state.showHealthBars,
    showInitiativeOrder: state.showInitiativeOrder,
    animationsEnabled: state.combatAnimationsEnabled
  }),
  
  getPreferences: (state) => ({
    theme: state.theme,
    showTooltips: state.showTooltips,
    autoScrollLogs: state.autoScrollLogs,
    compactMode: state.compactMode
  }),
  
  isElementHovered: (state, elementId) => state.hoveredElement === elementId,
  
  isElementFocused: (state, elementId) => state.focusedElement === elementId,
  
  getOpenPanelsList: (state) => Array.from(state.openPanels),
  
  getCollapsedSectionsList: (state) => Array.from(state.collapsedSections)
}