/*
  Dados simulados do protótipo Zela.
  Ficam em um arquivo JavaScript (e não em .json carregado com fetch)
  para que o site funcione também quando aberto direto do computador.
*/
window.ZELA_DADOS = {
  categorias: [
    {
      id: "iluminacao",
      nome: "Poste apagado ou piscando",
      curto: "Iluminação",
      exemplo: "Lâmpada queimada, poste apagado o dia todo ou aceso de dia.",
      orgao: "Departamento de Iluminação Pública",
      prazoDias: 7,
      icone: "poste"
    },
    {
      id: "buraco",
      nome: "Buraco na rua",
      curto: "Buraco",
      exemplo: "Buraco no asfalto, afundamento ou tampa solta na pista.",
      orgao: "Subprefeitura (tapa-buraco)",
      prazoDias: 15,
      icone: "buraco"
    },
    {
      id: "calcada",
      nome: "Calçada quebrada ou bloqueada",
      curto: "Calçada",
      exemplo: "Piso solto, degrau, rampa quebrada ou obstáculo que impede a passagem.",
      orgao: "Subprefeitura (manutenção de calçadas)",
      prazoDias: 30,
      icone: "calcada"
    },
    {
      id: "lixo",
      nome: "Lixo ou entulho acumulado",
      curto: "Lixo",
      exemplo: "Entulho, móveis velhos ou lixo jogado na calçada ou em terreno.",
      orgao: "Serviço de Limpeza Urbana",
      prazoDias: 5,
      icone: "lixo"
    },
    {
      id: "arvore",
      nome: "Árvore com risco ou precisando de poda",
      curto: "Árvore",
      exemplo: "Galho quebrado, árvore inclinada ou encostando na fiação.",
      orgao: "Subprefeitura (manejo de árvores)",
      prazoDias: 20,
      icone: "arvore"
    },
    {
      id: "bueiro",
      nome: "Bueiro entupido",
      curto: "Bueiro",
      exemplo: "Boca de lobo com lixo, água parada ou que alaga quando chove.",
      orgao: "Subprefeitura (drenagem)",
      prazoDias: 10,
      icone: "bueiro"
    },
    {
      id: "sinalizacao",
      nome: "Placa ou faixa de pedestre apagada",
      curto: "Sinalização",
      exemplo: "Faixa de pedestre apagada, placa caída ou semáforo com defeito.",
      orgao: "Departamento de Trânsito",
      prazoDias: 20,
      icone: "placa"
    }
  ],

  status: {
    "recebido": {
      nome: "Recebido",
      descricao: "A prefeitura recebeu o relato e vai encaminhar para a equipe certa."
    },
    "em-analise": {
      nome: "Em análise",
      descricao: "Uma equipe está verificando o local e o tipo de serviço."
    },
    "programado": {
      nome: "Serviço programado",
      descricao: "O conserto já tem data marcada."
    },
    "em-execucao": {
      nome: "Em execução",
      descricao: "A equipe está trabalhando no local."
    },
    "resolvido": {
      nome: "Resolvido",
      descricao: "A prefeitura informou que o problema foi resolvido."
    },
    "reaberto": {
      nome: "Reaberto",
      descricao: "Um morador avisou que o problema continua. O relato voltou para análise."
    }
  },

  /* Ordem usada pelo modo de demonstração para avançar o andamento */
  fluxo: ["recebido", "em-analise", "programado", "em-execucao", "resolvido"],

  relatos: [
    {
      protocolo: "ZL-2026-004812",
      categoria: "iluminacao",
      rua: "Rua Tuiuti",
      referencia: "Em frente ao número 1200, perto do ponto de ônibus",
      bairro: "Tatuapé",
      cep: "03081-000",
      descricao: "Três postes seguidos apagados. À noite a calçada fica totalmente escura e quem desce do ônibus passa com medo.",
      apoios: 23,
      historico: [
        { status: "recebido", data: "2026-10-20T19:42", nota: "Relato registrado pelo site." },
        { status: "em-analise", data: "2026-10-22T10:05", nota: "Encaminhado para o Departamento de Iluminação Pública." },
        { status: "programado", data: "2026-10-27T15:30", nota: "Troca de lâmpadas marcada para 14/11." }
      ]
    },
    {
      protocolo: "ZL-2026-004530",
      categoria: "buraco",
      rua: "Rua Padre Benedito de Camargo",
      referencia: "Esquina com a Rua Major Ângelo Zanchi",
      bairro: "Penha",
      cep: "03604-010",
      descricao: "Buraco grande na faixa da direita. Motos desviam para cima da calçada.",
      apoios: 41,
      historico: [
        { status: "recebido", data: "2026-10-03T08:11", nota: "Relato registrado pelo site." },
        { status: "em-analise", data: "2026-10-04T09:40", nota: "Vistoria marcada pela Subprefeitura da Penha." },
        { status: "programado", data: "2026-10-09T14:00", nota: "Incluído na rota do tapa-buraco." },
        { status: "em-execucao", data: "2026-10-16T07:30", nota: "Equipe no local." },
        { status: "resolvido", data: "2026-10-16T12:10", nota: "Buraco fechado com asfalto." }
      ]
    },
    {
      protocolo: "ZL-2026-004977",
      categoria: "calcada",
      rua: "Rua da Mooca",
      referencia: "Perto do número 2800, ao lado da padaria",
      bairro: "Mooca",
      cep: "03104-002",
      descricao: "Placas do piso soltas e rampa de cadeira de rodas quebrada. Minha vizinha usa andador e não consegue passar.",
      apoios: 12,
      historico: [
        { status: "recebido", data: "2026-10-28T11:20", nota: "Relato registrado pelo site." },
        { status: "em-analise", data: "2026-10-30T16:45", nota: "Verificando se a calçada é responsabilidade do imóvel ou da prefeitura." }
      ]
    },
    {
      protocolo: "ZL-2026-005102",
      categoria: "lixo",
      rua: "Avenida Itaquera",
      referencia: "Terreno vazio ao lado do número 5100",
      bairro: "Itaquera",
      cep: "08295-000",
      descricao: "Sofá, colchão e restos de obra jogados na calçada. Já apareceu rato.",
      apoios: 18,
      historico: [
        { status: "recebido", data: "2026-11-06T07:55", nota: "Relato registrado pelo site." },
        { status: "em-analise", data: "2026-11-06T13:10", nota: "Encaminhado para a Limpeza Urbana." },
        { status: "em-execucao", data: "2026-11-10T08:00", nota: "Caminhão de coleta a caminho." }
      ]
    },
    {
      protocolo: "ZL-2026-004391",
      categoria: "arvore",
      rua: "Rua Domingos de Morais",
      referencia: "Altura do número 1500",
      bairro: "Vila Mariana",
      cep: "04010-100",
      descricao: "Galho grande rachado pendurado sobre a calçada, encostando nos fios.",
      apoios: 9,
      historico: [
        { status: "recebido", data: "2026-09-25T17:00", nota: "Relato registrado pelo site." },
        { status: "em-analise", data: "2026-09-26T10:30", nota: "Engenheiro agrônomo fará vistoria." },
        { status: "programado", data: "2026-10-01T11:00", nota: "Poda marcada, com desligamento da rede elétrica." },
        { status: "resolvido", data: "2026-10-08T15:40", nota: "Galho removido." }
      ]
    },
    {
      protocolo: "ZL-2026-005188",
      categoria: "bueiro",
      rua: "Rua Clélia",
      referencia: "Em frente ao mercado, perto do número 900",
      bairro: "Lapa",
      cep: "05042-000",
      descricao: "Bueiro tomado de folhas e garrafas. Quando chove a esquina vira um lago.",
      apoios: 27,
      historico: [
        { status: "recebido", data: "2026-11-09T21:18", nota: "Relato registrado pelo site." }
      ]
    },
    {
      protocolo: "ZL-2026-004655",
      categoria: "sinalizacao",
      rua: "Rua Voluntários da Pátria",
      referencia: "Faixa de pedestre em frente à escola estadual",
      bairro: "Santana",
      cep: "02011-000",
      descricao: "A faixa de pedestre em frente à escola está quase invisível. Os carros não param para as crianças.",
      apoios: 56,
      historico: [
        { status: "recebido", data: "2026-10-12T07:20", nota: "Relato registrado pelo site." },
        { status: "em-analise", data: "2026-10-13T09:00", nota: "Encaminhado para o Departamento de Trânsito." },
        { status: "programado", data: "2026-10-21T10:15", nota: "Repintura marcada para a madrugada de 18/11." }
      ]
    },
    {
      protocolo: "ZL-2026-004120",
      categoria: "iluminacao",
      rua: "Estrada de Itapecerica",
      referencia: "Entre os números 4000 e 4200",
      bairro: "Capão Redondo",
      cep: "05835-005",
      descricao: "Trecho longo sem nenhuma luz. Muitos estudantes passam por aqui voltando da escola à noite.",
      apoios: 64,
      historico: [
        { status: "recebido", data: "2026-09-10T20:30", nota: "Relato registrado pelo site." },
        { status: "em-analise", data: "2026-09-12T10:00", nota: "Verificando a rede elétrica do trecho." },
        { status: "em-execucao", data: "2026-09-20T09:00", nota: "Troca de cabos e lâmpadas." },
        { status: "resolvido", data: "2026-09-22T18:00", nota: "Doze postes religados." },
        { status: "reaberto", data: "2026-10-30T21:05", nota: "Morador avisou que dois postes voltaram a apagar." }
      ]
    },
    {
      protocolo: "ZL-2026-004844",
      categoria: "calcada",
      rua: "Rua Alvarenga",
      referencia: "Perto do número 1800, ao lado do ponto de ônibus",
      bairro: "Butantã",
      cep: "05509-002",
      descricao: "Raiz de árvore levantou a calçada inteira. Já vi duas pessoas tropeçarem.",
      apoios: 7,
      historico: [
        { status: "recebido", data: "2026-10-21T12:00", nota: "Relato registrado pelo site." },
        { status: "em-analise", data: "2026-10-24T08:30", nota: "Vistoria marcada." }
      ]
    },
    {
      protocolo: "ZL-2026-004701",
      categoria: "buraco",
      rua: "Rua Muniz de Souza",
      referencia: "Em frente ao número 400",
      bairro: "Aclimação",
      cep: "01534-000",
      descricao: "Tampa de bueiro afundada no meio da rua, faz barulho quando os carros passam.",
      apoios: 5,
      historico: [
        { status: "recebido", data: "2026-10-14T18:30", nota: "Relato registrado pelo site." },
        { status: "em-analise", data: "2026-10-15T11:00", nota: "Encaminhado para a Subprefeitura da Sé." },
        { status: "resolvido", data: "2026-10-29T16:20", nota: "Tampa nivelada." }
      ]
    },
    {
      protocolo: "ZL-2026-005034",
      categoria: "lixo",
      rua: "Rua Tuiuti",
      referencia: "Esquina com a Rua Itapura",
      bairro: "Tatuapé",
      cep: "03081-000",
      descricao: "Lixo de restaurante deixado na calçada fora do horário da coleta.",
      apoios: 4,
      historico: [
        { status: "recebido", data: "2026-11-02T22:40", nota: "Relato registrado pelo site." },
        { status: "resolvido", data: "2026-11-04T07:10", nota: "Coleta feita e estabelecimento orientado." }
      ]
    },
    {
      protocolo: "ZL-2026-005160",
      categoria: "arvore",
      rua: "Rua Carlos Silva",
      referencia: "Praça em frente à igreja",
      bairro: "Penha",
      cep: "03621-000",
      descricao: "Árvore inclinada na direção das casas depois do temporal.",
      apoios: 15,
      historico: [
        { status: "recebido", data: "2026-11-08T06:50", nota: "Relato registrado pelo site." },
        { status: "em-analise", data: "2026-11-08T09:30", nota: "Prioridade alta: vistoria no mesmo dia." }
      ]
    },
    {
      protocolo: "ZL-2026-004266",
      categoria: "bueiro",
      rua: "Rua Antônio de Barros",
      referencia: "Perto do número 2000",
      bairro: "Tatuapé",
      cep: "03401-001",
      descricao: "Água parada no bueiro há semanas, com cheiro forte e mosquitos.",
      apoios: 11,
      historico: [
        { status: "recebido", data: "2026-09-18T14:00", nota: "Relato registrado pelo site." },
        { status: "em-analise", data: "2026-09-19T10:00", nota: "Encaminhado para drenagem." },
        { status: "em-execucao", data: "2026-09-29T08:00", nota: "Limpeza da galeria." },
        { status: "resolvido", data: "2026-09-29T15:00", nota: "Bueiro desobstruído." }
      ]
    },
    {
      protocolo: "ZL-2026-005215",
      categoria: "sinalizacao",
      rua: "Avenida Itaquera",
      referencia: "Cruzamento com a Rua Gregório Ramalho",
      bairro: "Itaquera",
      cep: "08295-000",
      descricao: "Semáforo de pedestre não abre. As pessoas atravessam no meio dos carros.",
      apoios: 32,
      historico: [
        { status: "recebido", data: "2026-11-10T17:25", nota: "Relato registrado pelo site." },
        { status: "em-analise", data: "2026-11-11T08:15", nota: "Equipe de semáforos acionada." }
      ]
    },
    {
      protocolo: "ZL-2026-004588",
      categoria: "iluminacao",
      rua: "Rua Clélia",
      referencia: "Altura do número 1500",
      bairro: "Lapa",
      cep: "05042-000",
      descricao: "Poste piscando a noite inteira.",
      apoios: 3,
      historico: [
        { status: "recebido", data: "2026-10-06T19:00", nota: "Relato registrado pelo site." },
        { status: "programado", data: "2026-10-09T10:00", nota: "Troca de reator marcada." },
        { status: "resolvido", data: "2026-10-11T20:00", nota: "Poste consertado." }
      ]
    },
    {
      protocolo: "ZL-2026-004903",
      categoria: "calcada",
      rua: "Rua Voluntários da Pátria",
      referencia: "Saída da estação de metrô Santana",
      bairro: "Santana",
      cep: "02011-000",
      descricao: "Piso tátil arrancado em vários trechos. Pessoas cegas perdem a referência na saída do metrô.",
      apoios: 38,
      historico: [
        { status: "recebido", data: "2026-10-25T09:10", nota: "Relato registrado pelo site." },
        { status: "em-analise", data: "2026-10-26T14:20", nota: "Encaminhado para a Subprefeitura de Santana." },
        { status: "programado", data: "2026-11-05T11:00", nota: "Reforma do trecho marcada para dezembro." }
      ]
    }
  ]
};
