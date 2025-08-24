import React, { useState } from 'react';
import { items } from '../../data/items';
import { weapons } from '../../data/weapons';
import './ShopInterface.css';

/**
 * Interface de boutique pour acheter/vendre des objets
 */
const ShopInterface = ({
  mode, // 'buy' ou 'sell'
  availableItems,
  playerInventory,
  playerGold,
  onPurchase,
  onSell,
  getItemPrice,
  shopCurrency = 'or'
}) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Obtenir les données complètes d'un item
  const getItemData = (itemId) => {
    return items[itemId] || weapons[itemId] || null;
  };

  // Gérer l'achat
  const handlePurchase = (item) => {
    if (!onPurchase) return;
    
    const result = onPurchase(item.id, quantity);
    if (result.success) {
      setSelectedItem(null);
      setQuantity(1);
    }
  };

  // Gérer la vente
  const handleSell = (item) => {
    if (!onSell) return;
    
    const result = onSell(item.id, quantity);
    if (result.success) {
      setSelectedItem(null);
      setQuantity(1);
    }
  };

  // Obtenir les objets vendables du joueur
  const getSellableItems = () => {
    return playerInventory.filter(item => {
      const itemData = getItemData(item.id);
      return itemData && itemData.value > 0; // Seulement les objets avec une valeur
    });
  };

  const itemsToDisplay = mode === 'buy' ? availableItems : getSellableItems();

  return (
    <div className="shop-interface">
      {/* Liste des objets */}
      <div className="items-grid">
        {itemsToDisplay.length === 0 ? (
          <div className="empty-shop">
            {mode === 'buy' ? 'Aucun objet en vente' : 'Aucun objet vendable'}
          </div>
        ) : (
          itemsToDisplay.map((item, index) => {
            const itemData = getItemData(item.id);
            if (!itemData) return null;

            const price = mode === 'buy' 
              ? getItemPrice(item)
              : Math.floor((itemData.value || 0) * 0.5);

            const canAfford = mode === 'buy' ? playerGold >= price : true;
            const inStock = mode === 'buy' ? (item.quantity === -1 || item.quantity > 0) : true;

            return (
              <div 
                key={index}
                className={`shop-item ${!canAfford || !inStock ? 'unavailable' : ''} ${selectedItem?.id === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="item-info">
                  <h4 className="item-name">{itemData.name}</h4>
                  <p className="item-description">{itemData.description}</p>
                  
                  {/* Statistiques de l'objet */}
                  {itemData.type === 'weapon' && (
                    <div className="item-stats">
                      <span>Dégâts: {itemData.damage.dice}</span>
                    </div>
                  )}
                  
                  {itemData.effect && (
                    <div className="item-effect">
                      Effet: {itemData.effect.description || itemData.effect}
                    </div>
                  )}
                </div>
                
                <div className="item-pricing">
                  <div className="price">
                    {price} {shopCurrency}
                  </div>
                  
                  {mode === 'buy' && item.quantity !== -1 && (
                    <div className="stock">
                      Stock: {item.quantity}
                    </div>
                  )}
                  
                  {mode === 'sell' && item.quantity && item.quantity > 1 && (
                    <div className="quantity-owned">
                      Possédé: {item.quantity}
                    </div>
                  )}
                  
                  {!canAfford && mode === 'buy' && (
                    <div className="insufficient-funds">
                      Pas assez d'or
                    </div>
                  )}
                  
                  {!inStock && mode === 'buy' && (
                    <div className="out-of-stock">
                      Rupture de stock
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Détails de l'objet sélectionné */}
      {selectedItem && (
        <div className="item-details">
          <div className="details-content">
            <h3>{getItemData(selectedItem.id)?.name}</h3>
            <p>{getItemData(selectedItem.id)?.description}</p>
            
            {/* Quantité */}
            <div className="quantity-selector">
              <label>Quantité:</label>
              <div className="quantity-controls">
                <button 
                  onClick={() => setQuantity(Math.max(1, (quantity || 1) - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="quantity-value">{quantity || 1}</span>
                <button 
                  onClick={() => {
                    const maxQuantity = mode === 'buy' 
                      ? (selectedItem.quantity === -1 ? 10 : selectedItem.quantity)
                      : (selectedItem.quantity || 1);
                    setQuantity(Math.min(maxQuantity, (quantity || 1) + 1));
                  }}
                  disabled={
                    mode === 'buy' 
                      ? (selectedItem.quantity !== -1 && quantity >= selectedItem.quantity)
                      : (selectedItem.quantity && quantity >= selectedItem.quantity)
                  }
                >
                  +
                </button>
              </div>
            </div>

            {/* Prix total */}
            <div className="total-price">
              <strong>
                Total: {
                  mode === 'buy' 
                    ? (getItemPrice(selectedItem) || 0) * (quantity || 1)
                    : Math.floor((getItemData(selectedItem.id)?.value || 0) * 0.5) * (quantity || 1)
                } {shopCurrency}
              </strong>
            </div>

            {/* Boutons d'action */}
            <div className="action-buttons">
              {mode === 'buy' ? (
                <button
                  className="buy-button"
                  onClick={() => handlePurchase(selectedItem)}
                  disabled={
                    playerGold < getItemPrice(selectedItem) * quantity ||
                    (selectedItem.quantity !== -1 && selectedItem.quantity < quantity)
                  }
                >
                  🛒 Acheter
                </button>
              ) : (
                <button
                  className="sell-button"
                  onClick={() => handleSell(selectedItem)}
                  disabled={selectedItem.quantity && selectedItem.quantity < quantity}
                >
                  💰 Vendre
                </button>
              )}
              
              <button
                className="cancel-button"
                onClick={() => setSelectedItem(null)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopInterface;