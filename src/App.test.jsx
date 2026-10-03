import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { createTicket } from './services/tickets.js';

vi.mock('./services/tickets.js', () => ({
  createTicket: vi.fn(),
  listTickets: vi.fn(async () => []),
}));

const validTicket = {
  ticketNumber: 'TKT-1042',
  referenceName: 'Riley Chen',
  category: 'Facilities',
  purpose: 'Replace lobby light',
};

async function fillForm(user, ticket = validTicket) {
  await user.type(screen.getByLabelText(/ticket number/i), ticket.ticketNumber);
  await user.type(screen.getByLabelText(/customer or reference name/i), ticket.referenceName);
  await user.selectOptions(screen.getByLabelText(/category/i), ticket.category);
  await user.type(screen.getByLabelText(/purpose/i), ticket.purpose);
}

describe('Ticket QR Code Generator Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createTicket.mockImplementation(async (input) => ({
      ...input,
      id: 'ticket-1',
      status: 'open',
      createdAt: '2026-09-30T10:00:00.000Z',
    }));
  });

  it('renders the tool and explicit empty history state', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /ticket qr code generator worker/i })).toBeInTheDocument();
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('prevents empty submission and associates errors with fields', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /create ticket/i }));
    expect(await screen.findByText(/ticket number is required/i)).toBeInTheDocument();
    expect(createTicket).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/ticket number/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('rejects malformed ticket identifiers and displays a useful field error', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fillForm(user, { ...validTicket, ticketNumber: 'wrong format' });
    await user.click(screen.getByRole('button', { name: /create ticket/i }));
    expect(await screen.findByText(/use the format tkt-1234/i)).toBeInTheDocument();
    expect(createTicket).not.toHaveBeenCalled();
  });

  it('creates a structured ticket, displays its QR code and logs analytics', async () => {
    const user = userEvent.setup();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    render(<App />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create ticket/i }));
    expect(await screen.findByRole('heading', { name: /ticket created/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /qr code for ticket tkt-1042/i })).toBeInTheDocument();
    expect(createTicket).toHaveBeenCalledWith(expect.objectContaining({
      ticketNumber: 'TKT-1042', referenceName: 'Riley Chen', category: 'Facilities', purpose: 'Replace lobby light',
    }));
    expect(screen.getAllByText('TKT-1042')).toHaveLength(2);
    expect(info).toHaveBeenCalledWith('ticket.created', expect.objectContaining({ ticketId: 'ticket-1' }));
    info.mockRestore();
  });

  it('shows an accessible loading state during ticket creation', async () => {
    let finish;
    createTicket.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    render(<App />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create ticket/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/creating ticket/i);
    finish({ ...validTicket, id: 'ticket-1', status: 'open', createdAt: '2026-09-30T10:00:00Z' });
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });

  it('shows a failure message and retries a failed request', async () => {
    createTicket.mockRejectedValueOnce(new Error('Network unavailable'));
    const user = userEvent.setup();
    render(<App />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create ticket/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not create ticket/i);
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(await screen.findByRole('heading', { name: /ticket created/i })).toBeInTheDocument();
    expect(createTicket).toHaveBeenCalledTimes(2);
  });

  it('trims and sanitizes user text before submitting it', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fillForm(user, { ...validTicket, referenceName: '  <script>alert("xss")</script> Riley  ' });
    await user.click(screen.getByRole('button', { name: /create ticket/i }));
    await screen.findByRole('heading', { name: /ticket created/i });
    expect(createTicket).toHaveBeenCalledWith(expect.objectContaining({ referenceName: 'alert("xss") Riley' }));
    expect(document.querySelector('script')).toBeNull();
  });

  it('adds the new ticket to the history list', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create ticket/i }));
    const history = screen.getByRole('region', { name: /ticket history/i });
    expect(await within(history).findByText('TKT-1042')).toBeInTheDocument();
  });
});


