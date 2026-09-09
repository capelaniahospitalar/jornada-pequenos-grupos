# MUTIRÃO DE NATAL 2026 · FASE 14 — Um documento por PG e por edição

**Data:** 2026-09-09 · **Branch:** `audit/fix-invite-reentry` · **Status:** ✅ implementada e verificada
**`main` intocada em `1aafe63`.** Nenhuma gravação em produção, nenhum R2 executado.
**A regra do Firestore foi publicada em 09/09 às 09:54** e conferida byte a byte (§5) — publicar a
regra não publica o app: a `main` continua na `1.2.0-rc1` e nenhum aparelho em campo conhece o
endereço novo.

---

# 1. O que motivou a mudança

Na sessão de 08/09 ficou uma pergunta em aberto: *cada pessoa registra uma vez a sua cota, ou toda vez que trouxer alguma coisa?*

O usuário respondeu em 09/09:

> "os participantes do Mutirão de Natal terão de setembro até o início de dezembro para conseguir doações, então pretende-se que sejam vários acessos dos participantes."

Isso derruba o desenho anterior. Medição feita antes de propor qualquer coisa:

| Formato | Bytes por entrega (já escapados) | Cabem em 480 KB |
|---|---|---|
| Como estava | 474 | **1 012 entregas** |
| Enxugado (cortando o que se repete) | 256 | 1 875 entregas |

E a demanda, com ~13 semanas de campanha e **~296 participantes ativos** (retrato de 04/09):

| Se cada pessoa registrar… | Total | Documento único aguenta? |
|---|---|---|
| 1× | 296 | ✅ |
| 3× | 888 | no limite |
| 6× | 1 776 | ❌ |
| 13× | 3 848 | ❌ |

**Conclusão: enxugar o formato não resolveria este caso.** Empurraria a parede de ~2 para ~6 registros por pessoa, e a campanha muito provavelmente passa disso. Estourar o teto significa **gravação recusada no meio de novembro** — o modo de falha mais caro deste projeto.

## 1.1 O segundo motivo, tão importante quanto

Com um documento institucional único, **toda a instituição disputa a mesma gravação**. Cada registro colide com todos os outros. O `FAILED_PRECONDITION` que apareceu duas vezes nas cinco gravações manuais de 04/09 passaria a ser rotina, com 300 pessoas registrando ao longo de três meses.

## 1.2 O que tornou a saída viável

Verificação no código antes de propor: **nenhuma tela lê mais de um PG por vez.** O dashboard, o painel do tutor e a tela do participante chamam todas `dadosMutiraoDoPG(pgNum)`, um PG de cada vez. Não existe hoje nenhuma leitura institucional que a separação quebraria.

---

# 2. A decisão

**`jdpg/mutirao/2026/{pgNum}`** — um documento por PG, por edição da campanha.

```
jdpg                        (coleção)
 └── mutirao                (documento)
      ├── 2026              (coleção)
      │    ├── 1            (documento — entregas do PG 1)
      │    ├── 2
      │    └── …
      └── 2027              (a campanha do ano que vem nasce isolada)
```

## 2.1 Duas correções que o usuário aceitou antes de autorizar

**A forma do caminho.** O pedido original foi `jdpg/mutirao/{pgId}`. Isso não é um endereço válido: no Firestore os caminhos alternam coleção → documento, e `jdpg/mutirao/{x}` tem três níveis — é uma **coleção**, não um documento. São necessários quatro níveis.

**A chave.** `pgId` está **vazio em 66 dos 70 slots** (FASE 1 §1.2, retrato de 04/09). Chavear por ele jogaria 66 PGs no mesmo documento `null` — recriando exatamente o gargalo do qual se estava saindo. A chave é **`pgNum`**, presente em 100% dos slots e estável pela regra do projeto de nunca mover PG de slot.

## 2.2 Uma formulação que o usuário corrigiu, e que fica registrada

Eu havia escrito que a separação deixaria a capacidade *"na prática, sem teto"*. O usuário corrigiu, com razão:

> "Cada documento do Firestore continua tendo limite de tamanho. O correto é: o limite deixa de ser um gargalo institucional único e passa a ser distribuído entre os PGs."

É essa a formulação usada em todo o código e nos documentos.

## 2.3 A conta nova

| | |
|---|---|
| Cabem por documento de PG | ~1 012 entregas |
| Média de pessoas por PG | ~6 |
| Registros por pessoa antes de encostar no teto | **~168** |

Formato do registro **inalterado** — os 474 bytes continuam os mesmos. O que mudou é onde eles são guardados.

---

# 3. O que mudou no código

Tudo está confinado à camada de persistência. **A lógica de negócio não foi tocada.**

| | Antes | Depois |
|---|---|---|
| Endereço | `mutiraoDocUrl(cfg)` | `mutiraoDocUrl(cfg, pgNum)` |
| Leitura | `mutiraoFbRead(cfg)` | `mutiraoFbRead(cfg, pgNum)` |
| Gravação | `mutiraoFbWrite(cfg, entregas, base)` | `mutiraoFbWrite(cfg, pgNum, entregas, base)` |
| Sincronização | `sincronizarMutirao(opts)` | `sincronizarMutirao(pgNum, opts)` |
| Atalho das telas | `mutiraoSincronizarEDepois(fn)` | `mutiraoSincronizarEDepois(pgNum, fn)` |

## 3.1 A lista local continua sendo uma só

O aparelho guarda **uma** lista com as entregas de todos os PGs que já viu — uma tutora acompanha vários. A sincronização recorta dessa lista só a fatia do PG pedido (`mutiraoFatiaDoPG`), mescla com a nuvem daquele PG e devolve a fatia ao lugar (`mutiraoForaDaFatia`). **As entregas dos outros PGs não são tocadas nem enviadas.**

Foi a escolha que preservou intactas as 49 provas M e as 20 provas S: elas trabalham sobre `mutiraoLoadEntregas()`, que continua devolvendo a mesma coisa de antes.

## 3.2 Três guardas novas

O erro que esta arquitetura torna possível não é mais "perder uma entrega" — é **gravar a entrega no PG errado**, que não faz barulho nenhum quando acontece.

| Guarda | O que faz |
|---|---|
| `mutiraoPgNumValido` | um endereço só é montado com número de PG inteiro e positivo; sem ele, erro em vez de URL plausível |
| `pg_misturado` | `mutiraoFbWrite` **recusa** o conjunto que contenha entrega de outro PG ou de outra edição, antes de qualquer rede |
| `pg_invalido` | sincronizar sem PG válido devolve erro e não grava nada |

A guarda `pg_misturado` transforma um erro de filtro em quem chama num **erro visível**, em vez de um dado gravado no PG errado que ninguém notaria.

## 3.3 O que NÃO foi tocado — verificado por comparação byte a byte

`anularEntregaNatal` · `validarEntregaNatal` · `mutiraoEntregaDuplicada` · `registrarMinhaEntregaNatal` · `registrarEntregaExternaNatal` · `listarEntregasNatalDoPG` · `dadosMutiraoDoPG` · `mutiraoPersistir` · `mutiraoMesclar` · `mutiraoNormalizarKg` · `autoTesteMutirao` · `autoTesteMutiraoPermissoes`

Todas idênticas ao commit anterior. **Nenhuma prova M ou S precisou ser alterada** — condição que o usuário pôs para não parar a execução.

---

# 4. Os testes

Executados em `http://localhost:8099/index.html?teste=1`, no modo de teste isolado.

| Bateria | Provas | Passou | Falhou | Bloqueado |
|---|---|---|---|---|
| `autoTesteFase4` | 11 | 11 | 0 | 0 |
| `autoTesteE1` | 27 | 27 | 0 | 0 |
| `autoTesteB1` (convites/reentrada) | 46 | 46 | 0 | 0 |
| `autoTesteB2` (robustez) | 42 | 42 | 0 | 0 |
| `autoTesteMutirao` (**M**) | 49 | 49 | 0 | 0 |
| `autoTesteMutiraoPermissoes` (**S**) | 20 | 20 | 0 | 0 |
| `autoTesteMutiraoMatriz` (**T**) | 17 | 16 | 0 | **1** |
| `autoTesteMutiraoSync` (**N**) | **26** | **26** | 0 | 0 |
| **TOTAL** | **238** | **237** | **0** | **1** |

Eram 227 antes; as 11 novas são os 10 testes de isolamento mais o alarme N-26. A única não-verde é a **T9**, marcada `BLOQUEADO` de propósito: é o R2 de campo com dois aparelhos, que já estava assim e continua pendente.

## 4.1 Os 11 testes novos

| | |
|---|---|
| **N-16** | cada PG grava no SEU documento, e só com as entregas dele |
| **N-17** | sincronizar o PG A não altera o documento do PG B |
| **N-18** | a lista do aparelho conservou as entregas do outro PG |
| **N-19** | o que chega da nuvem do PG B não entra no PG A |
| **N-20** | conflito insistente no PG A não mexe no documento do PG B |
| **N-21** ⭐ | a gravação real RECUSA conjunto com entrega de outro PG |
| **N-22** | a gravação real RECUSA entrega de outra edição da campanha |
| **N-23** | o endereço leva a edição e o número do PG, e nunca toca `jdpg/grupos` |
| **N-24** | sincronizar sem PG válido é recusado e não grava nada |
| **N-25** | entrega de outra edição não é enviada e continua no aparelho |
| **N-26** | alarme: a edição do código é a mesma que a regra publicada aceita (2026) |

**N-21 e N-22 chamam a função de gravação REAL**, não o servidor falso — senão o teste provaria apenas que o meu servidor de mentira funciona.

O Firestore falso da bateria passou a guardar **um documento por PG**. É essa troca que faz a bateria exercitar a arquitetura nova: se o código voltasse a gravar tudo num lugar só, N-16 a N-20 quebrariam.

## 4.2 Provas de que nada foi para produção

| | |
|---|---|
| Requisições de rede ao Firestore durante os testes | **zero** |
| `MODO_TESTE` ativo o tempo todo | ✅ |
| `jdpg_mutirao_natal_v1` (chave real do aparelho) | nunca tocada (N-15) |

Endereço realmente construído, conferido em execução:

```
https://firestore.googleapis.com/v1/projects/jornada-pequenos-grupos
  /databases/(default)/documents/jdpg/mutirao/2026/12?key=…
```

E `mutiraoDocUrl(cfg, null)` lança erro em vez de montar um endereço.

---

# 5. A regra do Firestore — ✅ **PUBLICADA EM 2026-09-09 ÀS 09:54**

> **Conferência pós-publicação — feita, e o resultado é positivo.** O usuário copiou de volta o
> texto da aba Regras do Console e ele foi comparado byte a byte com o `firestore.rules` do
> commit `960b8d7`: **md5 idêntico, `38440fd0cc374c7044aa89823bc0c8a8`**. Nenhum caractere se
> perdeu na colagem.
>
> Contra a regra que estava em produção desde 19/08: **7 linhas acrescentadas, 0 removidas,
> 0 alteradas**. Os blocos `jdpg/grupos` (os 70 PGs) e `embaixadoresExternos` seguem idênticos
> — os celulares em campo não foram afetados.
>
> Auditoria do texto que está no ar: curingas presentes são `{database}` (boilerplate),
> `{registro}` (Embaixadores, pré-existente) e `{pgNum}` (novo, último segmento). **Curinga
> recursivo `{x=**}`: zero.** Profundidades: `jdpg/grupos` 2 segmentos, `jdpg/mutirao/2026/{pgNum}`
> **4** — não há caminho pelo qual a regra nova alcance os grupos.
>
> ⚠️ A verificação por requisição de rede (um GET no documento novo, em que `403` significaria
> regra ausente e `404` regra publicada) **foi bloqueada pelo ambiente do assistente**, que barra
> chamadas com credencial. A conferência do texto substituiu essa via e é mais forte: pega
> colagem parcial e bloco perdido, que é o que realmente falha.

```
match /jdpg/mutirao/2026/{pgNum} {
  allow read: if true;
  allow create, update: if request.resource.data.keys().hasOnly(['entregas','ts','schemaVersion'])
    && request.resource.data.entregas is string
    && request.resource.data.entregas.size() < 500000;
  allow delete: if false;
}
```

**Por que não alcança `jdpg/grupos`:** este caminho tem **quatro** segmentos e o de `jdpg/grupos` tem **dois**. Em Security Rules um `match` só casa com caminhos da mesma profundidade, e não há aqui nenhum curinga recursivo (`{x=**}`) — a única construção capaz de atravessar níveis. O único curinga é `{pgNum}`, no último segmento. Não existe caminho por onde esta regra afete os 70 PGs reais.

**Verificado por comparação automática** (comentários removidos, espaços normalizados): entre a regra publicada em 19/08 e esta, a diferença são **7 linhas acrescentadas**, todas dentro do bloco novo. Nenhuma linha removida, nenhuma alterada. Os blocos `jdpg/grupos` e `embaixadoresExternos` continuam idênticos.

## 5.1 A edição é literal `2026`, não curinga — decisão de 09/09

Eu havia proposto `{edicao}` como curinga, para a campanha de 2027 nascer sem tocar na regra. **Revi a recomendação e o usuário decidiu por `2026` travado.** O argumento é o modo de falha, não a conveniência.

O endereço é montado no app a partir de `MUTIRAO_NATAL.edicao`. Se esse valor sair errado um dia — edição acidental do código, versão antiga em cache, teste apontado para outro lugar:

| | O que acontece |
|---|---|
| Com curinga | a gravação é **aceita** e cai numa coleção que nenhuma tela lê. Ninguém vê erro: a pessoa registra, o app diz "salvo", e o dado não existe para o resto do mundo |
| Travado em `2026` | volta **403**, o app avisa a pessoa e o problema aparece no mesmo dia |

Num projeto que já teve gravação indevida em produção, essa segunda barreira — **externa ao JavaScript, que o aparelho não atravessa** — vale mais do que economizar uma linha em 2027. Exigir alteração deliberada da regra para abrir 2027 é a vantagem, não o custo.

**O preço dessa proteção:** código e regra passam a ter de andar juntos. O alarme para isso é o teste **N-26**, que fica vermelho se alguém mudar a edição no código — lembrando de publicar a regra da edição nova ANTES, sob pena de toda gravação da campanha voltar 403 disfarçado de "sem conexão".

---

# 6. O que continua pendente

| | |
|---|---|
| Publicar a regra no Console | ✅ **feito 09/09 às 09:54**, conferido byte a byte (§5) |
| **R2 do Mutirão** (`MUTIRAO-13`, revisto hoje) | ⛔ não executado |
| **R2 do `AUDIT-17`** (reentrada de convite) | ⛔ não executado, independente |
| Merge para a `main` | ⛔ **exige autorização explícita do usuário** |

**Mudança importante no R2-D:** os dois aparelhos agora **precisam estar no mesmo PG**. Antes, qualquer par de aparelhos da instituição disputava o mesmo documento; hoje, quem está em PGs diferentes não disputa nada — e o teste passaria sem provar coisa alguma. O sinal de que o teste valeu é `mutiraoConflitos ≥ 1`.

## 6.1 Pendências herdadas, ainda abertas

Botão de desfazer na tela (o motor `anularEntregaNatal` está pronto e provado) · `kgMax = 200` continua sendo suposição minha, nunca confirmada · campo de setor do externo desempataria homônimos.
