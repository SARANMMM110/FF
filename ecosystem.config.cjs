/**
 * PM2 ecosystem file for Focus Flow.
 *
 * On first deploy or after pulling code:
 *   1. npm ci
 *   2. npm run build
 *   3. pm2 start ecosystem.config.cjs
 *
 * To restart after code changes: npm run build && pm2 restart focus-flow
 */
module.exports = {
  apps: [
    {
      name: 'focus-flow',
      script: 'node',
      args: 'dist/server/index.js',
      interpreter: 'none',
      env: { NODE_ENV: 'production', PORT: '3001' },
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};
