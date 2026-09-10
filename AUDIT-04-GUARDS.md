# AUDIT-04-GUARDS — Inventário das condições que bloqueiam o aceite

**Auditoria:** Falhas de entrada / reentrada no aplicativo
**Fase:** 4 — Guards: onde o participante está sendo bloqueado
**Data de execução:** 2026-08-31
**Baseline de código:** `main` @ `1aafe63` — ver [AUDIT-00-SAFETY.md](AUDIT-00-SAFETY.md)
**Baseline de dados:** instantâneo de produção de 31/08/2026 09:51:54Z
**Alterações de código:** **nenhuma** · **Escritas em produção:** **nenhuma**

---

## Resposta à pergunta central

> **Existe alguma guard que está correta para o primeiro ingresso, mas incorreta para a
> reentrada?**

**Sim. Quatro.** E o padrão que as une é o mesmo: **todas confundem "este convite já foi usado"
com "esta pessoa não pode entrar"**, porque nenhuma delas pergunta *quem* está do outro lado.

| Guard | Correta no 1º ingresso porque… | Incorreta na reentrada porque… |
|---|---|---|
| **G-07 / G-14** `status !== 'pendente'` | impede que um terceiro use um convite já consumido | acusa **a própria pessoa** que o consumiu, dizendo que foi "outra pessoa" |
| **G-18 / G-19** autoridade do emissor | garante que quem convidou tinha o cargo | é avaliada **no momento do aceite**: se o emissor saiu do PG depois, o convite morre sozinho |
| **G-05** `!inv → 'inexistente'` | um id inventado não existe mesmo | num aparelho **novo**, o cache local está vazio e falha de rede vira "convite inexistente" |
| **G-11** DB-01 (um PG por vez) | impede acumular vínculos | ao trocar de PG, a remoção pode não ser gravada — a pessoa fica nos dois (F-15/F-21) |

E há um caso pior que uma guard errada: **uma guard que faltou.**

> ### 🔴 F-44 — A guard do tombstone existe em um lugar e falta no lugar que grava
>
> `getMeuGrupoAtivo` (G-11) filtra `removed` corretamente. **`aceitarConvite` não filtra.**
> São a mesma decisão — "esta pessoa está neste grupo?" — respondida de dois jeitos opostos,
> com 200 linhas de distância. A primeira só decide se mostra um modal; a segunda decide o que
> vai para a nuvem.
>
> **A guard correta está no lugar que não grava; a incorreta está no lugar que grava.**

---

# 1. Inventário completo

**31 guards ativas** distribuídas em 6 camadas, mais **3 dormentes**. Todas percorridas no
caminho do aceite.

```
CAMADA 1  Roteamento (initApp)                     4 guards
CAMADA 2  Exibição (renderTelaConvite)             4 guards
CAMADA 3  Campo (confirmarEntradaConvite)          3 guards
CAMADA 4  Autoridade (validarConviteParaAceite)    8 guards
CAMADA 5  Contrato e escrita (commit + fbWrite)    8 guards
CAMADA 6  Servidor (regras do Firestore)           4 guards
          ─────────────────────────────────────────────────
          DORMENTES (escritas, não em vigor)       3 guards
```

---

## CAMADA 1 — Roteamento (`initApp`, `index.html:7334`)

### G-01 · `params.get('resetar') !== null`

| | |
|---|---|
| **Condição** | qualquer `?resetar` na URL |
| **Motivo** | reset de desenvolvimento |
| **Mensagem** | **nenhuma** — apaga e recarrega |
| **Estado esperado** | uso deliberado por quem dá suporte |
| **Estado real possível** | link com `?resetar` encaminhado por engano |
| **Fallback** | ❌ nenhum. `localStorage.clear()` + `sessionStorage.clear()` são irreversíveis |
| **Bloqueia legítimo?** | Não bloqueia — **destrói**. Avaliada **antes** de `?conv` |

⚠️ Sem confirmação e sem aviso. Quem executar isso perde a identidade do aparelho e cai no
Cenário E da Fase 3.

### G-02 · `FB_FLAGS.convitesV2 && convId`

| | |
|---|---|
| **Condição** | flag ligada **e** `?conv=` presente |
| **Motivo** | rota do convite de uso único |
| **Mensagem** | — |
| **Estado real possível** | flag está `true` em produção; não bloqueia hoje |
| **Fallback** | com a flag desligada, o convite seria ignorado em silêncio |
| **Bloqueia legítimo?** | Não, no estado atual |

### G-03 · `params.get('pg')`

| | |
|---|---|
| **Condição** | link no formato antigo `?pg=N` |
| **Motivo** | formato descontinuado |
| **Mensagem** | "Convite de versão anterior… Solicite um novo convite" |
| **Fallback** | ✅ mensagem correta e acionável |
| **Bloqueia legítimo?** | Sim, **corretamente** |

### G-04 · `history.replaceState` antes de `renderTelaConvite`

| | |
|---|---|
| **Condição** | sempre, no ramo do convite (`index.html:7348`) |
| **Motivo** | limpar a URL |
| **Mensagem** | — |
| **Estado esperado** | a pessoa conclui o aceite nesta sessão de tela |
| **Estado real possível** | recarregar, girar o aparelho, sistema descartar a aba |
| **Fallback** | ❌ **nenhum.** O `inviteId` só existe em memória |
| **Bloqueia legítimo?** | **SIM.** Recarregar = perder o convite e cair na porta institucional |

**F-10 confirmado.** Não é uma verificação, mas funciona como bloqueio: destrói a única
referência ao convite antes de qualquer coisa dar errado.

---

## CAMADA 2 — Exibição (`renderTelaConvite`, `index.html:10358`)

Todas rodam **depois** de `await syncFromFirebase()`, cujo retorno é **ignorado**.

### G-05 · `!inv` → `'inexistente'`

| | |
|---|---|
| **Condição** | `getConvite(inviteId)` não achou no **cache local** |
| **Motivo** | convite inexistente |
| **Mensagem** | "Convite indisponível — Este convite não existe ou não está mais disponível" |
| **Estado esperado** | id inventado, digitado errado, ou convite podado |
| **Estado real possível** | **falha de rede**, DNS lento, chave recusada, aparelho novo com cache vazio |
| **Fallback** | ❌ **nenhum.** A mensagem `'sem_conexao'` existe (`index.html:10301`) e é **inalcançável** por este caminho |
| **Bloqueia legítimo?** | **SIM — a guard mais provável de estar bloqueando gente hoje** |

**F-01 confirmado.** `syncFromFirebase` captura toda exceção e devolve `false`; ninguém lê esse
retorno.

### G-06 · `(inv.versaoConvite \|\| 1) !== VERSAO_CONVITE`

| | |
|---|---|
| **Condição** | versão do convite ≠ 2 |
| **Motivo** | formato antigo |
| **Mensagem** | ❌ **errada** — devolve `'versao_incompativel'`, mas `mensagemConvite` só define `'versao_anterior'` → cai no texto genérico |
| **Fallback** | ❌ chave inexistente |
| **Bloqueia legítimo?** | Não hoje: **os 492 convites em produção são versão 2** |

**F-03 confirmado**, sem vítima atual.

### G-07 · `inv.status !== 'pendente'`

| | |
|---|---|
| **Condição** | convite em estado terminal |
| **Motivo** | uso único |
| **Mensagem** | `utilizado` → **"Este convite já foi utilizado por outra pessoa"** |
| **Estado esperado** | um terceiro tentando reaproveitar |
| **Estado real possível** | **a própria pessoa reabrindo o próprio link** |
| **Fallback** | ❌ nenhum. `inv.usadoPor` guarda quem usou e **nunca é lido** |
| **Bloqueia legítimo?** | **SIM. 26 dos 207 aceites (12,6%)** estão nessa condição hoje |

⭐ **Esta é a resposta principal à pergunta central.** Correta no primeiro ingresso, factualmente
falsa na reentrada.

### G-08 · `inv.expiraEm && Date.now() > inv.expiraEm`

| | |
|---|---|
| **Condição** | passou dos 7 dias |
| **Mensagem** | "Convite expirado… Solicite um novo convite" — ✅ correta e acionável |
| **Fallback** | ✅ a orientação resolve |
| **Bloqueia legítimo?** | Sim, **corretamente**. Afeta **34 dos 90 pendentes** |

Observação: esta guard compara com o relógio diretamente — **é o que faz o app estar seguro apesar
de `expirarConvitesVencidos()` nunca rodar** (F-30). O estado `expirado` nunca é gravado, mas o
prazo é respeitado.

---

## CAMADA 3 — Campo (`confirmarEntradaConvite`, `index.html:10425`)

### G-09 · `!nome`

| | |
|---|---|
| **Mensagem** | "Por favor, informe seu nome." ✅ |
| **Estado real possível** | campo pré-preenchido com `ST.userName` — em aparelho compartilhado, o nome de **outra pessoa** |
| **Fallback** | ✅ a pessoa corrige |
| **Bloqueia legítimo?** | Não. Mas **deixa passar o nome errado** (F-14) |

### G-10 · `!wa \|\| wa.length < 10`

| | |
|---|---|
| **Condição** | menos de 10 dígitos |
| **Mensagem** | "Informe um WhatsApp válido com DDD." |
| **Estado esperado** | mesma régua do dado gravado |
| **Estado real possível** | ❌ **régua diferente.** `normalizarWaBR` (aplicado depois) recusa DDD < 11, celular de 11 dígitos sem 9, fixo fora de 2–5 |
| **Fallback** | ❌ **pior que nenhum**: a recusa posterior é **silenciosa** e grava `wa = ''` |
| **Bloqueia legítimo?** | Não bloqueia — **deixa entrar com cadastro mutilado** |

> ### 🔴 F-45 — A guard mais permissiva do sistema é a que mais estraga
>
> Duas réguas para o mesmo campo, e a mais frouxa é a que fala com a pessoa. O que passa por
> G-10 e é recusado por `normalizarWaBR` **não gera erro**: vira string vazia.
>
> Com `wa` vazio, `buscarCadastroExistente` (`index.html:12016`) devolve `null` na primeira
> linha — **a recuperação de cadastro nunca é sequer tentada**. Em produção: **9 dos 258
> participantes ativos** estão assim. São 9 duplicações futuras já contratadas.

### G-11 · DB-01 — `getMeuGrupoAtivo(nome).existe && grupoNum !== inv.grupoNum`

| | |
|---|---|
| **Condição** | vínculo ativo em **outro** PG (tutor isento) |
| **Motivo** | um colaborador/coordenador por PG |
| **Mensagem** | modal "Você já participa do PG X. Deseja sair dele?" ✅ |
| **Estado esperado** | a pessoa escolhe; a saída é gravada; entra no novo |
| **Estado real possível** | `removerDoGrupoAtual` casa por `p.ts === meuGrupo.ts`; se `meuGrupo` veio reconstruído de `ST` (sem `ts`), **não marca tombstone nenhum** |
| **Fallback** | parcial — a gravação do aceite ocorre de qualquer forma |
| **Bloqueia legítimo?** | Não bloqueia. **Pode deixar a pessoa em dois PGs** |

✅ **É a única guard do sistema que filtra `removed`** — e por isso a única correta na reentrada.
Foi o que a correção `1aafe63` consertou.

**Verificação em produção:** 0 dos 258 participantes ativos estão sem `ts` (campo ausente, nulo ou
zero — os três casos verificados um a um). **O ramo destrutivo do F-15 não tem combustível hoje**;
o ramo benigno continua possível.

---

## CAMADA 4 — Autoridade (`validarConviteParaAceite`, `index.html:10009`)

Roda **contra o remoto fresco**, dentro do laço de gravação. Repete as verificações da Camada 2 —
deliberadamente, porque a exibição usa cache e esta usa a nuvem.

| # | Condição | Motivo | Mensagem | Bloqueia legítimo? |
|---|---|---|---|---|
| G-12 | `!inv` | `inexistente` | genérica | Sim, se o convite ainda não replicou |
| G-13 | versão ≠ 2 | `versao_incompativel` | ❌ chave inexistente → genérica | Não hoje |
| G-14 | `status !== 'pendente'` | `utilizado`/`cancelado`/`expirado` | **"usado por outra pessoa"** | **SIM** (ver G-07) |
| G-15 | passou de `expiraEm` | `expirado` | ✅ correta | Sim, corretamente |
| G-16 | `!g` no remoto | `grupo_inexistente` | ❌ genérica | Sim, se o PG foi esvaziado |
| G-17 | tutor fora da allowlist | `nao_autorizado_tutor` | ✅ correta | Correto por desenho |
| G-18 | emissor de convite de coordenador sem autoridade | `emissor_sem_papel` | "Quem enviou não é mais responsável" | **SIM** (ver abaixo) |
| G-19 | emissor de convite de colaborador sem autoridade | `emissor_sem_papel` | idem | **SIM** |

### G-18 / G-19 em detalhe

```js
const emissor = (g.participantes || []).find(p => p.memberId === inv.deId);
const papelEmissor = emissor ? (emissor.papel || emissor.tipo) : null;
const emissorViaAdmin = g.coordenador && inv.deNome &&
  String(g.coordenador).trim().toLowerCase() === String(inv.deNome).trim().toLowerCase();
if (papelEmissor !== 'coordenador' && !emissorViaAdmin) return { ok:false, motivo:'emissor_sem_papel' };
```

**Estado esperado:** o emissor tinha autoridade quando emitiu.
**Estado real:** a verificação usa o estado do grupo **agora**, não o de quando o convite nasceu.

> ### 🔴 F-35 (confirmado com prova) — o convite perde a validade sem que nada aconteça com ele
>
> Simulei estas duas guards sobre os 492 convites de produção. **Seis convites com status
> `utilizado` seriam recusados hoje** — foram aceitos quando o emissor tinha autoridade e não
> seriam aceitos agora.
>
> Basta o coordenador sair do PG, ser removido, ter o `papel` limpo numa troca ou o campo
> `g.coordenador` ser editado, e **todos os convites pendentes que ele emitiu param de funcionar
> na mesma hora**. Sem aviso para ninguém: nem para quem emitiu, nem para quem recebeu, nem para
> o Tutor.
>
> ⚠️ **Interação crítica:** o defeito R-05 (o `papel` do coordenador anterior **não** é limpo na
> troca) está hoje **mascarando** o F-35. Corrigir R-05 isoladamente mataria de uma vez todos os
> convites pendentes emitidos pelo coordenador anterior. **As duas correções têm de ser
> desenhadas juntas.**

### As réguas de nome divergentes (F-06) — sem vítima

`gerarConvite` aprova pela régua tolerante (`nomesCorrespondem`); G-18/G-19 recusam pela estrita.
Simulação nos 492 convites: **0 casos com essa assinatura**, em qualquer status. Defeito real,
latente, **sem nenhuma ocorrência histórica**. Confirmado o rebaixamento para severidade C.

---

## CAMADA 5 — Contrato e escrita

### G-20 · `!cfg` → `sem_config`

Mensagem: ❌ **não existe** — cai no genérico "Convite indisponível". Só ocorre com configuração
do Firebase corrompida no aparelho.

### G-21 · `fbReadDoc` lança → `sem_conexao`

Mensagem ✅ correta e acionável. **É a mensagem que a G-05 deveria ter usado e não usa.**

### G-22 · `validarIntencao` (`index.html:10939`)

| Sub-condição | Detalhe |
|---|---|
| `operacao` ausente ou fora de `FB_OPERACOES` | 5 operações válidas |
| chave fora de `FB_CHAVES_INTENCAO` | 8 chaves permitidas |
| campo declarado com tipo não-array | — |
| `dados` declarado vazio | — |

Motivo: `contrato` · Mensagem ✅ própria ("inconsistência interna. Nada foi alterado").
**Bloqueia legítimo?** Não — só pega erro de programação. É uma guard **bem feita**.

### G-23 · Barreira do modo de teste (`index.html:11045`)

Se `MODO_TESTE`, devolve sucesso **falso** sem tocar na rede. Como `fbReadDoc` também devolve
`null` em modo de teste, **o fluxo de convite é intestável de ponta a ponta em ambiente isolado**
(F-19). Restrição de método, não defeito.

### G-24 · G6 — `fbSchemaRemoto > SCHEMA_VERSION` → `app_desatualizado`

Mensagem ✅ correta e acionável ("Feche e abra o app… toque no link novamente").
**Não pode disparar hoje:** produção não tem o campo `schemaVersion` (a flag de escrita está
desligada), então `fbSchemaRemoto = 1` e `SCHEMA_VERSION = 2`. **Guard correta, dormente.**

### G-25 · Tamanho — `dadosStr.length > 480000`

| | |
|---|---|
| **Motivo** | `tamanho` |
| **Mensagem** | ❌ **não existe** — cai no genérico |
| **Estado real** | `dados` = **160 868 caracteres** = 32% do limite. Folga confortável |
| **Cobre `convites`?** | ❌ **Não.** `convites` = **196 641 caracteres, sem guarda nenhuma** |

> ### 🔴 F-27 (confirmado com números) — a guard de tamanho vigia o campo errado
>
> O campo **maior** do documento é o que **não** é medido. `convites` (196 641) já passou
> `dados` (160 868), e cresce sem limite porque convite pendente nunca é podado (F-30).
>
> Documento total: **358 183 bytes de 1 048 576** = **34%**. Não é urgente. Mas quando o limite
> do Firestore for atingido, **toda gravação passará a falhar com HTTP 400**, que o app converte
> em exceção → `sem_conexao`. **Todo aceite passará a exibir "Sem conexão" para sempre**, sem
> nenhuma pista da causa real.

### G-26 a G-29 · Guardas de conteúdo (`validarPayloadDados`, `index.html:10985`)

Ordem fixa: perda → esvaziamento → colisão → invariantes.

| # | Guard | Condição | Motivo | Pode barrar um aceite legítimo? |
|---|---|---|---|---|
| G-26 | **G1 perda** | PG já visto na nuvem some do payload | `guarda`/`perda` | Improvável: o aceite copia `remote.dados` inteiro |
| G-27 | **G2 esvaziamento** | PG tinha conteúdo e iria vazio | `guarda`/`esvaziamento` | Improvável no aceite (só acrescenta) |
| G-28 | **G4 colisão** | slot em criação foi ocupado | `slot_ocupado` | Não: `pgCriacaoPretendida` é nulo no aceite |
| G-29 | **G3 invariantes** | slot ou `pgId` repetido | `guarda`/`invariantes` | ⚠️ **Sim, indiretamente** |

**Sobre G-29:** `validarInventario` (`index.html:9402`) rejeita `pgId` repetido. Se a nuvem já
contiver essa inconsistência, **todo aceite naquele documento passa a falhar** com "Entrada
bloqueada por segurança" — inclusive os legítimos, e inclusive em PGs sem relação com a
inconsistência. A guard defende o dado à custa de bloquear o sistema inteiro.

Mensagem de `guarda`: ✅ correta e honesta ("Sua entrada NÃO foi registrada").

### G-30 · Pré-condição — `FAILED_PRECONDITION` → 4 tentativas → `conflito`

| | |
|---|---|
| **Motivo** | concorrência: outro aparelho gravou entre a leitura e a escrita |
| **Mensagem** | ❌ **não existe para `conflito`** — cai no genérico "Convite indisponível" |
| **Fallback** | ✅ 4 tentativas com espera de 80–200 ms |
| **Bloqueia legítimo?** | **SIM**, quando o documento está sob escrita intensa |

O comentário no código admite: *"esgotou tentativas — quase sempre 'já utilizado'"*. Mas a rota de
**emissão** tem mensagem própria para `conflito` ("Muitas alterações ao mesmo tempo") e a rota de
**aceite** não. **A mesma falha tem texto claro para quem convida e texto enganoso para quem
entra.**

### G-31 · HTTP ≠ ok → `throw` → `sem_conexao`

Captura **tudo** que não é 200 nem 400/FAILED_PRECONDITION: 403 de regra violada, 429, 500, 503.
**Um 403 de allowlist aparece como "Sem conexão"** — a armadilha já vivida com `convites` (08/07)
e `setoresMestre` (RC4.8).

---

## CAMADA 6 — Servidor (regras do Firestore)

Texto vigente publicado em 19/08 (`firestore.rules`). **São as únicas guards que um aparelho com
app antigo não consegue atravessar.**

### G-32 · `keys().hasOnly([...])` — 7 campos

`dados`, `ts`, `tutores`, `convites`, `setoresMestre`, `setoresEfetivo`, `embaixadoresExternos`.
Campo de topo novo fora da lista → **403 na gravação inteira**, que o app mostra como "Sem
conexão". É exatamente por isso que `FB_FLAGS.schemaVersionWrite` nasce desligada.

### G-33 · `request.resource.data.dados is string` — **obrigatório**

⚠️ Diferente dos demais campos, **não** está protegido por `!('dados' in ...)`. O documento
resultante **precisa** ter `dados`. Funciona hoje porque `updateMask` preserva o campo existente.
**Um documento sem `dados` recusaria toda gravação** — inclusive as de convite, que
deliberadamente não declaram `dados`.

### G-34 · `dados.size() < 500000`

Guard do servidor. A do cliente (G-25) é **480 000** e mede **caracteres UTF-16 do JavaScript**;
esta mede a string do Firestore. Unidades diferentes, limites diferentes — a margem de 20 000 é o
colchão. Estado atual: 160 868, folga de 68%.

### G-35 · demais campos `is string` quando presentes

Correto. **Nenhum limite de tamanho para `convites`** — nem aqui, nem no cliente.

---

## GUARDS DORMENTES (escritas, sem efeito)

| # | Guard | Onde | Por que está desligada | Risco de ligar |
|---|---|---|---|---|
| G-D1 | **`writeNonce`** (`gerarWriteNonce`, `index.html:10978`) | app | `FB_FLAGS.schemaVersionWrite = false` | O comentário no código já alerta: gerar o carimbo **fora** de `fbWriteGrupos` faria toda retentativa enviar o mesmo valor e transformaria conflito recuperável em falha permanente |
| G-D2 | `schemaVersion` na allowlist | regra | não publicado no Console | Nenhum (passo A é aditivo) |
| G-D3 | **M2 passo B** — exigir `schemaVersion` ao alterar `dados` | regra | não publicado | ⚠️ **Defeito conhecido:** bloquearia **todas** as gravações a partir da segunda. Não publicar |

**Sobre o nonce, que a Fase 4 pediu para examinar:** ele não está em vigor e **não bloqueia
ninguém hoje**. Quando for ligado, seu papel é provar que o cliente conhece o contrato de escrita
— não autenticar. O próprio código registra o limite: *"NÃO constitui autenticação nem prova de
identidade do cliente — a chave da API é pública."*

---

# 2. Guards que hoje **não podem** disparar

Verificado contra os dados de produção:

| Guard | Por que não dispara | Evidência |
|---|---|---|
| G-06 / G-13 (versão) | todos os convites são versão 2 | 492 de 492 |
| G-24 (schema novo) | produção não grava `schemaVersion` | flag desligada |
| G-25 / G-34 (tamanho) | 32% do limite | 160 868 de 500 000 |
| G-28 (colisão de slot) | `pgCriacaoPretendida` é nulo no aceite | por construção |
| G-17 (allowlist de tutor) | nenhum convite pendente é de função `tutor` | 0 de 90 |
| F-15 ramo destrutivo | nenhum participante ativo sem `ts` | 0 de 258 |
| F-26 (dedup por nome) | nenhum nome repetido | 0 de 258 |

**Sete verificações inertes.** Não é desperdício — é reserva contra estados que já ocorreram no
passado. Mas para o diagnóstico do problema atual, **elas podem ser descartadas**.

---

# 3. As guards que estão bloqueando gente hoje

Ordenadas por número estimado de pessoas atingidas.

| # | Guard | Quantos | Mensagem exibida | A mensagem é verdadeira? |
|---|---|---|---|---|
| 1 | **G-07/G-14** convite utilizado | **26 pessoas** (12,6% dos aceites) | "usado por **outra pessoa**" | ❌ **falsa** |
| 2 | **G-05** convite inexistente | indeterminado — toda falha de rede | "não existe ou não está mais disponível" | ❌ **falsa** quando é rede |
| 3 | **G-08/G-15** expirado | 34 convites pendentes vencidos | "expirou. Solicite um novo" | ✅ verdadeira |
| 4 | **G-04** URL apagada | indeterminado | *(porta institucional)* | ❌ não explica nada |
| 5 | **G-18/G-19** emissor sem papel | 2 pendentes (ambos já vencidos) | "não é mais responsável" | ⚠️ tecnicamente sim |
| 6 | **G-30** conflito | raro | "não existe ou não está mais disponível" | ❌ **falsa** |

**Somando as linhas 1, 2, 4 e 6: quatro guards distintas exibem mensagens falsas ou vazias**, e
três delas usam **o mesmo texto**. É a razão de "Convite indisponível" nunca ter sido
diagnosticável em campo.

---

# 4. Achados novos da Fase 4

| # | Achado | Sev. |
|---|---|---|
| **F-44** | A guard do tombstone existe onde não grava (`getMeuGrupoAtivo`) e falta onde grava (`aceitarConvite`) | **A** |
| **F-45** | G-10 é mais permissiva que `normalizarWaBR`; o que passa numa e falha na outra grava `wa=''` em silêncio | **A** |
| **F-46** | `conflito`, `sem_config`, `tamanho` e `erro` não têm mensagem na rota de aceite; a rota de emissão tem | B |
| **F-47** | G-29 (invariantes) barra **todo** aceite do sistema se a nuvem tiver um `pgId` repetido, mesmo em PGs sem relação | B |
| **F-48** | G-31 converte 403 de regra violada em "Sem conexão" — armadilha já vivida duas vezes | B |
| **F-49** | G-01 (`?resetar`) apaga o armazenamento sem confirmação e é avaliada antes de `?conv` | B |
| **F-50** | G-33 exige `dados` no documento resultante; um documento sem esse campo recusaria até gravação de convite | C |

---

# 5. Achado operacional — PG 9 tem 4 participantes de teste ativos

Fora do escopo das guards, encontrado na verificação de identidades: **o PG 9 tem 4 registros de
teste ativos misturados a 6 pessoas reais.**

| | |
|---|---|
| Nome do PG | um PG **real**, com tutor e coordenadora reais |
| Participantes reais | 6, com XP entre 80 e 495 |
| Participantes de teste | **4**, com `memberId` `m1`, `m2`, `m3`, `m4` e `ts` = 1, 2, 3, 4 |
| Situação | **ativos** (sem tombstone), contados como participantes |

Esses 4 registros são o dado de teste que consta como **zerado em 04/08**. O slot foi ocupado por
um PG real em 06/08 e **os registros de teste voltaram** — mesmo mecanismo de ressurreição já
observado em outro slot: um aparelho com cópia local antiga sincronizou e os devolveu.

**Efeitos colaterais mensuráveis:** o PG conta 10 participantes em vez de 6 — o que distorce o
IMD, o Ranking, o aviso de atraso de leitura (calculado sobre a mediana do PG) e o pareamento do
Companheiro de Jornada, que depende de o número de participantes ser par ou ímpar.

Registrado, **não corrigido** — corrigir é escrita em produção, fora do escopo desta fase.

---

# 6. Correção a uma medida da Fase 2

A Fase 2 informou o tamanho dos campos usando os bytes do **envelope JSON da API**, que infla o
valor por escapar aspas. Os valores corretos, medidos sobre as strings reais:

| Campo | Fase 2 (envelope) | **Real** |
|---|---|---|
| `convites` | 221 807 | **196 641 caracteres / 197 070 bytes** |
| `dados` | 183 374 | **160 868 caracteres / 161 113 bytes** |
| Documento | 409 130 | **~358 183 bytes = 34% de 1 MiB** |

**A conclusão não muda** — `convites` continua sendo o maior campo do documento, e continua sem
guarda de tamanho. Mas a folga é maior do que a Fase 2 sugeriu.

---

# 7. Limites desta fase

- **Nada foi executado.** Nenhuma guard foi disparada de verdade; todas foram lidas no código e
  simuladas aritmeticamente sobre o instantâneo.
- **As guards do servidor não foram testadas.** O texto auditado é a cópia em `firestore.rules`,
  que o próprio arquivo declara não ser autoritativa — **quem vale é o texto no Console**. Se as
  duas divergirem, este inventário está errado na Camada 6.
- **A frequência de disparo é estimada, não medida.** O app não registra tentativas frustradas
  (nem nas guards, nem no aceite). Os números da §3 são inferidos do estado dos dados.
- **G-05 é indimensionável.** Falha de rede não deixa rastro em lugar nenhum.
- **A ordem de avaliação das guards do servidor não foi verificada** — o Firestore não informa
  qual cláusula da regra recusou, só devolve 403.
