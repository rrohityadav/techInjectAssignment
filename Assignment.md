# Backend Engineer Take‑Home Assignment – **Order & Inventory Service**

> **Estimated effort:** 16–32 focused hours (2‑4 calendar days)
>
> **Stack constraints:** TypeScript 20 + Node.js 18 LTS, PostgreSQL ≥ 14, open‑source only. Use any OSS libraries **except** code generators. All infra must run locally via Docker.

---

## 1  Problem Statement

Build a **production‑ready microservice** that powers *Order & Inventory* workflows for "**Uniformship**,” an e‑commerce platform that sells uniforms, books and accessories. The service **owns**:

1. **Product Catalog API** – Manages products, their variations, raw materials, and associated inventory.
2. **Order API** – Create orders, reserve stock, update status (PLACED → PAID → DISPATCHED).
3. **Inventory Reconciliation Job** – Nightly process that tallies physical stock vs. DB, flags mismatches.
4. **Availability Webhook** – Real‑time push (HTTP POST) when a product's stock crosses custom thresholds.

Design & implement enough to **demo and test** the flows end‑to‑end (no UI needed). Treat it like a green‑field service that will later join a fleet—follow *clean architecture*, write docs, and package everything in a single Git repo.

### 1.1  Why this problem?

Each sub‑feature maps directly to the 10‑cluster grading rubric:

| #  | Feature / Artifact                                | Rubric Cluster Exercised              |
| -- | ------------------------------------------------- | ------------------------------------- |
| 1  | Typed REST/GraphQL endpoints, domain models       | **Core Programming (1)**              |
| 2  | Service diagram, ADRs, README → design trade‑offs | **Systems Design (2)**                |
| 3  | SQL schema, migrations, indices, cache policy     | **Data & Storage (3)**                |
| 4  | Jest unit + integration tests, CI badge           | **Testing & Code Quality (4)**        |
| 5  | Dockerfile, docker‑compose, GitHub Actions        | **DevOps & CI/CD (5)**                |
| 6  | JWT auth, RBAC, rate‑limit, dotenv secrets        | **Security & Reliability (6)**        |
| 7  | p95 latency budget, query optimisation, Redis     | **Performance & Scalability (7)**     |
| 8  | Reconciliation algorithm handles 1 M records      | **Problem Solving & Algorithms (8)**  |
| 9  | PR template, commit messages, DESIGN.md           | **Collaboration & Communication (9)** |
| 10 | "What I'd do next" doc, post‑mortem mindset       | **Culture & Growth Mindset (10)**    |

---

## 2  Functional Requirements

### 2.1  Product Catalog & Advanced Inventory Model

*   **Core Data Modeling & Implementation Task:**
    *   Design and implement the data models, relationships, and necessary CRUD operations (via APIs) for the following interconnected entities:
        *   **Raw Material:** Define attributes for raw materials used in production (e.g., fabric type, buttons, thread, ink). Include properties like ID, name, description, supplier information (optional), unit of measure, and current stock level.
        *   **Bill of Materials (BOM):** For each Product Variation (see below), define its BOM, specifying the type and quantity of each Raw Material required to produce one unit of that variation.
        *   **Product:** Represents a general product category or type (e.g., "School Blazer", "Math Textbook Grade 5", "Sports Water Bottle"). Attributes should include a general name, description, category, etc.
        *   **Product Variation:** Represents a specific, sellable version of a Product (e.g., "School Blazer, Navy, Size L"; "Math Textbook Grade 5, Hardcover"; "Sports Water Bottle, Blue, 750ml"). Each variation must have a unique SKU, its own price, specific attributes (like size, color, material, edition), and its own finished goods stock level. Each Product Variation should be associated with a Product and its corresponding BOM.
    *   **Stock Management:** Implement robust stock management for both Raw Materials (tracking on-hand quantities) and finished Product Variations (tracking sellable inventory). Ensure that operations like order fulfillment correctly deduct stock from Product Variations, and potentially (as a more advanced consideration for the candidate) that production of Product Variations deducts stock from Raw Materials based on the BOM.

*   **Product Catalog API Endpoints (examples, candidate to expand based on their design):**
    *   `POST /v1/products`: Create a new base Product and/or its Product Variations. This endpoint should handle the complexities of creating a product with its variations, SKUs, prices, initial stock levels for each variation, and associations with BOMs and Raw Materials (either directly or by referencing existing raw materials/BOMs).
    *   `GET /v1/products?cursor=&search=&category=&size=&color=...`: Retrieve a list of Products or Product Variations. Implement cursor-based pagination. Support fuzzy search across product names, SKUs, descriptions, and variation attributes. Allow filtering by attributes like category, availability, size, color, etc.
    *   `GET /v1/products/{productIdOrSku}`: Retrieve details for a specific base Product (which might include all its variations) or a specific Product Variation (by its unique SKU).
    *   `PATCH /v1/products/{productIdOrSku}`: Partially update details for a base Product or a specific Product Variation. Consider how updates to price, description, or attributes are handled, especially if variations have overrides.
    *   *(Candidate to design and implement additional necessary endpoints)*: Based on the data model, the candidate will need to identify and implement other crucial API endpoints. This will likely include:
        *   Endpoints for managing Raw Materials (e.g., `POST /v1/raw-materials`, `GET /v1/raw-materials`, `PATCH /v1/raw-materials/{id}/stock`).
        *   Endpoints for managing Bill of Materials (BOMs), if they are treated as separate, manageable entities (e.g., `POST /v1/boms`, `GET /v1/boms/{id}`).
        *   More granular stock update endpoints (e.g., for adjusting inventory of Product Variations or Raw Materials due to receiving shipments, manual corrections, or production runs).

### 2.2  Orders

* `POST /v1/orders` – body contains items \[{sku, qty}\].

  * Reserve stock atomically; reject if insufficient.
* `PATCH /v1/orders/:id/status` – allowed transitions enforced.
* `GET /v1/orders?cursor=&search=` – cursor-based pagination (or other suitable pagination like offset/limit) and **fuzzy search by relevant order fields (e.g., product details within the order, customer identifiers if they were part of the model, or order ID)**.

### 2.3  Inventory Reconciliation

* Nightly job loads CSV of warehouse counts (mock file).
  Returns `validRows`, `unparsedRows`, and if last row contains `{id: <ISO date>, stock: <HH:mm>}` expose it as `stockExportTime`.
* Update DB to match counts; produce a JSON report.

### 2.4  Availability Webhook

* Consumers register endpoint + threshold (`minStock`).
* When product stock falls ≤ threshold**, async worker POSTs `{sku, newStock}`.
* Retries with exponential back‑off; dead‑letter queue after 5 attempts.

### 2.5  Auth & Roles

* Two roles: **admin** (full), **seller** (read products, create orders).
* JWT, 30 min expiry, refresh token flow.

---

## 3  Non‑Functional Requirements

1.  **Clean code** (SOLID, 0 eslint errors).
2.  **100 % typed** (no `any`).
3.  **≥90 % test branch coverage**.
4.  **p95 < 120 ms** for `GET /products` on 50 K rows.
5.  **Idempotent** order creation (retry‑safe).
6.  **12‑Factor** config via `.env`.
7.  **Observability**:
    *   HTTP access logs.
    *   One custom metric (e.g., orders/sec).
    *   **Application Performance Monitoring (APM)**: Integrate an APM tool (e.g., Sentry, New Relic free tier, Datadog free tier, or any other free/open-source alternative) to monitor application performance, errors, and traces.
    *   **Comprehensive Logging**: Ensure all significant events, errors, and application lifecycle information are logged. Logs should be structured (e.g., JSON) and ideally persisted/streamed to a log management solution (even if it\'s a simple file rotation or a basic cloud-based free tier log collector for the demo).
8.  **One‑click setup**: `docker compose up` runs DB + service + Redis.
9.  **Deployment**: Deploy the application (the `app` service) to any free-tier Virtual Private Server (VPS) (e.g., AWS EC2 free tier, Google Cloud f1-micro, Oracle Cloud Free Tier, Linode, DigitalOcean, etc.). Provide access details or a public URL for testing the deployed instance.

---

## 4  Deliverables

1.  **Source repo** (GitHub/GitLab). Default branch is `main`.
2.  `README.md` with

    *   Quick‑start (`make dev`, `npm run test`).
    *   API spec (OpenAPI 3 or GraphQL SDL).
    *   Design Decisions (`DECISIONS.md` or ADRs folder).
    *   **Deployment Details**: Instructions on how to access the deployed VPS instance (URL, any necessary access notes if applicable) and a brief note on the APM tool used and how to view basic metrics/logs if possible.
3.  **Dockerfile** (multi‑stage, slim runtime) + `docker‑compose.yml`.
4.  **CI/CD Pipeline** – GitHub Actions (or similar) configured to:
    *   On every push to any branch and on pull request to `main`:
        *   Run lint → test → build stages.
    *   On push/merge to `main` branch (Conceptual/Scripted Deployment):
        *   In addition to the above, describe or script the steps that would be taken to deploy the built application to the chosen VPS. Full CI-automated deployment to a live VPS is a bonus and not strictly required if it's too time-consuming, but the process should be documented or scripted.
5.  **ERD diagram** (draw\.io/png) and sequence diagrams for **order flow and product/variation creation flow**.
6.  **POSTMORTEM.md** – what you'd improve in next iteration.
7.  Pull Request addressed to `main` including self‑review checklist.
8.  **APM Configuration**: Include any necessary configuration files or setup instructions for the chosen APM tool within the repository or `README.md`.

---

## 5  Evaluation Checklist (for your reference)

We will clone & run `npm ci && npm test` then `docker compose up`:

* All endpoints respond as per spec.
* Tests green, coverage ≥90 %.
* CI passes in your fork.
* `README` gets us running in <10 min.
* Code readability, modularity, DDD boundaries.
* Evidence of performance tuning (indexes, caching, metrics).
* Security best practices (env, JWT, helmet, rate‑limit).
* CI/CD pipeline setup and documented deployment strategy for the `main` branch.
* Clear git history (meaningful commits; no force‑push after review).

Scoring follows the **10‑cluster rubric** you read earlier. Minimum passing weighted score: **3.6 / 5**.

---

## 6  Time‑Budget Tips (total ~24 h)

| Block                    | Hours (guideline) |
| ------------------------ | ----------------- |
| Project setup, tooling   | 2 h               |
| Catalog & Order APIs     | 6 h               |
| Reconciliation job & CLI | 4 h               |
| Webhook worker           | 2 h               |
| Tests & coverage         | 4 h               |
| Docker & CI              | 2 h               |
| Docs & diagrams          | 2 h               |
| Polish & profiling       | 2 h               |

Stop wherever 24 h hits; document trade‑offs in `POSTMORTEM.md`.

---

## 7  Submission

1. Email the repository URL to **[hiring@techinject.in](mailto:hiring@techinject.in)** with subject: `Backend Take‑Home – <Your Name>`.
2. Deadline: 96 hours after receiving this prompt. Extensions granted for emergencies—just ask.

Happy coding – we look forward to reviewing your craft!
