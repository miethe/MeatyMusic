import type { Preview } from '@storybook/react-vite';
import '../src/stories/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: {
        contentsSelector: '.sbdocs-content',
        headingSelector: 'h1, h2, h3',
        ignoreSelector: '#primary',
        title: 'Table of Contents',
        disable: false,
        unsafeTocbotOptions: {
          orderedList: false,
        },
      },
      page: () => import('@storybook/addon-docs/blocks').then(({ DocsContainer }) => DocsContainer),
    },
    backgrounds: {
      options: {
        light: { name: 'light', value: '#FBFCFE' },
        dark: { name: 'dark', value: '#0B0F17' },
        ocean: { name: 'ocean', value: '#F8FEFF' },
        sand: { name: 'sand', value: '#FFFEF7' }
      }
    },
  },

  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', left: '🌞' },
          { value: 'dark', title: 'Dark', left: '🌙' },
          { value: 'ocean', title: 'Ocean', left: '🌊' },
          { value: 'sand', title: 'Sand', left: '🏖️' },
          { value: 'light-hc', title: 'Light HC', left: '🔆' },
          { value: 'dark-hc', title: 'Dark HC', left: '🌑' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    (Story, context) => {
      const { theme } = context.globals;

      // Apply theme to story container
      return (
        <div data-theme={theme} className="min-h-screen transition-colors">
          <Story />
        </div>
      );
    },
  ],

  initialGlobals: {
    backgrounds: {
      value: 'light'
    }
  }
};

export default preview;
