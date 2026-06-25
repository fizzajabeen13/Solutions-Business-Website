/* Chat UI + backend integration (if available)
   - toggles chatbox
   - sends message to /chat backend (POST {message})
   - if backend unavailable, uses a small local fallback
*/

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('chatbot-toggle');
  const box = document.getElementById('chatbot-box');
  const closeBtn = document.getElementById('chatbot-close');
  const sendBtn = document.getElementById('chatbot-send');
  const input = document.getElementById('chatbot-input');
  const messages = document.getElementById('chatbot-messages');

  function openChat() { box.style.display = 'flex'; box.setAttribute('aria-hidden','false'); input.focus(); }
  function closeChat(){ box.style.display = 'none'; box.setAttribute('aria-hidden','true'); }

  toggle.addEventListener('click', () => {
    if (box.style.display === 'flex') closeChat(); else openChat();
  });
  closeBtn.addEventListener('click', closeChat);

  function append(sender, text) {
    const el = document.createElement('div');
    el.className = 'chat-line';
    el.innerHTML = `<strong>${sender}:</strong> <span>${escapeHtml(text)}</span>`;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  // Escape HTML to avoid injection
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // fallback simple bot
  function localBotAnswer(msg) {
    const m = msg.toLowerCase();
    if (m.includes('hi') || m.includes('hello')) return 'Hello! How can I help with HVAC or construction services today?';
    if (m.includes('price') || m.includes('cost') || m.includes('estimate')) return 'Pricing depends on project scope — please request a site visit via Book Now for an accurate quote.';
    if (m.includes('service') || m.includes('install') || m.includes('maintenance')) return 'We offer installation, maintenance, and emergency repair — which service do you need?';
    if (m.includes('contact') || m.includes('phone')) return 'You can reach us at +92-300-1234567 or email info@solutionshvac.com.';
    if (m.includes('thanks') || m.includes('thank')) return 'You’re welcome — happy to help!';
    return "I can help with services, booking, and contact info. If you want detailed answers, we can connect to our support team.";
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    append('You', text);
    input.value = '';
    append('Bot', 'Thinking...');

    // Try backend first
    try {
      const res = await fetch('/chat', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({message: text})
      });
      if (res.ok) {
        const data = await res.json();
        // replace last "Thinking..." with actual
        messages.lastChild.innerHTML = `<strong>Bot:</strong> <span>${escapeHtml(data.reply || data.replyText || data.message || '')}</span>`;
      } else {
        messages.lastChild.innerHTML = `<strong>Bot:</strong> <span>${escapeHtml(localBotAnswer(text))}</span>`;
      }
    } catch (err) {
      // fallback
      messages.lastChild.innerHTML = `<strong>Bot:</strong> <span>${escapeHtml(localBotAnswer(text))}</span>`;
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e)=> { if (e.key === 'Enter') sendMessage(); });

  // show greeting
  append('Bot', 'Hello 👋 — ask me about services, projects, or book a visit.');
});
