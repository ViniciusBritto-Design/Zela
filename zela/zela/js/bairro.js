/*
  Página "Meu bairro"
  Filtros combinados com contagem anunciada, resumo do bairro,
  botão de apoio ("eu também") e endereço da página que guarda os filtros.
*/
(function () {
  "use strict";
  var Z = window.Zela;
  var POR_PAGINA = 8;

  var form = document.getElementById("filtros");
  var lista = document.getElementById("lista-relatos");
  var contagem = document.getElementById("contagem");
  var botaoMais = document.getElementById("mostrar-mais");
  var limite = POR_PAGINA;

  /* ---------- Opções dos filtros ---------- */
  function montarOpcoes() {
    var bairros = {};
    Z.todosRelatos().forEach(function (r) { bairros[r.bairro] = true; });
    var selBairro = form.elements.bairro;
    Object.keys(bairros).sort(function (a, b) { return a.localeCompare(b, "pt-BR"); }).forEach(function (b) {
      selBairro.insertAdjacentHTML("beforeend", '<option value="' + Z.escapar(b) + '">' + Z.escapar(b) + "</option>");
    });
    var selCat = form.elements.categoria;
    Z.categorias.forEach(function (c) {
      selCat.insertAdjacentHTML("beforeend", '<option value="' + c.id + '">' + Z.escapar(c.curto) + "</option>");
    });
  }

  function lerFiltros() {
    return {
      bairro: form.elements.bairro.value,
      categoria: form.elements.categoria.value,
      situacao: form.elements.situacao.value,
      ordem: form.elements.ordem.value,
      rua: form.elements.rua.value.trim()
    };
  }

  function filtrar(f) {
    var rua = Z.normalizar(f.rua);
    var itens = Z.todosRelatos().filter(function (r) {
      if (f.bairro && r.bairro !== f.bairro) return false;
      if (f.categoria && r.categoria !== f.categoria) return false;
      if (f.situacao === "abertos" && r.status === "resolvido") return false;
      if (f.situacao === "resolvido" && r.status !== "resolvido") return false;
      if (f.situacao === "atrasados" && !Z.atrasado(r)) return false;
      if (rua && Z.normalizar(r.rua + " " + r.referencia).indexOf(rua) === -1) return false;
      return true;
    });
    itens.sort(function (a, b) {
      if (f.ordem === "apoios") return b.apoios - a.apoios;
      if (f.ordem === "antigos") return a.criadoEm < b.criadoEm ? -1 : 1;
      return a.criadoEm < b.criadoEm ? 1 : -1;
    });
    return itens;
  }

  /* ---------- Resumo em números ---------- */
  function montarResumo(f) {
    var base = Z.todosRelatos().filter(function (r) {
      return (!f.bairro || r.bairro === f.bairro) && (!f.categoria || r.categoria === f.categoria);
    });
    var abertos = base.filter(function (r) { return r.status !== "resolvido"; });
    var resolvidos = base.filter(function (r) { return r.status === "resolvido"; });
    var atrasados = base.filter(Z.atrasado);
    var dias = resolvidos.map(function (r) {
      return Z.diasEntre(Z.data(r.criadoEm), Z.data(r.historico[r.historico.length - 1].data));
    });
    var media = dias.length ? Math.round(dias.reduce(function (a, b) { return a + b; }, 0) / dias.length) : null;

    var onde = f.bairro || "todos os bairros";
    document.getElementById("titulo-painel").textContent = "Resumo: " + onde;
    document.getElementById("numeros").innerHTML =
      '<div class="numeros__item"><dt>Ainda não resolvidos</dt><dd>' + abertos.length + "</dd></div>" +
      '<div class="numeros__item numeros__item--alerta"><dt>Atrasados</dt><dd>' + atrasados.length + "</dd></div>" +
      '<div class="numeros__item numeros__item--ok"><dt>Resolvidos</dt><dd>' + resolvidos.length + "</dd></div>" +
      '<div class="numeros__item"><dt>Tempo médio de conserto</dt><dd>' +
        (media === null ? "Sem dados" : Z.plural(media, "dia", "dias")) + "</dd></div>";
  }

  /* ---------- Lista ---------- */
  function cartao(r) {
    var cat = Z.categoria(r.categoria);
    var apoiar = r.meu ? '<p class="relato__seu">Você fez este relato</p>'
      : '<button type="button" class="botao botao--secundario botao--apoio" data-apoiar="' + r.protocolo + '" aria-pressed="' + r.apoiado + '">' +
        (r.apoiado ? "Você apoia" : "Eu também") +
        '<span class="visualmente-oculto"> tenho o problema: ' + Z.escapar(cat.curto + " na " + r.rua) + "</span></button>";

    return '<li class="relato" id="relato-' + r.protocolo + '">' +
      '<div class="relato__topo">' + Z.icone(cat.icone) +
        "<h3>" + Z.escapar(cat.nome) + "</h3>" + Z.seloStatus(r.status) + "</div>" +
      '<p class="relato__local">' + Z.escapar(r.rua) + ", " + Z.escapar(r.bairro) + "</p>" +
      '<p class="relato__descricao">' + Z.escapar(r.descricao) + "</p>" +
      '<p class="relato__meta">Relatado ' + Z.haQuanto(r.criadoEm) + ". " +
        '<span class="' + (Z.atrasado(r) ? "texto-atraso" : "") + '">' + Z.textoPrazo(r) + ".</span></p>" +
      '<div class="relato__rodape">' +
        '<p class="relato__apoios">' + Z.icone("pessoas") + "<span>" + Z.plural(r.apoios, "apoio", "apoios") + "</span></p>" +
        apoiar +
        '<a class="relato__link" href="acompanhar.html?protocolo=' + r.protocolo + '">Ver andamento<span class="visualmente-oculto"> de ' + Z.escapar(cat.curto + " na " + r.rua) + "</span></a>" +
      "</div></li>";
  }

  function render(_anunciar, focarIndice) {
    var f = lerFiltros();
    var itens = filtrar(f);
    montarResumo(f);

    if (!itens.length) {
      lista.innerHTML = '<li class="vazio"><p>Nenhum relato com esses filtros.</p>' +
        '<div class="acoes"><button type="button" class="botao botao--secundario" data-limpar>Limpar filtros</button>' +
        '<a class="botao botao--principal" href="relatar.html">Relatar um problema</a></div></li>';
    } else {
      lista.innerHTML = itens.slice(0, limite).map(cartao).join("");
    }

    var restantes = itens.length - limite;
    botaoMais.hidden = restantes <= 0;
    if (restantes > 0) botaoMais.textContent = "Mostrar mais " + Math.min(restantes, POR_PAGINA) + " relatos";

    var texto = itens.length === 0 ? "Nenhum relato encontrado."
      : "Mostrando " + Math.min(limite, itens.length) + " de " + Z.plural(itens.length, "relato", "relatos") + ".";
    contagem.textContent = texto;

    if (typeof focarIndice === "number") {
      var alvo = lista.children[focarIndice];
      if (alvo) {
        var titulo = alvo.querySelector("h3");
        titulo.setAttribute("tabindex", "-1");
        titulo.focus();
      }
    }
    guardarNaUrl(f);
  }

  function guardarNaUrl(f) {
    var url = new URL(window.location.href);
    ["bairro", "categoria", "situacao", "ordem", "rua"].forEach(function (k) {
      if (f[k] && !(k === "ordem" && f[k] === "recentes")) url.searchParams.set(k, f[k]);
      else url.searchParams.delete(k);
    });
    window.history.replaceState(null, "", url);
    if (f.bairro) {
      var prefs = Z.ler(Z.CHAVES.prefs, {});
      prefs.bairro = f.bairro;
      Z.gravar(Z.CHAVES.prefs, prefs);
    }
  }

  function lerUrl() {
    var p = new URLSearchParams(window.location.search);
    var prefs = Z.ler(Z.CHAVES.prefs, {});
    form.elements.bairro.value = p.get("bairro") || prefs.bairro || "";
    if (form.elements.bairro.selectedIndex === -1) form.elements.bairro.value = "";
    form.elements.categoria.value = p.get("categoria") || "";
    form.elements.situacao.value = p.get("situacao") || "";
    form.elements.ordem.value = p.get("ordem") || "recentes";
    form.elements.rua.value = p.get("rua") || "";
  }

  function limpar() {
    form.reset();
    form.elements.bairro.value = "";
    var prefs = Z.ler(Z.CHAVES.prefs, {});
    delete prefs.bairro;
    Z.gravar(Z.CHAVES.prefs, prefs);
    limite = POR_PAGINA;
    render(true);
    form.elements.bairro.focus();
  }

  /* ---------- Eventos ---------- */
  form.addEventListener("change", function () { limite = POR_PAGINA; render(true); });
  var timerBusca;
  form.elements.rua.addEventListener("input", function () {
    window.clearTimeout(timerBusca);
    timerBusca = window.setTimeout(function () { limite = POR_PAGINA; render(true); }, 300);
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); render(true); });
  document.getElementById("limpar-filtros").addEventListener("click", limpar);

  botaoMais.addEventListener("click", function () {
    var primeiroNovo = limite;
    limite += POR_PAGINA;
    render(true, primeiroNovo);
  });

  lista.addEventListener("click", function (e) {
    if (e.target.closest("[data-limpar]")) { limpar(); return; }
    var botao = e.target.closest("[data-apoiar]");
    if (!botao) return;
    var protocolo = botao.dataset.apoiar;
    var apoiado = Z.alternarApoio(protocolo);
    render(false);
    var novo = lista.querySelector('[data-apoiar="' + protocolo + '"]');
    if (novo) novo.focus();
    Z.avisar(apoiado
      ? "Apoio registrado. Você pode acompanhar este relato na página Acompanhar."
      : "Apoio retirado.");
  });

  montarOpcoes();
  lerUrl();
  render(false);
})();
