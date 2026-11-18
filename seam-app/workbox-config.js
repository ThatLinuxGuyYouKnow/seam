// Workbox config for the installable web build.
// Flow: `npm run build:web` exports the app to dist/, then generates dist/sw.js
// that precaches the export. `navigateFallback` keeps SPA routes working offline.
module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{js,html,css,ico,json,png,ttf,woff,woff2,svg,map}'],
  swDest: 'dist/sw.js',
  navigateFallback: 'index.html',
  navigateFallbackDenylist: [/^\/_/],
  skipWaiting: true,
  clientsClaim: true,
};
