  "exploration_foret": {
    id: 'exploration_foret',
    type: SCENE_TYPES.EXPLORATION,

    content: {
      title: 'La Forêt Mystérieuse',
      text: 'Les bois s\'étendent devant vous, denses et mystérieux. Des bruits étranges résonnent dans les profondeurs, et des traces suspectes marquent le sol.'
    },

    exploration: {
      biome: 'forest',
    encouters:50,
    type:['combat','dialogue',"text",'merchant']
    }

    metadata: {
      chapter: 'prologue',
      location: 'Forêt de Ravenscroft',
      environment: 'forest',
      safety: 2,
      restAvailability: {
        short: true,
        long: false,
        restrictions: ['wilderness', 'creatures_nearby']
      }
    }
  },