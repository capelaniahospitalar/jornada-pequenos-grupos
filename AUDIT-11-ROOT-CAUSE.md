# AUDIT-11-ROOT-CAUSE — Classificação da causa raiz

**Auditoria:** Falhas de entrada / reentrada no aplicativo
**Fase:** 11 — Determinação e classificação da causa raiz
**Data:** 2026-08-31
**Base de evidência:** Fases 0–10 · código publicado `1aafe63` · 492 convites e 279 registros de
produção · 10 testes reproduzidos em bancada
**Alterações de código:** **nenhuma** · **Escritas em produção:** **nenhuma**

---

# 1. CAUSA RAIZ

> ## O aplicativo modela a entrada como **consumo de um token**, e não como **garantia de pertencimento**.
>
> Ele responde à pergunta *"este convite ainda está pendente?"* quando a pergunta que importa é
> *"esta pessoa já é membro deste grupo?"*.

Desta única escolha de modelo decorrem, **necessariamente**, os dois comportamentos que produzem a
reclamação:

### 1.1 O aceite não é idempotente

Repetir a mesma operação com o mesmo insumo não devolve o mesmo resultado. Na primeira vez a
pessoa entra; na segunda, é **recusada** — embora o objetivo (ser membro) já esteja cumprido.

| Onde | Código |
|---|---|
| `validarConviteParaAceite` — `index.html:10012` | `if (inv.status !== 'pendente') return { ok:false, motivo: inv.status };` |
| `renderTelaConvite` — `index.html:10370` | `else if (inv.status !== 'pendente') motivo = inv.status;` |

**Nenhuma das duas consulta `inv.usadoPor`** — o campo que guarda exatamente quem consumiu o
convite. Varredura no arquivo inteiro: `usadoPor` aparece **duas vezes, ambas de escrita**
(`index.html:9929` e `10224`). **Nunca é lido.**

**Evidência experimental (T2):**
```
convite.usadoPor = MID-NOVO   ===   getMyMemberId() = MID-NOVO     ← a mesma pessoa
tela exibida: "Este convite já foi utilizado por outra pessoa."
```

### 1.2 Toda falha é atribuída ao convite, e a prescrição é sempre a mesma

Como a decisão só olha para o token, a explicação só sabe falar do token. `mensagemConvite`
(`index.html:10293`) tem um `default` que cobre **pelo menos sete causas distintas**:

```js
default: return { titulo: 'Convite indisponível',
                  texto: 'Este convite não existe ou não está mais disponível.
                          Solicite um novo convite ao Coordenador.' };
```

Caem nele: `inexistente` (inclusive por **falha de leitura**), `versao_incompativel`,
`grupo_inexistente`, `conflito`, `erro`, `sem_config`, `tamanho`.

**Evidência experimental (TC):** com um convite **válido e pendente na nuvem**, forçando a falha
de leitura:
```
título: "Convite indisponível"
texto:  "Este convite não existe ou não está mais disponível. Solicite um novo convite."
```
A mensagem correta **existe no código** (`index.html:10301`, `case 'sem_conexao'`) e é
**inalcançável** por este caminho, porque `renderTelaConvite` (`index.html:10364`) ignora o
retorno de `syncFromFirebase()` e consulta o cache local.

### 1.3 Por que isso fecha um ciclo

```
a pessoa não entra (por QUALQUER causa)
        ↓
a tela culpa o convite e manda pedir outro
        ↓
o coordenador reenvia ou gera um convite novo
        ↓
a causa real não foi tocada — a pessoa não entra de novo
        ↓
"mandaram de novo o mesmo convite e ela não conseguiu entrar"
```

**O reenvio é comprovadamente uma não-ação.** Encaminhar o link ou usar "Copiar link" **não grava
nada** — nem `updatedAt` (Fase 2). Gerar um convite novo cria um segundo token igualmente válido,
sem invalidar o primeiro nem tocar na causa.

**Evidência de produção:** existe hoje uma pessoa segurando **12 links válidos e simultâneos** para
o mesmo PG, criados ao longo de 9 dias, e que continua fora do grupo. Rodei a simulação de aceite
nos 12: **todos passam**.

---

# 2. As manifestações que explicam a reclamação relatada

A causa raiz se manifesta por dois caminhos, conforme quem é a pessoa:

## 2.1 Quem **já havia entrado** — não idempotência

| | |
|---|---|
| **Defeito** | F-31 — `usadoPor` gravado e nunca lido |
| **Condição** | a pessoa reabre o link que ela mesma consumiu |
| **Gatilhos comuns** | salvou a mensagem no WhatsApp · recarregou a página (a URL é apagada antes de renderizar, F-10) · atalho da tela inicial perdeu o vínculo · trocou de navegador |
| **O que ela lê** | *"Este convite já foi utilizado por outra pessoa."* — **factualmente falso** |
| **Alcance medido** | **26 das 207 pessoas** que entraram por convite (12,6%) hoje não constam ativas no PG que as recebeu — 14 com tombstone, 12 desaparecidas. Todas cairiam nesta mensagem |
| **Evidência** | T2, T3b |

## 2.2 Quem **ainda não entrou** — falha de leitura vestida de convite inválido

| | |
|---|---|
| **Defeito** | F-01 — `renderTelaConvite` ignora o resultado da leitura |
| **Condição** | rede instável, DNS lento, 403 de regra, aparelho novo com cache vazio |
| **O que ela lê** | *"Convite indisponível — este convite não existe."* |
| **Alcance** | **indeterminável** — o app não registra tentativas frustradas (F-59), e a rota do convite nem alimenta a telemetria existente |
| **Evidência** | TC |

**Estas duas, juntas, explicam a reclamação relatada.** As demais falhas do catálogo agravam,
mas não são necessárias para produzi-la.

---

# 3. CAUSAS CONTRIBUINTES

Não produzem a falha sozinhas; **aumentam a probabilidade** de ela ocorrer ou de ser mal
diagnosticada.

| # | Causa contribuinte | Como aumenta a probabilidade | Evidência |
|---|---|---|---|
| **C1** | **Payload de 396 KB por aceite, sem timeout** (F-64) | A gravação demora dezenas de segundos em rede hospitalar; qualquer queda no meio é falha. Não há `AbortController` em nenhuma requisição — a tela pode ficar em "Entrando…" indefinidamente | medido: 405 262 bytes; 795 KB por tentativa |
| **C2** | **Erro transitório tratado como definitivo** (F-65) | O `catch` faz `return`, não `continue`. Um 503, um 429 ou uma oscilação encerra o aceite na **primeira** tentativa. As 4 tentativas servem só para conflito | T9c: 1 tentativa |
| **C3** | **Nenhuma retomada após falha** (F-66) | Sem marca de pendência; `fbRetryOnReconnect` chama a **outra** rota. Um aceite perdido está perdido | T9c: `fbPendingSync=false` |
| **C4** | **Convites pendentes nunca são podados** (F-30) | `expirarConvitesVencidos()` nunca é chamada. O registro de convites é **55% do payload** — cada convite acumulado torna todo aceite futuro mais lento e mais frágil, realimentando C1 | 0 expirados, 90 pendentes, 34 vencidos |
| **C5** | **Reenvio multiplica em vez de reaproveitar** (F-32, F-33) | Nenhuma verificação de "já existe convite pendente para este destino". 80% dos convites nem registram o destinatário, tornando a duplicação invisível | 17 destinos com convite repetido; recorde de 12 válidos simultâneos |
| **C6** | **Recuperação de cadastro exige digitação idêntica** (F-11, F-45) | Em aparelho novo, nome abreviado, acento ou número trocado geram duplicata silenciosa — que a pessoa relata como "não consegui entrar direito" | T6, T6-acento; 9 dos 258 ativos sem WhatsApp gravado |
| **C7** | **Identidade em uma única gaveta, divergência nunca reparada** (F-51, F-53) | `memberId` só no `localStorage`, enquanto o progresso tem 3 camadas. Quando diverge, `findMeuParticipante` acha por nome, usa, e **não corrige** | T7 |
| **C8** | **O aceite não limpa o tombstone** (F-37) | A pessoa entra com sucesso e continua invisível — e relata como "não entrei" | T5 |
| **C9** | **O app nunca se recarrega + versão congelada** (F-74, F-75) | Código antigo permanece em campo indefinidamente, e é impossível saber qual versão um aparelho roda | Pages: `max-age=600`, sem service worker; `APP_VERSION` parado em 21/08, 10 commits atrás |
| **C10** | **A suíte de 38 testes não cobre entrada** (F-78) | Todo o regime de qualidade valida a **forma** do contrato e nunca o **resultado** "a pessoa entrou". Os defeitos passam pela porta da frente | 38/38 aprovados; 0 asserções sobre aceite com dado real |

---

# 4. FALSOS POSITIVOS

Suspeitas razoáveis que a auditoria **descarta com evidência**. Não devem consumir esforço.

| # | Hipótese | Veredito | Evidência |
|---|---|---|---|
| **FP1** | "O contrato de escrita da 1.2.0-rc1 está errado" | ❌ **Falso** | 38/38 aprovados; verificado **no arquivo baixado do Pages**: um único `PATCH` no app, fallback removido (só existe em comentário), `aceitarConvite` declara `dados`, guardas alcançam o aceite |
| **FP2** | "As guards estão bloqueando participante legítimo" | ❌ **Falso** | Nenhuma guarda de conteúdo recusou um aceite legítimo em 10 testes. G1 só barra perda real (T10b) |
| **FP3** | "A concorrência está perdendo a entrada de alguém" | ❌ **Falso** | T9b: 2 aceites simultâneos → 3 gravações → **ambas as pessoas preservadas**. A trava otimista funciona |
| **FP4** | "É cache do GitHub Pages / service worker" | ❌ **Falso** | `Cache-Control: max-age=600` medido nos 5 recursos; **nenhum service worker existe** (404 nos 3 caminhos, nunca commitado). O problema é o app nunca recarregar — não o cache |
| **FP5** | "O convite é inválido, expira cedo demais ou está corrompido" | ❌ **Falso** | Em **todos** os testes, convite pendente e válido foi aceito. A validade de 7 dias é conferida pelo relógio e funciona |
| **FP6** | "Convites nascem impossíveis de aceitar por réguas de nome divergentes" (F-06) | ❌ **Falso** | Simulação de autoridade nos **492 convites**: **0 casos** com essa assinatura, em qualquer status. Defeito real, **sem vítima na história do sistema** |
| **FP7** | "O app apaga participantes homônimos" (F-26) | ❌ **Falso** | **0 nomes repetidos** dentro de PG e entre PGs; os 258 ativos têm nomes distintos |
| **FP8** | "A remoção marca o tombstone na pessoa errada" (F-15, ramo destrutivo) | ❌ **Falso** | **0 dos 258** participantes ativos sem `ts` (verificados ausente, nulo e zero) |
| **FP9** | "A deriva de identidade (`memberId` mudando) é a causa comum" | ❌ **Falso** | Dos 492 convites, 74 têm emissor ausente — mas **apenas 4, de 1 pessoa**, são deriva real. Os outros 70 são gente que saiu do grupo |

> **Três dos falsos positivos (FP6, FP7, FP8) eram achados que eu mesmo havia classificado como
> graves nas Fases 1 e 3.** Foram rebaixados ao serem confrontados com os dados reais. O padrão
> merece registro: **a análise estática superestimou a gravidade em 3 de 3 casos testados.**

---

# 5. IMPACTO

## 5.1 Causa raiz e manifestações

| Item | Impacto | Justificativa |
|---|---|---|
| **Causa raiz** — entrada modelada como consumo de token | 🔴 **CRÍTICO** | Produz o ciclo de reclamação inteiro. Impede reentrada legítima e torna todo diagnóstico de campo enganoso |
| **F-31** — `usadoPor` nunca lido; "outra pessoa" falso | 🔴 **CRÍTICO** | 12,6% de quem entrou está exposto. Mensagem factualmente falsa e acusatória |
| **F-01** — falha de leitura vira "convite não existe" | 🔴 **CRÍTICO** | Atinge qualquer pessoa com rede instável abrindo o link pela primeira vez. Alcance indeterminável |
| **F-37** — aceite não limpa o tombstone | 🔴 **CRÍTICO** | Sucesso aparente sem efeito; consome o convite; 21 registros expostos |

## 5.2 Contribuintes

| Item | Impacto | Justificativa |
|---|---|---|
| **C1** — 396 KB sem timeout | 🟠 **ALTO** | Principal causa de falha de gravação em rede ruim; sem limite de espera |
| **C2 + C3** — 5xx definitivo, sem retomada | 🟠 **ALTO** | Converte falha transitória em perda definitiva da tentativa |
| **C6** — recuperação por digitação exata | 🟠 **ALTO** | Duplica cadastro e perde XP; 9 pessoas já impossíveis de recuperar |
| **C7** — identidade em gaveta única | 🟠 **ALTO** | Estado invisível e irreversível (T7); nenhuma tela avisa |
| **C4** — convites nunca podados | 🟡 **MÉDIO** | Degrada progressivamente C1; ainda a 34% do limite do documento |
| **C5** — reenvio multiplica | 🟡 **MÉDIO** | Consome espaço, confunde a administração; não impede a entrada |
| **C9** — versão congelada, app não recarrega | 🟡 **MÉDIO** | Impede diagnóstico; **e mantém aberta a janela de apagar 4 PGs** (F-71) |
| **C10** — suíte não cobre entrada | 🟡 **MÉDIO** | Risco de processo: defeitos futuros passarão igual |

## 5.3 Riscos (não são causa das reclamações, mas são danos ativos)

| Item | Impacto | Justificativa |
|---|---|---|
| **F-71** — build antiga apaga PGs 51–54 | 🔴 **CRÍTICO** | 4 PGs e 4 pessoas apagáveis por um único aparelho desatualizado. A defesa (regra M2) está escrita e **não publicada** |
| **F-40** — poda dos tombstones em 30 dias | 🔴 **CRÍTICO** | **3 805 XP** em 20 registros órfãos; primeiro vencimento em **~13/09**. Não depende de código |
| **F-70** — merge reverte o aceite | 🟠 **ALTO** | Cópia velha vence o empate; 50 dos 258 ativos sem carimbo algum |
| **F-39** — progresso descartado em silêncio | 🟠 **ALTO** | Único cenário que a auditoria **não conseguiu dimensionar** |
| **F-58** — 5 campos vazios em 100% dos registros | 🟡 **MÉDIO** | `pgIMD`, `pgRanking`, `pgNivel`, `setores`, `institucional`; 43 de 49 PGs sem identidade canônica |
| **F-27** — `convites` sem guarda de tamanho | 🟢 **BAIXO** | 34% do limite; sem urgência, mas sem vigilância |

---

# 6. RESPOSTA OBJETIVA

> ## Por que um participante legítimo não consegue entrar quando recebe novamente o mesmo convite?

**Porque o reenvio não é uma ação — e o aplicativo o prescreve como se fosse a solução.**

Em detalhe, com evidência:

### 6.1 O reenvio não altera nada

Encaminhar a mensagem ou usar "Copiar link" **não grava um único byte**: nem `status`, nem
`updatedAt`. Do ponto de vista do sistema, esses caminhos **não existem**. Portanto:

- se o convite estava **pendente**, ele já funcionava — e a falha estava em outro lugar;
- se o convite estava **consumido**, continuará consumido — e a recusa se repete idêntica.

**Não existe terceiro caso.** Reenviar nunca pode mudar o resultado.

### 6.2 A recusa que ela recebe depende de qual das cinco condições a atingiu

| Condição | O que ela lê | A afirmação é verdadeira? |
|---|---|---|
| **Ela já usou aquele convite** | "já foi utilizado por **outra pessoa**" | ❌ **falsa** — foi ela mesma, e o app tem isso gravado |
| **A leitura da nuvem falhou** | "este convite **não existe**" | ❌ **falsa** — o convite está íntegro e pendente |
| **Ela foi removida do PG** | *(nenhuma — a tela diz que deu certo)* | ❌ **falsa** — gravou, e ela continua invisível |
| **Aparelho/navegador novo, digitação diferente** | *(nenhuma — entra normalmente)* | ⚠️ entrou **como outra pessoa**, sem o XP |
| **Rede oscilou ou servidor falhou** | "Sem conexão" | ✅ **verdadeira**, mas desiste na 1ª tentativa |

### 6.3 Por que o ciclo se sustenta

Quatro das cinco mensagens **culpam o convite** e **prescrevem pedir outro**. O coordenador
obedece à tela. O convite novo é criado, é válido, e **não toca em nenhuma das cinco condições**.
A pessoa tenta de novo e falha pelo mesmo motivo.

Foi assim que se chegou a **12 links válidos simultâneos** nas mãos de uma pessoa que continua
fora do grupo.

### 6.4 Onde o problema está

> **Não está no convite.** Não está no contrato de escrita, nas guards, na concorrência nem no
> cache — os quatro foram testados e descartados com evidência.
>
> **Está na decisão de entrada e na comunicação da falha**, que olham exclusivamente para o estado
> do convite, ignorando o estado da pessoa e o resultado da própria leitura.
>
> Os fatores de **identidade** (aparelho novo, `localStorage` perdido), **persistência** (396 KB
> sem timeout, 5xx definitivo) e **versão** (código antigo em campo) são **contribuintes reais**:
> eles determinam *com que frequência* a falha acontece, mas não *por que ela não se resolve*.

---

# 7. Critério de conclusão — verificação

A Fase 0 estabeleceu que a auditoria só estaria concluída ao responder duas perguntas com
evidência. Ambas estão respondidas:

**"Qual condição exata impede o participante de entrar ou reentrar quando recebe novamente o
convite?"**
→ §6.2: cinco condições, nenhuma delas o convite; a mais frequente para quem já entrou é a não
idempotência (F-31), e para quem nunca entrou é a falha de leitura mal classificada (F-01).

**"O problema está no convite, na identidade, nas guards, na persistência, na versão/cache, na
concorrência ou na combinação desses fatores?"**
→ §6.4: **na combinação, com hierarquia clara.** Causa raiz na **modelagem da entrada e na
comunicação da falha**. Identidade, persistência e versão são **contribuintes**. Guards,
concorrência, cache e o próprio convite são **falsos positivos**.

---

# 8. Limites desta classificação

- **A frequência relativa das cinco condições não foi medida.** O aplicativo não registra
  tentativas frustradas (F-59) e a rota do convite não alimenta a telemetria. A ordenação da §6.2
  é por população exposta, não por incidência observada.
- **O caso concreto que originou a reclamação não foi rastreado até a pessoa.** Identifiquei o
  padrão em produção (12 links válidos, PG 30) e o reproduzi em bancada, mas não confirmei com o
  participante qual mensagem ele viu. **Essa confirmação fecharia o diagnóstico em definitivo** —
  ver §9.
- **F-39 permanece indimensionável.** Quem está nesse estado não consta na nuvem.
- **A causa raiz é uma afirmação sobre o modelo, não sobre uma linha.** As linhas concretas estão
  citadas (§1.1, §1.2), mas a correção mínima delas não elimina o modelo — ver Fase 12.

---

# 9. O que fecharia o diagnóstico em definitivo

Uma única pergunta a qualquer das **5 pessoas que hoje seguram mais de um link válido**:

> *"Ao abrir o link, qual texto exato apareceu na tela?"*

As cinco condições produzem textos **diferentes e distinguíveis**:

| Se ela vir… | A condição é |
|---|---|
| "já foi utilizado por outra pessoa" | não idempotência (F-31) |
| "não existe ou não está mais disponível" | falha de leitura (F-01) ou conflito |
| "Sem conexão" | falha de gravação (C1/C2) |
| a tela de boas-vindas, mas não aparece na lista | tombstone (F-37) |
| entrou com XP zerado | duplicata por digitação (C6) |

**É o teste decisivo mais barato disponível, e não exige tocar em nada.**

A Fase 12 apresenta as propostas de correção — **nenhuma será implementada sem autorização
explícita.**
