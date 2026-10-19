import fs from 'fs';
import path from 'path';

const personalPatterns = [
  /André\s+Baptista/gi,
  /Andre\s+Baptista/gi,
  /Jorge\s+Monteiro/gi,
  /Vítor\s+Pinho/gi,
  /Vitor\s+Pinho/gi,
  /João\s+Ferreira/gi,
  /Joao\s+Ferreira/gi,
  /Pedro\s+Conde/gi,
  /Rafael\s+Castilho/gi,
  /Ben\s+Lampere/gi,
  /Bruno\s+Mendes/gi,
  /Henrique\s+Branquinho/gi,
  /Hugo\s+Ferreira/gi,
  /Johann\s+Rehberger/gi,
  /José\s+Martinho/gi,
  /Joseph\s+Tacker/gi,
  /Pedro\s+Cuco/gi,
  /Sara\s+Duarte/gi,
  /Sara\s+Sampaio/gi,
  /Tiago\s+Roque/gi,
  /tiago-roque/gi,
  /Rui\s+Pereira/gi,
  /HackerOne/gi,
  /Most\s+Valuable\s+Hacker/gi,
  /pianist\s+turned\s+hacker/gi,
  /friendship\s+closer\s+than\s+brothers/gi,
  /Aegon\s+Santander/gi,
  /what\s+security\s+teams\s+say/gi,
  /data-component="testimonial-card"/gi,
  /data-section="Testimonials\.section"/gi
];

let occurrences = [];

function audit(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (f.name !== 'media-proxy' && f.name !== 'sanity-proxy' && f.name !== 'fonts') audit(full);
    } else if (f.isFile() && (f.name.endsWith('.html') || f.name.endsWith('.json') || f.name.endsWith('.js'))) {
      const c = fs.readFileSync(full, 'utf8');
      personalPatterns.forEach(pattern => {
        const matches = [...c.matchAll(pattern)];
        if (matches.length > 0) {
          occurrences.push({
            file: full,
            pattern: pattern.toString(),
            count: matches.length
          });
        }
      });
    }
  }
}

audit('serve/site');
console.log(`Total pattern matches across serve/site: ${occurrences.length}`);
occurrences.forEach(o => console.log(`  ${o.file} -> ${o.pattern} (${o.count})`));
