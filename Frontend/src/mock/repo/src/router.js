import { applyQuery } from './utils/query.js'

export function createRouter(db) {
  return function route(req, url) {
    if (req.method !== 'GET') {
      return { status: 405, body: { error: 'Method not allowed' } }
    }

    const [, resource, id] = url.pathname.split('/')
    const data = db[resource]

    if (data === undefined) {
      return { status: 404, body: { error: 'Not found' } }
    }

    // Singular resources (e.g. "profile") are returned as-is
    if (!Array.isArray(data)) {
      return { status: 200, body: data }
    }

    if (id !== undefined) {
      const item = data.find((entry) => String(entry.id) === id)
      return item
        ? { status: 200, body: item }
        : { status: 404, body: { error: 'Not found' } }
    }

    const query = Object.fromEntries(url.searchParams)
    return { status: 200, body: applyQuery(data, query) }
  }
}
