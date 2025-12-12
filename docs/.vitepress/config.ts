import { defineConfig } from 'vitepress';

// Shared configuration
const shared = defineConfig({
  title: 'llm-translate',
  base: '/',
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
        },
      },
    },
  },
});

// English configuration
const en = defineConfig({
  lang: 'en-US',
  description: 'LLM-powered document translation CLI with glossary enforcement',

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'CLI Reference', link: '/cli/' },
      { text: 'API', link: '/api/' },
      {
        text: 'Links',
        items: [
          { text: 'GitHub', link: 'https://github.com/selenehyun/llm-translate' },
          { text: 'Changelog', link: '/changelog' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is llm-translate?', link: '/guide/' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Glossary', link: '/guide/glossary' },
            { text: 'Quality Control', link: '/guide/quality-control' },
            { text: 'Prompt Caching', link: '/guide/prompt-caching' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Providers', link: '/guide/providers' },
            { text: 'Chunking Strategy', link: '/guide/chunking' },
            { text: 'Cost Optimization', link: '/guide/cost-optimization' },
          ],
        },
      ],
      '/cli/': [
        {
          text: 'CLI Reference',
          items: [
            { text: 'Overview', link: '/cli/' },
            { text: 'file', link: '/cli/file' },
            { text: 'dir', link: '/cli/dir' },
            { text: 'init', link: '/cli/init' },
            { text: 'glossary', link: '/cli/glossary' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'TranslationEngine', link: '/api/engine' },
            { text: 'TranslationAgent', link: '/api/agent' },
            { text: 'Providers', link: '/api/providers' },
          ],
        },
      ],
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

// Korean configuration
const ko = defineConfig({
  lang: 'ko-KR',
  description: 'LLM 기반 문서 번역 CLI - 용어집 적용 및 품질 관리',

  themeConfig: {
    nav: [
      { text: '가이드', link: '/ko/guide/getting-started' },
      { text: 'CLI 레퍼런스', link: '/ko/cli/' },
      { text: 'API', link: '/ko/api/' },
      {
        text: '링크',
        items: [
          { text: 'GitHub', link: 'https://github.com/selenehyun/llm-translate' },
          { text: '변경 이력', link: '/ko/changelog' },
        ],
      },
    ],

    sidebar: {
      '/ko/guide/': [
        {
          text: '소개',
          items: [
            { text: 'llm-translate란?', link: '/ko/guide/' },
            { text: '시작하기', link: '/ko/guide/getting-started' },
            { text: '설정', link: '/ko/guide/configuration' },
          ],
        },
        {
          text: '기능',
          items: [
            { text: '용어집', link: '/ko/guide/glossary' },
            { text: '품질 관리', link: '/ko/guide/quality-control' },
            { text: '프롬프트 캐싱', link: '/ko/guide/prompt-caching' },
          ],
        },
        {
          text: '고급',
          items: [
            { text: '프로바이더', link: '/ko/guide/providers' },
            { text: '청킹 전략', link: '/ko/guide/chunking' },
            { text: '비용 최적화', link: '/ko/guide/cost-optimization' },
          ],
        },
      ],
      '/ko/cli/': [
        {
          text: 'CLI 레퍼런스',
          items: [
            { text: '개요', link: '/ko/cli/' },
            { text: 'file', link: '/ko/cli/file' },
            { text: 'dir', link: '/ko/cli/dir' },
            { text: 'init', link: '/ko/cli/init' },
            { text: 'glossary', link: '/ko/cli/glossary' },
          ],
        },
      ],
      '/ko/api/': [
        {
          text: 'API 레퍼런스',
          items: [
            { text: '개요', link: '/ko/api/' },
            { text: 'TranslationEngine', link: '/ko/api/engine' },
            { text: 'TranslationAgent', link: '/ko/api/agent' },
            { text: 'Providers', link: '/ko/api/providers' },
          ],
        },
      ],
    },

    editLink: {
      pattern: 'https://github.com/selenehyun/llm-translate/edit/main/docs/:path',
      text: 'GitHub에서 이 페이지 편집하기',
    },

    footer: {
      message: 'MIT 라이선스에 따라 배포됩니다.',
      copyright: 'Copyright © 2024-present',
    },

    docFooter: {
      prev: '이전 페이지',
      next: '다음 페이지',
    },

    outline: {
      label: '목차',
    },

    lastUpdated: {
      text: '최종 업데이트',
    },

    returnToTopLabel: '맨 위로',
    sidebarMenuLabel: '메뉴',
    darkModeSwitchLabel: '다크 모드',
  },
});

// Main config with locales
export default defineConfig({
  ...shared,

  locales: {
    root: {
      label: 'English',
      ...en,
    },
    ko: {
      label: '한국어',
      ...ko,
    },
  },
});
