# Módulo Billing — Regras críticas

## Responsabilidade
Geração automática e manual de faturas, checkout de pagamento, webhook de gateway.

## Fluxo de criação automática
Faturas são criadas via eventos de domínio — NUNCA chamar BillingService
diretamente de outros módulos. Use EventEmitter:
- `appointment.completed` → fatura de consulta (gerada na conclusão do atendimento, não na chegada)
- `exam.completed` → fatura de exame

## Cuidados com dados financeiros
- Valores sempre em DECIMAL(10,2) — nunca float nativo JavaScript
- `paid_at` só é preenchido quando status vai para PAID
- Faturas PAID não podem ser deletadas — apenas REFUNDED com nota obrigatória
- Faturas CANCELED também fazem soft delete

## Gateway de pagamento
- Provider atual: MOCKPAY (ambiente dev)
- Webhook valida assinatura HMAC antes de processar qualquer evento
- Idempotência: verificar `provider_payment_id` antes de marcar como PAID

## PriceCatalog
- Preços em DECIMAL(10,2) em reais (não centavos)
- Convênio: desconto de 60% sobre base_price (configurável futuramente)
- Fallback para OUTRO se tipo não encontrado no catálogo