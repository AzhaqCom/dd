import React, { useState, useEffect } from 'react';
import SaveService from '../../services/SaveService';
import { useGameStore, useCharacterStore } from '../../stores';

/**
 * Composant de gestion des sauvegardes
 * Permet de sauvegarder, charger et supprimer les parties
 */
const SaveManager = ({ onClose, onLoad }) => {
  const [saves, setSaves] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saveName, setSaveName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const gameState = useGameStore();
  const characterState = useCharacterStore();
  const setCurrentScene = useGameStore(state => state.setCurrentScene);
  const setPlayerCharacter = useCharacterStore(state => state.setPlayerCharacter);
  const setFlags = useGameStore(state => state.setFlags);
  const addCombatMessage = useGameStore(state => state.addCombatMessage);

  // Charger les sauvegardes au montage
  useEffect(() => {
    loadSaves();
  }, []);

  const loadSaves = () => {
    try {
      const allSaves = SaveService.getAllSaves();
      setSaves(allSaves);
    } catch (error) {
      setMessage('Erreur lors du chargement des sauvegardes');
      console.error(error);
    }
  };

  const handleSave = async () => {
    if (!saveName.trim()) {
      setMessage('Veuillez entrer un nom pour la sauvegarde');
      return;
    }

    setIsLoading(true);
    try {
      const result = SaveService.saveGame(gameState, characterState, saveName.trim());
      
      if (result.success) {
        setMessage('Partie sauvegardée avec succès !');
        setSaveName('');
        loadSaves(); // Recharger la liste
        addCombatMessage(`💾 ${result.message}`, 'info');
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('Erreur lors de la sauvegarde');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async (saveId) => {
    setIsLoading(true);
    try {
      const result = SaveService.loadGame(saveId);
      
      if (result.success) {
        const saveData = result.data;
        
        // Restaurer l'état du jeu
        setCurrentScene(saveData.game.currentScene);
        setFlags(saveData.game.gameFlags);
        
        // Restaurer l'état du personnage
        setPlayerCharacter(saveData.character.playerCharacter);
        
        setMessage('Partie chargée avec succès !');
        addCombatMessage(`📁 ${result.message}`, 'success');
        
        // Fermer le gestionnaire de sauvegardes
        if (onLoad) onLoad();
        if (onClose) onClose();
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('Erreur lors du chargement');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (saveId) => {
    try {
      const result = SaveService.deleteSave(saveId);
      
      if (result.success) {
        setMessage('Sauvegarde supprimée');
        loadSaves(); // Recharger la liste
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('Erreur lors de la suppression');
      console.error(error);
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const formatDate = (timestamp) => {
    return SaveService.formatSaveDate(timestamp);
  };

  const getStorageInfo = () => {
    return SaveService.getStorageInfo();
  };

  const storageInfo = getStorageInfo();

  return (
    <div className="save-manager-overlay">
      <div className="save-manager">
        <div className="save-manager-header">
          <h3>Gestion des Sauvegardes</h3>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {message && (
          <div className={`save-message ${message.includes('succès') || message.includes('sauvegardée') || message.includes('chargée') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* Nouvelle sauvegarde */}
        <div className="save-section">
          <h4>Sauvegarder la partie actuelle</h4>
          <div className="save-input-group">
            <input
              type="text"
              placeholder="Nom de la sauvegarde..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              disabled={isLoading}
              maxLength={50}
            />
            <button 
              onClick={handleSave}
              disabled={isLoading || !saveName.trim()}
              className="save-button"
            >
              {isLoading ? '💾...' : '💾 Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Liste des sauvegardes */}
        <div className="save-section">
          <h4>Sauvegardes existantes ({saves.length}/{storageInfo.maxSaves})</h4>
          
          {saves.length === 0 ? (
            <p className="no-saves">Aucune sauvegarde trouvée</p>
          ) : (
            <div className="saves-list">
              {saves.map((save) => (
                <div key={save.id} className="save-item">
                  <div className="save-info">
                    <div className="save-name">{save.name}</div>
                    <div className="save-details">
                      <span className="save-date">{formatDate(save.timestamp)}</span>
                      <span className="save-scene">Scène: {save.game?.currentScene || 'Inconnue'}</span>
                    </div>
                  </div>
                  
                  <div className="save-actions">
                    <button 
                      onClick={() => handleLoad(save.id)}
                      disabled={isLoading}
                      className="load-button"
                      title="Charger cette sauvegarde"
                    >
                      📁 Charger
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(save.id)}
                      disabled={isLoading}
                      className="delete-button"
                      title="Supprimer cette sauvegarde"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informations de stockage */}
        {storageInfo.available && (
          <div className="storage-info">
            <small>
              Espace utilisé: {Math.round(storageInfo.totalSize / 1024)} KB
            </small>
          </div>
        )}

        {/* Confirmation de suppression */}
        {showDeleteConfirm && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm">
              <h4>Confirmer la suppression</h4>
              <p>Êtes-vous sûr de vouloir supprimer cette sauvegarde ?</p>
              <div className="delete-confirm-buttons">
                <button 
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="confirm-delete-button"
                >
                  Oui, supprimer
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="cancel-delete-button"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .save-manager-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
        }

        .save-manager {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .save-manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
        }

        .save-manager-header h3 {
          margin: 0;
          color: #2c3e50;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 5px;
          border-radius: 4px;
        }

        .close-button:hover {
          background: #f0f0f0;
        }

        .save-message {
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          text-align: center;
        }

        .save-message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .save-message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .save-section {
          margin-bottom: 24px;
        }

        .save-section h4 {
          margin: 0 0 12px 0;
          color: #34495e;
        }

        .save-input-group {
          display: flex;
          gap: 8px;
        }

        .save-input-group input {
          flex: 1;
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .save-input-group input:focus {
          outline: none;
          border-color: #007acc;
        }

        .save-button {
          background: #28a745;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          white-space: nowrap;
        }

        .save-button:hover:not(:disabled) {
          background: #218838;
        }

        .save-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .no-saves {
          text-align: center;
          color: #6c757d;
          font-style: italic;
          padding: 20px;
        }

        .saves-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .save-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .save-info {
          flex: 1;
        }

        .save-name {
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .save-details {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #6c757d;
        }

        .save-actions {
          display: flex;
          gap: 8px;
        }

        .load-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .load-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .delete-button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .delete-button:hover:not(:disabled) {
          background: #c82333;
        }

        .load-button:disabled, .delete-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .storage-info {
          text-align: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          color: #6c757d;
        }

        .delete-confirm-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2001;
        }

        .delete-confirm {
          background: white;
          border-radius: 8px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        .delete-confirm h4 {
          margin: 0 0 12px 0;
          color: #dc3545;
        }

        .delete-confirm p {
          margin: 0 0 20px 0;
          color: #6c757d;
        }

        .delete-confirm-buttons {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .confirm-delete-button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .confirm-delete-button:hover {
          background: #c82333;
        }

        .cancel-delete-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .cancel-delete-button:hover {
          background: #5a6268;
        }

        @media (max-width: 768px) {
          .save-manager {
            width: 95%;
            margin: 20px;
            padding: 16px;
          }

          .save-input-group {
            flex-direction: column;
          }

          .save-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .save-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};

export default SaveManager;