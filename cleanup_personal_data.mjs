import fs from 'fs';
import path from 'path';

console.log('=== Step 1: Removing Testimonials Section from use-cases HTML files ===');

const useCasesHtmlFiles = [
  'serve/site/use-cases.html',
  'serve/site/use-cases/ai-saas.html',
  'serve/site/use-cases/aviation.html',
  'serve/site/use-cases/financial.html',
  'serve/site/use-cases/gov-and-critical-infrastructure.html',
  'serve/site/use-cases/healthcare.html',
  'serve/site/use-cases/manufacturing.html',
  'serve/site/use-cases/retail-commerce.html',
  'serve/site/use-cases/telecommunications.html'
];

for (const relPath of useCasesHtmlFiles) {
  if (fs.existsSync(relPath)) {
    let content = fs.readFileSync(relPath, 'utf8');
    const startPattern = '<div data-component="community"';
    const endPattern = '<div data-component="pre-footer"';
    
    const startIdx = content.indexOf(startPattern);
    const endIdx = content.indexOf(endPattern, startIdx);
    
    if (startIdx !== -1 && endIdx !== -1) {
      content = content.substring(0, startIdx) + content.substring(endIdx);
      fs.writeFileSync(relPath, content, 'utf8');
      console.log(`  Removed Testimonials.section from ${relPath}`);
    } else {
      console.log(`  Pattern not found in ${relPath}`);
    }
  }
}

console.log('\n=== Step 2: Neutralizing Author Cards in HTML files ===');

function updateAuthorCardsInHtml(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace author-card photo and text with Agletras Research Team
  const authorCardRegex = /<div data-component="author-card"[\s\S]*?<\/div><\/div><\/div>/g;
  
  if (authorCardRegex.test(content)) {
    content = content.replace(authorCardRegex, (match) => {
      // Keep outer data-v attributes if present
      const vAttrs = match.match(/data-v-[a-f0-9]+/g) || [];
      const v1 = vAttrs[0] || 'data-v-b0f25ff1';
      const v2 = vAttrs[1] || 'data-v-44a8eb3d';
      
      return `<div data-component="author-card" ${v1} ${v2}><div class="photo-container" ${v2}><img width="104" height="104" alt="Agletras Research" data-v-${v2.split('-')[2] || '44a8eb3d'} src="/logo.png" style="width:100%;height:100%;object-fit:contain;padding:12px;background:#031714;border-radius:12px;"></div><div class="content-container" ${v2}><div class="info" ${v2}><p class="-text-3 name" ${v2}>Agletras Research Team</p><p class="-text-4 role" ${v2}>Research &amp; Intelligence</p></div></div></div>`;
    });
    changed = true;
  }

  // Also replace any JSON-LD author Persons with Agletras Research Team
  const jsonLdPersonRegex = /"@type":"Person","name":"(?:André Baptista|Jorge Monteiro|Vítor Pinho|João Ferreira|Pedro Conde|Rafael Castilho|Ben Lampere|Bruno Mendes|Henrique Branquinho|Hugo Ferreira|Johann Rehberger|José Martinho|Joseph Tacker|Pedro Cuco|Sara Duarte|Sara Sampaio)"/g;
  if (jsonLdPersonRegex.test(content)) {
    content = content.replace(jsonLdPersonRegex, '"@type":"Organization","name":"Agletras Research Team"');
    changed = true;
  }

  // Remove founder array from JSON-LD schema
  const founderSchemaRegex = /"founder":\[\{"@type":"Person","name":"[^"]+","jobTitle":"[^"]+"\},?\{"@type":"Person","name":"[^"]+","jobTitle":"[^"]+"\},?\{"@type":"Person","name":"[^"]+","jobTitle":"[^"]+"\}\],?/g;
  if (founderSchemaRegex.test(content)) {
    content = content.replace(founderSchemaRegex, '');
    changed = true;
  }

  // Update Portugal/Coimbra address in schema
  content = content.replace(/"addressCountry":"Portugal","addressLocality":"Coimbra"/g, '"addressCountry":"India","addressLocality":"Nashik"');

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated author/metadata in ${filePath}`);
  }
}

function processAllHtml(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'media-proxy' && entry.name !== 'sanity-proxy' && entry.name !== 'fonts') {
        processAllHtml(full);
      }
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      updateAuthorCardsInHtml(full);
    }
  }
}

processAllHtml('serve/site');

console.log('\n=== Step 3: Cleaning Sitemap Authors Category ===');

const sitemapPath = 'serve/site/sitemap.html';
if (fs.existsSync(sitemapPath)) {
  let sitemapHtml = fs.readFileSync(sitemapPath, 'utf8');
  
  // Replace the entire authors list with Agletras Research Editorial
  const authorsStart = sitemapHtml.indexOf('id="sitemap-category-2-authors"');
  if (authorsStart !== -1) {
    const ulStart = sitemapHtml.indexOf('<ul class="link-list"', authorsStart);
    const ulEnd = sitemapHtml.indexOf('</ul>', ulStart) + 5;
    
    const newUl = `<ul class="link-list" aria-labelledby="sitemap-category-2-authors" data-v-4d7d3e04><li data-v-4d7d3e04><a href="https://agletras.com/info-hub" aria-label="Agletras Research Team, Authors" data-v-4d7d3e04><p class="-text-4" aria-hidden="true" data-v-4d7d3e04>Agletras Research Team</p></a></li></ul>`;
    
    sitemapHtml = sitemapHtml.substring(0, ulStart) + newUl + sitemapHtml.substring(ulEnd);
    fs.writeFileSync(sitemapPath, sitemapHtml, 'utf8');
    console.log('  Cleaned Authors list in sitemap.html');
  }
}

console.log('\n=== Step 4: Neutralizing Personal Author Pages ===');

const authorPages = [
  'serve/site/info-hub/andre-baptista.html',
  'serve/site/info-hub/joao-ferreira.html',
  'serve/site/info-hub/jorge-monteiro.html',
  'serve/site/info-hub/pedro-conde.html',
  'serve/site/info-hub/rafael-castilho.html'
];

for (const ap of authorPages) {
  if (fs.existsSync(ap)) {
    let content = fs.readFileSync(ap, 'utf8');
    content = content.replace(/<title>[^<]+<\/title>/i, '<title>Agletras Research Team | Agletras</title>');
    content = content.replace(/<strong class="dynamic-word"[^>]*>[^<]+<\/strong>/g, '<strong class="dynamic-word" data-v-c59b152f>Agletras Research Team</strong>');
    fs.writeFileSync(ap, content, 'utf8');
    console.log(`  Updated title and header in ${ap}`);
  }
}

console.log('\n=== Step 5: Global String Replacement of Personal Names & Endorsements in Payloads & HTML ===');

const textReplacements = [
  // Hacker / Founder claims
  [
    "Agletras's hacker intelligence team is made up of professional ethical hackers, including Andre Baptista, a 2x HackerOne Most Valuable Hacker who has responsibly disclosed critical vulnerabilities in Shopify, Verizon, and the U.S. Department of Defense. They contribute novel attack techniques, validate complex findings, and keep Agletras ahead of emerging threats before public disclosure.",
    "Agletras's research intelligence team is made up of experienced analysts and open-source investigators who systematically verify public information across corporate registries, official gazettes, and digital footprints. They apply rigorous hypothesis testing, corroborate findings across independent sources, and deliver structured, decision-ready intelligence dossiers."
  ],
  [
    "Agletras&#39;s hacker intelligence team is made up of professional ethical hackers, including Andre Baptista, a 2x HackerOne Most Valuable Hacker who has responsibly disclosed critical vulnerabilities in Shopify, Verizon, and the U.S. Department of Defense. They contribute novel attack techniques, validate complex findings, and keep Agletras ahead of emerging threats before public disclosure.",
    "Agletras&#39;s research intelligence team is made up of experienced analysts and open-source investigators who systematically verify public information across corporate registries, official gazettes, and digital footprints. They apply rigorous hypothesis testing, corroborate findings across independent sources, and deliver structured, decision-ready intelligence dossiers."
  ],
  [
    "It all started with a friendship closer than brothers.",
    "Built on an uncompromising commitment to empirical evidence and analytical rigor."
  ],
  [
    "the origin of Agletras",
    "the mission of Agletras"
  ],
  [
    "Vitor, a pianist turned hacker whose creative mindset and technical precision helped define Agletras's hacker-first culture. His ability to see patterns others missed pushed us to build solutions that were as inventive as they were reliable.",
    "Our research practice combines structured information harvesting with disciplined analytical verification, ensuring our intelligence dossiers remain fully attributed, transparent, and decision-ready."
  ],
  [
    "Vitor, a pianist turned hacker whose creative mindset and technical precision helped define Agletras&#39;s hacker-first culture. His ability to see patterns others missed pushed us to build solutions that were as inventive as they were reliable.",
    "Our research practice combines structured information harvesting with disciplined analytical verification, ensuring our intelligence dossiers remain fully attributed, transparent, and decision-ready."
  ],
  [
    "Our complementary strengths became the foundation of our friendship, and, later, Agletras's success. ",
    "Our commitment to primary source attribution and verifiable facts forms the foundation of our research methodology."
  ],
  [
    "Our complementary strengths became the foundation of our friendship, and, later, Agletras&#39;s success. ",
    "Our commitment to primary source attribution and verifiable facts forms the foundation of our research methodology."
  ],
  [
    "Best service in this category. I use Agletras to perform security tests and get a complete overview of our company's critical assets. This product has made vulnerability management so efficient and straightforward, allowing us to focus on and optimize resources. Not to mention the excellent support and promptness . Can't recommend it enough.",
    ""
  ],
  [
    "It's been very useful to identify assets we didn't even know we had. You've found multiple assets that were completely hidden from us.",
    ""
  ],
  [
    "Rui Pereira, Aegon Santander Portugal",
    ""
  ],
  [
    "Rui Pereira",
    ""
  ],
  [
    "Aegon Santander Portugal",
    ""
  ],
  [
    "Aegon Santander",
    ""
  ],
  [
    "what security teams say",
    ""
  ],

  // Specific Names in Titles, Metadata, or Text
  ["André Baptista", "Agletras Research Team"],
  ["Andre Baptista", "Agletras Research Team"],
  ["Jorge Monteiro", "Agletras Research Team"],
  ["Vítor Pinho", "Agletras Research Team"],
  ["Vitor Pinho", "Agletras Research Team"],
  ["João Ferreira", "Agletras Research Team"],
  ["Joao Ferreira", "Agletras Research Team"],
  ["Pedro Conde", "Agletras Research Team"],
  ["Rafael Castilho", "Agletras Research Team"],
  ["Ben Lampere", "Agletras Research Team"],
  ["Bruno Mendes", "Agletras Research Team"],
  ["Henrique Branquinho", "Agletras Research Team"],
  ["Hugo Ferreira", "Agletras Research Team"],
  ["Johann Rehberger", "Agletras Research Team"],
  ["José Martinho", "Agletras Research Team"],
  ["Joseph Tacker", "Agletras Research Team"],
  ["Pedro Cuco", "Agletras Research Team"],
  ["Sara Duarte", "Agletras Research Team"],
  ["Sara Sampaio", "Agletras Research Team"],
  ["Tiago Roque", "Agletras Advisory"],
  ["tiago-roque", "agletras-inquiry"],

  // Executive/Founder roles that appeared in about/team
  ["Co-Founder and CTO", "Research & Methodology Lead"],
  ["Co-Founder and CEO", "Operations & Intelligence Lead"],
  ["CCSO", "Technical Systems Lead"]
];

function applyReplacementsToContent(content) {
  let res = content;
  for (const [from, to] of textReplacements) {
    if (res.includes(from)) {
      res = res.replaceAll(from, to);
    }
  }
  return res;
}

function processDirectoryPayloads(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'media-proxy' && entry.name !== 'sanity-proxy' && entry.name !== 'fonts') {
        processDirectoryPayloads(full);
      }
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.html') || entry.name.endsWith('.json') || entry.name === 'CzNW3ZJW.js') {
        const original = fs.readFileSync(full, 'utf8');
        const updated = applyReplacementsToContent(original);
        if (updated !== original) {
          fs.writeFileSync(full, updated, 'utf8');
          console.log(`  Replaced personal terms in ${full}`);
        }
      }
    }
  }
}

processDirectoryPayloads('serve/site');

console.log('=== Cleanup Script Completed Successfully ===');
