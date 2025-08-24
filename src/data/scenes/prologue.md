# 🗡️ Les Gardiens de la Lame Éternelle - Prologue

## Diagramme de flux narratif

```mermaid
graph TD
    A[prologue_heritage - TEXT] --> B[prologue_arrivee_village - INTERACTIVE]
    
    %% Phase 2 - Investigation selon hotspots
    B -->|Hotspot Taverne| C[prologue_taverne_entree - DIALOGUE]
    B -->|Hotspot Forge| D[prologue_forge_visite - DIALOGUE] 
    B -->|Hotspot Fermes| E[prologue_fermes_attaque - TEXT]
    B -->|Hotspot Tunnels| F[prologue_tunnels_decouverte - TEXT]
    
    %% Développement des branches Taverne
    C --> C1[prologue_taverne_villageois - DIALOGUE]
    C --> C2[prologue_taverne_commerce - MERCHANT]
    C2 --> C1
    
    %% Développement des branches Forge
    D --> D1[prologue_forge_tunnels - DIALOGUE]
    D --> D2[prologue_forge_equipement - MERCHANT]
    D2 --> D1
    
    %% Développement des branches Fermes
    E --> E1[prologue_combat_ombres - COMBAT]
    
    %% Développement des branches Tunnels
    F --> F1[prologue_tunnels_exploration - INTERACTIVE]
    
    %% Phase 3 - Convergence vers Kael
    C1 --> G[prologue_kael_apparition - TEXT]
    D1 --> G
    E1 --> G
    F1 --> G
    
    %% Phase 4 - Dialogue et choix d'alliance
    G --> H[prologue_kael_dialogue - DIALOGUE]
    H --> I[prologue_alliance_choix - DIALOGUE]
    
    %% Phase 5 - Branches selon alliance (simplifié)
    I -->|Alliance avec Kael| J[prologue_alliance_strategie - REST_LONG]
    I -->|Refus - Solo| L[prologue_solo_preparation - REST_SHORT]
    
    %% Phase 6 - Exploration régionale unifiée
    J --> M[prologue_carte_region - INTERACTIVE]
    L --> M
    
    %% Destinations finales selon variations (Alliance)
    M -->|Sanctuaire| O[prologue_sanctuaire_approche - TEXT]
    M -->|Nids Ombres| P[prologue_nids_reconnaissance - TEXT] 
    M -->|Camp Réfugiés| Q[prologue_refugies_aide - TEXT]
    M -->|Tour Mage| R[prologue_mage_consultation - TEXT]
    M -->|Pont Dragon| S[prologue_pont_passage - TEXT]
    
    %% Destinations finales selon variations (Solo)
    M -->|Village Voisin| T[prologue_village_voisin - TEXT]
    M -->|Ruines| U[prologue_ruines_exploration - TEXT]
    
    %% Transitions vers l'Acte I
    O --> V[acte1_debut]
    P --> W[acte1_nids_debut]
    Q --> X[acte1_refugies_debut]
    R --> Y[acte1_mage_debut]
    S --> Z[acte1_pont_debut]
    T --> AA[acte1_solo_debut]
    U --> BB[acte1_ruines_debut]
    
    %% Style des nœuds
    classDef textScene fill:#e1f5fe
    classDef dialogueScene fill:#f3e5f5
    classDef interactiveScene fill:#e8f5e8
    classDef merchantScene fill:#fff3e0
    classDef combatScene fill:#ffebee
    classDef restScene fill:#f1f8e9
    classDef transition fill:#fafafa
    
    class A,E,F,G,O,P,Q,R,S,T,U textScene
    class C,C1,D,D1,H,I dialogueScene
    class B,F1,M interactiveScene
    class C2,D2 merchantScene
    class E1 combatScene
    class J,L restScene
    class V,W,X,Y,Z,AA,BB transition
```

## Légende des phases

- **Phase 1** : Arrivée et présentation du contexte (heritage → village)
- **Phase 2** : Investigation libre du village (4 hotspots avec sous-branches)
- **Phase 3** : Rencontre avec Kael (convergence narrative)
- **Phase 4** : Dialogue et choix d'alliance (2 options : Alliance OU Solo)
- **Phase 5** : Préparation selon alliance choisie
- **Phase 6** : Exploration de la région (carte unifiée avec variations)
- **Finales** : 7 destinations vers l'Acte I selon les choix

## Types de scènes utilisées

- **TEXT** : 11 scènes narratives (heritage, fermes, apparition Kael, destinations finales)
- **DIALOGUE** : 6 scènes d'interaction (taverne, forge, Kael, choix alliance)  
- **INTERACTIVE** : 3 scènes avec hotspots (village, tunnels souterrains, carte région unifiée)
- **MERCHANT** : 2 scènes commerciales (taverne, forge)
- **COMBAT** : 1 scène de combat (ombres des fermes)
- **REST_LONG/SHORT** : 2 scènes de repos stratégiques (alliance longue OU solo courte)

## Fonctionnalités narratives intégrées

### ✅ Système de réputation
- Ravenscroft, Kael, Fermiers, Réfugiés, Érudits

### ✅ Système de connaissances 
- 25+ entrées knowledge pour suivre les découvertes

### ✅ Gestion d'objets conditionnels
- Clé du sanctuaire, lanterne, épées, artefacts

### ✅ Conditions dynamiques
- Choix bloqués selon équipement/connaissances

### ✅ Conséquences à long terme
- Choices impactent les scènes futures et l'Acte I

### ✅ Embranchements multiples
- 7 fins différentes menant à différents débuts d'Acte I

**Total : 25 scènes** pour un prologue complet avec rejouabilité maximale.

## Points de départ pour l'Acte I

1. **acte1_debut** - Via sanctuaire (route principale)
2. **acte1_nids_debut** - Via nids d'ombres (action)  
3. **acte1_refugies_debut** - Via camp réfugiés (responsabilité)
4. **acte1_mage_debut** - Via tour du mage (mystère)
5. **acte1_pont_debut** - Via pont dragon (exploration)
6. **acte1_solo_debut** - Via village abandonné (isolation)
7. **acte1_ruines_debut** - Via ruines anciennes (secrets)