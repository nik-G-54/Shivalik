**Describe the bug**

The `_ne` (not equal) query operator is documented in the README but has no
effect. Requesting `GET /posts?author_ne=typicode` returns **every** post,
including the ones written by `typicode`.

**To reproduce**

1. Start the server with the bundled `db.json`:

   ```bash
   npm install
   npm start
   ```

2. Request all posts that were *not* written by `typicode`:

   ```bash
   curl "http://localhost:3000/posts?author_ne=typicode"
   ```

3. Inspect the `author` field of the returned items.

**Expected behavior**

Only posts whose `author` is not `typicode` are returned:

```json
[
  { "id": 2, "title": "Building a fake REST API", "author": "alice", "views": 250 },
  { "id": 4, "title": "Why mock servers matter", "author": "bob", "views": 100 },
  { "id": 5, "title": "Pagination patterns", "author": "alice", "views": 320 },
  { "id": 6, "title": "Release notes v0.4", "author": "carol", "views": 15 }
]
```

**Actual behavior**

All 6 posts are returned, including ids `1` and `3` by `typicode`. The other
operators (`_gte`, `_lte`, `_like`) work as documented, and so does plain
equality (`?author=typicode`).

**Notes**

- `npm test` has a failing case for `_ne` in `tests/query.test.js`.
- Please keep the fix small. The other operators and the existing tests must
  keep passing.

**Environment**

- mini-json-server 0.4.2
- Node.js 20.x
- macOS 14
