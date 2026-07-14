export default {
  source: ['design-tokens/tokens.json'],
  hooks: {
    formats: {
      socialbookTokens: ({ dictionary }) => {
        const lightTokens = dictionary.allTokens.filter(
          (t) => t.path[0] !== 'dark' && t.path[0] !== 'font' && t.path[0] !== 'theme',
        );
        const darkTokens = dictionary.allTokens.filter(
          (t) => t.path[0] === 'dark' && t.path[1] !== 'theme',
        );

        function cssVarName(path) {
          if (path.length === 1) return path[0];
          return path.slice(1).join('-');
        }

        let css = ':root {\n';
        for (const token of lightTokens) {
          css += `  --${cssVarName(token.path)}: ${token.$value};\n`;
        }
        css += '}\n\n';

        css += '.dark {\n';
        for (const token of darkTokens) {
          css += `  --${cssVarName(token.path.slice(1))}: ${token.$value};\n`;
        }
        css += '}\n\n';

        // Light theme overrides (e.g. .theme-red, .theme-mono)
        const themeTokens = dictionary.allTokens.filter(
          (t) => t.path[0] === 'theme'
        );
        const themes = {};
        for (const token of themeTokens) {
          const themeName = token.path[1];
          if (!themes[themeName]) themes[themeName] = [];
          themes[themeName].push(token);
        }

        for (const [themeName, tokens] of Object.entries(themes)) {
          css += `.theme-${themeName} {\n`;
          for (const token of tokens) {
            const innerPath = token.path.slice(2);
            css += `  --${cssVarName(innerPath)}: ${token.$value};\n`;
          }
          css += '}\n\n';
        }

        // Dark theme overrides (e.g. .dark .theme-red, .dark.theme-red)
        const darkThemeTokens = dictionary.allTokens.filter(
          (t) => t.path[0] === 'dark' && t.path[1] === 'theme'
        );
        const darkThemes = {};
        for (const token of darkThemeTokens) {
          const themeName = token.path[2];
          if (!darkThemes[themeName]) darkThemes[themeName] = [];
          darkThemes[themeName].push(token);
        }

        for (const [themeName, tokens] of Object.entries(darkThemes)) {
          css += `.dark .theme-${themeName},\n.dark.theme-${themeName} {\n`;
          for (const token of tokens) {
            const innerPath = token.path.slice(3);
            css += `  --${cssVarName(innerPath)}: ${token.$value};\n`;
          }
          css += '}\n\n';
        }

        return css.trim() + '\n';
      },
    },
  },
  platforms: {
    css: {
      buildPath: 'src/app/',
      files: [
        {
          destination: 'tokens.generated.css',
          format: 'socialbookTokens',
        },
      ],
    },
  },
};
