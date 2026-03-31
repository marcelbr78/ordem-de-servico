import { test, expect } from '@playwright/test';
import { login, ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers';

test.describe('Autenticação', () => {

  test('login com credenciais válidas redireciona para dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('login com senha errada não redireciona', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Digite seu usuário').fill(ADMIN_EMAIL);
    await page.getByPlaceholder('Digite sua senha').fill('senha_errada_123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForTimeout(3000);
    await expect(page).not.toHaveURL(/dashboard/);
  });

  test('acessar rota protegida sem login redireciona para /login', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/login/, { timeout: 8000 });
  });

  test('acessar /settings sem login redireciona para /login', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/login/, { timeout: 8000 });
  });

  test('após login, F5 mantém sessão', async ({ page }) => {
    await login(page);
    await page.reload();
    await page.waitForTimeout(1000);
    await expect(page).not.toHaveURL(/login/);
  });

});
