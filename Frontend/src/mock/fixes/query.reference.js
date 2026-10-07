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
const OPERATORS = ['_gte', '_lte', '_ne', '_like']

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
    case '_ne':
      return String(value) !== String(raw)
    case '_like':
      return new RegExp(raw, 'i').test(String(value))
    default:
      // Params that don't map to a field are ignored
      return !(field in item) || String(value) === String(raw)
  }
}

export function filterItems(items, query) {
  const entries = Object.entries(query).filter(([key]) => !RESERVED.includes(key))

  return items.filter((item) =>
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
