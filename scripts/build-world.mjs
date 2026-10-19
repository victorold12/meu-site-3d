import { build, mergeConfig } from '../upstream/node_modules/vite/dist/node/index.js';
import originalConfig from '../upstream/vite.config.js';
import { fileURLToPath } from 'node:url';
import { writeFile, mkdir, copyFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const upstream = path.join(root, 'upstream');
const worldBase = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/world/`;
// Valores do ambiente de estudo. Sem conexão ao backend ou analytics do autor.
// Não fixe ciclo diário/anual: eles fazem parte do runtime e são descritos no README.
Object.assign(process.env, {
  VITE_SERVER_URL: '', VITE_ANALYTICS_TAG: '', VITE_COMPRESSED: '1',
  VITE_GAME_PUBLIC: '1', VITE_LOG: '', VITE_MUSIC: '1', VITE_WHISPERS_COUNT: '30',
});
const config = mergeConfig(originalConfig, {
  configFile: false,
  root: path.join(upstream, 'sources'), envDir: upstream,
  publicDir: path.join(upstream, 'static'), base: worldBase,
  build: { outDir: path.join(root, 'public/world'), emptyOutDir: true },
});
// O plugin de restart é útil apenas no Vite dev. Mantêm-se WASM, TLA e polyfills.
config.plugins = config.plugins.filter(plugin => plugin?.name !== 'vite-plugin-restart');
const projects = [
  { title: 'VTz Life', titleSmall: ['VTz', 'Life'], url: 'https://github.com/victorold12/vtz-life', attributes: { role: 'Criador e desenvolvedor', at: 'Projeto pessoal' }, distinctions: [], images: ['vtz-life.png'] },
  { title: 'VTz LLM', titleSmall: ['VTz', 'LLM'], url: 'https://github.com/victorold12/VTz-painel', attributes: { role: 'Criador e desenvolvedor', at: 'Chat com IA' }, distinctions: [], images: ['vtz-llm.png', 'vtz-llm-backend.png'] },
  { title: 'Site Profe', titleSmall: ['Site', 'Profe'], url: 'https://github.com/victorold12/site-profe', attributes: { role: 'Criador e desenvolvedor', at: 'Projeto web' }, distinctions: [], images: ['site-profe.png'] },
];
config.plugins.push({
  name: 'victor-hugo-portfolio',
  transform(code, id) {
    if (id.endsWith('/data/projects.js'))
      return `export default ${JSON.stringify(projects)};`;
    if (id.endsWith('/data/social.js'))
      return "export default [{ name: 'GitHub', url: 'https://github.com/victorold12', align: 'right' }];";
    if (id.endsWith('/Game/World/Areas/ProjectsArea.js')) {
      const patched = code.replace("getLoader('textureKtx')", "getLoader(key.endsWith('.png') ? 'texture' : 'textureKtx')");
      if (patched === code) throw new Error('ProjectsArea image loader anchor not found');
      return patched;
    }
    if (id.endsWith('/Game/World/Areas/LandingArea.js')) {
      const withImports = code.replace("import * as THREE from 'three/webgpu'", "import * as THREE from 'three/webgpu'\nimport { TextGeometry } from 'three/addons/geometries/TextGeometry.js'\nimport { FontLoader } from 'three/addons/loaders/FontLoader.js'\nimport helvetikerBold from 'three/examples/fonts/helvetiker_bold.typeface.json'");
      const start = withImports.indexOf('    setLetters()');
      const end = withImports.indexOf('    setKiosk()', start);
      if (start < 0 || end < 0) throw new Error('LandingArea lettering anchor not found');
      const patched = withImports.slice(0, start) + `    setLetters()
    {
        const references = this.references.items.get('letters')
        const textOrder = [...references].reverse()
        const letters = [...'VICTORHUGO']
        if(textOrder.length !== letters.length)
            throw new Error('Expected ten physical letters for VICTOR HUGO')

        const positions = textOrder.map(reference => reference.userData.object.physical.body.translation())
        const direction = new THREE.Vector3().subVectors(positions.at(-1), positions[0]).setY(0)
        const originalSpan = direction.length()
        direction.normalize()
        const center = positions.reduce((sum, position) => sum.add(new THREE.Vector3(position.x, position.y, position.z)), new THREE.Vector3()).multiplyScalar(1 / positions.length)
        const font = new FontLoader().parse(helvetikerBold)
        const glyphs = letters.map(letter => {
            const geometry = new TextGeometry(letter, {
                font, size: 1.8, depth: 0.46, curveSegments: 6,
                bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.025, bevelSegments: 2
            })
            geometry.computeBoundingBox()
            const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x
            geometry.center()
            return { geometry, width }
        })

        const spacing = 0.12
        const wordSpacing = 0.72
        const textWidth = glyphs.reduce((sum, glyph) => sum + glyph.width, 0) + spacing * 8 + wordSpacing
        const scale = Math.min(1, originalSpan / textWidth)
        let cursor = -textWidth * scale / 2

        for(let index = 0; index < glyphs.length; index++)
        {
            if(index > 0)
                cursor += (index === 6 ? wordSpacing : spacing) * scale

            const { geometry, width } = glyphs[index]
            geometry.scale(scale, scale, scale)
            const position = center.clone().addScaledVector(direction, cursor + width * scale / 2)
            const object = textOrder[index].userData.object
            const meshes = []
            object.visual.object3D.traverse(child => {
                if(child.isMesh)
                    meshes.push(child)
            })
            if(meshes.length !== 1)
                throw new Error('Expected one original mesh per physical letter')
            meshes[0].geometry.dispose()
            meshes[0].geometry = geometry
            object.physical.body.setTranslation(position, false)
            object.physical.initialState.position.x = position.x
            object.physical.initialState.position.y = position.y
            object.physical.initialState.position.z = position.z
            object.visual.object3D.position.copy(position)
            cursor += width * scale
        }

        for(const reference of references)
        {
            const physical = reference.userData.object.physical
            physical.colliders[0].setActiveEvents(this.game.RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
            physical.colliders[0].setContactForceEventThreshold(5)
            physical.onCollision = (force, position) =>
            {
                this.game.audio.groups.get('hitBrick').playRandomNext(force, position)
            }
        }
    }

    ` + withImports.slice(end);
      return patched;
    }
    return null;
  },
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      return html
        .replace(/<!-- Analytics -->[\s\S]*?<\/script>\s*<script>[\s\S]*?<\/script>/, '')
        .replace('<head>', '<head>\n<meta name="robots" content="noindex,nofollow,noarchive">')
        .replace('<html lang="en">', '<html lang="pt-BR">')
        .replace('<title>Bruno\'s</title>', '<title>Victor Hugo | Portfólio 3D</title>')
        .replaceAll('Bruno Simon\'s creative portfolio', 'Portfólio 3D de Victor Hugo')
        .replaceAll('content="Bruno Simon"', 'content="Victor Hugo"')
        .replaceAll('Bruno\'s Home', 'Início de Victor Hugo')
        .replaceAll('Welcome!', 'Boas-vindas!')
        .replaceAll('My name is <strong>Bruno Simon</strong>, and I\'m a <strong>creative developer</strong> (mostly for the web).', 'Eu sou <strong>Victor Hugo</strong>, criador e desenvolvedor de projetos digitais.')
        .replaceAll('This is my portfolio. Please drive around to learn more about me and discover the many secrets of this world.', 'Este é meu portfólio. Dirija pelo cenário para conhecer meus projetos e explorar este mundo.')
        .replaceAll('And don\'t break anything!', 'E cuidado para não quebrar nada!')
        .replaceAll('Options', 'Opções')
        .replaceAll('Toggles sound', 'Ativar ou desativar o som')
        .replaceAll('Toggles some effects', 'Ativar ou desativar alguns efeitos')
        .replaceAll('Achievements', 'Conquistas')
        .replaceAll('Unlock at', 'Desbloqueia em')
        .replaceAll('Server currently offline. Scores can\'t be saved.', 'Servidor indisponível. As pontuações não podem ser salvas.')
        .replaceAll('Server currently offline', 'Servidor indisponível')
        .replaceAll('Controls', 'Controles')
        .replaceAll('Mouse Keyboard', 'Mouse e teclado')
        .replaceAll('Select', 'Selecionar')
        .replaceAll('Musics', 'Músicas')
        .replaceAll('Contact me directly.', 'Entre em contato comigo.')
        .replaceAll('Private messages', 'Fale comigo')
        .replaceAll('Start chating', 'Abrir meu GitHub')
        .replaceAll('<div class="title"><img src="ui/discord.svg" loading="lazy"> Discord</div>', '<div class="title">Meus projetos</div>')
        .replaceAll('Interact', 'Interagir')
        .replaceAll('Unstuck', 'Destravar')
        .replaceAll('Behind the scene', 'Por trás do projeto')
        .replaceAll('Move around', 'Dirigir')
        .replaceAll('Boost', 'Acelerar')
        .replaceAll('Brake', 'Frear')
        .replaceAll('Jump', 'Pular')
        .replaceAll('Map', 'Mapa')
        .replaceAll('Mute', 'Silenciar')
        .replaceAll('Post a whisper', 'Enviar mensagem')
        .replaceAll('Respawn', 'Voltar ao ponto inicial')
        .replaceAll('Move camera', 'Mover a câmera')
        .replaceAll('Honk', 'Buzinar')
        .replaceAll('Mobile Tablet', 'Celular e tablet')
        .replaceAll('Move the car', 'Mover o carro')
        .replaceAll('Turn wheels', 'Virar as rodas')
        .replaceAll('Zoom in/out', 'Aproximar ou afastar')
        .replaceAll('Reset', 'Reiniciar')
        .replaceAll('Pause', 'Pausar')
        .replaceAll('Rewards', 'Recompensas')
        .replaceAll('Circuit', 'Pista')
        .replaceAll('No score yet today', 'Ainda não há pontuação hoje')
        .replaceAll('Leave a whisper', 'Deixe uma mensagem')
        .replaceAll('Whispers are messages left by visitors.', 'As mensagens são recados deixados por visitantes.')
        .replaceAll('Public server', 'Comunidade')
        .replaceAll('Come hang out with the community', 'Conheça meus projetos e acompanhe as novidades')
        .replaceAll('Join server', 'Ver meu GitHub')
        .replaceAll('https://discord.com/channels/769928116701233152/1445064878384480288', 'https://github.com/victorold12')
        .replaceAll('https://discord.com/users/202907325722263553', 'https://github.com/victorold12')
        .replaceAll('hereâ€™s everything you need to know.', 'aqui estão os detalhes sobre as tecnologias e os créditos deste projeto.')
        .replaceAll('Thank you for visiting my portfolio!', 'Obrigado por visitar meu portfólio!')
        .replaceAll('The code is available on', 'O código original está disponível no')
        .replaceAll(' under <a href="https://choosealicense.com/licenses/mit/"', ' sob a licença <a href="https://choosealicense.com/licenses/mit/"')
        .replaceAll('Some more links', 'Mais tecnologias')
        .replaceAll('Physics library', 'Física')
        .replaceAll('Audio library', 'Áudio')
        .replaceAll('Fonts', 'Fontes')
        .replaceAll('everything you need to know.', 'detalhes sobre as tecnologias e os créditos deste projeto.')
        .replaceAll('It was created by', 'Foi criado por')
        .replaceAll('followed by hundreds of awesome developers, one of which being', 'com contribuições de centenas de desenvolvedores, incluindo')
        .replaceAll('who added', 'que criou')
        .replaceAll('enabling the use of both WebGL and WebGPU, making this portfolio possible.', 'permitindo o uso de WebGL e WebGPU neste portfólio.')
        .replaceAll('If you want to learn Three.js, I got you covered with this', 'Quer aprender Three.js? Recomendo este')
        .replaceAll('huge course', 'curso completo')
        .replaceAll('It contains everything you need to start building awesome stuff with Three.js (and much more).', 'Ele ensina o necessário para começar a criar projetos com Three.js e muito mais.')
        .replaceAll('I’ve been making devlogs since the very start of this portfolio and you can find them all on my', 'Os registros de desenvolvimento deste portfólio estão no meu')
        .replaceAll('Youtube channel', 'canal do YouTube')
        .replaceAll('Even the Blender files are there, so have fun!', 'O repositório também inclui os arquivos do Blender.')
        .replaceAll('For security reasons, I’m not sharing the server code, but the portfolio works without it.', 'O portfólio funciona sem o servidor privado do autor original.')
        .replaceAll('The music you hear was made especially for this portfolio by the awesome Kounine', 'As músicas deste portfólio foram criadas por Kounine')
        .replaceAll('They are now under', 'Elas estão sob a licença')
        .replaceAll('meaning you can do whatever you want with them!', 'que permite reutilizá-las.')
        .replaceAll('Download them', 'Baixe as músicas')
        .replaceAll('Private messages', 'Fale comigo')
        .replaceAll('Entre em contato comigo.<span class="optional"><br />I have to warn you, I try to answer everyone, but it might take a while.</span>', 'Visite meu perfil no GitHub para conhecer outros projetos.')
        .replaceAll('— Bruno', 'Projeto original de Bruno Simon · Personalizado por Victor Hugo')
        .replace(/(href|src)="\/(?!\/)/g, `$1="${worldBase}`);
    },
  },
});
await build(config);
// Web manifests resolvem seus ícones independentemente do HTML: preserve o prefixo local.
const manifestPath = path.join(root, 'public/world/favicons/site.webmanifest');
await writeFile(manifestPath, (await readFile(manifestPath, 'utf8')).replaceAll('"/favicons/', `"${worldBase}favicons/`));
await copyFile(path.join(upstream, 'license.md'), path.join(root, 'public/world/license.md'));
// Fallback solicitado por navegadores mesmo quando o documento filho tem favicon.
await copyFile(path.join(upstream, 'static/favicons/favicon.ico'), path.join(root, 'public/favicon.ico'));
for (const image of ['site-profe.png', 'vtz-llm.png', 'vtz-llm-backend.png', 'vtz-life.png']) {
  const target = path.join(root, 'public/world/projects/images', image);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(root, 'assets/projects', image), target);
}
await mkdir(path.join(root, 'docs'), { recursive: true });
await writeFile(path.join(root, 'docs/build-info.json'), JSON.stringify({
  builtAt: new Date().toISOString(),
  upstreamCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: upstream, encoding: 'utf8' }).trim(),
  node: process.version, runtime: 'Three.js + Rapier + GSAP + Howler (upstream lockfile)',
  localOnly: process.env.GITHUB_PAGES !== 'true', basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  analytics: false, server: false,
}, null, 2) + '\n');
