import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'

async function freePort() {
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}

for (const stop of ['enter', 'SIGINT', 'SIGHUP']) {
  test(`launcher serves local data and releases its port on ${stop}`, { timeout: 30000, skip: process.platform === 'win32' && stop === 'SIGHUP' }, async () => {
    const port = await freePort()
    const child = spawn(process.execPath, ['scripts/launcher.mjs', '--no-open', '--port', String(port)], { stdio: ['pipe', 'pipe', 'pipe'] })
    let log = ''
    child.stdout.on('data', data => { log += data })
    child.stderr.on('data', data => { log += data })
    const exited = once(child, 'exit')
    try {
      let ready = false
      for (let i = 0; i < 100; i++) {
        assert.equal(child.exitCode, null, log)
        if (log.includes(`http://127.0.0.1:${port}`)) { ready = true; break }
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      assert.ok(ready, `launcher did not become ready: ${log}`)
      const response = await fetch(`http://127.0.0.1:${port}/data/pose-zh.json`)
      assert.equal(response.status, 200)
      assert.equal((await response.json()).length, 1439)
      if (stop === 'enter') child.stdin.write('\n')
      else child.kill(stop)
      const [code] = await exited
      assert.equal(code, 0, log)
      await assert.rejects(fetch(`http://127.0.0.1:${port}/`))
    } finally {
      if (child.exitCode === null) child.kill('SIGKILL')
    }
  })
}

test('busy port fails without taking over an existing service', { timeout: 15000 }, async () => {
  const existing = createServer(socket => socket.end('existing service'))
  existing.listen(0, '127.0.0.1')
  await once(existing, 'listening')
  try {
    const port = existing.address().port
    const child = spawn(process.execPath, ['scripts/launcher.mjs', '--no-open', '--port', String(port)], { stdio: ['pipe', 'pipe', 'pipe'] })
    let log = ''
    child.stdout.on('data', data => { log += data })
    child.stderr.on('data', data => { log += data })
    const [code] = await once(child, 'exit')
    assert.equal(code, 1, log)
    assert.ok(existing.listening)
    assert.match(log, /already in use/)
  } finally { await new Promise(resolve => existing.close(resolve)) }
})
