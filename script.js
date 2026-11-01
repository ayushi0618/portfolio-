// ===== PORTFOLIO WEBSITE — SCRIPT.JS =====

document.addEventListener('DOMContentLoaded', () => {

  // ===== 1. NAVBAR SCROLL BEHAVIOR =====
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  const handleNavScroll = () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  };

  window.addEventListener('scroll', handleNavScroll, { passive: true });

  // ===== 2. SMOOTH SCROLL FOR NAV LINKS =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const offset = 80; // navbar height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ===== 3. SCROLL REVEAL ANIMATIONS =====
  const revealElements = document.querySelectorAll('.reveal, .reveal-left');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Once revealed, stop observing
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ===== 5. CONTACT FORM HANDLING (real backend: POST /api/contact) =====
  const contactForm = document.getElementById('contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('contact-submit');
      const statusEl = document.getElementById('contact-status');
      const originalText = submitBtn.textContent;

      submitBtn.textContent = 'Sending...';
      submitBtn.style.opacity = '0.6';
      submitBtn.disabled = true;
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'contact-status';
      }

      const data = {
        subject: document.getElementById('contact-subject').value.trim(),
        name: document.getElementById('contact-name').value.trim(),
        phone: document.getElementById('contact-phone').value.trim(),
        message: document.getElementById('contact-message').value.trim(),
      };

      const restore = () => {
        submitBtn.textContent = originalText;
        submitBtn.style.opacity = '1';
        submitBtn.disabled = false;
      };

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          submitBtn.textContent = 'Sent! ✓';
          submitBtn.style.opacity = '1';
          submitBtn.style.background = '#000';
          submitBtn.style.color = '#fff';
          if (statusEl) {
            statusEl.textContent = 'Thanks — your message is on its way. Ayushi will reply soon.';
            statusEl.classList.add('success');
          }
          contactForm.reset();
          setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
            submitBtn.style.color = '';
            submitBtn.disabled = false;
          }, 3000);
          return;
        }

        if (res.status === 501) {
          // Backend not connected yet: fall back to the visitor's email app (never fake a send).
          if (statusEl) {
            statusEl.textContent = 'Direct send is not connected yet — opening your email app with this message instead.';
            statusEl.classList.add('info');
          }
          window.location.href = 'mailto:ayushi.singh0618@gmail.com?subject=' +
            encodeURIComponent('Portfolio contact: ' + (data.subject || 'Hello')) +
            '&body=' + encodeURIComponent('Name: ' + data.name + '\nPhone: ' + data.phone + '\n\n' + data.message);
          restore();
          return;
        }

        throw new Error('send failed');
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = 'Could not send just now — please email ayushi.singh0618@gmail.com directly.';
          statusEl.classList.add('error');
        }
        restore();
      }
    });
  }

  // ===== 6. PARALLAX & ROTATION EFFECT ON 3D DECORATIVE ELEMENTS =====
  const aboutDecorElements = document.querySelectorAll('.about-decor');
  const heroDecorElements = document.querySelectorAll('.hero-decor');

  const handleParallax = () => {
    const scrollY = window.scrollY;

    // About section 3D elements: vertical drift + gentle dynamic rotation on scroll
    aboutDecorElements.forEach((el, index) => {
      const speeds = [0.08, -0.06, 0.09, -0.07];
      const rotations = [0.05, -0.06, 0.07, -0.04];
      const yOffset = scrollY * (speeds[index % speeds.length]);
      const rotate = scrollY * (rotations[index % rotations.length]);
      el.style.transform = `translateY(${yOffset}px) rotate(${rotate}deg)`;
    });

    // Hero section 3D elements: float away dynamically as user scrolls down
    heroDecorElements.forEach((el, index) => {
      const speeds = [-0.15, -0.12, -0.08, -0.1];
      const rotations = [-0.08, 0.09, -0.05, 0.07];
      const yOffset = scrollY * (speeds[index % speeds.length]);
      const rotate = scrollY * (rotations[index % rotations.length]);
      el.style.transform = `translateY(${yOffset}px) rotate(${rotate}deg)`;
    });
  };

  window.addEventListener('scroll', handleParallax, { passive: true });

  // ===== 7. CURSOR GLOW EFFECT ON TESTIMONIAL CARDS =====
  const cards = document.querySelectorAll('.testimonial-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.06), rgba(255,255,255,0.02) 50%, transparent 80%)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.background = 'rgba(255,255,255,0.02)';
    });
  });


  // ===== 9. RESUME MODAL & PRINT HANDLERS =====
  const resumeModal = document.getElementById('resume-modal');
  const openResumeNav = document.getElementById('open-resume-nav');
  const heroResumeBtn = document.getElementById('hero-resume-btn');
  const closeResumeBtn = document.getElementById('close-resume-btn');
  const printResumeBtn = document.getElementById('print-resume-btn');

  const openResume = () => {
    if (resumeModal) {
      resumeModal.classList.add('active');
      resumeModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeResume = () => {
    if (resumeModal) {
      resumeModal.classList.remove('active');
      resumeModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  };

  if (openResumeNav) openResumeNav.addEventListener('click', openResume);
  if (heroResumeBtn) heroResumeBtn.addEventListener('click', openResume);
  if (closeResumeBtn) closeResumeBtn.addEventListener('click', closeResume);

  if (resumeModal) {
    resumeModal.addEventListener('click', (e) => {
      if (e.target === resumeModal) closeResume();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && resumeModal && resumeModal.classList.contains('active')) {
      closeResume();
    }
  });

  if (printResumeBtn) {
    printResumeBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // ===== RESUME TABS (Software Development / Data Analyst) =====
  if (resumeModal) {
    const tabs = resumeModal.querySelectorAll('.resume-tab');
    const daPane = resumeModal.querySelector('#resume-da');
    const sheet = resumeModal.querySelector('.resume-sheet');
    const setTab = (tab) => {
      const isDA = tab === 'da';
      tabs.forEach((t) => {
        const active = t.getAttribute('data-resume-tab') === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      if (sheet) sheet.style.display = isDA ? 'none' : '';
      if (daPane) daPane.hidden = !isDA;
      resumeModal.classList.toggle('da-active', isDA);
    };
    tabs.forEach((t) => {
      t.addEventListener('click', () => setTab(t.getAttribute('data-resume-tab')));
    });
  }

  // ===== 10. TYPEWRITER ANIMATION =====
  const typewriterElement = document.getElementById('typewriter');
  if (typewriterElement) {
    const roles = [
      "Solved 150+ LeetCode Questions",
      "Worked as SDE Intern",
      "Full Stack Software Engineer",
      "Deployed 6+ Projects",
      "Data Analyst"
    ];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const typeEffect = () => {
      const currentRole = roles[roleIndex];
      
      if (isDeleting) {
        typewriterElement.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typewriterElement.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
      }

      let typeSpeed = isDeleting ? 40 : 80; // Speed of typing and deleting

      if (!isDeleting && charIndex === currentRole.length) {
        // Pause at the end before deleting
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        // Move to the next role after deleting
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        typeSpeed = 400; // Pause before typing the next word
      }

      setTimeout(typeEffect, typeSpeed);
    };

    // Initialize animation
    setTimeout(typeEffect, 500);
  }

});
