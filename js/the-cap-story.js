/* ————— I'm Attached · scene engine ————— */
(function () {
  "use strict";

  const staticMode = new URLSearchParams(location.search).has("static");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || staticMode;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  /* ————— tokens ————— */
  const C = {
    cream: "#f3ebdf", forest: "#153824", deep: "#061e13",
    green: "#2ab574", moss: "#bece9f", powder: "#bed2eb", ink: "#10271b",
  };

  /* ————— scroll scenes ————— */
  if (hasGsap && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);

    /* Build scenes only once layout is stable (fonts + full load),
       so pin dimensions are never measured mid-layout. */
    const whenStable = Promise.all([
      new Promise((res) => (document.readyState === "complete" ? res() : window.addEventListener("load", res, { once: true }))),
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
    ]).then(() => new Promise((res) => {
      let done = false;
      const fin = () => { if (!done) { done = true; res(); } };
      requestAnimationFrame(() => requestAnimationFrame(fin));
      setTimeout(fin, 350); /* rAF can be throttled in background tabs */
    }));

    whenStable.then(buildScenes);
  } else {
    document.documentElement.classList.add("static-flow");
    document.body.classList.add("static-flow");
    $("#indiaNumber").textContent = (25e9).toLocaleString("en-IN");
  }

  function buildScenes() {
    /* ONE continuous shot: the unscrewing, then the camera follows the cap down.
       Same cap element throughout — nothing to hand off, nothing to break. */
    const tl = gsap.timeline({
      scrollTrigger: { trigger: "#story", start: "top top", end: "+=680%", scrub: 0.6, pin: true },
    });

    /* Phase A — the unscrew (you cause the breakup) */
    gsap.set("#cap", { transformOrigin: "50% 50%" });
    tl.to("#cap", { rotation: 360, y: -30, duration: 1.6, ease: "none" }, 0)
      .to("#cue", { opacity: 0, duration: 0.3 }, 0)
      .to("#line1", { opacity: 0, y: -30, duration: 0.8 }, 0.8)
      .fromTo("#line2", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, 1.2)
      .to("#cap", { rotation: 620, y: -170, x: 40, duration: 1.0, ease: "power1.out" }, 1.6)
      .fromTo("#heroNote", { opacity: 0 }, { opacity: 1, duration: 0.6 }, 2.0)
      .to("#heroNote", { opacity: 0, duration: 0.5 }, 3.0)

    /* Phase B — the camera drops with the cap: bottle & headline exit upward */
      .to("#line2", { opacity: 0, y: -30, duration: 0.5 }, 2.6)
      .to(".kicker", { opacity: 0, duration: 0.4 }, 2.6)
      .to("#bottleBody", { y: () => -window.innerHeight * 1.4, duration: 1.4, ease: "power2.in" }, 2.7)
      .to("#cap", { y: 60, x: 0, duration: 1.4, ease: "power1.inOut" }, 2.7)

    /* Phase C — the world passes: street → drain → river → sea */
      .to("#fallWorld", { y: "-440vh", duration: 6.9, ease: "none" }, 3.1)
      .to("#cap", { rotation: "+=680", duration: 6.9, ease: "none" }, 3.1)
      .to("#cap", { x: 44, yoyo: true, repeat: 4, duration: 1.35, ease: "sine.inOut" }, 3.3)

    /* water swallows the light */
      .to("#story", { backgroundColor: "#ded3bd", duration: 1.2, ease: "none" }, 3.1)
      .to("#story", { backgroundColor: "#31504a", duration: 1.6, ease: "none" }, 4.6)
      .to("#story", { backgroundColor: "#1c3d33", duration: 1.5, ease: "none" }, 6.4)
      .to("#story", { backgroundColor: C.forest, duration: 1.4, ease: "none" }, 7.9)
      .to("#story", { backgroundColor: C.deep, duration: 0.8, ease: "none" }, 9.2)

    /* the dark swallows the cap — it keeps sinking as the scene ends */
      .to("#cap", { y: "+=240", rotation: "+=60", duration: 1.0, ease: "none" }, 9.0)
      .to("#cap", { opacity: 0, duration: 0.6, ease: "none" }, 9.4);

    const beat = (sel, at, hold) => {
      tl.fromTo(sel, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5 }, at);
      tl.to(sel, { opacity: 0, y: -22, duration: 0.4 }, at + hold);
    };
    beat(".b1", 3.5, 1.0);
    beat(".b2", 4.8, 1.1);
    beat(".b3", 6.1, 1.0);
    beat(".b4", 7.3, 1.0);
    beat(".b5", 8.5, 1.2);

    /* gentle reveals for flowing copy */
    $$(".fix-copy p, .fix-line, .fix-diagram, .india .col > *, .deep .col > *").forEach((el) => {
      gsap.from(el, {
        opacity: 0, y: 30, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    /* re-measure pins once assets settle or the viewport changes size
       (some embedded webviews resize without firing window.resize) */
    window.addEventListener("load", () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    let rsT, lastW = window.innerWidth, lastH = window.innerHeight;
    new ResizeObserver(() => {
      if (window.innerWidth === lastW && window.innerHeight === lastH) return;
      lastW = window.innerWidth; lastH = window.innerHeight;
      clearTimeout(rsT);
      rsT = setTimeout(() => ScrollTrigger.refresh(), 180);
    }).observe(document.documentElement);

    /* india number counts up when reached */
    const num = $("#indiaNumber");
    const counter = { v: 0 };
    gsap.to(counter, {
      v: 25e9, duration: 2.4, ease: "power2.out",
      scrollTrigger: { trigger: num, start: "top 80%" },
      onUpdate: () => { num.textContent = Math.round(counter.v).toLocaleString("en-IN"); },
    });
  }

  /* ————— objection stickers ————— */
  $$("[data-flip]").forEach((s) => s.addEventListener("click", () => s.classList.toggle("is-flipped")));

})();
