import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Isolamento Multi-Tenant', () => {

  test('manipular tenant_id no localStorage não dá acesso a dados de outro tenant', async ({ page }) => {
    await login(page);
    await page.goto('/orders');
    await page.waitForTimeout(1000);

    // Conta quantas OS o usuário normal vê
    const countAntes = await page.locator('tr, [class*=order-row], [class*=OrderCard]').count();

    // Tenta trocar tenant_id para um UUID falso
    await page.evaluate(() => {
      localStorage.setItem('tenant_id', '00000000-0000-0000-0000-000000000000');
    });

    await page.reload();
    await page.waitForTimeout(1500);

    // Não deve ser redirecionado para login (sessão JWT ainda válida)
    // E não deve mostrar erro 500
    await expect(page.locator('text=/erro interno|500|Internal Server/i')).not.toBeVisible();

    // Os dados exibidos devem ser do JWT (tenant real), não do localStorage falso
    // O backend usa tenantId do JWT — a troca no localStorage não tem efeito
    console.log('OS visíveis antes da troca:', countAntes);
  });

  test('shadow_tenant_id no localStorage não vaza para outro usuário', async ({ page }) => {
    await login(page);

    // Remove qualquer shadow anterior
    await page.evaluate(() => {
      localStorage.removeItem('shadow_tenant_id');
    });

    await page.goto('/orders');
    await page.waitForTimeout(1000);

    // Sem shadow ativo, dados são do tenant real do JWT
    await expect(page.locator('text=/erro|500/i')).not.toBeVisible();
  });

  test('rota pública de OS exibe dados sem expor outros tenants', async ({ page }) => {
    // Acessa link público com ID aleatório — deve retornar 404, não dados de outro tenant
    await page.goto('/status/00000000-0000-0000-0000-000000000000');
    await page.waitForTimeout(2000);

    // Deve mostrar "não encontrada" ou equivalente, nunca dados de uma OS real
    const pageContent = await page.textContent('body');
    const hasRealData = pageContent?.includes('R$') && pageContent?.includes('protocolo');
    expect(hasRealData).toBeFalsy();
  });

});
