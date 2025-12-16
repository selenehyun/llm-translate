# CLIリファレンス

::: info 翻訳について
英語以外のドキュメントはすべてClaude Sonnet 4を使用して自動翻訳されています。
:::

llm-translateは、ドキュメントを翻訳するためのコマンドラインインターフェースを提供します。

## インストール

```bash
npm install -g @llm-translate/cli
```

## グローバルオプション

これらのオプションはすべてのコマンドで使用できます：

| オプション | 説明 |
|--------|-------------|
|`--help `,`-h`| ヘルプを表示 |
|`--version `,`-V`| バージョンを表示 |
|`--verbose `,`-v`| 詳細出力を有効化 |
|`--quiet `,`-q`| 非必須出力を抑制 |
|`--config`| 設定ファイルへのパス |

## コマンド

### [file](./file)

単一ファイルを翻訳します。

```bash
llm-translate file <input> [output] [options]
```

### [dir](./dir)

ディレクトリ内のすべてのファイルを翻訳します。

```bash
llm-translate dir <input> <output> [options]
```

### [init](./init)

設定ファイルを初期化します。

```bash
llm-translate init [options]
```

### [glossary](./glossary)

用語集ファイルを管理します。

```bash
llm-translate glossary <subcommand> [options]
```

## クイック例

```bash
# Translate a file to Korean
llm-translate file README.md -o README.ko.md -s en -t ko

# Translate with glossary
llm-translate file docs/guide.md -o docs/guide.ja.md \
  -s en -t ja --glossary glossary.json

# Batch translate a directory
llm-translate dir ./docs ./docs-ko -s en -t ko

# Initialize config
llm-translate init --provider claude

# Validate glossary
llm-translate glossary validate glossary.json
```

## 終了コード

| コード | 説明 |
|------|-------------|
| 0 | 成功 |
| 1 | 一般的なエラー |
| 2 | 無効な引数 |
| 3 | ファイルが見つかりません |
| 4 | 品質しきい値を満たしていません（厳密モード） |
| 5 | プロバイダー/APIエラー |
| 6 | 用語集の検証に失敗 |

## 環境変数

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
OLLAMA_BASE_URL=http://localhost:11434
```

## 設定の優先順位

設定は以下の順序で適用されます（後のものが前のものを上書きします）：

1. 組み込みデフォルト
2. 設定ファイル（`.translaterc.json`）
3. 環境変数
4. CLI引数

詳細については[設定](../guide/configuration)をご覧ください。
