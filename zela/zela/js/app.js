/*
  Zela — funções compartilhadas por todas as páginas.
  - leitura e gravação no navegador (localStorage)
  - junção dos relatos simulados com os relatos criados pelo usuário
  - preferências de acessibilidade (texto maior e alto contraste)
  - menu no celular e avisos para leitor de tela
*/
(function () {
  "use strict";

  var DADOS = window.ZELA_DADOS;
  var Z = (window.Zela = {});

  /* ---------- Armazenamento seguro ---------- */
  var CHAVES = {
    relatos: "zela:relatos",       // relatos criados neste navegador
    alteracoes: "zela:alteracoes", // andamentos novos em relatos simulados
    apoios: "zela:apoios",         // protocolos que o usuário apoiou
    prefs: "zela:prefs",           // texto maior, alto contraste
    rascunho: "zela:rascunho"      // formulário de relato em andamento
  };
  Z.CHAVES = CHAVES;

  Z.ler = function (chave, padrao) {
    try {
      var valor = window.localStorage.getItem(chave);
      return valor ? JSON.parse(valor) : padrao;
    } catch (e) {
      return padrao;
    }
  };
  Z.gravar = function (chave, valor) {
    try {
      window.localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (e) {
      return false;
    }
  };
  Z.apagar = function (chave) {
    try { window.localStorage.removeItem(chave); } catch (e) { /* sem armazenamento */ }
  };

  /* ---------- Dados ---------- */
  Z.categorias = DADOS.categorias;
  Z.statusInfo = DADOS.status;
  Z.fluxo = DADOS.fluxo;

  Z.categoria = function (id) {
    for (var i = 0; i < DADOS.categorias.length; i++) {
      if (DADOS.categorias[i].id === id) return DADOS.categorias[i];
    }
    return null;
  };

  function copiar(obj) { return JSON.parse(JSON.stringify(obj)); }

  /* Status atual = último registro do histórico */
  Z.statusAtual = function (relato) {
    return relato.historico[relato.historico.length - 1].status;
  };

  Z.meusRelatos = function () { return Z.ler(CHAVES.relatos, []); };
  Z.meusApoios = function () { return Z.ler(CHAVES.apoios, []); };

  Z.todosRelatos = function () {
    var base = copiar(DADOS.relatos);
    var meus = Z.meusRelatos().map(function (r) { r.meu = true; return r; });
    var alteracoes = Z.ler(CHAVES.alteracoes, {});
    var apoios = Z.meusApoios();

    var todos = base.concat(meus);
    todos.forEach(function (r) {
      if (alteracoes[r.protocolo]) {
        r.historico = r.historico.concat(alteracoes[r.protocolo]);
      }
      r.apoiado = apoios.indexOf(r.protocolo) !== -1;
      if (r.apoiado) r.apoios += 1;
      r.status = Z.statusAtual(r);
      r.criadoEm = r.historico[0].data;
    });
    return todos;
  };

  Z.buscarRelato = function (protocolo) {
    var alvo = Z.normalizarProtocolo(protocolo);
    var todos = Z.todosRelatos();
    for (var i = 0; i < todos.length; i++) {
      if (todos[i].protocolo === alvo) return todos[i];
    }
    return null;
  };

  /* Aceita "zl 2026 4812", "ZL-2026-004812" ou só "4812" */
  Z.normalizarProtocolo = function (texto) {
    var limpo = String(texto || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
    var m = limpo.match(/^(?:ZL)?(?:2026)?(\d{1,6})$/);
    if (!m) return limpo;
    return "ZL-2026-" + ("000000" + m[1]).slice(-6);
  };

  Z.gerarProtocolo = function () {
    var existentes = Z.todosRelatos().map(function (r) { return r.protocolo; });
    var novo;
    do {
      novo = "ZL-2026-" + String(Math.floor(5300 + Math.random() * 90000)).padStart(6, "0");
    } while (existentes.indexOf(novo) !== -1);
    return novo;
  };

  Z.salvarRelato = function (relato) {
    var meus = Z.meusRelatos();
    meus.push(relato);
    return Z.gravar(CHAVES.relatos, meus);
  };

  Z.adicionarAndamento = function (protocolo, registro) {
    var meus = Z.meusRelatos();
    for (var i = 0; i < meus.length; i++) {
      if (meus[i].protocolo === protocolo) {
        meus[i].historico.push(registro);
        return Z.gravar(CHAVES.relatos, meus);
      }
    }
    var alteracoes = Z.ler(CHAVES.alteracoes, {});
    alteracoes[protocolo] = (alteracoes[protocolo] || []).concat([registro]);
    return Z.gravar(CHAVES.alteracoes, alteracoes);
  };

  /* Liga ou desliga o apoio. Retorna true se ficou apoiado. */
  Z.alternarApoio = function (protocolo) {
    var apoios = Z.meusApoios();
    var pos = apoios.indexOf(protocolo);
    if (pos === -1) apoios.push(protocolo); else apoios.splice(pos, 1);
    Z.gravar(CHAVES.apoios, apoios);
    return pos === -1;
  };

  /* ---------- Datas e prazos ---------- */
  var MESES = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];

  Z.data = function (iso) { return new Date(iso); };

  Z.formatarData = function (iso, comHora) {
    var d = Z.data(iso);
    var texto = d.getDate() + " de " + MESES[d.getMonth()] + " de " + d.getFullYear();
    if (comHora) {
      texto += ", " + String(d.getHours()).padStart(2, "0") + "h" + String(d.getMinutes()).padStart(2, "0");
    }
    return texto;
  };

  Z.diasEntre = function (a, b) {
    var umDia = 24 * 60 * 60 * 1000;
    var inicio = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    var fim = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((fim - inicio) / umDia);
  };

  Z.haQuanto = function (iso) {
    var dias = Z.diasEntre(Z.data(iso), new Date());
    if (dias <= 0) return "hoje";
    if (dias === 1) return "ontem";
    if (dias < 30) return "há " + dias + " dias";
    var meses = Math.round(dias / 30);
    return meses === 1 ? "há 1 mês" : "há " + meses + " meses";
  };

  /* Prazo previsto a partir da data do relato e da categoria */
  Z.prazo = function (relato) {
    var cat = Z.categoria(relato.categoria);
    var limite = Z.data(relato.historico[0].data);
    limite.setDate(limite.getDate() + cat.prazoDias);
    var faltam = Z.diasEntre(new Date(), limite);
    return { limite: limite, faltam: faltam, dias: cat.prazoDias };
  };

  Z.textoPrazo = function (relato) {
    if (relato.status === "resolvido") {
      var fim = relato.historico[relato.historico.length - 1].data;
      var levou = Z.diasEntre(Z.data(relato.historico[0].data), Z.data(fim));
      return levou <= 0 ? "Resolvido no mesmo dia" : "Resolvido em " + levou + (levou === 1 ? " dia" : " dias");
    }
    var p = Z.prazo(relato);
    if (p.faltam > 1) return "Prazo previsto: faltam " + p.faltam + " dias";
    if (p.faltam === 1) return "Prazo previsto: termina amanhã";
    if (p.faltam === 0) return "Prazo previsto: termina hoje";
    var atraso = -p.faltam;
    return "Atrasado há " + atraso + (atraso === 1 ? " dia" : " dias");
  };

  Z.atrasado = function (relato) {
    return relato.status !== "resolvido" && Z.prazo(relato).faltam < 0;
  };

  /* ---------- Texto ---------- */
  Z.escapar = function (texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  /* Remove acentos e caixa para comparar endereços */
  Z.normalizar = function (texto) {
    return String(texto || "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\b(rua|r|avenida|av|estrada|estr|travessa|tv|alameda|al|praca)\b\.?/g, "")
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  Z.plural = function (n, um, varios) { return n + " " + (n === 1 ? um : varios); };

  /* ---------- Ícones (SVG decorativos) ---------- */
  var ICONES = {
    poste: '<path d="M9 21h6"/><path d="M12 21V8a4 4 0 0 1 4-4h1"/><path d="M16 4h4l-1 3h-2z"/><path d="M18 9v1.5M20.5 8.5l1 1M15.5 8.5l-1 1"/>',
    buraco: '<path d="M3 17h18"/><ellipse cx="12" cy="17" rx="5" ry="1.6"/><path d="M5 13l2-2M19 13l-2-2M12 11V8"/>',
    calcada: '<path d="M3 19h18"/><path d="M3 15h7l2-3h9"/><path d="M7 15v4M15 12v7"/>',
    lixo: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>',
    arvore: '<path d="M12 21v-6"/><path d="M8 21h8"/><path d="M12 3a5 5 0 0 0-5 5 4 4 0 0 0 1 7h8a4 4 0 0 0 1-7 5 5 0 0 0-5-5z"/>',
    bueiro: '<rect x="4" y="6" width="16" height="12" rx="1"/><path d="M8 6v12M12 6v12M16 6v12"/>',
    placa: '<path d="M12 3l9 9-9 9-9-9z"/><path d="M12 8v5M12 16v.01"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    alerta: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
    copiar: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    local: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    pessoas: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    lupa: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    mais: '<path d="M12 5v14M5 12h14"/>'
  };

  Z.icone = function (nome, classe) {
    return '<svg class="icone ' + (classe || "") + '" viewBox="0 0 24 24" width="24" height="24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false">' + (ICONES[nome] || "") + "</svg>";
  };

  /* Selo de status: sempre com texto, nunca só cor */
  Z.seloStatus = function (status) {
    var info = Z.statusInfo[status];
    return '<span class="selo selo--' + status + '">' + Z.escapar(info.nome) + "</span>";
  };

  /* ---------- Avisos para todos (visual e leitor de tela) ---------- */
  var timerAviso;
  Z.avisar = function (mensagem) {
    var area = document.getElementById("aviso-global");
    if (!area) return;
    area.textContent = "";
    // pequeno atraso garante que o leitor de tela anuncie mesmo mensagens repetidas
    window.setTimeout(function () {
      area.textContent = mensagem;
      area.classList.add("aviso-global--visivel");
    }, 60);
    window.clearTimeout(timerAviso);
    timerAviso = window.setTimeout(function () {
      area.classList.remove("aviso-global--visivel");
    }, 5000);
  };

  Z.copiarTexto = function (texto) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto);
    }
    return new Promise(function (resolve, reject) {
      var campo = document.createElement("textarea");
      campo.value = texto;
      campo.setAttribute("readonly", "");
      campo.style.position = "absolute";
      campo.style.left = "-9999px";
      document.body.appendChild(campo);
      campo.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(campo);
    });
  };

  /* ---------- Preferências de acessibilidade ---------- */
  function aplicarPrefs(prefs) {
    var raiz = document.documentElement;
    raiz.classList.toggle("texto-maior", !!prefs.textoMaior);
    raiz.classList.toggle("alto-contraste", !!prefs.altoContraste);
    var bTexto = document.getElementById("pref-texto");
    var bContraste = document.getElementById("pref-contraste");
    if (bTexto) bTexto.setAttribute("aria-pressed", String(!!prefs.textoMaior));
    if (bContraste) bContraste.setAttribute("aria-pressed", String(!!prefs.altoContraste));
  }

  function iniciarPrefs() {
    var prefs = Z.ler(CHAVES.prefs, {});
    aplicarPrefs(prefs);

    var bTexto = document.getElementById("pref-texto");
    var bContraste = document.getElementById("pref-contraste");
    if (bTexto) {
      bTexto.addEventListener("click", function () {
        prefs.textoMaior = !prefs.textoMaior;
        Z.gravar(CHAVES.prefs, prefs);
        aplicarPrefs(prefs);
        Z.avisar(prefs.textoMaior ? "Texto maior ligado." : "Texto maior desligado.");
      });
    }
    if (bContraste) {
      bContraste.addEventListener("click", function () {
        prefs.altoContraste = !prefs.altoContraste;
        Z.gravar(CHAVES.prefs, prefs);
        aplicarPrefs(prefs);
        Z.avisar(prefs.altoContraste ? "Alto contraste ligado." : "Alto contraste desligado.");
      });
    }
  }

  /* ---------- Menu no celular ---------- */
  function iniciarMenu() {
    var botao = document.getElementById("botao-menu");
    var menu = document.getElementById("menu-principal");
    if (!botao || !menu) return;

    function fechar(devolverFoco) {
      botao.setAttribute("aria-expanded", "false");
      menu.classList.remove("menu--aberto");
      if (devolverFoco) botao.focus();
    }

    botao.addEventListener("click", function () {
      var aberto = botao.getAttribute("aria-expanded") === "true";
      if (aberto) {
        fechar(false);
      } else {
        botao.setAttribute("aria-expanded", "true");
        menu.classList.add("menu--aberto");
        var primeiro = menu.querySelector("a");
        if (primeiro) primeiro.focus();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && botao.getAttribute("aria-expanded") === "true") fechar(true);
    });
  }

  /* Contador no menu: quantos relatos este navegador acompanha */
  function iniciarContadorMenu() {
    var alvo = document.getElementById("contador-meus");
    if (!alvo) return;
    var total = Z.meusRelatos().length + Z.meusApoios().length;
    if (total > 0) {
      alvo.textContent = String(total);
      alvo.hidden = false;
      alvo.setAttribute("aria-label", Z.plural(total, "relato acompanhado", "relatos acompanhados"));
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    iniciarPrefs();
    iniciarMenu();
    iniciarContadorMenu();
    var ano = document.getElementById("ano-atual");
    if (ano) ano.textContent = String(new Date().getFullYear());
  });

  /* Aplica preferências o quanto antes para evitar "piscar" o layout */
  aplicarPrefs(Z.ler(CHAVES.prefs, {}));
})();
