# MUTIRÃO DE NATAL 2026 · FASE 10 — Matriz de testes de publicação

**Data:** 2026-09-08 · **Base:** `58c9dea` (FASE 9 commitada) · **Status:** ⛔ **matriz executada — publicação BLOQUEADA**
**Alteração:** `index.html` — **137 inserções, 0 remoções.** Só a matriz de testes; nenhum código de produção mudou.

---

# 1. VEREDITO

> ## ⛔ A campanha NÃO pode ser publicada ainda.
>
> **16 dos 17 pontos da matriz passaram. O que falta não é um defeito — é uma funcionalidade que nunca foi construída: a sincronização.**

| | |
|---|---|
| ✅ Passaram | **16** |
| ❌ Falharam | **0** |
| ⛔ Bloqueados | **1** — o T9 |

---

# 2. A matriz, ponto a ponto

| # | Teste | Resultado | Medido |
|---|---|---|---|
| **T1** | Participante registra 1 kg | ✅ | 0 → **1 kg** no PG |
| **T2** | Participante registra 20 kg | ✅ | 1 → **21 kg** no PG |
| **T3** | Dois participantes registram | ✅ | **25,5 kg** · 2 pessoas · 3 entregas |
| **T4** | Coordenador registra externo | ✅ | **35,5 kg** · **1 externo** contabilizado |
| **T5** | Vários externos | ✅ | João 10 · Rita 3 · Carlos 2 · João 5 → **4 entregas, 3 pessoas** |
| **T6** | Participante **não** registra externo | ✅ | bloqueado: `sem_autoridade` |
| **T7** | Coordenador **não** registra em outro PG | ✅ | bloqueado: `sem_autoridade` |
| **T8a** | Fechar e reabrir o app | ✅ | 7 entregas · 45,5 kg intactos |
| **T8b** | Reentrada com identidade NOVA | ✅ | histórico continua visível: 2 entregas · 21 kg |
| **T9** | **Dois aparelhos — sincronização** | ⛔ **BLOQUEADO** | **§3** |
| **T10a–g** | Progresso oculto e íntegro | ✅ | **§4** |

## 2.1 Detalhes que valem registro

**T5** foi montado com o mesmo João entregando **duas vezes**. Resultado: as 4 entregas aparecem individualmente na lista, mas ele conta como **1 pessoa mobilizada**. Entrega e pessoa continuam sendo perguntas diferentes.

**T8b** é o caso real deste app: quem reentra por um convite pode ganhar um `memberId` novo. Testei exatamente isso — identidade nova, mesmo nome — e as 21 kg da pessoa **continuaram no histórico dela**. Se a busca fosse só por `memberId`, teriam sumido.

---

# 3. ⛔ T9 — por que está bloqueado

```
NÃO EXECUTÁVEL: as entregas são gravadas apenas no localStorage do aparelho e não
existe caminho de sincronização implementado (decisão Opção 1 × Opção 2 em aberto).
Não é defeito de código — é ausência de funcionalidade. IMPEDE A PUBLICAÇÃO.
```

**Deixei esse texto dentro da própria bateria, não só neste relatório.** Quem rodar a matriz antes de publicar vê o impedimento na tela, não numa nota de rodapé.

## 3.1 O que aconteceria se publicássemos assim

| Situação | O que a pessoa veria |
|---|---|
| Maria registra 10 kg no celular dela | ✅ funciona, ela vê 10 kg |
| A coordenadora abre o Painel dela | ❌ vê **0 kg** — a entrega da Maria não existe para ela |
| A coordenadora lança 20 kg de um externo | ✅ no aparelho dela |
| Maria olha o "total do meu PG" | ❌ vê só os 10 kg dela |
| Dashboard do PG | ❌ mostra número diferente em cada celular |
| Prevenção de duplicidade (FASE 6) | ❌ cega entre aparelhos — a mesma entrega lançada em dois celulares não é detectada |

**Cada aparelho viraria uma ilha, e o "Dashboard do PG" mostraria um número diferente para cada pessoa.** Num app que já teve incidentes de dados divergindo entre aparelhos, publicar assim seria repetir o problema de propósito.

---

# 4. T10 — Progresso: oculto, não removido

Provado nos dois lados:

| Verificação | Resultado |
|---|---|
| T10a — chave `MOSTRAR_PROGRESSO_PG_HOME` | `false` ✅ |
| T10b — `renderPgProgressHome()` ainda existe | ✅ |
| T10c — chamá-la não desenha nada | ✅ |
| T10d — as 10 funções de cálculo continuam lá | ✅ nenhuma removida |
| T10e — as 5 metas semanais íntegras | ✅ |
| T10f — os cálculos continuam respondendo | ✅ |
| T10g — o CSS `.pg-progress-*` continua no arquivo | ✅ |

**E a prova que mais importa:** abri o **Painel do Tutor** e ele renderizou sem erro, mostrando **"Progresso semanal do grupo"** e **"Nível do Pequeno Grupo"** — junto com o botão 🎁 Mutirão de Natal. Ao mesmo tempo, a Home continua **sem** o card do Progresso.

> Ou seja: o Progresso saiu da vista do participante e **continua inteiro, calculando e visível para a liderança**. Restaurá-lo na Home é trocar `false` por `true`.

---

# 5. Cobertura total do projeto

| Bateria | Testes | Falhas |
|---|---|---|
| `autoTesteMutiraoMatriz()` — T1–T10 (FASE 10) | 17 | 0 (1 bloqueado) |
| `autoTesteMutiraoPermissoes()` — FASE 9 | 20 | 0 |
| `autoTesteMutirao()` — serviços, FASES 2/6/8 | 49 | 0 |
| `autoTesteFase4()` — invariantes do app | 11 | 0 |
| `autoTesteE1()` — contrato de gravação | 27 | 0 |
| **TOTAL** | **124** | **0 falhas** |

Chave real `jdpg_mutirao_natal_v1` ao final: **`null`** — nenhuma bateria encostou no dado de verdade.

---

# 6. ⚠️ O que esta matriz NÃO prova

Ela roda em **bancada**: navegador real, código real, mas **identidades simuladas** e **um aparelho só**. Ela não alcança:

| O que falta | Só se prova com |
|---|---|
| T9 — dois aparelhos | sincronização implementada **+** dois celulares reais |
| Fechar o PWA de verdade e reabrir pelo atalho | aparelho real (é o achado de campo mais recorrente deste projeto) |
| Entrar pelo link do WhatsApp | aparelho real |
| Latência e rede instável do hospital | aparelho real |

É a mesma limitação que o protocolo **AUDIT-17 (R2)** já descrevia para a `1.3.0-rc1`. **O Mutirão herda essa exigência**: quando o R2 for executado, ele precisa ganhar um roteiro para a campanha também.

---

# 7. Caminho até a publicação

```
   [ HOJE ]  124 testes, 0 falhas · T9 bloqueado
      │
      ├─ 1. DECIDIR  Opção 1 × Opção 2  ← só você
      │
      ├─ 2. IMPLEMENTAR a sincronização
      │        · nova regra no Firestore (senão vira 403 disfarçado de "sem conexão")
      │        · trava otimista igual à do documento de grupos
      │
      ├─ 3. T9 passa a ser executável → rodar com 2 aparelhos
      │
      ├─ 4. R2 da 1.3.0-rc1 (AUDIT-17) + roteiro do Mutirão
      │
      ├─ 5. nova RC
      │
      └─ 6. merge para a main = PUBLICAÇÃO
```

## 7.1 Pendências menores (não bloqueiam, mas ficam registradas)

| | |
|---|---|
| **Botão de desfazer** | motor pronto e **provado** (S-10, S-18) — falta só o botão na tela |
| **`kgMax = 200`** | continua sendo suposição minha, nunca confirmada |
| **Campo de setor do externo** | desempataria homônimos |

---

# 8. Situação

| | |
|---|---|
| FASE 0 → 10 | ✅ todas concluídas |
| Matriz T1–T10 | ✅ executada · 16 ok · 0 falhas · **1 bloqueado** |
| **Publicação** | ⛔ **bloqueada pelo T9** |
| `main` | 🔒 intocada em `1aafe63` |
| Produção | 🔒 nenhuma escrita |
