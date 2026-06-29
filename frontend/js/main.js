/* =============================================
   ARATI PRECISION INDUSTRIES — main.js
   Premium Orange & Charcoal Theme
   Vanilla JS — No frameworks
   ============================================= */

'use strict';

/* ============================================================
   API BASE URL — auto-switches between local and production
   ============================================================ */
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : 'https://arati-precision-backend.onrender.com';  // ← update after Render deploy

/* ============================================================
   NAVBAR — scroll effect, hamburger, active links
   ============================================================ */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
const navLinkEls = document.querySelectorAll('.nav-link');

/* Scroll handler: scrolled class + active link + back-to-top */
window.addEventListener('scroll', () => {
  const sy = window.scrollY;
  navbar.classList.toggle('scrolled', sy > 60);
  updateActiveNav();
  handleBackToTop();
  handleParallax(sy);
}, { passive: true });

/* Hamburger toggle */
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('open');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
});

/* Close menu when nav link clicked */
navLinkEls.forEach(link => {
  link.addEventListener('click', closeMenu);
});

/* Close on outside click */
document.addEventListener('click', (e) => {
  if (!navbar.contains(e.target) && navLinks.classList.contains('open')) closeMenu();
});

function closeMenu() {
  hamburger.classList.remove('active');
  navLinks.classList.remove('open');
  document.body.style.overflow = '';
}

/* Active nav link on scroll */
const sections = document.querySelectorAll('section[id]');

function updateActiveNav() {
  const scrollPos = window.scrollY + 120;
  sections.forEach(sec => {
    const top    = sec.offsetTop;
    const bottom = top + sec.offsetHeight;
    const id     = sec.getAttribute('id');
    const link   = document.querySelector(`.nav-link[href="#${id}"]`);
    if (link) {
      link.classList.toggle('active', scrollPos >= top && scrollPos < bottom);
    }
  });
}

/* ============================================================
   BACK TO TOP
   ============================================================ */
const backToTop = document.getElementById('backToTop');

function handleBackToTop() {
  backToTop.classList.toggle('visible', window.scrollY > 400);
}

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ============================================================
   SMOOTH SCROLL for anchor links
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 72;
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ============================================================
   SCROLL ANIMATIONS — IntersectionObserver with stagger
   ============================================================ */
const animateEls = document.querySelectorAll('[data-animate]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const parent   = entry.target.parentElement;
    const siblings = parent ? [...parent.querySelectorAll('[data-animate]')] : [];
    const idx      = siblings.indexOf(entry.target);
    const delay    = idx * 90;
    setTimeout(() => entry.target.classList.add('visible'), delay);
    observer.unobserve(entry.target);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

animateEls.forEach(el => observer.observe(el));

/* ============================================================
   COUNTER ANIMATION — count-up on scroll into view
   ============================================================ */
const statNumbers = document.querySelectorAll('.stat-number[data-target]');

function animateCounter(el) {
  const target   = parseInt(el.getAttribute('data-target'), 10);
  const duration = 1800;
  const step     = 14;
  const increment = (target / duration) * step;
  let current    = 0;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current).toLocaleString();
  }, step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

statNumbers.forEach(el => counterObserver.observe(el));

/* ============================================================
   HERO CANVAS — Orange floating particles
   ============================================================ */
(function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); initParticles(); }, { passive: true });

  const COLORS = [
    'rgba(242,101,34,',
    'rgba(255,140,66,',
    'rgba(255,255,255,',
    'rgba(200,150,100,',
  ];

  class Particle {
    constructor() { this.reset(true); }
    reset(initial) {
      this.x        = Math.random() * W;
      this.y        = initial ? Math.random() * H : H + 12;
      this.r        = Math.random() * 2.2 + 0.4;
      this.vy       = -(Math.random() * 0.55 + 0.18);
      this.vx       = (Math.random() - 0.5) * 0.28;
      this.alpha    = 0;
      this.maxAlpha = Math.random() * 0.45 + 0.08;
      this.fadeIn   = true;
      this.color    = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.fadeIn) {
        this.alpha += 0.008;
        if (this.alpha >= this.maxAlpha) this.fadeIn = false;
      } else {
        this.alpha -= 0.003;
      }
      if (this.alpha <= 0 || this.y < -12) this.reset(false);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color + this.alpha + ')';
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    const count = Math.min(Math.floor((W * H) / 7000), 120);
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }
  initParticles();

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ============================================================
   PRODUCT CARD — 3D tilt on mousemove
   ============================================================ */
document.querySelectorAll('.product-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    const cx   = rect.width  / 2;
    const cy   = rect.height / 2;
    const rotX = ((y - cy) / cy) * -6;
    const rotY = ((x - cx) / cx) *  6;
    card.style.transform = `translateY(-10px) perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ============================================================
   GALLERY CARD — shimmer sweep on hover
   ============================================================ */
document.querySelectorAll('.gallery-card').forEach(card => {
  const shimmer = document.createElement('div');
  shimmer.style.cssText = [
    'position:absolute',
    'top:0',
    'left:-100%',
    'width:60%',
    'height:100%',
    'background:linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%)',
    'pointer-events:none',
    'transition:left 0.55s ease',
    'z-index:5',
  ].join(';');
  card.style.position = 'relative';
  card.appendChild(shimmer);
  card.addEventListener('mouseenter', () => { shimmer.style.left = '150%'; });
  card.addEventListener('mouseleave', () => { shimmer.style.left = '-100%'; });
});

/* ============================================================
   PARALLAX — hero bg gear subtle on scroll
   ============================================================ */
function handleParallax(sy) {
  const heroBgGear = document.querySelector('.hero-bg-gear');
  if (heroBgGear && sy < window.innerHeight) {
    // Gear rotation is CSS keyframe; add slight Y translate on scroll
    heroBgGear.style.marginTop = sy * 0.18 + 'px';
  }
}

/* ============================================================
   PRODUCTS SECTION stagger entrance
   ============================================================ */
const productObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const cards = entry.target.querySelectorAll('.product-card');
      cards.forEach((card, i) => {
        card.style.transitionDelay = `${i * 80}ms`;
        card.classList.add('visible');
      });
      productObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.05 });

const productsGrid = document.querySelector('.products-grid');
if (productsGrid) productObserver.observe(productsGrid);

/* ============================================================
   CONTACT FORM — Validation + fetch POST
   ============================================================ */
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

function showError(fieldId, errorId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(errorId);
  if (field) field.classList.add('error');
  if (error) error.textContent = message;
}

function clearError(fieldId, errorId) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(errorId);
  if (field) field.classList.remove('error');
  if (error) error.textContent = '';
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (contactForm) {
  ['name', 'email', 'subject', 'message'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input',  () => clearError(id, id + 'Error'));
      el.addEventListener('change', () => clearError(id, id + 'Error'));
    }
  });

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    let valid = true;

    const name    = document.getElementById('name');
    const email   = document.getElementById('email');
    const subject = document.getElementById('subject');
    const message = document.getElementById('message');

    ['name', 'email', 'subject', 'message'].forEach(id => clearError(id, id + 'Error'));

    if (!name.value.trim()) {
      showError('name', 'nameError', 'Please enter your full name.');
      valid = false;
    }
    if (!email.value.trim()) {
      showError('email', 'emailError', 'Please enter your email address.');
      valid = false;
    } else if (!validateEmail(email.value.trim())) {
      showError('email', 'emailError', 'Please enter a valid email address.');
      valid = false;
    }
    if (!subject.value) {
      showError('subject', 'subjectError', 'Please select a product of interest.');
      valid = false;
    }
    if (!message.value.trim() || message.value.trim().length < 10) {
      showError('message', 'messageError', 'Please enter a message (at least 10 characters).');
      valid = false;
    }

    if (!valid) return;

    const btn     = contactForm.querySelector('.btn-submit');
    const btnText = btn.querySelector('.btn-text');
    btn.disabled  = true;
    btnText.textContent = 'Sending...';

    const payload = {
      name:    name.value.trim(),
      email:   email.value.trim(),
      phone:   (document.getElementById('phone')?.value || '').trim(),
      subject: subject.value,
      message: message.value.trim(),
    };

    fetch(`${API_BASE}/api/enquiry`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          formSuccess.classList.add('show');
          contactForm.reset();
          setTimeout(() => formSuccess.classList.remove('show'), 5000);
        } else if (res.status === 422 && data.errors) {
          Object.entries(data.errors).forEach(([field, msg]) => {
            showError(field, field + 'Error', msg);
          });
        } else {
          alert(data.message || 'Something went wrong. Please try again.');
        }
      })
      .catch((err) => {
        console.error('Network error:', err);
        alert('Could not reach the server. Please check your connection or try again later.');
      })
      .finally(() => {
        btn.disabled = false;
        btnText.textContent = 'Send Enquiry';
      });
  });
}

/* ============================================================
   INIT
   ============================================================ */
updateActiveNav();
handleBackToTop();

console.log('%cARATI PRECISION INDUSTRIES', 'color:#f26522;font-size:18px;font-weight:bold;font-family:sans-serif;');
console.log('%cPrecision Engineering Excellence', 'color:#888;font-size:12px;font-family:sans-serif;');
