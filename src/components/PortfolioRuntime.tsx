'use client';

/**
 * Integração local, sem iframe remoto, screenshot ou reconstituição CSS do mundo.
 * O documento filho executa os módulos originais (MIT), compilados por Vite.
 * A fronteira de documento conserva os seletores html.input-filter-*, eventos,
 * unidades rem e transitions do autor, sem conflitos com hydration/reset do host.
 * GSAP permanece dentro do runtime: duplicar timelines aqui mudaria o motion.
 */
export function PortfolioRuntime() {
  return <>
    <iframe
      className="portfolio-runtime"
      title="Portfólio 3D interativo de Victor Hugo"
      src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/world/index.html`}
      allow="autoplay; fullscreen; gamepad"
      allowFullScreen
      onLoad={(event) => event.currentTarget.contentWindow?.focus()}
    />
    <noscript><p className="runtime-fallback">Este portfólio 3D precisa de JavaScript e WebGL2 ou WebGPU.</p></noscript>
  </>;
}
