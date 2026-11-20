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

  /* ---------- Ícones (traço 2px, estilo Lucide, licença ISC) ---------- */
  var ICONES = {
    poste: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    buraco: '<path d="M9.3 6.2a4.55 4.55 0 0 0 5.4 0"/><path d="M7.9 10.7c.9.8 2.4 1.3 4.1 1.3s3.2-.5 4.1-1.3"/><path d="M13.9 3.5a1.93 1.93 0 0 0-3.8-.1l-3 10c-.1.2-.1.4-.1.6 0 1.7 2.2 3 5 3s5-1.3 5-3c0-.2 0-.4-.1-.5Z"/><path d="m7.5 12.2-4.7 2.7c-.5.3-.8.7-.8 1.1s.3.8.8 1.1l7.6 4.5c.9.5 2.1.5 3 0l7.6-4.5c.7-.3 1-.7 1-1.1s-.3-.8-.8-1.1l-4.7-2.8"/>',
    calcada: '<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/>',
    lixo: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    arvore: '<path d="M8 19a4 4 0 0 1-2.24-7.32A3.5 3.5 0 0 1 9 6.03V6a3 3 0 1 1 6 0v.04a3.5 3.5 0 0 1 3.24 5.65A4 4 0 0 1 16 19Z"/><path d="M12 19v3"/>',
    bueiro: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
    placa: '<path d="M12 13v8"/><path d="M12 3v3"/><path d="M4 6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h13a2 2 0 0 0 1.152-.365l3.424-2.317a1 1 0 0 0 0-1.635l-3.424-2.318A2 2 0 0 0 17 6z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alerta: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    copiar: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    local: '<path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    mira: '<path d="M2 12h3"/><path d="M19 12h3"/><path d="M12 2v3"/><path d="M12 19v3"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>',
    pessoas: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    lupa: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    mais: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    seta: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    voltar: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    lapis: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
    imagem: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    texto: '<path d="M21 14h-5"/><path d="M16 16v-3.5a2.5 2.5 0 0 1 5 0V16"/><path d="M4.5 13h6"/><path d="m3 16 4.5-9 4.5 9"/>',
    contraste: '<circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12v12z"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    fechar: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    telefone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    escudo: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    ajuda: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    sucesso: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'
  };

  Z.icone = function (nome, classe) {
    return '<svg class="icone ' + (classe || "") + '" viewBox="0 0 24 24" width="24" height="24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false">' + (ICONES[nome] || "") + "</svg>";
  };

  /* Troca <span data-icone="nome"></span> pelo desenho do ícone */
  Z.desenharIcones = function (raiz) {
    (raiz || document).querySelectorAll("[data-icone]").forEach(function (el) {
      el.outerHTML = Z.icone(el.getAttribute("data-icone"), el.className);
    });
  };

  /* Selo de status: sempre com texto, nunca só cor */
  Z.seloStatus = function (status) {
    var info = Z.statusInfo[status];
    return '<span class="selo selo--' + status + '">' + Z.escapar(info.nome) + "</span>";
  };

  /* ---------- Avisos para todos (visual e leitor de tela) ---------- */
  var timerAviso;
  Z.avisar = function (mensagem, tipo) {
    var area = document.getElementById("aviso-global");
    if (!area) return;
    area.textContent = "";
    // pequeno atraso garante que o leitor de tela anuncie mesmo mensagens repetidas
    window.setTimeout(function () {
      area.innerHTML = Z.icone(tipo === "alerta" ? "alerta" : "sucesso") + "<span></span>";
      area.classList.toggle("aviso-global--alerta", tipo === "alerta");
      area.querySelector("span").textContent = mensagem;
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
      botao.setAttribute("aria-label", "Abrir menu");
      botao.innerHTML = Z.icone("menu");
      menu.classList.remove("menu--aberto");
      if (devolverFoco) botao.focus();
    }

    botao.addEventListener("click", function () {
      var aberto = botao.getAttribute("aria-expanded") === "true";
      if (aberto) {
        fechar(false);
      } else {
        botao.setAttribute("aria-expanded", "true");
        botao.setAttribute("aria-label", "Fechar menu");
        botao.innerHTML = Z.icone("fechar");
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
    Z.desenharIcones();
    iniciarPrefs();
    iniciarMenu();
    iniciarContadorMenu();
    var ano = document.getElementById("ano-atual");
    if (ano) ano.textContent = String(new Date().getFullYear());
  });

  /* Aplica preferências o quanto antes para evitar "piscar" o layout */
  aplicarPrefs(Z.ler(CHAVES.prefs, {}));
})();
