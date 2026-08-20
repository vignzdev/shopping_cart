# Shopping Cart

Build a shopping cart application using Astro.js with TypeScript, containerized using Docker. The design follows Domain-Driven Design: business rules live in the domain, HTTP is a thin adapter, and persistence is swappable.

## Why this shape

The assessment asks for APIs, one UI, tests, Docker, and DDD/TDD. The code is organized around two bounded contexts — **Products** and **Cart** — plus a small **Shared** kernel (`Money`, errors).

```
HTTP (Astro API routes) - Presentation
        │
        ▼
Application (use cases + Zod validation)
        │
        ▼
Domain (Product, Cart, Money, invariants)
        │
        ▼
Infrastructure (Supabase, R2, or in-memory for tests)
```

Use cases never import Astro. Domain classes never import Supabase. Tests inject in-memory repositories so they do not need a database.

## Requirements coverage

| Requirement           | Implementation                                           |
| --------------------- | -------------------------------------------------------- |
| Astro.js + TypeScript | Astro 7, Node adapter, strict TypeScript                 |
| Docker                | Multi-stage `Dockerfile` + `docker-compose.yml`          |
| Product APIs          | Add, update, delete, fetch (list + by id)                |
| Cart APIs             | Add, remove, view, update quantity                       |
| UI                    | Product management **and** shopping cart                 |
| Validation / errors   | Zod at the edge, domain errors, HTTP status mapping      |
| Unit tests            | Domain + use cases (`src/tests/**/unit`)                 |
| Integration tests     | Product and cart API routes (`src/tests/**/integration`) |
| Responsive UI         | Tailwind breakpoints on storefront, admin, and cart      |

## Architecture

### Bounded contexts

```
src/
├── products/          Product catalog
│   ├── domain/        Product, image rules, repository port
│   ├── application/   add / update / delete / get / list
│   └── infrastructure/  Supabase + R2, or in-memory
├── cart/              Shopping cart
│   ├── domain/        Cart, CartItem, repository port
│   ├── application/   add / update / remove / get
│   ├── infrastructure/  Supabase or in-memory
│   └── presentation/  CartView UI
├── shared/            Money, errors, HTTP helpers, composition root
├── constants/         App name, validation limits, upload rules, routes
├── pages/             Astro routes (UI + /api/*)
├── components/        Storefront and product-admin UI
└── tests/             Unit and integration tests
```

### Request flow

Example: add an item to the cart.

1. `POST /api/cart/items` reads JSON and the `cart_id` cookie.
2. `addCartItem` validates `{ productId, quantity }` with Zod.
3. The product is loaded. Missing product → `NotFoundError` (404).
4. Domain `Cart.addItem()` enforces positive quantity and stock.
5. The cart is saved. The cookie is set so later requests reuse the same cart.

HTTP handlers only parse input, call a use case, and map errors. They do not contain business rules.

### Domain rules

**Product**

- Name is 3–100 characters (trimmed).
- Description is optional, max 1000 characters.
- Price must be positive.
- Stock is a non-negative integer.
- Image URL and storage key must both be present or both absent.

**Cart**

- Add quantity must be a positive integer.
- Adding or updating cannot exceed product stock (`InsufficientStockError` → 409).
- Quantity `0` removes the line item.
- Subtotal is the sum of line totals (`unitPrice × quantity`).

**Product images**

- JPEG / PNG / WebP, max 5 MB (`src/constants/upload.ts`).
- Extension, MIME type, and file signature must agree (a GIF renamed to `.png` is rejected).

### Persistence

Production wiring lives in `src/shared/infrastructure/compose.ts`:

- Products and carts → Supabase (`src/shared/infrastructure/supabase/schema.sql`)
- Product images → Cloudflare R2
- Guest cart identity → httpOnly `cart_id` cookie (30 days)

Tests replace those adapters with in-memory repositories so the same use cases run without network I/O.

## REST API

Base URL: `http://localhost:4321`

Error body: `{ "error": "message" }`. Zod failures also include `issues`.

| Status | When                                |
| ------ | ----------------------------------- |
| 400    | Validation / domain invariant       |
| 404    | Product, cart, or cart item missing |
| 409    | Not enough stock                    |
| 500    | Unexpected failure                  |

### Products

| Method   | Path                | Description                |
| -------- | ------------------- | -------------------------- |
| `GET`    | `/api/products`     | List catalog               |
| `POST`   | `/api/products`     | Create product (`201`)     |
| `GET`    | `/api/products/:id` | Fetch one product          |
| `PUT`    | `/api/products/:id` | Update fields and/or image |
| `DELETE` | `/api/products/:id` | Delete product (`204`)     |

Create / update accept JSON or `multipart/form-data` (when uploading an image).

```json
{
  "name": "Apple",
  "description": "MacBook Pro",
  "price": 12,
  "stock": 10
}
```

Response:

```json
{
  "id": "uuid",
  "name": "Apple",
  "description": "MacBook Pro",
  "price": 12,
  "stock": 10,
  "imageUrl": null
}
```

### Cart

The cart is anonymous. First `POST /api/cart/items` creates a cart and sets `cart_id`. Later calls send that cookie automatically from the browser.

| Method   | Path                         | Description                    |
| -------- | ---------------------------- | ------------------------------ |
| `GET`    | `/api/cart`                  | View cart (empty if no cookie) |
| `POST`   | `/api/cart/items`            | Add item (`201`)               |
| `PATCH`  | `/api/cart/items/:productId` | Update quantity                |
| `DELETE` | `/api/cart/items/:productId` | Remove item                    |

Add:

```json
{ "productId": "uuid", "quantity": 2 }
```

Update:

```json
{ "quantity": 3 }
```

`quantity: 0` removes the item. Adding the same product again merges quantities.

Response:

```json
{
  "id": "uuid",
  "items": [
    {
      "productId": "uuid",
      "name": "Mug",
      "unitPrice": 12,
      "quantity": 2,
      "lineTotal": 24
    }
  ],
  "subtotal": 24
}
```

## UI

Pages:

| Path       | What it does                               |
| ---------- | ------------------------------------------ |
| `/`        | Storefront: featured products, add to cart |
| `/product` | Product management: add, update, delete    |
| `/cart`    | Cart: view, change quantity, remove        |

The brief required one of those UIs. Both are implemented so the catalog and checkout loop can be demonstrated end to end.

Layouts use Tailwind (`sm` / `lg` grids, wrapping nav, stacked cart rows on small screens) and [shadcn/ui](https://ui.shadcn.com) primitives (Button, Card, Table, Input, Alert, and so on). API errors are shown in the page instead of failing silently.

## Testing

Tests were written against domain and use-case behavior first, then wired to API routes. Unit tests never hit Supabase or R2.

```
src/tests/
├── product/
│   ├── unit/           Product, Money, image rules, product use cases
│   └── integration/    /api/products
└── cart/
    ├── unit/           Cart domain, cart use cases
    └── integration/    /api/cart
```

```bash
pnpm test                 # all tests
pnpm test:unit            # domain + use cases
pnpm test:integration     # API routes
pnpm test:watch           # watch mode
pnpm test:coverage        # coverage report
```

Integration tests call the Astro `APIRoute` handlers with a fake `APIContext` and inject in-memory repositories through `compose.ts`.

## Run locally

Requires Node `>= 22.12` and [pnpm](https://pnpm.io).

```bash
cp .env.example .env
pnpm install
pnpm dev
```

App: [http://localhost:4321](http://localhost:4321)

Astro loads `.env` into `import.meta.env` for local `pnpm dev`. Render injects the same names into `process.env`. The app reads both, so localhost and Docker both work.

Apply `src/shared/infrastructure/supabase/schema.sql` in the Supabase SQL editor before using persistence. Fill in the values from `.env.example`:

- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
- `R2_*` for product image uploads

## Docker

```bash
cp .env.example .env   # fill in real values
docker compose up --build
```

The image is a three-stage build: install → `pnpm build` → Node runtime on port `4321`. The container reads the same `.env` file.

```bash
docker compose down
```

## Deploy on Render

Render builds the root `Dockerfile` and runs the standalone Astro server. Secrets must be set in the Render dashboard (they are not baked into the image). `render.yaml` declares the web service and the variable names.

Do **not** set `PORT` yourself. Render provides it (default `10000`).

1. Push this repo to GitHub.
2. In [Render](https://render.com): **New → Web Service → Connect the GitHub repo**.
3. Runtime: **Docker**. Health check path: `/`.
4. Add these **Environment** variables (same names as `.env.example`):

```
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
```

5. Deploy. Render assigns a `*.onrender.com` URL.

The schema in `src/shared/infrastructure/supabase/schema.sql` still needs to be applied in Supabase before the APIs can persist data.

## Tech stack

- Astro 7 (SSR, `@astrojs/node`)
- TypeScript
- React islands for interactive UI
- Tailwind CSS
- shadcn/ui
- Zod
- Vitest
- Supabase (Postgres)
- Cloudflare R2 (product images)
- Docker
