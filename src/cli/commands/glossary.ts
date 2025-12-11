import { Command } from 'commander';
import { readFile, writeFile } from 'node:fs/promises';
import type { Glossary, GlossaryTerm } from '../../types/index.js';

export const glossaryCommand = new Command('glossary')
  .description('Manage glossary (add, remove, list, validate)');

// ============================================================================
// Subcommands
// ============================================================================

glossaryCommand
  .command('list')
  .description('List all terms in a glossary')
  .argument('<path>', 'Path to glossary file')
  .option('--lang <lang>', 'Filter by target language')
  .action(async (path: string, options: { lang?: string }) => {
    try {
      const glossary = await loadGlossary(path);
      console.log(`Glossary: ${glossary.metadata.name}`);
      console.log(`Source: ${glossary.metadata.sourceLang}`);
      console.log(`Targets: ${glossary.metadata.targetLangs.join(', ')}`);
      console.log(`Terms: ${glossary.terms.length}`);
      console.log('---');

      for (const term of glossary.terms) {
        if (term.doNotTranslate) {
          console.log(`  ${term.source} → [do not translate]`);
        } else if (options.lang && term.targets[options.lang]) {
          console.log(`  ${term.source} → ${term.targets[options.lang]}`);
        } else if (!options.lang) {
          const translations = Object.entries(term.targets)
            .map(([lang, val]) => `${lang}: ${val}`)
            .join(', ');
          console.log(`  ${term.source} → ${translations || '[no translations]'}`);
        }
      }
    } catch (error) {
      console.error('Failed to load glossary:', error);
      process.exit(1);
    }
  });

glossaryCommand
  .command('validate')
  .description('Validate a glossary file')
  .argument('<path>', 'Path to glossary file')
  .action(async (path: string) => {
    try {
      const glossary = await loadGlossary(path);
      const errors = validateGlossary(glossary);

      if (errors.length === 0) {
        console.log('Glossary is valid!');
        console.log(`  Name: ${glossary.metadata.name}`);
        console.log(`  Terms: ${glossary.terms.length}`);
        console.log(`  Source: ${glossary.metadata.sourceLang}`);
        console.log(`  Targets: ${glossary.metadata.targetLangs.join(', ')}`);
      } else {
        console.error('Glossary validation failed:');
        for (const error of errors) {
          console.error(`  - ${error}`);
        }
        process.exit(6); // GLOSSARY_VALIDATION_FAILED
      }
    } catch (error) {
      console.error('Failed to load glossary:', error);
      process.exit(1);
    }
  });

glossaryCommand
  .command('add')
  .description('Add a term to the glossary')
  .argument('<path>', 'Path to glossary file')
  .argument('<source>', 'Source term')
  .option('--target <lang:value...>', 'Target translations (e.g., ko:번역)')
  .option('--context <text>', 'Usage context')
  .option('--do-not-translate', 'Mark as do not translate')
  .action(
    async (
      path: string,
      source: string,
      options: {
        target?: string[];
        context?: string;
        doNotTranslate?: boolean;
      }
    ) => {
      try {
        const glossary = await loadGlossary(path);

        // Check if term already exists
        const existing = glossary.terms.find(
          (t) => t.source.toLowerCase() === source.toLowerCase()
        );
        if (existing) {
          console.error(`Term "${source}" already exists in glossary.`);
          process.exit(1);
        }

        // Parse targets
        const targets: Record<string, string> = {};
        if (options.target) {
          for (const t of options.target) {
            const [lang, ...rest] = t.split(':');
            if (lang && rest.length > 0) {
              targets[lang] = rest.join(':');
            }
          }
        }

        const newTerm: GlossaryTerm = {
          source,
          targets,
          context: options.context,
          doNotTranslate: options.doNotTranslate,
        };

        glossary.terms.push(newTerm);
        await writeFile(path, JSON.stringify(glossary, null, 2));
        console.log(`Added term: ${source}`);
      } catch (error) {
        console.error('Failed to add term:', error);
        process.exit(1);
      }
    }
  );

glossaryCommand
  .command('remove')
  .description('Remove a term from the glossary')
  .argument('<path>', 'Path to glossary file')
  .argument('<source>', 'Source term to remove')
  .action(async (path: string, source: string) => {
    try {
      const glossary = await loadGlossary(path);
      const index = glossary.terms.findIndex(
        (t) => t.source.toLowerCase() === source.toLowerCase()
      );

      if (index === -1) {
        console.error(`Term "${source}" not found in glossary.`);
        process.exit(1);
      }

      glossary.terms.splice(index, 1);
      await writeFile(path, JSON.stringify(glossary, null, 2));
      console.log(`Removed term: ${source}`);
    } catch (error) {
      console.error('Failed to remove term:', error);
      process.exit(1);
    }
  });

// ============================================================================
// Helper Functions
// ============================================================================

async function loadGlossary(path: string): Promise<Glossary> {
  const content = await readFile(path, 'utf-8');
  return JSON.parse(content) as Glossary;
}

function validateGlossary(glossary: Glossary): string[] {
  const errors: string[] = [];

  // Check metadata
  if (!glossary.metadata) {
    errors.push('Missing metadata section');
  } else {
    if (!glossary.metadata.name) {
      errors.push('Missing metadata.name');
    }
    if (!glossary.metadata.sourceLang) {
      errors.push('Missing metadata.sourceLang');
    }
    if (
      !glossary.metadata.targetLangs ||
      glossary.metadata.targetLangs.length === 0
    ) {
      errors.push('Missing or empty metadata.targetLangs');
    }
  }

  // Check terms
  if (!glossary.terms || !Array.isArray(glossary.terms)) {
    errors.push('Missing or invalid terms array');
  } else {
    const seenSources = new Set<string>();

    for (let i = 0; i < glossary.terms.length; i++) {
      const term = glossary.terms[i];
      if (!term) continue;

      if (!term.source) {
        errors.push(`Term at index ${i}: missing source`);
        continue;
      }

      // Check for duplicates
      const normalizedSource = term.source.toLowerCase();
      if (seenSources.has(normalizedSource)) {
        errors.push(`Duplicate term: "${term.source}"`);
      }
      seenSources.add(normalizedSource);

      // Check targets if not doNotTranslate
      if (!term.doNotTranslate && Object.keys(term.targets).length === 0) {
        // This is a warning, not an error - term might have doNotTranslateFor
        if (!term.doNotTranslateFor || term.doNotTranslateFor.length === 0) {
          errors.push(
            `Term "${term.source}": no translations and not marked as do-not-translate`
          );
        }
      }
    }
  }

  return errors;
}
