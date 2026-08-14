// Service worker minimal — sert uniquement à satisfaire le critère
// d'installabilité de Chrome/Android pour le bouton "Installer l'application".
// Volontairement sans cache : chaque requête passe directement au réseau,
// pour éviter tout contenu périmé. Une vraie stratégie offline pourra être
// ajoutée plus tard si besoin.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
