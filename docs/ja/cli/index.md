# CLI リファレンス

llm-translate は、ドキュメントを翻訳するためのコマンドラインインターフェースを提供します。

## インストール

```bash
npm install -g @llm-translate/cli
```

## グローバルオプション

これらのオプションはすべてのコマンドで利用可能です。

| オプション | 説明 |
|--------|-------------|
|`--help `,`-h`| ヘルプを表示 |
|`--version `,`-V`| バージョンを表示 |
|`--verbose `,`-v`| 詳細出力を有効にする |
|`--quiet `,`-q`| 非必須出力を抑制する |
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
llm-translate file README.md -o README.ko.md --target ko

# Translate with glossary
llm-translate file docs/guide.md -o docs/guide.ja.md \
  --target ja --glossary glossary.json

# Batch translate a directory
llm-translate dir ./docs ./docs-ko --target ko

# Initialize config
llm-translate init --provider claude

# Validate glossary
llm-translate glossary validate --glossary glossary.json
```

## 終了コード

| コード | 説明 |
|------|-------------|
| 0 | 成功 |
| 1 | 一般的なエラー |
| 2 | 無効な引数 |
| 3 | ファイルが見つかりません |
| 4 | 品質しきい値に達していません（厳密モード） |
| 5 | プロバイダー/API エラー |
| 6 | 用語集の検証に失敗しました |

## 環境変数

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
OLLAMA_BASE_URL=http://localhost:11434

# Defaults
LLM_TRANSLATE_PROVIDER=claude
LLM_TRANSLATE_MODEL=claude-haiku-4-5-20251001
```

## 設定の優先順位

設定は以下の順序で適用されます（後の設定が前の設定を上書きします）。

1. ビルトインデフォルト
2. 設定ファイル（`.translaterc.json`）
3. 環境変数
4. CLI 引数

詳細は[設定](../guide/configuration)を参照してください。
