# Payments Service - Take Home

Node.js backend for MoMo charge requests. Supports multiple providers, idempotency, durability, and async processing.

---

## Features
- **Initiate Charges:** `POST /charges` with `requestId`, `amount`, `phoneNumber`, `currency`, `provider`.
- **Check Status:** `GET /charges/:requestId` returns `PENDING`, `SUCCESSFUL`, or `FAILED`.
- **Webhook & Polling:** Supports ProviderAlpha (webhook) and ProviderBeta (polling with exponential backoff).
- **Idempotency:** Prevents duplicate charges using `requestId`.
- **Persistence:** SQLite (`better-sqlite3`) ensures durability across restarts.
- **Extensibility:** Add new providers via a class and registration; no changes to routes or worker logic needed.
- **Validation & Logging:** Inputs are validated; key events are logged for observability.

---

## Folder Structure
src/
├── index.js # Main server
├── db.js # SQLite database setup
├── queue.js # Async job queue
├── routes/
│ ├── charges.js # Charge endpoints
│ └── webhooks.js # Webhook endpoints
├── services/
│ └── chargeService.js # Business logic for charges
└── workers/
└── chargeWorker.js # Async worker processing queued jobs
stubs/
├── provider-alpha.js
├── provider-beta.js
stubs/tests/
└── idempotency.test.js


---

## Running Locally

```bash
# Install dependencies
npm install

# Run stub servers
WEBHOOK_URL=http://localhost:3000/webhooks/provider-alpha node stubs/provider-alpha.js
node stubs/provider-beta.js

# Run the payments service
node src/index.js
```


## API Endpoints

### POST /charges

Initiates a new charge request. The request is enqueued for asynchronous processing and returns immediately while the provider call is handled in the background.

**Request Body**

```json
{
  "requestId": "string",
  "amount": 100,
  "phoneNumber": "+254700000000",
  "currency": "KES",
  "provider": "PROVIDER_ALPHA"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `requestId` | string | ✅ | Unique idempotency key for this charge |
| `amount` | number | ✅ | Charge amount in the specified currency |
| `phoneNumber` | string | ✅ | E.164 formatted phone number |
| `currency` | string | ✅ | ISO 4217 currency code (e.g. `KES`) |
| `provider` | enum | ✅ | `PROVIDER_ALPHA` \| `PROVIDER_BETA` |

**Response** — `202 Accepted`

```json
{
  "requestId": "string",
  "status": "PENDING"
}
```

---

### GET /charges/:requestId

Retrieves the current state of a charge. Use this to poll for status updates when a webhook has not yet been received.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `requestId` | string | The unique ID of the charge to retrieve |

**Response** — `200 OK`

```json
{
  "requestId": "string",
  "amount": 100,
  "phoneNumber": "+254700000000",
  "currency": "KES",
  "provider": "PROVIDER_ALPHA",
  "status": "PENDING"
}
```

**Status Values**

| Status | Description |
|---|---|
| `PENDING` | Charge has been queued, not yet sent to provider |
| `PROCESSING` | Charge has been submitted to the provider |
| `SUCCESSFUL` | Provider confirmed the charge succeeded |
| `FAILED` | Provider reported a failure or processing timed out |

---

### POST /webhooks/provider-alpha

Receives an inbound status callback from Provider Alpha and updates the corresponding charge record.

**Request Body**

```json
{
  "providerRef": "string",
  "status": "SUCCESSFUL"
}
```

| Field | Type | Description |
|---|---|---|
| `providerRef` | string | Provider's internal reference for the transaction |
| `status` | enum | `SUCCESSFUL` \| `FAILED` |

**Response** — `200 OK`

```json
{
  "received": true
}
```

---

## Key Design Decisions

- **Async Worker Queue** — Ensures HTTP responses return in under 300ms while provider calls that take 10–30s are processed in the background. Jobs are enqueued and handled asynchronously.

- **Persistence** — SQLite ensures durability so data survives process restarts. No in-memory-only state is used.

- **Idempotency** — Every request is checked against `requestId` before creating a charge to prevent duplicate transactions.

- **Extensibility** — Providers implement a common class interface and are dynamically registered. Adding a new provider only requires creating the class and registering it — routes and worker logic remain unchanged.

- **Polling & Backoff** — Providers without webhook support (e.g. ProviderBeta) are polled using exponential backoff to avoid overwhelming the provider API.

- **Validation & Logging** — All input fields (`requestId`, `amount`, `phoneNumber`, `currency`, `provider`) are validated on ingestion. Key events such as charge initiation, worker processing, and webhook handling are logged.

---

## Testing

Uses the Node.js built-in `test` module. Covers sequential requests to verify idempotency behaviour.

```bash
node --test stubs/tests
```

---

## Possible Improvements

- Switch to PostgreSQL or another production-grade database for better scalability.
- Add structured logging (e.g. Winston) and a retry queue for failed webhook deliveries.
- Add TypeScript, authentication, rate limiting, monitoring, and API versioning.
- Implement provider failure handling and alerting for offline providers.
- More comprehensive input validation (regex phone number patterns, ISO currency code checks).