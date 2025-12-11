# Project Guidelines for llm-translate

This document provides essential guidelines for AI assistants working on the llm-translate project. All implementations MUST adhere to the specifications defined in `RFC.md`.

## Project Overview

**llm-translate** is a CLI-based document translation tool powered by Large Language Models. It ensures translation consistency through glossary enforcement, context-aware chunking, and iterative quality refinement.

## Core Principles

1. **RFC.md is the source of truth** - All implementations must follow the RFC specification
2. **Glossary enforcement is mandatory** - Domain-specific terminology must be translated consistently
3. **Quality-aware refinement** - Use iterative Self-Refine loop until quality threshold is met
4. **Structure preservation** - AST-based processing must maintain document formatting integrity
5. **Provider-agnostic design** - Support Claude, OpenAI, Ollama via plugin architecture

## Technology Stack (MUST use)

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 24+ |
| Language | TypeScript 5.x |
| CLI Framework | Commander.js |
| Markdown Parser | unified/remark |
| HTML Parser | cheerio |
| LLM SDK | Vercel AI SDK |
| Testing | Vitest |
| Build | tsup |
| Module System | ESM only |

## Project Structure

```
src/
├── cli/           # CLI entry point and commands
│   ├── commands/  # file, dir, init, glossary commands
│   └── options.ts # Shared CLI options
├── core/          # Translation engine components
│   ├── engine.ts  # Main translation engine
│   ├── agent.ts   # Self-refine translation agent
│   ├── chunker.ts # Semantic document chunker
│   └── evaluator.ts # Quality evaluation
├── parsers/       # Format-specific parsers
│   ├── markdown.ts
│   ├── html.ts
│   └── plaintext.ts
├── providers/     # LLM provider adapters
│   ├── interface.ts # Provider interface (LLMProvider)
│   ├── registry.ts  # Provider registry with fallback
│   ├── claude.ts
│   ├── openai.ts
│   └── ollama.ts
├── services/      # Supporting services
│   ├── glossary.ts # Glossary loading and resolution
│   ├── cache.ts    # Translation cache
│   └── config.ts   # Configuration loader
├── types/         # Shared type definitions
│   └── index.ts
├── utils/         # Utilities
│   ├── tokens.ts  # Token counting
│   └── logger.ts  # Logging
└── errors.ts      # Error types and codes
```

## Key Interfaces

### LLMProvider Interface

All providers MUST implement this interface:

```typescript
interface LLMProvider {
  readonly name: ProviderName;
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): AsyncIterable<string>;
  countTokens(text: string): number;
  getModelInfo(model?: string): ModelInfo;
}
```

### Translation Agent Flow

The Self-Refine translation algorithm MUST follow this flow:

1. **PREPARE** - Load glossary, build context
2. **INITIAL TRANSLATE** - Generate first translation with glossary injection
3. **EVALUATE QUALITY** - Score against threshold (default: 85)
4. **REFLECT** - Generate critique if quality not met
5. **IMPROVE** - Apply suggestions
6. **REPEAT** - Loop until quality >= threshold OR max iterations reached

### Glossary Resolution

When resolving glossary terms for a target language:

- `doNotTranslate: true` - Keep source term for ALL languages
- `doNotTranslateFor: ["ko", "ja"]` - Keep source for SPECIFIC languages
- Otherwise use `targets[targetLang]` or fallback to source

## CLI Commands

```
llm-translate file <input> [output]  # Single file translation
llm-translate dir <input> <output>   # Batch directory translation
llm-translate init                   # Initialize configuration
llm-translate glossary <subcommand>  # Manage glossary (list, validate, add, remove)
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | File not found |
| 4 | Quality threshold not met |
| 5 | Provider/API error |
| 6 | Glossary validation failed |

## Configuration

Configuration is loaded from `.translaterc.json` with this priority:
1. CLI arguments (highest)
2. Environment variables
3. Config file
4. Defaults (lowest)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `OLLAMA_BASE_URL` | Ollama server URL |

## Quality Thresholds

- Default quality threshold: 85/100
- Default max iterations: 4
- Evaluation criteria:
  - Semantic accuracy: 40 points
  - Fluency: 25 points
  - Glossary compliance: 20 points
  - Format preservation: 15 points

## Critical Rules

1. **NEVER translate content inside code blocks**
2. **ALWAYS apply glossary terms exactly as specified**
3. **PRESERVE all formatting** (markdown, HTML tags, links, tables)
4. **Keep URLs, file paths, and technical identifiers unchanged**
5. **Maintain header hierarchy in chunking**

## Testing Requirements

- Unit tests for: chunker, glossary, markdown parser, providers
- Integration tests for full translation pipeline
- Test coverage target: > 80%
- Use Vitest with ESM configuration

## Error Handling

Use the `TranslationError` class with appropriate `ErrorCode`:

```typescript
throw new TranslationError(ErrorCode.GLOSSARY_NOT_FOUND, {
  path: glossaryPath,
});
```

## Implementation Phases

### Phase 1 (MVP)
- Single file translation with Claude
- Basic glossary support
- Markdown parser
- stdin/stdout support

### Phase 2
- OpenAI and Ollama providers
- Quality evaluator with LLM scoring
- Full Self-Refine loop
- HTML parser
- Cache manager

### Phase 3
- Batch directory processing
- Parallel file translation
- Progress reporting
- Integration tests

## Development Commands

```bash
npm run build      # Build with tsup
npm run dev        # Watch mode
npm test           # Run Vitest
npm run typecheck  # TypeScript check
npm run lint       # ESLint
```

## Code Style

- Use strict TypeScript (strict: true in tsconfig)
- Prefer async/await over callbacks
- Use Zod for runtime validation of config/glossary
- Export types from `src/types/index.ts`
- All public APIs must have JSDoc comments
