● Le problème c'est que j'ai trop de méthodes qui font du métier complexe. On peut simplifier énormément. Voici ce qu'on peut faire :

  À supprimer/simplifier :
  - Beaucoup de méthodes generate* qui peuvent être fusionnées
  - Les méthodes de calcul de récompenses (peut être dans un service séparé)
  - Les méthodes de positionnement d'ennemis (pour le combat)
  - Les méthodes de seed/hash (utilitaires)

  À garder (core logic) :
  - generateScene() - Entry point principal
  - selectTemplateElements() - Sélection des éléments
  - buildUnifiedScene() - Assemblage final
  - Les utilitaires de base (selectRandom, etc.)