/*
  Página "Relatar um problema"
  Formulário em 4 etapas com validação acessível, busca de CEP (ViaCEP),
  localização do aparelho (Nominatim/OpenStreetMap), detecção de relatos
  repetidos, prévia de foto com descrição e rascunho salvo automaticamente.
*/
(function () {
  "use strict";
  var Z = window.Zela;

  var form = document.getElementById("form-relato");
  var etapas = Array.prototype.slice.call(document.querySelectorAll(".etapa"));
  var marcadores = Array.prototype.slice.call(document.querySelectorAll(".etapas li"));
  var etapaAtual = 1;
  var foto = null;             // { miniatura: dataURL }
  var duplicadoVisto = "";     // evita mostrar o mesmo aviso de duplicado duas vezes
  var duplicadoAtual = null;

  function $(id) { return document.getElementById(id); }
  function valor(nome) {
    var el = form.elements[nome];
    if (!el) return "";
    if (el instanceof RadioNodeList) return el.value || "";
    return (el.value || "").trim();
  }

  function agoraISO() {
    var d = new Date();
    function p(n) { return String(n).padStart(2, "0"); }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  /* ---------- Montagem inicial ---------- */
  function montarCategorias() {
    var html = Z.categorias.map(function (c) {
      return '<label class="opcao-categoria">' +
        '<input type="radio" name="categoria" value="' + c.id + '">' +
        '<span class="ladrilho">' + Z.icone(c.icone) + "</span>" +
        '<span class="opcao-categoria__texto"><strong>' + Z.escapar(c.nome) + "</strong>" +
        "<span>" + Z.escapar(c.exemplo) + "</span></span>" +
        '<span class="opcao-categoria__marca">' + Z.icone("check") + "</span></label>";
    }).join("");
    $("opcoes-categoria").innerHTML = html;
  }

  function montarBairros() {
    var vistos = {};
    Z.todosRelatos().forEach(function (r) { vistos[r.bairro] = true; });
    $("lista-bairros").innerHTML = Object.keys(vistos).sort().map(function (b) {
      return '<option value="' + Z.escapar(b) + '">';
    }).join("");
  }

  /* ---------- Navegação entre etapas ---------- */
  function irPara(numero, focar) {
    etapaAtual = numero;
    etapas.forEach(function (sec) {
      sec.hidden = Number(sec.dataset.etapa) !== numero;
    });
    marcadores.forEach(function (li) {
      var n = Number(li.dataset.etapa);
      if (n === numero) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      li.classList.toggle("etapas--feita", n < numero);
      li.querySelector(".etapas__num").innerHTML = n < numero
        ? Z.icone("check") + '<span class="visualmente-oculto">concluída</span>'
        : String(n);
    });
    if (numero === 4) montarRevisao();
    salvarRascunho();
    if (focar !== false) {
      var titulo = $("titulo-etapa-" + numero);
      titulo.focus();
      titulo.scrollIntoView({ block: "start" });
    }
  }

  /* ---------- Erros ---------- */
  function limparErros(secao) {
    secao.querySelectorAll(".erro").forEach(function (p) { p.hidden = true; p.textContent = ""; });
    secao.querySelectorAll("[aria-invalid]").forEach(function (el) { el.removeAttribute("aria-invalid"); });
    var resumo = secao.querySelector(".resumo-erros");
    if (resumo) { resumo.hidden = true; resumo.innerHTML = ""; }
  }

  function marcarErro(idErro, idCampo, mensagem) {
    var p = $(idErro);
    p.textContent = mensagem;
    p.hidden = false;
    var campo = $(idCampo);
    if (campo) campo.setAttribute("aria-invalid", "true");
  }

  function mostrarResumo(secao, erros) {
    var resumo = secao.querySelector(".resumo-erros");
    var titulo = erros.length === 1 ? "Falta 1 item para continuar" : "Faltam " + erros.length + " itens para continuar";
    resumo.innerHTML = "<h3>" + titulo + "</h3><ul>" + erros.map(function (e) {
      return '<li><a href="#' + e.foco + '" data-foco="' + e.foco + '">' + Z.escapar(e.mensagem) + "</a></li>";
    }).join("") + "</ul>";
    resumo.hidden = false;
    resumo.setAttribute("tabindex", "-1");
    resumo.focus();
  }

  form.addEventListener("click", function (e) {
    var link = e.target.closest("a[data-foco]");
    if (!link) return;
    e.preventDefault();
    var alvo = $(link.dataset.foco);
    if (alvo) { alvo.focus(); alvo.scrollIntoView({ block: "center" }); }
  });

  function validar(numero) {
    var secao = etapas[numero - 1];
    var erros = [];
    limparErros(secao);

    function erro(idErro, idCampo, idFoco, mensagem) {
      marcarErro(idErro, idCampo, mensagem);
      erros.push({ foco: idFoco, mensagem: mensagem });
    }

    if (numero === 1) {
      if (!valor("categoria")) {
        var primeiro = form.querySelector('input[name="categoria"]');
        primeiro.id = primeiro.id || "categoria-primeira";
        erro("erro-categoria", null, primeiro.id, "Escolha o tipo de problema.");
      }
      if (!valor("risco")) {
        var r = form.querySelector('input[name="risco"]');
        r.id = r.id || "risco-primeiro";
        erro("erro-risco", null, r.id, "Responda se alguém pode se machucar agora.");
      }
    }

    if (numero === 2) {
      var cep = valor("cep").replace(/\D/g, "");
      if (cep && cep.length !== 8) erro("erro-cep", "cep", "cep", "O CEP precisa ter 8 números.");
      if (valor("rua").length < 3) erro("erro-rua", "rua", "rua", "Informe a rua ou avenida.");
      if (!/[0-9A-Za-zÀ-ÿ]/.test(valor("referencia"))) erro("erro-referencia", "referencia", "referencia", "Informe um número aproximado ou um ponto de referência.");
      if (valor("bairro").length < 2) erro("erro-bairro", "bairro", "bairro", "Informe o bairro.");
    }

    if (numero === 3) {
      if (valor("descricao").length < 10) erro("erro-descricao", "descricao", "descricao", "Descreva o problema com pelo menos 10 letras.");
      if (foto && valor("fotoDescricao").length < 3) erro("erro-foto-descricao", "foto-descricao", "foto-descricao", "Descreva a foto em poucas palavras ou remova a foto.");
      var tipo = valor("aviso");
      var contato = valor("contato");
      if (tipo === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contato)) {
        erro("erro-contato", "contato", "contato", "Informe um e-mail válido, como nome@exemplo.com.");
      }
      if (tipo === "whatsapp" && !/^\d{10,11}$/.test(contato.replace(/\D/g, ""))) {
        erro("erro-contato", "contato", "contato", "Informe o WhatsApp com DDD. Exemplo: 11 91234-5678.");
      }
    }

    if (erros.length) mostrarResumo(secao, erros);
    return erros.length === 0;
  }

  /* Limpa o erro do campo assim que a pessoa corrige */
  form.addEventListener("input", function (e) {
    var campo = e.target;
    if (campo.getAttribute("aria-invalid") === "true") {
      campo.removeAttribute("aria-invalid");
      var idErro = "erro-" + campo.id;
      if ($(idErro)) $(idErro).hidden = true;
    }
  });
  form.addEventListener("change", function (e) {
    if (e.target.name === "categoria") $("erro-categoria").hidden = true;
    if (e.target.name === "risco") {
      $("erro-risco").hidden = true;
      var alerta = $("alerta-emergencia");
      var risco = e.target.value === "sim";
      alerta.hidden = !risco;
      if (risco) Z.avisar("Atenção: há risco agora. Veja os telefones de emergência logo abaixo.", "alerta");
    }
  });

  /* ---------- Botões Continuar e Voltar ---------- */
  form.addEventListener("click", function (e) {
    if (e.target.closest("[data-avancar]")) {
      if (!validar(etapaAtual)) return;
      if (etapaAtual === 2 && verificarDuplicado()) return;
      irPara(etapaAtual + 1);
    }
    if (e.target.closest("[data-voltar]")) irPara(etapaAtual - 1);
    var alterar = e.target.closest("[data-ir]");
    if (alterar) irPara(Number(alterar.dataset.ir));
  });

  /* ---------- CEP com ViaCEP ---------- */
  var campoCep = $("cep");
  var ultimoCepBuscado = "";

  campoCep.addEventListener("input", function () {
    var numeros = campoCep.value.replace(/\D/g, "").slice(0, 8);
    campoCep.value = numeros.length > 5 ? numeros.slice(0, 5) + "-" + numeros.slice(5) : numeros;
    if (numeros.length === 8 && numeros !== ultimoCepBuscado) buscarCep(numeros);
    if (numeros.length < 8) $("status-cep").textContent = "";
  });

  function buscarComLimite(url, ms) {
    var controle = "AbortController" in window ? new AbortController() : null;
    var timer = window.setTimeout(function () { if (controle) controle.abort(); }, ms);
    return fetch(url, controle ? { signal: controle.signal } : {}).then(function (resp) {
      window.clearTimeout(timer);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      return resp.json();
    });
  }

  function buscarCep(cep) {
    ultimoCepBuscado = cep;
    var status = $("status-cep");
    status.className = "status-campo status-campo--carregando";
    status.textContent = "Buscando endereço do CEP…";

    buscarComLimite("https://viacep.com.br/ws/" + cep + "/json/", 7000)
      .then(function (dados) {
        if (dados.erro) {
          status.className = "status-campo status-campo--erro";
          status.textContent = "CEP não encontrado. Confira os números ou preencha a rua e o bairro abaixo.";
          return;
        }
        if (dados.logradouro) form.elements.rua.value = dados.logradouro;
        if (dados.bairro) form.elements.bairro.value = dados.bairro;
        status.className = "status-campo status-campo--ok";
        status.textContent = "Endereço encontrado: " + [dados.logradouro, dados.bairro, dados.localidade + "/" + dados.uf].filter(Boolean).join(", ") + ". Agora informe um ponto de referência.";
        salvarRascunho();
      })
      .catch(function () {
        status.className = "status-campo status-campo--erro";
        status.textContent = "Não foi possível buscar o CEP agora. Preencha a rua e o bairro abaixo.";
      });
  }

  /* ---------- Localização do aparelho ---------- */
  $("usar-localizacao").addEventListener("click", function () {
    var status = $("status-localizacao");
    if (!("geolocation" in navigator)) {
      status.className = "status-campo status-campo--erro";
      status.textContent = "Este aparelho não informa a localização. Preencha o endereço abaixo.";
      return;
    }
    status.className = "status-campo status-campo--carregando";
    status.textContent = "Pedindo sua localização ao aparelho…";

    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude.toFixed(6);
      var lon = pos.coords.longitude.toFixed(6);
      status.textContent = "Localização recebida. Buscando o nome da rua…";
      buscarComLimite("https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=pt-BR&lat=" + lat + "&lon=" + lon, 8000)
        .then(function (dados) {
          var end = dados.address || {};
          var rua = end.road || end.pedestrian || "";
          var bairro = end.suburb || end.neighbourhood || end.city_district || "";
          if (rua) form.elements.rua.value = rua;
          if (bairro) form.elements.bairro.value = bairro;
          if (end.postcode) form.elements.cep.value = end.postcode;
          status.className = "status-campo status-campo--ok";
          status.textContent = rua
            ? "Encontramos: " + [rua, bairro].filter(Boolean).join(", ") + ". Confira e ajuste se precisar."
            : "Não encontramos o nome da rua. Preencha o endereço abaixo.";
          salvarRascunho();
        })
        .catch(function () {
          status.className = "status-campo status-campo--erro";
          status.textContent = "Não foi possível descobrir o endereço agora. Preencha os campos abaixo.";
        });
    }, function (erro) {
      status.className = "status-campo status-campo--erro";
      status.textContent = erro.code === 1
        ? "Você não permitiu o acesso à localização. Sem problema: preencha o endereço abaixo."
        : "Não foi possível obter sua localização. Preencha o endereço abaixo.";
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  });

  /* ---------- Relatos repetidos ---------- */
  function procurarParecido() {
    var categoria = valor("categoria");
    var rua = Z.normalizar(valor("rua"));
    var bairro = Z.normalizar(valor("bairro"));
    var candidatos = Z.todosRelatos().filter(function (r) {
      if (r.categoria !== categoria || r.status === "resolvido") return false;
      if (Z.normalizar(r.bairro) !== bairro) return false;
      var ruaRelato = Z.normalizar(r.rua);
      return ruaRelato === rua || ruaRelato.indexOf(rua) !== -1 || rua.indexOf(ruaRelato) !== -1;
    });
    candidatos.sort(function (a, b) { return b.apoios - a.apoios; });
    return candidatos[0] || null;
  }

  function verificarDuplicado() {
    var chave = [valor("categoria"), Z.normalizar(valor("rua")), Z.normalizar(valor("bairro"))].join("|");
    if (chave === duplicadoVisto) return false;
    var parecido = procurarParecido();
    if (!parecido) { $("duplicado").hidden = true; return false; }

    duplicadoVisto = chave;
    duplicadoAtual = parecido;
    var cat = Z.categoria(parecido.categoria);
    $("duplicado-relato").innerHTML =
      '<article class="relato">' +
        '<div class="relato__topo"><span class="ladrilho">' + Z.icone(cat.icone) + "</span>" + Z.seloStatus(parecido.status) + "</div>" +
        "<h4>" + Z.escapar(cat.nome) + "</h4>" +
        '<p class="relato__local">' + Z.icone("local") + "<span>" + Z.escapar(parecido.rua) + ", " + Z.escapar(parecido.bairro) + ". " + Z.escapar(parecido.referencia) + "</span></p>" +
        '<p class="relato__descricao">' + Z.escapar(parecido.descricao) + "</p>" +
        '<p class="relato__meta relato__meta--final">Relatado ' + Z.haQuanto(parecido.criadoEm) + ". " +
        Z.plural(parecido.apoios, "pessoa já apoiou", "pessoas já apoiaram") + ".</p>" +
      "</article>";
    $("duplicado").hidden = false;
    $("titulo-duplicado").focus();
    return true;
  }

  $("ignorar-duplicado").addEventListener("click", function () {
    $("duplicado").hidden = true;
    irPara(3);
  });

  $("apoiar-duplicado").addEventListener("click", function () {
    if (!duplicadoAtual) return;
    if (!duplicadoAtual.apoiado) Z.alternarApoio(duplicadoAtual.protocolo);
    Z.apagar(Z.CHAVES.rascunho);
    var atualizado = Z.buscarRelato(duplicadoAtual.protocolo);
    mostrarConfirmacao(atualizado, true);
  });

  /* ---------- Descrição com contador ---------- */
  var descricao = $("descricao");
  var avisouLimite = false;
  function atualizarContador() {
    var n = descricao.value.length;
    $("contador-descricao").textContent = n + " de 500 caracteres";
    $("contador-descricao").classList.toggle("contador-texto--limite", n >= 450);
    if (n >= 450 && !avisouLimite) { Z.avisar("Restam " + (500 - n) + " caracteres."); avisouLimite = true; }
    if (n < 450) avisouLimite = false;
  }
  descricao.addEventListener("input", atualizarContador);

  /* ---------- Foto com prévia e descrição ---------- */
  var campoFoto = $("foto");
  var previa = $("previa-foto");
  var campoFotoDescricao = $("foto-descricao");

  function atualizarAltPrevia() {
    var texto = campoFotoDescricao.value.trim();
    previa.alt = texto ? "Sua foto: " + texto : "Sua foto, ainda sem descrição";
  }
  campoFotoDescricao.addEventListener("input", atualizarAltPrevia);

  campoFoto.addEventListener("change", function () {
    var arquivo = campoFoto.files && campoFoto.files[0];
    $("erro-foto").hidden = true;
    if (!arquivo) return;
    if (!/^image\//.test(arquivo.type)) {
      marcarErro("erro-foto", "foto", "Escolha um arquivo de imagem, como JPG ou PNG.");
      campoFoto.value = "";
      return;
    }
    if (arquivo.size > 10 * 1024 * 1024) {
      marcarErro("erro-foto", "foto", "A foto tem mais de 10 MB. Escolha uma imagem menor.");
      campoFoto.value = "";
      return;
    }
    reduzirImagem(arquivo, 480).then(function (dataUrl) {
      foto = { miniatura: dataUrl };
      previa.src = dataUrl;
      atualizarAltPrevia();
      $("bloco-foto").hidden = false;
      campoFotoDescricao.focus();
      Z.avisar("Foto adicionada. Agora descreva a foto em poucas palavras.");
    }).catch(function () {
      marcarErro("erro-foto", "foto", "Não foi possível abrir essa foto. Tente outra imagem.");
    });
  });

  $("remover-foto").addEventListener("click", function () {
    foto = null;
    campoFoto.value = "";
    campoFotoDescricao.value = "";
    previa.removeAttribute("src");
    $("bloco-foto").hidden = true;
    campoFoto.focus();
    Z.avisar("Foto removida.");
  });

  /* Diminui a foto para caber no armazenamento do navegador */
  function reduzirImagem(arquivo, maximo) {
    return new Promise(function (resolve, reject) {
      var leitor = new FileReader();
      leitor.onerror = reject;
      leitor.onload = function () {
        var img = new Image();
        img.onerror = reject;
        img.onload = function () {
          var escala = Math.min(1, maximo / Math.max(img.width, img.height));
          var canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * escala);
          canvas.height = Math.round(img.height * escala);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };
        img.src = leitor.result;
      };
      leitor.readAsDataURL(arquivo);
    });
  }

  /* ---------- Forma de aviso ---------- */
  function atualizarContato() {
    var tipo = valor("aviso");
    var bloco = $("campo-contato");
    var campo = $("contato");
    bloco.hidden = tipo === "nenhum" || !tipo;
    if (tipo === "email") {
      $("rotulo-contato").textContent = "Seu e-mail";
      campo.type = "email"; campo.autocomplete = "email"; campo.inputMode = "email";
      campo.placeholder = "nome@exemplo.com";
    } else if (tipo === "whatsapp") {
      $("rotulo-contato").textContent = "Seu WhatsApp com DDD";
      campo.type = "tel"; campo.autocomplete = "tel"; campo.inputMode = "tel";
      campo.placeholder = "11 91234-5678";
    }
  }
  form.querySelectorAll('input[name="aviso"]').forEach(function (r) {
    r.addEventListener("change", function () {
      atualizarContato();
      if (!$("campo-contato").hidden) $("contato").focus();
    });
  });

  /* ---------- Revisão ---------- */
  function montarRevisao() {
    var cat = Z.categoria(valor("categoria"));
    var aviso = valor("aviso");
    var textoAviso = aviso === "email" ? "Por e-mail: " + valor("contato")
      : aviso === "whatsapp" ? "Por WhatsApp: " + valor("contato")
      : "Sem avisos. Vou acompanhar pelo protocolo.";

    var itens = [
      { rotulo: "Problema", texto: cat ? cat.nome : "", etapa: 1 },
      { rotulo: "Risco agora", texto: valor("risco") === "sim" ? "Sim" : "Não", etapa: 1 },
      { rotulo: "Local", texto: valor("rua") + ", " + valor("bairro") + " (" + valor("referencia") + ")" + (valor("cep") ? ". CEP " + valor("cep") : ""), etapa: 2 },
      { rotulo: "Descrição", texto: valor("descricao"), etapa: 3 },
      { rotulo: "Foto", texto: foto ? valor("fotoDescricao") : "Sem foto", etapa: 3, foto: foto },
      { rotulo: "Avisos", texto: textoAviso, etapa: 3 }
    ];

    $("revisao").innerHTML = itens.map(function (item) {
      return '<div class="revisao__item">' +
        "<dt>" + item.rotulo + "</dt>" +
        "<dd>" + (item.foto ? '<img class="revisao__foto" src="' + item.foto.miniatura + '" alt="">' : "") +
        "<span>" + Z.escapar(item.texto) + "</span></dd>" +
        '<dd class="revisao__acao"><button type="button" class="botao botao--texto" data-ir="' + item.etapa + '">' +
        Z.icone("lapis") + 'Alterar <span class="visualmente-oculto">' + item.rotulo.toLowerCase() + "</span></button></dd>" +
      "</div>";
    }).join("");
  }

  /* ---------- Envio ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    for (var n = 1; n <= 3; n++) {
      if (!validar(n)) { irPara(n, false); validar(n); return; }
    }

    var relato = {
      protocolo: Z.gerarProtocolo(),
      categoria: valor("categoria"),
      rua: valor("rua"),
      referencia: valor("referencia"),
      bairro: valor("bairro"),
      cep: valor("cep"),
      descricao: valor("descricao"),
      risco: valor("risco") === "sim",
      aviso: valor("aviso"),
      contato: valor("aviso") === "nenhum" ? "" : valor("contato"),
      apoios: 0,
      historico: [{ status: "recebido", data: agoraISO(), nota: "Relato registrado pelo site." }]
    };
    if (foto) { relato.foto = foto.miniatura; relato.fotoDescricao = valor("fotoDescricao"); }

    var salvou = Z.salvarRelato(relato);
    if (!salvou && relato.foto) {
      // sem espaço para a foto: salva o relato sem ela
      delete relato.foto;
      salvou = Z.salvarRelato(relato);
    }
    if (!salvou) {
      Z.avisar("Não foi possível guardar o relato neste navegador. Anote os dados e tente de novo.");
      return;
    }
    Z.apagar(Z.CHAVES.rascunho);
    mostrarConfirmacao(Z.buscarRelato(relato.protocolo), false);
  });

  function mostrarConfirmacao(relato, foiApoio) {
    var cat = Z.categoria(relato.categoria);
    $("area-formulario").hidden = true;
    $("confirmacao").hidden = false;

    $("titulo-confirmacao").textContent = foiApoio ? "Apoio registrado" : "Relato enviado";
    $("texto-confirmacao").textContent = foiApoio
      ? "Você apoiou o relato de " + cat.nome.toLowerCase() + " na " + relato.rua + ". Agora " + Z.plural(relato.apoios, "pessoa pede", "pessoas pedem") + " esse conserto."
      : "Recebemos seu relato de " + cat.nome.toLowerCase() + ". Guarde o número abaixo para acompanhar.";
    $("numero-protocolo").textContent = relato.protocolo;
    $("endereco-protocolo").textContent = relato.rua + ", " + relato.bairro;
    $("prazo-confirmacao").textContent = foiApoio
      ? "Situação atual: " + Z.statusInfo[relato.status].nome + ". " + Z.textoPrazo(relato) + "."
      : "Responsável: " + cat.orgao + ". O prazo previsto para esse tipo de serviço é de " + cat.prazoDias + " dias, até " + Z.formatarData(Z.prazo(relato).limite.toISOString()) + ".";
    $("link-acompanhar").href = "acompanhar.html?protocolo=" + encodeURIComponent(relato.protocolo);
    $("link-acompanhar").textContent = foiApoio ? "Acompanhar o relato apoiado" : "Acompanhar este relato";
    document.title = (foiApoio ? "Apoio registrado" : "Relato enviado") + " · Zela";
    $("titulo-confirmacao").focus();
    window.scrollTo(0, 0);

    $("copiar-protocolo").onclick = function () {
      Z.copiarTexto(relato.protocolo)
        .then(function () { Z.avisar("Número " + relato.protocolo + " copiado."); })
        .catch(function () { Z.avisar("Não foi possível copiar. O número é " + relato.protocolo + "."); });
    };
  }

  /* ---------- Rascunho automático ---------- */
  var CAMPOS = ["categoria", "risco", "cep", "rua", "referencia", "bairro", "descricao", "aviso", "contato"];

  function salvarRascunho() {
    var dados = { etapa: etapaAtual, valores: {} };
    var temAlgo = false;
    CAMPOS.forEach(function (nome) {
      var v = valor(nome);
      dados.valores[nome] = v;
      if (v && nome !== "aviso") temAlgo = true;
    });
    if (temAlgo) Z.gravar(Z.CHAVES.rascunho, dados);
  }

  function restaurarRascunho(dados) {
    CAMPOS.forEach(function (nome) {
      var el = form.elements[nome];
      var v = dados.valores[nome];
      if (!el || v == null) return;
      if (el instanceof RadioNodeList) {
        Array.prototype.forEach.call(el, function (r) { r.checked = r.value === v; });
      } else {
        el.value = v;
      }
    });
    $("alerta-emergencia").hidden = valor("risco") !== "sim";
    atualizarContador();
    atualizarContato();
    irPara(Math.min(dados.etapa || 1, 3));
  }

  var salvarTimer;
  form.addEventListener("input", function () {
    window.clearTimeout(salvarTimer);
    salvarTimer = window.setTimeout(salvarRascunho, 400);
  });
  form.addEventListener("change", salvarRascunho);

  /* ---------- Início ---------- */
  montarCategorias();
  montarBairros();

  var rascunho = Z.ler(Z.CHAVES.rascunho, null);
  if (rascunho && rascunho.valores) {
    $("aviso-rascunho").hidden = false;
    $("continuar-rascunho").addEventListener("click", function () {
      $("aviso-rascunho").hidden = true;
      restaurarRascunho(rascunho);
    });
    $("descartar-rascunho").addEventListener("click", function () {
      Z.apagar(Z.CHAVES.rascunho);
      $("aviso-rascunho").hidden = true;
      $("titulo-etapa-1").focus();
      Z.avisar("Rascunho apagado. Comece pelo tipo de problema.");
    });
  }

  /* Atalho vindo da página inicial: relatar.html?categoria=buraco */
  var params = new URLSearchParams(window.location.search);
  var catInicial = params.get("categoria");
  if (catInicial && Z.categoria(catInicial)) {
    var radio = form.querySelector('input[name="categoria"][value="' + catInicial + '"]');
    if (radio) radio.checked = true;
  }
})();
