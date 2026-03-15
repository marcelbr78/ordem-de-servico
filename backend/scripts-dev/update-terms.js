
const http = require('http');

async function updateTerms() {
    try {
        // 1. Login
        const loginUrl = 'http://localhost:3001/auth/login';
        console.log('1. Autenticando...');
        const loginRes = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin', password: 'admin1234' })
        });

        if (!loginRes.ok) throw new Error(`Login falhou: ${loginRes.status}`);
        const { access_token } = await loginRes.json();
        console.log('✅ Token obtido.');

        // 2. Put Terms
        const termsText = `
1. GARANTIA
- A garantia é de 90 (noventa) dias, cobrindo exclusivamente o serviço executado e as peças substituídas descritas nesta Ordem de Serviço.
- O prazo de garantia inicia-se na data de retirada do equipamento.

2. PERDA DA GARANTIA
A garantia será automaticamente anulada em casos de:
- Mau uso, quedas, ou danos físicos posteriores à entrega.
- Contato com líquidos ou oxidação.
- Rompimento do selo de garantia.
- Tentativa de reparo ou abertura do aparelho por terceiros.

3. ABANDONO
- Equipamentos não retirados no prazo de 90 dias após a notificação de "Pronto" ou "Orçamento Reprovado" serão considerados abandonados.
- A empresa poderá dar a destinação que julgar conveniente para custear as despesas de armazenamento e peças, conforme Art. 1.275 do Código Civil.

4. BACKUP E DADOS
- A empresa não se responsabiliza pela perda de dados (fotos, contatos, arquivos) durante o processo de reparo. Recomenda-se realizar backup antes de deixar o aparelho.

Declaro estar de acordo com os termos acima e ter recebido o aparelho testado e em perfeitas condições de funcionamento.
`.trim();

        console.log('2. Atualizando termos...');
        const updateRes = await fetch('http://localhost:3001/settings/service_terms', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            },
            body: JSON.stringify({
                value: termsText,
                type: 'string', /// backend setting types are lowercase
                description: 'Termo de Garantia e Entrega (visível na impressão)',
                isPublic: true
            })
        });

        if (!updateRes.ok) {
            console.error('❌ Erro ao atualizar:', await updateRes.text());
        } else {
            console.log('✅ Termos atualizados com sucesso!');
            console.log('Texto aplicado:\n', termsText);
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

updateTerms();
