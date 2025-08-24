import React, { useState, useEffect, useRef } from 'react';
import './FloatingPanel.css';

/**
 * FloatingPanel - Système de panels flottants style CK3
 * S'adaptent au contenu et peuvent être empilés
 */
const FloatingPanel = ({ 
  id,
  type, 
  title,
  isOpen, 
  onClose, 
  children,
  position = { x: 'center', y: 'center' },
  size = 'medium',
  resizable = false,
  className = '',
  zIndex = 200,
  isFocused = false,
  onFocus,
  isFirst = false // Nouveau prop pour identifier le premier panel
}) => {
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);
  const headerRef = useRef(null);

  // Calcul de la position initiale
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const panel = panelRef.current;
      const rect = panel.getBoundingClientRect();
      
      let x, y;
      
      // Position X
      if (typeof position.x === 'number') {
        x = position.x;
      } else if (position.x === 'center') {
        x = (window.innerWidth - rect.width) / 2;
      } else if (position.x === 'right') {
        x = window.innerWidth - rect.width - 20;
      } else {
        x = 20; // left par défaut
      }
      
      // Position Y
      if (typeof position.y === 'number') {
        y = position.y;
      } else if (position.y === 'center') {
        y = (window.innerHeight - rect.height) / 2;
      } else if (position.y === 'bottom') {
        y = window.innerHeight - rect.height - 20;
      } else {
        y = 80; // top par défaut (sous le StatusCorner)
      }
      
      // Contraintes pour rester dans l'écran
      x = Math.max(10, Math.min(x, window.innerWidth - rect.width - 10));
      y = Math.max(10, Math.min(y, window.innerHeight - rect.height - 10));
      
      setPanelPosition({ x, y });
    }
  }, [isOpen, position]);

  // Gestion du drag & drop
  const handleMouseDown = (e) => {
    if (e.target.closest('.panel-close') || e.target.closest('.panel-content')) {
      return; // Ne pas draguer si on clique sur fermer ou le contenu
    }
    
    // Focus ce panel quand on commence à le draguer
    if (onFocus) {
      onFocus(id);
    }
    
    setIsDragging(true);
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Focus le panel quand on clique dessus
  const handlePanelClick = (e) => {
    e.stopPropagation();
    if (onFocus && !isFocused) {
      onFocus(id);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    
    // Contraintes pour rester dans l'écran
    const panel = panelRef.current;
    const maxX = window.innerWidth - panel.offsetWidth;
    const maxY = window.innerHeight - panel.offsetHeight;
    
    setPanelPosition({
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Event listeners pour le drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Empêcher le scroll du body quand panel ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="floating-panel-container"
      style={{ zIndex: zIndex }}
    >
      {/* Background overlay seulement pour le premier panel */}
      {isFirst && (
        <div 
          className="panel-backdrop-global" 
          onClick={(e) => {
            // Ne fermer QUE si on clique vraiment sur le backdrop, pas sur l'UI
            const clickedElement = e.target;
            if (clickedElement.className === 'panel-backdrop-global') {
              onClose();
            }
          }}
        />
      )}
      
      {/* Panel principal */}
      <div
        ref={panelRef}
        className={`floating-panel floating-panel--${type} floating-panel--${size} ${isFocused ? 'focused' : 'unfocused'} ${className}`}
        style={{
          left: panelPosition.x,
          top: panelPosition.y,
          cursor: isDragging ? 'grabbing' : 'default',
          zIndex: zIndex + 10 // Panel bien au-dessus de son backdrop
        }}
        onClick={handlePanelClick}
      >
        {/* Header dragable */}
        <div
          ref={headerRef}
          className="panel-header"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="panel-title">
            <span className="panel-icon">
              {getPanelIcon(type)}
            </span>
            <h3>{title}</h3>
          </div>
          
          <div className="panel-controls">
            <button 
              className="panel-close"
              onClick={onClose}
              title="Fermer (Échap)"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Contenu du panel */}
        <div className="panel-content">
          {children}
        </div>
        
        {/* Footer optionnel */}
        <div className="panel-footer">
          <div className="panel-hints">
            <span className="hint">↕ Glissez pour déplacer</span>
            <span className="hint">Échap pour fermer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Système de gestion de plusieurs panels
const FloatingPanelManager = ({ panels, onClosePanel, onFocusPanel }) => {
  return (
    <>
      {panels.map((panel, index) => (
        <FloatingPanel
          key={panel.id}
          {...panel}
          isFirst={index === 0} // Premier panel a le backdrop
          onClose={() => onClosePanel(panel.id)}
          onFocus={onFocusPanel}
        />
      ))}
    </>
  );
};

// Helper pour les icônes de panels
const getPanelIcon = (type) => {
  const icons = {
    character: '⚔️',
    inventory: '🎒',
    spells: '✨',
    companions: '👥',
    journal: '📖',
    rest: '💤',
    shop: '🏪',
    map: '🗺️',
    settings: '⚙️'
  };
  
  return icons[type] || '📋';
};

export default FloatingPanel;
export { FloatingPanelManager };