import { Command } from 'commander';
import { fileCommand } from './commands/file.js';
import { dirCommand } from './commands/dir.js';
import { initCommand } from './commands/init.js';
import { glossaryCommand } from './commands/glossary.js';
import { serveCommand } from './commands/serve.js';

const program = new Command();

program
  .name('llm-translate')
  .description(
    'CLI-based document translation tool powered by LLMs with glossary enforcement'
  )
  .version('0.1.0')
  .enablePositionalOptions()
  .passThroughOptions();

// ============================================================================
// Global Options (for stdin/stdout mode)
// ============================================================================

program
  .option('-s, --source-lang <lang>', 'Source language code')
  .option('-t, --target-lang <lang>', 'Target language code')
  .option(
    '-c, --config <path>',
    'Path to config file (default: .translaterc.json)'
  )
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-q, --quiet', 'Suppress non-error output');

// ============================================================================
// Commands
// ============================================================================

program.addCommand(fileCommand);
program.addCommand(dirCommand);
program.addCommand(initCommand);
program.addCommand(glossaryCommand);
program.addCommand(serveCommand);

// ============================================================================
// Stdin/Stdout Mode (default when no command specified)
// ============================================================================

program.action(async (options) => {
  // Handle stdin/stdout translation when piped
  if (!process.stdin.isTTY) {
    const { handleStdinTranslation } = await import('./commands/file.js');
    await handleStdinTranslation(options);
  } else {
    program.help();
  }
});

// ============================================================================
// Parse and Execute
// ============================================================================

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error('Error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
