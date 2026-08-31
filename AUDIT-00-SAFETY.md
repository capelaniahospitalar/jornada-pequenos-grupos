# AUDIT-00-SAFETY — Trava de segurança e preservação

**Auditoria:** Falhas de entrada / reentrada no aplicativo
**Fase:** 0 — Trava de segurança e preservação
**Data de execução:** 2026-08-31
**Executor:** assistente (Claude), sob supervisão do responsável pelo projeto
**Status da fase:** ✅ concluída — nenhuma escrita realizada

> Este documento é o registro imutável do estado do sistema **no instante em que a auditoria
> começou**. Qualquer achado das fases seguintes refere-se a este estado, e qualquer reversão
> tem este documento como destino.

---

## 1. Commit auditado

| Item | Valor |
|---|---|
| Repositório | `capelaniahospitalar/jornada-pequenos-grupos` (confirmado por `git remote -v`) |
| Branch | `main` |
| Commit (SHA completo) | `1aafe6358557f800e58e2617394224f6f50e6a1e` |
| Commit (curto) | `1aafe63` |
| Mensagem | `Update index.html` |
| Autor | Capelania HAS |
| Data do commit | 2026-08-28 12:57:02 -03:00 |
| `main` vs `origin/main` | **idênticos** — 0 à frente, 0 atrás |

**Conteúdo funcional deste commit:** correção de `getMeuGrupoAtivo` — participante removido de um
PG voltava a ser considerado membro dele e ficava impedido de entrar em outro grupo. É, por si só,
uma correção de *reentrada*, e portanto faz parte do objeto desta auditoria.

### 1.1 Prova de que o commit auditado é o que está no ar

O GitHub Pages serve diretamente da `main`, logo o commit auditado deveria ser o publicado. Isso
foi **verificado**, não presumido:

| Origem | SHA-256 do `index.html` |
|---|---|
| Commit `1aafe63` (`git show`) | `470d1473655ac85c4d12316bbe089ecb3a89aea8845c226f7304ce30706664f1` |
| Baixado de `capelaniahospitalar.github.io` (HTTP 200, 892 592 bytes) | `470d1473655ac85c4d12316bbe089ecb3a89aea8845c226f7304ce30706664f1` |

**Conclusão: o que está publicado é byte a byte o commit auditado.** Não há divergência entre
repositório e produção, e nenhum resultado desta auditoria pode ser atribuído a cache de
publicação do servidor.

### 1.2 Observação sobre a cópia local

A cópia no disco deste PC tem SHA-256 diferente
(`48eace9a4dd5a19d3344ba0f91c25d08f463b091b7cd6a0129f7d8e18f9c40a6`) e 906 850 bytes.
**Isto não é uma alteração.** A diferença é exclusivamente de fim de linha: o Git está com
`core.autocrlf=true` e grava CRLF no disco do Windows. Prova:

- normalizando CRLF para LF, os dois arquivos produzem **o mesmo** SHA-256 `470d1473…`;
- ambos têm exatamente **14 258 linhas**;
- a diferença de tamanho é de **14 258 bytes** — exatamente 1 byte (`CR`) por linha.

Consequência prática para as fases seguintes: **comparar arquivos por hash bruto entre disco e
nuvem produzirá falso positivo.** Toda comparação deve normalizar fim de linha antes.

---

## 2. Versão do aplicativo

| Item | Valor |
|---|---|
| `APP_VERSION.version` | `1.2.0-rc1` |
| `APP_VERSION.build` | `2026-08-21` |
| `APP_VERSION.schema` / `SCHEMA_VERSION` | `2` |
| Título da página | Jornada Discipular em Pequenos Grupos |
| Nome instalável (`manifest.json`) | PEQUENO GRUPO SILVESTRE |

### 2.1 ⚠️ Achado de fase 0 — o carimbo de versão não corresponde ao código publicado

`APP_VERSION` declara build de **2026-08-21**, mas o código publicado é de **2026-08-28** e
contém correções posteriores àquela data. **O carimbo de versão não foi atualizado nos commits
seguintes.**

Por que isso importa para esta auditoria em particular: quase toda falha de entrada/reentrada
relatada até hoje teve como suspeito de primeira linha *"o aparelho está com uma versão antiga em
cache"*. Com o carimbo congelado, **é impossível distinguir pela tela um aparelho atualizado de um
aparelho desatualizado** — o app de 21/08 e o de 28/08 se apresentam com o mesmo número. Esta é a
pendência já catalogada como **M1 (versão invisível na tela)**.

Registrado aqui como **achado**, não corrigido. Correção exige alteração de código de produção,
proibida nesta fase.

### 2.2 Chaves de funcionalidade (`FB_FLAGS`) no estado auditado

| Flag | Estado | Relevância para entrada/reentrada |
|---|---|---|
| `identidadeUuid` | `true` | **Alta** — `memberId` UUID e "Meus Vínculos" governam quem o app entende que você é |
| `convitesV2` | `true` | **Alta** — convite de uso único é a porta de entrada auditada |
| `useTombstone` | `true` | **Alta** — remoção transitória; é o mecanismo que barra a reentrada |
| `usePrecondition` | `true` | Média — gravação otimista por `updateTime` |
| `retryOnReconnect` | `true` | Média — nova tentativa ao voltar a internet |
| `debounceMs` | `400` | Média |
| `imdV2` | `true` | Baixa — indicador, não afeta entrada |
| `pgStatusFiltros` | `false` | Contexto — desligada de propósito (ver risco R-06) |
| `schemaVersionWrite` | `false` | Contexto — desligada de propósito (ver risco R-07) |

---

## 3. Ambiente da auditoria

| Item | Valor |
|---|---|
| Máquina | PC de trabalho (Windows 10 Pro 19045) |
| Pasta de trabalho | `Documents\GitHub\jornada-pequenos-grupos` — pasta correta deste produto |
| Interpretadores disponíveis | PowerShell 5.1, Git Bash. **Sem Node, sem Python** |
| Modo de execução das fases seguintes | análise estática + servidor local (`HttpListener`, porta 8099) + `?teste=1` |
| Acesso à nuvem nesta fase | **somente leitura** (uma única requisição `GET`) |

Confirmado que **não** se está trabalhando em `_ANTIGO-pequenos-grupos` nem em qualquer pasta de
outro produto.

---

## 4. Árvore de trabalho

Antes de iniciar, `git status --porcelain --untracked-files=all` retornou **saída vazia**:

- nenhum arquivo modificado;
- nenhum arquivo preparado (*staged*);
- nenhum arquivo não rastreado;
- nenhuma alteração pendente de sessão anterior.

**A árvore estava limpa.** A única alteração introduzida por esta fase é a criação deste próprio
documento (`AUDIT-00-SAFETY.md`), que nasce **não rastreado e não commitado**.

---

## 5. Ponto de restauração

Criado **antes** de qualquer outra ação. Três camadas independentes:

### 5.1 Marcador no histórico do Git (código)

```
tag  : audit-entrada-2026-08-31
tipo : anotada
alvo : 1aafe6358557f800e58e2617394224f6f50e6a1e
```

A tag é **local**. Não foi enviada ao GitHub — enviar é ação externa e depende de autorização
explícita. Para voltar o código exatamente ao estado auditado:

```bash
git checkout audit-entrada-2026-08-31 -- index.html embaixadores-agosto.html firestore.rules manifest.json
```

### 5.2 Cópias byte a byte dos fontes

Extraídas do commit (não do disco, para não carregar o CRLF local):

| Arquivo | SHA-256 (16 primeiros) |
|---|---|
| `index.html.baseline` | `470d1473655ac85c` |
| `embaixadores-agosto.html.baseline` | `b6b7c9089088cc48` |
| `firestore.rules.baseline` | `1fd66c07c2428677` |
| `manifest.json.baseline` | `18066e8376c608f9` |

### 5.3 Instantâneo dos dados de produção

**Esta é a camada mais importante**, porque o projeto está no plano Spark do Firebase: **não há
PITR nem backup automático**. Sem este arquivo, um dado perdido é perdido em definitivo.

| Item | Valor |
|---|---|
| Método HTTP | `GET` (leitura pura — nenhum `PATCH`, nenhum `POST`) |
| Resposta | HTTP 200, 409 130 bytes |
| `createTime` do documento | 2026-06-25T20:30:07Z |
| `updateTime` no momento da leitura | **2026-08-31T09:51:54Z** (06:51 de Brasília) |
| SHA-256 do instantâneo | `8a4a7a8190ed88ab8d9df1def8c410839fc827a8570c4c2a4cd1ab6cb8183af9` |

**Localização: fora do repositório**, no scratchpad desta sessão
(`C:\Temp\claude\...\scratchpad\AUDIT-BASELINE\firestore-grupos-2026-08-31.json`).
Está fora de propósito: o arquivo contém nome e WhatsApp de pessoas reais e **este repositório é
público**. Ele não deve, em nenhuma hipótese, ser movido para dentro da pasta do projeto.

---

## 6. Estado do Firebase no início da auditoria

Retrato agregado, deliberadamente **sem qualquer dado pessoal**:

| Medida | Valor |
|---|---|
| Projeto | `jornada-pequenos-grupos` |
| Documento único | `jdpg/grupos` |
| Slots de PG presentes | 70 |
| Ocorrências do campo `memberId` | 279 |
| Registros com marca de remoção (`removed`) | 21 |
| Convites presentes (campo `expiraEm`) | 492 |
| Campos de topo | `dados`, `convites`, `tutores`, `setoresMestre`, `setoresEfetivo`, `ts` |
| Tamanho do envelope JSON | 409 130 bytes |
| Plano | Spark — sem PITR, sem backup automático |
| Autenticação | **nenhuma** — regras do Firestore são a única barreira |

### 6.1 ⚠️ Produção é um alvo em movimento

O documento havia sido escrito às **06:51 da manhã de hoje**, poucas horas antes desta leitura,
por um aparelho real em campo. O aplicativo está em uso ativo durante a auditoria.

Duas consequências, que valem como regra para todas as fases seguintes:

1. **Nenhum achado pode se apoiar em "o dado estava assim ontem".** Toda afirmação sobre produção
   precisa ser reancorada no momento em que for feita.
2. **O instantâneo da seção 5.3 envelhece.** Ele restaura o estado de 31/08 às ~06:51 — restaurá-lo
   integralmente mais tarde apagaria o trabalho feito pelos participantes no intervalo. Serve como
   referência e como fonte de restauração **seletiva** (um grupo, um participante), nunca como
   sobrescrita em bloco.

---

## 7. Riscos conhecidos que incidem sobre esta auditoria

Defeitos e armadilhas **já catalogados** antes desta auditoria começar, que afetam entrada e
reentrada. Estão aqui para que nenhum deles seja "descoberto" adiante como se fosse novidade, e
para que nenhum seja confundido com um efeito da própria auditoria.

| # | Risco | Situação |
|---|---|---|
| R-01 | O fluxo de recuperação de vínculo sobrescreve o progresso local: quem tem mais no aparelho do que na nuvem perde o excedente ao "pedir um convite novo" | **Não corrigido** — ativo em produção |
| R-02 | Sincronização sem pendência local: slot vazio na nuvem **apaga** o grupo no aparelho. Orientar alguém a "abrir o app para ressincronizar" nesse estado destrói dado | **Não corrigido** — mitigado apenas por procedimento |
| R-03 | Aparelho com versão antiga em cache não conhece slots acima do limite que ele compilou; o botão do Painel some e o app parece quebrado | Mitigado no código; remédio real é furar o cache |
| R-04 | O botão "Convidar Coordenador" desaparece quando já existe um coordenador — coordenador que perde o vínculo não consegue voltar | **Não corrigido**; contorno é "Trocar Coordenador" |
| R-05 | Após troca de coordenador, o campo `papel` do anterior não é limpo: duas pessoas ficam com poderes no Painel | **Não corrigido** |
| R-06 | `pgStatusFiltros` está desligada porque há PGs reais marcados como LIVRE. Ligá-la sem corrigir os dados sobrescreveria grupo com gente dentro | Desligada de propósito — **não ligar durante a auditoria** |
| R-07 | `schemaVersionWrite` está desligada porque a regra do Firestore em produção ainda não tem `schemaVersion` na allowlist; campo fora da allowlist derruba a gravação inteira com 403 | Desligada de propósito — **não ligar durante a auditoria** |
| R-08 | A correção pronta da regra M2 no repositório, se publicada, **bloquearia todas as gravações a partir da segunda** | Escrita mas **não publicada** — não publicar |
| R-09 | Convite pode chegar truncado pelo WhatsApp (o identificador tem 36 caracteres), produzindo "Convite indisponível" sem que exista defeito de dado | Ativo — causa externa ao app |
| R-10 | Atalho de tela inicial no iPhone perde o vínculo do participante | Ativo — mitigado por orientação (link salvo) |
| R-11 | Registro com tombstone permanece no documento. Contagem que não filtre `removed` gera duplicidade falsa e infla totais | Comportamento por desenho — erro de análise, não do app |
| R-12 | Não há Firebase Auth. Qualquer pessoa com a URL e a chave pública pode gravar dentro do que as regras permitem | Estrutural — fora do escopo desta auditoria |

---

## 8. Confirmação de conformidade com a trava de segurança

Cada exigência da Fase 0, com o que efetivamente foi feito:

| # | Exigência | Cumprimento |
|---|---|---|
| 1 | Confirmar branch/commit publicado | ✅ `main` @ `1aafe63`, **provado por hash** contra o GitHub Pages (§1.1) |
| 2 | Confirmar versão publicada | ✅ `1.2.0-rc1` / build `2026-08-21` — com achado de divergência (§2.1) |
| 3 | Confirmar árvore limpa | ✅ `porcelain` vazio antes de qualquer ação (§4) |
| 4 | Criar ponto de restauração | ✅ tag local + cópias byte a byte + instantâneo dos dados (§5) |
| 5 | Não alterar código de produção | ✅ **nenhum** arquivo do app foi editado |
| 6 | Não executar função que escreva no Firebase | ✅ **nenhuma função do app foi executada**; o único acesso à nuvem foi uma requisição `GET` feita por fora do aplicativo |
| 7 | Não migrar dados | ✅ nenhuma migração |
| 8 | Não aceitar convites reais | ✅ nenhum convite aberto, aceito ou cancelado |
| 9 | Não alterar `firestore.rules` | ✅ arquivo apenas lido e copiado; nada publicado no Console |
| 10 | Análise estática e ambiente isolado | ✅ esta fase foi inteiramente estática; as próximas usarão servidor local e `?teste=1` |

### 8.1 Declaração de não escrita

> **Nenhuma escrita foi realizada em produção durante a Fase 0.**
>
> O único tráfego de rede com o Firestore foi uma requisição `GET` ao documento `jdpg/grupos`,
> emitida por `curl` — fora do aplicativo, sem carregar nenhuma função dele.
> Não houve `PATCH`, `POST`, `DELETE` nem `commit`.
>
> Verificação independente disponível: o `updateTime` do documento permaneceu
> `2026-08-31T09:51:54.856027Z`, marca deixada por um aparelho em campo às 06:51, **anterior** a
> esta auditoria. Se qualquer escrita tivesse partido daqui, esse carimbo teria mudado.

### 8.2 O que esta fase alterou no disco

Para que o registro seja completo, três alterações **locais** — nenhuma delas em produção:

1. `AUDIT-00-SAFETY.md` — este documento, na pasta do projeto, **não rastreado e não commitado**;
2. tag Git local `audit-entrada-2026-08-31`, **não enviada** ao GitHub;
3. pasta `AUDIT-BASELINE` no scratchpad da sessão, **fora do repositório**.

**Nada disso está publicado.** Neste projeto, publicar é commitar na `main`, e não houve commit.

---

## 9. Precondição para a Fase 1

A Fase 0 está fechada. A Fase 1 pode começar sob estas condições, herdadas deste documento:

- toda comparação de arquivo **normaliza fim de linha** antes (§1.2);
- toda afirmação sobre produção é **reancorada no momento da leitura** (§6.1);
- toda contagem de participantes **filtra `removed`** (R-11);
- as chaves `pgStatusFiltros`, `schemaVersionWrite` e a regra M2 **permanecem como estão** (R-06, R-07, R-08);
- **nenhuma função do aplicativo que grave é executada**, em nenhuma circunstância — neutralizar a
  chave de API **não** impede a escrita neste app, e não existe teste seguro de escrita aqui.

---

## 10. ADENDO (31/08, 10:16 de Brasília) — a linha de base se moveu

Registrado ao fim da Fase 7, por integridade do processo.

### O que aconteceu

O `updateTime` do documento de produção **mudou** durante a auditoria:

| Momento | `updateTime` |
|---|---|
| Início (§5.3) | `2026-08-31T09:51:54.856027Z` |
| Fim da Fase 7 | `2026-08-31T13:16:32.893837Z` |

**A escrita não partiu daqui.** Ela veio de um aparelho em campo, como previsto na §6.1
("produção é um alvo em movimento").

### Correção a um argumento deste documento

A §8.1 ofereceu o `updateTime` imóvel como *"verificação independente"* de que nenhuma escrita
partiu da auditoria. **Esse argumento deixa de valer**, porque o carimbo se moveu por outra causa.

A prova de não escrita passa a ser, exclusivamente, a **natureza das requisições emitidas**: todas
as chamadas de rede desta auditoria foram `GET` HTTP feitas por `curl`, fora do aplicativo. Não
houve `PATCH`, `POST`, `DELETE` nem `commit` em nenhuma fase. Nenhuma função do aplicativo foi
executada em momento algum.

### O que mudou no dado, e o efeito sobre a auditoria

Comparação integral entre os dois instantâneos:

| Medida | 09:51 | 13:16 |
|---|---|---|
| Participantes (`memberId`) | 279 | **279** |
| Registros com tombstone | 21 | **21** |
| Convites | 492 | **492** |
| Convites pendentes | 90 | **90** |
| `convites`, `tutores`, `setoresMestre`, `setoresEfetivo` | — | **idênticos** |
| `dados` | 160 868 | 160 604 caracteres |

**Diferença única: o PG 2 passou de 2 para 1 gratidão** — poda de uma gratidão vencida
(`podarGratidoesExpiradas`), disparada por um aparelho que sincronizou e gravou.

Ninguém entrou, ninguém saiu, nenhum convite mudou de estado.

> **Nenhuma conclusão, contagem ou medição das Fases 1 a 7 é afetada.** Todos os números
> permanecem válidos, ancorados em 31/08 às 09:51 UTC, e o segundo instantâneo
> (`firestore-grupos-2026-08-31-B.json`, no scratchpad, fora do repositório) confirma-os.

### Consequência para o ponto de restauração

O instantâneo da §5.3 continua sendo a referência da auditoria, mas **não é mais o estado atual da
nuvem**. A regra da §6.1 vale integralmente: ele serve para restauração **seletiva** (um grupo, um
participante), nunca para sobrescrita em bloco — restaurá-lo inteiro agora reverteria a poda
legítima do PG 2 e qualquer alteração posterior.
