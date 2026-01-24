/** @type {import('next').NextConfig} */
module.exports = {
  allowedDevOrigins: ['ticketing.dev'],

  // Turbopack is used by default in Next.js 16+ for dev server
  // and handles file watching in Docker/K8s better than webpack
};
