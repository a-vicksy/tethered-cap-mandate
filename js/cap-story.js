(function () {
  'use strict';

  // Portrait (image) is served under ~860px; wide (wideImage) is a
  // separately-composed 16:9 painting for desktop, not a stretched/cropped
  // version of the portrait one — object-fit:cover on a mismatched aspect
  // ratio was cropping most of every scene away above phone width.
  var DESKTOP_QUERY = '(min-width: 860px)';

  var SCENES = [
    {
      image: 'assets/images/cap-story/scene-0-cover.jpg',
      wideImage: 'assets/images/cap-story/scene-0-cover-wide.jpg',
      alt: 'A friendly bottle cap character',
      caption: 'Hi, I’m a bottle cap.<br>I have a story to tell you.',
      nextLabel: 'Begin'
    },
    {
      image: 'assets/images/cap-story/scene-1-happy.jpg',
      wideImage: 'assets/images/cap-story/scene-1-happy-wide.jpg',
      alt: 'The cap sitting snugly on top of a bottle',
      caption: 'I used to sit right here, snug on top of the bottle, doing my one job — keeping every drop safe.'
    },
    {
      image: 'assets/images/cap-story/scene-2-twisted-off.jpg',
      wideImage: 'assets/images/cap-story/scene-2-twisted-off-wide.jpg',
      alt: 'A hand twisting the cap off the bottle',
      caption: 'But the moment I was twisted off, I was on my own.'
    },
    {
      image: 'assets/images/cap-story/scene-3-lost.jpg',
      wideImage: 'assets/images/cap-story/scene-3-lost-wide.jpg',
      alt: 'The cap lying alone on a sidewalk near a bin',
      caption: 'Too small to notice, too light to stay put. I rolled off, missed the bin, and was gone.'
    },
    {
      image: 'assets/images/cap-story/scene-4-gutter.jpg',
      wideImage: 'assets/images/cap-story/scene-4-gutter-wide.jpg',
      alt: 'The cap being swept along a rainy street gutter',
      caption: 'The rain swept me through the gutters, into a drain, toward the sea.',
      effect: 'rain'
    },
    {
      image: 'assets/images/cap-story/scene-5-ocean.jpg',
      wideImage: 'assets/images/cap-story/scene-5-ocean-wide.jpg',
      alt: 'The cap floating in the ocean near a fish',
      caption: 'Out there, I wasn’t litter anymore. I was a hazard — small enough for a fish to mistake me for food.',
      effect: 'shimmer'
    },
    {
      image: 'assets/images/cap-story/scene-6-beach.jpg',
      wideImage: 'assets/images/cap-story/scene-6-beach-wide.jpg',
      alt: 'A beach covered with thousands of tiny caps',
      caption: 'Millions of caps just like me wash up here every year. Tiny. Forgettable. Everywhere.'
    },
    {
      image: 'assets/images/cap-story/scene-7-tethered.jpg',
      wideImage: 'assets/images/cap-story/scene-7-tethered-wide.jpg',
      alt: 'A hand attaching the cap to a bottle with a tether',
      caption: 'But it doesn’t have to end this way. A tethered cap never comes off — never gets lost, never leaves its bottle behind.'
    },
    {
      image: 'assets/images/cap-story/scene-8-resolution.jpg',
      wideImage: 'assets/images/cap-story/scene-8-resolution-wide.jpg',
      alt: 'The cap happily attached to its bottle by a tether',
      caption: 'Now I stay attached, no matter what. That’s the mandate we’re fighting for.',
      isFinal: true
    }
  ];

  var stage = document.getElementById('capstory-stage');
  var progressEl = document.getElementById('capstory-progress');
  var dotsEl = document.getElementById('capstory-dots');
  var prevZone = document.getElementById('capstory-prev');
  var nextZone = document.getElementById('capstory-next');
  var prevBtn = document.getElementById('capstory-back-btn');
  var nextBtn = document.getElementById('capstory-next-btn');

  var current = 0;
  var sceneEls = [];

  // Preload every scene's image up front so crossfades never show a blank
  // frame while the browser fetches the next one. Only preloads whichever
  // variant the <picture> below would actually pick for this viewport —
  // preloading both would double the download for no benefit.
  var isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
  SCENES.forEach(function (scene) {
    var img = new Image();
    img.src = isDesktop ? scene.wideImage : scene.image;
  });

  SCENES.forEach(function (scene, i) {
    var seg = document.createElement('div');
    seg.className = 'capstory-progress__seg';
    progressEl.appendChild(seg);

    var dot = document.createElement('li');
    dot.className = 'capstory-dots__item';
    dotsEl.appendChild(dot);

    var sceneEl = document.createElement('div');
    sceneEl.className = 'capstory-scene';
    sceneEl.setAttribute('aria-hidden', 'true');

    var frame = document.createElement('div');
    frame.className = 'capstory-scene__frame';

    var picture = document.createElement('picture');

    var source = document.createElement('source');
    source.media = DESKTOP_QUERY;
    source.srcset = scene.wideImage;
    picture.appendChild(source);

    var img = document.createElement('img');
    img.className = 'capstory-scene__img';
    img.src = scene.image;
    img.alt = scene.alt || '';
    img.loading = i === 0 ? 'eager' : 'lazy';
    picture.appendChild(img);

    frame.appendChild(picture);

    var scrim = document.createElement('div');
    scrim.className = 'capstory-scene__scrim';
    scrim.setAttribute('aria-hidden', 'true');
    frame.appendChild(scrim);

    if (scene.effect) {
      var fx = document.createElement('div');
      fx.className = 'capstory-scene__fx capstory-scene__fx--' + scene.effect;
      fx.setAttribute('aria-hidden', 'true');

      if (scene.effect === 'rain') {
        // Individually-timed drops rather than a single sliding pattern —
        // see the CSS comment on .capstory-raindrop for why.
        for (var d = 0; d < 26; d++) {
          var drop = document.createElement('span');
          drop.className = 'capstory-raindrop';
          drop.style.left = (Math.random() * 110 - 5).toFixed(1) + '%';
          drop.style.height = (3 + Math.random() * 4).toFixed(1) + '%';
          drop.style.animationDuration = (0.55 + Math.random() * 0.5).toFixed(2) + 's';
          drop.style.animationDelay = (Math.random() * -1.2).toFixed(2) + 's';
          fx.appendChild(drop);
        }
      }

      frame.appendChild(fx);
    }

    sceneEl.appendChild(frame);

    var caption = document.createElement('div');
    caption.className = 'capstory-scene__caption';
    var p = document.createElement('p');
    p.innerHTML = scene.caption;
    p.style.margin = '0';
    caption.appendChild(p);

    if (scene.isFinal) {
      var cta = document.createElement('a');
      cta.className = 'capstory-scene__cta';
      cta.href = 'index.html#attach-yourself';
      cta.innerHTML = 'Attach Yourself <span aria-hidden="true">&rarr;</span>';
      caption.appendChild(cta);
    }

    sceneEl.appendChild(caption);
    stage.appendChild(sceneEl);
    sceneEls.push(sceneEl);
  });

  function render() {
    sceneEls.forEach(function (el, i) {
      var active = i === current;
      el.classList.toggle('capstory-scene--active', active);
      el.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    Array.prototype.forEach.call(progressEl.children, function (seg, i) {
      seg.classList.toggle('capstory-progress__seg--done', i <= current);
    });

    Array.prototype.forEach.call(dotsEl.children, function (dot, i) {
      dot.classList.toggle('capstory-dots__item--active', i === current);
    });

    prevBtn.hidden = current === 0;
    prevZone.style.display = current === 0 ? 'none' : '';

    var scene = SCENES[current];
    if (scene.isFinal) {
      nextBtn.hidden = true;
      nextZone.style.display = 'none';
    } else {
      nextBtn.hidden = false;
      nextZone.style.display = '';
      nextBtn.innerHTML = (scene.nextLabel || 'Next') + ' <span aria-hidden="true">&rsaquo;</span>';
    }

    progressEl.setAttribute('aria-valuenow', String(current + 1));
    progressEl.setAttribute('aria-valuemax', String(SCENES.length));
  }

  function goTo(index) {
    if (index < 0 || index >= SCENES.length) return;
    current = index;
    render();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  nextZone.addEventListener('click', next);
  prevZone.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'Escape') { window.location.href = 'index.html#tethered-timeline'; }
  });

  // Swipe support — a plain horizontal drag threshold, no library.
  var touchStartX = null;
  document.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next(); else prev();
    }
    touchStartX = null;
  }, { passive: true });

  render();
})();
