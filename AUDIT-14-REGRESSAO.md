# AUDIT-14-REGRESSAO — Testes de regressão do B1

**Fase:** 14 — Testes de regressão
**Branch:** `audit/fix-invite-reentry` · **Base:** `1aafe63`
**Data:** 2026-08-31
**Status:** ⚠️ **NÃO PUBLICADO.** `main` intocada.

> **Regra desta fase: nenhuma publicação se houver regressão.**
> Uma regressão foi encontrada, diagnosticada e corrigida. O resultado final não tem regressões.

---

## 1. Resultado consolidado

```
TESTES EXISTENTES ............ 38/38   ✅ preservados
  · autoTesteFase4  (invariantes de PG) ......... 11/11
  · autoTesteE1     (contrato de escrita) ....... 27/27
NOVOS — fluxo de convite e reentrada .......... 46/46   ✅
  · autoTesteB1 ................................. 46/46
                                          ─────────────
TOTAL DA SUÍTE EMBUTIDA ....................... 84/84
SONDAS DE REGRESSÃO DIRIGIDA .................. 28/28
                                          ─────────────
                                                112/112
```

**Zero regressões nas suítes existentes.** Nenhuma asserção anterior falhou em nenhuma execução.

---

## 2. ⚠️ A regressão encontrada — e por que ela importa

A sonda **R1**, executada contra os **258 participantes ativos reais** de produção, reprovou:

```
R1 — cada pessoa, digitando os PRÓPRIOS dados, cai no PRÓPRIO cadastro?
     testadas: 249 (9 sem WhatsApp, não testáveis)
     acertos : 248
     ERROS   : 1
```

### Diagnóstico

Um dos PGs tem **duas fichas da mesma pessoa** — é uma duplicidade já conhecida e registrada fora
deste repositório. A assinatura que importa para a auditoria é esta:

| Característica das duas fichas | |
|---|---|
| WhatsApp | **o mesmo** nas duas |
| Nome | o de uma é **prefixo de palavra inteira** do da outra |
| Papel | idêntico nas duas |
| Progresso | **muito diferente** — uma tem várias vezes o da outra |

Com a comparação estrita anterior, os dois nomes nunca casavam e o problema ficava latente. Com a
régua tolerante do B1.2, **os dois passam a ser reconhecidos como a mesma pessoa — o que está
correto** — mas `buscarCadastroExistente` devolvia **o primeiro do array**.

> **O risco real:** se a ordem da lista fosse outra, a pessoa seria religada à ficha de progresso
> menor e **pareceria ter perdido a maior parte do que conquistou**. Fazer a identidade de alguém
> depender da ordem de um array é inaceitável.

*Os valores exatos e a identificação do PG ficam fora deste repositório, que é público: eles não
acrescentam nada ao raciocínio nem à reprodução, e permitiriam identificar a pessoa.*

### Correção aplicada

`buscarCadastroExistente` deixou de usar `find` (primeiro que aparece) e passou a **selecionar de
forma determinística** entre todos os candidatos:

1. **Nome idêntico** ganha de nome apenas compatível — a evidência mais forte prevalece;
2. entre iguais, ganha a ficha com **mais progresso** — a reentrada nunca rebaixa ninguém.

### Verificação após a correção

```
R1  → 249/249 acertos · 0 erros
R1c → 52 nomes acentuados, digitados SEM acento:
      52 recuperados corretamente · 0 caíram na pessoa errada
```

Três asserções novas foram acrescentadas à suíte para que isto não volte:
`B1-28` (vence quem tem mais progresso), `B1-29` (o resultado independe da ordem da lista),
`B1-30` (nome idêntico prevalece mesmo com menos XP).

---

## 3. Testes por categoria

### 3.1 Testes existentes — 38/38 ✅

| Suíte | Antes do B1 | Depois do B1 |
|---|---|---|
| `autoTesteFase4()` — capacidade, invariantes, guarda de esvaziamento | 11/11 | **11/11** |
| `autoTesteE1()` — intenção, máscara, carimbo, fallback, guardas, textos | 27/27 | **27/27** |

### 3.2 Testes de convite — ✅

| Verificação | Resultado |
|---|---|
| Participante novo entra | ✅ |
| Convite expirado é recusado | ✅ |
| Convite de **outra** pessoa continua recusado | ✅ |
| Reentrada não é barrada por prazo vencido | ✅ |
| Convite não é reconsumido na reentrada (`usadoEm` estável) | ✅ |
| Máscara de gravação de cada operação **inalterada** | ✅ |

### 3.3 Testes de reentrada — ✅

| Verificação | Resultado |
|---|---|
| `aceite → aceite → aceite` produz o mesmo estado | ✅ |
| Participante existente não duplica | ✅ |
| Removido reentra, `removed` é limpo, volta à lista | ✅ |
| Progresso do removido preservado (210 XP) | ✅ |
| Reativação é carimbada | ✅ |

### 3.4 Testes de identidade — ✅

| Verificação | Resultado |
|---|---|
| 4 variações de digitação recuperam o cadastro | ✅ |
| Aparelho sem `localStorage` recupera | ✅ |
| `memberId` órfão é reconciliado na leitura | ✅ |
| **Homônimo bloqueia a reconciliação** | ✅ |
| Nenhuma duplicidade de nome nem de identidade | ✅ |
| **249/249 pessoas reais caem no próprio cadastro** | ✅ |
| **52/52 nomes acentuados recuperados sem acento** | ✅ |

### 3.5 Testes de persistência — 7/7 ✅

| Verificação | Resultado |
|---|---|
| Máscara de `convite-criar` = `ts,convites` | ✅ inalterada |
| Máscara de `convite-revogar` = `ts,convites` | ✅ inalterada |
| Máscara de `convite-aceitar` = `dados,ts,convites` | ✅ inalterada |
| Máscara de `grupos` = `dados,ts,tutores` | ✅ inalterada |
| Contrato recusa campo fora da lista | ✅ |
| Contrato recusa `dados` vazio | ✅ |
| Contrato aceita intenção válida | ✅ |

### 3.6 Testes de concorrência — ✅

| Verificação | Resultado |
|---|---|
| Dois aceites próximos preservam-se mutuamente | ✅ |
| **R2** — o aceite carimbado vence a cópia velha no merge | ✅ *(antes vencia a velha)* |
| Sem carimbo, o comportamento antigo do merge é preservado | ✅ *(o merge em si não foi alterado)* |

### 3.7 Testes de versões — 4/4 ✅

| Verificação | Resultado |
|---|---|
| `SCHEMA_VERSION` inalterado (2) | ✅ |
| `VERSAO_CONVITE` inalterada (2) | ✅ |
| Os 492 convites da base (versão 2) continuam válidos | ✅ |
| Guarda de perda barra payload de versão antiga | ✅ |

### 3.8 Testes de guards — 5/5 ✅

| Guarda | Resultado |
|---|---|
| G1 — perda de PG | ✅ dispara |
| G2 — esvaziamento | ✅ dispara |
| G3 — invariantes | ✅ dispara |
| G4 — colisão de slot | ✅ dispara |
| Payload legítimo **não** é barrado | ✅ |

> **Nota de método:** a asserção "payload legítimo não é barrado" reprovou na primeira execução.
> A causa era **estado residual da minha própria sonda** (o teste do G4 deixou
> `pgCriacaoPretendida` preenchido). Reexecutada com o estado zerado, passou nos três formatos
> testados. **Não era regressão do código** — mas registro aqui porque a distinção entre "o teste
> está errado" e "o código está errado" é o que dá valor a esta fase.

---

## 4. Riscos residuais — verificação dirigida

Os riscos declarados no [AUDIT-13](AUDIT-13-IMPLEMENTACAO-B1.md) §8 foram testados um a um.

### R1 — régua de nome mais tolerante · 🟢 **RESOLVIDO**

Contra os 258 nomes reais: 21 pares de nomes distintos que a régua une; **apenas 1 par com
WhatsApp também compatível** — e esse par é uma duplicidade já conhecida, isto é, a **mesma
pessoa**. Com o desempate determinístico, 249/249 acertam.

### R2 — o carimbo inverte quem vence o merge · 🟡 **verificado, aceito**

Confirmado que o aceite carimbado agora vence a cópia velha — que é exatamente o objetivo (F-70).
Confirmado também que, **sem** carimbo, o desempate antigo é preservado: `mergeGruposData` não foi
alterada. **Permanece pendente o teste de convivência com uma versão antiga gravando em paralelo**
— não reproduzível em bancada.

### R5 — `findMeuParticipante` passou a gravar · 🟢 **RESOLVIDO**

| Verificação | Resultado |
|---|---|
| Reconcilia na 1ª chamada | ✅ |
| 2ª e 3ª chamadas **não** remexem (idempotente) | ✅ |
| Não toca no registro de outra pessoa | ✅ |
| Não muta quando já bate por `memberId` | ✅ |
| Homônimo bloqueia a mutação | ✅ |
| Registro removido não é reconciliado | ✅ |

A função tem 5 chamadores (`syncProgressoParaFirebase`, `bumpPgProgress`,
`getMeuEmbaixadoresParticipante` e 2 na suíte). A mutação ocorre **uma vez** e chamadas repetidas
em renderização não regravam.

### R3, R4 · 🟢 sem alteração — ver AUDIT-13 §8

### R6 — **B2 não implementado** · 🟠 **ATIVO**

5xx ainda encerra na primeira tentativa, sem timeout e sem retomada. É a causa contribuinte mais
frequente de falha de gravação e **continua ativa**. Próxima etapa.

---

## 5. Conformidade

| Verificação | Resultado |
|---|---|
| Escritas em produção durante os testes | **nenhuma** |
| `updateTime` de `jdpg/grupos` | alterado apenas por aparelhos em campo, nunca por esta sessão |
| `firestore.rules` | **intocado** |
| `main` | **intocada** em `1aafe63` |
| Push para o GitHub | **nenhum** |
| `index.html` publicado | continua o de 28/08 (`Last-Modified` inalterado) |

**Sobre os dados reais usados no teste R1:** nome, WhatsApp e número do PG dos 258 participantes
ativos foram exportados do instantâneo para um arquivo **no scratchpad**, servido apenas em
`localhost`. **Esse arquivo nunca entrou no repositório** e é descartado com a bancada.

---

## 6. Veredito

> **Não há regressão.** As 38 asserções existentes continuam passando, 46 novas foram
> acrescentadas, e as 28 sondas dirigidas de persistência, concorrência, versões e guards passam.
>
> A única regressão encontrada — o desempate por ordem de array em cadastros duplicados — foi
> **corrigida e coberta por três novas asserções**.
>
> **A publicação continua bloqueada**, não por regressão, mas porque o **B2 não foi implementado**
> (R6) e porque a homologação do R2 exige um teste de convivência entre versões que a bancada não
> reproduz.
