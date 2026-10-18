import fs from 'fs';
import path from 'path';

console.log('--- Starting Agletras Website Alignment ---');

// Ordered substitution rules (longer, specific strings first)
const exactReplacements = [
  // Full Sentences / Headings / Metadata
  [
    "Ethiack is an autonomous offensive security platform that continuously tests and validates what attackers can actually exploit across an organization's entire external and internal attack surface. Where scanners flag thousands of potential issues and annual pentests give a snapshot that goes stale the day after delivery, Ethiack proves exploitability in real time, with a reproducible Proof of Exploit for every finding and a false-positive rate the company reports below 0.5%.",
    "Agletras is a research and intelligence startup that systematically investigates public records, evaluates evidence, and connects relevant findings to deliver structured, decision-ready intelligence. Where automated tools return noisy results and unverified claims, Agletras proves ground truth with attributed source citations and human analytical rigor."
  ],
  [
    "Ethiack is the Adversarial Exposure Validation platform. Hackian continuously tests your attack surface, validates exploitability with proof-of-exploit, and eliminates 90% of scanner noise. See your exposure. Test continuously. Act on what matters.",
    "Agletras is an evidence-first research and intelligence business. We research publicly available information, evaluate evidence, connect relevant findings, and deliver structured intelligence to support better-informed business decisions."
  ],
  [
    "Ethiack is leading the future of proactive cybersecurity.",
    "Agletras is advancing the standard of evidence-based research intelligence."
  ],
  [
    "Agentic AI Pentesting.\nProven, Continuous.",
    "Researching Information.\nEngineering Intelligence."
  ],
  [
    "Agentic AI Pentesting.\n Proven, Continuous.",
    "Researching Information.\n Engineering Intelligence."
  ],
  [
    "Agentic AI Pentesting. \nProven, Continuous.",
    "Researching Information. \nEngineering Intelligence."
  ],
  [
    "Agentic AI Pentesting. Proven, Continuous.",
    "Researching Information. Engineering Intelligence."
  ],
  [
    "Offensive Security. Continuous, Autonomous and Proven.",
    "Researching Information. Engineering Intelligence."
  ],
  [
    "Annual pentests give you a snapshot. Results arrive late, ranked by CVSS, not by what attackers can actually exploit. Ethiack tests continuously, validates exploitability with proof-of-exploit, and tells your team exactly what to fix first.",
    "Agletras researches publicly available information, evaluates evidence, connects relevant findings, and delivers structured intelligence to support better-informed business decisions."
  ],
  [
    "Hackian continuously maps your attack surface, validates what&#39;s truly exploitable, and delivers proof, so your team fixes what matters before attackers strike.",
    "Agletras systematically researches public records, verifies what is empirical fact, and delivers structured intelligence so your team makes decisions with clarity."
  ],
  [
    "Hackian continuously maps your attack surface, validates what's truly exploitable, and delivers proof, so your team fixes what matters before attackers strike.",
    "Agletras systematically researches public records, verifies what is empirical fact, and delivers structured intelligence so your team makes decisions with clarity."
  ],
  [
    "Ethiack&#39;s autonomous pentesting continuously tests and validates exploitability across your entire attack surface. Near-zero false positives. Proof-of-exploit on every confirmed risk.",
    "Agletras researches publicly available information, evaluates evidence, connects relevant findings, and delivers structured intelligence to support better-informed business decisions."
  ],
  [
    "Ethiack's autonomous pentesting continuously tests and validates exploitability across your entire attack surface. Near-zero false positives. Proof-of-exploit on every confirmed risk.",
    "Agletras researches publicly available information, evaluates evidence, connects relevant findings, and delivers structured intelligence to support better-informed business decisions."
  ],
  [
    "Combining AI Speed with Human Precision for the highest level of Security.",
    "Combining Analytical Rigor with Human Precision for Decision-Ready Intelligence."
  ],
  [
    "The Agentic AI Behind Ethiack",
    "Researching Information. Engineering Intelligence."
  ],
  [
    "Autonomous. Relentless. Continuous.",
    "Evidence-First. Systematic. Decision-Ready."
  ],
  [
    "Pentesting without schedules, snapshots, or manual triage.",
    "Research intelligence without noise, speculation, or unverified claims."
  ],
  [
    "Hackian agentic AI pentesting engine maps your attack surface, executes exploitation routines, chains attack paths, and delivers proof-of-exploit on every confirmed risk.",
    "Agletras combines structured public collection pipelines with experienced human analytical judgment to verify facts, correlate entities, and deliver decision-ready intelligence."
  ],
  [
    "AI PENTESTING AGENT COMBINING FREQUENCY AND DEPTH TO PROVE REAL-WORLD EXPLOITABILITY",
    "EVIDENCE-FIRST RESEARCH COMBINING SYSTEMATIC DISCOVERY AND ANALYTICAL RIGOR"
  ],
  [
    "AI PENTESTING AGENT COMBINING FREQUENCY AND DEPTH",
    "EVIDENCE-FIRST RESEARCH COMBINING DISCOVERY AND DEPTH"
  ],
  [
    "Stay secure with Ethiack",
    "Decide with Confidence with Agletras"
  ],
  [
    "Stay secure with",
    "Decide with Confidence with"
  ],
  [
    "The Platform for Autonomous Offensive Security",
    "Evidence-First Research & Intelligence Capabilities"
  ],
  [
    "Validate your exposure before attackers do.",
    "Transform Fragmented Information into Actionable Intelligence."
  ],
  [
    "Validate your exposure\nbefore attackers do.",
    "Transform Fragmented Information\ninto Actionable Intelligence."
  ],
  [
    "Validate your exposure \nbefore attackers do.",
    "Transform Fragmented Information \ninto Actionable Intelligence."
  ],
  [
    "30-day free trial. No commitment.",
    "Evidence-first research. Strictly lawful public sources."
  ],
  [
    "Activate AI penTesting",
    "Engineering Intelligence"
  ],
  [
    "Activate\nAI penTesting",
    "Engineering\nIntelligence"
  ],
  [
    "Ethiack — Autonomous Ethical Hacking for continuous security Continuous Attack Surface Management &amp; Testing",
    "Agletras — Researching Information. Engineering Intelligence."
  ],
  [
    "Ethiack — Autonomous Ethical Hacking for continuous security Continuous Attack Surface Management & Testing",
    "Agletras — Researching Information. Engineering Intelligence."
  ],
  [
    "Ethiack | The Cybersecurity Platform for Continuous Exposure Management | Ethiack",
    "Agletras | Researching Information. Engineering Intelligence."
  ],
  [
    "Hackian - The AI Agent That Hacks Like a Human, 24&#x2F;7 | Ethiack | Ethiack",
    "Our Approach - 8-Stage Research Methodology & Epistemic Rigor | Agletras"
  ],
  [
    "Latest articles on Ethiack",
    "Latest Research & Intelligence Briefings"
  ],
  [
    "how organizations\nwork with ethiack",
    "core research & intelligence capabilities"
  ],
  [
    "work with ethiack",
    "research with agletras"
  ],
  [
    "ethiack platform",
    "agletras services"
  ],
  [
    "ethiack ecosystem",
    "agletras ecosystem"
  ],

  // Services: 6 Capabilities Mapping
  [
    "Real-time visibility across your entire attack surface — internal, external, and third-party — powered by autonomous discovery and AI-driven mapping.",
    "Research publicly available information to answer a defined question. Examine relevant sources, identify connections, document evidence, and prepare a structured report."
  ],
  [
    "Continuous exploitation, validation, and proof-based findings powered by Hackian, our agentic AI pentesting engine.",
    "Research companies, public business records, leadership, relationships, digital presence, and relevant warning signs to support partnership and commercial decisions."
  ],
  [
    "On-demand pentesting led by Hackian, combining autonomous speed with expert human validation. Get real, exploitable vulnerabilities with proof-of-exploit, up to 10× faster than traditional pentests.",
    "Review relevant public professional information and portfolios for discrepancies, subject to appropriate consent, privacy safeguards, and human review."
  ],
  [
    "Traditional vulnerability management overwhelms teams. Ethiack validates every finding with real exploitation—so only actionable risk reaches your team.",
    "Investigate suspicious public profiles, lookalike websites, fake pages, and potential misuse of a business's brand."
  ],
  [
    "Move beyond generic severity scores. Ethiack quantifies real cyber risk by combining validated vulnerabilities with business context and live exposure data.",
    "Research publicly observable cyber threats, suspicious digital infrastructure, relevant threat indicators, and external digital exposure to support defensive decisions."
  ],
  [
    "Turn compliance from a static checklist into a continuous, evidence-backed outcome—powered by real exploitation data and automated reporting.",
    "Organize approved information sources into repeatable workflows that reduce manual collection, duplication, and reporting effort."
  ],

  // Platform Cards Titles
  ["Attack Surface Management", "OSINT Investigation"],
  ["Adversarial Exposure Validation", "Business Due Diligence"],
  ["Pentest as a Service", "Recruitment Verification"],
  ["Agentic Pentest as a Service", "Recruitment Verification"],
  ["Risk-Based Vulnerability Management", "Brand Impersonation & Scam Research"],
  ["Risk Exposure Management", "Cyber Threat Intelligence"],
  ["Compliance & Reporting", "Research Automation & Pipelines"],
  ["Compliance Reporting", "Research Automation & Pipelines"],

  // See-Test-Act Detailed Copy
  [
    "Complete visibility of your attack surface and supply chain with continuous attack surface management.",
    "Comprehensive visibility across corporate registries, public records, and digital footprints."
  ],
  [
    "Complete visibility of your entire attack surface",
    "Comprehensive visibility across relevant public records"
  ],
  [
    "External, internal and third-party assets",
    "Official gazettes, commercial filings & registry data"
  ],
  [
    "Expose shadow IT and unknown assets",
    "Uncover indirect ownership and hidden counterparties"
  ],
  [
    "Maps every asset continuously, including unknown subdomains, APIs, and third-party exposure",
    "Maps entity relationships, cross-border corporate webs, and public digital footprints"
  ],
  [
    "Live evolving map, always up-to-date",
    "Relational link charts, always source-attributed"
  ],
  [
    "You cannot validate what you cannot see.",
    "You cannot decide what you have not verified."
  ],
  [
    "Diverse assets: mobile, IoT, OT, cloud",
    "Multi-jurisdiction corporate registers & filings"
  ],
  [
    "Third‑party & supply chain",
    "Corporate webs & counterparties"
  ],
  [
    "Internal &amp; external assets",
    "Primary records &amp; filings"
  ],
  [
    "Hackian doesn’t wait for an annual pentest. It continuously tests, exploits, and validates exploitability with the speed of AI and the creativity of ethical hackers.",
    "Agletras tests and corroborates every finding against independent public primary sources, distinguishing facts from inferences."
  ],
  [
    "Hackian doesn&#39;t wait for an annual pentest. It continuously tests, exploits, and validates exploitability with the speed of AI and the creativity of ethical hackers.",
    "Agletras tests and corroborates every finding against independent public primary sources, distinguishing facts from inferences."
  ],
  [
    "Autonomous, event-driven testing (on code pushes, infrastructure changes, new knowledge)",
    "Systematic multi-vector source verification (official records, archives, and disclosures)"
  ],
  [
    "Execute thousands of attack scenarios in minutes",
    "Cross-reference hundreds of independent primary filings"
  ],
  [
    "Rapid discovery of vulnerabilities",
    "Strict separation of facts from assumptions"
  ],
  [
    "Testing triggered by code changes or events",
    "Eliminating unverified claims and noise"
  ],
  [
    "Lead in finding new, emerging threats",
    "Human peer review ensures decision-grade rigor"
  ],
  [
    "Actionable risks and compliance-ready reporting. We validate every confirmed risk with proof-of-exploit",
    "Decision-ready intelligence and verifiable reporting. We attribute every confirmed finding with primary source citations."
  ],
  [
    "No more time wasted with noise or false positives",
    "No more time wasted on speculation or unverified claims"
  ],
  [
    "Get mitigation steps and guidance on what to fix first",
    "Receive actionable insights and executive briefing summaries"
  ],
  [
    "Pull live reports for NIS2, DORA, SOC2, ISO27001 and PCI",
    "Traceable citation index linking every finding to public sources"
  ],
  [
    "Accuracy + exploitability + impact",
    "Evidence + Corroboration + Attribution"
  ],
  [
    "Proof‑of‑exploit &amp; clear remediation guides",
    "Primary source citations &amp; executive briefings"
  ],
  [
    "Compliance reporting &amp; real‑world risk scores",
    "Structured intelligence reports &amp; confidence ratings"
  ],
  ["Validated Exploitable Risks", "Structured Intelligence Dossiers"],
  ["Prioritized Risks", "Clear Evidence Attribution"],
  ["Continuous Testing", "Evidence Triangulation"],
  ["Attack pace", "Analytical Rigor"],
  ["Proactive Discovery", "5-Tier Epistemic Standard"],
  ["0-day validation", "Objective Corroboration"],
  ["Compliance Ready", "Audit-Grade Documentation"],

  // Metric Cards
  ["Faster time to Remediation", "Evidence Attributed Sources"],
  ["Accuracy in finding exploitable vulnerabilities", "Attributed primary evidence in research findings"],
  ["Times faster than a manual pentest", "Faster ingestion than manual search"],
  ["Saved by Preventing Cyber damage", "Empirical Confidence Level"],
  ["Exploitable\nFindings\nReported", "Evidence\nPoints\nVerified"],
  ["Exploitable Findings Reported", "Evidence Points Verified"],
  ["150K+", "100K+"],
  ["+150M€", "High"],

  // Case Studies / Use Cases
  ["Measured impact, real customers", "Evidence-Based Intelligence for Key Stakeholders"],
  ["ANA Aeroportos", "Marketing Agencies"],
  ["Blue Pharma", "D2C Brands"],
  ["Bluepharma", "D2C Brands"],
  ["Universidade do Porto", "B2B Startups"],
  ["U.Porto", "B2B Startups"],
  [
    "How ANA Aeroportos Achieved 650% ROI and Validated 5,000+ Assets with Continuous AI Pentesting",
    "How Marketing Agencies Protect Campaign Integrity & Verify Partner Credibility"
  ],
  [
    "How <strong>ANA Aeroportos</strong> Achieved 650% ROI and Validated 5,000+ Assets with Continuous AI Pentesting",
    "How <strong>Marketing Agencies</strong> Protect Campaign Integrity &amp; Verify Partner Credibility"
  ],
  [
    "How Bluepharma and Ethiack Protected 5,000+ Assets with AI-Powered Intelligence",
    "How D2C Brands Detect Impersonation & Counterfeit Channels across Open Telemetry"
  ],
  [
    "How <strong>Bluepharma</strong> and Ethiack Protected 5,000+ Assets with AI-Powered Intelligence",
    "How <strong>D2C Brands</strong> Detect Impersonation &amp; Counterfeit Channels across Open Telemetry"
  ],
  [
    "How U.Porto and Ethiack Protected 5,000+ Assets with AI-Powered Intelligence",
    "How B2B Startups Uncover Counterparty Risks & Verify Corporate Registries"
  ],
  [
    "How <strong>U.Porto</strong> and Ethiack Protected 5,000+ Assets with AI-Powered Intelligence",
    "How <strong>B2B Startups</strong> Uncover Counterparty Risks &amp; Verify Corporate Registries"
  ],
  ["See Use Cases by Industry", "Explore All Target Stakeholders"],
  ["ROI Based in prevented risk", "Corroborated Public Records"],
  ["Impactful findings", "Attributed Insights"],
  ["Protected assets", "Verified Indicators"],
  ["monitored critical assets", "Public Sources Monitored"],
  ["In prevented risk in 2025 (ALE)", "Decision-Grade Findings"],

  // Buttons & CTAs
  ["Try Ethiack", "Explore Our Services"],
  ["Meet the Platform", "Explore Our Services"],
  ["Know more about Hackian", "Explore Our Approach"],
  ["Book a Demo", "Request Briefing"],

  // Console Snippets & Code Blocks
  [
    "hello(you) {\n  this.is\n  ethiack.website();\n  print('Welcome');\n}\n\nwe.are (\n  ethical_hackers\n);",
    "hello(you) {\n  this.is\n  agletras.intelligence();\n  print('Welcome');\n}\n\nwe.deliver (\n  research_insights\n);"
  ],
  [
    "hello(you) {\n this.is\n ethiack.website();\n print(&#39;Welcome&#39;);\n}\n\nwe.are (\n ethical_hackers\n);",
    "hello(you) {\n this.is\n agletras.intelligence();\n print(&#39;Welcome&#39;);\n}\n\nwe.deliver (\n research_insights\n);"
  ],
  [
    "//THE_ISSUE\nwhile (you.talk())\n{\n  threat\n    .moves_fast();\n\n  surface\n    .grows();\n}\n\nif (risk == \"?\") {\n  we.say(\"low\");\n}\n\nEthiack\n  .prove_it();\n\nwe.fix(\n  what_matters\n);",
    "//THE_PROBLEM\nwhile (business.decides())\n{\n  information\n    .fragments();\n\n  risk\n    .grows();\n}\n\nif (evidence == \"?\") {\n  we.test(\"sources\");\n}\n\nAgletras\n  .verify_it();\n\nwe.deliver(\n  ground_truth\n);"
  ],
  [
    "//HACKIAN\nmeet(hackian)\n{\n  human.skill\n    .meets(ai.speed);\n\n  think(\n    like_an_attacker\n  );\n\n  find(\n    what_others_miss\n  );\n}",
    "//METHODOLOGY\nresearch(requirement)\n{\n  human.rigor\n    .meets(data.scale);\n\n  verify(\n    primary_records\n  );\n\n  deliver(\n    decision_clarity\n  );\n}"
  ],
  [
    "//STAY_SECURED\nsee()\n{\n  map\n    .the_surface();\n}\n\ntest()\n{\n  prove\n    .the_risk();\n}\n\nact()\n{\n  fix\n    .the_gap();\n}",
    "//APPROACH\ncollect()\n{\n  research\n    .public_records();\n}\n\nverify()\n{\n  corroborate\n    .the_evidence();\n}\n\ndeliver()\n{\n  report\n    .ground_truth();\n}"
  ],
  [
    "def hello(self):\nprint(&quot;We are ethical hackers&quot;)\nclass Ethiack:\ndef continuous_vulnerability_discovery(self: Ethiack):\nself.scan_attack_surface()\nself.report_all_findings()\ndef proof_of_exploit_validation(self: Ethiack):\nself.simulate_attack()\nself.confirm_exploitability()\nself.validate_impact()\nwhile time.time() &lt; math.inf:\nethiack.map_attack_surface()\nethiack.discover_vulnerabilities()\nethiack.validate_exploits()\nethiack.generate_mitigations()\nethiack.calculate_risk()\nethiack.notify_users()\nlog.success(&quot;✓ Iteration complete&quot;)",
    "def hello(self):\nprint(&quot;We are research intelligence specialists&quot;)\nclass Agletras:\ndef empirical_evidence_discovery(self: Agletras):\nself.research_public_records()\nself.correlate_all_findings()\ndef evidence_first_validation(self: Agletras):\nself.triangulate_sources()\nself.confirm_epistemic_rigor()\nself.evaluate_confidence()\nwhile time.time() &lt; math.inf:\nagletras.map_public_records()\nagletras.discover_connections()\nagletras.validate_evidence()\nagletras.generate_intelligence_brief()\nagletras.evaluate_confidence()\nagletras.deliver_structured_report()\nlog.success(&quot;✓ Brief ready&quot;)"
  ],

  // Footer & Legal
  ["ISO27001\nCompliant", "Evidence-First\nResearch"],
  ["ISO27001 Compliant", "Evidence-First Research"],
  ["Made by Büro", "Agletras Intelligence"],
  ["ethiack-portal-ipn", "agletras-governance"],

  // External URLs
  ["https://portal.ethiack.com/signup", "/contact"],
  ["https://portal.ethiack.com/login", "/contact"],
  ["https://portal.ethiack.com", "https://agletras.com"],
  ["https://meet.ethiack.com/meetings/tiago-roque/book-demo?uuid=b58acd9a-d44c-4aed-b9f7-e2863591e6a6", "mailto:contact@agletras.com"],
  ["https://meet.ethiack.com/meetings/tiago-roque/events", "mailto:contact@agletras.com"],
  ["https://www.linkedin.com/company/ethiack/", "https://www.linkedin.com/company/agletras/"],
  ["https://x.com/intent/user?screen_name=ethiack", "https://x.com/agletras"],
  ["https://x.com/ethiack", "https://x.com/agletras"],
  ["https://github.com/ethiack", "https://github.com/Agletras"],
  ["https://www.youtube.com/@ethiack", "https://www.youtube.com/@agletras"],
  ["https://ethiack.com", "https://agletras.com"],

  // General Brand Names
  ["Ethiack", "Agletras"],
  ["ETHIACK", "AGLETRAS"],
  ["ethiack", "agletras"],
  ["Hackian", "Agletras"],
  ["hackian", "agletras"]
];

function applyReplacements(content) {
  let result = content;
  for (const [from, to] of exactReplacements) {
    if (result.includes(from)) {
      result = result.replaceAll(from, to);
    }
  }
  return result;
}

// 1. Process serve/site/index.html
console.log('Processing serve/site/index.html ...');
let indexHtml = fs.readFileSync('serve/site/index.html', 'utf8');

// Replace Ethiack Big Logo SVG with Agletras leaf logo img tag
const oldSvgPattern = /<svg viewBox="0 0 81 82" fill="none" xmlns="http:\/\/www\.w3\.org\/2000\/svg" data-v-d8cf265c>[\s\S]*?<\/svg>/;
if (oldSvgPattern.test(indexHtml)) {
  indexHtml = indexHtml.replace(oldSvgPattern, `<img src="/logo.png" alt="Agletras" data-v-d8cf265c style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 16px rgba(47,168,133,0.4));" />`);
  console.log('  Replaced logo-big SVG with Agletras leaf logo img.');
}

indexHtml = applyReplacements(indexHtml);
fs.writeFileSync('serve/site/index.html', indexHtml, 'utf8');
console.log('  Updated serve/site/index.html successfully.');

// 2. Process serve/site/_payload.json
console.log('Processing serve/site/_payload.json ...');
let rawPayload = fs.readFileSync('serve/site/_payload.json', 'utf8');
rawPayload = applyReplacements(rawPayload);
fs.writeFileSync('serve/site/_payload.json', rawPayload, 'utf8');
console.log('  Updated serve/site/_payload.json successfully.');

// 3. Process all other HTML and _payload.json files in serve/site
function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'media-proxy' && entry.name !== 'sanity-proxy' && entry.name !== 'fonts' && entry.name !== '_nuxt' && entry.name !== 'site_backup_text') {
        processDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.html') || entry.name === '_payload.json') {
        let content = fs.readFileSync(fullPath, 'utf8');
        // Replace old SVG in subpages if present
        if (oldSvgPattern.test(content)) {
          content = content.replace(oldSvgPattern, `<img src="/logo.png" alt="Agletras" data-v-d8cf265c style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 16px rgba(47,168,133,0.4));" />`);
        }
        const updated = applyReplacements(content);
        if (updated !== content) {
          fs.writeFileSync(fullPath, updated, 'utf8');
          console.log(`  Updated ${fullPath}`);
        }
      }
    }
  }
}

console.log('Processing all subpages and payloads in serve/site ...');
processDirectory('serve/site');

// 4. Process serve/site/_nuxt/CzNW3ZJW.js
console.log('Processing serve/site/_nuxt/CzNW3ZJW.js ...');
let cznwContent = fs.readFileSync('serve/site/_nuxt/CzNW3ZJW.js', 'utf8');
cznwContent = cznwContent.replaceAll('cd="Ethiack"', 'cd="Agletras"');
cznwContent = cznwContent.replaceAll('Autonomous Ethical Hacking for continuous security Continuous Attack Surface Management & Testing', 'Researching Information. Engineering Intelligence. Evidence-First Intelligence');
cznwContent = cznwContent.replaceAll('sitename:"Ethiack"', 'sitename:"Agletras"');
cznwContent = cznwContent.replaceAll('class Ethiack:', 'class Agletras:');
cznwContent = cznwContent.replaceAll('self: Ethiack', 'self: Agletras');
cznwContent = cznwContent.replaceAll('ethiack.map_attack_surface()', 'agletras.map_public_records()');
cznwContent = cznwContent.replaceAll('ethiack.discover_vulnerabilities()', 'agletras.discover_connections()');
cznwContent = cznwContent.replaceAll('ethiack.validate_exploits()', 'agletras.validate_evidence()');
cznwContent = cznwContent.replaceAll('ethiack.generate_mitigations()', 'agletras.generate_intelligence_brief()');
cznwContent = cznwContent.replaceAll('ethiack.calculate_risk()', 'agletras.evaluate_confidence()');
cznwContent = cznwContent.replaceAll('ethiack.notify_users()', 'agletras.deliver_structured_report()');
cznwContent = cznwContent.replaceAll('https://ethiack.com', 'https://agletras.com');
cznwContent = cznwContent.replaceAll('Ethiack is leading the future of proactive cybersecurity.', 'Agletras is advancing the standard of evidence-based research intelligence.');

fs.writeFileSync('serve/site/_nuxt/CzNW3ZJW.js', cznwContent, 'utf8');
console.log('  Updated CzNW3ZJW.js successfully.');

console.log('--- Agletras Alignment Complete ---');
