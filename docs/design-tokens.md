# Tokens de design extraídos

Estado: **OBSERVADO EM FONTE**. A análise abaixo descreve o código em `upstream/`, com conferência estrutural do HTML vivo salvo em `reference/index.html`. Os nomes semânticos da primeira coluna são **inferidos para documentação**: o original usa valores Stylus literais, não estas variáveis CSS. Esta análise não certifica aparência, contraste ou responsividade em execução.

## Paleta da interface DOM

| Nome de documentação | Valor literal e aplicação | Evidência |
|---|---|---|
| `surface-start` / `surface-end` | `#251f2b` / `#1d1721`; gradiente radial do documento e painéis | `upstream/sources/style/general.styl:48-49`; `style/menu.styl:144,191`; `style/modals.styl:74` |
| `foreground` | `#ffffff`; menu e modais | `upstream/sources/style/menu.styl:98`; `style/modals.styl:8` |
| `action-gradient-start` / `action-gradient-end` | `#C21515` / `#46123B`; gatilho e fechar | `upstream/sources/style/menu.styl:40,357` |
| `navigation-active-surface` | `#241e2a` | `upstream/sources/style/menu.styl:276-278` |
| `accent` | `#ffceca`; ícones da navegação e input válido | `upstream/sources/style/menu.styl:314`; `style/general.styl:205-214` |
| `success` | `#d5ff95`; botão de sucesso | `upstream/sources/style/general.styl:146-147` |
| `danger` / `danger-text` | `#ff6a7c` / `#ff87a2`; botão de perigo / texto de alerta | `upstream/sources/style/general.styl:149-150,81-82` |
| `input-inactive` | `#555555`; bordas, texto e ícones de formulário | `upstream/sources/style/general.styl:197-223,232-234` |
| `border-frame` | branco com opacidade `0.35`; moldura a `3px` das bordas | `upstream/sources/style/menu.styl:150-159,292-303` |
| `button-idle` / `button-hover` | `alpha(#ffffff, 0.8)` / `alpha(#ffffff, 1)` | `upstream/sources/style/general.styl:123-124,152-154` |

O overlay da cena reutiliza `#251f2b` e `#1d1721`, mas seu gradiente é um shader com ruído e máscara, não o fundo CSS. Evidência: `upstream/sources/Game/Overlay.js:15-22,29-64`.

## Paleta dinâmica da cena

O mundo não possui uma única cor de fundo estática. Os presets de iluminação, sombra, neblina e revelação são parâmetros de renderização, distintos das cores DOM. Valores abaixo vêm de `upstream/sources/Game/Cycles/DayCycles.js:4-9`.

| Preset | Reveal / intensidade | Luz / intensidade | Sombra | Neblina A / B |
|---|---|---|---|---|
| `day` | `#5f7dff` / `12` | `#ffd2c2` / `1.2` | `#6d3fff` | `#00ffff` / `#9b89ff` |
| `dusk` | `#ff86d9` / `5.55` | `#ff8181` / `1.2` | `#4e009c` | `#3e53ff` / `#ff4ce4` |
| `night` | `#b678ff` / `10` | `#3240ff` / `3.8` | `#2f00db` | `#10266f` / `#490a42` |
| `dawn` | `#ff9d9d` / `4.85` | `#ffa882` / `1.2` | `#db004f` | `#f885ff` / `#ff7d24` |

`Reveal` nasce com `#e88eff`, espessura `0.05` e intensidade `5.5`, depois copia a cor e intensidade do ciclo em cada atualização. Portanto o valor do construtor não define a cor permanente. Evidência: `upstream/sources/Game/Reveal.js:16-20,232-235`.

## Tipografia

| Papel | Família / peso | Dimensão e comportamento | Evidência |
|---|---|---|---|
| Corpo e controles DOM | `Nunito`, sans-serif; `400` | `1rem` no texto; `font-optical-sizing: auto` | `upstream/sources/style/general.styl:20-36,70-72` |
| Título | `Amatic SC`, sans-serif; `700` | `2.5rem`; margem inferior `0.25em`, sobrescrita para `0.5em` nos conteúdos do menu | `upstream/sources/style/general.styl:63-68`; `style/menu.styl:218-219` |
| Texto pequeno | herda família | `0.8rem` | `upstream/sources/style/general.styl:78-79` |
| Ações de toque | `Amatic SC`, `700` | `64px`, reduzido a `48px` em largura ≤`520px` | `upstream/sources/style/interactiveButtons.styl:38-46` |
| Pally disponível | `Pally-Regular` 400; `Pally-Medium` 500; `Pally-Bold` 700 | arquivos WOFF2/WOFF/TTF; `font-display: swap` | `upstream/sources/style/fonts.styl:1-27` |

Nunito `400;700;900` e Amatic SC `700` são solicitadas no Google Fonts com `display=block`, enquanto Pally usa `swap` localmente. A diferença é literal, não deve ser uniformizada sem registrar alteração. Evidência: `upstream/sources/index.html:26-28`; `reference/index.html:24-26`; `upstream/sources/style/fonts.styl:7,16,25`.

O loader contém contratos `data-font` de Nunito, Amatic SC e Pally-Medium, não um título editorial visível: `upstream/sources/index.html:56-60`. Textos de introdução dentro do mundo usam planos e texturas KTX selecionadas por modo de input: `upstream/sources/Game/World/Intro.js:116-199`. Não substituir esses planos por texto DOM esperando equivalência de pixels.

## Dimensões e espaçamento

Não foi encontrada uma escala global declarada de espaçamento nos trechos examinados. O conjunto abaixo é uma **catalogação de valores observados**, não uma escala 8pt ou uma escala fluida inventada.

| Elemento | Desktop | Overrides literais | Evidência |
|---|---|---|---|
| Raiz tipográfica | `20px` | ≤520: `18px`; ≤440: `16px` | `upstream/sources/style/general.styl:48-57` |
| Botão | altura/linha `58px`, padding horizontal `16px`, raio `8px` | ≤520: `50px` / `13px`; ≤440: `45px` / `10px` | `upstream/sources/style/general.styl:114-135` |
| Texto | margem inferior `0.75em` | herda tamanho da raiz | `upstream/sources/style/general.styl:70-72` |
| Grupo horizontal | gap `10px` | ≤520: direção coluna | `upstream/sources/style/general.styl:96-103` |
| Menu, `.inner` | largura `min(1000px, calc(100% - 120px))`; altura `min(600px, calc(100% - 120px))` | portrait: largura `min(600px, calc(100% - 20px))`, altura `max(80vh, calc(100% - (44px + 10px)))`, top `22px`; ≤440: largura `calc(100vw - 10px)` | `upstream/sources/style/menu.styl:112-124` |
| Padding do conteúdo do menu | `25px 40px 40px 40px` | ≤870: `20px 30px 30px 30px`; ≤520: `15px 20px 20px 20px`; ≤440: `10px 15px 15px 15px` | `upstream/sources/style/menu.styl:221-236` |
| Padding de modal | `25px 40px 40px 40px` | ≤520: `20px 30px 30px 30px`; ≤440: `15px 20px 20px 20px` | `upstream/sources/style/modals.styl:71-80` |
| Itens da navegação | `50px × 44px`, gap `3px` | ≤520: gap `1px`; ≤440: `43px × 40px` | `upstream/sources/style/menu.styl:241-264` |

## Responsividade observada

`orientation: portrait` muda o menu de duas colunas iguais para coluna com preview de `30%` e conteúdo de `70%` (`upstream/sources/style/menu.styl:126-148,188-196`). Os breakpoints adicionais são locais: `870px` para padding do menu e `360px` para reposicionar/rotacionar o botão fechar (`menu.styl:228-229,334-340`); alturas `620px` e `540px` comprimem a tabela de controles (`controls.styl:8-15`). Não há base para aplicar os breakpoints Webflow 991/767/479 a esta referência.

A cena mede seu container e limita DPR a `2`; câmera ajusta a distância ao aspect ratio ideal `1920/1080`. Evidência: `upstream/sources/Game/Viewport.js:15-25`; `Game/View.js:22-30,705-708`. Compatibilidade e fluidez em aparelhos físicos: **NÃO TESTADAS nesta análise documental**.

## Bibliotecas observadas

O manifesto declara ranges, não versões instaladas: Three `^0.183.2`, GSAP `^3.12.5`, camera-controls `^3.1.2`, Rapier `^0.17.3`, Howler `^2.2.4`, Stylus `^0.64.0`, Vite `^7.2.4` (`upstream/package.json:16,24,28-29,35-39`). O HTML capturado identifica `three.js r183 webgpu` e camera-controls `3.1.2` (`reference/index.html:61-63`). A documentação não pressupõe Tailwind, Framer Motion ou Next.js no site de origem.

O lock fixa respectivamente Three `0.183.2`, GSAP `3.12.5`, camera-controls `3.1.2`, Rapier `0.17.3`, Howler `2.2.4`, Stylus `0.64.0` e Vite `7.2.4` (`upstream/package-lock.json:5835-5836,3656-3657,2705-2706,68-69,3755-3756,5620-5621,6053-6054`). Isso descreve a resolução versionada, sem substituir a inspeção do ambiente instalado.
