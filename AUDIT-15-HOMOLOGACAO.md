# AUDIT-15-HOMOLOGACAO — Cenário real controlado

**Fase:** 15 — Homologação
**Branch:** `audit/fix-invite-reentry` @ `ccbb917` · **Base:** `1aafe63`
**Data:** 2026-08-31
**Status:** ⚠️ **NÃO PUBLICADO.** `main` intocada.

**Critério de aprovação:** o fluxo precisa ser **previsível**, **idempotente** e **não destrutivo**.

---

## Resultado

| | |
|---|---|
| Jornada completa (11 passos) | ✅ **APROVADA** |
| Variantes (5) | ✅ **APROVADAS** |
| Previsível · Idempotente · Não destrutivo | ✅ **os três critérios** |

**Diferença desta fase para as anteriores:** aqui o convite é **gerado de verdade** por
`gerarConvite()` com autoridade real, a pessoa passa pela **tela real** do app (`renderTelaConvite`
+ os campos `#conv-nome`/`#conv-wa` + `confirmarEntradaConvite`), e a saída usa a função real
`removerDoGrupoAtual()`. Nas fases 13 e 14 os convites eram injetados direto — **a geração e a
saída nunca haviam sido exercitadas**.

---

## 1. Ambiente

```
TESTE .......... ?teste=1 · MODO_TESTE = true · prefixo teste_
FIREBASE ....... isolado: fbReadDoc e fbWriteGrupos substituídos por servidor
                 forjado em memória COM pré-condição fiel. Nenhuma rede.
PRODUÇÃO ....... intocada
CÓDIGO ......... commit ccbb917 (verificado por marcadores em tempo de execução)
PG de teste .... slot 70, "PG HOMOLOGACAO", com uma coordenadora real
```

---

## 2. Jornada principal

```
Tutor → gera convite → participante → abre → entra → sai → recebe novamente → reentra
```

| # | Passo | Resultado | |
|---|---|---|---|
| 1 | Coordenadora gera o convite | `ok=true` · convite nasce **pendente** | ✅ |
| 2 | Participante abre o link | formulário de entrada exibido | ✅ |
| 3 | Participante entra | ativos: *Coordenadora Ana, Maria Aparecida Souza* | ✅ |
| 3b | Progresso registrado e sincronizado | `xp=640` | ✅ |
| 4 | **Participante sai do grupo** | `removed=true` · sai da lista · **xp 640 guardado** | ✅ |
| 5 | Recebe novamente o **mesmo** link | convite=`utilizado` · `usadoPor` = ela mesma | ✅ |
| 6a | O mesmo link **não é recusado** | formulário exibido | ✅ |
| 6b | Voltou à lista do PG | ativos: *Coordenadora Ana, Maria Aparecida Souza* | ✅ |
| 6c | **Não destrutivo** | xp 640→640 · `ts` igual · `dataInscricao` igual | ✅ |
| 6d | **Sem duplicidade** | 2 registros no PG | ✅ |
| 6e | Convite **não reconsumido** | `usadoEm` estável | ✅ |

> **O passo 4 → 6 é a reclamação original resolvida de ponta a ponta:** a pessoa saiu, recebeu o
> mesmo convite de volta, e reentrou — mantendo os 640 pontos, a data de inscrição e o `ts`
> original, sem gerar um segundo cadastro.

---

## 3. Variantes

| | Variante | Resultado | |
|---|---|---|---|
| **A** | **Mesmo convite**, 3 aberturas seguidas | 2 registros · xp 640 · continua na lista | ✅ idempotente |
| **B** | **Novo convite** para quem já é membro | entrou · 2 registros · xp 640 | ✅ não duplica, não rebaixa |
| **C** | **Outro dispositivo** (identidade nova, armazenamento zerado) | entrou · 2 registros · identidade reconciliada para `H-CELULAR-NOVO` · **xp 640 preservado** | ✅ |
| **D** | **Outro navegador** + digitação diferente (`"Maria Aparecida"`, wa formatado) | entrou · 2 registros · **nome mantido "Maria Aparecida Souza"** · xp 640 | ✅ nome não empobrecido |
| **E** | **Identidade já existente** (mesmo aparelho) | entrou · 2 registros · xp 640 | ✅ reconhecida por `memberId` |

**Nota sobre C e D:** "outro dispositivo" e "outro navegador" são **mecanicamente idênticos** para
este aplicativo — ambos significam armazenamento zerado e `memberId` novo. A variante D acrescenta
o agravante da digitação diferente, que era o caso que antes produzia duplicata com XP zerado.

---

## 4. Critérios de aprovação

### Previsível ✅
Em 16 execuções (11 passos + 5 variantes), o resultado foi sempre o mesmo para a mesma entrada.
Nenhum comportamento dependeu de ordem de lista, de qual aparelho abriu primeiro ou de quantas
vezes o link foi aberto.

### Idempotente ✅
Abrir o mesmo convite 1, 2, 3 ou 4 vezes produz **exatamente o mesmo estado final**: 2 registros,
640 XP, `usadoEm` inalterado. Confirmado também na Fase 13 com inspeção dos estados intermediários.

### Não destrutivo ✅
Em **todas** as variantes, comparação antes/depois:

| Campo | Antes | Depois |
|---|---|---|
| XP | 640 | **640** |
| estudos / missões / streak | preservados | **preservados** |
| `ts` (identidade do registro) | original | **original** |
| `dataInscricao` | original | **original** |
| nome completo | "Maria Aparecida Souza" | **"Maria Aparecida Souza"** |
| registros no PG | 2 | **2** |

Nenhum dado legítimo desapareceu em nenhum cenário.

---

## 5. Notas de método — dois erros da minha própria bancada

Registrados porque distinguir "o teste está errado" de "o código está errado" é o que dá valor a
esta fase.

1. **`dados[0]` deixou de ser o PG de teste.** Após uma gravação de rota `grupos`, o documento
   passa a conter os 70 slots ordenados por número — e `dados[0]` vira o slot 1, vazio. Minha
   sonda lia por índice e concluiu que a participante havia "sumido da nuvem". **Era leitura
   errada da minha sonda.** Corrigido para buscar por `num`.
2. **O estado não sobrevive entre chamadas separadas** ao console. As primeiras tentativas
   dividiram a jornada em blocos e perderam `window.__H.doc` no meio. A jornada passou a rodar
   **num único bloco**.

Nenhum dos dois era defeito do aplicativo. Ambos custaram tentativas e ficam registrados para a
próxima homologação.

---

## 6. O que esta homologação **não** cobre

| Não coberto | Por quê |
|---|---|
| **Dois aparelhos físicos de verdade** | A bancada simula identidades distintas no mesmo navegador; não reproduz o armazenamento real de dois celulares |
| **Entrega do link pelo WhatsApp** | Fora do aplicativo. As causas F-07/F-09 (link truncado, app que não abre) permanecem |
| **Retomada do app instalado na tela inicial** | Exige aparelho real. É o cenário que mais retém código antigo |
| **Latência de rede real** | A bancada responde instantaneamente. O envio de ~396 KB por aceite (F-64) não é observável aqui |
| **Erro de rede, timeout e retry** | ⚠️ **É o B2, não implementado.** Um 5xx ainda encerra o aceite na primeira tentativa |
| **Convivência com uma versão antiga gravando em paralelo** | Risco R2. Não reproduzível em bancada |

---

## 7. Veredito

> **APROVADO nos três critérios.** O fluxo de entrada, saída e reentrada é previsível,
> idempotente e não destrutivo, incluindo os casos que antes falhavam: mesmo convite reenviado,
> aparelho novo, navegador novo, nome digitado diferente e identidade já existente.

**A publicação continua bloqueada**, pelos mesmos dois motivos da Fase 14 — nenhum deles é
regressão:

1. 🟠 **B2 não implementado** — erro transitório de servidor ainda é tratado como definitivo, sem
   timeout e sem retomada. É a causa contribuinte mais frequente de falha de gravação.
2. 🟡 **R2 sem teste de convivência** — o carimbo `updatedAt` muda quem vence o merge, e o efeito
   sobre um aparelho rodando a versão atual não foi observado.

**Recomendação:** aprovar o B1, implementar o B2, e publicar os dois juntos — com `APP_VERSION`
atualizada, sem o que não há como confirmar que a correção chegou aos aparelhos.
