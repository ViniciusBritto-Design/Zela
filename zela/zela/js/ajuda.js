/*
  Página "Ajuda"
  Guia "Quem resolve meu problema?", tabela de prazos gerada dos dados
  e opção de apagar os dados guardados no aparelho.
*/
(function () {
  "use strict";
  var Z = window.Zela;

  var SITUACOES = [
    {
      id: "poste", texto: "Poste da rua apagado ou piscando",
      quem: "Prefeitura, pelo Zela",
      como: "É um serviço de iluminação pública. Relate aqui e acompanhe pelo protocolo.",
      acao: { texto: "Relatar poste apagado", href: "relatar.html?categoria=iluminacao" }
    },
    {
      id: "luz-casa", texto: "Falta de luz em casa ou na rua inteira",
      quem: "Distribuidora de energia elétrica",
      como: "Quando falta energia nas casas, o problema é na rede elétrica, não no poste da prefeitura. O telefone de atendimento está impresso na sua conta de luz."
    },
    {
      id: "agua", texto: "Vazamento de água ou esgoto na rua",
      quem: "Companhia de água e esgoto",
      como: "Vazamentos e esgoto a céu aberto são atendidos pela companhia de saneamento. O telefone está na sua conta de água."
    },
    {
      id: "buraco", texto: "Buraco no asfalto ou calçada quebrada",
      quem: "Prefeitura, pelo Zela",
      como: "A subprefeitura da região faz o conserto. Relate aqui. Se a calçada for de um imóvel particular, a prefeitura notifica o dono.",
      acao: { texto: "Relatar buraco", href: "relatar.html?categoria=buraco" }
    },
    {
      id: "risco", texto: "Fio caído, árvore caindo ou alagamento forte",
      quem: "Emergência por telefone",
      como: "Não espere pelo relato. Ligue 193 (Bombeiros) para fio caído ou 199 (Defesa Civil) para árvore, deslizamento ou alagamento. Depois, relate no Zela para o conserto definitivo.",
      emergencia: true
    },
    {
      id: "lixo", texto: "Lixo ou entulho jogado na calçada",
      quem: "Prefeitura, pelo Zela",
      como: "A limpeza urbana recolhe o material. Se souber quem jogou, a fiscalização pode multar.",
      acao: { texto: "Relatar lixo acumulado", href: "relatar.html?categoria=lixo" }
    },
    {
      id: "carro", texto: "Carro abandonado na rua",
      quem: "Central de atendimento da prefeitura (156)",
      como: "Veículos abandonados passam por fiscalização de trânsito e precisam de um processo próprio. Ligue 156 ou use o canal oficial da sua cidade."
    },
    {
      id: "barulho", texto: "Barulho alto de vizinho ou bar",
      quem: "Fiscalização da prefeitura (156) ou Polícia Militar (190)",
      como: "Barulho de estabelecimentos é fiscalizado pela prefeitura pelo 156. Se houver briga ou ameaça, ligue 190."
    }
  ];

  var opcoes = document.getElementById("opcoes-guia");
  var resposta = document.getElementById("resposta-guia");

  opcoes.innerHTML = SITUACOES.map(function (s) {
    return '<label class="opcao"><input type="radio" name="situacao" value="' + s.id + '"> ' + Z.escapar(s.texto) + "</label>";
  }).join("");

  opcoes.addEventListener("change", function (e) {
    var s = SITUACOES.filter(function (x) { return x.id === e.target.value; })[0];
    if (!s) return;
    resposta.className = "resposta-guia resposta-guia--visivel" + (s.emergencia ? " resposta-guia--emergencia" : "");
    resposta.innerHTML =
      "<h3>Quem resolve: " + Z.escapar(s.quem) + "</h3>" +
      "<p>" + Z.escapar(s.como) + "</p>" +
      (s.emergencia ? '<ul class="lista-telefones"><li><a href="tel:193"><strong>193</strong> Bombeiros</a></li><li><a href="tel:199"><strong>199</strong> Defesa Civil</a></li></ul>' : "") +
      (s.acao ? '<p><a class="botao botao--principal" href="' + s.acao.href + '">' + Z.escapar(s.acao.texto) + "</a></p>" : "");
  });

  /* Tabela de prazos a partir dos mesmos dados usados no formulário */
  document.getElementById("tabela-prazos").innerHTML = Z.categorias.map(function (c) {
    return "<tr><th scope=\"row\">" + Z.escapar(c.nome) + "</th><td>" + c.prazoDias + " dias</td><td>" + Z.escapar(c.orgao) + "</td></tr>";
  }).join("");

  document.getElementById("apagar-dados").addEventListener("click", function () {
    [Z.CHAVES.relatos, Z.CHAVES.apoios, Z.CHAVES.alteracoes, Z.CHAVES.rascunho].forEach(Z.apagar);
    var contador = document.getElementById("contador-meus");
    if (contador) contador.hidden = true;
    Z.avisar("Pronto. Seus relatos, apoios e rascunhos foram apagados deste aparelho.");
  });
})();
