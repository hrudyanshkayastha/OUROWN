import fs from 'fs';
import path from 'path';

console.log('--- Cleaning Residual Strings in HTML and Payload ---');

const residualReplacements = [
  ["//HACKIAN\nmeet(agletras)", "//METHODOLOGY\nresearch(requirement)"],
  ["//HACKIAN\\nmeet(agletras)", "//METHODOLOGY\\nresearch(requirement)"],
  ["Continuous AI pentesting that validates exploitability, 24/7.", "Structured intelligence investigations across public records, 24/7."],
  ["Continuous AI pentesting that validates exploitability, 24/7", "Structured intelligence investigations across public records, 24/7"],
  ["On-demand AI pentesting. Any scope. Results in under 24 hours.", "Verify public claims, credentials, and portfolios with objective evidence."],
  ["On-demand AI pentesting. Any scope. Results in under 24 hours", "Verify public claims, credentials, and portfolios with objective evidence"],
  ["Agentic AI Pentesting & Attack Surface Security for Finance", "Commercial Due Diligence & Market Intelligence for Finance"],
  ["Agentic AI Pentesting", "OSINT Investigation"],
  ["agentic-ai-pentesting", "osint-investigation"],
  ["ai-pentesting", "evidence-research"],
  ["Continuous Security Testing", "Evidence-First Research"],
  ["Proof-of-Exploit Validation", "Primary Source Verification"],
  ["Proof of Exploit", "Primary Source Evidence"],
  ["proof-of-exploit", "primary-source-evidence"],
  ["NIS2 Compliance", "Corporate Due Diligence"],
  ["Validated 5,000+ Assets with Continuous AI Pentesting", "Verified Evidence & Multi-Source Records with Agletras"],
  ["Validated 5,000+ Assets with Continuous AI", "Verified Evidence & Multi-Source Records with Agletras"],
  ["Continuous AI Pentesting", "Evidence-First Research Intelligence"],
  ["AI Pentesting", "Research Intelligence"],
  ["ai pentesting", "research intelligence"],
  ["AI pentesting", "Research intelligence"],
  ["pentesting engine", "research intelligence engine"],
  ["pentesting skills", "research skills"],
  ["pentesting", "research intelligence"],
  ["Pentesting", "Research Intelligence"],
  ["pentest", "research engagement"],
  ["Pentest", "Research Engagement"],
  ["exploitable vulnerabilities", "verifiable commercial findings"],
  ["exploitable vulnerability", "verifiable commercial finding"],
  ["exploits", "evidence correlations"],
  ["exploitability", "empirical verification"],
  ["Exploitability", "Empirical Verification"],
  ["proof-of-exploit", "source-attribution"],
  ["CVE-2025-55182", "AGL-2026-041"],
  ["CVE-2024-10924", "AGL-2026-084"],
  ["cve_2024_10924!", "assumption_logged!"],
  ["risk_detected!", "fact_verified!"],
  ["exploit_confirmed!", "indicator_found!"],
  ["unprotected_asset!", "inference_tested!"]
];

function cleanContent(content) {
  let res = content;
  for (const [from, to] of residualReplacements) {
    if (res.includes(from)) {
      res = res.replaceAll(from, to);
    }
  }
  return res;
}

function processAll(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'media-proxy' && entry.name !== 'sanity-proxy' && entry.name !== 'fonts' && entry.name !== 'site_backup_text') {
        processAll(fullPath);
      }
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.html') || entry.name.endsWith('.json') || entry.name.endsWith('.js')) {
        const original = fs.readFileSync(fullPath, 'utf8');
        const cleaned = cleanContent(original);
        if (cleaned !== original) {
          fs.writeFileSync(fullPath, cleaned, 'utf8');
          console.log(`Cleaned: ${fullPath}`);
        }
      }
    }
  }
}

processAll('serve/site');
console.log('--- Cleaning complete ---');
