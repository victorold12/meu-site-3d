# Arquitetura de componentes da referência

Estado: **OBSERVADO EM FONTE**, com distinção entre DOM e cena 3D. Este documento descreve a referência; não afirma quais adaptações do projeto local já foram implementadas ou testadas.

## Superfícies e limites

O site é um mundo interativo com interface DOM sobre um canvas. `html`, `body`, `.game`, `.menu` e `.modals` ocupam viewport fixa e usam overflow hidden (`upstream/sources/style/general.styl:20-36`). Não existe base para tratá-lo como landing page de seções animadas por scroll.

A fonte declara `<canvas class="js-canvas">` (`upstream/sources/index.html:62-64`); o HTML vivo registra classe adicional `experience`, backend `three.js r183 webgpu` e dimensões `1440×900` (`reference/index.html:61-63`). A classe é adicionada pelo renderer (`upstream/sources/Game/Rendering.js:40-50`). A marcação capturada contém estado transitório `input-filter-intro` e `is-server-offline` (`reference/index.html:1`); estes valores são observação daquela captura, não disponibilidade permanente do site.

## Árvore DOM observada

```text
body
├── .js-fonts-loader.fonts-loader
│   └── .font[data-font] × Nunito / Amatic SC / Pally-Medium
└── .game
    ├── canvas.js-canvas → .experience em runtime
    ├── .js-touch-buttons.touch-buttons
    │   ├── .js-overlay.overlay
    │   └── .list > button.js-button[data-name]
    ├── button.js-menu-trigger.menu-trigger
    │   └── .button-inner > .icon-container > .icon > .line × 3
    ├── button.js-map-trigger.map-trigger
    ├── .js-menu.menu
    │   └── .inner
    │       ├── button.js-close.close
    │       ├── .js-navigation.navigation
    │       │   └── button.js-navigation-item.item[data-name]
    │       └── .container
    │           ├── .js-previews.previews > .js-preview.preview.{name}-preview
    │           └── .js-contents.contents > .js-content.content.{name}-content
    │               └── .content-inner
    └── .js-modals.modals > .js-modal.modal[data-name]
```

Evidências: `upstream/sources/index.html:56-118,181-238,742-863`. Nomes iguais são contratos funcionais: `Menu` cruza `data-name` com classes `{name}-preview` e `{name}-content` (`upstream/sources/Game/Menu.js:92-118`); `Modals` indexa `data-name` (`Game/Modals.js:63-90`). Alterar apenas uma das pontas quebra o vínculo.

## Módulos independentes e contratos

| Módulo | Responsabilidade e fronteira | Fonte |
|---|---|---|
| Game | Singleton que encontra `.game`/`.js-canvas` e inicializa input, ticker, viewport, menu, modais, renderer, mundo e reveal | `upstream/sources/Game/Game.js:70-115,200-206` |
| Rendering | Renderer, pós-processamento e ligação do loop; desenha após listeners de prioridade menor | `upstream/sources/Game/Rendering.js:23-35,38-78` |
| Viewport | Mede container, aspect ratio e DPR ≤2; evento imediato `change` e evento após `400ms` `throttleChange` | `upstream/sources/Game/Viewport.js:15-46` |
| View | Câmera perspectiva, tracking do veículo, zoom, modo livre e cinematic; sem dependência de layout de cards | `upstream/sources/Game/View.js:55-81,284-344,392-458` |
| Intro / Reveal | Anel, planos texturizados de instruções, botão de áudio e sequência de descoberta do mundo | `upstream/sources/Game/World/Intro.js:16-20,51-113,116-258`; `Game/Reveal.js:46-226` |
| Overlay | Máscara em shader com padrão, linhas e ruído; não confundir com `.touch-buttons .overlay` | `upstream/sources/Game/Overlay.js:14-71`; `style/interactiveButtons.styl:16-28` |
| Menu | Máquina de estados, seleção de painel, foco, gamepad e filtros de input | `upstream/sources/Game/Menu.js:7-50,92-169,171-271` |
| Modals | Registro de modais, fechamento por botão/backdrop, fila de próximo modal, foco e tabs | `upstream/sources/Game/Modals.js:32-59,63-111,114-188` |
| Tabs | Instanciadas apenas quando o painel/modal contém `.js-tabs` | `upstream/sources/Game/Menu.js:114-118`; `Game/Modals.js:82-85` |
| Touch actions | DOM real para Interact/Unstuck e navegação; overlays permitem pointer-events apenas nos botões | `upstream/sources/index.html:66-76`; `style/interactiveButtons.styl:1-14,30-64` |

A separação acima é **inferência de componentes baseada nas classes existentes**. Os módulos JavaScript já são observados; não foi inventada uma hierarquia React equivalente como se fosse código de origem.

## Conteúdo e composição dos painéis

Os sete itens de menu são `home`, `options`, `controls`, `achievements`, `circuit`, `whispers`, `behindTheScene` (`upstream/sources/index.html:118-172`; mesmos nomes em `reference/index.html:117-171`). Cada item associa preview e conteúdo. O menu usa duas colunas de 50%; portrait muda para preview 30% e conteúdo 70% em coluna (`upstream/sources/style/menu.styl:126-148,188-196`). O conteúdo possui scroller próprio com largura `calc(100% + 20px)` para acomodar sua composição de scrollbar (`menu.styl:198-216`).

O painel Home conserva o título `Bruno's Home`, saudação `Welcome!` e a apresentação original de Bruno Simon como creative developer, com convite para explorar o mundo dirigindo (`upstream/sources/index.html:225-231`). Os painéis técnicos preservam títulos `Three.js`, `Three.js Journey`, `Devlogs`, `Source code`, `Musics` e `Some more links` (`index.html:690-720`). Não há autorização conceitual para inventar cards de projetos, depoimentos ou chamadas comerciais ausentes.

Os modais estáticos incluem `circuit-end`, `discord` e `map` (`upstream/sources/index.html:745,819,863`). Partes do DOM capturado podem conter conteúdo inserido em runtime, por exemplo conquistas e estados de recompensa. A fonte estática e o snapshot devem ser comparados como fases distintas, não tratados como prova de que todo dado dinâmico está hardcoded.

## DOM ideal para uma tradução modular

**Proposta de implementação**, não afirmação sobre o código original: manter o canvas em um componente de ciclo de vida único, com criação/descarte explícitos do runtime; manter cada superfície DOM separada e preservar seletores, estrutura e `data-name` até substituir integralmente seu controlador. Declarar labels acessíveis nos botões somente com nomes confirmados e validar foco/retorno de foco. O original usa principalmente divs e botões; a documentação não certifica semântica de diálogo, foco contido ou navegação por teclado como conformes.

Não reconstruir o mundo em CSS: fontes 3D, textura do label, física do carro, câmera e máscara TSL fazem parte da experiência. A arquitetura de referência depende de Three, Rapier, GSAP, camera-controls e Howler (`upstream/package.json:16,24,28-29,36`), não apenas de uma biblioteca de transições DOM.

## Observado, inferido e não testado

- **Observado em fonte:** estrutura de seletores, classes de estado, módulos, valores de CSS/GSAP, textos e dependências declaradas.
- **Observado em snapshot vivo:** canvas 1440×900, identificadores Three r183/WebGPU e camera-controls 3.1.2, input em intro e servidor marcado offline no momento da captura (`reference/index.html:1,61-63`).
- **Inferido:** nomes semânticos dos tokens, decomposição em componentes de apresentação e recomendações de integração/acessibilidade.
- **Não testado nesta análise:** paridade de assets e pixels, interação do carro, backend remoto, áudio, persistência, gamepad, dispositivos móveis, foco e regressão visual. Essas superfícies exigem evidência de runtime própria.
