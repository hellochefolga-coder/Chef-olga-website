// ── Nav toggle ────────────────────────────────────────────────────────────────
(function () {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#site-nav')) {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    }
  });
})();

// ── Video scroll scrubbing ─────────────────────────────────────────────────────
const videoSequences = [
  {
    videoEl: document.getElementById('sequence-video'),
    section: document.querySelector('.scroll-section'),
  },
  {
    videoEl: document.getElementById('chef-olga-video'),
    section: document.querySelector('#about'),
  },
];

function getScrollProgress(section) {
  if (!section) return 0;
  const rect = section.getBoundingClientRect();
  const totalScrollable = Math.max(1, section.offsetHeight - window.innerHeight);
  const distanceScrolled = Math.min(Math.max(-rect.top, 0), totalScrollable);
  return distanceScrolled / totalScrollable;
}

function initVideoScrub(seq) {
  const { videoEl, section } = seq;
  if (!videoEl || !section) return;

  videoEl.pause();

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      if (videoEl.readyState >= 1) {
        const progress = getScrollProgress(section);
        videoEl.currentTime = progress * videoEl.duration;
      }
      ticking = false;
    });
  }

  videoEl.addEventListener('loadedmetadata', () => {
    videoEl.currentTime = 0;
  });

  window.addEventListener('scroll', onScroll, { passive: true });
}

videoSequences.forEach(initVideoScrub);

function initWobbleText() {
  const el = document.querySelector('.wobble-text');
  if (!el) return;

  const text = el.textContent.trim();
  const words = text.split(/\s+/);

  el.innerHTML = words.map((word, i) =>
    `<span class="wobble-word" style="display:inline-block;transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1) ${i * 18}ms,color 0.3s ease;">${word}</span>`
  ).join(' ');

  el.querySelectorAll('.wobble-word').forEach(word => {
    word.addEventListener('mouseenter', () => {
      word.style.transform = 'translateY(-6px) rotate(-1.5deg)';
    });
    word.addEventListener('mouseleave', () => {
      word.style.transform = 'translateY(0) rotate(0deg)';
    });
  });
}

window.addEventListener('load', () => setTimeout(initWobbleText, 300));

// ── Services & Pricing → Enquiries pre-fill ───────────────────────────────────
function goToEnquiries(serviceValue) {
  const serviceSelect = document.querySelector('select[name="service"]');
  const enquiriesSection = document.getElementById('enquiries');

  if (serviceSelect && serviceValue) {
    serviceSelect.value = serviceValue;
  }

  if (enquiriesSection) {
    enquiriesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

document.querySelectorAll('.services-list-item[data-service]').forEach(item => {
  item.addEventListener('click', () => goToEnquiries(item.dataset.service));
});

document.querySelectorAll('.pricing-card-cta[data-service]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    goToEnquiries(btn.dataset.service);
  });
});

// ── Enquiry form spam protection ──────────────────────────────────────────────
(function () {
  const form = document.querySelector('.enquiries-form');
  if (!form) return;

  const STORAGE_KEY = 'enquiry_count';
  const MAX_SUBMISSIONS = 2;
  const URL_PATTERN = /https?:\/\/|www\.|<[^>]+>|javascript:/i;

  form.addEventListener('submit', function (e) {
    const textFields = form.querySelectorAll('input[type="text"], input[type="email"], textarea');
    for (const field of textFields) {
      if (URL_PATTERN.test(field.value)) {
        e.preventDefault();
        field.setCustomValidity('Links and HTML are not allowed.');
        field.reportValidity();
        return;
      }
      field.setCustomValidity('');
    }

    const count = parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);
    if (count >= MAX_SUBMISSIONS) {
      e.preventDefault();
      const msg = form.querySelector('.enquiries-spam-msg') || document.createElement('p');
      msg.className = 'enquiries-spam-msg';
      msg.textContent = 'Maximum submissions reached. Please contact us directly.';
      msg.style.cssText = 'color:#1b1612;font-size:0.85rem;margin-top:8px;';
      if (!form.querySelector('.enquiries-spam-msg')) form.appendChild(msg);
      return;
    }

    sessionStorage.setItem(STORAGE_KEY, count + 1);
  });
})();
