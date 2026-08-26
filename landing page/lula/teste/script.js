/* ============================================================
   A DESPRESIDÊNCIA DE LULA — comportamentos da página
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     CONFIGURAÇÃO — altere apenas esta parte
     ---------------------------------------------------------- */
  const CONFIG = {

    // Cole aqui o link do seu checkout (Kiwify, Hotmart, Cakto, Pix etc.).
    // Enquanto estiver vazio, os botões apenas rolam até a seção de oferta.
    linkCheckout: '',

    // ── PRAZO DA OFERTA ────────────────────────────────────────
    // Formato: 'AAAA-MM-DDTHH:MM:SS'   ex.: '2026-08-31T23:59:59'
    fimDaPromocao: '2026-08-24T23:59:59',

    // Campanha recorrente. O relógio reinicia a cada ciclo de X dias,
    // contando a partir da data acima. Já vem ligado, em ciclo semanal:
    // a oferta fecha todo domingo à meia-noite e reabre na segunda.
    //
    // CONDIÇÃO: no fim de cada ciclo o preço precisa realmente voltar
    // para R$ 30,00, nem que seja por algumas horas. Contador que
    // reinicia sem o preço mudar é publicidade enganosa (art. 37 do CDC),
    // gera chargeback e o público reconhece o truque.
    // Para prazo único, deixe cicloDias em 0.
    cicloDias: 7,

    // Se não houver prazo definido, o relógio some da página
    // em vez de mostrar um número inventado.
    ocultarContadorSemPrazo: true,

    // Horas restantes para acionar cada estágio visual de urgência
    limiteUrgente: 12,   // digitos ganham brilho vermelho
    limiteCritico: 2     // digitos passam a pulsar
  };

  /* ----------------------------------------------------------
     1. BOTÕES DE COMPRA
     ---------------------------------------------------------- */
  function ligarBotoes() {
    const botoes = document.querySelectorAll('[data-comprar]');

    botoes.forEach(function (botao) {
      if (CONFIG.linkCheckout) {
        botao.setAttribute('href', CONFIG.linkCheckout);
        botao.setAttribute('rel', 'noopener');
        return;
      }

      // Sem checkout configurado: rola suavemente até a oferta.
      botao.addEventListener('click', function (evento) {
        const destino = document.getElementById('oferta');
        if (!destino) return;
        evento.preventDefault();
        destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ----------------------------------------------------------
     2. RELÓGIO REGRESSIVO
     Um único relógio alimenta o bloco da oferta e o mini do hero.
     ---------------------------------------------------------- */
  function calcularAlvo() {
    // ciclo recorrente tem prioridade, se estiver configurado
    if (CONFIG.cicloDias > 0 && CONFIG.fimDaPromocao) {
      const base = new Date(CONFIG.fimDaPromocao).getTime();
      if (isNaN(base)) return null;

      const ciclo = CONFIG.cicloDias * 86400000;
      let alvo = base;
      const agora = Date.now();
      while (alvo <= agora) alvo += ciclo;
      return alvo;
    }

    if (!CONFIG.fimDaPromocao) return null;
    const fixo = new Date(CONFIG.fimDaPromocao).getTime();
    return isNaN(fixo) ? null : fixo;
  }

  function ligarRelogio() {
    const caixa = document.querySelector('[data-contador]');
    const mini = document.querySelector('[data-relogio-mini]');
    const alvo = calcularAlvo();

    if (!alvo) {
      if (CONFIG.ocultarContadorSemPrazo) {
        if (caixa) caixa.style.display = 'none';
        if (mini) mini.hidden = true;
      }
      return;
    }

    if (mini) mini.hidden = false;

    const elH = caixa ? caixa.querySelector('[data-horas]') : null;
    const elM = caixa ? caixa.querySelector('[data-min]') : null;
    const elS = caixa ? caixa.querySelector('[data-seg]') : null;
    const rot = caixa ? caixa.querySelector('[data-urgencia]') : null;

    // rótulos das unidades: viram dias/horas/min quando o prazo é longo
    const rotulos = caixa
      ? caixa.querySelectorAll('.contador__digitos > div > span')
      : [];
    const rotuloH = rotulos[0] || null;
    const rotuloM = rotulos[1] || null;
    const rotuloS = rotulos[2] || null;

    const barra = caixa ? caixa.querySelector('[data-barra-tempo]') : null;
    const aviso = caixa ? caixa.querySelector('[data-aviso]') : null;

    const miniH = mini ? mini.querySelector('[data-mini-h]') : null;
    const miniM = mini ? mini.querySelector('[data-mini-m]') : null;
    const miniS = mini ? mini.querySelector('[data-mini-s]') : null;

    const inicio = Date.now();
    const total = Math.max(alvo - inicio, 1);
    let ultimoSeg = -1;

    function dd(n) { return String(n).padStart(2, '0'); }

    function encerrar() {
      [elH, elM, elS, miniH, miniM, miniS].forEach(function (el) {
        if (el) el.textContent = '00';
      });
      if (caixa) {
        caixa.classList.remove('urgente', 'critico');
        caixa.classList.add('encerrado');
      }
      if (rot) rot.textContent = 'Oferta de lançamento encerrada';
      if (barra) barra.style.transform = 'scaleX(0)';
      if (aviso) aviso.textContent = 'O dossiê voltou ao preço cheio de R$ 30,00.';
      if (mini) mini.hidden = true;
      clearInterval(intervalo);
    }

    function atualizar() {
      const restante = alvo - Date.now();
      if (restante <= 0) return encerrar();

      const horasTotais = Math.floor(restante / 3600000);
      const min = Math.floor((restante % 3600000) / 60000);
      const seg = Math.floor((restante % 60000) / 1000);

      // acima de 48h fica mais legível mostrar dias
      const usarDias = horasTotais >= 48;
      const dias = Math.floor(restante / 86400000);
      const horas = usarDias ? Math.floor((restante % 86400000) / 3600000) : horasTotais;

      if (rotuloH) rotuloH.textContent = usarDias ? 'dias' : 'horas';
      if (rotuloM) rotuloM.textContent = usarDias ? 'horas' : 'min';
      if (rotuloS) rotuloS.textContent = usarDias ? 'min' : 'seg';

      if (usarDias) {
        if (elH) elH.textContent = dd(dias);
        if (elM) elM.textContent = dd(horas);
        if (elS) elS.textContent = dd(min);
        if (miniH) miniH.textContent = dd(dias);
        if (miniM) miniM.textContent = dd(horas);
        if (miniS) miniS.textContent = dd(min);
        if (barra) barra.style.transform = 'scaleX(' + Math.max(restante / total, 0).toFixed(4) + ')';
        if (caixa) {
          caixa.classList.remove('urgente', 'critico');
          if (rot) rot.innerHTML = '<span class="pisca pisca--pequeno"></span> A oferta de lançamento termina em';
        }
        return;
      }

      if (elH) elH.textContent = dd(horas);
      if (elM) elM.textContent = dd(min);
      if (elS) elS.textContent = dd(seg);
      if (miniH) miniH.textContent = dd(horas);
      if (miniM) miniM.textContent = dd(min);
      if (miniS) miniS.textContent = dd(seg);

      // tique visual no segundo
      if (elS && seg !== ultimoSeg) {
        ultimoSeg = seg;
        elS.classList.add('tique');
        setTimeout(function () { elS.classList.remove('tique'); }, 120);
      }

      // barra esvaziando
      if (barra) {
        const fracao = Math.max(restante / total, 0);
        barra.style.transform = 'scaleX(' + fracao.toFixed(4) + ')';
      }

      // estágios de urgência
      if (caixa) {
        const horasRestantes = restante / 3600000;
        caixa.classList.toggle('urgente', horasRestantes <= CONFIG.limiteUrgente);
        caixa.classList.toggle('critico', horasRestantes <= CONFIG.limiteCritico);

        if (rot) {
          const pisca = '<span class="pisca pisca--pequeno"></span>';
          if (horasRestantes <= CONFIG.limiteCritico) {
            rot.innerHTML = pisca + ' Últimos minutos desta oferta';
          } else if (horasRestantes <= CONFIG.limiteUrgente) {
            rot.innerHTML = pisca + ' Últimas horas — o preço sobe em seguida';
          } else {
            rot.innerHTML = pisca + ' A oferta de lançamento termina em';
          }
        }
      }
    }

    atualizar();
    const intervalo = setInterval(atualizar, 1000);
  }

  /* ----------------------------------------------------------
     3. ANIMAÇÃO DE ENTRADA DAS SEÇÕES
     ---------------------------------------------------------- */
  function ligarAnimacoes() {
    const alvos = document.querySelectorAll('[data-anima]');
    if (!alvos.length) return;

    if (!('IntersectionObserver' in window)) {
      alvos.forEach(function (el) { el.classList.add('visivel'); });
      return;
    }

    const observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('visivel');
        observador.unobserve(entrada.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    alvos.forEach(function (el) { observador.observe(el); });
  }

  /* ----------------------------------------------------------
     4. BARRA FIXA DE COMPRA (mobile)
     ---------------------------------------------------------- */
  function ligarBarraFixa() {
    const barra = document.querySelector('[data-barra]');
    const hero  = document.querySelector('.hero');
    const oferta = document.getElementById('oferta');
    if (!barra || !hero) return;

    function avaliar() {
      const passouDoHero = window.scrollY > hero.offsetHeight * 0.75;

      // Some quando a própria seção de oferta está na tela,
      // para não competir com o botão principal.
      let ofertaVisivel = false;
      if (oferta) {
        const r = oferta.getBoundingClientRect();
        ofertaVisivel = r.top < window.innerHeight && r.bottom > 0;
      }

      barra.classList.toggle('visivel', passouDoHero && !ofertaVisivel);
    }

    let travado = false;
    window.addEventListener('scroll', function () {
      if (travado) return;
      travado = true;
      window.requestAnimationFrame(function () {
        avaliar();
        travado = false;
      });
    }, { passive: true });

    avaliar();
  }

  /* ----------------------------------------------------------
     5. FAQ — abre um item por vez
     ---------------------------------------------------------- */
  function ligarFaq() {
    const grupo = document.querySelector('[data-faq]');
    if (!grupo) return;

    const itens = grupo.querySelectorAll('details');
    itens.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        itens.forEach(function (outro) {
          if (outro !== item) outro.open = false;
        });
      });
    });
  }

  /* ----------------------------------------------------------
     6. PARALLAX SUAVE NO FUNDO DO HERO
     ---------------------------------------------------------- */
  function ligarParallax() {
    const fundo = document.querySelector('.hero__bg');
    if (!fundo) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 900) return; // no celular, atrapalha mais do que ajuda

    let travado = false;
    window.addEventListener('scroll', function () {
      if (travado) return;
      travado = true;
      window.requestAnimationFrame(function () {
        const deslocamento = Math.min(window.scrollY * 0.18, 120);
        fundo.style.transform = 'translate3d(0,' + deslocamento + 'px,0) scale(1.06)';
        travado = false;
      });
    }, { passive: true });
  }


  /* ----------------------------------------------------------
     7. FUNDO ANIMADO — teia de conexões
     Mesmo motivo gráfico da capa do dossiê.
     ---------------------------------------------------------- */
  function ligarTeia(seletor, fator) {
    const tela = document.querySelector(seletor);
    if (!tela) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      tela.style.display = 'none';
      return;
    }
    const FATOR = fator || 1;

    const ctx = tela.getContext('2d');
    let larg = 0, alt = 0, dpr = 1;
    let nos = [];
    let animacao = null;
    let visivel = true;

    const CONEXAO = 168;   // distância máxima para ligar dois pontos
    const VERMELHO = '193, 23, 13';
    const CREME = '244, 241, 235';

    function densidade() {
      const area = larg * alt;
      // menos pontos no celular, para não pesar
      const divisor = (larg < 700 ? 26000 : 17000) / FATOR;
      return Math.min(Math.floor(area / divisor), 140);
    }

    function criarNos() {
      const total = densidade();
      nos = [];
      for (let i = 0; i < total; i++) {
        nos.push({
          x: Math.random() * larg,
          y: Math.random() * alt,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.6 + 0.9,
          destaque: Math.random() < 0.18
        });
      }
    }

    function redimensionar() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const caixa = tela.parentElement && tela.classList.contains('hero__teia')
        ? tela.parentElement.getBoundingClientRect()
        : null;
      larg = caixa ? caixa.width : window.innerWidth;
      alt = caixa ? caixa.height : window.innerHeight;
      tela.width = larg * dpr;
      tela.height = alt * dpr;
      tela.style.width = larg + 'px';
      tela.style.height = alt + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      criarNos();
    }

    function desenhar() {
      ctx.clearRect(0, 0, larg, alt);

      // ligações
      for (let i = 0; i < nos.length; i++) {
        for (let j = i + 1; j < nos.length; j++) {
          const dx = nos[i].x - nos[j].x;
          const dy = nos[i].y - nos[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist > CONEXAO) continue;

          const forca = 1 - dist / CONEXAO;
          const cor = (nos[i].destaque || nos[j].destaque) ? VERMELHO : CREME;
          const alfa = (nos[i].destaque || nos[j].destaque) ? forca * 0.42 : forca * 0.13;

          ctx.strokeStyle = 'rgba(' + cor + ',' + alfa + ')';
          ctx.lineWidth = forca * 1.1;
          ctx.beginPath();
          ctx.moveTo(nos[i].x, nos[i].y);
          ctx.lineTo(nos[j].x, nos[j].y);
          ctx.stroke();
        }
      }

      // pontos
      nos.forEach(function (n) {
        ctx.fillStyle = n.destaque
          ? 'rgba(' + VERMELHO + ',.85)'
          : 'rgba(' + CREME + ',.42)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();

        n.x += n.vx;
        n.y += n.vy;

        if (n.x < -20) n.x = larg + 20;
        if (n.x > larg + 20) n.x = -20;
        if (n.y < -20) n.y = alt + 20;
        if (n.y > alt + 20) n.y = -20;
      });

      animacao = requestAnimationFrame(desenhar);
    }

    function iniciarLoop() {
      if (animacao === null && visivel) animacao = requestAnimationFrame(desenhar);
    }
    function pararLoop() {
      if (animacao !== null) {
        cancelAnimationFrame(animacao);
        animacao = null;
      }
    }

    // pausa quando a aba sai de foco, para poupar bateria
    document.addEventListener('visibilitychange', function () {
      visivel = !document.hidden;
      visivel ? iniciarLoop() : pararLoop();
    });

    let tempo;
    window.addEventListener('resize', function () {
      clearTimeout(tempo);
      tempo = setTimeout(redimensionar, 180);
    });

    redimensionar();
    iniciarLoop();
  }

  /* ----------------------------------------------------------
     8. CARDS DE SEGREDO — revelar ao clicar
     ---------------------------------------------------------- */
  function ligarSegredos() {
    const area = document.querySelector('[data-segredos]');
    if (!area) return;

    area.querySelectorAll('.segredo').forEach(function (card) {
      const botao = card.querySelector('.segredo__botao');
      if (!botao) return;

      function revelar() {
        card.classList.add('revelado');
      }

      botao.addEventListener('click', revelar);
      card.addEventListener('click', function (e) {
        if (e.target !== botao) revelar();
      });
    });
  }

  /* ----------------------------------------------------------
     9. CONTADORES ANIMADOS
     ---------------------------------------------------------- */
  function ligarContadores() {
    const alvos = document.querySelectorAll('[data-contar]');
    if (!alvos.length) return;

    function animar(el) {
      const bruto = el.getAttribute('data-contar').replace('.', '').replace(',', '.');
      const destino = parseFloat(bruto);
      if (isNaN(destino)) return;

      const prefixo = el.getAttribute('data-prefixo') || '';
      const sufixo = el.getAttribute('data-sufixo') || '';
      const milhar = el.getAttribute('data-formato') === 'milhar';
      const casas = milhar ? 0 : (el.getAttribute('data-contar').split(',')[1] || '').length;

      const duracao = 1400;
      const inicio = performance.now();

      function passo(agora) {
        const t = Math.min((agora - inicio) / duracao, 1);
        // desaceleração suave
        const eased = 1 - Math.pow(1 - t, 3);
        const valor = destino * eased;

        let texto = milhar
          ? Math.round(valor).toLocaleString('pt-BR')
          : valor.toFixed(casas).replace('.', ',');

        el.textContent = prefixo + texto + sufixo;

        if (t < 1) requestAnimationFrame(passo);
      }

      requestAnimationFrame(passo);
    }

    if (!('IntersectionObserver' in window)) return;

    const obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        animar(e.target);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.6 });

    alvos.forEach(function (el) { obs.observe(el); });
  }

  /* ----------------------------------------------------------
     INICIALIZAÇÃO
     ---------------------------------------------------------- */
  function iniciar() {
    ligarBotoes();
    ligarRelogio();
    ligarAnimacoes();
    ligarBarraFixa();
    ligarFaq();
    ligarParallax();
    ligarTeia('#teia', 1);
    ligarTeia('.hero__teia', 1.5);
    ligarSegredos();
    ligarContadores();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
