import React, { useState } from 'react'
import { useCharacterStore } from '../../../stores/characterStore'
import { Button, Card, CardBody } from '../../ui'

/**
 * Composant utilitaire pour nettoyer les doublons dans l'inventaire
 */
export const InventoryCleanup = () => {
  const { selectedCharacter, consolidateInventory } = useCharacterStore()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  if (!selectedCharacter) {
    return null
  }

  // Analyser les doublons potentiels
  const analyzeDuplicates = () => {
    if (!selectedCharacter.inventory) return { duplicates: [], total: 0 }
    
    const itemCounts = {}
    selectedCharacter.inventory.forEach(item => {
      const key = item.id || item.name || item.nom
      itemCounts[key] = (itemCounts[key] || 0) + 1
    })
    
    const duplicates = Object.entries(itemCounts)
      .filter(([key, count]) => count > 1)
      .map(([key, count]) => ({ name: key, count }))
    
    return { duplicates, total: duplicates.length }
  }

  const { duplicates, total } = analyzeDuplicates()

  const handleCleanup = async () => {
    setIsLoading(true)
    try {
      const beforeCount = selectedCharacter.inventory?.length || 0
      
      // Appeler la fonction de consolidation du store
      consolidateInventory('player')
      
      // Simuler un petit délai pour l'UI
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const afterCount = selectedCharacter.inventory?.length || 0
      const itemsRemoved = beforeCount - afterCount
      
      setMessage(`✅ Inventaire nettoyé ! ${itemsRemoved} doublons supprimés.`)
    } catch (error) {
      setMessage(`❌ Erreur lors du nettoyage: ${error.message}`)
    }
    setIsLoading(false)
  }

  if (total === 0) {
    return (
      <Card className="inventory-cleanup">
        <CardBody>
          <p>✅ Aucun doublon détecté dans votre inventaire.</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="inventory-cleanup">
      <CardBody>
        <h4>🧹 Nettoyage d'inventaire</h4>
        
        <div className="cleanup-analysis">
          <p>
            <strong>{total}</strong> type{total > 1 ? 's' : ''} d'objets en double détecté{total > 1 ? 's' : ''} :
          </p>
          <ul>
            {duplicates.map((duplicate, index) => (
              <li key={index}>
                <strong>{duplicate.name}</strong> - {duplicate.count} exemplaires
              </li>
            ))}
          </ul>
        </div>
        
        <div className="cleanup-actions">
          <Button
            variant="primary"
            onClick={handleCleanup}
            disabled={isLoading}
          >
            {isLoading ? '🔄 Nettoyage...' : '🧹 Nettoyer l\'inventaire'}
          </Button>
        </div>
        
        {message && (
          <div className="cleanup-message">
            <p>{message}</p>
          </div>
        )}
        
        <div className="cleanup-info">
          <small>
            ℹ️ Cette action regroupera les objets identiques et additionnera leurs quantités.
          </small>
        </div>
      </CardBody>
    </Card>
  )
}

export default InventoryCleanup