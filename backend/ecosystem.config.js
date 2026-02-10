module.exports = {
  apps: [{
    name: 'loanms-api',
    script: 'dist/index.js',
    instances: 2,                    // Only 2 worker instances
    exec_mode: 'cluster',            // Enable cluster mode
    max_memory_restart: '300M',      // Restart if exceeds 300MB RAM
    watch: false,                    // Don't watch for file changes in production
    autorestart: true,               // Auto restart on crash

    // Environment variables for production
    env_production: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=256'  // Limit Node.js heap to 256MB
    },

    // Logging
    error_file: 'logs/pm2-error.log',
    out_file: 'logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,

    // Graceful shutdown
    kill_timeout: 5000,              // Wait 5 seconds before force kill
    wait_ready: true,                // Wait for process.send('ready')
    listen_timeout: 10000,           // Wait 10 seconds for app to start
  }]
};
