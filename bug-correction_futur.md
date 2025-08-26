target.name === joueur dans opportunity attack
ca provient de getEntityById est appelé une seule fois dans checkOpportunityAttacks       


> oui, l'application react que je code est en fait un rpg textuel DND. Mon gameplay réside dans des scenes, elle sont de plusieurs types, ont
  chacunes leurs composants de rendus. Mes scenes donc sont définir par types/story.js et sont écris dans data/scenes/prologue.js et
  data/scenes/acte1.js. Aujourd'hui je me rend compte que cela risque d'etre tres long d'ecrire des centaines voir des milliers de scenes voir plus,      
  vus que mon scenario est un peu un systeme a embranchement comme tu peux le voir dans prologue.md ou acte.md ( graph TD mermaid). Je me demandais       
  si ce n'etais pas possible de generer des scenes de maniere procédural ? Donc soit en passant par un nouveau type de Scene, exemple exploration ou      
  alors juste creer un outil qui genererais des scenes de type combat, textuel, dialogue, au milieu de mon scenario. Je ne sais pas trop comment
  faire, ni ce qui est le plus approprié ou le plus scalable dans le futur