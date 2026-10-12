import fs from 'fs';
import path from 'path';

/**
 * Chargeur de base de connaissances (Section 8).
 * Charge les sections pertinentes du document docs/knowledge/getspecial-base-de-connaissances.md
 */

const KNOWLEDGE_PATH = path.join(process.cwd(), 'docs', 'knowledge', 'getspecial-base-de-connaissances.md');

export interface KnowledgeSection {
  sectionNumber: string;
  title: string;
  content: string;
}

export function loadKnowledgeSections(requestedSections: string[] = ['5.8', '7', '10', '12', '13']): string {
  if (!fs.existsSync(KNOWLEDGE_PATH)) {
    console.warn(`[KNOWLEDGE_BASE_NOTICE] Fichier non trouvé : ${KNOWLEDGE_PATH}. Poursuite sans injection de connaissances.`);
    return '';
  }

  try {
    const rawContent = fs.readFileSync(KNOWLEDGE_PATH, 'utf8');
    const sections: KnowledgeSection[] = [];
    const lines = rawContent.split('\n');

    let currentSection: KnowledgeSection | null = null;

    for (const line of lines) {
      const match = line.match(/^#{1,3}\s+(\d+(?:\.\d+)?)\s+(.*)/);
      if (match) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          sectionNumber: match[1],
          title: match[2],
          content: '',
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }
    if (currentSection) sections.push(currentSection);

    // Filtrer par sections demandées
    const filtered = sections.filter((s) =>
      requestedSections.some((req) => s.sectionNumber === req || s.sectionNumber.startsWith(req + '.'))
    );

    return filtered.map((s) => `### SECTION ${s.sectionNumber} : ${s.title}\n${s.content.trim()}`).join('\n\n');
  } catch (err: any) {
    console.warn(`[KNOWLEDGE_BASE_WARNING] Erreur de lecture de la base de connaissances : ${err.message}`);
    return '';
  }
}
