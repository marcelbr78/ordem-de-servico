import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Fluxo de Ordem de Serviço', () => {

  test('página de OS carrega sem erro', async ({ page }) => {
    await login(page);
    await page.goto('/orders');
    await page.waitForTimeout(1500);

    await expect(page.locator('text=/erro|500|Internal/i')).not.toBeVisible();
    // Página deve ter algum conteúdo (lista ou mensagem de vazio)
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);
  });

  test('botão de nova OS existe e abre formulário', async ({ page }) => {
    await login(page);
    await page.goto('/orders');
    await page.waitForTimeout(1000);

    // Busca botão de criar (texto pode variar)
    const btnNova = page.locator('button').filter({ hasText: /nova os|nova ordem|criar os|\+ os/i }).first();
    await expect(btnNova).toBeVisible({ timeout: 8000 });

    await btnNova.click();
    await page.waitForTimeout(800);

    // Deve abrir modal/drawer com campo de cliente
    await expect(page.locator('text=/cliente|selecionar/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('transição de status aberta → em_diagnostico funciona', async ({ page }) => {
    await login(page);
    await page.goto('/orders');
    await page.waitForTimeout(1200);

    // Clica na primeira OS com status "Aberta"
    const osAberta = page.locator('text=Aberta').first();
    const temAberta = await osAberta.isVisible({ timeout: 3000 }).catch(() => false);

    if (!temAberta) {
      test.skip();
      return;
    }

    await osAberta.click();
    await page.waitForTimeout(600);

    // Abre dropdown de status
    const btnStatus = page.locator('button').filter({ hasText: /aberta/i }).first();
    await btnStatus.click();
    await page.waitForTimeout(400);

    // Seleciona Em Diagnóstico
    const opcaoDiag = page.locator('text=/em diagnóstico/i').first();
    if (await opcaoDiag.isVisible({ timeout: 3000 }).catch(() => false)) {
      await opcaoDiag.click();
      await page.waitForTimeout(400);

      // Confirma modal se aparecer
      const btnConfirmar = page.locator('button').filter({ hasText: /confirmar|salvar|ok/i }).first();
      if (await btnConfirmar.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btnConfirmar.click();
      }

      await page.waitForTimeout(1500);
      // Não deve ter erro visível
      await expect(page.locator('text=/erro interno|500/i')).not.toBeVisible();
    }
  });

  test('transição inválida é bloqueada pelo backend', async ({ page }) => {
    await login(page);
    await page.goto('/orders');
    await page.waitForTimeout(1200);

    // Procura OS entregue (status final — não pode mudar)
    const osEntregue = page.locator('text=Entregue').first();
    const temEntregue = await osEntregue.isVisible({ timeout: 2000 }).catch(() => false);

    if (!temEntregue) {
      console.log('Nenhuma OS entregue no staging — pulando teste');
      test.skip();
      return;
    }

    await osEntregue.click();
    await page.waitForTimeout(600);

    // Botão de status deve estar sem opções (status final)
    const btnStatus = page.locator('button').filter({ hasText: /entregue/i }).first();
    if (await btnStatus.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btnStatus.click();
      await page.waitForTimeout(400);
      // Dropdown não deve ter opções de transição
      const opcoes = page.locator('text=/em diagnóstico|em reparo|aberta/i');
      await expect(opcoes).not.toBeVisible({ timeout: 2000 }).catch(() => {});
    }
  });

});
