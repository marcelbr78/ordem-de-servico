import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Settings — Campos e Inicialização', () => {

  test('página settings carrega sem erro', async ({ page }) => {
    await login(page);
    await page.goto('/settings');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/erro|500/i')).not.toBeVisible();
  });

  test('aba Empresa exibe campos visíveis (não brancos)', async ({ page }) => {
    await login(page);
    await page.goto('/settings');
    await page.waitForTimeout(2000);

    // Clica na aba Empresa
    const abaEmpresa = page.locator('button, [role=tab]').filter({ hasText: /empresa/i }).first();
    if (await abaEmpresa.isVisible({ timeout: 3000 }).catch(() => false)) {
      await abaEmpresa.click();
      await page.waitForTimeout(800);
    }

    // Campo Razão Social deve estar visível e acessível
    const razaoSocial = page.getByPlaceholder(/nome oficial/i);
    await expect(razaoSocial).toBeVisible({ timeout: 5000 });

    // Verifica se o campo é editável (não está desabilitado)
    const disabled = await razaoSocial.isDisabled();
    expect(disabled).toBe(false);
  });

  test('digitar em um campo de settings não perde o foco imediatamente', async ({ page }) => {
    await login(page);
    await page.goto('/settings');
    await page.waitForTimeout(2000);

    const abaEmpresa = page.locator('button, [role=tab]').filter({ hasText: /empresa/i }).first();
    if (await abaEmpresa.isVisible({ timeout: 3000 }).catch(() => false)) {
      await abaEmpresa.click();
      await page.waitForTimeout(800);
    }

    const campo = page.getByPlaceholder(/nome oficial/i);
    if (!await campo.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip();
      return;
    }

    // Clica e digita
    await campo.click();
    await campo.type('Teste Digitação');
    await page.waitForTimeout(300);

    // Verifica que o campo ainda tem o foco (não perdeu)
    const isFocused = await campo.evaluate(el => document.activeElement === el);
    expect(isFocused).toBe(true);

    // Limpa o que digitou para não sujar o banco
    await campo.clear();
  });

  test('salvar settings exibe mensagem de sucesso', async ({ page }) => {
    await login(page);
    await page.goto('/settings');
    await page.waitForTimeout(2000);

    const abaEmpresa = page.locator('button, [role=tab]').filter({ hasText: /empresa/i }).first();
    if (await abaEmpresa.isVisible({ timeout: 3000 }).catch(() => false)) {
      await abaEmpresa.click();
      await page.waitForTimeout(800);
    }

    // Clica em Salvar sem modificar nada
    const btnSalvar = page.locator('button').filter({ hasText: /salvar dados/i }).first();
    if (await btnSalvar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnSalvar.click();
      await page.waitForTimeout(2000);

      // Deve aparecer mensagem de sucesso
      await expect(page.locator('text=/sucesso|salvo/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

});
