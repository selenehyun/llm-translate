import { Command } from 'commander';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, basename, extname } from 'node:path';
import { mkdir } from 'node:fs/promises';
import type { FileCommandOptions } from '../options.js';
import { defaults } from '../options.js';
import { loadConfig, mergeConfig } from '../../services/config.js';
import { createTranslationEngine } from '../../core/engine.js';
import { logger, configureLogger } from '../../utils/logger.js';
import { TranslationError, getExitCode } from '../../errors.js';
import type { DocumentFormat } from '../../types/index.js';

export const fileCommand = new Command('file')
  .description('Translate a single file')
  .argument('<input>', 'Input file path')
  .argument('[output]', 'Output file path (optional)')
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
  .option('-o, --output <path>', 'Output path')
  .option('-f, --format <fmt>', 'Force output format (md|html|txt)')
  .option('--dry-run', 'Show what would be translated')
  .option('--json', 'Output results as JSON')
  .option(
    '--chunk-size <tokens>',
    'Max tokens per chunk',
    String(defaults.chunkSize)
  )
  .option('--no-cache', 'Disable translation cache')
  .option('--context <text>', 'Additional context for translation')
  .option('--strict-quality', 'Fail if quality threshold is not met')
  .option('--strict-glossary', 'Fail if glossary terms are not applied')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-q, --quiet', 'Suppress non-error output')
  .action(async (input: string, output: string | undefined, options: FileCommandOptions) => {
    try {
      // Configure logger
      configureLogger({
        level: options.verbose ? 'debug' : 'info',
        quiet: options.quiet ?? false,
        json: options.json ?? false,
      });

      // Validate required options
      if (!options.sourceLang) {
        console.error('Error: Source language (-s, --source-lang) is required');
        process.exit(2);
      }

      if (!options.targetLang) {
        console.error('Error: Target language (-t, --target-lang) is required');
        process.exit(2);
      }

      // Load configuration
      const baseConfig = await loadConfig({ configPath: options.config });
      const config = mergeConfig(baseConfig, {
        sourceLang: options.sourceLang,
        targetLang: options.targetLang,
        provider: options.provider,
        model: options.model,
        quality: options.quality ? parseInt(options.quality, 10) : undefined,
        maxIterations: options.maxIterations ? parseInt(options.maxIterations, 10) : undefined,
        chunkSize: options.chunkSize ? parseInt(options.chunkSize, 10) : undefined,
        glossary: options.glossary,
        noCache: options.noCache,
      });

      // Read input file
      const inputPath = resolve(input);
      let content: string;

      try {
        content = await readFile(inputPath, 'utf-8');
      } catch (error) {
        console.error(`Error: Could not read file '${inputPath}'`);
        process.exit(3);
      }

      if (!options.quiet) {
        logger.info(`Reading: ${inputPath}`);
        logger.info(`Translating: ${options.sourceLang} → ${options.targetLang}`);
      }

      // Dry run - just show what would be done
      if (options.dryRun) {
        console.log('Dry run mode - no translation will be performed');
        console.log(`Input: ${inputPath}`);
        console.log(`Output: ${output ?? determineOutputPath(inputPath, options.targetLang)}`);
        console.log(`Source language: ${options.sourceLang}`);
        console.log(`Target language: ${options.targetLang}`);
        console.log(`Content length: ${content.length} characters`);
        return;
      }

      // Create translation engine
      const engine = createTranslationEngine({
        config,
        verbose: options.verbose,
      });

      // Translate content
      const result = await engine.translateContent({
        content,
        sourceLang: options.sourceLang,
        targetLang: options.targetLang,
        format: mapFormat(options.format),
        glossaryPath: options.glossary,
        qualityThreshold: options.quality ? parseInt(options.quality, 10) : undefined,
        maxIterations: options.maxIterations ? parseInt(options.maxIterations, 10) : undefined,
        context: options.context,
        strictQuality: options.strictQuality,
        strictGlossary: options.strictGlossary,
      });

      // Determine output path
      const outputPath = output ?? options.output ?? determineOutputPath(inputPath, options.targetLang);

      // Ensure output directory exists
      await mkdir(dirname(outputPath), { recursive: true });

      // Write output
      await writeFile(outputPath, result.content, 'utf-8');

      // Output results
      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          input: inputPath,
          output: outputPath,
          sourceLang: options.sourceLang,
          targetLang: options.targetLang,
          quality: result.metadata.averageQuality,
          duration: result.metadata.totalDuration,
          chunks: result.chunks.length,
          provider: result.metadata.provider,
          model: result.metadata.model,
          iterations: result.metadata.totalIterations,
          tokensUsed: result.metadata.tokensUsed,
        }, null, 2));
      } else if (!options.quiet) {
        logger.success(`Written to ${outputPath}`);
        console.log('');
        console.log('  Translation Summary:');
        console.log(`  - Model: ${result.metadata.provider}/${result.metadata.model}`);
        console.log(`  - Quality: ${result.metadata.averageQuality.toFixed(0)}/100`);
        console.log(`  - Chunks: ${result.chunks.length}`);
        console.log(`  - Iterations: ${result.metadata.totalIterations}`);
        console.log(`  - Tokens: ${result.metadata.tokensUsed.input.toLocaleString()} input / ${result.metadata.tokensUsed.output.toLocaleString()} output`);
        console.log(`  - Duration: ${(result.metadata.totalDuration / 1000).toFixed(1)}s`);
      }

    } catch (error) {
      if (error instanceof TranslationError) {
        console.error(`Error: ${error.message}`);
        process.exit(getExitCode(error));
      }
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Handle stdin/stdout translation mode
 */
export async function handleStdinTranslation(
  options: FileCommandOptions
): Promise<void> {
  try {
    // Configure logger for quiet mode (stdout is for translation output)
    configureLogger({
      level: 'error',
      quiet: true,
      json: false,
    });

    // Validate required options
    if (!options.sourceLang) {
      console.error('Error: Source language (-s, --source-lang) is required');
      process.exit(2);
    }

    if (!options.targetLang) {
      console.error('Error: Target language (-t, --target-lang) is required');
      process.exit(2);
    }

    // Read from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }
    const content = Buffer.concat(chunks).toString('utf-8');

    if (!content.trim()) {
      console.error('Error: No input provided');
      process.exit(2);
    }

    // Load configuration
    const baseConfig = await loadConfig({ configPath: options.config });
    const config = mergeConfig(baseConfig, {
      sourceLang: options.sourceLang,
      targetLang: options.targetLang,
      provider: options.provider,
      model: options.model,
      quality: options.quality ? parseInt(options.quality, 10) : undefined,
      maxIterations: options.maxIterations ? parseInt(options.maxIterations, 10) : undefined,
      glossary: options.glossary,
    });

    // Create translation engine
    const engine = createTranslationEngine({
      config,
      verbose: false,
    });

    // Translate content
    const result = await engine.translateContent({
      content,
      sourceLang: options.sourceLang,
      targetLang: options.targetLang,
      format: mapFormat(options.format),
      glossaryPath: options.glossary,
      qualityThreshold: options.quality ? parseInt(options.quality, 10) : undefined,
      maxIterations: options.maxIterations ? parseInt(options.maxIterations, 10) : undefined,
      context: options.context,
    });

    // Output to stdout
    process.stdout.write(result.content);

  } catch (error) {
    if (error instanceof TranslationError) {
      console.error(`Error: ${error.message}`);
      process.exit(getExitCode(error));
    }
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function determineOutputPath(inputPath: string, targetLang: string): string {
  const dir = dirname(inputPath);
  const ext = extname(inputPath);
  const base = basename(inputPath, ext);

  return resolve(dir, `${base}.${targetLang}${ext}`);
}

function mapFormat(format: string | undefined): DocumentFormat | undefined {
  if (!format) return undefined;

  switch (format.toLowerCase()) {
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'html':
      return 'html';
    case 'txt':
    case 'text':
      return 'text';
    default:
      return undefined;
  }
}
