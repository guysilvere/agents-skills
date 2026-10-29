/**
 * sync-specs.ts — Ingestion des fichiers Markdown docs/specs/*.md dans Turso/SQLite
 * 
 * Usage:
 *   npx tsx sync-specs.ts [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';

export interface ParsedSpec {
  id: string;
  theme: string;
  title: string;
  summary: string;
  acceptanceCriteria: string[];
  status: 'DRAFT' | 'READY' | 'IN_PROGRESS' | 'TESTING' | 'DONE';
  priority: 'P0_BLOCKING' | 'P1_CORE' | 'P2_NICE_TO_HAVE';
}

export function parseSpecMarkdown(content: string, filename: string): ParsedSpec {
  const baseName = path.basename(filename, '.md');
  const specId = baseName.toUpperCase(); // ex: SPEC-AUTH-001

  // Extraction du titre (# Titre)
  const titleMatch = content.match(/^#\s+(?:SPEC-[A-Z0-9]+(?:\s*:\s*)?)?(.*)$/m);
  const title = titleMatch ? titleMatch[1].trim() : specId;

  // Extraction de la thématique
  let theme = 'Général';
  if (specId.includes('AUTH')) theme = 'Authentification';
  else if (specId.includes('PAY')) theme = 'Paiements';
  else if (specId.includes('PWA') || specId.includes('OFFLINE')) theme = 'PWA & Hors-ligne';
  else if (specId.includes('DASH')) theme = 'Dashboard';
  else if (specId.includes('MEDIA') || specId.includes('R2')) theme = 'Médias & Stockage';

  // Extraction du résumé / intent
  const intentMatch = content.match(/##\s+Intent\s*\n+([\s\S]*?)(?=\n##|\n$)/i);
  const summary = intentMatch ? intentMatch[1].trim() : title;

  // Extraction des critères d'acceptation (DoD / Exigences)
  const criteria: string[] = [];
  const dodMatch = content.match(/##\s+(?:Critères d'acceptation|DoD|Exigences)\s*\n+([\s\S]*?)(?=\n##|\n$)/i);
  if (dodMatch) {
    const lines = dodMatch[1].split('\n');
    for (const line of lines) {
      const bullet = line.match(/^[-*]\s*(?:\[[ xX]\]\s*)?(.*)$/);
      if (bullet && bullet[1].trim()) {
        criteria.push(bullet[1].trim());
      }
    }
  }

  // Statut déduit
  let status: ParsedSpec['status'] = 'READY';
  if (content.includes('Statut: DONE') || content.includes('Status: DONE')) {
    status = 'DONE';
  } else if (content.includes('Statut: IN_PROGRESS')) {
    status = 'IN_PROGRESS';
  }

  // Priorité déduite
  let priority: ParsedSpec['priority'] = 'P1_CORE';
  if (content.includes('P0') || content.includes('BLOQUANT')) {
    priority = 'P0_BLOCKING';
  } else if (content.includes('P2') || content.includes('NICE_TO_HAVE')) {
    priority = 'P2_NICE_TO_HAVE';
  }

  return {
    id: specId,
    theme,
    title,
    summary,
    acceptanceCriteria: criteria.length > 0 ? criteria : ['Validation des exigences de la spec'],
    status,
    priority,
  };
}

export function scanSpecsDirectory(specsDir = 'docs/specs'): ParsedSpec[] {
  if (!fs.existsSync(specsDir)) {
    return [];
  }

  const files = fs.readdirSync(specsDir).filter(f => f.endsWith('.md') && f.startsWith('SPEC-'));
  return files.map(file => {
    const fullPath = path.join(specsDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    return parseSpecMarkdown(content, file);
  });
}
