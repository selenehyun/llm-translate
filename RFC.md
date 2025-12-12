# RFC: Consistent LLM-Powered CLI Translation Tool

**Project Name:** `llm-translate`
**Version:** 0.1.0
**Status:** Draft
**Author:** Tim Kang
**Date:** December 2025

---

## 1. Executive Summary

This document specifies the design and implementation requirements for a CLI-based document translation tool powered by Large Language Models. The tool ensures **translation consistency** through glossary enforcement, context-aware chunking, and iterative quality refinement. It supports multiple document formats (Markdown, HTML, plain text), multiple LLM providers (Claude, OpenAI, Ollama), and both single-file and batch directory processing.

### 1.1 Key Differentiators

- **Glossary-enforced consistency**: Domain-specific terminology is translated consistently across documents
- **Quality-aware refinement**: Iterative improvement loop until target quality threshold is met
- **Provider-agnostic**: Plugin architecture supports Claude, OpenAI, local LLMs, and custom providers
- **Structure preservation**: AST-based processing maintains document formatting integrity
- **Unix-friendly**: Supports stdin/stdout for pipeline integration

---

## 2. Goals and Non-Goals

### 2.1 Goals

| ID | Goal | Priority |
|----|------|----------|
| G1 | Translate documents while enforcing glossary terminology | P0 |
| G2 | Support Markdown, HTML, and plain text formats | P0 |
| G3 | Preserve document structure (headers, code blocks, tables, links) | P0 |
| G4 | Iteratively refine translations until quality threshold is met | P0 |
| G5 | Support multiple LLM providers via plugin architecture | P0 |
| G6 | Process single files via stdin/stdout | P0 |
| G7 | Batch process directories with configurable patterns | P1 |
| G8 | Cache translations to avoid redundant API calls | P1 |
| G9 | Expose functionality via MCP server for agent integration | P2 |
| G10 | Support Translation Memory (TMX) for leveraging past translations | P2 |

### 2.2 Non-Goals

- Real-time/streaming translation of live content
- GUI or web interface (CLI only)
- Translation of binary formats (PDF, DOCX) — future consideration
- Built-in OCR or image text extraction
- Automated glossary generation from source documents

---

## 3. User Stories

### 3.1 Primary Use Cases

**UC1: Single File Translation (stdin/stdout)**
```bash
cat README.md | llm-translate -s en -t ko > README.ko.md
```

**UC2: Single File Translation (file paths)**
```bash
llm-translate file docs/guide.md -s en -t ko -o docs/ko/guide.md
```

**UC3: Directory Batch Translation**
```bash
llm-translate dir ./docs ./docs/ko -s en -t ko --glossary ./glossary.json
```

**UC4: Translation with Custom Quality Threshold**
```bash
llm-translate file spec.md -s en -t ja -q 90 --max-iterations 5
```

**UC5: Using Different LLM Provider**
```bash
llm-translate file doc.md -s en -t ko --provider openai --model gpt-4o
```

**UC6: Initialize Project Configuration**
```bash
llm-translate init
# Creates .translaterc.json with default settings
```

---

## 4. Technical Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI Layer                                 │
│                     (Commander.js)                               │
├─────────────────────────────────────────────────────────────────┤
│                    Translation Engine                            │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────────┐  │
│  │   Format    │  │  Semantic   │  │   Quality              │  │
│  │   Parsers   │  │  Chunker    │  │   Evaluator            │  │
│  └─────────────┘  └─────────────┘  └────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Translation Agent (Self-Refine Loop)            │  │
│  │     Initial → Reflect → Improve → Evaluate → Repeat       │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                 Provider Abstraction Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Claude  │  │  OpenAI  │  │  Ollama  │  │  Custom  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                    Supporting Services                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │  Glossary  │  │   Cache    │  │  Config    │               │
│  │  Manager   │  │  Manager   │  │  Loader    │               │
│  └────────────┘  └────────────┘  └────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Runtime | Node.js 24+ | LTS, native ESM support |
| Language | TypeScript 5.x | Type safety, ecosystem maturity |
| CLI Framework | Commander.js | Industry standard, excellent DX |
| Markdown Parser | unified/remark | 150+ plugins, AST-based |
| HTML Parser | cheerio | jQuery-like API, fast |
| LLM SDK | Vercel AI SDK | Multi-provider, streaming support |
| Testing | Vitest | Fast, ESM-native |
| Build | tsup | Simple, fast bundling |
| Package Manager | yarn | Modern, workspaces support |

### 4.3 Project Structure

```
llm-translate/
├── src/
│   ├── cli/
│   │   ├── index.ts              # Entry point
│   │   ├── commands/
│   │   │   ├── file.ts           # Single file command
│   │   │   ├── dir.ts            # Directory batch command
│   │   │   ├── init.ts           # Project initialization
│   │   │   └── glossary.ts       # Glossary management
│   │   └── options.ts            # Shared CLI options
│   ├── core/
│   │   ├── engine.ts             # Main translation engine
│   │   ├── agent.ts              # Self-refine translation agent
│   │   ├── chunker.ts            # Semantic document chunker
│   │   └── evaluator.ts          # Quality evaluation
│   ├── parsers/
│   │   ├── markdown.ts           # Markdown AST processing
│   │   ├── html.ts               # HTML processing
│   │   └── plaintext.ts          # Plain text processing
│   ├── providers/
│   │   ├── interface.ts          # Provider interface definition
│   │   ├── registry.ts           # Provider registry
│   │   ├── claude.ts             # Claude adapter
│   │   ├── openai.ts             # OpenAI adapter
│   │   └── ollama.ts             # Ollama adapter
│   ├── services/
│   │   ├── glossary.ts           # Glossary management
│   │   ├── cache.ts              # Translation cache
│   │   └── config.ts             # Configuration loader
│   ├── types/
│   │   └── index.ts              # Shared type definitions
│   └── utils/
│       ├── tokens.ts             # Token counting utilities
│       └── logger.ts             # Logging utilities
├── tests/
├── .translaterc.json             # Example config
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. Core Interfaces and Types

### 5.1 Configuration Types

```typescript
// src/types/config.ts

export interface TranslateConfig {
  version: string;
  project?: {
    name: string;
    description: string;
    purpose: string;  // Used for context if not specified per-request
  };
  languages: {
    source: string;   // ISO 639-1 code
    targets: string[];
    styles?: Record<string, string>;  // Per-language style instructions (e.g., { "ko": "경어체", "ja": "です・ます調" })
  };
  provider: {
    default: ProviderName;
    model?: string;
    fallback?: ProviderName[];
    apiKeys?: Record<ProviderName, string>;  // Optional, prefer env vars
  };
  quality: {
    threshold: number;        // 0-100, default: 85
    maxIterations: number;    // default: 4
    evaluationMethod: 'llm' | 'embedding' | 'hybrid';
  };
  chunking: {
    maxTokens: number;        // default: 1024
    overlapTokens: number;    // default: 150
    preserveStructure: boolean;
  };
  glossary?: {
    path: string;
    strict: boolean;          // Fail if glossary term not applied
  };
  paths: {
    output: string;           // Supports {lang} placeholder
    cache?: string;
  };
  ignore?: string[];          // Glob patterns to ignore
}

export type ProviderName = 'claude' | 'openai' | 'ollama' | 'custom';
```

### 5.2 Glossary Types

```typescript
// src/types/glossary.ts

export interface Glossary {
  metadata: {
    name: string;
    sourceLang: string;
    targetLangs: string[];           // Multiple target languages
    version: string;
    domain?: string;
  };
  terms: GlossaryTerm[];
}

export interface GlossaryTerm {
  source: string;
  targets: Record<string, string>;   // { "ko": "파드", "ja": "ポッド", "zh-CN": "Pod" }
  context?: string;                  // Usage context hint
  caseSensitive?: boolean;           // default: false
  doNotTranslate?: boolean;          // Keep source as-is for ALL languages
  doNotTranslateFor?: string[];      // Keep source as-is for SPECIFIC languages
  partOfSpeech?: 'noun' | 'verb' | 'adjective' | 'other';
  notes?: string;
}

// Runtime resolved glossary for a specific target language
export interface ResolvedGlossary {
  metadata: {
    name: string;
    sourceLang: string;
    targetLang: string;              // Single resolved target
    version: string;
    domain?: string;
  };
  terms: ResolvedGlossaryTerm[];
}

export interface ResolvedGlossaryTerm {
  source: string;
  target: string;                    // Resolved for specific language
  context?: string;
  caseSensitive: boolean;
  doNotTranslate: boolean;
}
```

### 5.3 Provider Interface

```typescript
// src/providers/interface.ts

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
  finishReason: 'stop' | 'length' | 'error';
}

export interface ModelInfo {
  maxContextTokens: number;
  supportsStreaming: boolean;
  costPer1kInput?: number;
  costPer1kOutput?: number;
}

export interface LLMProvider {
  readonly name: ProviderName;

  chat(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): AsyncIterable<string>;
  countTokens(text: string): number;
  getModelInfo(model?: string): ModelInfo;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
}
```

### 5.4 Translation Types

```typescript
// src/types/translation.ts

export interface TranslationRequest {
  content: string;
  sourceLang: string;
  targetLang: string;
  format: 'markdown' | 'html' | 'text';
  glossary?: Glossary;
  context?: {
    documentPurpose?: string;
    previousChunks?: string[];
    documentSummary?: string;
  };
  options?: {
    qualityThreshold?: number;
    maxIterations?: number;
    preserveFormatting?: boolean;
  };
}

export interface TranslationResult {
  content: string;
  metadata: {
    qualityScore: number;
    iterations: number;
    tokensUsed: {
      input: number;
      output: number;
    };
    duration: number;
    provider: string;
    model: string;
  };
  glossaryCompliance?: {
    applied: string[];
    missed: string[];
  };
}

export interface ChunkResult {
  original: string;
  translated: string;
  startOffset: number;
  endOffset: number;
  qualityScore: number;
}

export interface DocumentResult {
  content: string;
  chunks: ChunkResult[];
  metadata: {
    totalTokensUsed: number;
    totalDuration: number;
    averageQuality: number;
  };
}
```

### 5.5 Chunking Types

```typescript
// src/types/chunking.ts

export interface Chunk {
  id: string;
  content: string;
  type: 'translatable' | 'preserve';  // preserve = code blocks, etc.
  startOffset: number;
  endOffset: number;
  metadata?: {
    headerHierarchy?: string[];  // ["# Title", "## Section"]
    previousContext?: string;
  };
}

export interface ChunkingConfig {
  maxTokens: number;
  overlapTokens: number;
  separators: string[];
  preservePatterns: RegExp[];  // Patterns to keep intact (code blocks)
}
```

---

## 6. CLI Specification

### 6.1 Command Structure

```
llm-translate <command> [options]

Commands:
  file <input> [output]     Translate a single file
  dir <input> <output>      Translate all files in directory
  init                      Initialize project configuration
  glossary <subcommand>     Manage glossary (add, remove, list, validate)

Global Options:
  -s, --source-lang <lang>  Source language code (required)
  -t, --target-lang <lang>  Target language code (required)
  -c, --config <path>       Path to config file (default: .translaterc.json)
  -v, --verbose             Enable verbose logging
  -q, --quiet               Suppress non-error output
  --version                 Show version number
  --help                    Show help

Translation Options:
  -g, --glossary <path>     Path to glossary file
  -p, --provider <name>     LLM provider (claude|openai|ollama)
  -m, --model <name>        Model name
  --quality <0-100>         Quality threshold (default: 85)
  --max-iterations <n>      Max refinement iterations (default: 4)

Output Options:
  -o, --output <path>       Output path (file or directory)
  -f, --format <fmt>        Force output format (md|html|txt)
  --dry-run                 Show what would be translated
  --json                    Output results as JSON

Advanced Options:
  --chunk-size <tokens>     Max tokens per chunk (default: 1024)
  --parallel <n>            Parallel file processing (default: 3)
  --no-cache                Disable translation cache
  --context <text>          Additional context for translation
```

### 6.2 Usage Examples

```bash
# Basic single file translation
llm-translate file README.md -s en -t ko -o README.ko.md

# Stdin/stdout pipeline
cat doc.md | llm-translate -s en -t ja > doc.ja.md

# Batch directory with glossary
llm-translate dir ./docs ./docs/ko \
  -s en -t ko \
  --glossary ./k8s-glossary.json \
  --quality 90

# Using OpenAI instead of Claude
llm-translate file guide.md -s en -t de \
  --provider openai \
  --model gpt-4o

# Dry run to preview
llm-translate dir ./src ./src/i18n -s en -t ja --dry-run

# Initialize new project
llm-translate init

# Validate glossary
llm-translate glossary validate ./glossary.json
```

### 6.3 Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | File not found |
| 4 | Translation quality threshold not met |
| 5 | Provider/API error |
| 6 | Glossary validation failed |

---

## 7. Core Algorithm: Self-Refine Translation

### 7.1 Translation Agent Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    TRANSLATION AGENT                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐                                           │
│  │ 1. PREPARE   │ Load glossary, build context              │
│  └──────┬───────┘                                           │
│         ▼                                                    │
│  ┌──────────────┐                                           │
│  │ 2. INITIAL   │ Generate first translation                │
│  │   TRANSLATE  │ with glossary + context injection         │
│  └──────┬───────┘                                           │
│         ▼                                                    │
│  ┌──────────────┐     ┌─────────────────────────────┐       │
│  │ 3. EVALUATE  │────▶│ Quality >= Threshold?       │       │
│  │   QUALITY    │     │ OR Max iterations reached?  │       │
│  └──────┬───────┘     └─────────────┬───────────────┘       │
│         │                           │                        │
│         │ No                        │ Yes                    │
│         ▼                           ▼                        │
│  ┌──────────────┐           ┌──────────────┐                │
│  │ 4. REFLECT   │           │ 6. RETURN    │                │
│  │   Generate   │           │   Final      │                │
│  │   critique   │           │   Result     │                │
│  └──────┬───────┘           └──────────────┘                │
│         ▼                                                    │
│  ┌──────────────┐                                           │
│  │ 5. IMPROVE   │ Apply suggestions                         │
│  │   Refine     │─────────────────────────┐                 │
│  └──────────────┘                         │                 │
│         ▲                                 │                 │
│         └─────────────────────────────────┘                 │
│                    Loop back to EVALUATE                     │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Prompt Templates

**Initial Translation Prompt:**
```
You are a professional translator. Translate the following {sourceLang} text to {targetLang}.

## Glossary (MUST use these exact translations):
{glossaryTerms}

## Document Context:
Purpose: {documentPurpose}
Style: {styleInstruction}
Previous content: {previousContext}

## Rules:
1. Apply glossary terms exactly as specified
2. Preserve all formatting (markdown, HTML tags, code blocks)
3. Maintain the same tone and style
4. Do not translate content inside code blocks
5. Keep URLs, file paths, and technical identifiers unchanged

## Source Text:
{sourceText}

## Translation:
```

**Reflection Prompt:**
```
Review this translation and provide specific improvement suggestions.

## Source ({sourceLang}):
{sourceText}

## Translation ({targetLang}):
{translatedText}

## Glossary Requirements:
{glossaryTerms}

## Evaluate and suggest improvements for:
1. **Accuracy**: Does the translation convey the exact meaning?
2. **Glossary Compliance**: Are all glossary terms applied correctly?
3. **Fluency**: Does it read naturally in {targetLang}?
4. **Formatting**: Is the structure preserved?
5. **Consistency**: Are terms translated consistently?

Provide a numbered list of specific, actionable suggestions:
```

**Improvement Prompt:**
```
Improve this translation based on the following suggestions.

## Source ({sourceLang}):
{sourceText}

## Current Translation:
{currentTranslation}

## Improvement Suggestions:
{suggestions}

## Glossary (MUST apply):
{glossaryTerms}

Provide only the improved translation, nothing else:
```

### 7.3 Quality Evaluation

For MVP, use LLM-based evaluation:

```
Rate this translation's quality from 0 to 100.

## Source ({sourceLang}):
{sourceText}

## Translation ({targetLang}):
{translatedText}

## Evaluation Criteria:
- Semantic accuracy (40 points)
- Fluency and naturalness (25 points)
- Glossary compliance (20 points)
- Format preservation (15 points)

Respond with only a JSON object:
{"score": <number>, "breakdown": {"accuracy": <n>, "fluency": <n>, "glossary": <n>, "format": <n>}, "issues": ["issue1", "issue2"]}
```

**Prompt Variables:**

| Variable | Source | Description |
|----------|--------|-------------|
| `{sourceLang}` | `languages.source` | Source language code |
| `{targetLang}` | CLI argument or iteration | Target language code |
| `{glossaryTerms}` | Resolved glossary | Formatted glossary terms for target language |
| `{documentPurpose}` | `project.purpose` or `--context` | Document context description |
| `{styleInstruction}` | `languages.styles[targetLang]` | Per-language style instruction (e.g., "경어체", "です・ます調"). Empty if not specified. |
| `{previousContext}` | Previous chunks | Context from previously translated chunks |
| `{sourceText}` | Input content | Text to translate |
| `{translatedText}` | Translation result | Current translation (for reflection/evaluation) |

---

## 8. File Format Specifications

### 8.1 Configuration File (.translaterc.json)

```json
{
  "version": "1.0",
  "project": {
    "name": "Kubernetes Documentation",
    "description": "Official Kubernetes documentation translation",
    "purpose": "Technical documentation for DevOps engineers and developers"
  },
  "languages": {
    "source": "en",
    "targets": ["ko", "ja", "zh-CN"],
    "styles": {
      "ko": "경어체(존댓말)를 사용하세요",
      "ja": "敬語(です・ます調)を使用してください"
    }
  },
  "provider": {
    "default": "claude",
    "model": "claude-sonnet-4-20250514",
    "fallback": ["openai"]
  },
  "quality": {
    "threshold": 85,
    "maxIterations": 4,
    "evaluationMethod": "llm"
  },
  "chunking": {
    "maxTokens": 1024,
    "overlapTokens": 150,
    "preserveStructure": true
  },
  "glossary": {
    "path": "./glossary.json",
    "strict": false
  },
  "paths": {
    "output": "./docs/{lang}",
    "cache": "./.translate-cache"
  },
  "ignore": [
    "**/node_modules/**",
    "**/*.test.md",
    "**/drafts/**"
  ]
}
```

### 8.2 Glossary File (glossary.json)

```json
{
  "metadata": {
    "name": "Kubernetes Glossary",
    "sourceLang": "en",
    "targetLangs": ["ko", "ja", "zh-CN"],
    "version": "1.0.0",
    "domain": "cloud-native"
  },
  "terms": [
    {
      "source": "pod",
      "targets": {
        "ko": "파드",
        "ja": "ポッド",
        "zh-CN": "Pod"
      },
      "context": "Kubernetes resource unit",
      "caseSensitive": false
    },
    {
      "source": "deployment",
      "targets": {
        "ko": "디플로이먼트",
        "ja": "デプロイメント",
        "zh-CN": "部署"
      },
      "notes": "Some teams prefer keeping English in certain contexts"
    },
    {
      "source": "kubectl",
      "targets": {},
      "doNotTranslate": true
    },
    {
      "source": "service mesh",
      "targets": {
        "ko": "서비스 메시",
        "ja": "サービスメッシュ",
        "zh-CN": "服务网格"
      },
      "context": "Networking concept"
    },
    {
      "source": "container",
      "targets": {
        "ko": "컨테이너",
        "ja": "コンテナ",
        "zh-CN": "容器"
      }
    },
    {
      "source": "cluster",
      "targets": {
        "ko": "클러스터",
        "ja": "クラスター",
        "zh-CN": "集群"
      }
    },
    {
      "source": "node",
      "targets": {
        "ko": "노드",
        "ja": "ノード",
        "zh-CN": "节点"
      },
      "context": "Kubernetes worker machine"
    },
    {
      "source": "namespace",
      "targets": {
        "ko": "네임스페이스",
        "ja": "ネームスペース",
        "zh-CN": "命名空间"
      }
    },
    {
      "source": "ingress",
      "targets": {
        "ko": "인그레스",
        "ja": "Ingress",
        "zh-CN": "入口"
      },
      "doNotTranslateFor": ["ja"]
    },
    {
      "source": "ConfigMap",
      "targets": {},
      "doNotTranslate": true,
      "caseSensitive": true
    }
  ]
}
```

**Glossary Resolution Logic:**

```typescript
// src/services/glossary.ts

export function resolveGlossary(
  glossary: Glossary,
  targetLang: string
): ResolvedGlossary {
  return {
    metadata: {
      ...glossary.metadata,
      targetLang,
    },
    terms: glossary.terms.map(term => ({
      source: term.source,
      target: resolveTarget(term, targetLang),
      context: term.context,
      caseSensitive: term.caseSensitive ?? false,
      doNotTranslate: resolveDoNotTranslate(term, targetLang),
    })).filter(term => term.target !== undefined),
  };
}

function resolveTarget(term: GlossaryTerm, targetLang: string): string {
  if (term.doNotTranslate) return term.source;
  if (term.doNotTranslateFor?.includes(targetLang)) return term.source;
  return term.targets[targetLang] ?? term.source;
}

function resolveDoNotTranslate(term: GlossaryTerm, targetLang: string): boolean {
  return term.doNotTranslate || term.doNotTranslateFor?.includes(targetLang) || false;
}
```

### 8.3 Cache Structure (.translate-cache/)

```
.translate-cache/
├── index.json              # Cache index with file hashes
├── translations/
│   ├── {hash1}.json       # Cached translation result
│   ├── {hash2}.json
│   └── ...
└── glossary-compiled.json  # Pre-compiled glossary trie
```

**Cache Entry Format:**
```json
{
  "sourceHash": "sha256:abc123...",
  "sourceLang": "en",
  "targetLang": "ko",
  "glossaryHash": "sha256:def456...",
  "translation": "번역된 내용...",
  "qualityScore": 92,
  "createdAt": "2024-12-11T10:30:00Z",
  "provider": "claude",
  "model": "claude-sonnet-4-20250514"
}
```

---

## 9. Implementation Roadmap

### Phase 1: MVP

**Scope:** Single file translation with Claude, basic glossary support

| Task | Description | Estimate |
|------|-------------|----------|
| Project setup | TypeScript, tsup, vitest, Commander.js | 2h |
| Config loader | Parse .translaterc.json, merge CLI args | 3h |
| Claude provider | Implement LLMProvider interface | 4h |
| Basic chunker | Fixed-size token chunking | 3h |
| Markdown parser | Extract/restore text nodes via remark | 6h |
| Translation agent | Initial translate + single refine loop | 8h |
| Glossary loader | Parse JSON, build lookup map | 3h |
| CLI: file command | Single file translate with stdin/stdout | 4h |
| Basic tests | Unit tests for core components | 4h |
| **Total** | | **37h** |

**MVP Deliverable:**
```bash
cat doc.md | llm-translate -s en -t ko --glossary ./glossary.json
```

### Phase 2: Quality & Providers

| Task | Description | Estimate |
|------|-------------|----------|
| OpenAI provider | Implement adapter | 3h |
| Ollama provider | Implement adapter | 3h |
| Provider registry | Dynamic loading, fallback logic | 4h |
| Quality evaluator | LLM-based scoring | 4h |
| Iterative refinement | Full Self-Refine loop | 6h |
| HTML parser | Cheerio-based processing | 4h |
| Semantic chunker | Structure-aware splitting | 6h |
| Cache manager | File-based caching with hashing | 4h |
| **Total** | | **34h** |

### Phase 3: Batch & Polish

| Task | Description | Estimate |
|------|-------------|----------|
| CLI: dir command | Batch directory processing | 6h |
| Parallel processing | Concurrent file translation | 4h |
| Progress reporting | CLI progress bar, summary stats | 3h |
| CLI: init command | Interactive project setup | 3h |
| CLI: glossary commands | add, remove, list, validate | 4h |
| Error handling | Comprehensive error messages | 4h |
| Documentation | README, usage guide | 4h |
| Integration tests | End-to-end test suite | 6h |
| **Total** | | **34h** |

### Phase 4: Advanced Features (Future)

- MCP server implementation
- Translation Memory (TMX) support
- Embedding-based quality evaluation (COMET)
- RAG integration for context retrieval
- Watch mode for continuous translation
- VS Code extension

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
// tests/chunker.test.ts
describe('SemanticChunker', () => {
  it('should respect maxTokens limit', () => {});
  it('should preserve code blocks intact', () => {});
  it('should maintain overlap between chunks', () => {});
  it('should handle empty input', () => {});
});

// tests/glossary.test.ts
describe('GlossaryManager', () => {
  it('should find exact matches', () => {});
  it('should handle case sensitivity', () => {});
  it('should return doNotTranslate terms', () => {});
});

// tests/markdown.test.ts
describe('MarkdownParser', () => {
  it('should extract text nodes', () => {});
  it('should preserve code blocks', () => {});
  it('should maintain header hierarchy', () => {});
  it('should handle nested structures', () => {});
});
```

### 10.2 Integration Tests

```typescript
// tests/integration/translation.test.ts
describe('Translation Pipeline', () => {
  it('should translate markdown with glossary enforcement', async () => {
    const result = await translate({
      content: '# Deploy a Pod\nCreate a deployment...',
      sourceLang: 'en',
      targetLang: 'ko',
      glossary: k8sGlossary,
    });

    expect(result.content).toContain('파드');
    expect(result.content).toContain('디플로이먼트');
    expect(result.metadata.qualityScore).toBeGreaterThan(80);
  });
});
```

### 10.3 Test Fixtures

```
tests/fixtures/
├── input/
│   ├── simple.md
│   ├── with-code-blocks.md
│   ├── complex-structure.md
│   └── html-document.html
├── expected/
│   ├── simple.ko.md
│   ├── with-code-blocks.ko.md
│   └── ...
└── glossaries/
    ├── k8s-en-ko.json
    └── general-en-ja.json
```

---

## 11. Error Handling

### 11.1 Error Types

```typescript
// src/errors.ts

export class TranslationError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}

export enum ErrorCode {
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  CONFIG_INVALID = 'CONFIG_INVALID',
  GLOSSARY_NOT_FOUND = 'GLOSSARY_NOT_FOUND',
  GLOSSARY_INVALID = 'GLOSSARY_INVALID',
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_AUTH_FAILED = 'PROVIDER_AUTH_FAILED',
  PROVIDER_RATE_LIMITED = 'PROVIDER_RATE_LIMITED',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  QUALITY_THRESHOLD_NOT_MET = 'QUALITY_THRESHOLD_NOT_MET',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  CHUNK_TOO_LARGE = 'CHUNK_TOO_LARGE',
}
```

### 11.2 User-Friendly Messages

```typescript
const errorMessages: Record<ErrorCode, string> = {
  CONFIG_NOT_FOUND: 'Configuration file not found. Run `llm-translate init` to create one.',
  PROVIDER_AUTH_FAILED: 'Authentication failed. Check your API key in environment variables.',
  QUALITY_THRESHOLD_NOT_MET: 'Translation quality ({score}) did not meet threshold ({threshold}). Use --quality to adjust or --max-iterations to allow more refinement.',
  // ...
};
```

---

## 12. Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Claude API key | If using Claude |
| `OPENAI_API_KEY` | OpenAI API key | If using OpenAI |
| `OLLAMA_BASE_URL` | Ollama server URL | If using Ollama (default: http://localhost:11434) |
| `LLM_TRANSLATE_CONFIG` | Default config file path | No |
| `LLM_TRANSLATE_CACHE_DIR` | Cache directory path | No |
| `LLM_TRANSLATE_LOG_LEVEL` | Log level (debug/info/warn/error) | No |

---

## 13. Success Criteria

### 13.1 Functional Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR1 | Glossary enforcement | 100% of glossary terms applied correctly |
| FR2 | Format preservation | Markdown/HTML structure identical after translation |
| FR3 | Quality threshold | Default 85% quality score achieved |
| FR4 | Multi-provider | Claude, OpenAI, Ollama all functional |
| FR5 | Batch processing | 100+ files processed without failure |
| FR6 | stdin/stdout | Piped input/output works correctly |

### 13.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR1 | Startup time | < 500ms |
| NFR2 | Single file (1000 words) | < 30s |
| NFR3 | Memory usage | < 256MB for typical workloads |
| NFR4 | Test coverage | > 80% |
| NFR5 | Documentation | README + CLI help complete |

---

## 14. Open Questions

1. **Quality Metric Selection**: Should we invest in COMET integration for Phase 2, or is LLM-based evaluation sufficient for most use cases?

2. **Glossary Format**: Support additional formats like TBX/CSV, or keep JSON-only for simplicity?

3. **Translation Memory**: Priority for TMX support? Would users benefit from leveraging past translations?

4. **Naming**: Final project name? Candidates: `llm-translate`, `doctrans`, `transforge`, `lexicon`

5. **Distribution**: npm package only, or also provide standalone binaries via pkg?

---

## 15. References

- [Andrew Ng's translation-agent](https://github.com/andrewyng/translation-agent) - Self-refine pattern reference
- [OmegaT Documentation](https://omegat.org/) - Glossary/TM patterns
- [Vercel AI SDK](https://sdk.vercel.ai/) - Multi-provider abstraction
- [unified/remark](https://unifiedjs.com/) - Markdown processing
- [WMT22 Metrics](https://aclanthology.org/2022.wmt-1.2/) - Quality evaluation research
- [MCP Specification](https://modelcontextprotocol.io/) - Agent integration

---

## Appendix A: Sample Glossary for Testing

```json
{
  "metadata": {
    "name": "ML/AI Glossary",
    "sourceLang": "en",
    "targetLangs": ["ko", "ja", "zh-CN"],
    "version": "1.0.0",
    "domain": "machine-learning"
  },
  "terms": [
    {
      "source": "machine learning",
      "targets": {
        "ko": "머신러닝",
        "ja": "機械学習",
        "zh-CN": "机器学习"
      }
    },
    {
      "source": "artificial intelligence",
      "targets": {
        "ko": "인공지능",
        "ja": "人工知能",
        "zh-CN": "人工智能"
      }
    },
    {
      "source": "neural network",
      "targets": {
        "ko": "신경망",
        "ja": "ニューラルネットワーク",
        "zh-CN": "神经网络"
      }
    },
    {
      "source": "deep learning",
      "targets": {
        "ko": "딥러닝",
        "ja": "ディープラーニング",
        "zh-CN": "深度学习"
      }
    },
    {
      "source": "API",
      "targets": {},
      "doNotTranslate": true
    },
    {
      "source": "SDK",
      "targets": {},
      "doNotTranslate": true
    },
    {
      "source": "open source",
      "targets": {
        "ko": "오픈 소스",
        "ja": "オープンソース",
        "zh-CN": "开源"
      }
    },
    {
      "source": "repository",
      "targets": {
        "ko": "저장소",
        "ja": "リポジトリ",
        "zh-CN": "仓库"
      }
    },
    {
      "source": "pull request",
      "targets": {
        "ko": "풀 리퀘스트",
        "ja": "プルリクエスト",
        "zh-CN": "拉取请求"
      },
      "doNotTranslateFor": ["ko", "ja"]
    },
    {
      "source": "merge",
      "targets": {
        "ko": "병합",
        "ja": "マージ",
        "zh-CN": "合并"
      }
    }
  ]
}
```

---

## Appendix B: Example Translation Session

**Input (docs/guide.md):**
```markdown
# Getting Started with Machine Learning

This guide introduces the basics of artificial intelligence and deep learning.

## Prerequisites

- Python 3.8+
- An API key from OpenAI

## Installation

```bash
pip install tensorflow
```

Create a neural network model:

```python
model = Sequential([
    Dense(128, activation='relu'),
    Dense(10, activation='softmax')
])
```
```

**Command:**
```bash
llm-translate file docs/guide.md -s en -t ko \
  --glossary ./ml-glossary.json \
  -o docs/ko/guide.md \
  --verbose
```

**Output (docs/ko/guide.md):**
```markdown
# 머신러닝 시작하기

이 가이드는 인공지능과 딥러닝의 기초를 소개합니다.

## 사전 요구사항

- Python 3.8+
- OpenAI의 API 키

## 설치

```bash
pip install tensorflow
```

신경망 모델을 생성합니다:

```python
model = Sequential([
    Dense(128, activation='relu'),
    Dense(10, activation='softmax')
])
```
```

**Console Output:**
```
✓ Loaded glossary: 10 terms
✓ Parsed markdown: 4 translatable sections
✓ Translation complete
  - Quality: 94/100
  - Iterations: 2
  - Tokens: 847 input, 512 output
  - Duration: 8.3s
✓ Written to docs/ko/guide.md
```
