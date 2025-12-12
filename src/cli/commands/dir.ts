import { Command } from 'commander';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { resolve, dirname, relative, join } from 'node:path';
import type { DirCommandOptions } from '../options.js';
import { defaults } from '../options.js';
import { loadConfig, mergeConfig } from '../../services/config.js';
import { createTranslationEngine } from '../../core/engine.js';
import { logger, configureLogger } from '../../utils/logger.js';
import { TranslationError, getExitCode } from '../../errors.js';
import type { DocumentFormat, DocumentResult } from '../../types/index.js';

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
  .option('--include <patterns>', 'File patterns to include (comma-separated)', '*.md,*.markdown')
  .option('--exclude <patterns>', 'File patterns to exclude (comma-separated)')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-q, --quiet', 'Suppress non-error output')
  .action(async (input: string, output: string, options: DirCommandOptions & { include?: string; exclude?: string }) => {
    try {
      // Configure logger
      configureLogger({
        level: options.verbose ? 'debug' : 'info',
        quiet: options.quiet ?? false,
        json: options.json ?? false,
      });

      // Validate required options
      if (!options.targetLang) {
        console.error('Error: Target language (-t, --target-lang) is required');
        process.exit(2);
      }

      // Resolve paths
      const inputDir = resolve(input);
      const outputDir = resolve(output);

      // Parse include/exclude patterns
      const includePatterns = options.include?.split(',').map(p => p.trim()) ?? ['*.md', '*.markdown'];
      const excludePatterns = options.exclude?.split(',').map(p => p.trim()) ?? [];

      // Find all matching files (exclude output directory and locale directories)
      const files = await findFiles(inputDir, includePatterns, excludePatterns, outputDir);

      if (files.length === 0) {
        console.log('No files found matching the specified patterns');
        return;
      }

      if (!options.quiet) {
        logger.info(`Found ${files.length} file(s) to translate`);
        logger.info(`Input: ${inputDir}`);
        logger.info(`Output: ${outputDir}`);
        logger.info(`Target language: ${options.targetLang}`);
        if (options.glossary) {
          logger.info(`Glossary: ${resolve(options.glossary)}`);
        }
      }

      // Dry run - just show what would be done
      if (options.dryRun) {
        console.log('\nDry run mode - no translation will be performed\n');
        console.log('Files to translate:');
        for (const file of files) {
          const relativePath = relative(inputDir, file);
          const outputPath = join(outputDir, relativePath);
          console.log(`  ${relativePath} → ${relative(process.cwd(), outputPath)}`);
        }
        console.log(`\nTotal: ${files.length} file(s)`);
        return;
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
        noCache: options.cache === false,
      });

      // Create translation engine
      const engine = createTranslationEngine({
        config,
        verbose: options.verbose,
        noCache: options.cache === false,
      });

      // Process files
      const parallelCount = typeof options.parallel === 'string'
        ? parseInt(options.parallel, 10)
        : (options.parallel ?? defaults.parallel);

      if (!options.quiet) {
        logger.info(`Parallel processing: ${parallelCount} file(s) at a time`);
      }

      const results = await processFiles(
        files,
        inputDir,
        outputDir,
        engine,
        options,
        parallelCount
      );

      // Output results
      outputResults(results, options);

    } catch (error) {
      if (error instanceof TranslationError) {
        console.error(`Error: ${error.message}`);
        process.exit(getExitCode(error));
      }
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ============================================================================
// Types
// ============================================================================

interface FileResult {
  inputPath: string;
  outputPath: string;
  relativePath: string;
  success: boolean;
  error?: string;
  result?: DocumentResult;
  duration: number;
}

interface DirResults {
  files: FileResult[];
  totalDuration: number;
  successCount: number;
  failCount: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  totalCacheRead: number;
  totalCacheWrite: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find all files matching the include patterns and not matching exclude patterns
 */
async function findFiles(
  dir: string,
  includePatterns: string[],
  excludePatterns: string[],
  outputDir?: string
): Promise<string[]> {
  const files: string[] = [];

  // If output is inside input dir, exclude it
  const outputRelative = outputDir ? relative(dir, outputDir) : null;
  const isOutputInsideInput = outputRelative && !outputRelative.startsWith('..');

  async function scan(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      const relativePath = relative(dir, fullPath);

      // Skip hidden files and directories
      if (entry.name.startsWith('.')) {
        continue;
      }

      if (entry.isDirectory()) {
        // Skip output directory if it's inside input directory
        if (isOutputInsideInput && relativePath === outputRelative) {
          continue;
        }

        // Also skip common locale directories (2-letter codes like ko, ja, zh)
        if (/^[a-z]{2}(-[A-Z]{2})?$/.test(entry.name)) {
          continue;
        }

        // Check if directory should be excluded
        if (!matchesPatterns(relativePath + '/', excludePatterns)) {
          await scan(fullPath);
        }
      } else if (entry.isFile()) {
        // Check if file matches include patterns and not exclude patterns
        if (
          matchesPatterns(entry.name, includePatterns) &&
          !matchesPatterns(relativePath, excludePatterns)
        ) {
          files.push(fullPath);
        }
      }
    }
  }

  await scan(dir);
  return files.sort();
}

/**
 * Check if a path matches any of the given glob patterns
 */
function matchesPatterns(path: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (matchGlob(path, pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Simple glob matching (supports * and **)
 */
function matchGlob(path: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special chars
    .replace(/\*\*/g, '{{DOUBLESTAR}}')   // Temp placeholder for **
    .replace(/\*/g, '[^/]*')              // * matches anything except /
    .replace(/{{DOUBLESTAR}}/g, '.*')     // ** matches anything including /
    .replace(/\?/g, '.');                  // ? matches single char

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Process files with parallel execution using worker pool pattern.
 * As soon as one file completes, the next file starts immediately.
 */
async function processFiles(
  files: string[],
  inputDir: string,
  outputDir: string,
  engine: ReturnType<typeof createTranslationEngine>,
  options: DirCommandOptions & { include?: string; exclude?: string },
  parallelCount: number
): Promise<DirResults> {
  const startTime = Date.now();
  const results: FileResult[] = new Array(files.length);
  let completed = 0;
  let nextIndex = 0;

  // Process a single file and return the result
  const processFile = async (inputPath: string, _index: number): Promise<FileResult> => {
    const relativePath = relative(inputDir, inputPath);
    const outputPath = join(outputDir, relativePath);
    const fileStartTime = Date.now();

    try {
      // Read input file
      const content = await readFile(inputPath, 'utf-8');

      // Translate
      const result = await engine.translateContent({
        content,
        sourceLang: options.sourceLang,
        targetLang: options.targetLang!,
        format: mapFormat(options.format),
        glossaryPath: options.glossary,
        qualityThreshold: options.quality ? parseInt(options.quality, 10) : undefined,
        maxIterations: options.maxIterations ? parseInt(options.maxIterations, 10) : undefined,
        context: options.context,
      });

      // Ensure output directory exists
      await mkdir(dirname(outputPath), { recursive: true });

      // Write output
      await writeFile(outputPath, result.content, 'utf-8');

      completed++;
      if (!options.quiet && !options.json) {
        const progress = `[${completed}/${files.length}]`;
        logger.success(`${progress} ${relativePath}`);
      }

      return {
        inputPath,
        outputPath,
        relativePath,
        success: true,
        result,
        duration: Date.now() - fileStartTime,
      };
    } catch (error) {
      completed++;
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (!options.quiet && !options.json) {
        const progress = `[${completed}/${files.length}]`;
        logger.error(`${progress} ${relativePath}: ${errorMessage}`);
      }

      return {
        inputPath,
        outputPath,
        relativePath,
        success: false,
        error: errorMessage,
        duration: Date.now() - fileStartTime,
      };
    }
  };

  // Worker function: continuously process files until none remain
  const worker = async (): Promise<void> => {
    while (true) {
      const index = nextIndex++;
      if (index >= files.length) break;

      const inputPath = files[index];
      if (!inputPath) break;

      const result = await processFile(inputPath, index);
      results[index] = result;
    }
  };

  // Start workers (up to parallelCount or file count, whichever is smaller)
  const workerCount = Math.min(parallelCount, files.length);
  const workers = Array.from({ length: workerCount }, () => worker());

  // Wait for all workers to complete
  await Promise.all(workers);

  // Calculate totals
  const successResults = results.filter(r => r.success && r.result);
  const totalTokensInput = successResults.reduce((sum, r) => sum + (r.result?.metadata.tokensUsed.input ?? 0), 0);
  const totalTokensOutput = successResults.reduce((sum, r) => sum + (r.result?.metadata.tokensUsed.output ?? 0), 0);
  const totalCacheRead = successResults.reduce((sum, r) => sum + (r.result?.metadata.tokensUsed.cacheRead ?? 0), 0);
  const totalCacheWrite = successResults.reduce((sum, r) => sum + (r.result?.metadata.tokensUsed.cacheWrite ?? 0), 0);

  return {
    files: results,
    totalDuration: Date.now() - startTime,
    successCount: results.filter(r => r.success).length,
    failCount: results.filter(r => !r.success).length,
    totalTokensInput,
    totalTokensOutput,
    totalCacheRead,
    totalCacheWrite,
  };
}

/**
 * Output results summary
 */
function outputResults(results: DirResults, options: DirCommandOptions): void {
  if (options.json) {
    console.log(JSON.stringify({
      success: results.failCount === 0,
      totalFiles: results.files.length,
      successCount: results.successCount,
      failCount: results.failCount,
      totalDuration: results.totalDuration,
      tokensUsed: {
        input: results.totalTokensInput,
        output: results.totalTokensOutput,
        cacheRead: results.totalCacheRead,
        cacheWrite: results.totalCacheWrite,
      },
      files: results.files.map(f => ({
        input: f.relativePath,
        output: f.outputPath,
        success: f.success,
        error: f.error,
        duration: f.duration,
        quality: f.result?.metadata.averageQuality ?? 0,
        tokens: f.result ? {
          input: f.result.metadata.tokensUsed.input,
          output: f.result.metadata.tokensUsed.output,
        } : undefined,
      })),
    }, null, 2));
    return;
  }

  if (options.quiet) {
    return;
  }

  console.log('');
  console.log('─'.repeat(60));
  console.log('  Translation Summary');
  console.log('─'.repeat(60));
  console.log(`  Files:      ${results.successCount} succeeded, ${results.failCount} failed`);
  console.log(`  Duration:   ${(results.totalDuration / 1000).toFixed(1)}s`);
  console.log(`  Tokens:     ${results.totalTokensInput.toLocaleString()} input / ${results.totalTokensOutput.toLocaleString()} output`);

  if (results.totalCacheRead > 0 || results.totalCacheWrite > 0) {
    console.log(`  Cache:      ${results.totalCacheRead.toLocaleString()} read / ${results.totalCacheWrite.toLocaleString()} write`);
  }

  if (results.failCount > 0) {
    console.log('');
    console.log('  Failed files:');
    for (const file of results.files.filter(f => !f.success)) {
      console.log(`    - ${file.relativePath}: ${file.error}`);
    }
  }

  console.log('─'.repeat(60));
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
