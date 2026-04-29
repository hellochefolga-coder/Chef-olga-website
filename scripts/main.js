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

const FRAME_EXTENSION = '.webp';

const sequences = [
  {
    canvas: document.getElementById('sequence-canvas'),
    section: document.querySelector('.scroll-section'),
    statusElement: document.getElementById('sequence-status'),
    framePath: 'assets/frames/sequence/frame_',
    frameCount: 121,
  },
  {
    canvas: document.getElementById('chef-olga-canvas'),
    section: document.querySelector('#about'),
    statusElement: document.getElementById('chef-olga-status'),
    framePath: 'assets/frames/chef-olga/frame_',
    frameCount: 121,
  },
];

function getFrameSource(framePath, index) {
  const frameNumber = String(index + 1).padStart(4, '0');
  return `${framePath}${frameNumber}${FRAME_EXTENSION}`;
}

function resizeSequence(sequence) {
  const { canvas, context } = sequence;

  if (!canvas || !context) {
    return;
  }

  const container = canvas.parentElement;

  if (!container) {
    return;
  }

  const { width, height } = container.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.max(1, Math.round(width * pixelRatio));
  canvas.height = Math.max(1, Math.round(height * pixelRatio));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  renderSequenceFrame(sequence, sequence.currentFrameIndex);
}

function renderSequenceFrame(sequence, index) {
  const { canvas, context, loadedImages } = sequence;

  if (!canvas || !context) {
    return;
  }

  const image = loadedImages[index];

  if (!image || !image.complete) {
    return;
  }

  const pixelRatio = window.devicePixelRatio || 1;
  const displayWidth = canvas.width / pixelRatio;
  const displayHeight = canvas.height / pixelRatio;
  const imageAspect = image.naturalWidth / image.naturalHeight;
  const canvasAspect = displayWidth / displayHeight;

  let drawWidth, drawHeight;

  if (imageAspect > canvasAspect) {
    drawHeight = displayHeight;
    drawWidth = displayHeight * imageAspect;
  } else {
    drawWidth = displayWidth;
    drawHeight = displayWidth / imageAspect;
  }

  const isMobile = window.innerWidth <= 720;
  const offsetX = isMobile ? -(drawWidth * 0.07) : (displayWidth - drawWidth) / 2;
  const offsetY = isMobile ? -(drawHeight - displayHeight) * 0.85 : (displayHeight - drawHeight) / 2;

  context.clearRect(0, 0, displayWidth, displayHeight);
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function getSequenceScrollProgress(sequence) {
  const { section } = sequence;

  if (!section) {
    return 0;
  }

  const rect = section.getBoundingClientRect();
  const totalScrollable = Math.max(1, section.offsetHeight - window.innerHeight);
  const distanceScrolled = Math.min(Math.max(-rect.top, 0), totalScrollable);

  return distanceScrolled / totalScrollable;
}

function requestRenderForSequence(sequence) {
  if (sequence.totalFrames === 0) {
    sequence.ticking = false;
    return;
  }

  if (sequence.ticking) {
    return;
  }

  sequence.ticking = true;

  window.requestAnimationFrame(() => {
    const progress = getSequenceScrollProgress(sequence);
    const nextFrame = Math.min(
      sequence.totalFrames - 1,
      Math.max(0, Math.round(progress * (sequence.totalFrames - 1)))
    );

    if (nextFrame !== sequence.currentFrameIndex) {
      sequence.currentFrameIndex = nextFrame;
    }

    renderSequenceFrame(sequence, sequence.currentFrameIndex);
    sequence.ticking = false;
  });
}

function preloadSequence(sequence) {
  const BATCH_SIZE = 10;
  const BATCH_DELAY = 80;
  let loadedCount = 0;

  function loadBatch(startIndex) {
    const end = Math.min(startIndex + BATCH_SIZE, sequence.frameCount);
    for (let index = startIndex; index < end; index += 1) {
      const image = new Image();

      image.onload = () => {
        sequence.loadedImages[index] = image;
        loadedCount += 1;

        if (index === 0) {
          resizeSequence(sequence);
          if (sequence.statusElement) {
            sequence.statusElement.textContent = '';
          }
        }

        if (loadedCount === sequence.frameCount) {
          requestRenderForSequence(sequence);
        }
      };

      image.onerror = () => {
        loadedCount += 1;
      };

      image.src = getFrameSource(sequence.framePath, index);
    }

    if (end < sequence.frameCount) {
      setTimeout(() => loadBatch(end), BATCH_DELAY);
    }
  }

  loadBatch(0);
}

sequences.forEach((sequence) => {
  if (!sequence.canvas || !sequence.section) {
    return;
  }

  sequence.context = sequence.canvas.getContext('2d', { alpha: true });
  sequence.loadedImages = [];
  sequence.totalFrames = sequence.frameCount;
  sequence.currentFrameIndex = 0;
  sequence.ticking = false;

  preloadSequence(sequence);
  window.addEventListener('resize', () => resizeSequence(sequence));
  window.addEventListener('scroll', () => requestRenderForSequence(sequence), { passive: true });
  window.addEventListener('load', () => {
    resizeSequence(sequence);
    requestRenderForSequence(sequence);
  });
});

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
