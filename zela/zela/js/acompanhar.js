/*
  Página "Acompanhar um relato"
  Busca por protocolo, linha do tempo do conserto, prazo previsto,
  confirmação do morador (resolvido ou reaberto) e lista de relatos acompanhados.
*/
(function () {
  "use strict";
  var Z = window.Zela;

  var form = document.getElementById("form-busca");
  var campo = document.getElementById("protocolo");
  var erro = document.getElementById("erro-protocolo");
  var resultado = document.getElementById("resultado");

  function mostrarErro(msg) {
    erro.textContent = msg;
    erro.hidden = false;
    campo.setAttribute("aria-invalid", "true");
    campo.focus();
  }
  function limparErro() {
    erro.hidden = true;
    campo.removeAttribute("aria-invalid");
  }

  campo.addEventListener("input", limparErro);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    buscar(campo.value, true);
  });

  form.addEventListener("click", function (e) {
    var exemplo = e.target.closest("[data-exemplo]");
    if (!exemplo) return;
    campo.value = exemplo.dataset.exemplo;
    buscar(campo.value, true);
  });

  function buscar(texto, focar) {
    limparErro();
    if (!texto.trim()) {
      resultado.hidden = true;
      mostrarErro("Digite o número do protocolo.");
      return;
    }
    var protocolo = Z.normalizarProtocolo(texto);
    var relato = Z.buscarRelato(protocolo);
    if (!relato) {
      resultado.hidden = true;
      mostrarErro("Não encontramos o protocolo " + protocolo + ". Confira os números: ele começa com ZL-2026.");
      return;
    }
    campo.value = relato.protocolo;
    var url = new URL(window.location.href);
    url.searchParams.set("protocolo", relato.protocolo);
    window.history.replaceState(null, "", url);
    mostrarRelato(relato, focar);
  }

  /* ---------- Detalhe do relato ---------- */
  function mostrarRelato(relato, focar) {
    var cat = Z.categoria(relato.categoria);
    var status = relato.status;
    var info = Z.statusInfo[status];
    var prazo = Z.prazo(relato);
    var atrasado = Z.atrasado(relato);

    /* Linha do tempo: o que já aconteceu */
    var feitos = relato.historico.map(function (h, i) {
      var ultimo = i === relato.historico.length - 1;
      return '<li class="tempo__item tempo__item--feito' + (ultimo ? " tempo__item--atual" : "") + '"' + (ultimo ? ' aria-current="step"' : "") + ">" +
        '<span class="tempo__marca" aria-hidden="true"></span>' +
        '<div><h4>' + Z.escapar(Z.statusInfo[h.status].nome) + (ultimo ? ' <span class="visualmente-oculto">(etapa atual)</span>' : "") + "</h4>" +
        '<p class="tempo__data"><time datetime="' + h.data + '">' + Z.formatarData(h.data, true) + "</time></p>" +
        (h.nota ? "<p>" + Z.escapar(h.nota) + "</p>" : "") + "</div></li>";
    }).join("");

    /* O que ainda falta acontecer */
    var proximos = "";
    if (status !== "resolvido") {
      var pos = Z.fluxo.indexOf(status === "reaberto" ? "recebido" : status);
      proximos = Z.fluxo.slice(pos + 1).map(function (s) {
        return '<li class="tempo__item tempo__item--futuro">' +
          '<span class="tempo__marca" aria-hidden="true"></span>' +
          "<div><h4>" + Z.escapar(Z.statusInfo[s].nome) + ' <span class="visualmente-oculto">(ainda não aconteceu)</span></h4>' +
          "<p>" + Z.escapar(Z.statusInfo[s].descricao) + "</p></div></li>";
      }).join("");
    }

    var foto = relato.foto
      ? '<figure class="detalhe__foto"><img src="' + relato.foto + '" alt="' + Z.escapar(relato.fotoDescricao || "Foto enviada pelo morador") + '">' +
        "<figcaption>Foto enviada no relato</figcaption></figure>"
      : "";

    var apoio = relato.meu
      ? '<p class="detalhe__apoios">' + Z.icone("pessoas") + " Você fez este relato. " + (relato.apoios ? Z.plural(relato.apoios, "pessoa apoia", "pessoas apoiam") + "." : "Ainda ninguém apoiou. Compartilhe o link com os vizinhos.") + "</p>"
      : '<div class="detalhe__apoios">' + Z.icone("pessoas") +
        '<p id="texto-apoios">' + Z.plural(relato.apoios, "pessoa tem", "pessoas têm") + " esse mesmo problema.</p>" +
        '<button type="button" class="botao botao--secundario botao--apoio" id="botao-apoio" aria-pressed="' + relato.apoiado + '" aria-describedby="texto-apoios">' +
        (relato.apoiado ? "Você apoia este relato" : "Eu também tenho esse problema") + "</button></div>";

    var ultimo = relato.historico[relato.historico.length - 1];
    var jaConfirmado = /^Morador confirmou/.test(ultimo.nota || "");
    var confirmacao = status === "resolvido" && !jaConfirmado
      ? '<section class="confirmar" aria-labelledby="titulo-confirmar">' +
          '<h3 id="titulo-confirmar">O problema foi mesmo resolvido?</h3>' +
          "<p>Sua resposta ajuda a prefeitura a saber se o serviço ficou bom. Se não ficou, o relato volta para análise.</p>" +
          '<div class="acoes">' +
            '<button type="button" class="botao botao--principal" data-confirmar="sim">Sim, foi resolvido</button>' +
            '<button type="button" class="botao botao--secundario" data-confirmar="nao">Não, continua igual</button>' +
          "</div></section>"
      : "";

    resultado.innerHTML =
      '<article class="detalhe" aria-labelledby="titulo-resultado">' +
        '<div class="placa placa--rua">' +
          '<span class="placa__nome">' + Z.escapar(relato.rua) + "</span>" +
          '<span class="placa__rodape">' + Z.escapar(relato.bairro) + (relato.cep ? "  ·  CEP " + Z.escapar(relato.cep) : "") + "</span>" +
        "</div>" +
        '<div class="detalhe__cabeca">' +
          '<h2 id="titulo-resultado" tabindex="-1">' + Z.escapar(cat.nome) + "</h2>" +
          Z.seloStatus(status) +
        "</div>" +
        '<p class="detalhe__meta">Protocolo <strong>' + relato.protocolo + "</strong>. Relatado em " + Z.formatarData(relato.criadoEm) + ". Responsável: " + Z.escapar(cat.orgao) + ".</p>" +
        '<p class="prazo' + (atrasado ? " prazo--atrasado" : "") + (status === "resolvido" ? " prazo--ok" : "") + '">' +
          Z.icone(atrasado ? "alerta" : status === "resolvido" ? "check" : "relogio") +
          "<span><strong>" + Z.textoPrazo(relato) + ".</strong> " +
          (status === "resolvido" ? "" : "O prazo para " + cat.curto.toLowerCase() + " é de " + prazo.dias + " dias, até " + Z.formatarData(prazo.limite.toISOString()) + ".") +
          (atrasado ? " Apoios de outros moradores ajudam a priorizar o serviço." : "") +
          "</span></p>" +
        '<p class="detalhe__agora"><strong>Agora:</strong> ' + Z.escapar(info.descricao) + "</p>" +
        confirmacao +
        '<h3 class="detalhe__subtitulo">Andamento</h3>' +
        '<ol class="tempo">' + feitos + proximos + "</ol>" +
        '<h3 class="detalhe__subtitulo">O que foi relatado</h3>' +
        '<p class="detalhe__local">' + Z.icone("local") + "<span>" + Z.escapar(relato.referencia) + "</span></p>" +
        "<blockquote class=\"detalhe__descricao\"><p>" + Z.escapar(relato.descricao) + "</p></blockquote>" +
        foto +
        apoio +
        '<div class="acoes">' +
          '<button type="button" class="botao botao--texto" id="copiar-link">' + Z.icone("copiar") + " Copiar link deste relato</button>" +
        "</div>" +
        '<details class="demo">' +
          "<summary>Modo demonstração</summary>" +
          "<p>Neste protótipo ninguém da prefeitura atualiza os relatos. Use o botão para simular a próxima etapa e ver como o morador é informado.</p>" +
          '<button type="button" class="botao botao--secundario" id="simular-etapa"' + (status === "resolvido" ? " disabled" : "") + ">Simular próxima etapa</button>" +
        "</details>" +
      "</article>";

    resultado.hidden = false;
    ligarAcoes(relato);
    if (focar) document.getElementById("titulo-resultado").focus();
  }

  function agoraISO() {
    var d = new Date();
    function p(n) { return String(n).padStart(2, "0"); }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function recarregar(protocolo, mensagem, focoId) {
    mostrarRelato(Z.buscarRelato(protocolo), false);
    montarLista();
    if (mensagem) Z.avisar(mensagem);
    var alvo = document.getElementById(focoId || "titulo-resultado");
    if (alvo) alvo.focus();
  }

  function ligarAcoes(relato) {
    var botaoApoio = document.getElementById("botao-apoio");
    if (botaoApoio) {
      botaoApoio.addEventListener("click", function () {
        var apoiado = Z.alternarApoio(relato.protocolo);
        recarregar(relato.protocolo, apoiado
          ? "Apoio registrado. Você passou a acompanhar este relato."
          : "Apoio retirado.", "botao-apoio");
      });
    }

    resultado.querySelectorAll("[data-confirmar]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.confirmar === "sim") {
          Z.adicionarAndamento(relato.protocolo, { status: "resolvido", data: agoraISO(), nota: "Morador confirmou que o problema foi resolvido." });
          var secao = b.closest(".confirmar");
          secao.innerHTML = '<h3 id="titulo-confirmar" tabindex="-1">Obrigado pela confirmação</h3><p>O relato foi encerrado como resolvido.</p>';
          secao.querySelector("h3").focus();
          Z.avisar("Confirmação registrada. Obrigado!");
        } else {
          Z.adicionarAndamento(relato.protocolo, { status: "reaberto", data: agoraISO(), nota: "Morador avisou que o problema continua." });
          recarregar(relato.protocolo, "Relato reaberto. Ele voltou para análise da prefeitura.");
        }
      });
    });

    document.getElementById("copiar-link").addEventListener("click", function () {
      var link = window.location.href.split("?")[0] + "?protocolo=" + relato.protocolo;
      Z.copiarTexto(link)
        .then(function () { Z.avisar("Link copiado. Você pode enviar para um vizinho."); })
        .catch(function () { Z.avisar("Não foi possível copiar o link."); });
    });

    var simular = document.getElementById("simular-etapa");
    simular.addEventListener("click", function () {
      var atual = relato.status === "reaberto" ? "recebido" : relato.status;
      var proximo = Z.fluxo[Z.fluxo.indexOf(atual) + 1];
      if (!proximo) return;
      var notas = {
        "em-analise": "Encaminhado para " + Z.categoria(relato.categoria).orgao + ".",
        "programado": "Serviço marcado pela equipe.",
        "em-execucao": "Equipe no local.",
        "resolvido": "Serviço concluído pela equipe."
      };
      Z.adicionarAndamento(relato.protocolo, { status: proximo, data: agoraISO(), nota: notas[proximo] + " (simulação)" });
      recarregar(relato.protocolo, "Nova etapa: " + Z.statusInfo[proximo].nome + ".");
      var det = resultado.querySelector(".demo");
      if (det) det.open = true;
    });
  }

  /* ---------- Lista de relatos acompanhados ---------- */
  function montarLista() {
    var lista = document.getElementById("lista-meus");
    var apoios = Z.meusApoios();
    var acompanhados = Z.todosRelatos().filter(function (r) {
      return r.meu || apoios.indexOf(r.protocolo) !== -1;
    });

    if (!acompanhados.length) {
      lista.innerHTML = '<div class="vazio"><p>Você ainda não acompanha nenhum relato neste aparelho.</p>' +
        '<div class="acoes"><a class="botao botao--principal" href="relatar.html">Relatar um problema</a>' +
        '<a class="botao botao--texto" href="bairro.html">Ver relatos do meu bairro</a></div></div>';
      return;
    }

    acompanhados.sort(function (a, b) { return a.criadoEm < b.criadoEm ? 1 : -1; });
    lista.innerHTML = '<ul class="lista-relatos lista-relatos--compacta">' + acompanhados.map(function (r) {
      var cat = Z.categoria(r.categoria);
      return '<li class="relato relato--linha">' +
        '<div class="relato__topo">' + Z.icone(cat.icone) +
          '<h3><a href="acompanhar.html?protocolo=' + r.protocolo + '" data-protocolo="' + r.protocolo + '">' + Z.escapar(cat.nome) + "</a></h3>" +
          Z.seloStatus(r.status) + "</div>" +
        '<p class="relato__local">' + Z.escapar(r.rua) + ", " + Z.escapar(r.bairro) + "</p>" +
        '<p class="relato__meta">' + r.protocolo + ". " + (r.meu ? "Você relatou" : "Você apoiou") + ". " + Z.textoPrazo(r) + ".</p>" +
        "</li>";
    }).join("") + "</ul>";
  }

  document.getElementById("lista-meus").addEventListener("click", function (e) {
    var link = e.target.closest("[data-protocolo]");
    if (!link) return;
    e.preventDefault();
    campo.value = link.dataset.protocolo;
    buscar(link.dataset.protocolo, true);
    window.scrollTo(0, 0);
  });

  /* ---------- Início ---------- */
  montarLista();
  var inicial = new URLSearchParams(window.location.search).get("protocolo");
  if (inicial) {
    campo.value = inicial;
    buscar(inicial, false);
  }
})();
