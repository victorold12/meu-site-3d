# Validação — execução local de 2026-10-16

Estado: **TESTED** pelo implementador, sem revisão independente ou aceite do proprietário. Escopo: host local + runtime oficial integrado. Não é uma certificação de todas as áreas, hardware ou estados do portfólio.

## Compilação e integridade

- `npm run typecheck` / TypeScript 5.8.3: exit **0**.
- `npm run build` / Vite 7.2.4 + Next.js 15.5.28: exit **0**. Log: `reference/build-final.log`.
- `git -C upstream diff --check`: exit **0**; `git -C upstream status --porcelain`: vazio.
- Original fixado: `41046b57eeed8d156d9c3fd7fa259900baef7816`.
- SHA-256 do CSS original e recompilado: `6ab8f839c66e161a18c4ab64a709456fa8f0967d005ec695e11853a97ecefe8c`, igualdade byte a byte.
- Versões efetivas: `reference/runtime-versions.json`. Identidade de arquivos e bytes: `reference/artifact-hashes.json`. O bundle local difere do de produção, inclusive por configurações de backend/analytics; não se afirma identidade binária dos dois JavaScripts.

Vite relata tamanho de chunk e referências de fontes/imagens que deixa relativas para resolução em execução. Os cenários finais não tiveram 404, falhas de request ou erros de console. Esses avisos de build não foram escondidos: permanecem no log.

## Cenários de navegador

Chromium **153.0.8010.12**, executável `chromium-1243/chrome-win64/chrome.exe`; DPR `1`; locale `en-US`; timezone `UTC`; reduced motion `no-preference`; contextos novos e storage vazio. Desktop `1440 × 900`; mobile emulado `390 × 844`, `isMobile` e `hasTouch`. O dispositivo físico não foi testado.

Comando: `node scripts/verify-browser.mjs`. Log final: `reference/browser-final.log`; dados individuais e `summary.json` em `reference/verification/`.

| Cenário | Verificações concluídas | Erros JS | Erros console | HTTP ≥400 | Requests falhos |
|---|---:|---:|---:|---:|---:|
| Local desktop | 7/7 | 0 | 0 | 0 | 0 |
| Original desktop | 7/7 | 0 | 0 | 0 | 0 |
| Local mobile emulado | 7/7 | 0 | 0 | 0 | 0 |
| Original mobile emulado | 7/7 | 0 | 0 | 0 | 0 |

As sete verificações de cada cenário são: iniciar mundo por gesto/tecla, abrir menu, navegar Home/Controls/Options/Behind the scene e fechar menu. São **14 verificações locais e 14 de referência**, não 28 funcionalidades distintas. Capturas `*-intro.png`, `*-world.png`, `*-menu.png` e `*-content.png` ficam na mesma pasta.

Rodada adicional: `node scripts/verify-controls.mjs`, exit **0**, **13/13 verificações**, zero erros JS. Evidência: `reference/verification/controls-checks.json` e `reference/controls-checks.log`. Cobre noindex, deslocamento físico por ArrowUp, navegação nas sete abas, troca de qualidade com restauração, alternância de mute com restauração, servidor Offline real e fechamento que restaura condução. A alternância de mute comprova estado e handler; não comprova áudio ouvido por uma pessoa.

O carro passou de `[39.52898025512695, 1.0553431510925293, 37.82522964477539]` para `[44.35266876220703, 1.0530470609664917, 38.9567985534668]` durante o input nessa rodada. Isso comprova movimento naquele cenário; não mede desempenho ou física sob todas as condições.

## Comparação de pixels

Comando reproduzível: `python scripts/pixel_diff.py`. Dados: `reference/verification/pixel-diff.json`; imagens de diferença `diff-*.png`. Conta-se qualquer canal diferente de zero para a coluna estrita; a tolerância adicional é `max(|ΔR|, |ΔG|, |ΔB|) > 24`.

| Região opaca de conteúdo | Viewport | Recorte efetivo | Pixels diferentes | Diferença estrita |
|---|---|---|---:|---:|
| Home | Desktop | 500 × 600 | 0 / 300000 | **0%** |
| Controls | Desktop | 500 × 600 | 0 / 300000 | **0%** |
| Behind the scene | Desktop | 500 × 600 | 0 / 300000 | **0%** |
| Options | Desktop | 500 × 600 | 555 / 300000 | **0.185%** |
| Home | Mobile emulado | 380 × 553 | 0 / 210140 | **0%** |
| Controls, fade concluído | Mobile emulado | 380 × 553 | 0 / 210140 | **0%** |
| Behind the scene | Mobile emulado | 380 × 553 | 0 / 210140 | **0%** |
| Options | Mobile emulado | 380 × 553 | 424 / 210140 | **0.201770%** |

Os recortes excluem somente os 20 px adicionais que `.content` possui além da largura do ancestral `.contents`, com `overflow:hidden`. Essa faixa da screenshot do elemento captura o mundo externo animado; não pertence ao painel visível. As imagens originais de elemento, incluindo essa faixa, foram preservadas. Não há resize, alinhamento pós-captura ou filtro para forçar igualdade.

As diferenças de Options estão no status do servidor: **Online** no original versus **Offline** no estudo. O backend privado não foi clonado. No desktop, a bounding box dos pixels diferentes foi `(282, 483, 342, 499)` em coordenadas do recorte, dentro do texto desse status. A diferença foi mantida no cálculo, sem máscara.

Na primeira captura de Controls mobile, a espera fixa de 400 ms coincidiu com o final de `opacity 0.3s` + delay `0.1s`: 69.214809% dos pixels diferiam estritamente, todos dentro da tolerância de 24 níveis por canal. A recaptura independente por `scripts/verify-pixel-stability.mjs` aguardou **getComputedStyle(...).opacity === '1'**, sem alterar CSS/DOM/estado de aplicação. Resultado: 0 pixels diferentes. As duas capturas e os relatórios `pixel-stability.json`, `pixel-stability-diff.json` e `pixel-stability.log` são preservados; o script de diff usa explicitamente os arquivos `*-stable-content.png` nessa linha.

Isso comprova igualdade dessas seis regiões DOM nos dois viewports. Não comprova identidade de toda a cena WebGPU, previews, navegação sobre fundo dinâmico, todos os breakpoints ou todos os estados de interação.

## REA: captura, exportação e análise

| Operação | Evidência | Cobertura / limite |
|---|---|---|
| Original, cenário 1440×900 e espera 8 s | `ev_4cd267cf4e1d72825a0850219deccc782ffa667b23bbb76bbcc22b35e945a070` | screenshot/DOM capturados; evento de rede atingiu orçamento; `equality_eligible:false` |
| Exportação de scripts | `ev_8b4517bc361284793697d137d032b65b87ed8c2bb791012d87046f0e531d26c8` | bundle >64 KiB indisponível no corpo; download inerte separado |
| Análise JS summary | parent `ev_4638d05080920ff265b629317244a3b4761cdb28b400f51fddc143d865b5c811` | grafo parcial por orçamento; fontes analisadas sem executar bootstrap |
| Local, cenário 1440×900 e espera 8 s | `ev_3380c15a1edd3795b0d251d96603212cf171e6bbfa32761a61f000ec3c0598eb` | screenshot/DOM capturados; zero erros JS/console retidos; rede parcial; `equality_eligible:false` |

REA executou apenas os waits declarados nessas duas capturas. Interações e comparações adicionais foram executadas com Playwright nos scripts separados, não atribuídas indevidamente ao REA. `reference/desktop.png` e `reference/rea-local-desktop.png` incluem a introdução em instantes dependentes do carregamento; não foram usadas para afirmar igualdade global. O bundle completo de Evidence está em `reference/rea-analysis-evidence.json`; capturas individuais menores também foram salvas.

## Falhas iniciais e correções

1. O ambiente de execução anterior rejeitou criação de processos; após a mudança de permissões, shell funcionou. Não foram necessárias alterações de configuração de sistema.
2. Toque instantâneo por `locator.tap()` não iniciou nem o original nem o clone na primeira rodada. `Inputs/Pointer.js` amostra `upcomingDown` por frame. O cenário final envia eventos reais de toque via CDP com down de 500 ms e release; ambos passaram. O runtime não foi modificado para fazer o teste passar. Logs iniciais: `reference/browser-mobile.log`.
3. Primeira rodada local teve 404 de recursos de ícones; integração passou a fornecer favicon do host e prefixar caminhos do manifest. Rodada final tem zero erros de console/HTTP. Log inicial: `reference/browser-desktop.log`.
4. Controls mobile requereu sincronizar a captura com opacity final, conforme descrito acima.

## Fora da comprovação

Não reconstruído/testado: servidor privado, ranking remoto, postagem de mensagens, multiplayer/presença, gamepad físico, áudio subjetivo, desempenho de aparelho real, todas as áreas/segredos e igualdade global do WebGPU. O código e assets do mundo foram integrados do repositório oficial, não reimplementados de forma independente. Qualidade, ciclos dia/ano, sombras, física, partículas e ruído continuam dinâmicos. Nenhum screenshot foi inserido no lugar do mundo.
