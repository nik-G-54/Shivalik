# mini-json-server

A tiny REST API over a JSON file. Point it at a `db.json` and get a full fake
API in seconds.

## Getting started

```bash
npm install
npm start
```

The server listens on `http://localhost:3000`.

## Routes

```
GET /posts
GET /posts/1
GET /comments
```

## Query parameters

| Param            | Example                    | Description                        |
| ---------------- | -------------------------- | ---------------------------------- |
| `field`          | `?author=typicode`         | Exact match                        |
| `field_gte`      | `?views_gte=100`           | Greater than or equal              |
| `field_lte`      | `?views_lte=500`           | Less than or equal                 |
| `field_ne`       | `?author_ne=typicode`      | Not equal (exclude matching items) |
| `field_like`     | `?title_like=server`       | Case-insensitive pattern match     |
| `_sort`/`_order` | `?_sort=views&_order=desc` | Sorting                            |
| `_page`/`_limit` | `?_page=2&_limit=10`       | Pagination                         |

## Project layout

```
src/server.js        HTTP entry point
src/router.js        Maps requests to collections
src/utils/query.js   Filtering, sorting and pagination helpers
tests/               Unit tests (npm test)
```
