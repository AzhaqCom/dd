import React, { useState, useMemo } from 'react';
import { useCharacterStore } from '../../stores/characterStore';
import { SpellFilters } from '../features/spells/SpellFilters';
import { SpellList } from '../features/spells/SpellList';
import { SpellSlotTracker } from '../features/spells/SpellSlotTracker';
import { spells as allSpells } from '../../data/spells';
import './SpellPanelDirect.css';

/**
 * Panneau de sorts direct et moderne - Version unifiée avec onglets
 * Gère les 3 niveaux : Grimoire (tous) / Connus / Préparés
 */
const SpellPanelDirect = ({ onClose, onCastSpell }) => {
  const { playerCharacter, updateSpellcasting } = useCharacterStore();
  const [activeTab, setActiveTab] = useState('prepared');
  const [filters, setFilters] = useState({
    searchTerm: '',
    school: null,
    level: null,
    castableOnly: false
  });

  const spellcasting = playerCharacter?.spellcasting;

  // Convertir l'objet spells en array
  const allSpellsArray = Object.values(allSpells);

  // Calculer le niveau de sort maximum accessible selon les emplacements
  const getMaxAccessibleSpellLevel = () => {
    if (!spellcasting.spellSlots) return 0;
    
    const availableLevels = Object.keys(spellcasting.spellSlots)
      .map(level => parseInt(level))
      .filter(level => spellcasting.spellSlots[level]?.max > 0);
    
    return availableLevels.length > 0 ? Math.max(...availableLevels) : 0;
  };

  // Si le personnage n'a pas de magie, afficher un message
  if (!spellcasting) {
    return (
      <div className="spell-panel-direct">
        <div className="spell-header">
          <h3>📚 Grimoire</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        <div className="no-spellcasting">
          <p>Ce personnage ne possède pas de capacités magiques.</p>
        </div>
      </div>
    );
  }

  // Obtenir les sorts selon l'onglet actif
  const getSpellsForTab = (tab) => {
    const { cantrips = [], knownSpells = [], preparedSpells = [] } = spellcasting;
    
    switch (tab) {
      case 'grimoire':
        // Tous les sorts disponibles pour la classe, MAIS :
        // 1. Exclure les sorts déjà connus (cantrips + knownSpells + preparedSpells)
        // 2. Afficher seulement les sorts de niveau accessible
        const allKnownSpellNames = [...cantrips, ...knownSpells, ...preparedSpells];
        const maxSpellLevel = getMaxAccessibleSpellLevel();
        
        return allSpellsArray.filter(spell => {
          // Utiliser la classe du personnage si spellcastingClass n'est pas définie
          const characterClass = spellcasting.spellcastingClass || playerCharacter.class;
          
          // Vérifier la classe
          const isCorrectClass = (characterClass === 'Magicien' || characterClass === 'wizard') 
            ? (spell.class?.includes('Magicien') || spell.class?.includes('Universal'))
            : spell.class?.includes(characterClass);
          
          // Exclure si déjà connu
          const isNotAlreadyKnown = !allKnownSpellNames.includes(spell.name);
          
          // Vérifier le niveau accessible (cantrips toujours accessibles)
          const isAccessibleLevel = spell.level === 0 || spell.level <= maxSpellLevel;
          
          return isCorrectClass && isNotAlreadyKnown && isAccessibleLevel;
        });
        
      case 'known':
        // Sorts dans le grimoire (cantrips + sorts connus)
        const knownSpellObjects = knownSpells.map(spellName => 
          allSpellsArray.find(spell => spell.name === spellName)
        ).filter(Boolean);
        
        const cantripObjects = cantrips.map(cantripName =>
          allSpellsArray.find(spell => spell.name === cantripName)
        ).filter(Boolean);
        
        return [...cantripObjects, ...knownSpellObjects];
        
      case 'prepared':
      default:
        // Sorts préparés pour la journée (cantrips + sorts préparés)
        const preparedSpellObjects = preparedSpells.map(spellName =>
          allSpellsArray.find(spell => spell.name === spellName)
        ).filter(Boolean);
        
    
        
        return preparedSpellObjects;
    }
  };

  // Appliquer les filtres
  const filteredSpells = useMemo(() => {
    let spells = getSpellsForTab(activeTab);
    
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      spells = spells.filter(spell => 
        spell.name.toLowerCase().includes(search) ||
        spell.description?.toLowerCase().includes(search)
      );
    }
    
    if (filters.school) {
      spells = spells.filter(spell => spell.school === filters.school);
    }
    
    if (filters.level !== null && filters.level !== 'all') {
      const targetLevel = parseInt(filters.level);
      spells = spells.filter(spell => spell.level === targetLevel);
    }
    
    if (filters.castableOnly) {
      // Filtrer seulement les sorts qu'on peut lancer
      spells = spells.filter(spell => {
        if (spell.level === 0) return true; // Cantrips toujours castables
        const slots = spellcasting.spellSlots;
        return Object.keys(slots).some(level => 
          parseInt(level) >= spell.level && slots[level].available > 0
        );
      });
    }
    
    return spells;
  }, [activeTab, filters, spellcasting]);

  // Handlers pour les actions sur les sorts
  const handleSpellLearn = (spell) => {
    console.log('📚 Tentative d\'apprentissage:', spell.name);
    
    // Ajouter aux sorts connus
    const updatedKnownSpells = [...(spellcasting.knownSpells || [])];
    if (!updatedKnownSpells.includes(spell.name)) {
      updatedKnownSpells.push(spell.name);
      const result = updateSpellcasting({
        knownSpells: updatedKnownSpells
      });
      console.log('✅ Sort appris, résultat:', result);
    } else {
      console.log('⚠️ Sort déjà connu:', spell.name);
    }
  };

  const handleSpellPrepare = (spell) => {
    console.log('🧙‍♂️ Tentative de préparation:', spell.name, 'Onglet actuel:', activeTab);
    
    // Ajouter aux sorts préparés
    const updatedPreparedSpells = [...(spellcasting.preparedSpells || [])];
    
    if (!updatedPreparedSpells.includes(spell.name)) {
      updatedPreparedSpells.push(spell.name);
      console.log('✅ Ajout aux sorts préparés:', updatedPreparedSpells);
      
      const result = updateSpellcasting({
        preparedSpells: updatedPreparedSpells
      });
      
      console.log('📝 Résultat updateSpellcasting:', result);
    } else {
      console.log('⚠️ Sort déjà préparé:', spell.name);
    }
  };

  const handleSpellUnprepare = (spell) => {
    if (activeTab !== 'prepared') return;
    
    // Retirer des sorts préparés
    const updatedPreparedSpells = spellcasting.preparedSpells.filter(
      spellName => spellName !== spell.name
    );
    updateSpellcasting({
      preparedSpells: updatedPreparedSpells
    });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const getTabLabel = (tab) => {
    const counts = {
      grimoire: getSpellsForTab('grimoire').length,
      known: getSpellsForTab('known').length,
      prepared: getSpellsForTab('prepared').length
    };
    
    const labels = {
      grimoire: `📚 Grimoire (${counts.grimoire})`,
      known: `🧠 Connus (${counts.known})`,
      prepared: `⚡ Préparés (${counts.prepared})`
    };
    
    return labels[tab];
  };

  return (
    <div className="spell-panel-direct">
      {/* <div className="spell-header">
        <h3>Gestion des Sorts</h3>
        <button className="close-button" onClick={onClose}>✕</button>
      </div> */}

      {/* Tracker d'emplacements */}
      <div className="spell-slots-section">
        <SpellSlotTracker 
          spellSlots={spellcasting.spellSlots || {}}
          showDetails={true}
        />
      </div>

      {/* Navigation par onglets */}
      <div className="spell-tabs">
        <button 
          className={`spell-tab ${activeTab === 'prepared' ? 'active' : ''}`}
          onClick={() => setActiveTab('prepared')}
        >
          {getTabLabel('prepared')}
        </button>
        <button 
          className={`spell-tab ${activeTab === 'known' ? 'active' : ''}`}
          onClick={() => setActiveTab('known')}
        >
          {getTabLabel('known')}
        </button>
        <button 
          className={`spell-tab ${activeTab === 'grimoire' ? 'active' : ''}`}
          onClick={() => setActiveTab('grimoire')}
        >
          {getTabLabel('grimoire')}
        </button>
      </div>

      {/* Filtres */}
      <div className="spell-filters-section">
        <SpellFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          activeTab={activeTab}
          availableSpells={filteredSpells}
        />
      </div>

      {/* Liste des sorts */}
      <div className="spell-list-section">
        <SpellList
          spells={filteredSpells}
          character={playerCharacter}
          activeTab={activeTab}
          spellSlots={spellcasting.spellSlots || {}}
          isOutOfCombat={true}
          viewMode="list"
          preparedSpells={spellcasting.preparedSpells || []}
          onCastSpell={onCastSpell}
          onPrepareSpell={handleSpellPrepare}
          onUnprepareSpell={handleSpellUnprepare}
          onLearnSpell={handleSpellLearn}
        />
      </div>
    </div>
  );
};

export default SpellPanelDirect;