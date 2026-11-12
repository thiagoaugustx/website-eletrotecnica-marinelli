/**
 * Revisão Eletrotécnica Marinelli — patch local e reversível
 * Uso: node aplicar-alteracoes-marinelli.mjs /caminho/do/repositorio
 * Não publica arquivos nem altera o GitHub. Cria backup antes de editar.
 * Compatível com Node.js 18+ (somente módulos nativos).
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || process.cwd());
const backupDir = path.join(root, '.marinelli-backup');
const files = fs.readdirSync(root).filter(name => name.endsWith('.html'));
if (!files.includes('index.html') || !fs.existsSync(path.join(root, 'style.css'))) {
  console.error('Diretório inválido: execute este arquivo na pasta do projeto (onde estão index.html e style.css).');
  process.exit(1);
}
fs.mkdirSync(backupDir, { recursive: true });

const changed = [];
function update(name, transform) {
  const target = path.join(root, name);
  if (!fs.existsSync(target)) return;
  const before = fs.readFileSync(target, 'utf8');
  const after = transform(before);
  if (after === before) return;
  const backup = path.join(backupDir, name);
  if (!fs.existsSync(backup)) fs.copyFileSync(target, backup);
  fs.writeFileSync(target, after, 'utf8');
  changed.push(name);
}

// Ligações internas do site publicado em subpasta no GitHub Pages.
const footerHrefs = new Map([
  ['#inicio', 'index.html'],
  ['#sobre', 'index.html#sobre'],
  ['#qualidade', 'qualidade.html'],
  ['#trabalhe-conosco', 'trabalhe-conosco.html'],
  ['#orcamento', 'contato.html'],
  ['#contato', 'contato.html'],
]);

function fixNavbar(markup) {
  let s = markup;
  // O item Qualidade tem um único submenu: melhor transformá-lo em link direto.
  s = s.replace(
    /<li class="navbar__dropdown">\s*<button\b[\s\S]*?aria-controls="menu-qualidade"[\s\S]*?<\/button>\s*<ul\b[\s\S]*?id="menu-qualidade"[\s\S]*?<\/ul>\s*<\/li>/,
    '<li><a class="navbar__link" href="qualidade.html">Qualidade</a></li>'
  );
  // Corrige <a><button><a>Serviços</a></button></a>, que é HTML inválido.
  s = s.replace('<a href="servicos.html"><button', '<button');
  s = s.replace('<a href="servicos.html">Serviços</a>', 'Serviços');
  s = s.replace('</button></a>', '</button>');
  // O botão abre o submenu; adiciona destino explícito para a visão geral.
  s = s.replace(/(<ul\s+class="navbar__submenu"\s+id="menu-servicos"\s+hidden\s*>)/,
    '$1\n<li><a href="servicos.html">Todos os serviços</a></li>');
  return s;
}

function fixCommon(s) {
  s = fixNavbar(s);
  // Corrige recurso inexistente, mantendo apenas o script.js válido.
  s = s.replace(/\s*<script defer src="\.\/js\/script\.js"><\/script>/g, '');
  s = s.replace(/tel:\+552126201234/g, 'tel:+5521995966620');
  s = s.replace(/href="https:\/\/eletrotecnicamarinelli\.com\/"/g, 'href="index.html"');
  s = s.replace(/href="\/qualidade\/"/g, 'href="qualidade.html"');
  // Atualiza ancoragens desatualizadas, inclusive rodapés.
  for (const [oldHref, newHref] of footerHrefs) {
    s = s.replaceAll(`href="${oldHref}"`, `href="${newHref}"`);
  }
  // Remove o LinkedIn até a página institucional ser aprovada.
  s = s.replace(/\s*<li>\s*<a\b(?:(?!<\/a>)[\s\S])*?href="https:\/\/www\.linkedin\.com\/company\/eletrot%C3%A9cnica-marinelli\/"(?:(?!<\/a>)[\s\S])*?<\/a>\s*<\/li>/g, '');
  // Menos CTAs concorrentes: o verde da navbar permanece e abre WhatsApp.
  s = s.replaceAll('class="button button--primary navbar__cta"',
    'class="button button--primary navbar__cta navbar__cta--whatsapp"');
  s = s.replaceAll('Solicitar Orçamento', 'WhatsApp');
  // Evita scripts duplicados de botão flutuante; já existe implementação em script.js.
  s = s.replace(/\s*<script src="https:\/\/cdn\.jsdelivr\.net\/gh\/danilocampos\/whatsapp-floating-button@main\/whatsapp-button\.js"><\/script>/g, '');
  // Evita relinkar a folha de estilos no final da página.
  s = s.replace(/(<script>\s*window\.WHATSAPP_NUMBER = "5521995966620";\s*<\/script>)\s*<link rel="stylesheet" href="style\.css">/g, '$1');
  // Conserta a assinatura do desenvolvedor com HTML inválido e link vazio.
  s = s.replace(/<strong><a href="">THIAGO AUGUSTO - DESENVOLVIMENTO WEB<\/strong><\/a>/g,
    '<strong>THIAGO AUGUSTO — DESENVOLVIMENTO WEB</strong>');
  return s;
}

const servicePages = [
  'manutencao-preventiva-e-corretiva.html',
  'inspecoes-testes-e-parametrizacoes.html',
  'instalacao-de-sistemas-e-equipamentos-retrofit.html',
  'montagem-de-paineis-eletricos.html',
  'apoios-em-provas-de-mar.html'
];

for (const name of files) {
  update(name, original => {
    let s = fixCommon(original);
    if (name === 'index.html') {
      // Seção de orçamento com action="/enviar-orcamento" removida, conforme pedido.
      s = s.replace(/\s*<section class="quote"[\s\S]*?<\/section>/, '');
      s = s.replace('<section class="servicos" aria-labelledby="servicos-titulo">',
        '<section class="servicos" id="servicos" aria-labelledby="servicos-titulo">');
      // Primeiro slide: marca institucional, em vez de apenas um serviço.
      s = s.replace(/(<h1 class="hero__title">)[\s\S]*?(<\/h1>)/,
        '$1\n                                Confiança que\n                                <span>atravessa oceanos.</span>\n                            $2');
      s = s.replace(/(<h1 class="hero__title">[\s\S]*?<\/h1>\s*<p class="hero__description">)[\s\S]*?(<\/p>)/,
        '$1\n                                Soluções em elétrica naval e industrial para operações seguras,\n                                eficientes e confiáveis.\n                            $2');
      // As quatro imagens do carrossel são trocadas pelo JS; este é o fallback inicial.
      s = s.replace('src="imgs/slide-02.png"', 'src="imgs/slide-03.png"');
      // Remove os botões secundários repetidos "Fale com nossa equipe" do slider.
      s = s.replace(/\s*<a class="button button--outline" href="contato\.html">[\s\S]*?<\/a>/g, '');
      // Cards direcionam às páginas existentes; o pedido de contato fica em contato.html.
      const links = new Map([
        ['manutenção', 'manutencao-preventiva-e-corretiva.html'],
        ['inspeções', 'inspecoes-testes-e-parametrizacoes.html'],
        ['retrofit', 'instalacao-de-sistemas-e-equipamentos-retrofit.html'],
        ['painéis elétricos', 'montagem-de-paineis-eletricos.html'],
        ['provas de mar', 'apoios-em-provas-de-mar.html'],
      ]);
      for (const [label, url] of links) {
        const safe = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        s = s.replace(new RegExp(`href="contato\\.html"(?= class="servico__link"[\\s\\S]{0,100}aria-label="Saiba mais sobre ${safe}")`, 'i'),
          `href="${url}"`);
      }
      s = s.replace(/Equipe certificada/g, 'Empresa certificada');
      s = s.replace(/Profissionais qualificados e certificados pelo CFT\./g,
        'Sistema de Gestão da Qualidade certificado conforme a norma ISO 9001:2015.');
      // Sobre nós e diferenciais ficam sem CTA redundante.
      s = s.replace(/\s*<a class="button button--primary about__cta"[\s\S]*?<\/a>/g, '');
      s = s.replace(/\s*<a class="diferenciais__botao"[\s\S]*?<\/a>/g, '');
    }
    if (name === 'servicos.html') {
      s = s.replace('href="/"', 'href="index.html"');
      s = s.replaceAll('href="/servicos/manutencao-preventiva-e-corretiva/"', 'href="manutencao-preventiva-e-corretiva.html"');
      s = s.replaceAll('href="/servicos/inspecoes-testes-e-parametrizacoes/"', 'href="inspecoes-testes-e-parametrizacoes.html"');
      s = s.replaceAll('href="/servicos/instalacoes-e-retrofit/"', 'href="instalacao-de-sistemas-e-equipamentos-retrofit.html"');
      s = s.replaceAll('href="imgs/serivcos-img/paineis.png"', 'href="montagem-de-paineis-eletricos.html"');
      s = s.replaceAll('href="/servicos/apoio-em-provas-de-mar/"', 'href="apoios-em-provas-de-mar.html"');
      s = s.replace('class="banner__photo" aria-hidden="true"', 'class="banner__photo-servicos" aria-hidden="true"');
    }
    if (name === 'trabalhe-conosco.html') {
      s = s.replace(/\s*<a class="recruitment__button" href="#candidatura">[\s\S]*?<\/a>/, '');
    }
    if (servicePages.includes(name)) {
      const special = {
        'inspecoes-testes-e-parametrizacoes.html': 'banner__photo-inspecoes',
        'instalacao-de-sistemas-e-equipamentos-retrofit.html': 'banner__photo-retrofit',
        'montagem-de-paineis-eletricos.html': 'banner__photo-paineis',
        'apoios-em-provas-de-mar.html': 'banner__photo-provas'
      };
      if (special[name]) {
        s = s.replace('class="banner__photo-manutencao"', `class="${special[name]}"`);
      }
    }
    return s;
  });
}

update('script.js', s => s.replace('"imgs/slide-1.jpg",', '"imgs/slide-03.png",')
  .replace("window.WHATSAPP_NUMBER || '553438132026'", "window.WHATSAPP_NUMBER || '5521995966620'")
  .replace('document.body.appendChild(createButton());', 'if (!document.querySelector("#wa_button")) document.body.appendChild(createButton());'));

// Mantém as imagens no próprio repositório e só adiciona estilos incrementais.
update('style.css', s => {
  if (s.includes('/* PATCH MARINELLI NOVEMBRO 2026 */')) return s;
  return s + `\n\n/* PATCH MARINELLI NOVEMBRO 2026 */
.navbar__cta--whatsapp { background: #218d4a !important; color: #fff !important; border-color: #218d4a !important; }
.navbar__cta--whatsapp:hover { background: #166c38 !important; border-color: #166c38 !important; }
.banner__photo-manutencao { background-image: url("imgs/galeria01.jpg") !important; background-position: center !important; background-size: cover !important; }
.banner__photo-inspecoes, .banner__photo-retrofit, .banner__photo-paineis, .banner__photo-provas, .banner__photo-servicos {
  position: absolute; inset: 0; z-index: -2; background-size: cover; background-position: center;
}
.banner__photo-inspecoes { background-image: url("imgs/galeria-1770643578-6989e07ad273a.jfif"); }
.banner__photo-retrofit { background-image: url("imgs/retrofit.png"); }
.banner__photo-paineis { background-image: url("imgs/serivcos-img/paineis.png"); }
.banner__photo-provas { background-image: url("imgs/slide-03.png"); }
.banner__photo-servicos { background-image: url("imgs/slide-02.png"); }
@media (prefers-reduced-motion: reduce) {
  .hero__slide, .hero__image { animation: none !important; transition: none !important; }
}
`;
});

console.log('Arquivos alterados:');
for (const name of changed) console.log('  - ' + name);
console.log('\nBackup original em: ' + backupDir);
console.log('ATENÇÃO: Os formulários /api/contato e /api/candidaturas exigem backend real; não foram considerados funcionais.');
console.log('ATENÇÃO: Certificado vigente, logo Bureau Veritas e fotos do novo uniforme precisam ser fornecidos/validados.');
