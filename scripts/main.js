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

// ── Sequence canvas (table animation — 40 frames, smooth lerp) ────────────────
(function () {
  const canvas = document.getElementById('sequence-canvas');
  const section = document.querySelector('.scroll-section');
  if (!canvas || !section) return;

  const ctx = canvas.getContext('2d');
  const FRAME_COUNT = 40;
  const images = new Array(FRAME_COUNT);
  let allLoaded = false;
  let targetFrame = 0;
  let displayFrame = 0;
  let rafId = null;

  function resize() {
    const pr = window.devicePixelRatio || 1;
    const { width, height } = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.round(width * pr);
    canvas.height = Math.round(height * pr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(pr, 0, 0, pr, 0, 0);
    draw(Math.round(displayFrame));
  }

  function draw(index) {
    const img = images[index];
    if (!img) return;
    const pr = window.devicePixelRatio || 1;
    const dw = canvas.width / pr;
    const dh = canvas.height / pr;
    const ia = img.naturalWidth / img.naturalHeight;
    const ca = dw / dh;
    let w, h;
    if (ia > ca) { h = dh; w = dh * ia; } else { w = dw; h = dw / ia; }
    const isMobile = window.innerWidth <= 720;
    const x = isMobile ? -(w * 0.10) : (dw - w) / 2;
    const y = isMobile ? -(h - dh) * 0.85 : (dh - h) / 2;
    ctx.clearRect(0, 0, dw, dh);
    ctx.drawImage(img, x, y, w, h);
  }

  function getTargetFrame() {
    const rect = section.getBoundingClientRect();
    const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
    return progress * (FRAME_COUNT - 1);
  }

  function tick() {
    targetFrame = getTargetFrame();
    // Smooth lerp toward target — feels buttery at any scroll speed
    displayFrame += (targetFrame - displayFrame) * 0.18;
    const idx = Math.round(displayFrame);
    draw(idx);
    if (Math.abs(targetFrame - displayFrame) > 0.01) {
      rafId = requestAnimationFrame(tick);
    } else {
      displayFrame = targetFrame;
      draw(Math.round(displayFrame));
      rafId = null;
    }
  }

  function onScroll() {
    if (!allLoaded) return;
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  // Preload + decode all frames in parallel for instant scroll response
  Promise.all(
    Array.from({ length: FRAME_COUNT }, (_, i) => {
      const img = new Image();
      img.src = `assets/frames/sequence/frame_${String(i + 1).padStart(4, '0')}.webp`;
      images[i] = img;
      return (img.decode ? img.decode() : new Promise(r => { img.onload = r; img.onerror = r; }))
        .catch(() => {});
    })
  ).then(() => {
    allLoaded = true;
    resize();
  });

  // Show first frame ASAP even before all loaded
  images[0] = new Image();
  images[0].onload = () => resize();
  images[0].src = 'assets/frames/sequence/frame_0001.webp';

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize);
  window.addEventListener('load', resize);
})();

// ── Chef Olga canvas (2 frames — toggle on scroll) ────────────────────────────
(function () {
  const canvas = document.getElementById('chef-olga-canvas');
  const section = document.querySelector('#about');
  if (!canvas || !section) return;

  const ctx = canvas.getContext('2d');
  const images = [new Image(), new Image()];
  let loadedCount = 0;
  let currentIndex = 0;
  let lastScrollY = window.scrollY;
  let scrollAccumulator = 0;
  let ticking = false;

  function resize() {
    const pr = window.devicePixelRatio || 1;
    const { width, height } = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.round(width * pr);
    canvas.height = Math.round(height * pr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(pr, 0, 0, pr, 0, 0);
    draw(currentIndex);
  }

  function draw(index) {
    const img = images[index];
    if (!img || !img.complete || !img.naturalWidth) return;
    const pr = window.devicePixelRatio || 1;
    const dw = canvas.width / pr;
    const dh = canvas.height / pr;
    const ia = img.naturalWidth / img.naturalHeight;
    const ca = dw / dh;
    let w, h;
    if (ia > ca) { h = dh; w = dh * ia; } else { w = dw; h = dw / ia; }
    const isMobile = window.innerWidth <= 720;
    const x = isMobile ? -(w * 0.07) : (dw - w) / 2;
    const y = isMobile ? -(h - dh) * 0.85 : (dh - h) / 2;
    ctx.clearRect(0, 0, dw, dh);
    ctx.drawImage(img, x, y, w, h);
  }

  function isSectionVisible() {
    const rect = section.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (isSectionVisible()) {
        const delta = window.scrollY - lastScrollY;
        scrollAccumulator += Math.abs(delta);
        while (scrollAccumulator >= 24) {
          currentIndex = currentIndex === 0 ? 1 : 0;
          draw(currentIndex);
          scrollAccumulator -= 24;
        }
      } else {
        scrollAccumulator = 0;
      }
      lastScrollY = window.scrollY;
      ticking = false;
    });
  }

  images[0].src = 'assets/frames/chef-olga/frame_0001.webp';
  images[1].src = 'assets/frames/chef-olga/frame_0002.webp';
  images.forEach(img => { img.onload = () => { loadedCount++; if (loadedCount === 1) resize(); }; });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize);
  window.addEventListener('load', resize);
})();

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
