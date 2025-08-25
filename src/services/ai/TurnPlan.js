// === CLASSE TURNPLAN POUR MOUVEMENT TACTIQUE ===
/**
 * Représente un plan complet de tour : mouvement + action + mouvement
 * Suit les règles D&D 5e : vitesse divisée avant/après action
 */
class TurnPlan {
  constructor() {
    this.phases = []  // Array de phases ordonnées
    this.totalScore = 0
    this.movementUsed = 0
    this.totalMovement = 0
    this.reasoning = ""  // Explication du plan pour debug
  }
  
  /**
   * Ajoute une phase au plan
   * @param {string} type - 'move', 'attack', 'spell', 'end_turn'
   * @param {Object} details - Détails de la phase
   */
  addPhase(type, details) {
    const phase = { type, ...details }
    this.phases.push(phase)
    
    // Tracking du mouvement
    if (type === 'move') {
      this.movementUsed += details.distance || 0
    }
    
    return this
  }
  
  /**
   * Calcule le score tactique total du plan
   */
  calculateTotalScore() {
    this.totalScore = this.phases.reduce((sum, phase) => {
      return sum + (phase.tacticalScore || 0)
    }, 0)
    
    // Bonus pour plans équilibrés mouvement + action
    if (this.phases.some(p => p.type === 'move') && 
        this.phases.some(p => ['attack', 'spell'].includes(p.type))) {
      this.totalScore += 25 // Bonus plan tactique complet
    }
    
    return this.totalScore
  }
  
  /**
   * Vérifie si le plan est valide selon les règles D&D 5e
   */
  isValid() {
    // Vérifier mouvement total
    if (this.movementUsed > this.totalMovement) {
      return false
    }
    
    // Vérifier qu'il n'y a qu'une action principale
    const mainActions = this.phases.filter(p => 
      ['attack', 'spell', 'dash', 'dodge'].includes(p.type)
    )
    
    return mainActions.length <= 1
  }
  
  /**
   * Convertit le plan en description lisible
   */
  describe() {
    const descriptions = this.phases.map(phase => {
      switch (phase.type) {
        case 'move':
          return `Bouge vers ${phase.to.x},${phase.to.y} (${phase.reason})`
        case 'attack':
          return `Attaque ${phase.target.name} avec ${phase.attack.name}`
        case 'spell':
          return `Lance ${phase.spell.name} sur ${phase.target?.name || 'zone'}`
        default:
          return phase.description || `Action ${phase.type}`
      }
    })
    
    return `Plan: ${descriptions.join(' → ')} [Score: ${this.totalScore}]`
  }
}

export { TurnPlan }