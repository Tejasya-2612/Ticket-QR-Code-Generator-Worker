# Ticket QR Code Generator Worker

A lightweight internal tool for floor staff to create structured tickets, view a QR code for each ticket, and review tickets created during the current session.

## Requirements

- Node.js 18 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually <http://localhost:5173>).

## Available commands

```bash
npm test       # Run the Vitest suite
npm run lint   # Run ESLint
npm run build  # Create a production build in dist/
```

## Using the worker

1. Enter a ticket number in the form `TKT-1042` (4–8 digits after `TKT-`).
2. Enter a customer or reference name, choose a category, and describe the purpose.
3. Select **Create ticket**. The new ticket and its QR code appear on the page, and the ticket is added to the session history.

The QR code currently contains the ticket UUID and ticket number as JSON. Ticket records are kept in memory, so they are lost when the page reloads. Analytics are simulated with a `ticket.created` console event.

## Demo request states

Ticket creation includes a short delay so the loading state can be seen. Add `?slow` to the page URL to make it take longer. To make the next create request fail, open the browser developer console and run:

```js
sessionStorage.setItem('ticketWorker.failNext', 'true')
```

Submit a ticket to see the retryable error. The form values remain available for retry.

## Architecture notes

This project demonstrates the frontend flow only; it has no API server, authentication, database, or persistent storage. The ticket service is isolated in `src/services/tickets.js` for a future API integration.

- [Proposed database schema and ERD](docs/database-schema.md)
- [REST API contracts](docs/api-contracts.md)
- [Architecture and demo behavior](docs/architecture.md)
- [Implementation prompt trace](PROMPTS.md)
