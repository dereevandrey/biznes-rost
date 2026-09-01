// ПРЕДПРИНИМАЙ — ТЕРРИТОРИЯ РОСТА 2026: ПРЕЗЕНТАЦИОННЫЙ ДВИЖОК
document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide-frame');
  const dotsContainer = document.getElementById('slideDots');
  const counter = document.getElementById('progressCounter');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const themeToggle = document.getElementById('themeToggle');
  const modeToggle = document.getElementById('modeToggle');
  const shareBtn = document.getElementById('shareBtn');

  // Логотипы для динамической смены тем
  const logoConsortium = document.querySelectorAll('.brand-logo-consortium');
  const logoTR = document.querySelectorAll('.brand-logo-tr');

  let currentSlide = 0;
  const totalSlides = slides.length;

  function updateLogos(theme) {
    logoConsortium.forEach(img => {
      const isRoot = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
      const prefix = img.getAttribute('data-prefix') || '';
      if (theme === 'light') {
        img.src = prefix + 'assets/img/consortium_logo.png';
      } else {
        img.src = prefix + 'assets/img/consortium_logo_dark.png';
      }
    });

    logoTR.forEach(img => {
      const prefix = img.getAttribute('data-prefix') || '';
      if (theme === 'light') {
        img.src = prefix + 'assets/img/TR_MASTER_FINAL_DARK.png';
      } else {
        img.src = prefix + 'assets/img/TR_MASTER_FINAL_WHITE.png';
      }
    });
  }

  // Построение точек навигации
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    slides.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `slide-dot ${idx === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => goToSlide(idx));
      dotsContainer.appendChild(dot);
    });
  }

  function updateSlideView() {
    slides.forEach((s, idx) => {
      s.classList.toggle('active', idx === currentSlide);
    });
    
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.slide-dot');
      dots.forEach((d, idx) => d.classList.toggle('active', idx === currentSlide));
    }
    
    if (counter) {
      counter.textContent = `${currentSlide + 1} / ${totalSlides}`;
    }

    window.location.hash = `slide-${currentSlide + 1}`;
  }

  function goToSlide(idx) {
    if (idx >= 0 && idx < totalSlides) {
      currentSlide = idx;
      updateSlideView();
    }
  }

  function nextSlide() {
    if (currentSlide < totalSlides - 1) {
      currentSlide++;
      updateSlideView();
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      currentSlide--;
      updateSlideView();
    }
  }

  // Навигация с клавиатуры
  document.addEventListener('keydown', (e) => {
    if (document.body.classList.contains('feed-mode')) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'Home') {
      goToSlide(0);
    } else if (e.key === 'End') {
      goToSlide(totalSlides - 1);
    }
  });

  // Сенсорные свайпы для мобильных
  let touchStartX = 0;
  let touchStartY = 0;
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (document.body.classList.contains('feed-mode')) return;
    const diffX = e.changedTouches[0].screenX - touchStartX;
    const diffY = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 45) {
      if (diffX < 0) nextSlide();
      else prevSlide();
    }
  }, { passive: true });

  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);

  // Переключение темы
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('prm_theme', next);
      themeToggle.innerHTML = next === 'dark' ? '☀️ Светлая' : '🌙 Тёмная';
      updateLogos(next);
    });

    const saved = localStorage.getItem('prm_theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
      themeToggle.innerHTML = saved === 'dark' ? '☀️ Светлая' : '🌙 Тёмная';
      updateLogos(saved);
    } else {
      updateLogos('dark');
    }
  }

  // Переключение режима (Слайды vs Лента)
  if (modeToggle) {
    modeToggle.addEventListener('click', () => {
      const isFeed = document.body.classList.toggle('feed-mode');
      localStorage.setItem('prm_mode', isFeed ? 'feed' : 'slides');
      modeToggle.innerHTML = isFeed ? '🖥️ Слайды' : '📱 Лента';
      if (!isFeed) updateSlideView();
    });
  }

  // Поделиться ссылкой
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({
          title: document.title,
          url: window.location.href
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Прямая ссылка скопирована в буфер обмена!');
      }
    });
  }

  // Deep linking
  if (window.location.hash.startsWith('#slide-')) {
    const num = parseInt(window.location.hash.replace('#slide-', ''), 10);
    if (!isNaN(num) && num >= 1 && num <= totalSlides) {
      currentSlide = num - 1;
    }
  }

  if (totalSlides > 0) updateSlideView();
});

// Проверка пароля для инвесторов
function checkInvestorPasscode() {
  const input = document.getElementById('investorPassInput');
  const error = document.getElementById('passError');
  const modal = document.getElementById('passwordModal');
  
  const val = input ? input.value.trim().toUpperCase() : '';
  if (val === '2026' || val === 'GROWTH2026' || val === 'ИНВЕСТОР') {
    sessionStorage.setItem('investor_auth', 'true');
    if (modal) modal.style.display = 'none';
  } else {
    if (error) {
      error.style.display = 'block';
      error.textContent = 'Неверный пароль. Запросите доступ у организаторов.';
    }
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}
