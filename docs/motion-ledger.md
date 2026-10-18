# Ledger de motion

Estado: **OBSERVADO EM FONTE**. As durações são literais do código, não medições de vídeo ou de relógio. Referências `Game/…` abaixo são relativas a `upstream/sources/`.

## Relógio: fator que altera todas as durações GSAP

`Game/Time.js:12-15,74-78` define `defaultScale = 2` e `gsap.globalTimeline.timeScale(scale)`. Sem bullet time ou outra alteração, uma duração GSAP declarada de `2` resulta aproximadamente em `1 s` de parede; isso é **inferência matemática**, não medição de runtime. `bulletTime` altera a escala em direção a `0.5`, com velocidades de progressão `3` e `0.3` (`Game/Time.js:36-70`). Transições CSS não usam esse relógio.

`Ticker.wait(n, callback)` conta **frames**, não segundos (`Game/Ticker.js:52-70`). O delta não escalado é limitado a `1/30`, enquanto `deltaScaled = delta * scale` (`Game/Ticker.js:12-17,29-35`). Preservar esta separação evita mudar câmera, shaders e física ao copiar apenas números de duração.

## Introdução e revelação

| Efeito e gatilho | Parâmetros literais | Fonte |
|---|---|---|
| Progresso do anel do loader, a cada tick | `smoothed += (target - smoothed) * delta * 10`; raio `3.5`, espessura `0.04`, RingGeometry 128 segmentos | `Game/World/Intro.js:51-61,306-314` |
| Encolher anel, entrada no reveal step 0 | escala `1 → 0`; `duration: 1.5 / speedMultiplier`; `power4.in`; debug multiplica velocidade por `4`; callback remove mesh | `Game/World/Intro.js:87-112`; `Game/Reveal.js:50-57` |
| Primeira expansão do reveal, após anel escondido | distância `0 → 3.5`; `back.out(1.7)`; `2 / speedMultiplier`; hash contendo `skip` define multiplicador `4` | `Game/Reveal.js:46-69` |
| Zoom da primeira expansão | `smoothedRatio` e `baseRatio` começam em `0.6`; `baseRatio → 0.3`; `power1.inOut`; `1.25 / speedMultiplier` | `Game/Reveal.js:72-85` |
| Mostrar instrução e áudio | `ticker.wait(1)` chama `showLabel`; tween do label escala `0 → 1`, delay `1 / speedMultiplier`, duração `2 / speedMultiplier`, `elastic.out(0.5)`; multiplicador do label depende de debug | `Game/Reveal.js:87-93`; `Game/World/Intro.js:261-278` |
| Hover da área inicial | intensidade multiplier `1 → 1.22` ao entrar e volta `1` ao sair; `0.2`; `overwrite: true`; sem easing explícito | `Game/Reveal.js:124-135` |
| Hover do áudio | intensidade `1 → 1.5 → 1`; `0.3`; `overwrite: true`; sem easing explícito | `Game/World/Intro.js:236-250` |
| Clique / teclado / gamepad inicia step 1 | área de interseção esférica de raio `3.5`; ação `introStart` aceita Cross/Enter/ArrowUp/ArrowDown/W/D; remove listeners após início | `Game/Reveal.js:99-145` |
| Expansão final | distância `→30`; `back.in(1.3)`; `2 / speedMultiplier`; conclusão fixa `99999` | `Game/Reveal.js:149-168` |
| Sair com label | escala `1 → 0`; `0.3 / speedMultiplier`; `power2.in`; remove texto, áudio e interseção | `Game/World/Intro.js:281-303` |
| Abertura final da câmera | zoom `baseRatio → 0`; `back.in(1.5)`; `1.75 / speedMultiplier`; conclusão dispara step 2 | `Game/Reveal.js:177-195` |
| Folhagem durante abertura | `seeThroughMultiplier → 1`; `power1.inOut`; `2 / speedMultiplier` | `Game/Reveal.js:197-208` |
| Encerrar intro | recupera pontos interativos, destrói grid/intro, move overlay ao topo, inicia servidor e `menu.preopen()` | `Game/Reveal.js:211-226` |

Não confundir o `speedMultiplier` de `skip` em `Reveal` com o de debug em `Intro`: eles são calculados por condições distintas. Não foi atribuída curva inventada aos tweens que omitem `ease`; o default efetivo depende da configuração GSAP.

## Overlay de transição da cena

| Operação | Parâmetros | Fonte |
|---|---|---|
| `show(callback)` | mesh visível; `inverted=0`; progress `→1`; `power1.inOut`; duração `2`; som Swoosh 02 | `Game/Overlay.js:99-104,114-123` |
| `hide(callback)` | `inverted=1`; progress `→0`; `power1.inOut`; duração `4`; som Swoosh 05; conclusão esconde mesh | `Game/Overlay.js:106-110,126-136` |
| Composição do efeito | pattern `200 × DPR`, stroke `10`, amplitude diagonal `0.5`; padrão alfa + linhas diagonais + gradiente com ruído; descarte em shader | `Game/Overlay.js:14-64` |

Trata-se de máscara Three TSL na cena (`renderOrder=99`), não de `clip-path` CSS (`Game/Overlay.js:66-71`). Trocar por fade liso altera o efeito.

## Câmera e movimento contínuo

| Sistema | Parâmetros | Fonte |
|---|---|---|
| Câmera padrão | perspectiva `25°`, near `0.1`, far `200`; phi `π × 0.27` ou `π × 0.31` em quality 0; theta `π × 0.25`; raio `15…30`; compensação aspect `9` | `Game/View.js:332-344,392-398` |
| Focus e zoom | magnet multiplier `0.25`; easing de foco `remap(easing,0,1,1,delta*10)` e lerp; zoom lerp com `delta*10` | `Game/View.js:120-129,658-681,696-707` |
| Sensibilidade zoom | `0.05`; clamp `[0,1]`; pinch delta multiplicado por `0.005` | `Game/View.js:284-304,612-614` |
| Câmera livre | `smoothTime=0.075`, `draggingSmoothTime=0.075`, `dollySpeed=0.2` | `Game/View.js:414-419` |
| Cinematic start | progress `→1`, DOF strength `→0`, duração `1.5`, `power2.inOut` | `Game/View.js:436-451` |
| Cinematic end | progress `→0` em `1`; DOF strength `→1.5` em `1.5`; `power2.inOut` | `Game/View.js:454-458` |
| Roll | damping `4`, pullStrength `100`, kickStrength `1`; integração com `deltaScaled`, kick com sinal aleatório | `Game/View.js:358-370,721-725` |
| Linhas de velocidade | strength suavizada por lerp `delta*2`; oscilação usa elapsed escalado e speed `12` | `Game/View.js:462-469,541-542,783-787` |

Essas interpolações por frame não são curvas CSS nem variantes Framer Motion. Copiar o runtime preserva sua integração; reimplementar exige preservar unidade de tempo e ordem de atualização.

## Menu e modais DOM

As transições abaixo são CSS com `transition-timing-function` não especificada nos trechos: portanto usam o valor inicial CSS `ease`, equivalente a `cubic-bezier(.25,.1,.25,1)` caso nenhuma regra externa o sobrescreva. Esta equivalência é **interpretação do contrato CSS**; não houve medição da curva no navegador.

| Efeito | Valores literais | Fonte |
|---|---|---|
| Menu e modais, entrar/sair | opacity `0 ↔ 1`; `0.3s`; `is-displayed` controla display, `is-visible` controla opacity | `upstream/sources/style/menu.styl:94-106`; `style/modals.styl:2-16` |
| Preview de menu | opacity `0.3s`; saída com delay `0.3s`, entrada delay `0` | `upstream/sources/style/menu.styl:169-183` |
| Conteúdo de menu | opacity `0.3s`; saída delay `0`; entrada delay `0.1s`; pointer-events segue visibilidade | `upstream/sources/style/menu.styl:198-216` |
| Hover gatilho | translateX `-4px`, transição `0.15s` com delay `0.15s`; filtros de input empurram para `100%`, delay `0` | `upstream/sources/style/menu.styl:22-48` |
| Hover itens / fechar | translateY `-4px`; transform e borda/opacity `0.15s`; borda opacity `0.35 → 0.8` | `upstream/sources/style/menu.styl:266-303,342-371` |

`Menu.open()` registra item ativo, preview e conteúdo, limpa filtros de input para `menu`, adiciona `is-displayed` e espera **dois requestAnimationFrame** antes de `is-visible` (`Game/Menu.js:171-253`). A máquina tem OPEN/OPENING/CLOSED/CLOSING; `transitionend` conclui a mudança e remove display ao fechar (`Game/Menu.js:7-50,256-271`).

`Modals.open()` também usa dois frames e filtro `modal`; resize das tabs e foco acontecem no segundo frame (`Game/Modals.js:114-169`). Se outro modal for solicitado, ele fica em `pending`, o atual fecha e o próximo abre após `transitionend` (`Game/Modals.js:32-59,121-134`). Nenhum desses frames equivale a delay fixo de 16ms.

## Ordem de execução e limites da análise

`Rendering.setRenderer()` cria `WebGPURenderer` e conecta `setAnimationLoop` a `ticker.update(elapsed)` (`Game/Rendering.js:38-71`). O ticker atualiza relógios, espera frames e emite `tick` (`Game/Ticker.js:29-65`). Listeners têm prioridade numérica: Time `0`, View `7`, Intro `8`, Reveal `10`, render `998` (`Game/Time.js:19-22`; `Game/View.js:66-69`; `Game/World/Intro.js:19-20`; `Game/Reveal.js:42-43`; `Game/Rendering.js:27-30`; despacho em `Game/Events.js:8-19,50-59`).

**NÃO TESTADO nesta faixa documental:** FPS, áudio, input, tempo real de cada transição, renderização móvel, diferenças entre backends WebGPU/WebGL e comparação de pixels. O HTML vivo salvo identifica o backend da captura (`reference/index.html:63`), mas isso não substitui validação interativa.
