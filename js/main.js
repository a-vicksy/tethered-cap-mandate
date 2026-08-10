(function () {
  // Lock scroll until the hero's one-shot entrance sequence (see
  // 01-header-hero-intro.css's hero-*-reveal animations — bottle, headline,
  // social icons, header/ticker bars, then the bg/scrim settle) has fully
  // played out, so scrolling away can't cut the reveal off partway
  // through. The timeout matches that sequence's last-finishing piece (the
  // bg/scrim settle, ending at 4.6s) plus a small buffer. Skipped entirely
  // for prefers-reduced-motion — those visitors get no entrance sequence
  // (CSS never starts it), so there's nothing to wait for.
  if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    var docEl = document.documentElement;
    docEl.classList.add('intro-locked');

    var blockedKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
    var preventScrollKey = function (event) {
      if (blockedKeys.indexOf(event.key) !== -1) event.preventDefault();
    };
    var preventScroll = function (event) {
      event.preventDefault();
    };

    // `overflow: hidden` (added via the class above) already blocks scroll
    // on most browsers; these are a defensive backstop for the mobile
    // Safari rubber-band cases where that alone doesn't fully hold.
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('keydown', preventScrollKey);

    setTimeout(function () {
      docEl.classList.remove('intro-locked');
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('keydown', preventScrollKey);
    }, 4700);
  }

  var header = document.getElementById('site-header');
  if (!header) return;

  var toggle = header.querySelector('[data-nav-toggle]');
  var overlay = header.querySelector('[data-nav-overlay]');
  var scrim = header.querySelector('[data-nav-scrim]');

  function closeNav() {
    header.classList.remove('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function toggleNav() {
    var isOpen = header.classList.toggle('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', String(isOpen));
  }

  if (toggle) {
    toggle.addEventListener('click', toggleNav);
  }

  if (scrim) {
    scrim.addEventListener('click', closeNav);
  }

  if (overlay) {
    overlay.querySelectorAll('[data-nav-link]').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeNav();
  });

  // Shadow once scrolled at all; hide the whole bar on scroll-down past its
  // own height, reveal again on scroll-up (or back near the top). Skipped
  // while the mobile nav is open so its own close control stays reachable.
  var scrollThreshold = 8;
  var lastScrollY = window.scrollY;
  function onScroll() {
    var currentY = window.scrollY;
    header.classList.toggle('is-scrolled', currentY > scrollThreshold);

    if (!header.classList.contains('nav-open')) {
      var headerHeight = header.offsetHeight;
      var delta = currentY - lastScrollY;
      if (currentY > headerHeight && delta > 4) {
        header.classList.add('is-hidden');
      } else if (delta < -4 || currentY <= headerHeight) {
        header.classList.remove('is-hidden');
      }
    }

    lastScrollY = currentY;
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Pin the hero's social icon rail so its bottom edge matches the exact
  // bottom of the headline text. The headline's position shifts with
  // viewport size (responsive font, two-line wrapping), so this is measured
  // live rather than guessed with a fixed CSS offset.
  var heroSection = document.getElementById('hero');
  var heroSocial = heroSection ? heroSection.querySelector('.hero-social') : null;
  var heroHeadline = heroSection ? heroSection.querySelector('.hero-headline') : null;

  function alignHeroSocial() {
    if (!heroSection || !heroSocial || !heroHeadline) return;
    var heroRect = heroSection.getBoundingClientRect();
    var headlineRect = heroHeadline.getBoundingClientRect();
    heroSocial.style.bottom = (heroRect.bottom - headlineRect.bottom) + 'px';
  }

  alignHeroSocial();
  window.addEventListener('resize', alignHeroSocial);
  window.addEventListener('load', alignHeroSocial);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(alignHeroSocial);
  }

  // Live-looking "people attached" counter — dummy client-side ticker for
  // now (random small increments on a random interval). Swap scheduleTick/
  // tick for a real backend feed (poll/SSE/websocket) later; the odometer
  // rendering (setCounterValue) can stay as-is, just feed it real numbers.
  //
  // Rendered as a YouTube-subscriber-count-style odometer: each digit is
  // its own reel of 0-9 that rolls vertically to the new value, rather than
  // the whole number just swapping instantly.
  var counterEl = document.querySelector('[data-live-counter]');
  if (counterEl) {
    var count = parseInt(counterEl.getAttribute('data-base-count'), 10) || 0;
    var digitStrips = []; // index-aligned with the formatted string's characters
    var lastFormatted = '';

    function formatCount(n) {
      return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function buildReels(formatted) {
      counterEl.innerHTML = '';
      digitStrips = [];
      formatted.split('').forEach(function (ch) {
        if (ch === ',') {
          var sep = document.createElement('span');
          sep.className = 'ticker-digit-sep';
          sep.textContent = ',';
          counterEl.appendChild(sep);
          digitStrips.push(null);
          return;
        }
        var reel = document.createElement('span');
        reel.className = 'ticker-digit';
        var strip = document.createElement('span');
        strip.className = 'ticker-digit-strip';
        for (var d = 0; d <= 9; d++) {
          var num = document.createElement('span');
          num.className = 'ticker-digit-num';
          num.textContent = String(d);
          strip.appendChild(num);
        }
        reel.appendChild(strip);
        counterEl.appendChild(reel);
        digitStrips.push(strip);
      });
    }

    function setCounterValue(formatted, animate) {
      if (formatted.length !== lastFormatted.length) {
        buildReels(formatted);
      }
      formatted.split('').forEach(function (ch, i) {
        var strip = digitStrips[i];
        if (!strip) return;
        if (!animate) strip.style.transition = 'none';
        strip.style.transform = 'translateY(-' + ch + 'em)';
        if (!animate) {
          // eslint-disable-next-line no-unused-expressions
          strip.offsetHeight;
          strip.style.transition = '';
        }
      });
      counterEl.setAttribute('aria-label', formatted);
      lastFormatted = formatted;
    }

    setCounterValue(formatCount(count), false);

    function scheduleTick() {
      var delay = 2000 + Math.random() * 3000; // 2-5s — short intervals, YT-live-count feel
      setTimeout(tick, delay);
    }

    function tick() {
      count += 1 + Math.floor(Math.random() * 4); // +1 to +4
      setCounterValue(formatCount(count), true);
      scheduleTick();
    }

    scheduleTick();
  }
})();
