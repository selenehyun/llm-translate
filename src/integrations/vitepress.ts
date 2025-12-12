/**
 * VitePress Integration Helpers
 *
 * Helper functions to auto-generate VitePress i18n configuration
 * based on translated document structure.
 *
 * @example
 * ```typescript
 * // docs/.vitepress/config.ts
 * import { defineConfig } from 'vitepress';
 * import { generateLocaleConfig } from 'llm-translate/vitepress';
 *
 * const locales = await generateLocaleConfig('./docs', {
 *   defaultLocale: 'en',
 *   locales: ['ko', 'ja'],
 * });
 *
 * export default defineConfig({ locales });
 * ```
 */

import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// ============================================================================
// Types - Compatible with VitePress DefaultTheme
// ============================================================================

/**
 * Navigation item with a link
 * Compatible with VitePress DefaultTheme.NavItemWithLink
 */
export interface NavItemWithLink {
  text: string;
  link: string;
  activeMatch?: string;
  rel?: string;
  target?: string;
  noIcon?: boolean;
}

/**
 * Navigation item with children
 * Compatible with VitePress DefaultTheme.NavItemWithChildren
 */
export interface NavItemWithChildren {
  text?: string;
  items: NavItemWithLink[];
  activeMatch?: string;
}

/**
 * Navigation item type
 * Compatible with VitePress DefaultTheme.NavItem
 */
export type NavItem = NavItemWithLink | NavItemWithChildren;

/**
 * Sidebar item
 * Compatible with VitePress DefaultTheme.SidebarItem
 */
export interface SidebarItem {
  text?: string;
  link?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
  base?: string;
  docFooterText?: string;
  rel?: string;
  target?: string;
}

/**
 * Theme configuration
 * Compatible with VitePress DefaultTheme.Config
 */
export interface ThemeConfig {
  nav?: NavItem[];
  sidebar?: SidebarItem[] | Record<string, SidebarItem[]>;
  editLink?: {
    pattern: string;
    text?: string;
  };
  docFooter?: {
    prev?: string | false;
    next?: string | false;
  };
  outline?: {
    level?: number | [number, number] | 'deep';
    label?: string;
  };
  lastUpdated?: {
    text?: string;
    formatOptions?: Intl.DateTimeFormatOptions;
  };
  returnToTopLabel?: string;
  sidebarMenuLabel?: string;
  darkModeSwitchLabel?: string;
  langMenuLabel?: string;
}

/**
 * Locale configuration
 * Compatible with VitePress LocaleConfig
 */
export interface LocaleConfig {
  label: string;
  lang?: string;
  link?: string;
  description?: string;
  themeConfig?: ThemeConfig;
}

/**
 * Options for generating locale configuration
 */
export interface GenerateOptions {
  /** Default locale code (e.g., 'en') */
  defaultLocale?: string;

  /** List of locale codes to generate (e.g., ['ko', 'ja']) */
  locales?: string[];

  /** Locale display labels */
  labels?: Record<string, string>;

  /** Locale lang codes for HTML */
  langCodes?: Record<string, string>;

  /** Locale descriptions */
  descriptions?: Record<string, string>;

  /** Directories to include in sidebar (default: auto-detect) */
  sidebarDirs?: string[];

  /** Use title from file's first heading */
  useTitleFromHeading?: boolean;

  /** Custom locale translations */
  translations?: Record<string, LocaleTranslations>;
}

export interface LocaleTranslations {
  editLinkText?: string;
  docFooter?: { prev: string; next: string };
  outline?: { label: string };
  lastUpdated?: { text: string };
  returnToTopLabel?: string;
  sidebarMenuLabel?: string;
  darkModeSwitchLabel?: string;
}

// ============================================================================
// Default Translations
// ============================================================================

const DEFAULT_LABELS: Record<string, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  zh: '中文',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ru: 'Русский',
  it: 'Italiano',
};

const DEFAULT_LANG_CODES: Record<string, string> = {
  en: 'en-US',
  ko: 'ko-KR',
  ja: 'ja-JP',
  zh: 'zh-CN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-BR',
  ru: 'ru-RU',
  it: 'it-IT',
};

const DEFAULT_TRANSLATIONS: Record<string, LocaleTranslations> = {
  ko: {
    editLinkText: 'GitHub에서 이 페이지 편집하기',
    docFooter: { prev: '이전 페이지', next: '다음 페이지' },
    outline: { label: '목차' },
    lastUpdated: { text: '최종 업데이트' },
    returnToTopLabel: '맨 위로',
    sidebarMenuLabel: '메뉴',
    darkModeSwitchLabel: '다크 모드',
  },
  ja: {
    editLinkText: 'GitHubでこのページを編集する',
    docFooter: { prev: '前のページ', next: '次のページ' },
    outline: { label: '目次' },
    lastUpdated: { text: '最終更新' },
    returnToTopLabel: 'トップへ戻る',
    sidebarMenuLabel: 'メニュー',
    darkModeSwitchLabel: 'ダークモード',
  },
  zh: {
    editLinkText: '在 GitHub 上编辑此页',
    docFooter: { prev: '上一页', next: '下一页' },
    outline: { label: '目录' },
    lastUpdated: { text: '最后更新' },
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '深色模式',
  },
};

// ============================================================================
// File System Utilities
// ============================================================================

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function getSubdirectories(dir: string): string[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((entry) => isDirectory(join(dir, entry)))
    .filter((entry) => !entry.startsWith('.') && !entry.startsWith('_'));
}

function getTitleFromFile(filePath: string): string | null {
  try {
    const content = readFileSync(filePath, 'utf-8');

    // Check frontmatter title first
    const frontmatterMatch = content.match(/^---\s*\n[\s\S]*?title:\s*['"]?([^'"\n]+)['"]?\s*\n[\s\S]*?---/);
    if (frontmatterMatch?.[1]) {
      return frontmatterMatch[1].trim();
    }

    // Check first heading
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch?.[1]) {
      return headingMatch[1].trim();
    }

    return null;
  } catch {
    return null;
  }
}

function fileNameToTitle(fileName: string): string {
  // Remove .md extension and convert kebab-case to Title Case
  return fileName
    .replace(/\.md$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================================
// Sidebar Generation
// ============================================================================

interface SidebarGeneratorOptions {
  basePath: string;
  localePrefix: string;
  useTitleFromHeading: boolean;
}

function generateSidebarItems(dir: string, options: SidebarGeneratorOptions): SidebarItem[] {
  const { basePath, localePrefix, useTitleFromHeading } = options;
  const items: SidebarItem[] = [];

  if (!existsSync(dir)) return items;

  const entries = readdirSync(dir).sort((a, b) => {
    // index.md comes first
    if (a === 'index.md') return -1;
    if (b === 'index.md') return 1;
    return a.localeCompare(b);
  });

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relativePath = relative(basePath, fullPath);

    if (isDirectory(fullPath)) {
      // Recursively process subdirectories
      const subItems = generateSidebarItems(fullPath, options);
      if (subItems.length > 0) {
        const indexFile = join(fullPath, 'index.md');
        const title = existsSync(indexFile) && useTitleFromHeading
          ? getTitleFromFile(indexFile) || fileNameToTitle(entry)
          : fileNameToTitle(entry);

        items.push({
          text: title,
          items: subItems,
        });
      }
    } else if (entry.endsWith('.md')) {
      const title = useTitleFromHeading
        ? getTitleFromFile(fullPath) || fileNameToTitle(entry)
        : fileNameToTitle(entry);

      const link = `${localePrefix}/${relativePath.replace(/\.md$/, '').replace(/\/index$/, '/')}`;

      items.push({
        text: title,
        link,
      });
    }
  }

  return items;
}

function generateSidebar(
  docsDir: string,
  sidebarDirs: string[],
  localePrefix: string,
  useTitleFromHeading: boolean
): Record<string, SidebarItem[]> {
  const sidebar: Record<string, SidebarItem[]> = {};

  for (const dir of sidebarDirs) {
    const fullDir = join(docsDir, dir);
    if (!existsSync(fullDir)) continue;

    const items = generateSidebarItems(fullDir, {
      basePath: docsDir,
      localePrefix,
      useTitleFromHeading,
    });

    if (items.length > 0) {
      const sidebarPath = `${localePrefix}/${dir}/`;
      sidebar[sidebarPath] = [
        {
          text: fileNameToTitle(dir),
          items,
        },
      ];
    }
  }

  return sidebar;
}

// ============================================================================
// Nav Generation
// ============================================================================

function generateNav(
  docsDir: string,
  sidebarDirs: string[],
  localePrefix: string,
  useTitleFromHeading: boolean
): NavItemWithLink[] {
  const nav: NavItemWithLink[] = [];

  for (const dir of sidebarDirs) {
    const fullDir = join(docsDir, dir);
    if (!existsSync(fullDir)) continue;

    const indexFile = join(fullDir, 'index.md');
    const title = existsSync(indexFile) && useTitleFromHeading
      ? getTitleFromFile(indexFile) || fileNameToTitle(dir)
      : fileNameToTitle(dir);

    nav.push({
      text: title,
      link: `${localePrefix}/${dir}/`,
      activeMatch: `${localePrefix}/${dir}/`,
    });
  }

  return nav;
}

// ============================================================================
// Main Export Functions
// ============================================================================

/**
 * Auto-detect available locales by scanning for locale directories
 */
export function detectLocales(docsDir: string, defaultLocale: string = 'en'): string[] {
  const subdirs = getSubdirectories(docsDir);

  // Filter to only locale-like directories (2-letter codes)
  const localeDirs = subdirs.filter(
    (dir) => /^[a-z]{2}(-[A-Z]{2})?$/.test(dir) && dir !== defaultLocale
  );

  return localeDirs;
}

/**
 * Auto-detect sidebar directories by looking at root structure
 */
export function detectSidebarDirs(docsDir: string): string[] {
  const subdirs = getSubdirectories(docsDir);

  // Exclude locale directories and common non-sidebar dirs
  const excludePatterns = [
    /^[a-z]{2}(-[A-Z]{2})?$/, // locale dirs
    /^public$/,
    /^\.vitepress$/,
    /^assets?$/,
    /^images?$/,
  ];

  return subdirs.filter((dir) => !excludePatterns.some((pattern) => pattern.test(dir)));
}

/**
 * Generate locale configuration for a specific locale
 */
export function generateLocale(
  docsDir: string,
  locale: string,
  options: GenerateOptions = {}
): LocaleConfig {
  const {
    defaultLocale = 'en',
    labels = DEFAULT_LABELS,
    langCodes = DEFAULT_LANG_CODES,
    descriptions = {},
    sidebarDirs = detectSidebarDirs(docsDir),
    useTitleFromHeading = true,
    translations = DEFAULT_TRANSLATIONS,
  } = options;

  const isDefault = locale === defaultLocale;
  const localeDir = isDefault ? docsDir : join(docsDir, locale);
  const localePrefix = isDefault ? '' : `/${locale}`;

  // Generate nav and sidebar
  const nav = generateNav(localeDir, sidebarDirs, localePrefix, useTitleFromHeading);
  const sidebar = generateSidebar(localeDir, sidebarDirs, localePrefix, useTitleFromHeading);

  const localeTranslations = translations[locale] || {};

  const config: LocaleConfig = {
    label: labels[locale] || locale,
    lang: langCodes[locale] || locale,
    description: descriptions[locale],
    themeConfig: {
      nav,
      sidebar,
    },
  };

  // Add translations for non-default locales
  if (!isDefault && localeTranslations && config.themeConfig) {
    if (localeTranslations.docFooter) {
      config.themeConfig.docFooter = localeTranslations.docFooter;
    }
    if (localeTranslations.outline) {
      config.themeConfig.outline = localeTranslations.outline;
    }
    if (localeTranslations.lastUpdated) {
      config.themeConfig.lastUpdated = localeTranslations.lastUpdated;
    }
    if (localeTranslations.returnToTopLabel) {
      config.themeConfig.returnToTopLabel = localeTranslations.returnToTopLabel;
    }
    if (localeTranslations.sidebarMenuLabel) {
      config.themeConfig.sidebarMenuLabel = localeTranslations.sidebarMenuLabel;
    }
    if (localeTranslations.darkModeSwitchLabel) {
      config.themeConfig.darkModeSwitchLabel = localeTranslations.darkModeSwitchLabel;
    }
  }

  return config;
}

/**
 * Generate complete locale configuration for VitePress
 *
 * @example
 * ```typescript
 * import { defineConfig } from 'vitepress';
 * import { generateLocaleConfig } from 'llm-translate';
 *
 * const locales = generateLocaleConfig('./docs', {
 *   defaultLocale: 'en',
 *   locales: ['ko', 'ja'],
 * });
 *
 * export default defineConfig({
 *   locales,
 *   // ... other config
 * });
 * ```
 */
export function generateLocaleConfig(
  docsDir: string,
  options: GenerateOptions = {}
): Record<string, LocaleConfig> {
  const { defaultLocale = 'en', locales = detectLocales(docsDir, defaultLocale) } = options;

  const config: Record<string, LocaleConfig> = {};

  // Generate default locale (root)
  config.root = generateLocale(docsDir, defaultLocale, options);

  // Generate other locales
  for (const locale of locales) {
    config[locale] = generateLocale(docsDir, locale, options);
  }

  return config;
}

/**
 * Generate sidebar configuration only
 *
 * Useful when you want to manually configure nav but auto-generate sidebar.
 */
export function generateSidebarConfig(
  docsDir: string,
  options: Omit<GenerateOptions, 'descriptions' | 'translations'> = {}
): Record<string, Record<string, SidebarItem[]>> {
  const {
    defaultLocale = 'en',
    locales = detectLocales(docsDir, defaultLocale),
    sidebarDirs = detectSidebarDirs(docsDir),
    useTitleFromHeading = true,
  } = options;

  const config: Record<string, Record<string, SidebarItem[]>> = {};

  // Default locale
  config.root = generateSidebar(docsDir, sidebarDirs, '', useTitleFromHeading);

  // Other locales
  for (const locale of locales) {
    const localeDir = join(docsDir, locale);
    config[locale] = generateSidebar(localeDir, sidebarDirs, `/${locale}`, useTitleFromHeading);
  }

  return config;
}
