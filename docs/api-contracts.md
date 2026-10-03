# API contracts

All routes are versioned under `/api`. JSON requests and responses use UTF-8. Authentication is assumed to be provided by the internal identity layer; `created_by` is derived from that authenticated identity.

## Common response envelope

Success: `{ "success": true, "data": ... }` (list endpoints also return `meta`).

Error: `{ "success": false, "error": { "code": "...", "message": "...", "fields": {} } }`. `fields` is omitted unless a validation error applies.

Ticket object:

```json
{
  "id": "0fe3a4b7-85b2-4e0c-99c2-dd7b1b7613f9",
  "ticketNumber": "TKT-1042",
  "referenceName": "Riley Chen",
  "purpose": "Replace lobby light",
  "category": "Facilities",
  "status": "open",
  "createdBy": "b2e83922-8daf-4cdc-bf5a-df12a64ac250",
  "createdAt": "2026-09-30T10:00:00Z",
  "updatedAt": "2026-09-30T10:00:00Z",
  "resolvedAt": null
}
```

## `POST /api/tickets`

Create a ticket. Required body properties: `ticketNumber`, `referenceName`, `purpose`, `category`. `createdBy`, `id`, status, and timestamps are server generated.

```json
{
  "ticketNumber": "TKT-1042",
  "referenceName": "Riley Chen",
  "purpose": "Replace lobby light",
  "category": "Facilities"
}
```

`201`: `{ "success": true, "data": { /* ticket */ } }`. `400 VALIDATION_ERROR` has a field map, `401 UNAUTHENTICATED`, `409 TICKET_NUMBER_EXISTS`, `422 INVALID_CATEGORY`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR`, `503 SERVICE_UNAVAILABLE`.

## `GET /api/tickets`

Query: `limit` (default 25, max 100), `cursor` (opaque pagination token), `status` (optional enum), `category` (optional enum). Results sorted newest first by `(createdAt, id)`.

`200`: `{ "success": true, "data": [/* tickets */], "meta": { "nextCursor": null } }`. `400 INVALID_QUERY`, `401 UNAUTHENTICATED`, `500 INTERNAL_ERROR`, `503 SERVICE_UNAVAILABLE`.

## `GET /api/tickets/:id`

Path `id` is a UUID. `200`: `{ "success": true, "data": { /* ticket */ } }`. `400 INVALID_ID`, `401 UNAUTHENTICATED`, `404 TICKET_NOT_FOUND`, `500 INTERNAL_ERROR`, `503 SERVICE_UNAVAILABLE`.

## `PATCH /api/tickets/:id`

Partial update; accepts one or more of `referenceName`, `purpose`, `category`, `status`. Ticket number and creator are immutable. An update creates a corresponding `ticket_events` row in the same transaction.

```json
{ "status": "in_progress" }
```

`200`: `{ "success": true, "data": { /* updated ticket */ } }`. `400 VALIDATION_ERROR` / `INVALID_ID`, `401 UNAUTHENTICATED`, `404 TICKET_NOT_FOUND`, `409 INVALID_STATUS_TRANSITION`, `422 INVALID_CATEGORY`, `500 INTERNAL_ERROR`, `503 SERVICE_UNAVAILABLE`.

## `DELETE /api/tickets/:id`

Soft delete is preferred in production: transition to `cancelled` and append a `deleted`/cancellation event. The prototype contract uses `204 No Content` for successful removal. `400 INVALID_ID`, `401 UNAUTHENTICATED`, `404 TICKET_NOT_FOUND`, `409 TICKET_NOT_DELETABLE`, `500 INTERNAL_ERROR`, `503 SERVICE_UNAVAILABLE`.

## Validation rules

- Trim leading/trailing whitespace and reject empty required values.
- Ticket number: uppercase `TKT-` plus 4–8 digits; unique.
- Reference name: 1–80 characters after trim; plain text only.
- Purpose: 1–240 characters after trim; plain text only.
- Category: `Facilities`, `Guest services`, `Food & beverage`, `Safety`, or `Other`.
- Status: `open`, `in_progress`, `resolved`, or `cancelled`; enforce allowed transitions server side.
- Reject unknown keys on create/update. Encode output as JSON and never interpret text as HTML.
- The backend repeats validation; client-side validation is for fast feedback, never the trust boundary.

## Error handling

Map validation failures to `400` with field messages. Use `409` for unique conflicts/state conflicts, `404` for absent records, `401/403` for identity/authorization, and `5xx` for infrastructure failures. Do not return SQL, stack traces, or secrets. Include a request/correlation ID in server logs and responses; logs omit customer-entered content unless operationally necessary. Clients show a useful retryable message for network/5xx failures and preserve form values.
