# SmartParts - Cotação Automática: Aprendizados e Melhorias Futuras

## Visão Geral

O módulo SmartParts automatiza cotações de peças enviando mensagens via WhatsApp para fornecedores cadastrados e coletando respostas com preços.

---

## Aprendizados da Implementação Atual

### 1. Comunicação com Fornecedores

- **Problema**: A mensagem original era muito robótica ("Cotação Automática", "responda com o valor").
  Isso é intrusivo, artificial e pode irritar fornecedores reais que recebem muitas mensagens.
- **Solução aplicada**: Mensagem conversacional e natural, sem parecer um bot.
- **Aprendizado**: Fornecedores são parceiros comerciais, não máquinas. A comunicação deve ser humana.

### 2. Extração de Preços de Linguagem Natural

- **Problema**: O regex original só detectava formatos rígidos como "150,00" ou "R$ 150".
- **Solução aplicada**: Parser inteligente com 3 camadas:
  
  **Camada A - Catálogo (formato real de fornecedores):**

  ```
  📱 4063 - FRONTAL MOTO G14 - G54 - CHINA
  💰 R$ 75.00
  📱 68 - FRONTAL MOTO G54 - COM ARO - CHINA
  💰 R$ 85.00
  📱 1675 - FRONTAL MOTO G54 - COM ARO - PREMIUM
  💰 R$ 105.00
  ```

  → Extrai 3 opções: R$ 75, R$ 85, R$ 105 (menor preço = R$ 75)

  **Camada B - Múltiplos R$ no texto:**
  - "A tela simples sai por R$ 120,00 e a premium R$ 180,00"
  → Extrai 2 opções: R$ 120 e R$ 180

  **Camada C - Preço único em linguagem natural:**
  - "Tenho por 150" → R$ 150,00
  - "Consigo fazer a 89,90" → R$ 89,90
  - "Fica 1.200,00 reais" → R$ 1.200,00
  - "200" (número puro) → R$ 200,00

- **Aprendizado**: Fornecedores enviam catálogos, não respostas simples. O parser precisa lidar com múltiplas opções.
- **Decisão de design**: O menor preço é usado para ranking automático, mas a mensagem completa é salva para o operador ver todas as opções.

### 3. Formato de Número WhatsApp Brasil

- **Problema**: Números brasileiros com 13 dígitos (55+DDD+9+8dígitos) nem sempre correspondem
  ao JID do WhatsApp (que pode ter 12 dígitos, sem o 9º dígito).
- **Solução aplicada**: Uso do endpoint `chat/whatsappNumbers` da Evolution API para resolver o JID correto.
- **Aprendizado**: Nunca confiar no formato do número armazenado. Sempre verificar com a API.

### 4. Evolution API v1.8.2 vs v2.x

- **Problema**: O payload de envio de mensagem é diferente entre versões.
  - v1.8.2: usa `textMessage: { text: "..." }`
  - v2.x: usa `text: "..."`
- **Aprendizado**: Sempre verificar a versão da API e consultar a documentação correspondente.

### 5. Cotações Expiradas

- **Problema**: Quando uma cotação expira, o sistema bloqueava a criação de novas cotações.
- **Solução aplicada**: Cancelar cotações antigas (PENDING/EXPIRED) automaticamente antes de criar uma nova.
- **Aprendizado**: Sempre permitir retry de operações.

---

## Melhorias Futuras Planejadas

### Prioridade Alta

#### 1. Inteligência na Extração de Respostas

- [ ] Integrar com IA (GPT/Gemini) para entender respostas complexas:
  - "Essa peça tá em falta, mas tenho uma compatível por 180"
  - "Posso fazer 150 à vista ou 170 parcelado"
  - "Não tenho, mas o João da distribuidora X tem"
- [ ] Detectar disponibilidade (tem/não tem) além do preço
- [ ] Detectar prazo de entrega mencionado na resposta
- [ ] Detectar condições (à vista, parcelado, frete incluso)

#### 2. Confirmação Automática

- [ ] Após receber preço, enviar confirmação ao fornecedor:
  "Obrigado! Anotei R$ 150,00. Vamos avaliar e retornamos."
- [ ] Evitar que o fornecedor fique sem resposta

#### 3. Histórico de Preços por Fornecedor

- [ ] Manter histórico de preços por peça/fornecedor
- [ ] Dashboard mostrando tendências de preço
- [ ] Score de fornecedor (velocidade de resposta, preço médio, confiabilidade)

### Prioridade Média

#### 4. Templates de Mensagem Configuráveis

- [ ] Permitir que o lojista customize a mensagem de cotação nos Ajustes do Sistema
- [ ] Variáveis dinâmicas: {nomeFornecedor}, {nomePeça}, {nomeLoja}
- [ ] Preview antes de enviar

#### 5. Agendamento de Cotações

- [ ] Agendar cotações para horário comercial (não enviar de madrugada)
- [ ] Fila de envio inteligente com rate limiting
- [ ] Horário preferido por fornecedor

#### 6. Grupos de Fornecedores por Categoria

- [ ] Categorizar fornecedores (telas, baterias, placas, etc.)
- [ ] Enviar cotação apenas para fornecedores relevantes
- [ ] Auto-sugestão de fornecedores baseado no tipo de peça

#### 7. Respostas sem Preço

- [ ] Salvar todas as mensagens de fornecedores (mesmo sem preço detectado) ✅ (implementado)
- [ ] Interface para o operador ver todas as respostas e classificar manualmente
- [ ] Feed de conversas em tempo real por cotação

### Prioridade Baixa

#### 8. Negociação Automática

- [ ] Se o menor preço estiver acima de um threshold, enviar contraproposta
- [ ] "Consegue um desconto para quantidade?"
- [ ] Histórico de negociações

#### 9. Integração com Estoque

- [ ] Ao aprovar cotação, criar automaticamente pedido de compra
- [ ] Atualizar estoque quando peça chegar
- [ ] Rastreamento de entrega

#### 10. Relatórios

- [ ] Relatório mensal de cotações (quantas enviadas, respondidas, aprovadas)
- [ ] Ranking de fornecedores
- [ ] Economia gerada pela cotação automática vs. manual

---

## Arquitetura Técnica

### Fluxo Atual

```
Lojista → [Iniciar Cotação] → SmartPartsService.startQuote()
  → Para cada fornecedor ativo:
    → WhatsappService.sendMessage()
      → chat/whatsappNumbers (resolve JID correto)
      → message/sendText (envia via Evolution API)
  
Fornecedor responde no WhatsApp
  → Evolution API detecta mensagem (webhook MESSAGES_UPSERT)
  → POST /smartparts/webhook/whatsapp
  → SmartPartsController.handleWebhook()
    → Ignora mensagens próprias (fromMe)
    → SmartPartsService.handleIncomingMessage()
      → Encontra fornecedor por últimos 8 dígitos do telefone
      → extractPricesFromMessage() (3 camadas de parsing)
      → registerResponse() (salva no banco)
      → Atualiza bestPrice se menor

Frontend (polling 8s)
  → GET /smartparts/quotes/:id/supplier-status
  → Mostra quem respondeu ✅ e quem aguarda ⏳
  → Clique expande mensagem completa do fornecedor
```

### Entidades

- **Quote**: Cotação principal (orderId, productName, status, expiresAt, bestPrice, winnerId)
- **QuoteResponse**: Resposta individual (quoteId, supplierId, price, message)
- **Supplier**: Fornecedor (name, phone, email, active)

### Endpoints

- `POST /smartparts/quotes/start` - Iniciar cotação
- `GET /smartparts/quotes/order/:orderId` - Buscar cotação por OS
- `GET /smartparts/quotes/:quoteId/responses` - Respostas de uma cotação
- `GET /smartparts/quotes/:quoteId/supplier-status` - Status de todos os fornecedores (respondeu/aguardando)
- `POST /smartparts/webhook/whatsapp` - Webhook do Evolution API (público, sem auth)

---

## Notas de Configuração

- Evolution API v1.8.2 local via Docker
- Instance name: `loja_local` (configurável no .env)
- API Key: configurável no .env (`EVOLUTION_API_KEY`)
- Timeout de cotação: 30 minutos (configurável no código, futuro: nos ajustes)
- Delay entre mensagens: 4 segundos (evitar bloqueio do WhatsApp)
- **Webhook**: Configurado automaticamente pelo `rodar_sistema.bat`
  - URL: `http://host.docker.internal:3001/smartparts/webhook/whatsapp`
  - Eventos: `MESSAGES_UPSERT`
  - Necessário para receber respostas dos fornecedores

---

*Documento criado em: 2026-02-16*
*Última atualização: 2026-02-16*
