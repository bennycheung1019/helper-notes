// conservative caching, avoid caching auth / firestore / storage APIs
const runtimeCaching = [
  // Next static assets
  {
    urlPattern: /^https?.*\.(?:js|css|woff2|png|jpg|jpeg|svg|webp|ico)$/i,
    handler: "CacheFirst",
    options: {
      cacheName: "assets-cache",
      expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
    },
  },

  // HTML pages (network first)
  {
    urlPattern: ({ request }) => request.mode === "navigate",
    handler: "NetworkFirst",
    options: {
      cacheName: "pages-cache",
      networkTimeoutSeconds: 5,
      expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
    },
  },

  // DO NOT cache firebase / google identity endpoints
  {
    urlPattern: /^https:\/\/(www\.)?googleapis\.com\/.*/i,
    handler: "NetworkOnly",
  },
  {
    urlPattern: /^https:\/\/(www\.)?gstatic\.com\/.*/i,
    handler: "NetworkOnly",
  },
  {
    urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
    handler: "NetworkOnly",
  },
  {
    urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
    handler: "NetworkOnly",
  },
  {
    urlPattern: /^https:\/\/securetoken\.googleapis\.com\/.*/i,
    handler: "NetworkOnly",
  },
];

module.exports = runtimeCaching;