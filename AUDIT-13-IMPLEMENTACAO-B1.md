# AUDIT-13-IMPLEMENTACAO-B1 — Núcleo funcional da correção robusta

**Fase:** 13 — Implementação controlada · **Etapa B1 (núcleo funcional)**
**Branch:** `audit/fix-invite-reentry` · **Base:** `1aafe63`
**Data:** 2026-08-31
**Status:** ⚠️ **NÃO PUBLICADO.** Aguarda homologação. `main` intocada.

> **B2 (hardening) NÃO foi implementado**, conforme a própria especificação:
> *"Somente depois que B1 estiver aprovado."*

---

## 1. Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `index.html` | **+355 / −19** linhas |
| `AUDIT-13-IMPLEMENTACAO-B1.md` | novo (este documento) |
| **`firestore.rules`** | ❌ **INTOCADO**, como exigido |

Nenhum outro arquivo foi tocado. `git diff --name-only` devolve apenas `index.html`.

## 2. Linhas alteradas

```
355 inserções · 19 remoções · 22 blocos de alteração
```

Das 355 inserções, **~200 são a nova suíte de testes** e **~60 são comentários** que registram
qual achado da auditoria cada trecho corrige. A alteração lógica efetiva é de **~95 linhas**.

**As 19 linhas removidas** foram revisadas uma a uma: todas pertencem ao fluxo de convite/
reentrada. Nenhuma funcionalidade não relacionada foi tocada.

## 3. Funções alteradas

| # | Função | Linha (base) | O que mudou | Achado corrigido |
|---|---|---|---|---|
| 1 | `validarConviteParaAceite` | 10009 | Aceita 4º parâmetro `memberId`. Convite `utilizado` **pela própria pessoa** deixa de ser recusa e vira **reentrada**. Prazo e autoridade do emissor não se aplicam à reentrada. Devolve `{ ok, reentrada }` | F-31, F-35 |
| 2 | `aceitarConvite` | 10185 | Passa `memberId` à validação · na reentrada **não reconsome** o convite · **limpa `p.removed`** · **reconcilia `p.memberId`** · preenche `wa` só quando vazio · **carimba `p.updatedAt`** · protege o progresso local com `Math.max` · devolve `reentrada`, `reconciliado`, `reativado` | F-31, F-37, F-23, F-70 |
| 3 | `renderTelaConvite` | 10358 | **Usa o retorno de `syncFromFirebase()`**: convite não encontrado com leitura falha vira `sem_conexao`, não `inexistente` · reconhece a reentrada na exibição | **F-01** |
| 4 | `mensagemConvite` | 10293 | 6 chaves novas (`versao_incompativel`, `conflito`, `sem_config`, `tamanho`, `erro`, `grupo_inexistente`) · texto de `utilizado` **deixa de afirmar "outra pessoa"** | F-22, F-03, F-31 |
| 5 | `findMeuParticipante` | 5932 | Quando acha por **nome** e o `memberId` divergiu, **reconcilia** — desde que o nome seja **único** entre os ativos. Havendo homônimo, não altera nada | **F-53** |
| 6 | `buscarCadastroExistente` | 12012 | Nome comparado por `nomesCorrespondem()` (tolera acento e nome curto) em vez de igualdade estrita. **Prova dupla mantida**: nome **E** WhatsApp | **F-11** |
| 7 | `nomePreferido` | *nova* | Impede que o aceite **empobreça** o nome cadastrado (efeito colateral do item 6, descoberto em teste) | — |
| 8 | `autoTesteB1` | *nova* | Suíte de 43 asserções sobre **entrada e reentrada** | **F-78** |

## 4. Testes criados

`autoTesteB1()` — **43 asserções**. Recusa-se a executar fora de `?teste=1`.
Substitui `fbReadDoc` e `fbWriteGrupos` por um servidor forjado em memória (com pré-condição
fiel), restaurados em `finally`. **Nenhuma rede é tocada.**

| Exigência da especificação | Asserções |
|---|---|
| 1. novo participante | B1-01 |
| 2. aceite repetido | B1-02, B1-03, B1-04 |
| 3. mesmo convite reenviado | B1-05 |
| 4. participante existente | B1-06, B1-07 |
| 5. participante removido | B1-08 … B1-12 |
| 6. divergência de `memberId` | B1-13, B1-14 (4 variações de digitação) |
| 7. ausência de `localStorage` | B1-15 |
| 8. `localStorage` inconsistente | B1-16, B1-17 |
| 9. navegador diferente | B1-13 (variações) |
| 10. dispositivo diferente | B1-15 |
| 14. dois aceites próximos | B1-23 |
| 15. preservação do progresso | B1-07, B1-11, B1-14, B1-24 |
| 16. ausência de duplicidade | B1-18, B1-19 |
| 17. convite expirado | B1-20, B1-21, B1-22 |
| 18. versão antiga sobre estado novo | B1-27 (guarda de perda) |
| Teste de não destruição | B1-24, B1-25, B1-26 |
| Mensagens específicas | B1-28 (7 motivos), B1-29 |
| **11. erro de rede · 12. timeout · 13. retry** | ⚠️ **B2 — não implementado nesta etapa** |

## 5. Resultado dos testes

| Suíte | Antes | Depois |
|---|---|---|
| `autoTesteFase4()` | 11/11 | **11/11** |
| `autoTesteE1()` | 27/27 | **27/27** |
| `autoTesteB1()` | — | **43/43** |
| **Total** | 38/38 | **81/81** |

**Nenhum teste existente regrediu.**

### Teste fundamental — `aceite → aceite → aceite`

Estados intermediários observados no documento forjado:

| | convite | `usadoPor` | `usadoEm` | participantes |
|---|---|---|---|---|
| antes | pendente | — | — | 1 |
| **após aceite 1** (`reentrada: false`) | utilizado | PV-EU | 1788196494332 | 2 |
| **após aceite 2** (`reentrada: true`) | utilizado | PV-EU | 1788196494332 | 2 |
| **após aceite 3** (`reentrada: true`) | utilizado | PV-EU | 1788196494332 | 2 |

**F(aceite) = F(F(aceite))** — verificado, incluindo a estabilidade de `usadoEm`.

### Teste de identidade

Cadastro na nuvem `ID-ANTIGO`; aparelho novo `ID-NOVO-APARELHO`; a pessoa digitou
**"Jose Antonio"** (sem acento, abreviado) e **"(21) 90000-0003"** (formatado à mão):

| Critério | Resultado |
|---|---|
| 1. participante identificado | ✅ |
| 2. identidade reconciliada | ✅ |
| 3. nenhum duplicado | ✅ |
| 4. progresso preservado | ✅ |
| 5. aceite concluído | ✅ |

### Teste de não destruição — antes/depois

| Campo | Antes | Depois |
|---|---|---|
| **`memberId`** | `ID-ANTIGO` | **`ID-NOVO-APARELHO`** ← único campo alterado |
| nome | José Antônio Gonçalves | José Antônio Gonçalves |
| XP | 1430 | 1430 |
| estudos | 9 | 9 |
| missões | 3 | 3 |
| streak | 12 | 12 |
| contrib | 7 | 7 |
| `ts` | 1788195810573 | 1788195810573 |
| `dataInscricao` | 01/07/2026 | 01/07/2026 |
| WhatsApp | 5521900000003 | 5521900000003 |
| participantes no PG | 2 | 2 |

## 6. Um defeito encontrado **pelos próprios testes**

A asserção `B1-04` reprovou na primeira execução. A causa **não estava no código de produção** —
estava no arnês de teste: a gravação não era aplicada ao documento forjado, então os aceites 2 e 3
encontravam o convite ainda **pendente** e os testes de idempotência **passavam sem exercitar
idempotência**. O arnês foi corrigido para honrar a pré-condição e aplicar a escrita.

Depois disso, um segundo defeito apareceu — este **real e introduzido por mim**: com a comparação
tolerante de nomes, alguém digitando "Jose Antonio" passava a ser reconhecido como
"José Antônio Gonçalves" e o `p.nome = nome` seguinte **substituía o nome completo pelo
abreviado**. Corrigido com `nomePreferido()` e coberto por B1-26/B1-27.

## 7. Comparação antes/depois do comportamento

| Situação | Antes | Depois |
|---|---|---|
| Reabrir o próprio convite | ❌ *"utilizado por outra pessoa"* | ✅ entra (reentrada) |
| Reenviar o mesmo link | ❌ recusa idêntica | ✅ funciona |
| Removido aceita convite novo | ❌ sucesso aparente, invisível no PG | ✅ volta a aparecer |
| Aparelho novo, nome sem acento | ❌ duplicata, XP zerado | ✅ recupera, XP intacto |
| Aparelho novo, nome abreviado | ❌ duplicata | ✅ recupera |
| `memberId` divergente (leitura) | ❌ usa e não corrige | ✅ reconcilia |
| Leitura da nuvem falha | ❌ *"este convite não existe"* | ✅ *"Sem conexão…"* |
| Conflito / erro / tamanho / config | ❌ texto genérico | ✅ texto próprio |
| Progresso local > nuvem | ❌ sobrescrito | ✅ preservado (maior vence) |
| Cadastro sem WhatsApp | ❌ permanecia vazio | ✅ preenchido quando a pessoa digita |
| Merge com cópia velha | ❌ revertia o aceite | ✅ carimbo faz o aceite vencer |

## 8. Riscos residuais

| # | Risco | Gravidade | Observação |
|---|---|---|---|
| R1 | `nomesCorrespondem()` é mais tolerante: duas pessoas de nomes compatíveis **e mesmo WhatsApp** seriam unidas | 🟡 | Prova dupla mantida. Em produção há **0 nomes repetidos** entre os 258 ativos. **Homologar com nomes reais** |
| R2 | `p.updatedAt` inverte quem vence o merge | 🟡 | É o objetivo (corrige F-70), mas muda comportamento na convivência entre versões. **Testar com uma versão antiga gravando em paralelo** |
| R3 | `p.removed = false` reativa quem foi removido de propósito | 🟢 | Só dispara com convite válido emitido por quem tem autoridade — consentimento das duas partes |
| R4 | Reentrada não reconfere a autoridade do emissor | 🟢 | Deliberado: a autoridade foi validada no aceite original. Quem nunca entrou continua sujeito à conferência |
| R5 | `findMeuParticipante` passou a **gravar** (antes era só leitura) | 🟡 | A mutação é persistida pelo `saveGrupos()` de quem chama. **Verificar que nenhuma tela chama isso em laço** |
| R6 | **B2 não implementado**: 5xx ainda encerra na 1ª tentativa, sem timeout e sem retomada | 🟠 | **É a causa contribuinte C1/C2/C3 e continua ativa.** Próxima etapa |
| R7 | Convites pendentes continuam sem envelhecer | 🟡 | B2 item 10 |

## 9. Recomendação de homologação

**Não publicar ainda.** Sequência sugerida:

1. **Revisar este documento e o diff** — em particular os riscos R1, R2 e R5.
2. **Homologar em bancada com dados reais anonimizados** — sobretudo R1: rodar
   `buscarCadastroExistente` contra os 258 nomes reais e confirmar que nenhum par distinto casa.
3. **Teste de convivência (R2)**: uma aba com a versão nova e outra com a atual, gravando
   alternadamente, verificando que nada se perde.
4. **Aprovar o B1** — só então implementar o **B2 (hardening)**.
5. **Publicar B1+B2 juntos**, com `APP_VERSION` atualizada (hoje congelada em 21/08, o que
   impede confirmar que a correção chegou aos aparelhos).

⚠️ Publicar o B1 sozinho já **quebra o ciclo de reclamação**, mas deixa ativa a causa
contribuinte mais frequente de falha de gravação (R6).

## 10. Verificações de conformidade com as regras absolutas

| # | Regra | Cumprida |
|---|---|---|
| 1 | Não alterar funcionalidades não relacionadas | ✅ 19 linhas removidas, todas do fluxo de convite |
| 2 | Não alterar `firestore.rules` | ✅ intocado |
| 3 | Não alterar a arquitetura de persistência | ✅ mesmo documento, mesmo contrato, mesma máscara |
| 4 | Não criar nova coleção/documento | ✅ nenhuma |
| 5 | Não apagar progresso | ✅ `p.progresso` nunca é escrito pelo aceite; `Math.max` no local |
| 6 | Não duplicar participante | ✅ B1-18, B1-19 |
| 7 | Não remover histórico legítimo | ✅ B1-24, B1-25; `nomePreferido` protege o nome |
| 8 | Versão antiga não sobrescreve progresso novo | ✅ carimbo `updatedAt` + guarda de perda (B1-27) |
| 9 | Nenhuma escrita em produção durante os testes | ✅ `updateTime` de produção inalterado em `13:16:32` |
| 10 | Não publicar sem homologação | ✅ branch local, sem push |
