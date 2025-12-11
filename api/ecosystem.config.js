module.exports = {
  apps: [
    {
      name: 'nestjs-backend',
      script: './dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        DB_HOST: 'localhost',
        DB_PORT: 3306,
        DB_USERNAME: 'root',
        DB_PASSWORD: 'root',
        DB_DATABASE: 'demo_angular_20',
        JWT_SECRET: 'your-secret-key-change-this-in-production',
        JWT_EXPIRES_IN: '24h'
      }
    }
  ]
};
