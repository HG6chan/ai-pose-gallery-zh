// The Vite server runs inside this foreground process, not a detached child.
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { parseArgs } from 'node:util'

let server
let stopping = false
let input
async function stop(code = 0) {
  if (stopping) return
  stopping = true
  input?.close()
  // Also bound shutdown when an upstream request is still in flight.
  const timeout = setTimeout(() => process.exit(code), 5000)
  timeout.unref()
  try { await server?.close() }
  finally { process.exit(code) }
}
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
  process.on(signal, () => void stop())
}

try {
  const { values } = parseArgs({ options: { 'no-open': { type: 'boolean' }, port: { type: 'string', default: '5173' } } })
  const port = Number(values.port)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port (1–65535).')
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Please install Node.js 24 LTS.')
  const root = fileURLToPath(new URL('../', import.meta.url))
  process.chdir(root)
  const { createServer } = await import('vite').catch(() => {
    throw new Error('Dependencies missing. Run: pnpm install --frozen-lockfile')
  })
  if (stopping) process.exit(0)
  server = await createServer({ root, server: { host: '127.0.0.1', port, strictPort: true, open: false } })
  await server.listen()
  const url = `http://127.0.0.1:${port}`
  console.log(`\nWorkbench: ${url}\nPress Enter / Ctrl+C, or close this terminal to stop the server.\nClosing only the browser tab does not stop the launcher.\n`)
  input = createInterface({ input: process.stdin })
  input.once('line', () => void stop())
  input.once('close', () => void stop())
  if (!values['no-open']) {
    // Open the user's normal browser; it is not an application server.
    const command = process.platform === 'win32' ? 'explorer.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open'
    const browser = spawn(command, [url], { stdio: 'ignore' })
    browser.on('error', () => console.log(`Open this address in your browser: ${url}`))
    browser.unref()
  }
} catch (error) {
  console.error(`Startup failed: ${error.message}`)
  await stop(1)
}
