import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterItems, sortItems, paginate } from '../src/utils/query.js'

const posts = [
  { id: 1, title: 'Hello json-server', author: 'typicode', views: 100 },
  { id: 2, title: 'Building a fake REST API', author: 'alice', views: 250 },
  { id: 3, title: 'Server-side filtering', author: 'typicode', views: 40 },
  { id: 4, title: 'Why mock servers matter', author: 'bob', views: 100 },
]

const ids = (items) => items.map((item) => item.id)

test('filters by exact string match', () => {
  assert.deepEqual(ids(filterItems(posts, { author: 'typicode' })), [1, 3])
})

test('filters by exact numeric match (query values are strings)', () => {
  assert.deepEqual(ids(filterItems(posts, { views: '100' })), [1, 4])
})

test('supports _gte', () => {
  assert.deepEqual(ids(filterItems(posts, { views_gte: '100' })), [1, 2, 4])
})

test('supports _lte', () => {
  assert.deepEqual(ids(filterItems(posts, { views_lte: '100' })), [1, 3, 4])
})

test('supports _like (case-insensitive)', () => {
  assert.deepEqual(ids(filterItems(posts, { title_like: 'SERVER' })), [1, 3, 4])
})

test('ignores params that are not fields', () => {
  assert.equal(filterItems(posts, { foo: 'bar' }).length, posts.length)
})

test('does not mutate the query object', () => {
  const query = { author_ne: 'bob', views_gte: '10', title_like: 'a' }
  filterItems(posts, query)
  assert.deepEqual(query, { author_ne: 'bob', views_gte: '10', title_like: 'a' })
})

test('supports _ne (excludes matching items)', () => {
  assert.deepEqual(ids(filterItems(posts, { author_ne: 'typicode' })), [2, 4])
})

test('sorts descending with _sort and _order', () => {
  const sorted = sortItems(posts, { _sort: 'views', _order: 'desc' })
  assert.equal(sorted[0].id, 2)
})

test('paginates with _page and _limit', () => {
  assert.deepEqual(ids(paginate(posts, { _page: '2', _limit: '3' })), [4])
})
