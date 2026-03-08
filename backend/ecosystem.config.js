module.exports = {
  apps: [{
    name: 'loanms-api',
    script: 'dist/index.js',
    instances: 'max',                // Use all available CPU cores
    exec_mode: 'cluster',            // Enable cluster mode
    max_memory_restart: '800M',      // Restart if exceeds 800MB (reports can spike)
    watch: false,                    // Don't watch for file changes in production
    autorestart: true,               // Auto restart on crash

    // Environment variables for production
    env_production: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=512'  // 512MB heap per worker
    },

    // Logging
    error_file: 'logs/pm2-error.log',
    out_file: 'logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
  }]
};
