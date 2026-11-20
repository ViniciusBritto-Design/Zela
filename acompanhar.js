/*
  Página "Acompanhar um relato"
  Busca por protocolo, etapas do conserto, prazo previsto,
  confirmação do morador (resolvido ou reaberto) e lista de relatos acompanhados.
*/
(function () {
  "use strict";
  var Z = window.Zela;

  var form = document.getElementById("form-busca");
  var campo = document.getElementById("protocolo");
  var erro = document.getElementById("erro-protocolo");
  var resultado = document.getElementById("resultado");
  var protocoloAberto = null;

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

  function agoraISO() {
    var d = new Date();
    function p(n) { return String(n).padStart(2, "0"); }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  /* ---------- Detalhe do relato ---------- */
  function mostrarRelato(relato, focar) {
    protocoloAberto = relato.protocolo;
    var cat = Z.categoria(relato.categoria);
    var status = relato.status;
    var prazo = Z.prazo(relato);
    var atrasado = Z.atrasado(relato);
    var etapaFluxo = status === "reaberto" ? "recebido" : status;
    var posAtual = Z.fluxo.indexOf(etapaFluxo);

    /* Barra de etapas: mostra de relance onde o conserto está */
    var progresso = '<ol class="progresso" aria-label="Etapas do conserto">' + Z.fluxo.map(function (s, i) {
      var classe = i < posAtual || status === "resolvido" ? ' class="progresso--feito"' : "";
      var atual = i === posAtual ? ' aria-current="step"' : "";
      return "<li" + classe + atual + ">" + Z.escapar(Z.statusInfo[s].nome) + "</li>";
    }).join("") + "</ol>";

    /* Linha do tempo: o que já aconteceu e o que ainda falta */
    var feitos = relato.historico.map(function (h, i) {
      var ultimo = i === relato.historico.length - 1;
      return '<li class="tempo__item tempo__item--feito' + (ultimo ? " tempo__item--atual" : "") + '">' +
        '<span class="tempo__marca" aria-hidden="true"></span>' +
        "<div><h4>" + Z.escapar(Z.statusInfo[h.status].nome) + (ultimo ? ' <span class="visualmente-oculto">(etapa atual)</span>' : "") + "</h4>" +
        '<p class="tempo__data"><time datetime="' + h.data + '">' + Z.formatarData(h.data, true) + "</time></p>" +
        (h.nota ? "<p>" + Z.escapar(h.nota) + "</p>" : "") + "</div></li>";
    }).join("");

    var proximos = status === "resolvido" ? "" : Z.fluxo.slice(posAtual + 1).map(function (s) {
      return '<li class="tempo__item tempo__item--futuro">' +
        '<span class="tempo__marca" aria-hidden="true"></span>' +
        "<div><h4>" + Z.escapar(Z.statusInfo[s].nome) + ' <span class="visualmente-oculto">(ainda não aconteceu)</span></h4>' +
        "<p>" + Z.escapar(Z.statusInfo[s].descricao) + "</p></div></li>";
    }).join("");

    var foto = relato.foto
      ? '<figure class="detalhe__foto"><img src="' + relato.foto + '" alt="' + Z.escapar(relato.fotoDescricao || "Foto enviada pelo morador") + '">' +
        "<figcaption>Foto enviada no relato</figcaption></figure>"
      : "";

    var ultimo = relato.historico[relato.historico.length - 1];
    var jaConfirmado = /^Morador confirmou/.test(ultimo.nota || "");
    var confirmacao = status === "resolvido" && !jaConfirmado
      ? '<section class="confirmar" aria-labelledby="titulo-confirmar">' +
          '<h3 id="titulo-confirmar">O problema foi mesmo resolvido?</h3>' +
          "<p>Sua resposta mostra à prefeitura se o serviço ficou bom. Se não ficou, o relato volta para análise.</p>" +
          '<div class="acoes">' +
            '<button type="button" class="botao botao--principal" data-confirmar="sim">' + Z.icone("check") + "Sim, foi resolvido</button>" +
            '<button type="button" class="botao botao--secundario" data-confirmar="nao">Não, continua igual</button>' +
          "</div></section>"
      : "";

    var apoio = relato.meu
      ? '<p class="detalhe__apoios">' + Z.icone("pessoas") + "Você fez este relato. " +
        (relato.apoios ? Z.plural(relato.apoios, "pessoa apoia", "pessoas apoiam") + "." : "Compartilhe o link com os vizinhos.") + "</p>"
      : '<p class="detalhe__apoios" id="texto-apoios">' + Z.icone("pessoas") + Z.plural(relato.apoios, "pessoa tem", "pessoas têm") + " esse problema</p>";

    var botaoApoio = relato.meu ? "" :
      '<button type="button" class="botao botao--secundario botao--pequeno botao--apoio" id="botao-apoio" aria-pressed="' + relato.apoiado + '" aria-describedby="texto-apoios">' +
      (relato.apoiado ? Z.icone("check") + "Você apoia" : Z.icone("mais") + "Eu também tenho") + "</button>";

    var textoPrazo = "<span><strong>" + Z.textoPrazo(relato) + ".</strong> " +
      (status === "resolvido" ? "" : "O prazo para " + cat.curto.toLowerCase() + " é de " + prazo.dias + " dias, até " + Z.formatarData(prazo.limite.toISOString()) + ".") +
      (atrasado ? " Apoios de vizinhos ajudam a priorizar o serviço." : "") + "</span>";

    resultado.innerHTML =
      '<article class="painel detalhe" aria-labelledby="titulo-resultado">' +
        '<div class="detalhe__cabeca">' +
          '<div class="detalhe__titulo">' +
            '<span class="placa"><span class="placa__nome">' + Z.escapar(relato.rua) + "</span>" +
            '<span class="placa__rodape">' + Z.escapar(relato.bairro) + (relato.cep ? ", CEP " + Z.escapar(relato.cep) : "") + "</span></span>" +
            '<h2 id="titulo-resultado" tabindex="-1">' + Z.escapar(cat.nome) + "</h2>" +
            '<p class="detalhe__meta">Protocolo <strong>' + relato.protocolo + "</strong>, relatado em " + Z.formatarData(relato.criadoEm) + ". Responsável: " + Z.escapar(cat.orgao) + ".</p>" +
          "</div>" +
          Z.seloStatus(status) +
        "</div>" +
        progresso +
        '<p class="prazo' + (atrasado ? " prazo--atrasado" : "") + (status === "resolvido" ? " prazo--ok" : "") + '">' +
          Z.icone(atrasado ? "alerta" : status === "resolvido" ? "sucesso" : "relogio") + textoPrazo + "</p>" +
        confirmacao +
        '<h3 class="detalhe__subtitulo">Andamento</h3>' +
        '<ol class="tempo">' + feitos + proximos + "</ol>" +
        '<h3 class="detalhe__subtitulo">O que foi relatado</h3>' +
        '<p class="detalhe__local">' + Z.icone("local") + "<span>" + Z.escapar(relato.referencia) + "</span></p>" +
        '<blockquote class="detalhe__descricao"><p>' + Z.escapar(relato.descricao) + "</p></blockquote>" +
        foto +
        '<div class="detalhe__rodape">' +
          apoio +
          '<div class="acoes">' + botaoApoio +
            '<button type="button" class="botao botao--texto botao--pequeno" id="copiar-link">' + Z.icone("link") + "Copiar link</button>" +
          "</div>" +
        "</div>" +
      "</article>";

    resultado.hidden = false;
    ligarAcoes(relato);
    marcarAtualNaLista();
    if (focar) document.getElementById("titulo-resultado").focus();
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
          ? "Apoio registrado. O relato está na sua lista."
          : "Apoio retirado.", "botao-apoio");
      });
    }

    resultado.querySelectorAll("[data-confirmar]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.confirmar === "sim") {
          Z.adicionarAndamento(relato.protocolo, { status: "resolvido", data: agoraISO(), nota: "Morador confirmou que o problema foi resolvido." });
          recarregar(relato.protocolo, "Confirmação registrada. Obrigado!");
        } else {
          Z.adicionarAndamento(relato.protocolo, { status: "reaberto", data: agoraISO(), nota: "Morador avisou que o problema continua." });
          recarregar(relato.protocolo, "Relato reaberto. Ele voltou para análise da prefeitura.");
        }
      });
    });

    document.getElementById("copiar-link").addEventListener("click", function () {
      var link = window.location.href.split("?")[0] + "?protocolo=" + relato.protocolo;
      Z.copiarTexto(link)
        .then(function () { Z.avisar("Link copiado. Envie para um vizinho."); })
        .catch(function () { Z.avisar("Não foi possível copiar o link."); });
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
      lista.innerHTML = '<p class="nota">Os relatos que você fizer ou apoiar aparecem aqui, sem precisar do número.</p>' +
        '<a class="botao botao--secundario botao--pequeno botao--bloco" href="relatar.html">' + Z.icone("mais") + "Relatar um problema</a>";
      return;
    }

    acompanhados.sort(function (a, b) { return a.criadoEm < b.criadoEm ? 1 : -1; });
    lista.innerHTML = '<ul class="lista-compacta">' + acompanhados.map(function (r) {
      var cat = Z.categoria(r.categoria);
      return '<li><a class="item-compacto" href="acompanhar.html?protocolo=' + r.protocolo + '" data-protocolo="' + r.protocolo + '">' +
        '<span class="ladrilho">' + Z.icone(cat.icone) + "</span>" +
        "<div><strong>" + Z.escapar(cat.curto) + " na " + Z.escapar(r.rua) + "</strong>" +
        "<span>" + r.protocolo + ". " + (r.meu ? "Você relatou" : "Você apoiou") + "</span>" +
        Z.seloStatus(r.status) + "</div></a></li>";
    }).join("") + "</ul>";
    marcarAtualNaLista();
  }

  function marcarAtualNaLista() {
    document.querySelectorAll("#lista-meus [data-protocolo]").forEach(function (a) {
      if (a.dataset.protocolo === protocoloAberto) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
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
