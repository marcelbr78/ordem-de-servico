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

  test('digitar em campo de settings mantém o valor (sem reset)', async ({ page }) => {
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

    // Limpa e digita um valor conhecido
    await campo.click();
    await campo.fill('Empresa Teste QA');
    await page.waitForTimeout(500);

    // O valor deve permanecer — se settings re-inicializar, volta ao valor da API
    const valorAtual = await campo.inputValue();
    expect(valorAtual).toBe('Empresa Teste QA');

    // Restaura (não clica em salvar — só testamos que o estado local não resetou)
    await campo.fill('');
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
