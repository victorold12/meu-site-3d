# Portfólio 3D — Victor Hugo

Portfólio interativo de Victor Hugo, publicado em https://victorold12.github.io/meu-site-3d/. O mundo 3D usa o runtime aberto Three.js/Rapier/GSAP/Howler, originalmente criado por Bruno Simon e mantido com os créditos e a licença MIT. Os projetos, o letreiro e os textos foram personalizados para Victor Hugo.

**A abordagem é integração do código aberto original, não uma reescrita independente do motor.** Ela preserva as geometrias, física, shaders TSL, câmeras, áudio, navegação e controles. O objetivo deste estudo é permitir ler, modificar e reconstruir esses padrões com evidência de origem. O backend privado do autor permanece desconectado.

## GitHub Pages

Publicado a partir de `D:\MEU-SITE-3D`.
Site: https://victorold12.github.io/meu-site-3d/

O workflow `.github/workflows/pages.yml` publica os pushes em `main`, recuperando
o runtime MIT no commit fixado acima. `npm run build:pages` gera `out/`, incluindo
modelos, texturas, áudio e a licença do runtime em `world/license.md`.
Dependências, checkout upstream, Node portátil e capturas ficam fora do repositório.
Após um build de Pages, `npm run build` restaura o build para execução local.

## Abrir e executar

Preview: **http://127.0.0.1:3077/**. O servidor usa apenas loopback.

```powershell
cd 'D:\MEU-SITE-3D'
# Instalações já realizadas nesta entrega; numa cópia nova:
.\scripts\bootstrap.ps1
npm.cmd run extract
npm.cmd run typecheck
npm.cmd run build
npm.cmd start
```

A extração e o diff usam Python com `requirements-study.txt`. Para esses comandos em outra máquina, instale essas dependências em um ambiente virtual; elas não são necessárias para abrir o runtime já compilado.

O build gera `public/world/` a partir de `upstream/sources/` e `upstream/static/`. `npm run dev` também recompila esse mundo antes de iniciar o Next; alterações posteriores no runtime exigem `npm run build:world` e reload. Dependências dos dois projetos têm lockfiles. Node usado nesta execução: 24.18.0.

Não instale plugins nativos de compressão para executar o estudo: `npm ci --ignore-scripts --legacy-peer-deps` no upstream é suficiente para compilar os assets já fornecidos. Os avisos de fontes/caminhos relativos no Vite são do CSS original; a disponibilidade real é avaliada no teste do navegador.

## Documentação solicitada

- [Tokens, tipografia, spacing, responsividade e bibliotecas](docs/design-tokens.md).
- [Componentes, DOM, estados e ordem do game loop](docs/component-architecture.md).
- [Motion: parâmetros literais, curvas, durações e gatilhos](docs/motion-ledger.md).
- [Resultados, pixels e limites](docs/validation.md).
- [Versões efetivas dos pacotes](reference/runtime-versions.json).

As referências de arquivo/linha nesses documentos apontam ao checkout fixado em `41046b57eeed8d156d9c3fd7fa259900baef7816`. O CSS compilado local é idêntico byte a byte ao CSS capturado em produção: SHA-256 `6ab8f839c66e161a18c4ab64a709456fa8f0967d005ec695e11853a97ecefe8c`.

## Código e fronteiras dos componentes

```text
src/app/layout.tsx                  metadata, ícones e noindex do documento host
src/app/page.tsx                    composição da home
src/components/PortfolioRuntime.tsx documento local independente e foco de input
src/app/globals.css                 somente viewport/fundo do host
src/generated/home.ts               copy, seções e SVGs extraídos do DOM vivo
upstream/sources/index.html         DOM original completo, copy e data-*
upstream/sources/style/*.styl       CSS original modular e breakpoints
upstream/sources/Game/Game.js       composição do motor
upstream/sources/Game/Menu.js       estado e transições de navegação
upstream/sources/Game/Modals.js     troca de modal, foco e pendências
upstream/sources/Game/Reveal.js     sequência de abertura e shaders
upstream/sources/Game/World/Intro.js loader e labels por dispositivo
upstream/sources/Game/View.js       câmera, amortecimento e modo cinematic
upstream/sources/Game/Inputs/       teclado, toque e gamepad
upstream/sources/Game/Physics/      física Rapier e veículo
upstream/sources/Game/World/Areas/  áreas e conteúdo do mundo
scripts/build-world.mjs             integração Vite → public/world
scripts/extract-study.py            extração rastreável de copy/tokens/motion
scripts/verify-browser.mjs          cenários reais de teclado/toque e screenshots
```

O iframe aponta para `/world/index.html` no **mesmo servidor local**. Sua fronteira de documento conserva seletores globais `html.input-filter-*`, root font-size, DOM imperativo e listeners do autor. Reparentear o DOM em React ou carregar Tailwind Preflight sobre ele alteraria a cascata e a experiência. A animação usa **GSAP 3.12.5**; não se adicionou uma segunda biblioteca de motion.

As durações estão explicadas nos comentários originais e no ledger. Atenção ao detalhe central: GSAP usa `globalTimeline.timeScale(2)` por padrão, enquanto fades CSS de `0.3s` mantêm 300 ms reais. `Ticker.wait(1)` espera um frame. Câmera, vento, veículo e shaders são atualizados em ordem explícita; não dependem de scroll de uma landing page.

## Alterações de integração

`upstream/` permanece sem alterações em arquivos rastreados. O build aplica apenas ao documento gerado: remove Google Analytics, adiciona `noindex`, prefixa URLs absolutas de assets com `/world/` e ajusta os ícones do manifest ao mesmo prefixo. O host também emite `X-Robots-Tag`.

`VITE_SERVER_URL` fica vazio. `VITE_COMPRESSED=1` usa GLBs/KTXs comprimidos do próprio projeto. `VITE_GAME_PUBLIC=1` expõe a instância apenas neste estudo local para observar estado/posição nos testes. Música habilitada conserva o desbloqueio de áudio após gesto. O build não fixa ciclos naturais, estados aleatórios ou qualidade a valores artificiais.

## Evidências REA

| Operação | Evidência / arquivo | Cobertura |
|---|---|---|
| `capture_browser_scenario` original 1440×900 | `ev_4cd267cf4e1d72825a0850219deccc782ffa667b23bbb76bbcc22b35e945a070`; `reference/capture-desktop.json` | DOM e screenshot após 8 s; rede atingiu orçamento, não é inventário completo |
| `export_web_scripts` | `ev_8b4517bc361284793697d137d032b65b87ed8c2bb791012d87046f0e531d26c8`; `reference/exported-scripts/manifest.json` | bundle >64 KiB indisponível no corpo retido; baixado separadamente como dado |
| `analyze_javascript_application`, summary | parent `ev_4638d05080920ff265b629317244a3b4761cdb28b400f51fddc143d865b5c811` | análise inerte do bundle; grafo parcial por orçamento, não prova execução |
| Extração da fonte / mineração | `reference/css-inventory.json`, `reference/bundle-motion-excerpts.json` | cores/media queries/transitions e offsets de parâmetros no bundle |
| `capture_browser_scenario` local 1440×900 | `ev_3380c15a1edd3795b0d251d96603212cf171e6bbfa32761a61f000ec3c0598eb`; `reference/capture-local-desktop.json` | mesmo viewport e espera de 8 s; sem erros JS; rede com cobertura parcial |
| Verificação de interação e pixels | relatório `docs/validation.md` | separa captura REA, testes de interação e comparação por região |

O bundle baixado em `reference/bundle/` **não é executado pelo estudo**. O código executado é a compilação dos módulos auditáveis no checkout oficial, com seu lockfile. `reference/network-urls.txt` é uma lista parcial da janela de captura, incluindo CSS, JS, GLB, KTX, fontes e imagens; ausência ali não comprova ausência no app.

## Observado × Inferido × Não reconstruído

**Observado:** DOM vivo, copy original, CSS de produção, pacote/lockfile e módulos oficiais, valores de motion e shaders. Resultados de execução específicos ficam em `docs/validation.md`.

**Inferido:** nomes semânticos usados para catalogar cores/spacing; significado arquitetural dos módulos; conversão de duração GSAP em tempo de parede. O original não declara escala global de 8 pontos nem `--fluid-*`. Não se inventou uma.

**Não reconstruído:** servidor privado, score remoto, mensagens de visitantes e presença online. O estado `Server Offline` é real, e difere do site quando este está conectado. Não foram reimplementados de forma independente o motor 3D nem seus assets: usa-se a implementação MIT original.

**Não certificado pixel-perfect para o mundo todo:** ciclos de dia/ano, física, vegetação, ruído e tempo fazem a cena variar entre capturas. Igualdade de CSS e de painéis DOM não prova igualdade de toda a cena, de todos os estados ou de todo hardware. Gamepad físico, desempenho em celular real, todas as áreas/easter eggs e áudio ouvido por pessoa permanecem fora dos testes automatizados descritos.

## Diretrizes da skill aplicadas

| Diretriz | Aplicação |
|---|---|
| HTML vivo como autoridade | DOM, screenshot, rede e CSS preservados em `reference/` |
| Números de fonte observada | docs com arquivo/linha; inventário CSS e trechos do bundle |
| Conteúdo sem redigitar | extração BeautifulSoup → `src/generated/home.ts`; runtime conserva HTML original |
| Breakpoints e cascata | Stylus compilado sem mudanças; CSS com hash idêntico |
| WebGL não simulado em CSS | runtime real Three r183, Rapier, modelos e texturas locais |
| Sem máscaras aproximadas | shaders TSL, SVGs e sprites originais mantidos |
| Templates adaptados ao alvo | não se carregam componentes de Lando/Lenis/Rive ausentes neste site |
| Moderno sem mudar motion | Next 15/React 19 como host e GSAP original no runtime |
| Site público sem indexação | metadata + header + documento filho |
| Verificação por região | tabela de pixels, logs e capturas, sem generalizar regiões dinâmicas |

## Licença e atribuição

Código e assets necessários ao funcionamento vêm de [brunosimon/folio-2025](https://github.com/brunosimon/folio-2025), copyright © 2025 Bruno Simon, conforme [license.md](upstream/license.md). O runtime original continua atribuído ao autor; este site é a versão personalizada de Victor Hugo e não o site oficial de Bruno Simon. As fontes conservam seus avisos e condições próprios.
