import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,           // serial — evita conflito de foco entre janelas abertas
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:8081',
    headless: true,     // headless = sem janela, sem conflito de foco de SO
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'pt-BR',
  },
  timeout: 40000,
  reporter: [['html', { open: 'never' }], ['list']],
});
