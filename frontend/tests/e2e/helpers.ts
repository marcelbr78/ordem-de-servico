import { Page } from '@playwright/test';

export const STAGING_URL = 'http://localhost:8081';
export const ADMIN_EMAIL = 'admin@admin.com';
export const ADMIN_PASSWORD = 'Admin@123';

export async function login(page: Page, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  await page.goto('/login');
  await page.getByPlaceholder('Digite seu usuário').fill(email);
  await page.getByPlaceholder('Digite sua senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/dashboard|orders/, { timeout: 12000 });
}

export async function waitForToast(page: Page) {
  // Aguarda qualquer mensagem de feedback visível
  await page.waitForTimeout(800);
}
