/*
  Página inicial
  Mostra as últimas atualizações reais dos relatos (em placas de rua)
  e um resumo rápido do bairro escolhido, que fica lembrado.
*/
(function () {
  "use strict";
  var Z = window.Zela;
  var todos = Z.todosRelatos();

  /* ---------- Últimas atualizações ---------- */
  function ultimaData(r) { return r.historico[r.historico.length - 1].data; }

  var ruasVistas = {};
  var recentes = todos.slice()
    .sort(function (a, b) { return ultimaData(a) < ultimaData(b) ? 1 : -1; })
    .filter(function (r) {
      if (ruasVistas[r.rua]) return false;
      ruasVistas[r.rua] = true;
      return true;
    })
    .slice(0, 3);
  document.getElementById("ruas-recentes").innerHTML = recentes.map(function (r) {
    var cat = Z.categoria(r.categoria);
    return '<li class="ruas__item">' +
      '<a class="ruas__link" href="acompanhar.html?protocolo=' + r.protocolo + '">' +
        '<span class="placa placa--rua"><span class="placa__nome">' + Z.escapar(r.rua) + "</span>" +
        '<span class="placa__rodape">' + Z.escapar(r.bairro) + "</span></span>" +
        '<span class="ruas__texto">' + Z.escapar(cat.curto) + ": " + Z.escapar(Z.statusInfo[r.status].nome.toLowerCase()) +
        ", " + Z.haQuanto(ultimaData(r)) + "</span>" +
      "</a></li>";
  }).join("");

  /* ---------- Resumo do bairro ---------- */
  var select = document.getElementById("escolha-bairro");
  var saida = document.getElementById("resumo-bairro");
  var bairros = {};
  todos.forEach(function (r) { bairros[r.bairro] = true; });
  Object.keys(bairros).sort(function (a, b) { return a.localeCompare(b, "pt-BR"); }).forEach(function (b) {
    select.insertAdjacentHTML("beforeend", '<option value="' + Z.escapar(b) + '">' + Z.escapar(b) + "</option>");
  });

  function resumir(bairro) {
    if (!bairro) { saida.innerHTML = ""; return; }
    var doBairro = todos.filter(function (r) { return r.bairro === bairro; });
    var abertos = doBairro.filter(function (r) { return r.status !== "resolvido"; });
    var resolvidos = doBairro.length - abertos.length;
    var maisApoiado = abertos.slice().sort(function (a, b) { return b.apoios - a.apoios; })[0];

    var html = "<p><strong>" + Z.escapar(bairro) + "</strong> tem " + Z.plural(abertos.length, "problema esperando conserto", "problemas esperando conserto") +
      " e " + Z.plural(resolvidos, "já resolvido", "já resolvidos") + ".</p>";
    if (maisApoiado) {
      var cat = Z.categoria(maisApoiado.categoria);
      html += "<p>O mais apoiado: " + Z.escapar(cat.nome.toLowerCase()) + " na " + Z.escapar(maisApoiado.rua) +
        ", com " + Z.plural(maisApoiado.apoios, "apoio", "apoios") + ".</p>";
    }
    html += '<p><a class="link-forte" href="bairro.html?bairro=' + encodeURIComponent(bairro) + '">Ver todos os relatos de ' + Z.escapar(bairro) + "</a></p>";
    saida.innerHTML = html;
  }

  select.addEventListener("change", function () {
    var prefs = Z.ler(Z.CHAVES.prefs, {});
    if (select.value) prefs.bairro = select.value; else delete prefs.bairro;
    Z.gravar(Z.CHAVES.prefs, prefs);
    resumir(select.value);
  });

  var salvo = Z.ler(Z.CHAVES.prefs, {}).bairro;
  if (salvo && bairros[salvo]) { select.value = salvo; resumir(salvo); }
})();
