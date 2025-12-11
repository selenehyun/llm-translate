// ============================================================================
// Error Codes
// ============================================================================

export enum ErrorCode {
  // Configuration Errors
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  CONFIG_INVALID = 'CONFIG_INVALID',

  // Glossary Errors
  GLOSSARY_NOT_FOUND = 'GLOSSARY_NOT_FOUND',
  GLOSSARY_INVALID = 'GLOSSARY_INVALID',

  // Provider Errors
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_AUTH_FAILED = 'PROVIDER_AUTH_FAILED',
  PROVIDER_RATE_LIMITED = 'PROVIDER_RATE_LIMITED',
  PROVIDER_ERROR = 'PROVIDER_ERROR',

  // Translation Errors
  QUALITY_THRESHOLD_NOT_MET = 'QUALITY_THRESHOLD_NOT_MET',
  GLOSSARY_COMPLIANCE_FAILED = 'GLOSSARY_COMPLIANCE_FAILED',

  // File Errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',

  // Format Errors
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  CHUNK_TOO_LARGE = 'CHUNK_TOO_LARGE',

  // General Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ============================================================================
// Error Messages
// ============================================================================

const errorMessages: Record<ErrorCode, string> = {
  [ErrorCode.CONFIG_NOT_FOUND]:
    'Configuration file not found. Run `llm-translate init` to create one.',
  [ErrorCode.CONFIG_INVALID]:
    'Configuration file is invalid. Please check the format and required fields.',
  [ErrorCode.GLOSSARY_NOT_FOUND]:
    'Glossary file not found at the specified path.',
  [ErrorCode.GLOSSARY_INVALID]:
    'Glossary file is invalid. Please check the JSON format and structure.',
  [ErrorCode.PROVIDER_NOT_FOUND]:
    'The specified LLM provider is not available. Supported providers: claude, openai, ollama.',
  [ErrorCode.PROVIDER_AUTH_FAILED]:
    'Authentication failed. Check your API key in environment variables.',
  [ErrorCode.PROVIDER_RATE_LIMITED]:
    'Rate limited by the LLM provider. Please wait and try again.',
  [ErrorCode.PROVIDER_ERROR]:
    'An error occurred while communicating with the LLM provider.',
  [ErrorCode.QUALITY_THRESHOLD_NOT_MET]:
    'Translation quality ({score}) did not meet threshold ({threshold}). Use --quality to adjust or --max-iterations to allow more refinement.',
  [ErrorCode.GLOSSARY_COMPLIANCE_FAILED]:
    'Glossary compliance failed. Missing terms: {missed}. Use --no-strict-glossary to allow partial compliance.',
  [ErrorCode.FILE_NOT_FOUND]: 'The specified file was not found.',
  [ErrorCode.FILE_READ_ERROR]: 'Failed to read the file.',
  [ErrorCode.FILE_WRITE_ERROR]: 'Failed to write to the output file.',
  [ErrorCode.UNSUPPORTED_FORMAT]:
    'The file format is not supported. Supported formats: markdown, html, text.',
  [ErrorCode.CHUNK_TOO_LARGE]:
    'A chunk exceeds the maximum token limit and cannot be processed.',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred.',
};

// ============================================================================
// Translation Error Class
// ============================================================================

export class TranslationError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    details?: Record<string, unknown>,
    customMessage?: string
  ) {
    const message = customMessage ?? formatErrorMessage(code, details);
    super(message);

    this.name = 'TranslationError';
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TranslationError);
    }
  }

  /**
   * Create a JSON representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatErrorMessage(
  code: ErrorCode,
  details?: Record<string, unknown>
): string {
  let message = errorMessages[code] ?? errorMessages[ErrorCode.UNKNOWN_ERROR];

  if (details) {
    // Replace placeholders like {score} with actual values
    for (const [key, value] of Object.entries(details)) {
      message = message.replace(`{${key}}`, String(value));
    }
  }

  return message;
}

// ============================================================================
// Error Type Guards
// ============================================================================

export function isTranslationError(error: unknown): error is TranslationError {
  return error instanceof TranslationError;
}

export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return isTranslationError(error) && error.code === code;
}

// ============================================================================
// Exit Codes (for CLI)
// ============================================================================

export const ExitCode = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_ARGUMENTS: 2,
  FILE_NOT_FOUND: 3,
  QUALITY_THRESHOLD_NOT_MET: 4,
  PROVIDER_ERROR: 5,
  GLOSSARY_VALIDATION_FAILED: 6,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];

/**
 * Map error codes to exit codes
 */
export function getExitCode(error: TranslationError): ExitCode {
  switch (error.code) {
    case ErrorCode.FILE_NOT_FOUND:
    case ErrorCode.CONFIG_NOT_FOUND:
    case ErrorCode.GLOSSARY_NOT_FOUND:
      return ExitCode.FILE_NOT_FOUND;

    case ErrorCode.CONFIG_INVALID:
    case ErrorCode.UNSUPPORTED_FORMAT:
      return ExitCode.INVALID_ARGUMENTS;

    case ErrorCode.QUALITY_THRESHOLD_NOT_MET:
      return ExitCode.QUALITY_THRESHOLD_NOT_MET;

    case ErrorCode.PROVIDER_NOT_FOUND:
    case ErrorCode.PROVIDER_AUTH_FAILED:
    case ErrorCode.PROVIDER_RATE_LIMITED:
    case ErrorCode.PROVIDER_ERROR:
      return ExitCode.PROVIDER_ERROR;

    case ErrorCode.GLOSSARY_INVALID:
      return ExitCode.GLOSSARY_VALIDATION_FAILED;

    default:
      return ExitCode.GENERAL_ERROR;
  }
}
