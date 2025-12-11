import { Command } from 'commander';
import { writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { TranslateConfig } from '../../types/index.js';

const defaultConfig: TranslateConfig = {
  version: '1.0',
  project: {
    name: 'My Project',
    description: 'Project description',
    purpose: 'Technical documentation translation',
  },
  languages: {
    source: 'en',
    targets: ['ko'],
  },
  provider: {
    default: 'claude',
    model: 'claude-sonnet-4-20250514',
  },
  quality: {
    threshold: 85,
    maxIterations: 4,
    evaluationMethod: 'llm',
  },
  chunking: {
    maxTokens: 1024,
    overlapTokens: 150,
    preserveStructure: true,
  },
  paths: {
    output: './docs/{lang}',
    cache: './.translate-cache',
  },
  ignore: ['**/node_modules/**', '**/*.test.md'],
};

export const initCommand = new Command('init')
  .description('Initialize project configuration')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(async (options: { force?: boolean }) => {
    const configPath = join(process.cwd(), '.translaterc.json');

    // Check if config already exists
    if (!options.force) {
      try {
        await access(configPath);
        console.error(
          'Configuration file already exists. Use --force to overwrite.'
        );
        process.exit(1);
      } catch {
        // File doesn't exist, continue
      }
    }

    try {
      await writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
      console.log('Created .translaterc.json');
      console.log('\nNext steps:');
      console.log('1. Edit .translaterc.json to configure your project');
      console.log('2. Set your API key: export ANTHROPIC_API_KEY=your-key');
      console.log('3. Run: llm-translate file <input> -s en -t ko');
    } catch (error) {
      console.error('Failed to create configuration file:', error);
      process.exit(1);
    }
  });
