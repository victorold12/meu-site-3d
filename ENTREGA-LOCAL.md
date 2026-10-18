# Entrega local completa — 2026-10-17

Pasta independente: `C:\Users\VTz produti\Desktop\MEU-SITE-3D`.

Para abrir, dê dois cliques em **INICIAR-SITE.bat** e mantenha a janela aberta. O inicializador usa o Node incluído em `runtime/`, procura uma porta livre entre 3077 e 3097 e abre o navegador. Ctrl+C para encerrar. Não instala pacotes nem recompila ao abrir. Instruções curtas em `COMO-ABRIR.txt`.

A pasta contém todo o estudo existente: código-fonte, checkout original com licença e histórico local, dependências, modelos, texturas, áudio, build Next, runtime 3D compilado, documentação e evidências. A pasta de origem foi preservada.

## Testes da entrega

- Copiados e comparados por SHA-256 **21.013 arquivos / 1.424.210.431 bytes** da origem: zero arquivos ausentes e zero diferenças no resultado final.
- Node Windows incluído: **v24.18.0**, hash igual ao executável instalado. Licença em `runtime/NODE-LICENSE.txt`.
- `.bat` iniciou o servidor na porta **3078**, preservando o servidor existente na 3077.
- Segunda execução detectou a instância já aberta, sem duplicar o servidor. Exit 0.
- Servidor encerrado e iniciado novamente pelo `.bat`: runtime respondeu HTTP 200.
- Cópia renderizou o mundo 3D e Home: **6/6 verificações**, zero erros JS, console, HTTP ou requests. O navegador automático foi suprimido durante os testes; sua abertura está implementada no inicializador.
- O servidor de teste desta entrega foi encerrado ao finalizar. A pasta está pronta para o usuário iniciar pelo BAT.

Evidências: `reference/entrega-integridade.json`, `reference/entrega-teste.json`, `reference/entrega-local.png`, `reference/entrega-launcher.json` e `reference/entrega-arquivos-principais.json`.

Na primeira conferência, três arquivos de cache de 404 apareceram na origem depois da cópia inicial, por causa do teste de porta ocupada. Eles também foram copiados e tiveram hashes conferidos. A primeira medição foi preservada em `reference/entrega-integridade-primeira.json`; o relatório sem sufixo contém o resultado final.

Um encerramento abrupto do segundo launcher produziu uma assertion da libuv no primeiro teste. O launcher foi corrigido para retornar naturalmente quando encontra o site aberto; o novo teste terminou sem assertion, exit 0. Nenhum código do mundo 3D foi alterado.

## Limites preservados

Nenhuma personalização de nome, cores ou funções foi aplicada. O backend privado continua desconectado. O mundo e os modelos estão locais; as fontes Google ainda usam internet. O pacote foi testado neste Windows x64 e pode ser movido como uma pasta inteira. O launcher não requer a pasta de estudo original para executar o site.

As instruções e os caminhos históricos no README/RESUME copiados referem-se ao estudo original. Para **esta entrega**, a entrada é este documento ou COMO-ABRIR.txt. Estado: TESTED pelo implementador, sem certificação independente.
