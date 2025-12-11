import { Command } from 'commander';
import type { DirCommandOptions } from '../options.js';
import { defaults } from '../options.js';

export const dirCommand = new Command('dir')
  .description('Translate all files in a directory')
  .argument('<input>', 'Input directory path')
  .argument('<output>', 'Output directory path')
  .option('-s, --source-lang <lang>', 'Source language code')
  .option('-t, --target-lang <lang>', 'Target language code')
  .option('-g, --glossary <path>', 'Path to glossary file')
  .option(
    '-p, --provider <name>',
    'LLM provider (claude|openai|ollama)',
    defaults.provider
  )
  .option('-m, --model <name>', 'Model name')
  .option(
    '--quality <0-100>',
    'Quality threshold',
    String(defaults.quality)
  )
  .option(
    '--max-iterations <n>',
    'Max refinement iterations',
    String(defaults.maxIterations)
  )
  .option('-f, --format <fmt>', 'Force output format (md|html|txt)')
  .option('--dry-run', 'Show what would be translated')
  .option('--json', 'Output results as JSON')
  .option(
    '--chunk-size <tokens>',
    'Max tokens per chunk',
    String(defaults.chunkSize)
  )
  .option(
    '--parallel <n>',
    'Parallel file processing',
    String(defaults.parallel)
  )
  .option('--no-cache', 'Disable translation cache')
  .option('--context <text>', 'Additional context for translation')
  .action(async (input: string, output: string, options: DirCommandOptions) => {
    // TODO: Implement directory translation
    console.log('Directory translation not yet implemented');
    console.log('Input:', input);
    console.log('Output:', output);
    console.log('Options:', options);
  });
