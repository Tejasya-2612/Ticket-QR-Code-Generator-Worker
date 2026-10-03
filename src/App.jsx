import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createTicket } from './services/tickets.js';
import { sanitizeText } from './utils/sanitize.js';

const emptyForm = { ticketNumber: '', referenceName: '', category: '', purpose: '' };
const fieldRules = {
  ticketNumber: (value) => !value ? 'Ticket number is required.' : !/^TKT-\d{4,8}$/.test(value) ? 'Use the format TKT-1234.' : '',
  referenceName: (value) => !value ? 'Customer or reference name is required.' : value.length > 80 ? 'Use 80 characters or fewer.' : '',
  category: (value) => !value ? 'Choose a category.' : '',
  purpose: (value) => !value ? 'Purpose is required.' : value.length > 240 ? 'Use 240 characters or fewer.' : '',
};
const fieldLabels = {
  ticketNumber: 'Ticket number',
  referenceName: 'Customer or reference name',
  category: 'Category',
  purpose: 'Purpose',
};

function validate(form) {
  return Object.fromEntries(Object.entries(fieldRules)
    .map(([name, rule]) => [name, rule(form[name])] )
    .filter(([, error]) => error));
}

function ticketPayload(ticket) {
  return JSON.stringify({ id: ticket.id, ticketNumber: ticket.ticketNumber });
}

export default function App() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [tickets, setTickets] = useState([]);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: sanitizeText(value, false) }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setRequestError('');
  }

  async function submitTicket(event) {
    event.preventDefault();
    const cleanForm = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, sanitizeText(value)]));
    const nextErrors = validate(cleanForm);
    setErrors(nextErrors);
    setCreatedTicket(null);
    setRequestError('');
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const ticket = await createTicket(cleanForm);
      setCreatedTicket(ticket);
      setTickets((current) => [ticket, ...current]);
      setForm(emptyForm);
      console.info('ticket.created', { ticketId: ticket.id, category: ticket.category });
    } catch {
      setRequestError('Could not create ticket. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    const formElement = document.getElementById('ticket-form');
    formElement?.requestSubmit();
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="wordmark" href="#main" aria-label="Ticket desk home">TD<span> / </span>OPERATIONS</a>
        <span className="environment">FLOOR OPERATIONS</span>
      </header>

      <div className="page" id="main">
        <div className="page-heading">
          <div>
            <p className="eyebrow">TICKET DESK <span>·</span> WORKER TOOL</p>
            <h1>Ticket QR Code Generator Worker</h1>
            <p className="intro">Create a ticket and give your team a scannable record to follow.</p>
          </div>
          <div className="shift-badge"><span className="status-dot" /> READY FOR TICKETS</div>
        </div>

        <div className="workspace">
          <section className="panel form-panel" aria-labelledby="create-heading">
            <div className="panel-heading">
              <div className="step">01</div>
              <div><h2 id="create-heading">New ticket</h2><p>Enter the details to create a trackable ticket.</p></div>
            </div>
            <form id="ticket-form" onSubmit={submitTicket} noValidate>
              {(['ticketNumber', 'referenceName', 'category', 'purpose']).map((name) => {
                const id = `field-${name}`;
                const errorId = `${id}-error`;
                return (
                  <div className={`field field-${name}`} key={name}>
                    <label htmlFor={id}>{fieldLabels[name]} <span aria-hidden="true">*</span></label>
                    {name === 'category' ? (
                      <select id={id} name={name} value={form[name]} onChange={updateField} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? errorId : undefined}>
                        <option value="">Select a category</option>
                        <option>Facilities</option><option>Guest services</option><option>Food &amp; beverage</option><option>Safety</option><option>Other</option>
                      </select>
                    ) : name === 'purpose' ? (
                      <textarea id={id} name={name} value={form[name]} onChange={updateField} maxLength={240} rows={3} placeholder="Briefly describe what needs attention" aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? errorId : undefined} />
                    ) : (
                      <input id={id} name={name} value={form[name]} onChange={updateField} maxLength={name === 'ticketNumber' ? 12 : 80} placeholder={name === 'ticketNumber' ? 'TKT-1042' : 'Name or reference'} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? errorId : undefined} />
                    )}
                    {errors[name] && <span className="field-error" id={errorId}>{errors[name]}</span>}
                  </div>
                );
              })}
              <p className="required-note">* Required fields</p>
              {requestError && <div className="request-error" role="alert"><span>{requestError}</span><button className="retry-button" type="button" onClick={retry}>Retry</button></div>}
              <button className="submit-button" type="submit" disabled={loading}>
                {loading ? 'Creating ticket…' : 'Create ticket'} <span aria-hidden="true">↗</span>
              </button>
              {loading && <p className="loading-message" role="status" aria-live="polite">Creating ticket. Please wait…</p>}
            </form>
          </section>

          <section className="panel result-panel" aria-labelledby="result-heading">
            <div className="panel-heading">
              <div className="step">02</div>
              <div><h2 id="result-heading">Ticket QR code</h2><p>Scan to identify this ticket at a glance.</p></div>
            </div>
            {createdTicket ? (
              <div className="ticket-result">
                <div className="qr-frame"><QRCodeSVG value={ticketPayload(createdTicket)} size={184} level="M" marginSize={2} title={`QR code for ticket ${createdTicket.ticketNumber}`} /></div>
                <h3>Ticket created</h3>
                <p className="result-number">{createdTicket.ticketNumber}</p>
                <dl className="ticket-details">
                  <div><dt>Reference</dt><dd>{createdTicket.referenceName}</dd></div>
                  <div><dt>Category</dt><dd>{createdTicket.category}</dd></div>
                  <div><dt>Purpose</dt><dd>{createdTicket.purpose}</dd></div>
                </dl>
              </div>
            ) : (
              <div className="result-empty"><div className="qr-placeholder" aria-hidden="true"><span>QR</span></div><p>Your ticket code will appear here.</p></div>
            )}
          </section>
        </div>

        <section className="history-section" aria-label="Ticket history" role="region">
          <div className="history-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Ticket history</h2></div><span className="count">{tickets.length.toString().padStart(2, '0')} RECORDS</span></div>
          {tickets.length === 0 ? <p className="no-data">No data found</p> : (
            <ul className="ticket-list">
              {tickets.map((ticket) => <li key={ticket.id}><span className="history-id">{ticket.ticketNumber}</span><span>{ticket.referenceName}</span><span>{ticket.category}</span><span className="open-status">OPEN</span></li>)}
            </ul>
          )}
        </section>
        <footer>INTERNAL OPERATIONS <span>·</span> TICKET WORKER</footer>
      </div>
    </main>
  );
}

