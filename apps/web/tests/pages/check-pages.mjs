import assert from 'node:assert/strict'
import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { chromium } from '@playwright/test'

const dist = resolve(import.meta.dirname, '../../dist')
const base = '/forma-workspace/'
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
}
const fallback = await readFile(resolve(dist, '404.html'))
assert.deepEqual(fallback, await readFile(resolve(dist, 'index.html')))
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname
  const path = resolve(dist, pathname.slice(base.length) || 'index.html')
  if (!pathname.startsWith(base) || !path.startsWith(dist + sep)) {
    res.writeHead(404).end()
    return
  }
  try {
    const bytes = await readFile(path)
    res
      .writeHead(200, {
        'content-type': mime[extname(path)] || 'application/octet-stream',
      })
      .end(bytes)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      res.writeHead(500).end()
      return
    }
    res.writeHead(404, { 'content-type': 'text/html' }).end(fallback)
  }
})
server.listen(0, '127.0.0.1')
try {
  await once(server, 'listening')
  const origin = 'http://127.0.0.1:' + server.address().port
  const home = origin + base
  const project = home + 'workspaces/forma/projects/project-1'
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    })
    page.setDefaultTimeout(10_000)
    const failures = []
    page.on('pageerror', (error) => failures.push(error.message))
    page.on('response', (response) => {
      if (response.request().resourceType() !== 'document' && !response.ok()) {
        failures.push(response.status() + ' ' + response.url())
      }
    })
    assert.equal((await page.goto(home)).status(), 200)
    await page.getByRole('heading', { name: 'Keep the work moving.' }).waitFor()
    await page.getByRole('link', { name: /Open project board/i }).click()
    await page.getByRole('heading', { name: 'Avengers Initiative' }).waitFor()
    assert.equal(page.url(), project)

    const deepLink = project + '?view=list&task=FOR-18'
    assert.equal((await page.goto(deepLink)).status(), 404)
    await page.getByRole('dialog', { name: 'Edit task' }).waitFor()
    assert.equal(page.url(), deepLink)
    assert.equal((await page.reload()).status(), 404)
    await page.getByRole('dialog', { name: 'Edit task' }).waitFor()

    const missing = home + 'workspaces/forma/projects/missing-project'
    assert.equal((await page.goto(missing)).status(), 404)
    await page.getByRole('heading', { name: 'Project not found' }).waitFor()
    await page.getByRole('link', { name: 'Back to workspace home' }).click()
    await page.getByRole('heading', { name: 'Keep the work moving.' }).waitFor()
    assert.equal(page.url(), home)
    assert.deepEqual(failures, [])
    console.log(
      'Pages static fallback passed on mobile: dashboard, prefixed navigation, task deep link + reload, project not found and return home.',
    )
  } finally {
    await browser.close()
  }
} finally {
  server.close()
}
