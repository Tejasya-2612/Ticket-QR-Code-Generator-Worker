const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const tickets = [];

export async function createTicket(input) {
  const isSlow = new URLSearchParams(window.location.search).has('slow');
  await wait(isSlow ? 1800 : 450);

  if (sessionStorage.getItem('ticketWorker.failNext') === 'true') {
    sessionStorage.removeItem('ticketWorker.failNext');
    throw new Error('Network unavailable');
  }

  const now = new Date().toISOString();
  const ticket = {
    id: globalThis.crypto?.randomUUID?.() ?? `ticket-${Date.now()}`,
    ...input,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
  tickets.unshift(ticket);
  return ticket;
}

export async function listTickets() {
  await wait(150);
  return [...tickets];
}
