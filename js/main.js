(function () {
  // Lock scroll until the hero's one-shot entrance sequence (see
  // 01-header-hero-intro.css's hero-*-reveal animations — bottle, headline,
  // header/ticker bars, then the bg/scrim settle) has fully
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

  // header-bar-reveal (its one-shot entrance slide-in, see
  // 01-header-hero-intro.css) uses fill-mode:both, which holds
  // transform:translateY(0) forever once the animation ends — a CSS
  // animation's held fill-mode state overrides normal class-based rules on
  // the same property regardless of specificity, so it was silently
  // blocking the .is-hidden scroll-away transform below until cleared.
  // Timeout-based (matching the intro-lock timing above) rather than an
  // animationend listener, since that event isn't reliably observed here.
  // No-op for prefers-reduced-motion visitors: the animation never runs
  // for them (see the same media query in the CSS), so there's nothing to
  // clear, and .is-hidden works untouched from the very first scroll.
  if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    setTimeout(function () {
      header.style.animation = 'none';
    }, 4200);
  }

  var toggle = header.querySelector('[data-nav-toggle]');
  // The overlay/scrim are siblings of <header>, not descendants (see the
  // HTML comment above them) — .header-bar's own transform would otherwise
  // make it their position:fixed containing block instead of the viewport.
  // The 'nav-open' class lives on <body> for the same reason: it needs to
  // be a real ancestor of both header (for the toggle-bar animation) and
  // the overlay/scrim.
  var overlay = document.querySelector('[data-nav-overlay]');
  var scrim = document.querySelector('[data-nav-scrim]');
  var body = document.body;

  function closeNav() {
    body.classList.remove('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function toggleNav() {
    var isOpen = body.classList.toggle('nav-open');
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
  var heroEl = document.getElementById('hero');
  function onScroll() {
    var currentY = window.scrollY;
    header.classList.toggle('is-scrolled', currentY > scrollThreshold);

    // The header is transparent and floats over the hero video (white
    // logo/hamburger read fine there), but every section after the hero
    // is plain white — white-on-white would be invisible, so switch to
    // the dark-green logo/hamburger the moment the hero scrolls fully
    // behind the (fixed) header.
    if (heroEl) {
      header.classList.toggle('header-bar--dark', heroEl.getBoundingClientRect().bottom <= header.offsetHeight);
    }

    if (!body.classList.contains('nav-open')) {
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

  // Art & Impact photo carousel: crossfades through capstory-photo__img
  // elements, prev/next buttons plus autoplay (paused on hover/focus,
  // skipped entirely for prefers-reduced-motion, same pattern as the
  // Press & Media gallery below).
  var capstoryPhoto = document.querySelector('.capstory-photo');
  if (capstoryPhoto) {
    var capstoryImgs = Array.prototype.slice.call(capstoryPhoto.querySelectorAll('.capstory-photo__img'));
    var capstoryPrev = capstoryPhoto.querySelector('.capstory-carousel__btn--prev');
    var capstoryNext = capstoryPhoto.querySelector('.capstory-carousel__btn--next');
    var capstoryIndex = 0;
    var capstoryTimer = null;
    var capstoryMotionOK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

    var capstoryShow = function (i) {
      if (i >= capstoryImgs.length) i = 0;
      else if (i < 0) i = capstoryImgs.length - 1;
      capstoryImgs[capstoryIndex].classList.remove('is-active');
      capstoryIndex = i;
      capstoryImgs[capstoryIndex].classList.add('is-active');
    };

    var capstoryNextSlide = function () { capstoryShow(capstoryIndex + 1); };
    var capstoryPrevSlide = function () { capstoryShow(capstoryIndex - 1); };

    var capstoryStop = function () {
      if (capstoryTimer) clearInterval(capstoryTimer);
      capstoryTimer = null;
    };
    var capstoryStart = function () {
      if (!capstoryMotionOK || capstoryImgs.length < 2) return;
      capstoryStop();
      capstoryTimer = setInterval(capstoryNextSlide, 2200);
    };

    if (capstoryNext) capstoryNext.addEventListener('click', function () { capstoryNextSlide(); capstoryStart(); });
    if (capstoryPrev) capstoryPrev.addEventListener('click', function () { capstoryPrevSlide(); capstoryStart(); });
    capstoryPhoto.addEventListener('mouseenter', capstoryStop);
    capstoryPhoto.addEventListener('mouseleave', capstoryStart);
    capstoryPhoto.addEventListener('focusin', capstoryStop);
    capstoryPhoto.addEventListener('focusout', capstoryStart);

    capstoryStart();
  }

  // The Mandate Wall: renders a static roster of fictional "attachers"
  // (name + city, mixed photo/initials avatars) into the empty
  // .wall-grid markup, then staggers them in on scroll and periodically
  // pulses a random avatar — so a static dataset still reads as a live,
  // growing wall. Swap WALL_PEOPLE for a real backend feed later; the
  // render/animation logic below can stay as-is.
  var wallGrid = document.querySelector('.wall-grid');
  if (wallGrid) {
    var WALL_PEOPLE = [
      ['Priya Sharma', 'Mumbai'], ['Rahul Verma', 'Delhi'], ['Ananya Iyer', 'Chennai'],
      ['Karan Mehta', 'Ahmedabad'], ['Sneha Reddy', 'Hyderabad'], ['Arjun Nair', 'Kochi'],
      ['Divya Pillai', 'Bengaluru'], ['Vikram Singh', 'Jaipur'], ['Neha Gupta', 'Lucknow'],
      ['Aditya Rao', 'Pune'], ['Meera Joshi', 'Nagpur'], ['Rohan Kapoor', 'Chandigarh'],
      ['Kavya Menon', 'Thiruvananthapuram'], ['Siddharth Bose', 'Kolkata'], ['Ishita Malhotra', 'Gurugram'],
      ['Aarav Chatterjee', 'Kolkata'], ['Pooja Desai', 'Surat'], ['Vivaan Khanna', 'Delhi'],
      ['Riya Agarwal', 'Indore'], ['Aman Bhatt', 'Vadodara'], ['Tanvi Shah', 'Ahmedabad'],
      ['Kabir Chauhan', 'Jodhpur'], ['Sanya Kulkarni', 'Pune'], ['Dev Patel', 'Rajkot'],
      ['Anika Ghosh', 'Kolkata'], ['Yash Trivedi', 'Bhopal'], ['Simran Kaur', 'Amritsar'],
      ['Nikhil Pandey', 'Varanasi'], ['Aisha Sheikh', 'Hyderabad'], ['Raj Malhotra', 'Delhi'],
      ['Sara Fernandes', 'Goa'], ['Manav Oberoi', 'Chandigarh'], ['Nandini Rao', 'Visakhapatnam'],
      ['Aryan Bansal', 'Kanpur'], ['Zara Khan', 'Lucknow'], ['Harsh Vora', 'Surat'],
      ['Aditi Menon', 'Kochi'], ['Ritvik Saxena', 'Kanpur'], ['Diya Krishnan', 'Coimbatore'],
      ['Om Prakash', 'Patna'], ['Lavanya Iyer', 'Madurai'], ['Kunal Bhatia', 'Ludhiana'],
      ['Anushka Rathi', 'Jaipur'], ['Suresh Naidu', 'Visakhapatnam'], ['Ira Sen', 'Kolkata'],
      ['Vihaan Choudhary', 'Jodhpur'], ['Tanya Aggarwal', 'Delhi'], ['Rohit Dubey', 'Bhopal'],
      ['Anjali Nambiar', 'Kozhikode'], ['Gautam Mishra', 'Lucknow'], ['Kritika Bhatt', 'Dehradun'],
      ['Naveen Kumar', 'Bengaluru'], ['Shreya Basu', 'Kolkata'], ['Aarush Jain', 'Jaipur'],
      ['Pallavi Rao', 'Hyderabad'], ['Devansh Tiwari', 'Kanpur'], ['Ritika Chopra', 'Delhi'],
      ['Sameer Ansari', 'Lucknow'], ['Nisha Varma', 'Indore'], ['Arnav Sethi', 'Chandigarh']
    ];
    var WALL_PHOTO_COUNT = 30;

    var wallFrag = document.createDocumentFragment();
    WALL_PEOPLE.forEach(function (person, i) {
      var name = person[0];
      var city = person[1];
      var initials = name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase();

      var li = document.createElement('li');
      li.className = 'wall-avatar';
      li.title = name + ' — ' + city;

      if (i % 3 !== 0) {
        var photoNum = (i % WALL_PHOTO_COUNT) + 1;
        var photoId = (photoNum < 10 ? '0' : '') + photoNum;
        var img = document.createElement('img');
        img.className = 'wall-avatar__photo';
        img.src = 'assets/images/wall/attacher-' + photoId + '.jpg';
        img.alt = '';
        img.loading = 'lazy';
        li.appendChild(img);
      } else {
        li.classList.add('wall-avatar--named');
        var span = document.createElement('span');
        span.className = 'wall-avatar__initials';
        span.textContent = initials;
        li.appendChild(span);
      }

      wallFrag.appendChild(li);
    });
    wallGrid.appendChild(wallFrag);

    var wallAvatarEls = Array.prototype.slice.call(wallGrid.children);
    var wallMotionOK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

    if (wallMotionOK && wallAvatarEls.length) {
      wallAvatarEls.forEach(function (el) { el.classList.add('wall-avatar--pre'); });

      var wallObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          wallAvatarEls.forEach(function (el, i) {
            setTimeout(function () {
              el.classList.remove('wall-avatar--pre');
              el.classList.add('wall-avatar--in');
            }, i * 12);
          });
          wallObserver.disconnect();
        });
      }, { threshold: 0.1 });
      wallObserver.observe(wallGrid);

      setInterval(function () {
        var el = wallAvatarEls[Math.floor(Math.random() * wallAvatarEls.length)];
        el.classList.remove('wall-avatar--pulse');
        // eslint-disable-next-line no-unused-expressions
        el.offsetWidth;
        el.classList.add('wall-avatar--pulse');
      }, 2600);
    }
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
