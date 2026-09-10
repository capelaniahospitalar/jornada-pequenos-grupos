# AUDIT-12-CORRECOES — Propostas de correção

**Auditoria:** Falhas de entrada / reentrada no aplicativo
**Fase:** 12 — Propostas de correção
**Data:** 2026-08-31
**Base:** causa raiz determinada na [Fase 11](AUDIT-11-ROOT-CAUSE.md)
**Status:** ⚠️ **PROPOSTA. Nenhuma linha foi escrita. Nada será implementado sem autorização explícita.**

---

## O que precisa ser corrigido, em uma frase

> A entrada é decidida pelo **estado do convite**; precisa passar a ser decidida pelo
> **estado da pessoa**.

As três opções abaixo atacam isso em profundidades diferentes.

---

# OPÇÃO A — Correção mínima

**Princípio:** a menor alteração possível que **quebra o ciclo de reclamação**, sem tocar na
arquitetura, sem migrar dado e quase sem alterar o que é gravado.

## A.1 — O app passa a reconhecer que foi você quem usou o convite

| | |
|---|---|
| **Onde** | `validarConviteParaAceite` (`index.html:10012`) e `renderTelaConvite` (`index.html:10370`) |
| **Hoje** | `if (inv.status !== 'pendente') → recusa` |
| **Proposta** | antes de recusar, comparar `inv.usadoPor` com `getMyMemberId()`. Se for a mesma pessoa, tratar como **sucesso** e levá-la para dentro |
| **Tamanho** | ~4 linhas, em 2 lugares |
| **Grava algo?** | ❌ não — é só decisão e mensagem |

Elimina a afirmação falsa *"utilizado por outra pessoa"* e torna o reenvio inofensivo para quem
já entrou.

## A.2 — Separar "não consegui ler" de "não existe"

| | |
|---|---|
| **Onde** | `renderTelaConvite` (`index.html:10364`) |
| **Hoje** | `await syncFromFirebase();` — o retorno é **ignorado** |
| **Proposta** | guardar o retorno; se a leitura falhou **e** o convite não está no cache local, exibir `mensagemConvite('sem_conexao')` — mensagem que **já existe** no código e hoje é inalcançável |
| **Tamanho** | ~3 linhas |
| **Grava algo?** | ❌ não |

## A.3 — Dar texto próprio às falhas que hoje caem no genérico

| | |
|---|---|
| **Onde** | `mensagemConvite` (`index.html:10293`) |
| **Hoje** | `conflito`, `sem_config`, `tamanho`, `erro` caem no `default`; e `versao_incompativel` é devolvido mas só existe a chave `versao_anterior` |
| **Proposta** | acrescentar as 4 chaves e corrigir a 5ª. A rota de **emissão** já tem esses textos — é copiar o cuidado que existe de um lado só |
| **Tamanho** | ~5 linhas de texto |
| **Grava algo?** | ❌ não |

## A.4 — Limpar a marca de removido ao aceitar

| | |
|---|---|
| **Onde** | `aceitarConvite`, ramo "participante já existe" (`index.html:10209-10213`) |
| **Hoje** | atualiza `nome`, `tipo`, `papel` e **não toca em `p.removed`** |
| **Proposta** | `p.removed = false; p.updatedAt = Date.now();` |
| **Tamanho** | 2 linhas |
| **Grava algo?** | ✅ **sim** — é a única parte de A que altera o payload |

> ⚠️ **A.4 é a única parte de A com risco de dado.** O `updatedAt` também resolve, de quebra, a
> reversão pelo merge (F-70) **para este caso**. As guardas G1–G4 continuam vigiando a gravação.

## O que A **não** resolve

Duplicação por digitação diferente · 396 KB por aceite · 5xx tratado como definitivo ·
identidade em gaveta única · versão invisível · convites nunca podados · reenvio que multiplica ·
suíte de testes que não cobre entrada.

**A não conserta o sistema. Conserta a conversa entre o sistema e a pessoa** — que é o que
sustenta o ciclo de reclamação.

---

# OPÇÃO B — Correção robusta (torna o fluxo idempotente)

**Princípio:** A, mais tornar o aceite **genuinamente idempotente** e capaz de se recuperar
sozinho. Mantém a arquitetura de documento único.

Inclui tudo de A, e mais:

## B.1 — Idempotência de verdade

O aceite deixa de ser "consumir o convite" e passa a ser "**garantir que esta pessoa é membro**".
Se ela já é membro — por `memberId` ou por identidade recuperável —, o resultado é **sucesso**,
independentemente do estado do convite. Reabrir o link cinco vezes produz o mesmo resultado das
cinco vezes.

## B.2 — Reconciliação de identidade

| Correção | Onde | Tamanho |
|---|---|---|
| Reparar o vínculo quando a pessoa é achada por nome | `findMeuParticipante` (`5934`) | **1 linha**: `p.memberId = meuId` |
| Usar a régua tolerante que o app já possui | `buscarCadastroExistente` (`12012`) | trocar a comparação estrita por `nomesCorrespondem()` |
| Guardar o `memberId` também no cookie | `save()` / `getMyMemberId()` | ~2 linhas |

A primeira é a correção de melhor relação custo-benefício de toda a auditoria: **uma linha** que
impede a divergência de identidade de se tornar permanente (T7).

## B.3 — Carimbar toda mutação do aceite

`aceitarConvite` passa a gravar `updatedAt` nos três ramos (criar, recuperar, mudar papel).
Hoje **nenhum** carimba, e o empate no merge é vencido pela cópia velha — o que **desfaz** a
entrada (T·F-70). Em produção, **50 dos 258 participantes ativos** estão sem carimbo algum.

## B.4 — Classificar os erros de rede

| Correção | Efeito |
|---|---|
| Separar 4xx permanente (403, 401) de transitório (429, 5xx) | 403 deixa de virar "Sem conexão" |
| Repetir os transitórios dentro das 4 tentativas | um 503 deixa de encerrar o aceite (T9c) |
| Marcar pendência e retomar ao reconectar | um aceite perdido deixa de ser perdido |
| Colocar timeout (`AbortController`) nas duas requisições | fim do "Entrando…" eterno |

## B.5 — Comparar antes de sobrescrever o progresso

Hoje a recuperação faz `ST.xp = progressoRecuperado.xp || 0` — atribuição, não comparação. Quem
estudou offline perde o excedente. Passa a manter o maior valor.

## B.6 — Fazer o convite envelhecer

`expirarConvitesVencidos()` existe e **nunca é chamada**. Passar a chamá-la faz os pendentes
vencidos virarem terminais e serem podados — hoje eles **nunca** saem do documento (34 acumulados,
o mais antigo de 13/07).

## B.7 — Reaproveitar em vez de multiplicar

Antes de criar convite, procurar um pendente válido para o mesmo destino e função. A lógica já
existe, aplicada a um único caso (`gerarConvidarCoordenadorAutoEExibir`).

## B.8 — Testes que cubram entrada

**Sem isto, B não é verificável.** Os 38 testes atuais validam a forma do contrato e **nenhum faz
uma pessoa entrar**. A bancada da Fase 10 já demonstrou que dá para testar tudo isso sem rede.

## O que B **não** resolve

396 KB por aceite · janela de colisão · documento único · versão invisível · app que nunca
recarrega · regra do servidor contra versões antigas.

---

# OPÇÃO C — Correção estrutural

**Princípio:** reestruturar convites e reentrada. Corrige as causas que A e B só contornam.

Inclui tudo de B, e mais:

## C.1 — Tirar os convites do documento único ⭐

Mover `convites` de dentro de `jdpg/grupos` para uma coleção própria (`jdpg_convites/{inviteId}`).

| Efeito | Ganho |
|---|---|
| Payload do aceite | de **396 KB para ~180 KB** (o registro de convites é 55%) |
| Janela de colisão | encolhe na mesma proporção |
| Poda | cada convite morre sozinho; a regra pode ter TTL próprio |
| Guarda de tamanho | passa a existir para convites |
| Leitura da tela do convite | **1 documento pequeno** em vez de 400 KB |

**É a mudança de maior efeito de toda a auditoria.** E a de maior risco de migração: um aparelho
antigo continuará gravando o campo `convites` no documento velho, invisível para o app novo.

## C.2 — Identidade com fonte única

Substituir as **8 réguas** de "qual registro sou eu" por uma função canônica, com filtro de
`removed` explícito em cada uso. Hoje **só uma das oito filtra removidos — e é a única que não
grava**.

## C.3 — Proteção no servidor contra versões antigas

Publicar a regra que impede um aplicativo desatualizado de gravar destrutivamente.
⚠️ **A regra M2 que existe no repositório está defeituosa**: como escrita, bloquearia **todas** as
gravações a partir da segunda. Precisa ser redesenhada antes de qualquer publicação.

## C.4 — Versão visível e verificação de atualização

Pré-requisito de tudo o mais (ver §"Ordem obrigatória"): atualizar `APP_VERSION` a cada
publicação, exibi-la numa tela normal, e comparar a versão em memória com a do servidor ao voltar
da visibilidade, avisando quando estiver velha.

## O que C **não** resolve

Autenticação de identidade. Enquanto não houver login, a identidade continua sendo "o que está
guardado neste navegador". C torna isso muito mais robusto; não o elimina.

---

# MATRIZ COMPARATIVA

| Critério | **A — mínima** | **B — robusta** | **C — estrutural** |
|---|---|---|---|
| **Risco** | 🟢 **Muito baixo** — 3 de 4 itens não alteram gravação; A.4 é a única exceção | 🟡 **Médio** — altera o payload do aceite e a lógica de merge; exige homologação | 🔴 **Alto** — muda o formato dos dados na nuvem; migração com aparelhos antigos em campo |
| **Complexidade** | 🟢 ~15 linhas, 4 pontos, 1 arquivo | 🟡 ~150 linhas, ~12 pontos + suíte de testes nova | 🔴 Projeto: nova coleção, migração, regras, versionamento, release coordenado |
| **Impacto** | 🟡 **Quebra o ciclo de reclamação** e torna as mensagens verdadeiras. Não reduz a taxa de falha | 🟢 **Alto** — reduz a taxa de falha, recupera aceites perdidos, acaba com a duplicação | 🟢 **Muito alto** — ataca volume, colisão, poda e versões antigas |
| **Compatibilidade** | 🟢 **Total** — aparelhos antigos convivem sem qualquer efeito | 🟢 **Alta** — payload continua no mesmo formato; `updatedAt` é aditivo | 🔴 **Ruptura** — app antigo grava no lugar velho; exige janela de convivência e migração |
| **Rollback** | 🟢 **Trivial** — reverter o commit; nenhum dado mudou de forma | 🟡 **Fácil** — reverter o commit; `updatedAt` e `removed:false` permanecem nos dados (inofensivos) | 🔴 **Difícil** — dados já migrados para a coleção nova; precisa de plano de volta escrito antes |
| **Segurança** | 🟢 Neutra — nenhuma superfície nova | 🟢 **Melhora** — 403 deixa de ser confundido com falha de rede | 🟢 **Melhora muito** — regra de servidor barra app antigo, que hoje é a única ameaça real de perda |
| **Idempotência** | 🟡 **Parcial** — só para quem já entrou e reabre o próprio link | 🟢 **Completa** — o aceite garante pertencimento; repetir dá o mesmo resultado | 🟢 **Completa e estrutural** — idempotência sustentada pelo modelo de dados |

## Resumo em uma linha cada

| | |
|---|---|
| **A** | Faz o aplicativo **parar de mentir** sobre por que a pessoa não entrou |
| **B** | Faz a pessoa **conseguir entrar** nas situações em que hoje ela não consegue |
| **C** | Faz a falha **acontecer muito menos** e impede que uma versão antiga destrua dado |

---

# Recomendação

## Sequência proposta: **A → B → C**, com um pré-requisito

```
AGORA        A  (mínima)          → quebra o ciclo, risco quase nulo
                 ↓
             C.4 (versão visível) → PRÉ-REQUISITO de tudo o que vier depois
                 ↓
DEPOIS       B  (robusta)         → reduz a taxa de falha, com testes de entrada
                 ↓
FUTURO       C  (estrutural)      → só depois de A+B estáveis e da versão visível
```

## Por que **C.4 antes de B e C**

Hoje é **impossível saber qual versão um aparelho está rodando** — `APP_VERSION` está congelado em
21/08, dez commits atrás, e não aparece em nenhuma tela normal. Sem isso:

- não há como confirmar que uma correção chegou às pessoas;
- não há como saber quantos aparelhos ainda podem apagar os PGs 51–54;
- e uma mudança estrutural (C) seria publicada **às cegas**, sem saber quem ainda escreve no
  formato antigo.

**C.4 é barato e destrava a medição de todo o resto.**

## O que fazer imediatamente e **não depende de código**

| Ação | Prazo |
|---|---|
| Decidir o destino dos **20 cadastros removidos** (3 805 XP) | **~13/09** — a poda é automática e irreversível |
| Perguntar a uma das 5 pessoas com vários links **qual texto exato apareceu na tela** | agora — fecha o diagnóstico (Fase 11 §9) |
| Parar de reenviar convite como resposta a "não consigo entrar" | agora — está provado que não resolve |
| Limpar os 4 cadastros de teste ativos no PG 9 | quando houver janela |

---

# Riscos de cada alternativa

## Riscos de A

| Risco | Mitigação |
|---|---|
| A.4 grava `removed:false` — se aplicado a quem foi removido **de propósito**, a pessoa volta ao grupo | Só dispara quando a própria pessoa aceita um convite **novo e válido**, emitido por quem tem autoridade. É consentimento explícito das duas partes |
| Reconhecer `usadoPor` poderia deixar entrar quem não devia | Não: a comparação é com o `memberId` **deste aparelho**. Um terceiro nunca terá o `memberId` de outra pessoa |
| Mensagens novas podem confundir | São mais específicas que o texto atual, não menos |

## Riscos de B

| Risco | Mitigação |
|---|---|
| `nomesCorrespondem()` é mais tolerante — poderia unir duas pessoas diferentes | Exige **nome compatível E WhatsApp compatível**. Hoje há **0 nomes repetidos** em toda a base. Ainda assim: homologar com os casos reais antes |
| Carimbar `updatedAt` muda quem vence o merge | É o objetivo. Mas inverte o comportamento atual — **precisa de teste de convivência entre versões** |
| Retomar aceites pendentes pode gravar em duplicidade | A idempotência de B.1 é justamente a proteção; a ordem importa: **B.1 antes de B.4** |
| Podar convites vencidos remove histórico | São terminais e vencidos; o instantâneo da Fase 0 preserva o estado atual |

## Riscos de C

| Risco | Mitigação |
|---|---|
| **Aparelho antigo continua gravando `convites` no documento velho** | Janela de convivência: ler dos dois lugares, escrever nos dois, até a adoção ser comprovada — o que exige **C.4** |
| Migração pode perder convites pendentes | Migrar **copiando**, nunca movendo; validar contagem antes de desligar o campo antigo |
| A regra M2 do repositório está defeituosa | **Não publicar como está.** Redesenhar e testar em projeto separado |
| Mudança grande num sistema em uso por ~258 pessoas | Nenhuma parte de C deve ir ao ar sem A e B estáveis e sem versão visível |

---

# Testes necessários antes de qualquer produção

## Para A

| # | Teste | Critério |
|---|---|---|
| 1 | Reabrir o próprio convite já usado | entra, sem mensagem de erro |
| 2 | Reabrir convite usado por **outra** pessoa | recusa mantida, mensagem correta |
| 3 | Abrir link com a rede desligada | mensagem de conexão, **não** "não existe" |
| 4 | Removido aceita convite novo | aparece na lista do PG |
| 5 | Os 38 testes atuais | continuam 38/38 |
| 6 | Fluxo normal (participante novo) | inalterado |

## Para B (além dos de A)

| # | Teste | Critério |
|---|---|---|
| 7 | Aceitar 5 vezes seguidas | mesmo resultado nas 5 |
| 8 | Aparelho novo, nome abreviado / sem acento / com sobrenome a mais | recupera, não duplica |
| 9 | Duas pessoas diferentes com nomes parecidos | **não** se confundem |
| 10 | 503 durante o aceite | repete e conclui; ou marca pendência e retoma |
| 11 | Aceite com progresso local maior que o da nuvem | mantém o maior |
| 12 | Merge com cópia velha de outro aparelho | **não** reverte o aceite |
| 13 | Convivência: versão nova e versão atual gravando alternadamente | nenhum dado perdido |

## Para C (além dos de A e B)

| # | Teste | Critério |
|---|---|---|
| 14 | Migração completa em cópia do documento real | contagem de convites idêntica |
| 15 | App antigo gravando durante a janela de convivência | convite aparece nos dois lugares |
| 16 | Regra nova do Firestore em projeto separado | gravações legítimas passam; app antigo é barrado |
| 17 | Rollback ensaiado | volta ao estado anterior sem perda |

## Regra de homologação, para todas

Nenhum teste de escrita deve tocar o projeto de produção. A bancada da Fase 10 — cópia do arquivo
publicado, servidor local, `?teste=1`, leitura forjada — **executa todos os cenários acima sem
rede**, e deve ser o ambiente padrão.

---

# Declaração final

**Nada foi implementado.** Este documento é uma proposta.

A auditoria está concluída: causa raiz determinada com evidência experimental, contribuintes e
falsos positivos classificados, e três caminhos de correção dimensionados.

**Aguardo autorização explícita para iniciar qualquer implementação** — e recomendo que a
autorização seja dada **por opção**, não em bloco.
