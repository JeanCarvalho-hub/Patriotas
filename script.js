/* ==========================================================================
   PATRIOTAS — script.js
   JavaScript puro, modular, sem dependências.
   Módulos: Config · Navbar · Reveal · Ripple · Ambience · PhoneChat · Faq · Misc
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- config */
  var CONFIG = {
    // ⚠️ Troque pelo link real do grupo / checkout:
    whatsappUrl: 'https://chat.whatsapp.com/SEU-LINK-AQUI',
    navSolidAt: 40,        // px de scroll para a navbar ganhar fundo
    particleCount: 26,
    chatInterval: 3000     // ms entre as mensagens do mockup
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- navbar */
  var Navbar = {
    init: function () {
      this.nav    = $('#nav');
      this.burger = $('#burger');
      this.mobile = $('#navMobile');
      if (!this.nav) return;

      this.onScroll = this.onScroll.bind(this);
      this.ticking  = false;

      window.addEventListener('scroll', this.request.bind(this), { passive: true });
      this.onScroll();

      if (this.burger) {
        this.burger.addEventListener('click', this.toggle.bind(this));
      }
      // fecha o menu ao clicar num link
      $$('a', this.mobile).forEach(function (a) {
        a.addEventListener('click', this.close.bind(this));
      }, this);
    },

    request: function () {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(function () {
        this.onScroll();
        this.ticking = false;
      }.bind(this));
    },

    onScroll: function () {
      this.nav.classList.toggle('nav--solid', window.scrollY > CONFIG.navSolidAt);
    },

    toggle: function () {
      var open = this.mobile.classList.toggle('nav__mobile--open');
      this.burger.setAttribute('aria-expanded', String(open));
      this.burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    },

    close: function () {
      this.mobile.classList.remove('nav__mobile--open');
      this.burger.setAttribute('aria-expanded', 'false');
    }
  };

  /* ---------------------------------------------------------------- reveal */
  var Reveal = {
    init: function () {
      var items = $$('.reveal');
      if (!items.length) return;

      if (reduceMotion || !('IntersectionObserver' in window)) {
        items.forEach(function (el) { el.classList.add('is-visible'); });
        return;
      }

      var obs = new IntersectionObserver(function (entries, o) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var d  = parseInt(el.dataset.delay || 0, 10);
          el.style.transitionDelay = d + 'ms';
          el.classList.add('is-visible');
          o.unobserve(el);
        });
      }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });

      items.forEach(function (el) { obs.observe(el); });
    }
  };

  /* ---------------------------------------------------------------- ripple */
  var Ripple = {
    init: function () {
      document.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.js-ripple') : null;
        if (!btn || reduceMotion) return;

        var rect = btn.getBoundingClientRect();
        var span = document.createElement('span');
        span.className = 'ripple';
        span.style.left = (e.clientX - rect.left) + 'px';
        span.style.top  = (e.clientY - rect.top)  + 'px';
        btn.appendChild(span);
        setTimeout(function () { span.remove(); }, 650);
      });
    }
  };

  /* -------------------------------------------------- ambience (parallax) */
  var Ambience = {
    init: function () {
      this.layers = $$('[data-parallax]');
      this.spawnParticles();

      if (reduceMotion || !this.layers.length) return;

      this.ticking = false;
      window.addEventListener('scroll', this.request.bind(this), { passive: true });
    },

    request: function () {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        this.layers.forEach(function (el) {
          var f = parseFloat(el.dataset.parallax) || 0;
          el.style.transform = 'translate3d(0,' + (y * f).toFixed(1) + 'px,0)';
        });
        this.ticking = false;
      }.bind(this));
    },

    spawnParticles: function () {
      var host = $('#particles');
      if (!host || reduceMotion) return;

      var frag = document.createDocumentFragment();
      for (var i = 0; i < CONFIG.particleCount; i++) {
        var p = document.createElement('span');
        var size = 1 + (i % 3);
        p.className = 'particle';
        p.style.left  = ((i * 37) % 100) + '%';
        p.style.top   = ((i * 61) % 100) + '%';
        p.style.width  = size + 'px';
        p.style.height = size + 'px';
        p.style.animationDuration = (9 + (i % 7) * 2.4) + 's';
        p.style.animationDelay    = ((i % 9) * 1.1) + 's';
        frag.appendChild(p);
      }
      host.appendChild(frag);
    }
  };

  /* ------------------------------------------------------------ phone chat */
  var PhoneChat = {
    messages: [
      { t: 'Resumo da manhã: as 3 pautas que entram em votação hoje.', h: '07:12' },
      { t: 'Análise do discurso de ontem — áudio de 3 min com o contexto completo.', h: '10:48' },
      { t: 'Saiu pesquisa nova. Leia a metodologia antes de tirar conclusão.', h: '14:05' },
      { t: 'Fechamento do dia: o que aconteceu e o que esperar amanhã.', h: '20:30' }
    ],

    init: function () {
      this.host = $('#chatBody');
      if (!this.host) return;

      this.count = 2;
      this.render();

      if (reduceMotion) return;

      this.timer = setInterval(this.tick.bind(this), CONFIG.chatInterval);

      // pausa o ciclo quando a aba está oculta (economiza CPU/bateria)
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          clearInterval(this.timer);
        } else {
          this.timer = setInterval(this.tick.bind(this), CONFIG.chatInterval);
        }
      }.bind(this));
    },

    tick: function () {
      this.count = this.count >= this.messages.length ? 2 : this.count + 1;
      this.render();
    },

    render: function () {
      var html = '';
      for (var i = 0; i < this.count; i++) {
        var m = this.messages[i];
        html += '<div class="bubble"><p>' + m.t + '</p><time>' + m.h + ' ✓✓</time></div>';
      }
      html += '<div class="typing"><i></i><i></i><i></i></div>';
      this.host.innerHTML = html;
    }
  };

  /* ------------------------------------------------------------------ FAQ */
  var Faq = {
    init: function () {
      var list = $('#faqList');
      if (!list) return;

      this.rows = $$('.faq__row', list);

      list.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.faq__q') : null;
        if (!btn) return;
        this.toggle(btn.parentElement);
      }.bind(this));

      // primeira pergunta aberta por padrão
      if (this.rows[0]) this.open(this.rows[0]);
    },

    toggle: function (row) {
      row.classList.contains('faq__row--open') ? this.close(row) : this.openOnly(row);
    },

    openOnly: function (row) {
      this.rows.forEach(function (r) { if (r !== row) this.close(r); }, this);
      this.open(row);
    },

    open: function (row) {
      row.classList.add('faq__row--open');
      $('.faq__q', row).setAttribute('aria-expanded', 'true');
    },

    close: function (row) {
      row.classList.remove('faq__row--open');
      $('.faq__q', row).setAttribute('aria-expanded', 'false');
    }
  };

  /* ----------------------------------------------------------------- misc */
  var Misc = {
    init: function () {
      // ano do rodapé
      var y = $('#year');
      if (y) y.textContent = new Date().getFullYear();

      // aplica o link real do WhatsApp nos CTAs marcados
      $$('[data-whatsapp]').forEach(function (a) {
        a.href = CONFIG.whatsappUrl;
        a.target = '_blank';
        a.rel = 'noopener';
      });
    }
  };

  /* ------------------------------------------------------------------ boot */
  function boot() {
    Navbar.init();
    Reveal.init();
    Ripple.init();
    Ambience.init();
    PhoneChat.init();
    Faq.init();
    Misc.init();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();
})();
