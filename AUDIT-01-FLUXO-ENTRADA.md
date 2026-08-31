# AUDIT-01-FLUXO-ENTRADA — Mapa completo do fluxo de entrada

**Auditoria:** Falhas de entrada / reentrada no aplicativo
**Fase:** 1 — Mapa completo do fluxo de entrada
**Data de execução:** 2026-08-31
**Baseline:** `main` @ `1aafe63` — ver [AUDIT-00-SAFETY.md](AUDIT-00-SAFETY.md)
**Método:** análise estática do código publicado + leitura agregada do documento de produção
**Alterações de código nesta fase:** **nenhuma**

> Objetivo desta fase: reconstruir o caminho real percorrido por uma pessoa desde a emissão do
> convite até a confirmação de entrada, sem corrigir nada. Todo defeito encontrado é
> **registrado**, não reparado.

---

## Sumário executivo

O fluxo de entrada tem **11 etapas** e atravessa **38 funções** em `index.html`. Não há outro
arquivo envolvido: o aplicativo inteiro é um único HTML.

O desenho é bem melhor do que a fama que ele tem em campo. A entrada é montada contra o servidor,
não contra o aparelho; a gravação é protegida por pré-condição, por quatro guardas de conteúdo e
por um contrato de campos. **A fragilidade não está no núcleo de gravação — está nas bordas:** no
que a tela faz quando a leitura falha, em quem o aplicativo julga que você é, e em como ele
compara nomes.

Foram catalogados **21 pontos de falha** (F-01 a F-21). Três se destacam:

| | Achado | Por que importa |
|---|---|---|
| **F-01** | A tela do convite trata "não consegui ler a nuvem" como "este convite não existe" | É a explicação mais provável do "Convite indisponível" que ninguém consegue reproduzir |
| **F-06** | Um convite pode ser **criado** por quem não conseguirá tê-lo **aceito** | Nasce morto, e a culpa parece ser de quem recebeu |
| **F-11** | O convite expirado nunca é marcado como expirado (função nunca chamada) | Produção tem **0** expirados e 90 pendentes que jamais serão podados |

---

## Mapa de uma página

```
[1] GERAÇÃO            gerarECompartilhar → gerarConvite → commitConviteChange → fbWriteGrupos
       ↓                                    (autoridade)        (laço 4x)         (PATCH)
[2] LINK / TOKEN       APP_URL + '?conv=' + inviteId  →  wa.me
       ↓
[3] ABERTURA           initApp → params.get('conv') → replaceState → renderTelaConvite
       ↓
[4] IDENT. DO CONVITE  syncFromFirebase → fbReadDoc → mergeConvites → getConvite (cache local)
       ↓
[5] IDENT. DO USUÁRIO  getMyMemberId + ST.userName + formulário (nome, WhatsApp)
       ↓
[6] VALIDAÇÕES         campo → DB-01 (1 PG) → validarConviteParaAceite → contrato → G1-G4/G6
       ↓
[7] ACEITE             aceitarConvite dentro de commitConviteChange (contra o remoto fresco)
       ↓
[8] PARTICIPANTE       buscarCadastroExistente (recupera) OU push (cria)
       ↓
[9] ASSOCIAÇÃO         g.participantes + g.coordenador/g.tutor + atualizarStatusPg
       ↓
[10] PERSISTÊNCIA      PATCH com updateMask + pré-condição → aplicarLocal()
       ↓
[11] CONFIRMAÇÃO       welcomeDone + modal de recuperação OU tela de erro
```

---

# ETAPA 1 — GERAÇÃO DO CONVITE

### Funções

| Função | Linha | Papel |
|---|---|---|
| `gerarECompartilhar(funcao, grupoNum)` | `index.html:10472` | Entrada pela interface; reserva a janela do WhatsApp |
| `gerarConvite({tipo, grupoNum, funcao, paraWa})` | `index.html:10118` | Confere autoridade e monta a gravação |
| `getMinhaFuncaoNoGrupo(grupoNum)` | `index.html:9962` | Papel pelo registro de participante |
| `souTutorAdminDoGrupo(gLocal)` | `index.html:10104` | Autoridade administrativa de Tutor |
| `souCoordenadorAdminDoGrupo(gLocal)` | `index.html:10113` | Autoridade administrativa de Coordenador |
| `estaNaAllowlistTutores({nome, wa})` | `index.html:9977` | Raiz de confiança do Tutor |
| `normalizarWaBR(valor)` | `index.html:9900` | Normaliza o WhatsApp do destinatário |
| `criarConviteObj({...})` | `index.html:9917` | Fábrica pura do objeto convite |
| `commitConviteChange(construir)` | `index.html:10053` | Laço de gravação seguro à concorrência |

### Variáveis

`PEQUENOS_GRUPOS` (lista de PGs em memória) · `ST.userName` · `ST.tutorPanelAuth` (nome de quem
está autenticado no Painel) · `TUTORS` (allowlist) · `MEMBER_ID_KEY` → `getMyMemberId()` ·
`VERSAO_CONVITE = 2` · `CONVITE_TTL_MS = 7 dias` · `MODO_TESTE`.

### Campos utilizados

O objeto gravado tem 15 campos:
`inviteId` · `versaoConvite` · `tipo` · `funcao` · `grupoNum` · `grupoNome` · `deId` · `deNome` ·
`paraWa` · `status` · `criadoEm` · `expiraEm` · `updatedAt` · `usadoPor` · `usadoEm`.

Do grupo, são lidos: `g.num`, `g.nome`, `g.tutor`, `g.coordenador`, `g.participantes[].memberId`,
`.nome`, `.papel`, `.tipo`.

### Origem dos dados

Interface (função pretendida, WhatsApp do destinatário) + estado local (`PEQUENOS_GRUPOS`,
`ST`) + **leitura fresca do documento remoto** feita dentro de `commitConviteChange` a cada volta
do laço.

### Destino dos dados

Firestore, documento `jdpg/grupos`, campo de topo **`convites`** — e somente ele mais `ts`.
Desde a E1, `gerarConvite` **não declara `dados`**: criar convite não pode reescrever a lista de
PGs. Essa foi a correção que fechou a fresta pela qual o PG 51 foi esvaziado.

### Possíveis falhas

- **F-05 — Duas réguas de nome para a mesma decisão.** `souCoordenadorAdminDoGrupo` (aqui) usa
  `nomesCorrespondem()`, que aceita nome curto e ignora acento. `validarConviteParaAceite`
  (etapa 6) usa comparação **estrita**. Ver F-06, que é a consequência.
- **F-16 — Convite emitido a partir de uma lista local desatualizada.** `gLocal` sai de
  `PEQUENOS_GRUPOS`, não do remoto. `grupoNome` é carimbado no convite nesse momento; se o PG for
  renomeado depois, o convite exibirá o nome antigo na tela de aceite.
- **F-17 — WhatsApp do destinatário vira semente de identidade.** `paraWa` é o palpite de quem
  convida; a etapa 5 o usa para **pré-preencher** o campo da pessoa convidada. Ver F-13.
- Autoridade negada devolve `sem_autoridade`, com texto próprio — não é falha silenciosa.

---

# ETAPA 2 — LINK / TOKEN

### Funções

| Função | Linha |
|---|---|
| construção do link (dentro de `gerarConvite`) | `index.html:10165` |
| `textoConviteWhatsApp(inv)` | `index.html:10285` |
| `pgRotulo(inv)` | `index.html:10281` |
| `ofertarEnvioConvite(url, link)` | `index.html:10515` |
| `APP_URL` | `index.html:2933` |

### Variáveis e composição

```
link  = APP_URL + '?conv=' + inv.inviteId
APP_URL = window.location.href.split('?')[0]
url   = 'https://wa.me/' + destino + '?text=' + encodeURIComponent(texto + '\n\n' + link)
```

### Origem / destino

O **token é apenas o `inviteId`** — um UUID de 36 caracteres. O link não carrega nome, grupo,
função nem qualquer dado da pessoa: toda a verdade vem da base. Isso é uma decisão de desenho
correta e vale registrar como tal.

### Possíveis falhas

- **F-07 — 36 caracteres é um comprimento hostil para o WhatsApp.** Se o aplicativo de mensagens
  quebrar ou truncar a URL, o `inviteId` chega incompleto e a etapa 4 conclui "não existe". Já
  documentado em campo.
- **F-08 — `APP_URL` é derivado da URL que o emissor está usando naquele instante.** Quem gerar um
  convite a partir de um endereço que não seja o do GitHub Pages (servidor local de teste, cópia
  em outro domínio, endereço com fragmento `#`) produz um link que não leva ao aplicativo de
  produção. Não há verificação de que `APP_URL` é o endereço canônico.
- **F-09 — A abertura do WhatsApp é o elo mais frágil e já falhou de três formas distintas**
  (janela bloqueada após o `await`, número inválido recusado pelo `wa.me`, celular que não entrega
  o link ao aplicativo). Há mitigação para as três — janela reservada dentro do gesto,
  `normalizarWaBR` antes de criar, e `ofertarEnvioConvite` como rede de segurança —, mas o convite
  **já está gravado** quando qualquer uma delas dispara. É por isso que "não consigo convidar"
  convive com dezenas de convites válidos na base.

---

# ETAPA 3 — ABERTURA DO LINK

### Funções

| Função | Linha |
|---|---|
| `initApp()` | `index.html:7334` |
| ramo do convite | `index.html:7346-7351` |
| `parseConviteIdFromUrl()` | `index.html:9950` — **definida, mas não usada neste caminho** |
| `showInstitutionalLanding()` | `index.html:10335` |
| `irParaInicioLimpo()` | `index.html:10328` |

### Ordem de precedência dos parâmetros da URL

```
1. ?resetar   → apaga TODO o armazenamento local e recarrega
2. ?conv=<id> → tela de convite            ← porta de entrada auditada
3. ?pg=N      → link antigo, recusado
4. ?tutor     → painel administrativo
5. ?tela=X    → navegação interna
6. nenhum     → home (se welcomeDone) ou porta institucional
```

### Origem / destino

Origem: a barra de endereços. Destino: `renderTelaConvite(convId)`.

### Possíveis falhas

- **F-10 — O identificador é apagado da URL ANTES de ser usado.** A linha
  `window.history.replaceState({}, '', window.location.pathname)` roda **antes** de
  `renderTelaConvite(convId)` (`index.html:7348-7349`). O `convId` sobrevive em memória, mas a URL
  não. Consequência prática: **qualquer recarregamento perde o convite** — puxar a tela para
  baixo, girar o aparelho num navegador que recarrega, o sistema descartar a aba por memória, ou
  simplesmente voltar ao app depois de um tempo. A pessoa cai na porta institucional, que diz
  "solicite um novo convite ao Coordenador" — e o convite dela continua pendente e válido.
  Isto explica o padrão de campo "abri o link, apareceu a tela, sumiu e não voltou mais".
- **F-18 — `parseConviteIdFromUrl()` é código morto.** `initApp` lê `params.get('conv')`
  diretamente. Duas leituras do mesmo parâmetro, uma delas nunca exercida.
- **F-19 — Um convite aberto em modo de teste nunca funciona.** Com `?teste=1` ativo (e ele é
  pegajoso via `sessionStorage`), `fbReadDoc` devolve `null` e a etapa 4 sempre conclui
  "inexistente". Não é defeito — é a barreira funcionando —, mas **impede testar o fluxo de
  entrada de ponta a ponta em ambiente isolado**, o que restringe o método da Fase 2.

---

# ETAPA 4 — IDENTIFICAÇÃO DO CONVITE

### Funções

| Função | Linha | Papel |
|---|---|---|
| `renderTelaConvite(inviteId)` | `index.html:10358` | Tela de entrada |
| `syncFromFirebase()` | `index.html:11267` | Traz a base |
| `fbReadDoc(cfg)` | `index.html:10739` | Única leitura do Firestore |
| `mergeConvites(remota, local)` | `index.html:9992` | Une as duas listas |
| `resolverConvite(a, b)` | `index.html:9884` | Mais recente vence, se a transição valer |
| `getConvite(inviteId)` | `index.html:9947` | **Lê o cache local, não a rede** |
| `telaConviteMensagem(motivo)` | `index.html:10313` | Renderiza a recusa |

### Fluxo real

```
renderTelaConvite
  └─ await syncFromFirebase()          ← retorno IGNORADO
       └─ fbReadDoc  → convites remotos
       └─ saveConvitesLocal(mergeConvites(remotos, locais))
  └─ getConvite(inviteId)              ← lê localStorage, não a rede
  └─ 4 verificações de exibição: existe? versão? status? validade?
```

### Campos consultados

`inv.inviteId` · `inv.versaoConvite` · `inv.status` · `inv.expiraEm` · `inv.funcao` ·
`inv.grupoNum` · `inv.grupoNome` · `inv.paraWa`.

### Origem / destino

Origem: campo `convites` do documento remoto, mesclado ao espelho local
(`localStorage['jdpg_convites_v1']`). Destino: apenas a tela — nada é gravado nesta etapa.

### Possíveis falhas

> ### 🔴 F-01 — Falha de leitura é apresentada como convite inexistente
>
> `syncFromFirebase()` captura toda exceção (`catch(e) { console.warn(...) }`) e devolve `false`.
> **`renderTelaConvite` não olha esse retorno.** Ele segue direto para `getConvite(inviteId)`, que
> lê o **cache local**. Num aparelho que nunca abriu o app, esse cache está vazio.
>
> Resultado: internet oscilando, DNS lento, aparelho em túnel, chave recusada — **tudo** produz
> `inv = null`, que vira `motivo = 'inexistente'`, que renderiza:
>
> > *"Convite indisponível — Este convite não existe ou não está mais disponível. Solicite um novo
> > convite ao Coordenador."*
>
> A mensagem correta existe e está escrita no código (`case 'sem_conexao'`, `index.html:10301`:
> *"Não foi possível validar o convite. Verifique sua internet e abra o link novamente"*) — mas
> **é inalcançável a partir deste caminho**. Ela só é usada quando a falha de rede acontece na
> gravação, na etapa 10.
>
> **Consequência operacional:** todo diagnóstico de "convite indisponível" que começou procurando
> defeito no dado começou no lugar errado. O convite pode estar íntegro e pendente na nuvem — e
> está, na maioria dos casos relatados.

- **F-02 — A verificação de exibição não confere autoridade do emissor.** É deliberado (o
  comentário diz que a autoridade é reconferida no aceite), mas produz uma experiência ruim: a
  pessoa preenche nome e WhatsApp, toca em "Entrar na Jornada" e **só então** descobre que o
  convite é inaceitável. Ver F-06.
- **F-03 — Chave de mensagem inexistente.** A verificação devolve `'versao_incompativel'`
  (`index.html:10371`), mas `mensagemConvite` (`index.html:10293`) só define
  `'versao_anterior'`. Um convite de versão incompatível cai no texto genérico
  "não existe ou não está mais disponível", em vez do texto específico que foi escrito para ele.

---

# ETAPA 5 — IDENTIFICAÇÃO DO USUÁRIO

### Funções

| Função | Linha | Papel |
|---|---|---|
| `getMyMemberId()` | `index.html:9728` | Identidade permanente da pessoa (UUID) |
| `loadMeuGrupo()` | `index.html:9774` | Vínculo em exibição |
| `getGrupoAberto()` | `index.html:9765` | Vínculo escolhido entre os existentes |
| `loadMeusVinculos()` | `index.html:9738` | Todos os vínculos deste aparelho |

### Como o aplicativo decide quem você é

Três fontes independentes, em camadas:

| Camada | Chave de armazenamento | Natureza |
|---|---|---|
| Identidade | `jdpg_member_id_v1` | UUID criado **na primeira vez** que a função é chamada |
| Vínculos | `jdpg_meus_vinculos_v1` | Lista de PGs a que este aparelho pertence |
| Jornada | `amj3` (`ST`) | Nome, XP, estudos, `welcomeDone` |

E dois campos digitados no formulário: `#conv-nome` e `#conv-wa`.

### Origem / destino

Origem: `localStorage` do navegador + formulário. Destino: `ST.userName` é salvo **antes** do
aceite (`index.html:10437`); `memberId` é carimbado no registro do participante na etapa 8.

### Possíveis falhas

- **F-12 — A identidade é do navegador, não da pessoa.** `getMyMemberId()` cria um UUID novo
  sempre que o armazenamento local está vazio. Navegador diferente, perfil diferente, aba
  anônima, limpeza de dados, troca de aparelho, atalho de tela inicial que não compartilha o
  armazenamento do Safari — **cada um desses é uma pessoa nova para o aplicativo**. Toda a
  reentrada depende de a etapa 8 conseguir reconhecer o cadastro antigo por nome + WhatsApp; se
  não conseguir, duplica.
- **F-13 — O campo de WhatsApp vem pré-preenchido com o palpite de quem convidou.**
  `index.html:10395`: `value="${sanitize((inv.paraWa || '').replace(/^55/, ''))}"`. O comentário
  em `confirmarEntradaConvite` afirma que a prova de identidade é sempre o número que a própria
  pessoa digita — mas, se o campo já vem preenchido, a maioria não digita nada. Se quem convidou
  errou o número, **o cadastro nasce com o número errado**, e a recuperação futura por nome +
  WhatsApp (etapa 8) falha para sempre.
- **F-14 — O campo de nome vem pré-preenchido com `ST.userName`.** Em aparelho compartilhado
  (posto de enfermagem, tablet de setor), aparece o nome de quem usou antes. Se a pessoa não
  reparar, entra no PG com o nome de outra.
- **F-20 — `loadMeuGrupo()` tem uma rede de recuperação que devolve um objeto incompleto.**
  Quando vínculos e formato antigo estão vazios mas `ST.grupoNum`/`ST.userName` existem, devolve
  `{grupoNum, grupoNome, nome, recuperadoDeST: true}` — **sem `ts` e sem `wa`**. Esse objeto
  circula pelo resto do app como se fosse um vínculo completo. A consequência aparece na
  etapa 6 (F-15).

---

# ETAPA 6 — VALIDAÇÕES / GUARDS

Esta é a etapa com mais camadas. São **cinco barreiras em série**, em três lugares diferentes.

### 6.1 — Validação de campo (interface)

`confirmarEntradaConvite` — `index.html:10425`

| Regra | Linha |
|---|---|
| nome não vazio | `10430` |
| WhatsApp com ≥ 10 dígitos | `10431` |

> **F-04 — A régua da interface é mais frouxa que a régua do dado.** A tela aceita 10 dígitos
> quaisquer; `normalizarWaBR` (aplicado depois, na etapa 8) recusa DDD < 11, celular de 11 dígitos
> que não comece com 9, e fixo que não comece com 2–5. Quando recusa, **não bloqueia o aceite**:
> devolve `null`, e a etapa 8 grava `wa = ''`.
>
> Consequência em cadeia: com `wa` vazio, `buscarCadastroExistente` retorna `null` de imediato
> (`index.html:12016`: `if (!g || !nome || !waDigitado) return null`). **A recuperação de cadastro
> nunca é tentada** — a pessoa entra como participante novo, o cadastro antigo fica órfão com
> tombstone ou duplicado, e o XP não volta. Tudo isso sem uma única mensagem na tela.

### 6.2 — DB-01: um PG ativo por vez

| Função | Linha |
|---|---|
| `getMeuGrupoAtivo(nome)` | `index.html:11992` |
| `renderTrocaDeGrupoModal(...)` | `index.html:12052` |
| `removerDoGrupoAtual(grupoNum)` | `index.html:11963` |

Regra: colaborador e coordenador só podem estar em 1 PG ativo; tutor é isento
(`index.html:10441`). Se já houver vínculo ativo em outro PG, abre o modal de troca; confirmando,
chama `removerDoGrupoAtual(...)` e **reentra recursivamente** em `confirmarEntradaConvite`.

`getMeuGrupoAtivo` casa por `memberId` **ou** por nome, e — desde `1aafe63` — ignora quem tem
tombstone. Essa correção fechou o laço infinito do "Sim, trocar de grupo".

> **🔴 F-15 — `removerDoGrupoAtual` identifica a pessoa por um campo que pode estar ausente.**
>
> `index.html:11971`: `const pRemovido = g.participantes.find(p => p.ts === meuGrupo.ts);`
>
> Quando `loadMeuGrupo()` devolve o objeto reconstruído de `ST` (F-20), **`meuGrupo.ts` é
> `undefined`**. O `find` então procura o primeiro participante cujo `ts` também seja `undefined`.
> Dois desfechos, ambos ruins:
>
> 1. **Nenhum participante sem `ts`** → `pRemovido` é `undefined`, o tombstone **não é marcado**, e
>    a pessoa continua no PG antigo na nuvem — passando a constar em **dois** PGs.
> 2. **Existe algum participante sem `ts`** (registros criados por rotas antigas, ou importados)
>    → **marca o tombstone na pessoa errada**, removendo silenciosamente um terceiro do grupo.
>
> O mesmo trecho decide a liberação de papéis por `meuGrupo.papel`, que também não existe no
> objeto reconstruído: `if (meuGrupo.papel === 'coordenador') g.coordenador = null` nunca dispara,
> deixando o PG antigo com um coordenador que já saiu.

> **F-21 — Duas gravações concorrentes, nenhuma coordenada.** `removerDoGrupoAtual` chama
> `saveGrupos()` **sem `await`** (`index.html:11980`) e a execução segue imediatamente para
> `confirmarEntradaConvite(inviteId)`, que dispara a gravação do aceite. Ficam duas escritas em
> voo para o mesmo documento. A pré-condição garante que uma delas será recusada e repetida — o
> dado não corrompe —, mas **se a segunda falhar de vez** (rede caiu, guarda disparou, tentativas
> esgotadas), o resultado é a pessoa registrada nos dois PGs, ou removida do antigo sem ter
> entrado no novo. Nenhuma das duas situações produz aviso.

### 6.3 — Autoridade do convite

`validarConviteParaAceite(inv, g, dadosPessoa)` — `index.html:10009`

Ordem das verificações:

| # | Verificação | Motivo devolvido |
|---|---|---|
| 1 | convite existe | `inexistente` |
| 2 | `versaoConvite === 2` | `versao_incompativel` |
| 3 | `status === 'pendente'` | `utilizado` / `cancelado` / `expirado` |
| 4 | não passou de `expiraEm` | `expirado` |
| 5 | grupo existe no remoto | `grupo_inexistente` |
| 6 | autoridade conforme a função | `nao_autorizado_tutor` / `emissor_sem_papel` |

Para `funcao: 'colaborador'`, a autoridade tem duas vias (`index.html:10037-10042`):

```js
const emissor = (g.participantes||[]).find(p => p.memberId === inv.deId);
const papelEmissor = emissor ? (emissor.papel || emissor.tipo) : null;
const emissorViaAdmin = g.coordenador && inv.deNome &&
  String(g.coordenador).trim().toLowerCase() === String(inv.deNome).trim().toLowerCase();
if (papelEmissor !== 'coordenador' && !emissorViaAdmin) return {ok:false, motivo:'emissor_sem_papel'};
```

> ### 🔴 F-06 — Um convite pode ser criado por quem não conseguirá tê-lo aceito
>
> A emissão (etapa 1) e a validação (aqui) usam **réguas de nome diferentes**:
>
> | | Função | Régua |
> |---|---|---|
> | Emissão | `souCoordenadorAdminDoGrupo` → `nomesCorrespondem()` | tolerante: ignora acento, aceita nome curto como prefixo de palavra inteira |
> | Aceite | `validarConviteParaAceite` | **estrita**: `trim().toLowerCase() ===` |
>
> A via administrativa existe exatamente para o Coordenador legítimo **cujo registro de
> participante não tem `papel='coordenador'`** — o caso achado nos PGs 1, 2 e 10 em 14/08. Para
> essa pessoa, `papelEmissor` é `null`, e a única saída é `emissorViaAdmin`, que é a comparação
> estrita.
>
> Então: se essa pessoa se autenticou no Painel com o nome abreviado ou sem acento enquanto
> `g.coordenador` guarda o nome completo e acentuado, `gerarConvite` **aprova** (régua tolerante) e
> `validarConviteParaAceite` **recusa** (régua estrita). O convite é criado, gravado, enviado — e
> é impossível de aceitar. Quem recebe vê:
>
> > *"Convite indisponível — Quem enviou este convite não é mais responsável pelo grupo."*
>
> O texto acusa o emissor de ter perdido o cargo. Ele não perdeu; a comparação é que é diferente
> dos dois lados. Um convite novo, emitido do mesmo jeito, terá exatamente o mesmo destino.
>
> **Esta é a assimetria que a correção RC-REST-02 de 26/08 deixou passar.** O comentário no código
> (`index.html:10093-10099`) diz que o ajuste de 04/08 "arrumou os botões e esqueceu estas duas
> funções — que são justamente a autoridade de verdade". A correção então alcançou
> `souTutorAdminDoGrupo` e `souCoordenadorAdminDoGrupo`, mas **não alcançou
> `validarConviteParaAceite`**, que é a autoridade do outro lado do convite.

### 6.4 — Contrato de gravação

`validarIntencao(intencao)` — `index.html:10939`

Operações aceitas: `grupos` · `convite-criar` · `convite-revogar` · `convite-aceitar` ·
`init-nuvem`. Campos de topo aceitos: `dados` · `tutores` · `convites` · `setoresMestre` ·
`setoresEfetivo` · `embaixadoresExternos`. Chave fora da lista é recusada.

### 6.5 — Guardas de conteúdo

`validarPayloadDados(lista)` — `index.html:10985`. Valem para qualquer rota que declare `dados`,
**incluindo o aceite de convite**, que até a E1 não passava por nenhuma.

| Guarda | Impede | Motivo devolvido |
|---|---|---|
| G1 | PG já visto na nuvem sair do payload | `guarda` / `perda` |
| G2 | PG voltar vazio depois de ter conteúdo | `guarda` / `esvaziamento` |
| G4 | Colisão de criação entre aparelhos | `slot_ocupado` |
| G3 | Slot ou `pgId` duplicado | `guarda` / `invariantes` |
| G6 | App mais antigo que o schema da nuvem | `app_desatualizado` |
| Tamanho | `dados` acima de 480 000 bytes | `tamanho` |

---

# ETAPA 7 — ACEITE

### Funções

`aceitarConvite(inviteId, dadosPessoa)` — `index.html:10172`, executada **dentro** de
`commitConviteChange` — `index.html:10053`.

### Como o laço funciona

```
para tentativa de 1 a 4:
    remote = await fbReadDoc(cfg)          ← releitura fresca a CADA volta
    built  = construir(remote)             ← monta em memória, não toca estado global
    se built.rejeitar → devolve a recusa
    w = await fbWriteGrupos(cfg, {...})    ← PATCH com pré-condição
    se w.ok → aplica no local e devolve
    se w.preconditionFailed → espera 80-200 ms e repete   ← silencioso, é o normal
```

Três decisões de desenho que merecem registro por estarem **corretas**: nada do estado local muda
antes da confirmação do servidor; conflito de concorrência é tratado como resultado normal, não
como erro; e cada tentativa relê o remoto, nunca reaproveita um retrato velho.

### Possíveis falhas

> ### 🔴 F-22 — Quatro motivos de falha distintos exibem a mesma mensagem errada
>
> `commitConviteChange` pode devolver 9 motivos. `mensagemConvite` (`index.html:10293`) trata 5.
> Os outros **4 caem no `default`**:
>
> | Motivo | O que aconteceu de verdade | O que a pessoa lê |
> |---|---|---|
> | `conflito` | 4 tentativas esgotadas por concorrência | "Este convite não existe ou não está mais disponível" |
> | `erro` | Resposta inesperada do servidor | idem |
> | `sem_config` | Configuração do Firebase ausente | idem |
> | `tamanho` | Documento excedeu o limite | idem |
>
> Somando com F-01 e F-03, **pelo menos sete causas diferentes produzem o mesmo texto na tela** —
> e esse texto orienta a pessoa a pedir um convite novo, o que em nenhum desses sete casos
> resolve. É a razão pela qual "Convite indisponível" nunca foi diagnosticável em campo.
>
> Contraste: a rota de **emissão** (`gerarECompartilhar`, `index.html:10486-10492`) tem um mapa de
> mensagens que cobre `conflito` explicitamente. A rota de **aceite** não recebeu o mesmo cuidado.

---

# ETAPA 8 — CRIAÇÃO / ATUALIZAÇÃO DO PARTICIPANTE

### Funções

| Função | Linha |
|---|---|
| bloco de participante em `aceitarConvite` | `index.html:10193-10217` |
| `buscarCadastroExistente(g, nome, waDigitado)` | `index.html:12012` |
| `funcaoParaTipo(funcao)` | `index.html:9989` |
| `normalizarWaBR(valor)` | `index.html:9900` |

### Três caminhos possíveis

```
p = participantes.find(x => x.memberId === memberId)

├─ ENCONTROU          → atualiza nome, tipo, papel        (mesmo aparelho, já era membro)
└─ NÃO ENCONTROU
   ├─ buscarCadastroExistente(g, nome, wa) achou
   │                  → RECUPERA: adota o memberId novo   (aparelho novo, IDENT-01)
   └─ não achou       → CRIA participante novo            (entrada legítima… ou duplicata)
```

### Campos gravados no participante

`nome` · `wa` · `tipo` · `papel` · `departamento` · `dataInscricao` · `ts` · `memberId`
(e `progresso`, preservado quando recuperado).

### A régua de reconhecimento

`buscarCadastroExistente` exige **nome E WhatsApp** — nunca só um dos dois:

```js
if (pNome !== nomeNorm || !pWa) return false;                  // nome: igualdade ESTRITA
return pWa === waNorm || pWa.endsWith(waNorm) || waNorm.endsWith(pWa);   // wa: tolerante
```

### Possíveis falhas

> **F-11-A — O nome é comparado com igualdade estrita, o WhatsApp com tolerância.** É o inverso do
> que a realidade pede. Um nome digitado como "Maria Silva" não casa com "Maria Aparecida Silva"
> gravado; nem "José" com "Jose". **Não há `nomesCorrespondem()` aqui** — a função tolerante que
> o app já possui e usa em outros lugares. Resultado: cadastro duplicado, XP não recuperado, e a
> pessoa aparece duas vezes no PG. É o mecanismo por trás dos casos de duplicidade já corrigidos
> à mão nos PGs 4, 17, 24 e 37.

- **F-11-B — A tolerância do WhatsApp pode casar demais.** `endsWith` nas duas direções: um
  registro antigo com `wa` curto ou truncado pode ser sufixo do número de outra pessoa. Com nome
  idêntico exigido, o risco é baixo — mas é real em nomes comuns dentro do mesmo PG.
- **F-11-C — O WhatsApp nunca é atualizado.** Nos três caminhos, `p.wa` só é escrito na criação.
  Quem trocou de número fica com o antigo gravado para sempre, e cada reentrada futura por
  aparelho novo falha em reconhecê-lo.

> ### 🔴 F-23 — A recuperação sobrescreve o progresso local sem comparar
>
> `index.html:10245-10249`:
> ```js
> ST.xp     = progressoRecuperado.xp || 0;
> ST.streak = progressoRecuperado.streak || 0;
> ST.done   = Array.from({length: progressoRecuperado.estudosConcluidos || 0}, (_, i) => i);
> ```
>
> Três problemas em três linhas:
> 1. **Atribuição, não comparação.** Se o aparelho tinha mais XP do que a nuvem, o excedente é
>    perdido. Este é o defeito já catalogado como R-01 na Fase 0 — aqui estão as linhas exatas.
> 2. **`|| 0` transforma ausência em zero.** Um `progresso` sem `xp` zera o XP de quem estava
>    recuperando o cadastro.
> 3. **`ST.done` é reconstruído como os N primeiros estudos.** Quem concluiu os estudos 3, 7 e 9
>    passa a constar como tendo concluído 0, 1 e 2. A **quantidade** é preservada; **quais** não.
>    A tela seguinte ainda anuncia "Seu progresso foi restaurado neste aparelho".

---

# ETAPA 9 — ASSOCIAÇÃO AO PG

### Funções

Bloco em `aceitarConvite` — `index.html:10218-10221` · `atualizarStatusPg(g)` —
`index.html:9338` · `participantesAtivos(g)` — `index.html:9659`.

### Regras

```js
if (inv.funcao === 'coordenador' && !g.coordenador) g.coordenador = p.nome;
if (inv.funcao === 'tutor'       && !g.tutor)       g.tutor       = p.nome;
atualizarStatusPg(g);   // LIVRE | EM_FORMACAO | ATIVO
```

### Possíveis falhas

> ### 🔴 F-24 — Aceitar um convite de Coordenador não torna a pessoa Coordenadora do PG
>
> A atribuição é condicionada a `!g.coordenador`. **Se o PG já tem um nome no campo, nada é
> escrito.** A pessoa que aceitou recebe `papel = 'coordenador'` no seu registro individual, mas
> `g.coordenador` continua nomeando a pessoa anterior.
>
> A partir daí, as duas passam nas verificações de autoridade — a nova pelo `papel` do registro,
> a antiga pelo campo `g.coordenador` (e, como o `papel` da antiga também não é limpo na troca —
> risco R-05 da Fase 0 —, ela passa por duas vias). **O PG fica com dois coordenadores ativos e
> nenhum aviso.**
>
> Isto incide diretamente sobre a operação em curso no PG 10: o roteiro combinado é
> *convidar → aceitar → "Trocar Coordenador"*. O passo do aceite **não** transfere a coordenação;
> quem transfere é o botão de troca, que precisa ser usado depois. Se ele não for usado, o PG fica
> exatamente na situação descrita acima.

- **F-25 — `atualizarStatusPg` grava `status` em produção a cada aceite**, embora
  `pgStatusFiltros` esteja desligada e o campo esteja reconhecidamente desatualizado em 5 PGs
  reais (risco R-06 da Fase 0). Não é falha de entrada, mas é uma escrita silenciosa em um campo
  que se sabe inconsistente.

---

# ETAPA 10 — PERSISTÊNCIA

### Funções

`fbWriteGrupos(cfg, intencao)` — `index.html:11024`, **único ponto do aplicativo que faz PATCH no
Firestore**. Todas as rotas de gravação desembocam nele.

### Payload do aceite

| Campo | Conteúdo |
|---|---|
| `dados` | lista completa de PGs (cópia do remoto + a alteração) |
| `convites` | lista de convites com o aceito marcado `utilizado` |
| `ts` | carimbo de tempo |

Enviado via `PATCH` com `updateMask.fieldPaths` para **cada** campo declarado — sem a máscara, o
Firestore substituiria o documento inteiro e apagaria os campos omitidos (foi o defeito que zerou
`tutores` em 10/07 e 13/07). Mais `currentDocument.updateTime` como pré-condição otimista.

### `aplicarLocal()` — só executa depois do `ok` do servidor

| Ação | Linha | Destino |
|---|---|---|
| `applyGruposData(dados)` | `index.html:11147` | `PEQUENOS_GRUPOS` |
| `saveConvitesLocal(convitesNovos)` | `index.html:9938` | `jdpg_convites_v1` |
| `upsertVinculo(vinculo)` | `index.html:9747` | `jdpg_meus_vinculos_v1` |
| `setGrupoAberto(g.num)` | `index.html:9762` | `ST.grupoAberto` |
| restauração de XP | `index.html:10245` | `ST` |
| gravação da lista | `index.html:10253` | `GRUPOS_KEY` |

### Possíveis falhas

> ### 🔴 F-26 — `applyGruposData` elimina participantes de nome repetido
>
> `index.html:11159`:
> ```js
> PEQUENOS_GRUPOS[idx].participantes = partic.filter((p, i, arr) =>
>   arr.findIndex(x => (x.nome||'').trim().toLowerCase() === (p.nome||'').trim().toLowerCase()) === i);
> ```
>
> Isto é uma **deduplicação por nome** que mantém apenas a primeira ocorrência. Efeitos:
>
> 1. **Dois homônimos reais no mesmo PG** — comum em hospital com centenas de funcionários — e um
>    dos dois **desaparece da tela** deste aparelho.
> 2. **Todos os registros sem nome colidem entre si** (`(x.nome||'')` iguala todos em `''`):
>    sobrevive um só.
> 3. O filtro atua sobre `PEQUENOS_GRUPOS`, que é a fonte de qualquer gravação futura deste
>    aparelho. **A eliminação pode ser propagada de volta para a nuvem** na próxima operação que
>    declare `dados`.
>
> As guardas G1–G4 não impedem isso: elas vigiam PGs perdidos, PGs esvaziados e invariantes de
> slot — **não** a perda de um participante dentro de um PG que continua povoado.

- **F-27 — A guarda de tamanho vigia só `dados`.** O limite de 480 000 bytes é aplicado
  exclusivamente a `dados` (`index.html:11066`). `convites` não é medido — e, como mostra a
  próxima seção, `convites` é hoje o **maior** campo do documento.

---

# ETAPA 11 — CONFIRMAÇÃO AO USUÁRIO

### Funções

`confirmarEntradaConvite` — ramo de sucesso, `index.html:10456-10469` ·
`renderIdentidadeRecuperadaModal(aoContinuar)` — `index.html:12030` ·
`telaConviteMensagem(motivo)` — `index.html:10313`.

### Sucesso

```js
window.history.replaceState({}, '', window.location.pathname);
ST.welcomeDone = true;  ST.grupoNum = res.grupoNum;  save(ST);
res.recuperado ? renderIdentidadeRecuperadaModal(...) : showScreen('home');
```

Há dois desfechos distintos, e a distinção é boa: quem foi **recuperado** vê um aviso honesto de
que o Diário Privado e o histórico visual de missões não voltam.

### Possíveis falhas

- **F-28 — Não há confirmação de qual PG a pessoa entrou.** No caminho normal, vai direto para a
  home. Quem entrou no PG errado (link trocado, convite reencaminhado) não recebe nenhum sinal.
- **F-29 — O aviso de recuperação promete mais do que entrega.** "Seu progresso foi restaurado
  neste aparelho" é exibido mesmo quando o progresso local era maior e foi sobrescrito (F-23), e
  mesmo quando a lista de estudos concluídos foi reconstruída errada.

---

# Achados sobre o estado de produção

Levantados por leitura agregada do instantâneo da Fase 0 (31/08, 06:51). **Sem dados pessoais.**

## Tamanho por campo no documento

| Campo | Bytes no envelope da API | Participação |
|---|---|---|
| **`convites`** | **221 807** | **54,2 %** |
| `dados` (todos os 70 PGs) | 183 374 | 44,8 % |
| `setoresEfetivo` | 2 524 | 0,6 % |
| `setoresMestre` | 756 | 0,2 % |
| `tutores` | 272 | 0,1 % |
| **Total** | **409 130** | |

**O registro de convites ocupa mais espaço do que todos os Pequenos Grupos somados.** O limite de
um documento do Firestore é 1 MiB. O valor real armazenado é algo menor que o envelope acima (a
representação JSON escapa aspas), mas a proporção entre os campos é a medida.

## Convites por estado

| Estado | Quantidade |
|---|---|
| pendente | 90 |
| utilizado | 207 |
| cancelado | 195 |
| **expirado** | **0** |

> ### 🔴 F-30 — A função que expira convites nunca é chamada
>
> `expirarConvitesVencidos()` está definida em `index.html:9955` e **não tem nenhum chamador em
> todo o arquivo** (verificado por varredura). É código morto.
>
> Consequência em cadeia:
> 1. Nenhum convite pendente vencido é promovido a `expirado` — daí os **0 expirados** em
>    produção, com 90 pendentes acumulados.
> 2. `podarConvites` (`index.html:10003`) só remove convites em estado **terminal**
>    (`utilizado`/`cancelado`/`expirado`) com mais de 30 dias. Um pendente **nunca** entra nesse
>    conjunto.
> 3. Logo: **convite pendente jamais é removido do documento.** Cresce para sempre.
>
> Isto liga um comportamento conhecido (a limpeza manual de 136 pendentes vencidos em 26/08) à
> sua causa no código. Aquela limpeza não foi uma escolha operacional — foi o suprimento manual
> de uma rotina automática que existe e nunca roda.
>
> Vale registrar que, mesmo com a função morta, **um convite vencido não é aceito**: as duas
> verificações de validade (`index.html:10012` e `10372`) comparam `expiraEm` com o relógio
> diretamente. O defeito é de acúmulo, não de segurança.

---

# Catálogo consolidado dos pontos de falha

Severidade: **A** = provoca perda de dado ou entrada impossível · **B** = provoca diagnóstico
errado ou duplicação · **C** = incômodo ou risco latente.

| # | Etapa | Ponto de falha | Sev. |
|---|---|---|---|
| F-01 | 4 | Falha de leitura é exibida como "convite não existe"; a mensagem correta é inalcançável | **A** |
| F-02 | 4 | Autoridade do emissor só é conferida depois de preencher o formulário | C |
| F-03 | 4 | `versao_incompativel` não tem mensagem; cai no texto genérico | C |
| F-04 | 6 | Régua de WhatsApp da tela é mais frouxa que a do dado; recusa silenciosa grava `wa=''` | **A** |
| F-05 | 1 | Emissão e aceite usam réguas de nome diferentes | **A** |
| F-06 | 6 | Convite criado por quem não conseguirá tê-lo aceito (consequência de F-05) | **A** |
| F-07 | 2 | Identificador de 36 caracteres pode ser truncado pelo mensageiro | B |
| F-08 | 2 | `APP_URL` deriva da URL do emissor; link pode apontar para fora da produção | C |
| F-09 | 2 | Abertura do WhatsApp falha depois de o convite já estar gravado | B |
| F-10 | 3 | O identificador é apagado da URL antes do uso; recarregar perde o convite | **A** |
| F-11 | 8 | Reconhecimento por nome estrito e WhatsApp tolerante; sem atualização do número | **A** |
| F-12 | 5 | Identidade é do navegador, não da pessoa | **A** |
| F-13 | 5 | Campo de WhatsApp pré-preenchido com o palpite de quem convidou | **A** |
| F-14 | 5 | Campo de nome pré-preenchido com o usuário anterior do aparelho | B |
| F-15 | 6 | Remoção do PG antigo identifica a pessoa por `ts` que pode ser `undefined` | **A** |
| F-16 | 1 | `grupoNome` congelado no convite no momento da emissão | C |
| F-17 | 1 | `paraWa` do emissor vira semente da identidade do convidado | B |
| F-18 | 3 | `parseConviteIdFromUrl()` é código morto | C |
| F-19 | 3 | Fluxo de entrada não é testável de ponta a ponta em modo isolado | C |
| F-20 | 5 | `loadMeuGrupo()` devolve objeto sem `ts`/`wa`/`papel` no caminho de recuperação | **A** |
| F-21 | 6 | Duas gravações concorrentes sem coordenação na troca de grupo | B |
| F-22 | 7 | Quatro motivos de falha exibem a mesma mensagem enganosa | **A** |
| F-23 | 8 | Recuperação sobrescreve XP local e reconstrói a lista de estudos errada | **A** |
| F-24 | 9 | Aceitar convite de Coordenador não define `g.coordenador` se já houver um | **A** |
| F-25 | 9 | Aceite grava `status` em campo reconhecidamente inconsistente | C |
| F-26 | 10 | `applyGruposData` deduplica participantes por nome e pode propagar a perda | **A** |
| F-27 | 10 | Guarda de tamanho não cobre `convites`, hoje o maior campo | B |
| F-28 | 11 | Não há confirmação de qual PG a pessoa entrou | C |
| F-29 | 11 | Aviso de recuperação promete progresso restaurado que pode ter sido perdido | B |
| F-30 | — | `expirarConvitesVencidos()` nunca é chamada; pendentes nunca são podados | **A** |

**12 de severidade A · 7 de severidade B · 9 de severidade C** (F-11 conta uma vez).

---

# Observações transversais

### 1. O núcleo é sólido; as bordas é que falham

`commitConviteChange` e `fbWriteGrupos` são código cuidadoso: pré-condição otimista, releitura a
cada tentativa, estado local intocado até a confirmação, contrato de campos, seis guardas. **Não
foi encontrado nenhum defeito no núcleo de gravação.** Todos os 12 achados de severidade A estão
em: identidade (5), mensagens ao usuário (2), comparação de nomes (2), ciclo de vida do convite
(2), aplicação do dado lido (1).

### 2. O aplicativo tem três réguas diferentes para "é a mesma pessoa?"

| Régua | Onde | Comportamento |
|---|---|---|
| `nomesCorrespondem()` | botões, autoridade administrativa | tolerante (acento, nome curto) |
| `trim().toLowerCase() ===` | `validarConviteParaAceite`, `buscarCadastroExistente`, `getMeuGrupoAtivo` | estrita |
| `memberId ===` | caminho preferencial em todas | exata, mas frágil (F-12) |

Elas discordam entre si. F-06 e F-11 são a mesma doença em dois órgãos diferentes.

### 3. "Convite indisponível" é uma mensagem sobrecarregada

Sete causas distintas — sem internet, versão incompatível, grupo inexistente, conflito esgotado,
erro de servidor, configuração ausente, documento grande demais — renderizam o mesmo texto, que
orienta a pedir um convite novo. **Em nenhuma das sete um convite novo resolve.**

### 4. O convite tem ciclo de vida incompleto

Nasce (`gerarConvite`), é usado (`aceitarConvite`) e pode ser cancelado (`revogarConvite`). Mas
**não envelhece**: a transição para `expirado` está escrita e nunca é executada. O ciclo de vida
que a máquina de estados descreve não é o que roda.

---

# Limites desta fase

O que a Fase 1 **não** fez, e portanto não pode afirmar:

- **Não executou o aplicativo.** Todos os achados vêm de leitura de código e de leitura agregada
  do documento. Nenhum foi reproduzido em execução.
- **Não conferiu as regras do Firestore** contra o payload de aceite. A allowlist da regra é um
  ponto de falha conhecido (403 mascarado de "sem conexão") e fica para a fase seguinte.
- **Não mediu frequência.** O catálogo diz o que *pode* falhar, não quantas pessoas foram
  atingidas por cada item.
- **Não avaliou o caminho de reentrada por Painel** (Tutor/Coordenador entrando pelo `?tutor`),
  que é uma porta distinta da auditada aqui.
- **Não tocou em nada.** Nenhum arquivo do aplicativo foi alterado; nenhuma escrita foi feita em
  produção.

## Sugestão de recorte para a Fase 2

Os achados A se agrupam naturalmente em quatro blocos, que podem ser investigados de forma
independente:

| Bloco | Achados | Pergunta a responder |
|---|---|---|
| **Mensagens** | F-01, F-03, F-22 | Quantos "Convite indisponível" de campo eram, na verdade, falha de leitura? |
| **Identidade** | F-04, F-11, F-12, F-13, F-23 | Quantos cadastros duplicados existem hoje e por qual das causas? |
| **Autoridade** | F-05, F-06, F-24 | Existe hoje algum convite pendente impossível de aceitar? Quantos PGs têm coordenação ambígua? |
| **Ciclo de vida** | F-10, F-15, F-20, F-21, F-26, F-30 | O que já foi perdido de fato — e o documento está crescendo rumo ao limite? |

O bloco **Autoridade** é o mais urgente: ele é verificável **sobre o instantâneo já capturado**,
sem tocar em produção, e responde a uma pergunta operacional imediata sobre os convites pendentes
que estão hoje nas mãos das pessoas.
