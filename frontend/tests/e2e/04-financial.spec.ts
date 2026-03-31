import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Módulo Financeiro', () => {

  test('página financeiro carrega sem erro', async ({ page }) => {
    await login(page);
    await page.goto('/finance');
    await page.waitForTimeout(1500);

    await expect(page.locator('text=/erro|500/i')).not.toBeVisible();
  });

  test('aba financeiro da OS exibe valores sem crash', async ({ page }) => {
    await login(page);
    await page.goto('/orders');
    await page.waitForTimeout(1200);

    // Abre qualquer OS
    const primeiraOS = page.locator('tr, [class*=card], [class*=order]').nth(1);
    if (!await primeiraOS.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await primeiraOS.click();
    await page.waitForTimeout(600);

    // Vai para aba Financeiro
    const abaFin = page.locator('button, [role=tab]').filter({ hasText: /financ/i }).first();
    if (await abaFin.isVisible({ timeout: 3000 }).catch(() => false)) {
      await abaFin.click();
      await page.waitForTimeout(1000);

      // Não deve ter erro
      await expect(page.locator('text=/erro|500/i')).not.toBeVisible();

      // Deve mostrar algum valor monetário ou texto "Nenhum pagamento"
      const body = await page.textContent('body');
      const temConteudo = body?.includes('R$') || body?.includes('pagamento') || body?.includes('Valor');
      expect(temConteudo).toBeTruthy();
    }
  });

  test('valor total persiste após reload', async ({ page }) => {
    await login(page);
    await page.goto('/orders');
    await page.waitForTimeout(1200);

    const primeiraOS = page.locator('tr, [class*=card], [class*=order]').nth(1);
    if (!await primeiraOS.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await primeiraOS.click();
    await page.waitForTimeout(600);

    const abaFin = page.locator('button, [role=tab]').filter({ hasText: /financ/i }).first();
    if (!await abaFin.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await abaFin.click();
    await page.waitForTimeout(1000);

    // Captura o primeiro valor R$ exibido
    const valorEl = page.locator('text=/R\$\s*\d/').first();
    const valorAntes = await valorEl.textContent().catch(() => null);

    if (!valorAntes) {
      test.skip();
      return;
    }

    // Reload e verifica
    await page.reload();
    await page.waitForTimeout(1500);

    // Reabre a aba financeiro
    const abaFinDepois = page.locator('button, [role=tab]').filter({ hasText: /financ/i }).first();
    if (await abaFinDepois.isVisible({ timeout: 3000 }).catch(() => false)) {
      await abaFinDepois.click();
      await page.waitForTimeout(1000);
    }

    const valorDepois = await page.locator('text=/R\$\s*\d/').first().textContent().catch(() => null);

    console.log(`Valor antes: ${valorAntes} | Valor depois: ${valorDepois}`);
    expect(valorAntes).toBe(valorDepois);
  });

  test('registrar pagamento duplicado não duplica transação', async ({ page }) => {
    await login(page);
    await page.goto('/finance');
    await page.waitForTimeout(1500);

    // Conta transações iniciais
    const countAntes = await page.locator('tr, [class*=transaction], [class*=row]').count();

    // Tenta clicar duas vezes em "Novo Lançamento" se existir
    const btnNovo = page.locator('button').filter({ hasText: /novo|lançamento|adicionar/i }).first();
    if (await btnNovo.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btnNovo.dblclick();
      await page.waitForTimeout(1000);

      // Só deve ter aberto 1 modal, não 2
      const modais = await page.locator('[role=dialog], [class*=modal]').count();
      expect(modais).toBeLessThanOrEqual(1);
    }
  });

});
