// Query-string helpers for collection routes.
//
// Supported params:
//   field=value       exact match
//   field_gte=n       greater than or equal
//   field_lte=n       less than or equal
//   field_ne=value    not equal
//   field_like=text   case-insensitive pattern match
//   _sort, _order     sorting
//   _page, _limit     pagination

const RESERVED = ['_sort', '_order', '_page', '_limit']
const OPERATORS = ['_gte', '_lte', '_like']

function parseKey(key) {
  for (const op of OPERATORS) {
    if (key.endsWith(op)) {
      return { field: key.slice(0, -op.length), op }
    }
  }
  return { field: key, op: '' }
}

function matches(item, key, raw) {
  const { field, op } = parseKey(key)
  const value = item[field]

  switch (op) {
    case '_gte':
      return Number(value) >= Number(raw)
    case '_lte':
      return Number(value) <= Number(raw)
    case '_like':
      return new RegExp(raw, 'i').test(String(value))
    default:
      // Params that don't map to a field are ignored
      return !(field in item) || String(value) === String(raw)
  }
}

export function filterItems(items, query) {
  let result = items

  // Handle _ne up front, then let the remaining params go through matches()
  for (const key of Object.keys(query)) {
    if (key.endsWith('_ne')) {
      const field = key.slice(0, -3)
      result = result.filter((item) => item[field] !== query[key])
      delete query[key]
    }
  }

  const entries = Object.entries(query).filter(([key]) => !RESERVED.includes(key))

  return result.filter((item) =>
    entries.every(([key, raw]) => matches(item, key, raw)),
  )
}

export function sortItems(items, query) {
  const { _sort, _order = 'asc' } = query
  if (!_sort) return items

  const dir = _order === 'desc' ? -1 : 1
  return [...items].sort((a, b) => {
    if (a[_sort] > b[_sort]) return dir
    if (a[_sort] < b[_sort]) return -dir
    return 0
  })
}

export function paginate(items, query) {
  const limit = Number(query._limit)
  if (!limit) return items

  const page = Number(query._page) || 1
  return items.slice((page - 1) * limit, page * limit)
}

export function applyQuery(items, query) {
  return paginate(sortItems(filterItems(items, query), query), query)
}
