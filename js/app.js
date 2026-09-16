/**
 * GLOSS STUDIO - Interactive Logic & UI Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveals();
  initTreatmentMenu();
  initGalleryFilterAndLightbox();
  initTestimonialCarousel();
  initBeforeAfterSlider();
  initBookingModalAndForms();
  initNewsletterAndForms();
});

/* -------------------------------------------------------------
 * 1. Navbar Scroll Effect & Mobile Drawer Menu
 * ------------------------------------------------------------- */
function initNavbar() {
  const header = document.getElementById('main-header');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
  const closeMobileMenuBtn = document.getElementById('close-mobile-menu');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('shadow-md', 'bg-cream/98');
      header.classList.remove('bg-cream/90');
    } else {
      header.classList.remove('shadow-md', 'bg-cream/98');
      header.classList.add('bg-cream/90');
    }
  });

  if (mobileMenuBtn && mobileMenuDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuDrawer.classList.remove('translate-x-full');
      document.body.style.overflow = 'hidden';
    });

    const closeMenu = () => {
      mobileMenuDrawer.classList.add('translate-x-full');
      document.body.style.overflow = '';
    };

    if (closeMobileMenuBtn) closeMobileMenuBtn.addEventListener('click', closeMenu);
    mobileNavLinks.forEach(link => link.addEventListener('click', closeMenu));
  }
}

/* -------------------------------------------------------------
 * 2. Scroll Reveal Animations (Intersection Observer)
 * ------------------------------------------------------------- */
function initScrollReveals() {
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach(el => revealObserver.observe(el));
}

/* -------------------------------------------------------------
 * 3. Interactive Treatment Menu Tabs
 * ------------------------------------------------------------- */
function initTreatmentMenu() {
  const tabs = document.querySelectorAll('.menu-tab-btn');
  const categoryContents = document.querySelectorAll('.menu-category-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetCategory = tab.dataset.category;

      tabs.forEach(t => {
        t.classList.remove('active', 'bg-gold-primary', 'text-white', 'border-gold-primary');
        t.classList.add('bg-white', 'text-espresso', 'border-gold-primary/30');
      });

      tab.classList.add('active', 'bg-gold-primary', 'text-white', 'border-gold-primary');
      tab.classList.remove('bg-white', 'text-espresso', 'border-gold-primary/30');

      categoryContents.forEach(content => {
        if (content.id === `menu-${targetCategory}`) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });
    });
  });
}

/* -------------------------------------------------------------
 * 4. Filterable Gallery & Lightbox Modal
 * ------------------------------------------------------------- */
function initGalleryFilterAndLightbox() {
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCategory = document.getElementById('lightbox-category');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');

  let activeIndex = 0;
  let visibleItems = Array.from(galleryItems);

  // Gallery Filter Tabs
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      filterBtns.forEach(b => {
        b.classList.remove('active', 'bg-gold-primary', 'text-white');
        b.classList.add('bg-cream-dark', 'text-espresso');
      });
      btn.classList.add('active', 'bg-gold-primary', 'text-white');
      btn.classList.remove('bg-cream-dark', 'text-espresso');

      visibleItems = [];
      galleryItems.forEach(item => {
        const itemCategory = item.dataset.category;
        if (filter === 'all' || itemCategory === filter) {
          item.classList.remove('hidden');
          visibleItems.push(item);
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });

  // Lightbox Triggers
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const title = item.dataset.title || 'Gloss Studio Experience';
      const category = item.dataset.categoryText || 'Aesthetic Beauty';
      
      activeIndex = visibleItems.indexOf(item);
      openLightbox(img.src, title, category);
    });
  });

  function openLightbox(src, title, category) {
    if (!lightbox) return;
    lightboxImg.src = src;
    lightboxTitle.textContent = title;
    lightboxCategory.textContent = category.toUpperCase();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  const navigateLightbox = (direction) => {
    if (visibleItems.length === 0) return;
    activeIndex = (activeIndex + direction + visibleItems.length) % visibleItems.length;
    const currentItem = visibleItems[activeIndex];
    const img = currentItem.querySelector('img');
    const title = currentItem.dataset.title || 'Gloss Studio Experience';
    const category = currentItem.dataset.categoryText || 'Aesthetic Beauty';
    openLightbox(img.src, title, category);
  };

  if (lightboxPrev) lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
  if (lightboxNext) lightboxNext.addEventListener('click', () => navigateLightbox(1));

  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });
}

/* -------------------------------------------------------------
 * 5. Testimonials Carousel Slider
 * ------------------------------------------------------------- */
function initTestimonialCarousel() {
  const track = document.getElementById('testimonial-track');
  const slides = document.querySelectorAll('.testimonial-slide');
  const prevBtn = document.getElementById('testimonial-prev');
  const nextBtn = document.getElementById('testimonial-next');
  const dotsContainer = document.getElementById('testimonial-dots');

  if (!track || slides.length === 0) return;

  let currentIndex = 0;
  let autoplayInterval;

  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    slides.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.className = `w-3 h-3 rounded-full transition-all duration-300 ${
        idx === 0 ? 'bg-gold-primary w-8' : 'bg-gold-primary/30'
      }`;
      dot.setAttribute('aria-label', `Go to testimonial ${idx + 1}`);
      dot.addEventListener('click', () => goToSlide(idx));
      dotsContainer.appendChild(dot);
    });
  }

  const dots = dotsContainer ? dotsContainer.querySelectorAll('button') : [];

  function updateSlider() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, idx) => {
      if (idx === currentIndex) {
        dot.className = 'w-8 h-3 rounded-full bg-gold-primary transition-all duration-300';
      } else {
        dot.className = 'w-3 h-3 rounded-full bg-gold-primary/30 transition-all duration-300';
      }
    });
  }

  function goToSlide(index) {
    currentIndex = index;
    updateSlider();
    resetAutoplay();
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlider();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateSlider();
  }

  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoplay(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetAutoplay(); });

  function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 5000);
  }

  function resetAutoplay() {
    clearInterval(autoplayInterval);
    startAutoplay();
  }

  track.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
  track.addEventListener('mouseleave', startAutoplay);

  startAutoplay();
}

/* -------------------------------------------------------------
 * 6. Before & After Interactive Slider
 * ------------------------------------------------------------- */
function initBeforeAfterSlider() {
  const container = document.getElementById('ba-container');
  const overlay = document.getElementById('ba-overlay');
  const handle = document.getElementById('ba-handle');

  if (!container || !overlay || !handle) return;

  let isDragging = false;

  const moveSlider = (x) => {
    const rect = container.getBoundingClientRect();
    let position = ((x - rect.left) / rect.width) * 100;
    if (position < 5) position = 5;
    if (position > 95) position = 95;

    overlay.style.width = `${position}%`;
    handle.style.left = `${position}%`;
  };

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    moveSlider(e.clientX);
  });

  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    moveSlider(e.clientX);
  });

  container.addEventListener('touchstart', (e) => {
    isDragging = true;
    moveSlider(e.touches[0].clientX);
  });
  window.addEventListener('touchend', () => { isDragging = false; });
  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    moveSlider(e.touches[0].clientX);
  });
}

/* -------------------------------------------------------------
 * 7. Appointment Booking System (Modal & Direct Form)
 * ------------------------------------------------------------- */
function initBookingModalAndForms() {
  const modal = document.getElementById('booking-modal');
  const openBtns = document.querySelectorAll('.open-booking-btn');
  const closeBtn = document.getElementById('close-booking-modal');
  const bookingForm = document.getElementById('appointment-full-form');
  const directForm = document.getElementById('direct-booking-form');

  // Sync Service trigger dataset if clicked
  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const service = btn.dataset.service;
      const price = btn.dataset.price;
      if (service && document.getElementById('booking-service')) {
        document.getElementById('booking-service').value = service;
      }
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Handle Modal Form Submission
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('booking-name').value.trim();
      const email = document.getElementById('booking-email').value.trim();
      const phone = document.getElementById('booking-phone').value.trim();

      if (!name || !email || !phone) {
        showToast('Please fill out your Name, Email, and Phone Number.', 'error');
        return;
      }

      // Show success screen in modal
      const formStep = document.getElementById('booking-form-step');
      const successStep = document.getElementById('booking-success-step');
      const confirmCode = document.getElementById('modal-confirmation-code');

      if (formStep && successStep) {
        formStep.classList.add('hidden');
        successStep.classList.remove('hidden');
      }

      if (confirmCode) {
        confirmCode.textContent = 'GS-' + Math.floor(100000 + Math.random() * 900000);
      }

      showToast(`Appointment confirmed for ${name}!`, 'success');
    });
  }

  // Handle Direct On-Page Quick Booking Form Submission
  if (directForm) {
    directForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('direct-name').value.trim();
      const email = document.getElementById('direct-email').value.trim();
      const phone = document.getElementById('direct-phone').value.trim();

      if (!name || !email || !phone) {
        showToast('Please complete all contact details (Name, Email, Phone).', 'error');
        return;
      }

      const randomRef = 'GS-' + Math.floor(100000 + Math.random() * 900000);
      showToast(`Thank you ${name}! Reservation ${randomRef} confirmed. We will reach out shortly.`, 'success');
      directForm.reset();
    });
  }
}

/* -------------------------------------------------------------
 * 8. Form Validation & Toast Notifications
 * ------------------------------------------------------------- */
function initNewsletterAndForms() {
  const newsletterForm = document.getElementById('newsletter-form');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      if (emailInput && emailInput.value) {
        showToast('Thank you for subscribing to Gloss Studio Atelier Privé.', 'success');
        emailInput.value = '';
      }
    });
  }
}

// Global Toast Feedback Handler
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto p-4 rounded-xl shadow-xl border flex items-center justify-between gap-3 text-sm font-sans transition-all transform translate-y-4 opacity-0 ${
    type === 'success' 
      ? 'bg-dark-espresso text-cream border-gold-primary/50'
      : 'bg-white text-espresso border-red-300'
  }`;

  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-2.5 h-2.5 rounded-full ${type === 'success' ? 'bg-gold-primary' : 'bg-red-500'}"></div>
      <span class="font-medium">${message}</span>
    </div>
    <button onclick="this.parentElement.remove()" class="text-xs text-muted hover:text-espresso">✕</button>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}
