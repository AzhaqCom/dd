import React from 'react'
import { getModifier } from '../../../utils/calculations'
import { StatBlock, StatGroup } from './StatBlock'
import { CollapsibleSection } from '../../ui'

// Mapping des compétences vers les caractéristiques
const SKILL_TO_STAT = {
  acrobaties: "dexterite",
  arcanes: "intelligence", 
  athletisme: "force",
  discretion: "dexterite",
  dressage: "sagesse",
  escamotage: "dexterite",
  histoire: "intelligence",
  intimidation: "charisme",
  intuition: "sagesse",
  investigation: "intelligence",
  medecine: "sagesse",
  nature: "intelligence",
  perception: "sagesse",
  persuasion: "charisme",
  religion: "intelligence",
  representation: "charisme",
  survie: "sagesse",
  tromperie: "charisme"
}

// Noms d'affichage des compétences
const SKILL_DISPLAY_NAMES = {
  acrobaties: "Acrobaties",
  arcanes: "Arcanes",
  athletisme: "Athlétisme", 
  discretion: "Discrétion",
  dressage: "Dressage",
  escamotage: "Escamotage",
  histoire: "Histoire",
  intimidation: "Intimidation",
  intuition: "Intuition",
  investigation: "Investigation",
  medecine: "Médecine",
  nature: "Nature",
  perception: "Perception",
  persuasion: "Persuasion",
  religion: "Religion",
  representation: "Représentation",
  survie: "Survie",
  tromperie: "Tromperie"
}

// Noms courts des caractéristiques
const STAT_ABBREVIATIONS = {
  force: "FOR",
  dexterite: "DEX", 
  constitution: "CON",
  intelligence: "INT",
  sagesse: "SAG",
  charisme: "CHA"
}

/**
 * Composant pour une compétence individuelle
 */
const SkillItem = React.memo(({ 
  skillName, 
  character, 
  proficiencyBonus,
  onSkillClick,
  layout = 'default', // 'default', 'compact', 'detailed'
  showProficiencyIndicator = true
}) => {
  const baseStat = SKILL_TO_STAT[skillName]
  const isProficient = character.proficiencies?.skills?.includes(skillName) || false
  
  const baseModifier = getModifier(character.stats[baseStat] || 10)
  const skillBonus = baseModifier + (isProficient ? proficiencyBonus : 0)
  
  const displayName = SKILL_DISPLAY_NAMES[skillName] || skillName
  const statAbbr = STAT_ABBREVIATIONS[baseStat] || baseStat.toUpperCase()

  const skillClass = [
    'skill-item',
    `skill-item--${layout}`,
    isProficient && 'skill-item--proficient'
  ].filter(Boolean).join(' ')

  const tooltip = `${displayName} (${statAbbr}): ${skillBonus >= 0 ? '+' : ''}${skillBonus}${
    isProficient ? ' (maîtrisé)' : ''
  }`

  if (layout === 'compact') {
    return (
      <div className={skillClass}>
        <StatBlock
          label={displayName}
          value={`${skillBonus >= 0 ? '+' : ''}${skillBonus}`}
          variant={isProficient ? 'highlighted' : 'default'}
          size="small"
          tooltip={tooltip}
          onClick={() => onSkillClick?.(skillName)}
        />
      </div>
    )
  }

  return (
    <div className={skillClass} onClick={() => onSkillClick?.(skillName)}>
      <div className="skill-item__header">
        {showProficiencyIndicator && (
          <div className={`skill-item__proficiency ${isProficient ? 'skill-item__proficiency--active' : ''}`}>
            {isProficient ? '●' : '○'}
          </div>
        )}
        
        <div className="skill-item__name">
          {displayName}
          <span className="skill-item__stat">({statAbbr})</span>
        </div>
        
        <div className="skill-item__bonus">
          {skillBonus >= 0 ? '+' : ''}{skillBonus}
        </div>
      </div>

      {layout === 'detailed' && (
        <div className="skill-item__details">
          <div className="skill-item__breakdown">
            Stat: {baseModifier >= 0 ? '+' : ''}{baseModifier}
            {isProficient && (
              <span> + Maîtrise: +{proficiencyBonus}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

/**
 * Liste complète des compétences
 */
export const SkillsList = ({ 
  character, 
  proficiencyBonus = 2,
  onSkillClick,
  layout = 'default', // 'default', 'compact', 'detailed', 'grouped'
  groupByAbility = false,
  showSearch = false,
  compact = false
}) => {
  const [searchTerm, setSearchTerm] = React.useState('')

  const skills = Object.keys(SKILL_TO_STAT).filter(skill =>
    !searchTerm || SKILL_DISPLAY_NAMES[skill].toLowerCase().includes(searchTerm.toLowerCase())
  )

  const containerClass = [
    'skills-list',
    `skills-list--${layout}`,
    compact && 'skills-list--compact'
  ].filter(Boolean).join(' ')

  // Groupement par caractéristique si demandé
  if (groupByAbility) {
    const groupedSkills = {}
    skills.forEach(skill => {
      const ability = SKILL_TO_STAT[skill]
      if (!groupedSkills[ability]) {
        groupedSkills[ability] = []
      }
      groupedSkills[ability].push(skill)
    })

    const abilityNames = {
      force: "Force",
      dexterite: "Dextérité",
      constitution: "Constitution", 
      intelligence: "Intelligence",
      sagesse: "Sagesse",
      charisme: "Charisme"
    }

    return (
      <div className={containerClass}>
        {showSearch && (
          <div className="skills-list__search">
            <input
              type="text"
              placeholder="Rechercher une compétence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="skills-list__search-input"
            />
          </div>
        )}

        {Object.entries(groupedSkills).map(([ability, abilitySkills]) => (
          <CollapsibleSection
            key={ability}
            id={`skills-${ability}`}
            title={`${abilityNames[ability]} (${abilitySkills.length})`}
            defaultExpanded={!compact}
          >
            <div className="skills-list__ability-group">
              {abilitySkills.map(skillName => (
                <SkillItem
                  key={skillName}
                  skillName={skillName}
                  character={character}
                  proficiencyBonus={proficiencyBonus}
                  onSkillClick={onSkillClick}
                  layout={compact ? 'compact' : layout}
                />
              ))}
            </div>
          </CollapsibleSection>
        ))}
      </div>
    )
  }

  // Liste simple
  return (
    <div className={containerClass}>
      {showSearch && (
        <div className="skills-list__search">
          <input
            type="text"
            placeholder="Rechercher une compétence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="skills-list__search-input"
          />
        </div>
      )}

      <div className="skills-list__items">
        {layout === 'compact' ? (
          <StatGroup layout="grid">
            {skills.map(skillName => (
              <SkillItem
                key={skillName}
                skillName={skillName}
                character={character}
                proficiencyBonus={proficiencyBonus}
                onSkillClick={onSkillClick}
                layout={layout}
              />
            ))}
          </StatGroup>
        ) : (
          skills.map(skillName => (
            <SkillItem
              key={skillName}
              skillName={skillName}
              character={character}
              proficiencyBonus={proficiencyBonus}
              onSkillClick={onSkillClick}
              layout={layout}
            />
          ))
        )}
      </div>
    </div>
  )
}

/**
 * Version compacte avec uniquement les compétences maîtrisées
 */
export const ProficientSkillsList = ({ character, proficiencyBonus }) => {
  const proficientSkills = character.proficiencies?.skills || []
  
  if (proficientSkills.length === 0) {
    return (
      <div className="proficient-skills-list proficient-skills-list--empty">
        <p>Aucune compétence maîtrisée</p>
      </div>
    )
  }

  return (
    <div className="proficient-skills-list">
      <h4>Compétences maîtrisées</h4>
      <StatGroup layout="horizontal">
        {proficientSkills.map(skillName => (
          <SkillItem
            key={skillName}
            skillName={skillName}
            character={character}
            proficiencyBonus={proficiencyBonus}
            layout="compact"
            showProficiencyIndicator={false}
          />
        ))}
      </StatGroup>
    </div>
  )
}

/**
 * Calculateur de bonus de compétence
 */
export const useSkillBonus = (character, skillName, proficiencyBonus = 2) => {
  return React.useMemo(() => {
    const baseStat = SKILL_TO_STAT[skillName]
    const isProficient = character.proficiencies?.skills?.includes(skillName) || false
    const baseModifier = getModifier(character.stats[baseStat] || 10)
    
    return {
      bonus: baseModifier + (isProficient ? proficiencyBonus : 0),
      baseModifier,
      proficiencyBonus: isProficient ? proficiencyBonus : 0,
      isProficient,
      ability: baseStat
    }
  }, [character, skillName, proficiencyBonus])
}

export default SkillsList