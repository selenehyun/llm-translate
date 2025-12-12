import { defineConfig } from 'vitepress';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { generateLocaleConfig } from '../../dist/index.js';

// Get docs directory path relative to this config file
const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = resolve(__dirname, '..');

// Generate locale configurations automatically
const locales = generateLocaleConfig(docsDir, {
  defaultLocale: 'en',
  locales: ['ko', 'ja', 'zh'],
  labels: {
    en: 'English',
    ko: '한국어',
    ja: '日本語',
    zh: '中文',
  },
  descriptions: {
    en: 'LLM-powered document translation CLI with glossary enforcement',
    ko: 'LLM 기반 문서 번역 CLI - 용어집 적용 및 품질 관리',
    ja: 'LLM駆動のドキュメント翻訳CLI - 用語集の適用と品質管理',
    zh: 'LLM驱动的文档翻译CLI - 术语表应用和质量管理',
  },
  sidebarDirs: ['guide', 'cli', 'api'],
  useTitleFromHeading: true,
  translations: {
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
  },
});

// Shared configuration
const shared = defineConfig({
  title: 'llm-translate',
  base: '/llm-translate/',
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],

  themeConfig: {
    logo: '/logo.svg',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/selenehyun/llm-translate' },
    ],
    search: {
      provider: 'local',
      options: {
        locales: {
          ko: {
            translations: {
              button: {
                buttonText: '검색',
                buttonAriaLabel: '검색',
              },
              modal: {
                displayDetails: '상세 목록 표시',
                resetButtonTitle: '검색 지우기',
                backButtonTitle: '검색 닫기',
                noResultsText: '결과를 찾을 수 없습니다',
                footer: {
                  selectText: '선택',
                  selectKeyAriaLabel: '선택하기',
                  navigateText: '탐색',
                  navigateUpKeyAriaLabel: '위로',
                  navigateDownKeyAriaLabel: '아래로',
                  closeText: '닫기',
                  closeKeyAriaLabel: 'esc',
                },
              },
            },
          },
          ja: {
            translations: {
              button: {
                buttonText: '検索',
                buttonAriaLabel: '検索',
              },
              modal: {
                displayDetails: '詳細リストを表示',
                resetButtonTitle: '検索をクリア',
                backButtonTitle: '検索を閉じる',
                noResultsText: '結果が見つかりませんでした',
                footer: {
                  selectText: '選択',
                  selectKeyAriaLabel: '選択する',
                  navigateText: '移動',
                  navigateUpKeyAriaLabel: '上へ',
                  navigateDownKeyAriaLabel: '下へ',
                  closeText: '閉じる',
                  closeKeyAriaLabel: 'esc',
                },
              },
            },
          },
          zh: {
            translations: {
              button: {
                buttonText: '搜索',
                buttonAriaLabel: '搜索',
              },
              modal: {
                displayDetails: '显示详细列表',
                resetButtonTitle: '清除搜索',
                backButtonTitle: '关闭搜索',
                noResultsText: '未找到结果',
                footer: {
                  selectText: '选择',
                  selectKeyAriaLabel: '选择',
                  navigateText: '导航',
                  navigateUpKeyAriaLabel: '向上',
                  navigateDownKeyAriaLabel: '向下',
                  closeText: '关闭',
                  closeKeyAriaLabel: 'esc',
                },
              },
            },
          },
        },
      },
    },
    editLink: {
      pattern: 'https://github.com/selenehyun/llm-translate/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present',
    },
  },
});

// Main config with locales
export default defineConfig({
  ...shared,
  locales,
});
