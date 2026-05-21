import { spawn } from 'node:child_process'

const mode = process.argv[2]

const backendUrls = {
  local: process.env.LOCAL_BACKEND_API_URL || 'http://localhost:3001',
  server: process.env.SERVER_BACKEND_API_URL || 'https://court-management-api.onrender.com',
}

if (!mode || !(mode in backendUrls)) {
  console.error('Usage: node scripts/dev-backend.mjs <local|server>')
  process.exit(1)
}

const env = {
  ...process.env,
  NEXT_PUBLIC_API_URL: 'same-origin',
  BACKEND_API_URL: backendUrls[mode],
}

console.log(`Starting Next dev with ${mode} backend: ${env.BACKEND_API_URL}`)

const child = spawn('next', ['dev'], {
  env,
  shell: true,
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
