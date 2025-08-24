module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ],
  css: [
    './src/**/*.css'
  ],
  output: './src/cleaned-css/',
  safelist: [
    // Classes qui pourraient être générées dynamiquement
    /^health-/,
    /^spell-/,
    /^combat-/,
    /^character-/,
    /^inventory-/,
    /^resource-/,
    // Classes de grille communes
    /^flex/,
    /^grid/,
    // Classes d'état
    /^active$/,
    /^disabled$/,
    /^selected$/,
    /^expanded$/,
    /^collapsed$/,
    // Animations
    /^animate-/,
    /^transition-/
  ],
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
}