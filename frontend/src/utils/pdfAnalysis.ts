/**
 * pdfAnalysis.ts
 * Client-side PDF text extraction + mock AI analysis engine.
 * Reads the raw bytes of a PDF file, pulls text from BT/ET stream tokens,
 * then generates a structured analysis report deterministically from
 * the extracted content so the demo works without a backend.
 */

export interface AIAnalysisResult {
  fileName: string;
  fileSize: number;
  docType: string;
  caseNumber: string;
  processedAt: string;

  // Brief
  brief: string;

  // Key entities
  parties: string[];
  judges: string[];
  dates: string[];
  sections: string[];

  // Risk flags
  riskFlags: { level: 'critical' | 'warning' | 'info'; text: string }[];

  // Delay risk prediction
  delayRisk: 'low' | 'medium' | 'high';
  delayConfidence: number;
  delayFactors: { name: string; impact: 'positive' | 'negative'; score: number; description: string }[];

  // Raw text snippet
  rawTextSnippet: string;
}

/* ── PDF text extraction ─────────────────────────────────────────────────── */

async function extractPdfText(file: File): Promise<string> {
  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const raw = new TextDecoder('latin1').decode(bytes);

    const parts: string[] = [];
    const btRe = /BT([\s\S]*?)ET/g;
    let btMatch: RegExpExecArray | null;

    while ((btMatch = btRe.exec(raw)) !== null) {
      const block = btMatch[1];

      // Parenthesised strings: (Hello World)
      const parenRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
      let pm: RegExpExecArray | null;
      while ((pm = parenRe.exec(block)) !== null) {
        parts.push(pm[1].replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\/g, ''));
      }

      // Hex strings: <48656c6c6f>
      const hexRe = /<([0-9a-fA-F]+)>/g;
      let hm: RegExpExecArray | null;
      while ((hm = hexRe.exec(block)) !== null) {
        const hex = hm[1];
        if (hex.length % 2 !== 0) continue;
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
          const code = parseInt(hex.slice(i, i + 2), 16);
          if (code > 31) str += String.fromCharCode(code);
        }
        if (str.trim()) parts.push(str);
      }
    }

    return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 8000);
  } catch {
    return '';
  }
}

/* ── Analysis helpers ───────────────────────────────────────────────────── */

const DATE_RE = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,]+\d{4})\b/gi;
const SECTION_RE = /\bsection\s+\d+[a-z]?\b|\bs\.\s*\d+[a-z]?\b|\bipc\s+\d+\b|\bcrpc\s+\d+\b/gi;

function scoreDelayRisk(text: string, docType: string): { risk: 'low' | 'medium' | 'high'; confidence: number } {
  const lower = text.toLowerCase();
  let score = 0;

  const negativeWords = ['adjournment', 'adjourned', 'postpone', 'delay', 'pending', 'stay', 'interim', 'contempt', 'appeal', 'revision'];
  const positiveWords = ['decided', 'disposed', 'judgment', 'final order', 'decree', 'settled', 'closed'];

  negativeWords.forEach(w => { if (lower.includes(w)) score += 1; });
  positiveWords.forEach(w => { if (lower.includes(w)) score -= 1; });

  if (docType === 'petition') score += 1;
  if (docType === 'court_order' || docType === 'affidavit') score -= 1;

  const risk: 'low' | 'medium' | 'high' = score >= 3 ? 'high' : score >= 1 ? 'medium' : 'low';
  const base = risk === 'high' ? 82 : risk === 'medium' ? 68 : 88;
  const confidence = base + (text.length % 11); // deterministic offset

  return { risk, confidence: Math.min(confidence, 98) };
}

function extractParties(text: string): string[] {
  const vsRe = /([A-Z][A-Za-z\s.]+?)\s+(?:vs?\.?|versus)\s+([A-Z][A-Za-z\s.]+?)(?=[,.\n]|$)/gm;
  const parties = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = vsRe.exec(text)) !== null && parties.size < 6) {
    const a = m[1].trim().replace(/\s+/g, ' ');
    const b = m[2].trim().replace(/\s+/g, ' ');
    if (a.length > 2 && a.length < 60) parties.add(a);
    if (b.length > 2 && b.length < 60) parties.add(b);
  }
  return Array.from(parties).slice(0, 4);
}

function extractJudges(text: string): string[] {
  const re = /(?:hon['\u2019]?ble|justice|j\.)\s+([A-Z][A-Za-z\s.]+?)(?=[,.\n]|$)/gim;
  const judges = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null && judges.size < 3) {
    const name = m[1].trim().replace(/\s+/g, ' ');
    if (name.length > 3 && name.length < 50) judges.add(name);
  }
  return Array.from(judges);
}

const DOC_TYPE_LABELS: Record<string, string> = {
  court_order: 'Court Order / Judgment',
  petition:    'Petition / Complaint',
  evidence:    'Evidence Document',
  affidavit:   'Affidavit',
  contract:    'Contract / Agreement',
  statutory:   'Statutory Filing',
  other:       'Legal Document',
};

function generateBrief(text: string, fileName: string, docType: string): string {
  const lower = text.toLowerCase();
  const typeLabel = DOC_TYPE_LABELS[docType] ?? 'Legal Document';

  if (text.length < 100) {
    return `This ${typeLabel} (${fileName}) was uploaded for AI analysis. ` +
      `The document appears to be a scanned or image-based PDF; full text could not be extracted. ` +
      `Key details such as case number, parties, and dates should be reviewed manually. ` +
      `The AI engine has flagged this document for manual verification.`;
  }

  const hasAdj   = lower.includes('adjournment') || lower.includes('adjourned');
  const hasStay  = lower.includes('stay');
  const hasBail  = lower.includes('bail');
  const hasFinal = lower.includes('judgment') || lower.includes('disposed') || lower.includes('decree');
  const hasPetition = lower.includes('petition') || lower.includes('plaintiff');

  let brief = `This ${typeLabel} (${fileName}) has been analysed by the CourtMind AI engine. `;

  if (hasFinal) {
    brief += `The document records a final judicial determination. The court appears to have disposed of the matter or issued a conclusive ruling. `;
  } else if (hasAdj) {
    brief += `The document records an adjournment or deferral of proceedings. The case hearing has been rescheduled, which is a notable delay indicator. `;
  } else if (hasStay) {
    brief += `A stay order appears to be present in this document, temporarily halting proceedings or enforcement. `;
  } else if (hasBail) {
    brief += `This document relates to bail proceedings. The court has considered the conditions for temporary release of the accused. `;
  } else if (hasPetition) {
    brief += `This appears to be an initiating or subsequent petition filed before the court, laying out the grievances and prayers of the petitioning party. `;
  } else {
    brief += `The document contains legal proceedings language and appears to pertain to an active court matter. `;
  }

  brief += `The document spans approximately ${Math.max(1, Math.ceil(text.length / 2000))} page(s) of content. `;
  brief += `Key legal sections, party names, and critical dates have been extracted below.`;

  return brief;
}

function generateRiskFlags(
  text: string,
  delayRisk: 'low' | 'medium' | 'high',
  docType: string
): AIAnalysisResult['riskFlags'] {
  const flags: AIAnalysisResult['riskFlags'] = [];
  const lower = text.toLowerCase();

  if (delayRisk === 'high') {
    flags.push({ level: 'critical', text: 'High delay risk detected — multiple adjournments or stays may significantly extend case timelines.' });
  }
  if (lower.includes('contempt')) {
    flags.push({ level: 'critical', text: 'Contempt of court proceedings mentioned — immediate legal attention required.' });
  }
  if (lower.includes('adjournment') || lower.includes('adjourned')) {
    flags.push({ level: 'warning', text: 'Adjournment recorded — case hearing has been rescheduled; track new date closely.' });
  }
  if (lower.includes('deadline') || lower.includes('compliance')) {
    flags.push({ level: 'warning', text: 'Compliance deadline found — ensure all obligations are met before the specified date.' });
  }
  if (lower.includes('stay')) {
    flags.push({ level: 'warning', text: 'Stay order detected — enforcement of any previous order may be temporarily suspended.' });
  }
  if (delayRisk === 'medium') {
    flags.push({ level: 'warning', text: 'Moderate delay indicators present — monitor case progress and engage legal counsel if needed.' });
  }
  if (docType === 'petition') {
    flags.push({ level: 'info', text: 'Petition document — initial filing stage; case is at early proceedings.' });
  }
  if (lower.includes('section 138') || lower.includes('negotiable instrument')) {
    flags.push({ level: 'warning', text: 'Negotiable Instruments Act (cheque bounce) case — statutory timelines are strict.' });
  }
  if (flags.length === 0) {
    flags.push({ level: 'info', text: 'No critical flags detected. Document appears to be a routine legal filing.' });
  }
  return flags.slice(0, 5);
}

function generateDelayFactors(
  text: string,
  docType: string,
  risk: 'low' | 'medium' | 'high'
): AIAnalysisResult['delayFactors'] {
  const lower = text.toLowerCase();
  const adjCount = (lower.match(/adjournment|adjourned/g) || []).length;
  const hasWitness = lower.includes('witness') || lower.includes('evidence');
  const hasTransfer = lower.includes('transfer');

  return [
    {
      name: 'Adjournment Frequency',
      impact: adjCount > 1 ? 'negative' : 'positive',
      score: Math.min(0.45, adjCount * 0.15 + 0.05),
      description: adjCount > 1
        ? `${adjCount} adjournment references found — high frequency increases delay probability.`
        : 'Low adjournment frequency — case is progressing normally.',
    },
    {
      name: 'Document Complexity',
      impact: text.length > 3000 ? 'negative' : 'positive',
      score: text.length > 3000 ? 0.32 : 0.12,
      description: text.length > 3000
        ? 'Complex multi-page document with extensive content.'
        : 'Concise document — typically resolves faster.',
    },
    {
      name: 'Case Stage',
      impact: docType === 'petition' ? 'negative' : 'positive',
      score: docType === 'petition' ? 0.28 : 0.15,
      description: docType === 'petition'
        ? 'Case at petition stage — earlier stages tend to have longer trajectories.'
        : 'Document type suggests later proceedings stage.',
    },
    {
      name: 'Witness / Evidence Pending',
      impact: hasWitness ? 'negative' : 'positive',
      score: hasWitness ? 0.22 : 0.08,
      description: hasWitness
        ? 'Evidence or witness mentions detected — examination phases add to timelines.'
        : 'No pending witness references found.',
    },
    {
      name: 'Transfer Risk',
      impact: hasTransfer ? 'negative' : 'positive',
      score: hasTransfer ? 0.18 : 0.05,
      description: hasTransfer
        ? 'Transfer of case mentioned — jurisdictional changes extend proceedings.'
        : 'No transfer indicators found.',
    },
    {
      name: 'Court Disposal Rate',
      impact: risk === 'high' ? 'negative' : 'positive',
      score: risk === 'high' ? 0.15 : 0.20,
      description: risk === 'high'
        ? 'Based on case profile, court disposal rates are lower for similar cases.'
        : 'Court disposal rate is favourable for this case type.',
    },
  ];
}

/* ── Public API ─────────────────────────────────────────────────────────── */

export async function analyseDocument(
  file: File,
  docType: string,
  caseNumber: string
): Promise<AIAnalysisResult> {
  const rawText = await extractPdfText(file);

  const { risk, confidence } = scoreDelayRisk(rawText, docType);
  const parties  = extractParties(rawText);
  const judges   = extractJudges(rawText);
  const dates    = Array.from(new Set((rawText.match(DATE_RE) || []))).slice(0, 6);
  const sections = Array.from(new Set(
    (rawText.match(SECTION_RE) || []).map(s => s.trim()).filter(s => s.length < 40)
  )).slice(0, 6);

  return {
    fileName:        file.name,
    fileSize:        file.size,
    docType,
    caseNumber:      caseNumber || 'Not specified',
    processedAt:     new Date().toISOString(),
    brief:           generateBrief(rawText, file.name, docType),
    parties,
    judges,
    dates,
    sections,
    riskFlags:       generateRiskFlags(rawText, risk, docType),
    delayRisk:       risk,
    delayConfidence: confidence,
    delayFactors:    generateDelayFactors(rawText, docType, risk),
    rawTextSnippet:  rawText.slice(0, 400) || '(No extractable text — likely a scanned image PDF)',
  };
}
