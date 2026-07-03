import { ThemeProvider, useTheme } from '@lania-pro-components/theme';
import '@lania-pro-components/theme/light.css';
import '@lania-pro-components/theme/dark.css';
import { Button, Switch } from '@arco-design/web-react';

function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  return (
    <div style={{ padding: 24, background: 'var(--color-bg-2)', borderRadius: 6 }}>
      <p style={{ color: 'var(--color-text-1)' }}>当前主题: {resolvedTheme}</p>
      <Switch checked={resolvedTheme === 'dark'} onChange={toggleTheme} />
    </div>
  );
}

export const Demo1 = () => (
  <ThemeProvider>
    <ThemeToggle />
  </ThemeProvider>
);
