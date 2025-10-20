/** @type {import('inngest').InngestConfig} */
module.exports = {
  // Local development configuration
  dev: {
    // Use local development mode
    serve: {
      // The URL where your Next.js app is running
      url: "http://localhost:3003",
      // The path to your Inngest API route
      path: "/api/inngest",
    },
  },
  // Production configuration (for later)
  production: {
    // Will be configured when deploying to production
  },
};
