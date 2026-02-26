/* Main site interactions:
   - Header scroll behavior
   - Nav smooth scroll
   - Reviews auto-rotate
   - FAQ accordion
   - Book form submit (demo)
*/

document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('siteHeader');
  const navLinks = document.querySelectorAll('.nav-link');

  // Header: toggle 'scrolled' class when page scrolls past hero
  const hero = document.getElementById('home');
  function checkHeader() {
    const threshold = Math.max(hero.clientHeight - 120, 50);
    if (window.scrollY > threshold) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  checkHeader();
  window.addEventListener('scroll', checkHeader);

  // Smooth scroll + active nav
  navLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
      navLinks.forEach(l=> l.classList.remove('active'));
      a.classList.add('active');
    });
  });

  // Reviews auto-rotate
    const reviews = document.querySelectorAll('.review');
    const dots = document.querySelectorAll('.review-dots .dot');
    let current = 0;

  // Function to show a review by index
    function showReview(index) { 
    reviews.forEach((review, i) => {
    review.classList.toggle('active', i === index);
    dots[i].classList.toggle('active', i === index);
    });
    current = index;
    }

  // Auto-slide every 5 seconds
    setInterval(() => {
    let next = (current + 1) % reviews.length;
    showReview(next);
    }, 5000);

  // Click on dots to go to specific review
    dots.forEach(dot => {
    dot.addEventListener('click', () => {
    const index = parseInt(dot.getAttribute('data-index'));
    showReview(index);
    });
  });

// FAQ Accordion Toggle
document.querySelectorAll('.faq-item').forEach(item => {
  const question = item.querySelector('.faq-question');
  question.addEventListener('click', () => {
    // Optionally close others if you want only one open at a time
    document.querySelectorAll('.faq-item').forEach(i => {
      if(i !== item) i.classList.remove('active');
    });

    // Toggle current
    item.classList.toggle('active');
  });
});

  // Book form submit (demo: sends JSON to /book or shows success locally)
  const bookForm = document.getElementById('bookForm');
  const bookStatus = document.getElementById('bookStatus');
  if (bookForm) {
    bookForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      bookStatus.textContent = 'Submitting...';
      const data = {
        name: document.getElementById('b_name').value.trim(),
        phone: document.getElementById('b_phone').value.trim(),
        email: document.getElementById('b_email').value.trim(),
        service: document.getElementById('b_service').value,
        message: document.getElementById('b_message').value.trim(),
        createdAt: new Date().toISOString()
      };

      try {
        // Attempt to post to backend endpoint /book (if available)
        const res = await fetch('/book', {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)
        });
        if (res.ok) {
          bookStatus.textContent = 'Request submitted — we will contact you soon.';
          bookForm.reset();
        } else {
          // fallback if backend not present
          console.warn('No /book handler; falling back to local success.');
          bookStatus.textContent = 'Request received (demo). We will contact you shortly.';
          bookForm.reset();
        }
      } catch (err) {
        console.warn('Book endpoint not available:', err);
        bookStatus.textContent = 'Request received (demo). We will contact you shortly.';
        bookForm.reset();
      }

      setTimeout(()=> bookStatus.textContent = '', 6000);
    });
  }
});
