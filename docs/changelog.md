# Changelog

All notable changes to llm-translate will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Prompt caching support for Claude models (40-50% cost reduction)
- Cache token usage tracking in translation results
- `enableCaching` option in TranslationAgent
- `cacheRead` and `cacheWrite` fields in token usage metadata

### Changed

- `ChatMessage.content` now supports cacheable text parts
- `ChatResponse.usage` includes cache token metrics
- Default model updated to `claude-haiku-4-5-20251001`

## [0.1.0] - 2025-12-12

### Added

- Initial release
- Single file translation (`llm-translate file`)
- Directory batch translation (`llm-translate dir`)
- Configuration initialization (`llm-translate init`)
- Glossary management (`llm-translate glossary`)
- Claude, OpenAI, and Ollama provider support
- Self-Refine quality control loop
- Markdown AST-based chunking
- Glossary enforcement
- Quality threshold configuration
- Verbose output mode

### Providers

- Claude (claude-haiku-4-5, claude-sonnet-4-5, claude-opus-4-5)
- OpenAI (gpt-4o-mini, gpt-4o, gpt-4-turbo)
- Ollama (any local model)

### Documentation

- CLI reference documentation
- API reference documentation
- Getting started guide
- Configuration guide
- Glossary guide
- Quality control guide
- Cost optimization guide
