module.exports = {
  apps: [
    {
      name: 'dlts-api',
      script: 'src/app.js',
      cwd: 'C:\\Users\\LIRS\\Desktop\\COURIER WEB\\Server',
      env: { NODE_ENV: 'development', PORT: '9989' },
    },
    {
      name: 'dlts-client',
      script: 'node_modules/vite/bin/vite.js',
      args: 'preview --host 0.0.0.0 --port 4173',
      cwd: 'C:\\Users\\LIRS\\Desktop\\COURIER WEB\\Client',
    },
  ],
};
