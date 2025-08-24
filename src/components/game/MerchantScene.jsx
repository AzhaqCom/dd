import React, { useState } from 'react';
import { StoryService } from '../../services/StoryService';
import DialogueScene from './DialogueScene';
import ShopInterface from './ShopInterface';
import './MerchantScene.css';

/**
 * Composant pour les scènes de marchand (dialogue + boutique)
 */
const MerchantScene = ({ 
  scene, 
  gameState, 
  onChoice, 
  onPurchase, 
  onSell,
  onBack 
}) => {
  const [mode, setMode] = useState('dialogue'); // 'dialogue' ou 'shop'
  const [selectedTab, setSelectedTab] = useState('buy'); // 'buy' ou 'sell'

  // Traiter les choix spéciaux pour la boutique
  const handleChoice = (choice) => {
    if (choice.action?.type === 'openShop') {
      setMode('shop');
      setSelectedTab('buy');
      return;
    }
    
    if (choice.action?.type === 'openSellInterface') {
      setMode('shop');
      setSelectedTab('sell');
      return;
    }

    // Choix normal
    if (onChoice) {
      onChoice(choice);
    }
  };

  const handleBackToDialogue = () => {
    setMode('dialogue');
  };

  const handlePurchase = (itemId, quantity = 1) => {
    const result = StoryService.processShopAction(
      { type: 'purchase', itemId, quantity },
      gameState,
      scene
    );

    if (onPurchase) {
      onPurchase(result);
    }

    return result;
  };

  const handleSell = (itemId, quantity = 1) => {
    const result = StoryService.processShopAction(
      { type: 'sell', itemId, quantity },
      gameState,
      scene
    );

    if (onSell) {
      onSell(result);
    }

    return result;
  };

  // Calculer les prix avec réductions
  const getItemPrice = (item) => {
    let price = item.price;
    const shop = scene.shop;
    
    if (shop.reputation_discount && gameState.flags.reputation >= shop.reputation_discount.threshold) {
      price = Math.floor(price * shop.reputation_discount.discount);
    }
    
    return price;
  };

  // Filtrer les items disponibles
  const getAvailableItems = () => {
    if (!scene.shop?.inventory) return [];
    
    return scene.shop.inventory.filter(item => {
      // Vérifier les conditions d'affichage
      if (item.condition && !StoryService.evaluateCondition(item.condition, gameState)) {
        return false;
      }
      
      // Vérifier le stock
      if (item.stock !== -1 && item.stock <= 0) {
        return false;
      }
      
      return true;
    });
  };

  // Vérifier les offres spéciales
  const getSpecialOffers = () => {
    if (!scene.shop?.special_offers) return [];
    
    return scene.shop.special_offers.filter(offer => {
      return StoryService.evaluateCondition(offer.condition, gameState);
    });
  };

  if (mode === 'dialogue') {
    return (
      <div className="merchant-scene">
        <DialogueScene
          scene={scene}
          gameState={gameState}
          onChoice={handleChoice}
          onBack={onBack}
        />
        
        {/* Affichage des offres spéciales */}
        {getSpecialOffers().length > 0 && (
          <div className="special-offers">
            <h4>🎁 Offres spéciales</h4>
            {getSpecialOffers().map((offer, index) => (
              <div key={index} className="special-offer">
                <p>{offer.message}</p>
                {offer.reward && (
                  <div className="offer-reward">
                    {offer.reward.type === 'item' && `Récompense: ${offer.reward.item}`}
                    {offer.reward.type === 'gold' && `Récompense: ${offer.reward.amount} or`}
                    {offer.reward.type === 'discount' && `Réduction: ${offer.reward.amount}%`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="merchant-scene shop-mode">
      {/* En-tête de la boutique */}
      <div className="shop-header">
        <div className="merchant-info">
          {scene.content.portrait && (
            <img 
              src={scene.content.portrait} 
              alt={scene.content.speaker}
              className="merchant-portrait"
            />
          )}
          <div>
            <h3>{scene.content.speaker}</h3>
            <p className="shop-type">{scene.metadata.shop_type}</p>
          </div>
        </div>
        
        <div className="player-gold">
          💰 {gameState.character?.gold || 0} or
        </div>
      </div>

      {/* Onglets */}
      <div className="shop-tabs">
        <button 
          className={`tab ${selectedTab === 'buy' ? 'active' : ''}`}
          onClick={() => setSelectedTab('buy')}
        >
          🛒 Acheter
        </button>
        <button 
          className={`tab ${selectedTab === 'sell' ? 'active' : ''}`}
          onClick={() => setSelectedTab('sell')}
        >
          💰 Vendre
        </button>
      </div>

      {/* Interface de boutique */}
      <div className="shop-content">
        <ShopInterface
          mode={selectedTab}
          availableItems={getAvailableItems()}
          playerInventory={gameState.character?.inventory || []}
          playerGold={gameState.character?.gold || 0}
          onPurchase={handlePurchase}
          onSell={handleSell}
          getItemPrice={getItemPrice}
          shopCurrency={scene.shop?.currency || 'or'}
        />
      </div>

      {/* Contrôles */}
      <div className="shop-controls">
        <button className="back-to-dialogue" onClick={handleBackToDialogue}>
          💬 Parler
        </button>
        {onBack && (
          <button className="leave-shop" onClick={onBack}>
            🚪 Quitter
          </button>
        )}
      </div>

      {/* Debug info */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <details>
            <summary>Debug Info - Marchand</summary>
            <div>
              <p><strong>Mode:</strong> {mode}</p>
              <p><strong>Tab:</strong> {selectedTab}</p>
              <p><strong>Items disponibles:</strong> {getAvailableItems().length}</p>
              <p><strong>Offres spéciales:</strong> {getSpecialOffers().length}</p>
              <p><strong>Or du joueur:</strong> {gameState.character?.gold || 0}</p>
            </div>
          </details>
        </div>
      )} */}
    </div>
  );
};

export default MerchantScene;