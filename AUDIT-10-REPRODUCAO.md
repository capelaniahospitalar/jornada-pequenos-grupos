# AUDIT-10-REPRODUCAO — Reprodução controlada

**Auditoria:** Falhas de entrada / reentrada no aplicativo
**Fase:** 10 — Reprodução controlada (10 testes)
**Data de execução:** 2026-08-31
**Código exercitado:** cópia **baixada do GitHub Pages**, SHA-256 `470d1473655ac85c…` = commit `1aafe63`
**Alterações de código:** **nenhuma** · **Escritas em produção:** **nenhuma**

---

## Ambiente

```
TESTE ........... ?teste=1 ativo · MODO_TESTE = true
PREFIXO ......... teste_          (todas as chaves de armazenamento)
FIREBASE ........ isolado/bloqueado:
                    · fbWriteGrupos barrada pelo MODO_TESTE (nenhuma rede)
                    · fbReadDoc substituída por documento forjado em memória
                    · escrita capturada e aplicada num "servidor" simulado,
                      COM pré-condição fiel (permite corridas reais)
PRODUÇÃO ........ intocada
```

**Prova de que a produção ficou intocada:**

| Momento | `updateTime` de `jdpg/grupos` |
|---|---|
| Antes da Fase 10 | `2026-08-31T13:16:32.893837Z` |
| Depois da Fase 10 | `2026-08-31T13:16:32.893837Z` |

Nenhuma requisição de escrita foi emitida. `git diff` dos fontes do app: **vazio**.

## Documento forjado (base de todos os testes)

PG 70 "PG BANCADA", com três participantes em estados distintos:

| Registro | Estado |
|---|---|
| `MID-COORD` — Coord Dois | coordenador ativo (emissor dos convites) |
| `MID-ANA` — Ana Paula Souza | colaboradora ativa, XP 300, 4 estudos |
| `MID-BRUNO` — Bruno Lima | **`removed: true`** (tombstone), XP 210 |

Convite padrão: uso único, `funcao: colaborador`, emitido por `MID-COORD`, pendente, dentro do prazo.

---

## Placar

| | Testes | Resultado |
|---|---|---|
| ✅ PASS | T1, T3, T4, T7b, T8, T9a, T9b, T10b | **8** |
| ❌ FAIL | T2, T3b, T5, T6, T6-acento, T7, T9c, T10, TC | **9** |

---

# TESTE 1 — Novo participante → convite → aceite

| | |
|---|---|
| **INPUT** | `memberId` MID-NOVO (aparelho zerado) · convite INV-1 pendente · PG 70 |
| **EXPECTED** | Entra; +1 participante ativo; convite vira `utilizado` com `usadoPor = MID-NOVO` |
| **ACTUAL** | `ok=true` · ativos=3 · convite=`utilizado` · `usadoPor=MID-NOVO` |
| **PASS/FAIL** | ✅ **PASS** |
| **EVIDENCE** | Ativos após o aceite: *Coord Dois, Ana Paula Souza, Carla Nova*. Uma única gravação emitida, com `dados` e `convites` na máscara |

**Leitura:** o caminho feliz funciona sem ressalvas. Este é o único cenário plenamente sadio.

---

# TESTE 2 — Mesmo convite → segundo aceite

| | |
|---|---|
| **INPUT** | O mesmo aparelho (MID-NOVO) reabre INV-1, que **ele mesmo** consumiu no T1 |
| **EXPECTED** | Idempotência: reconhecer que foi esta pessoa e levá-la para dentro ("você já está neste grupo") |
| **ACTUAL** | `ok=false` · `motivo=utilizado` · tela: **"Este convite já foi utilizado por outra pessoa."** |
| **PASS/FAIL** | ❌ **FAIL** |
| **EVIDENCE** | `convite.usadoPor = MID-NOVO` **===** `getMyMemberId() = MID-NOVO` → é a mesma pessoa, e ainda assim a tela acusa "outra pessoa". `usadoPor` aparece 2× no arquivo, ambas de escrita: **nunca é lido** |

**Leitura:** o aplicativo tem gravado, no próprio convite, quem o usou — e não consulta esse dado.
**Não há idempotência**: reabrir o próprio convite é tratado como tentativa de fraude.

---

# TESTE 3 — Reenvio do mesmo convite

## T3 — a primeira tentativa falhou antes de gravar

| | |
|---|---|
| **INPUT** | Aceite falha com HTTP 503 · coordenador reenvia o **mesmo** link · pessoa tenta de novo |
| **EXPECTED** | O convite continua pendente e a segunda tentativa funciona |
| **ACTUAL** | 1ª: `ok=false` `motivo=sem_conexao` · convite após a falha: **`pendente`** · 2ª: `ok=true` |
| **PASS/FAIL** | ✅ **PASS** |
| **EVIDENCE** | Nada foi aplicado no estado local na falha — `aplicarLocal()` só roda depois do `ok` do servidor. A integridade é preservada: não existe estado pela metade |

## T3b — a primeira tentativa deu certo

| | |
|---|---|
| **INPUT** | A pessoa entrou; o coordenador reenvia o mesmo link; ela abre de novo |
| **EXPECTED** | Reconhecer e levar para dentro |
| **ACTUAL** | Idêntico ao T2: **"Este convite já foi utilizado por outra pessoa."** |
| **PASS/FAIL** | ❌ **FAIL** |
| **EVIDENCE** | Reenviar o mesmo link **nunca ajuda**: ou o convite continua pendente — e então a primeira tentativa já teria funcionado —, ou já foi usado, e é recusado com mensagem falsa |

**Leitura conjunta:** este é o par de testes que responde diretamente à reclamação de campo.
O reenvio não corrige nada em nenhum dos dois ramos.

---

# TESTE 4 — Participante existente → reentrada

| | |
|---|---|
| **INPUT** | `memberId` MID-ANA, já participante do PG 70 · convite novo INV-2 |
| **EXPECTED** | Reconhece pelo `memberId`; não duplica; preserva o XP |
| **ACTUAL** | `ok=true` · `recuperado=false` · participantes **3 → 3** · `xp=300` |
| **PASS/FAIL** | ✅ **PASS** |
| **EVIDENCE** | Nenhuma duplicata no payload gravado; XP 300 intacto |

**Ressalva:** consumiu um convite de uso único sem necessidade — e, a partir daí, reabrir aquele
link cai no T2.

---

# TESTE 5 — Participante removido → reentrada

| | |
|---|---|
| **INPUT** | `memberId` MID-BRUNO, cujo registro tem `removed: true` · convite novo INV-3 |
| **EXPECTED** | Reativar: limpar `removed` e voltar a aparecer na lista do PG |
| **ACTUAL** | `ok=true` · **`removed` no payload gravado = `true`** · visível em `participantesAtivos()` = **`false`** |
| **PASS/FAIL** | ❌ **FAIL** |
| **EVIDENCE** | Ativos após o "sucesso": *Coord Dois, Ana Paula Souza* — **Bruno não está lá**. O aceite retornou sucesso, gravou o documento, consumiu o convite, marcou `welcomeDone`… e a pessoa continua invisível para o grupo |

**Leitura:** `aceitarConvite` encontra o registro pelo `memberId` (ramo "já existe"), atualiza
`nome`, `tipo` e `papel`, e **não toca em `p.removed`**. É o sintoma de campo *"eu entrei e
ninguém me vê"*, reproduzido em bancada.

---

# TESTE 6 — Convite aberto sem `localStorage`

| | |
|---|---|
| **INPUT** | `localStorage` limpo · `memberId` novo gerado · o cadastro **existe** na nuvem com XP 300 |
| **EXPECTED** | IDENT-01 recupera o cadastro por nome + WhatsApp nas variações razoáveis de digitação |
| **ACTUAL** | ver tabela |
| **PASS/FAIL** | ❌ **FAIL (parcial)** |

| O que a pessoa digita | Resultado |
|---|---|
| Exatamente como está cadastrado | ✅ **recupera** (3 participantes) |
| Nome abreviado ("Ana Paula" ← "Ana Paula Souza") | ❌ **duplica** (4 participantes) |
| Trocou de número de WhatsApp | ❌ **duplica** (4 participantes) |

**EVIDENCE:** só a digitação idêntica recupera. `buscarCadastroExistente` compara o nome com
igualdade estrita.

## T6-acento — correção de um erro meu

Na primeira execução rotulei uma variante como "sem acento" usando um nome que **não tinha
acento** — o teste era inválido. Refeito com nome realmente acentuado:

| | |
|---|---|
| **INPUT** | Cadastro `"José Antônio Gonçalves"`; a pessoa digita `"Jose Antonio Goncalves"` |
| **EXPECTED** | Recupera — é a mesma pessoa |
| **ACTUAL** | `buscarCadastroExistente(...)` → **NÃO ACHOU** · `nomesCorrespondem(...)` → **ACHOU** |
| **PASS/FAIL** | ❌ **FAIL** |
| **EVIDENCE** | O aplicativo **possui** a função tolerante que resolveria o caso e a usa em outros lugares (botões, autoridade administrativa). Ela **não é usada** na única função que decide se a pessoa vai duplicar |

---

# TESTE 7 — Convite aberto com `localStorage` inconsistente

| | |
|---|---|
| **INPUT** | `ST` íntegro (`welcomeDone`, `userName`, `grupoNum`) e vínculo presente, mas `memberId` **órfão** (MID-ORFAO ≠ MID-ANA da nuvem) — o cenário em que o cookie sobrevive e o `memberId` se perde |
| **EXPECTED** | O app detecta a divergência e reconcilia o `memberId` do cadastro |
| **ACTUAL** | `findMeuParticipante` **achou por NOME**: Ana Paula Souza (`memberId` real MID-ANA) · `memberId` do aparelho: MID-ORFAO · após `syncProgressoParaFirebase()` o `memberId` do cadastro **continua MID-ANA** |
| **PASS/FAIL** | ❌ **FAIL** |
| **EVIDENCE** | O app **encontra** a pessoa pelo nome, **usa** o resultado para gravar o progresso, e **não corrige** `p.memberId`. A divergência vira permanente: `aceitarConvite`, que casa **só** por `memberId`, nunca mais a reconhece |

**Leitura:** este é o pior estado do sistema porque **não parece um erro**. O app abre normalmente,
com o nome e o XP certos, e a ligação com a nuvem está rompida.

## T7b — e se ela aceitar um convite nesse estado?

| | |
|---|---|
| **INPUT** | Mesma pessoa, `memberId` órfão, aceita convite novo digitando nome e WhatsApp idênticos |
| **EXPECTED** | Recupera o cadastro e adota o `memberId` novo |
| **ACTUAL** | `ok=true` · **`recuperado=true`** |
| **PASS/FAIL** | ✅ **PASS** |
| **EVIDENCE** | IDENT-01 resolveu o caso. **É o único caminho de reconciliação de identidade que existe no aplicativo** — e depende de a digitação ser idêntica (T6) |

---

# TESTE 8 — Convite em navegador diferente

| | |
|---|---|
| **INPUT** | Outro navegador do mesmo aparelho: `localStorage`, `sessionStorage` e cookie são todos separados |
| **EXPECTED** | Reconhece a pessoa |
| **ACTUAL** | `memberId` gerado do zero (`2ec7f7b8-5dd…`) · `ok=true` · `recuperado=true` |
| **PASS/FAIL** | ✅ **PASS (condicional)** |
| **EVIDENCE** | Mecanicamente idêntico ao T6: navegador diferente = armazenamento diferente = **pessoa diferente para o app**. Só recuperou porque a digitação foi idêntica; com qualquer variação, cairia nas linhas de falha do T6 |

**Nota comparativa:** o T8 é **menos grave** que o T7. Aqui o app **admite** não conhecer a pessoa
e mostra a tela de convite. No T7 ele acha que a conhece, e está errado.

---

# TESTE 9 — Dois aceites simultâneos

## T9a — duas pessoas disputando o **mesmo** convite

| | |
|---|---|
| **INPUT** | Duas pessoas abrem INV-9 ao mesmo tempo (uso único) |
| **EXPECTED** | Exatamente uma entra; a outra recebe recusa clara e correta |
| **ACTUAL** | A: `ok=true` · B: `ok=false` `motivo=utilizado` · convite final: `utilizado`, `usadoPor=MID-PESSOA-A` · ativos=3 |
| **PASS/FAIL** | ✅ **PASS (integridade)** |
| **EVIDENCE** | O uso único foi respeitado: uma única pessoa entrou e o convite tem um único `usadoPor`. A mensagem *"utilizado por outra pessoa"* é, **neste caso, verdadeira** — foi mesmo outra pessoa |

## T9b — duas pessoas, dois convites diferentes, ao mesmo tempo

| | |
|---|---|
| **INPUT** | Duas pessoas distintas, convites distintos, simultâneos |
| **EXPECTED** | Ambas entram; nenhuma sobrescreve a outra |
| **ACTUAL** | 1: `ok=true` · 2: `ok=true` · ativos finais = 4 (*Coord Dois, Ana Paula Souza, Elisa Um, Fabio Dois*) · **3 gravações emitidas para 2 aceites** |
| **PASS/FAIL** | ✅ **PASS** |
| **EVIDENCE** | A terceira gravação é a retentativa: a trava otimista recusou a segunda, que releu o documento **já com a primeira pessoa dentro** e regravou preservando-a. É a concorrência funcionando exatamente como projetada |

## T9c — aceite durante instabilidade do servidor

| | |
|---|---|
| **INPUT** | Servidor devolve HTTP 503 · o laço tem 4 tentativas disponíveis |
| **EXPECTED** | Repetir as tentativas — 503 é transitório |
| **ACTUAL** | tentativas efetivamente feitas = **1** · `motivo=sem_conexao` · pendência marcada para reenvio = **`false`** |
| **PASS/FAIL** | ❌ **FAIL** |
| **EVIDENCE** | O `catch` do laço faz `return`, não `continue` — abandona na primeira. E não marca pendência: **não há reenvio automático nem quando a rede voltar** |

---

# TESTE 10 — Versão antiga → versão atual

| | |
|---|---|
| **INPUT** | Nuvem com 70 slots, o 70 ocupado por 1 pessoa · aparelho roda build anterior a 20/08 (50 slots compilados, sem `fbGruposPreservados`) |
| **EXPECTED** | A versão antiga preserva o que não conhece |
| **ACTUAL** | conhece o slot 70 = **`false`** · payload que gravaria = **50 slots** · slot 70 presente = **`false`** |
| **PASS/FAIL** | ❌ **FAIL** |
| **EVIDENCE** | `applyGruposData` faz `if (idx < 0) return` e a build antiga não possui `fbGruposPreservados` (criado em 18/08). **O PG 70 e a pessoa dentro dele seriam apagados da nuvem** |

## T10b — a mesma gravação, avaliada pela versão atual

| | |
|---|---|
| **INPUT** | O payload reduzido de 50 slots passa por `validarPayloadDados` da build de hoje |
| **EXPECTED** | A guarda G1 barra a perda |
| **ACTUAL** | `guardaViolada="perda"` · perderia: `51, 52, …, 70` |
| **PASS/FAIL** | ✅ **PASS** |
| **EVIDENCE** | A guarda funciona e barraria a perda — **mas ela só existe na build de 20/08 em diante**. A build antiga não a executa, e o servidor não tem defesa equivalente: a regra M2 está escrita e **não publicada** |

**Leitura conjunta:** a proteção existe, é correta, e está no lugar errado — **dentro do
aplicativo que precisa ser protegido do outro aplicativo**.

---

# TESTE COMPLEMENTAR — a leitura da nuvem falha ao abrir o link

Não estava na lista dos 10, mas é o caminho de falha mais provável em campo.

| | |
|---|---|
| **INPUT** | Convite **válido e pendente** na nuvem · `fbReadDoc` lança (offline / DNS / 403) · espelho local vazio (aparelho novo) |
| **EXPECTED** | Informar problema de conexão e pedir para abrir o link de novo |
| **ACTUAL** | título: **"Convite indisponível"** · texto: **"Este convite não existe ou não está mais disponível. Solicite um novo convite ao Coordenador."** |
| **PASS/FAIL** | ❌ **FAIL** |
| **EVIDENCE** | A mensagem correta existe no código e é inalcançável por este caminho: *"Sem conexão — Não foi possível validar o convite. Verifique sua internet e abra o link novamente."* `renderTelaConvite` ignora o retorno de `syncFromFirebase()` e consulta o cache local |

**Leitura:** um convite perfeitamente válido é apresentado como inexistente, e a orientação dada —
pedir outro convite — não resolve nada.

---

# Verificação adicional — a suíte de testes do próprio app

| Suíte | Asserções | Aprovadas |
|---|---|---|
| `autoTesteFase4()` | 11 | 11 |
| `autoTesteE1()` | 27 | 27 |
| **Total** | **38** | **38** |

**A alegação de 38/38 é verdadeira.** Listei todas as 38: 11 tratam de contagem de PGs e
invariantes de identidade; 27 tratam da **forma** do contrato de escrita (validação da intenção,
máscara por operação, carimbo, remoção do fallback, localização das guardas, existência dos
textos de erro).

> **Nenhuma das 38 exercita `validarConviteParaAceite` com dados reais, `buscarCadastroExistente`,
> tombstone, reentrada, merge de participantes ou a tela do convite.**
>
> A suíte verifica que a gravação tem a forma certa. **Não verifica que a pessoa entrou.** É por
> isso que 38/38 convive com falhas em campo — e é a mesma limitação do contrato (Fase 6),
> reproduzida no nível dos testes.

---

# O que não foi possível reproduzir

| Não reproduzido | Motivo |
|---|---|
| Registro local **sem** correspondente na nuvem (o caso do progresso descartado em silêncio) | Exigiria um aparelho real que tivesse perdido o registro na nuvem; em bancada, `applyGruposData` reconstrói o estado a partir da fonte forjada |
| Tempo real de upload de ~396 KB | A bancada não tem latência de rede |
| Retomada do aplicativo instalado na tela inicial | Exige aparelho real |
| Compartilhamento de armazenamento entre navegador embutido e navegador padrão | Depende de sistema operacional e versão do aplicativo de mensagens |
| Respostas HTTP **reais** do Firestore (403, 429, 5xx) | Provocá-las exigiria escrever em produção. Foram **simuladas**; o tratamento do app é que foi observado |
| Frequência de cada falha em campo | O aplicativo não registra tentativas frustradas |

---

# Conclusões desta fase

## Confirmado por experimento

| Comportamento | Testes |
|---|---|
| Reabrir o próprio convite é recusado com afirmação falsa | T2, T3b |
| Removido "entra" e continua invisível | T5 |
| Recuperação de cadastro exige digitação idêntica | T6, T6-acento, T8 |
| Divergência de identidade é detectada, usada e não corrigida | T7 |
| Erro transitório do servidor abandona na primeira tentativa | T9c |
| Versão antiga apaga PGs fora do alcance dela | T10 |
| Convite válido apresentado como inexistente quando a leitura falha | TC |

## Funcionando corretamente (não perseguir)

| Comportamento | Testes |
|---|---|
| Entrada de participante novo | T1 |
| Reentrada com o mesmo `memberId` (sem duplicar, XP preservado) | T4 |
| Integridade do uso único sob disputa | T9a |
| Concorrência: dois aceites simultâneos preservam-se mutuamente | T9b |
| Nada é aplicado localmente quando a gravação falha | T3 |
| As guardas de conteúdo da versão atual | T10b |
| A única rota de reconciliação de identidade, quando a digitação bate | T7b |

## Resposta preliminar à pergunta central

> *"Qual condição exata impede o participante de entrar ou reentrar quando recebe novamente o
> convite?"*

**Não é uma condição — são cinco, e nenhuma delas é o convite:**

1. a leitura da nuvem falhou ao abrir o link (TC);
2. a pessoa já havia usado aquele convite (T2, T3b);
3. a pessoa foi removida — entra e continua invisível (T5);
4. aparelho ou navegador novo com digitação diferente (T6, T8);
5. a rede oscilou ou o servidor falhou (T9c).

Em **todos** os testes, um convite pendente e válido foi aceito sem exceção. **O convite nunca foi
o obstáculo.**

A consolidação formal — causa raiz, contribuinte, risco e falso positivo — é a **Fase 11**.
