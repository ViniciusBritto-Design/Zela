/*
  Página inicial
  Últimas atualizações (em placas de rua), atalhos por tipo de problema
  e resumo do bairro escolhido, que fica lembrado.
*/
(function () {
  "use strict";
  var Z = window.Zela;
  var todos = Z.todosRelatos();

  function ultimaData(r) { return r.historico[r.historico.length - 1].data; }

  /* ---------- Últimas atualizações (uma por rua) ---------- */
  var ruasVistas = {};
  var recentes = todos.slice()
    .sort(function (a, b) { return ultimaData(a) < ultimaData(b) ? 1 : -1; })
    .filter(function (r) {
      if (ruasVistas[r.rua]) return false;
      ruasVistas[r.rua] = true;
      return true;
    })
    .slice(0, 4);

  document.getElementById("ruas-recentes").innerHTML = recentes.map(function (r) {
    var cat = Z.categoria(r.categoria);
    return "<li>" +
      '<a class="atualizacao" href="acompanhar.html?protocolo=' + r.protocolo + '">' +
        '<span class="placa"><span class="placa__nome">' + Z.escapar(r.rua) + "</span>" +
        '<span class="placa__rodape">' + Z.escapar(r.bairro) + "</span></span>" +
        Z.icone("chevron", "icone-seta") +
        '<span class="atualizacao__info"><strong>' + Z.escapar(cat.curto) + "</strong>" +
          Z.seloStatus(r.status) + "<span>" + Z.haQuanto(ultimaData(r)) + "</span></span>" +
      "</a></li>";
  }).join("");

  /* ---------- Atalhos por tipo de problema ---------- */
  document.getElementById("atalhos-categorias").innerHTML = Z.categorias.map(function (c) {
    return '<li><a class="categoria" href="relatar.html?categoria=' + c.id + '">' +
      '<span class="ladrilho">' + Z.icone(c.icone) + "</span>" +
      "<strong>" + Z.escapar(c.nome) + "</strong>" +
      '<span class="categoria__prazo">' + Z.icone("relogio") + "Prazo de " + c.prazoDias + " dias</span>" +
      "</a></li>";
  }).join("") +
    '<li><a class="categoria categoria--outro" href="ajuda.html#quem-resolve">' +
      '<span class="ladrilho">' + Z.icone("ajuda") + "</span>" +
      "<strong>Outro problema? Veja quem resolve</strong>" +
      '<span class="categoria__prazo">Falta de luz em casa, vazamento, barulho</span>' +
    "</a></li>";

  /* ---------- Resumo do bairro ---------- */
  var select = document.getElementById("escolha-bairro");
  var saida = document.getElementById("resumo-bairro");
  var bairros = {};
  todos.forEach(function (r) { bairros[r.bairro] = true; });
  Object.keys(bairros).sort(function (a, b) { return a.localeCompare(b, "pt-BR"); }).forEach(function (b) {
    select.insertAdjacentHTML("beforeend", '<option value="' + Z.escapar(b) + '">' + Z.escapar(b) + "</option>");
  });

  function resumir(bairro) {
    var doBairro = todos.filter(function (r) { return !bairro || r.bairro === bairro; });
    var abertos = doBairro.filter(function (r) { return r.status !== "resolvido"; });
    var atrasados = doBairro.filter(Z.atrasado);
    var resolvidos = doBairro.length - abertos.length;
    var maisApoiado = abertos.slice().sort(function (a, b) { return b.apoios - a.apoios; })[0];

    var html = '<dl class="numeros numeros--3">' +
      '<div class="numeros__item"><dt>Esperando conserto</dt><dd>' + abertos.length + "</dd></div>" +
      '<div class="numeros__item numeros__item--alerta"><dt>Atrasados</dt><dd>' + atrasados.length + "</dd></div>" +
      '<div class="numeros__item numeros__item--ok"><dt>Resolvidos</dt><dd>' + resolvidos + "</dd></div>" +
      "</dl>";
    if (maisApoiado) {
      var cat = Z.categoria(maisApoiado.categoria);
      html += '<p class="resumo-bairro__linha">Mais apoiado: <strong>' + Z.escapar(cat.nome.toLowerCase()) + "</strong> na " +
        Z.escapar(maisApoiado.rua) + ", com " + Z.plural(maisApoiado.apoios, "apoio", "apoios") + ".</p>";
    }
    html += '<p class="resumo-bairro__linha"><a class="relato__link" href="bairro.html' + (bairro ? "?bairro=" + encodeURIComponent(bairro) : "") + '">' +
      (bairro ? "Ver relatos de " + Z.escapar(bairro) : "Ver todos os relatos") + Z.icone("chevron") + "</a></p>";
    saida.innerHTML = html;
  }

  select.addEventListener("change", function () {
    var prefs = Z.ler(Z.CHAVES.prefs, {});
    if (select.value) prefs.bairro = select.value; else delete prefs.bairro;
    Z.gravar(Z.CHAVES.prefs, prefs);
    resumir(select.value);
  });

  var salvo = Z.ler(Z.CHAVES.prefs, {}).bairro;
  if (salvo && bairros[salvo]) select.value = salvo;
  resumir(select.value);
})();
