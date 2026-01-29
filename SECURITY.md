# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in llm-translate, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Email the maintainers directly or use GitHub's private vulnerability reporting feature
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Initial response:** Within 48 hours
- **Status update:** Within 7 days
- **Resolution:** Depends on severity and complexity

## API Key Security

llm-translate requires API keys for LLM providers. Follow these guidelines to keep your keys secure:

### Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for API key configuration
3. **Use `.env` files** for local development (ensure `.env` is in `.gitignore`)
4. **Rotate keys regularly** especially if you suspect exposure
5. **Use least-privilege keys** when providers support scoped permissions

### Environment Variables

```bash
# Recommended: Set in your shell profile or CI/CD secrets
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
```

### Configuration File Security

If using `.translaterc.json`:

```json
{
  "provider": "claude",
  "model": "claude-sonnet-4-20250514"
}
```

**Never include API keys in configuration files.** Always use environment variables.

### CI/CD Security

- Store API keys as encrypted secrets in your CI/CD platform
- Never echo or log API keys in build scripts
- Use short-lived tokens when possible

## Security Features

### Input Validation

- All configuration files are validated using Zod schemas
- File paths are sanitized to prevent path traversal
- Glossary files are validated before use

### Data Handling

- Translation content is sent to third-party LLM providers
- No telemetry or analytics data is collected by llm-translate itself
- Cache files are stored locally and can be disabled

## Known Limitations

- **Third-party API calls:** Translation content is sent to external LLM providers (Anthropic, OpenAI, Ollama). Review their privacy policies.
- **Local file access:** The tool reads and writes files on the local filesystem as part of its operation.

## Security Updates

Security updates will be released as patch versions. We recommend:

1. Enabling GitHub Dependabot alerts
2. Regularly updating to the latest version
3. Subscribing to release notifications
