# Zela: cuide da sua rua

Protótipo navegável de CitizenTech desenvolvido para a **Global Solution FIAP**.

O Zela ajuda o morador de uma grande cidade a **relatar problemas de zeladoria urbana** (poste apagado, buraco, calçada quebrada, lixo acumulado, bueiro entupido, árvore com risco e sinalização apagada) e a **acompanhar o conserto** pelo número do protocolo, do relato até a confirmação de que o problema foi resolvido.

🔗 **Deploy:** https://SEU-USUARIO.github.io/zela/
🎬 **Vídeo-pitch:** https://youtu.be/tpXPpT6Ffq8

## Integrantes

| Nome completo | RM |
|---|---|
| Vinícius Soares da Silva Britto | RM556994 |

## O problema

Em São Paulo, pedidos de tapa-buraco, poda de árvore e troca de lâmpada estão entre os mais frequentes nos canais da prefeitura. Mesmo assim, o morador costuma enfrentar três obstáculos:

1. **Não sabe a quem pedir.** Poste apagado é com a prefeitura, mas falta de luz em casa é com a distribuidora de energia.
2. **Não vê o que acontece depois.** O protocolo some e o morador não sabe se alguém foi ao local.
3. **O mesmo problema é relatado muitas vezes**, em pedidos soltos que não mostram quantas pessoas são afetadas.

## A solução

| Página | O que o cidadão faz ali |
|---|---|
| `index.html` (Início) | Entende o serviço, vê as últimas atualizações e o resumo do seu bairro |
| `relatar.html` (Relatar) | Relata o problema em 4 etapas e recebe um protocolo |
| `acompanhar.html` (Acompanhar) | Busca o protocolo, vê a linha do tempo e o prazo, confirma se ficou resolvido |
| `bairro.html` (Meu bairro) | Filtra os relatos da região e apoia ("eu também") os que já existem |
| `ajuda.html` (Ajuda) | Descobre quem resolve cada caso, consulta prazos e tira dúvidas |

### Interações com JavaScript

- **Busca de CEP com a API ViaCEP:** preenche a rua e o bairro.
- **"Usar minha localização":** Geolocation + API Nominatim/OpenStreetMap.
- **Detecção de relato repetido:** antes de criar um relato novo, o site oferece apoiar o que já existe.
- **Formulário em etapas** com validação, resumo de erros com links e foco no título de cada etapa.
- **Alerta de emergência** com os telefones 199/193/192 quando o morador informa que há risco.
- **Prévia de foto** com campo obrigatório de descrição (texto alternativo escrito pelo próprio morador).
- **Rascunho automático:** quem sai no meio do relato pode continuar depois.
- **Protocolo com botão de copiar**, barra de etapas, linha do tempo, prazo previsto e aviso de atraso.
- **Confirmação do morador:** "Sim, foi resolvido" ou "Não, continua igual" (o relato é reaberto).
- **Filtros combinados** com contagem anunciada ao leitor de tela, resumo em números e filtros guardados no endereço da página.
- **Botão "Eu também"** (`aria-pressed`) para apoiar relatos.
- **Guia "Quem resolve?"** para casos que não são da prefeitura.
- **Atalhos por tipo de problema** na página inicial, que já abrem o relato com o tipo escolhido.
- **Preferências de leitura:** botões de texto maior e alto contraste no cabeçalho, salvos no navegador.

### Acessibilidade

- HTML semântico (`header`, `nav`, `main`, `footer`, títulos em ordem), link "Pular para o conteúdo".
- Contraste de no mínimo 5,5:1 em todos os textos (WCAG AA), além de um modo de alto contraste.
- Navegação completa por teclado, com foco visível em amarelo e preto, inclusive nos elementos criados por JavaScript.
- `label` em todos os campos, erros ligados ao campo por `aria-describedby` e `aria-invalid`, e avisos lidos por `aria-live`.
- Status nunca indicado só por cor: sempre há texto ("Em análise", "Resolvido").
- Texto em Atkinson Hyperlegible Next, criada pelo Braille Institute para pessoas com baixa visão. Títulos em Overpass, derivada da sinalização de rodovias.
- Respeito a `prefers-reduced-motion` e áreas de toque de pelo menos 44 px.

## Tecnologias

HTML5, CSS3 e JavaScript puro, sem frameworks. Os dados são simulados em `js/dados.js`. Relatos, apoios e preferências ficam no `localStorage` do navegador. Integra duas APIs públicas: **ViaCEP** e **Nominatim (OpenStreetMap)**. Ícones no estilo [Lucide](https://lucide.dev) (licença ISC).

```
zela/
├── index.html, relatar.html, acompanhar.html, bairro.html, ajuda.html
├── css/style.css
├── js/
│   ├── dados.js        # categorias, status e relatos simulados
│   ├── app.js          # funções compartilhadas, armazenamento, acessibilidade
│   ├── inicio.js, relatar.js, acompanhar.js, bairro.js, ajuda.js
└── img/favicon.svg
```

## Como rodar

Abra o `index.html` no navegador. O site funciona sem servidor. Para testar a localização, use um servidor local, porque a geolocalização exige `https` ou `localhost`:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

**Protocolos de exemplo:** `ZL-2026-004812` (serviço programado) e `ZL-2026-004120` (reaberto).

## Publicar no GitHub Pages

1. Envie os arquivos para um repositório público.
2. Vá em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`.
3. Copie o link gerado para este README, para o PDF e para a descrição do vídeo.

## ODS relacionado

**ODS 11, Cidades e Comunidades Sustentáveis** (meta 11.7: espaços públicos seguros, inclusivos e acessíveis), com relação secundária ao **ODS 16** (instituições eficazes e transparentes).

> Protótipo acadêmico: os relatos são simulados e nada é enviado a nenhuma prefeitura.
