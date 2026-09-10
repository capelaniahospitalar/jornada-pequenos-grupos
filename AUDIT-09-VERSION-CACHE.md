# AUDIT-09-VERSION-CACHE — Versões, cache e código antigo em campo

**Auditoria:** Falhas de entrada / reentrada no aplicativo
**Fase:** 9 — Versões e cache
**Data de execução:** 2026-08-31
**Baseline de código:** `main` @ `1aafe63` — ver [AUDIT-00-SAFETY.md](AUDIT-00-SAFETY.md)
**Alterações de código:** **nenhuma** · **Escritas em produção:** **nenhuma**

> Esta fase mediu os cabeçalhos reais servidos pelo GitHub Pages (`curl -I`, requisições `HEAD`,
> somente leitura) e o histórico de commits. Nenhuma escrita foi emitida.

---

## Sumário executivo — e uma correção importante

**O cache HTTP não é o vilão.** O GitHub Pages devolve `Cache-Control: max-age=600` — **dez
minutos** — com `ETag` forte. Dez minutos depois de qualquer publicação, qualquer navegação nova
pega o arquivo novo. **Não existe aqui um cache de dias.**

**Não existe Service Worker.** Nunca existiu: nenhum arquivo de service worker foi commitado na
história do repositório, e os três caminhos usuais devolvem **404** no site publicado. O
`index.html` ainda **desregistra ativamente** qualquer service worker que encontre.

> ### 🔴 F-74 — A causa do código antigo em campo não é cache: é o app nunca se recarregar
>
> Este aplicativo é uma página única. Depois de carregada, **o JavaScript vive na memória do
> aparelho e nada jamais o substitui.** Não há verificação de versão, não há aviso de atualização,
> não há `location.reload()` em nenhum caminho normal — o único `reload` do arquivo inteiro está
> na saída do modo de teste.
>
> Quando a pessoa "reabre o app" pelo atalho ou pelo alternador de aplicativos, o sistema
> normalmente **retoma a página que já estava carregada**. O `visibilitychange` dispara e
> sincroniza os **dados** — e nunca o **código**.
>
> Resultado: um aparelho pode rodar o app de 18/08 hoje, **sem que o cache HTTP tenha nada a ver
> com isso**. Ele simplesmente nunca navegou de novo.
>
> É por isso que `?v=2` resolve: não porque fura um cache longo, mas porque **força uma navegação**
> e descarta a página em memória.

E o agravante que fecha o problema:

> ### 🔴 F-75 — É impossível saber qual versão um aparelho está rodando
>
> `APP_VERSION` está congelado em `1.2.0-rc1` / build `2026-08-21` desde então — **10 commits
> depois**, incluindo quatro correções de entrada e reentrada. E é exibido **num único lugar**:
> dentro de um `<details>` "Detalhes técnicos", numa tela de erro do Companheiro de Jornada.
>
> Nada disso chega à nuvem. A versão só é gravada na telemetria **local**
> (`lastSuccessfulSyncVersion`), que nunca é enviada — e a rota do convite nem alimenta essa
> telemetria (F-59).
>
> **Não há como responder "quantas pessoas ainda estão na versão antiga?".** Nem pela nuvem, nem
> pela tela, nem perguntando.

---

# 1. O que foi medido

## 1.1 Cabeçalhos do GitHub Pages

Medidos em 31/08, com requisições `HEAD`:

| Recurso | Status | `Cache-Control` | `ETag` | `Age` |
|---|---|---|---|---|
| `/` | 200 | `max-age=600` | `"6a91aff2-d9eb0"` | 0 |
| `/index.html` | 200 | `max-age=600` | `"6a91aff2-d9eb0"` | 0 |
| `/manifest.json` | 200 | `max-age=600` | `"6a91aff2-1f2"` | 0 |
| `/icon-192.png` | 200 | `max-age=600` | `"6a91aff2-2098"` | 0 |
| `/embaixadores-agosto.html` | 200 | `max-age=600` | `"6a91aff2-a13b"` | 0 |

`Last-Modified` de todos: **Fri, 28 Aug 2026 15:57:38 GMT** — o commit `1aafe63`.

**Leitura:** dez minutos de cache, revalidação por `ETag` depois disso, e nenhuma resposta velha
na borda (`Age: 0`) no momento da medição. É uma configuração **saudável**, e não é configurável
no GitHub Pages — vem assim.

> Observação menor: o cabeçalho `expires` devolvido é inconsistente entre requisições (uma delas
> veio com data no passado). Pelo padrão HTTP, `Cache-Control: max-age` tem precedência sobre
> `Expires`, então isso não muda o comportamento.

## 1.2 Service Worker

| Verificação | Resultado |
|---|---|
| Arquivo de service worker commitado na história | ❌ **nunca** |
| `/sw.js` no site publicado | **404** |
| `/service-worker.js` | **404** |
| `/serviceworker.js` | **404** |
| Registro (`serviceWorker.register`) no `index.html` | ❌ não existe |
| **Desregistro** (`getRegistrations().forEach(unregister)`) | ✅ presente, `index.html:14112` |

**Conclusão: não há e nunca houve camada de service worker.** Não existe cache de app shell,
não existe estratégia *cache-first*, não existe atualização de SW para gerenciar.

O bloco de desregistro é precaução redundante — mas correta de manter: se algum dia um service
worker for registrado por engano, ele se remove sozinho na próxima carga.

## 1.3 Ativos antigos

| | |
|---|---|
| Arquivos `.js` separados | **nenhum** — todo o app é um único `index.html` |
| Nomes com hash/versão (`app.a1b2c3.js`) | **nenhum** — não se aplica |
| Ativos órfãos no repositório | nenhum: 4 arquivos servidos (`index.html`, `embaixadores-agosto.html`, `manifest.json`, 2 ícones), todos referenciados |
| `start_url` do manifest | `./index.html` |
| Fonte externa | Google Fonts (não afeta lógica) |

**Não há problema de ativos antigos.** Arquivo único elimina toda uma classe de incoerência —
é impossível ter um `.js` novo com um `.css` velho.

## 1.4 Onde a versão aparece para o usuário

| Local | Visível? |
|---|---|
| `index.html:7557` — diagnóstico do Companheiro, dentro de `<details>` "Detalhes técnicos" | ⚠️ **praticamente invisível** |
| `index.html:10656` — log local de conflitos | ❌ nunca exibido, nunca enviado |
| `index.html:10673` — `lastSuccessfulSyncVersion` na telemetria local | ❌ nunca exibido, nunca enviado |
| Rodapé, tela de configuração, "sobre" | ❌ **não existe** |

**Nenhuma tela do aplicativo mostra a versão a quem o usa.**

---

# 2. Por quanto tempo um aparelho pode ficar atrasado?

| Caminho | Recarrega o código? | Atraso máximo |
|---|---|---|
| Abrir o link do convite pelo WhatsApp | ✅ navegação nova | **10 min** |
| Digitar/abrir o endereço no navegador | ✅ | **10 min** |
| Atalho da tela inicial, **partida a frio** | ✅ (`start_url`) | **10 min** |
| Puxar a tela para baixo (recarregar) | ✅ | **10 min** |
| **Atalho / aba retomada do segundo plano** | ❌ **não** | **indefinido** |
| **Aba deixada aberta** | ❌ **não** | **indefinido** |

**As duas últimas linhas são o problema inteiro.** E são exatamente o modo como um app instalado
na tela inicial costuma ser usado: a pessoa não "abre" — ela **volta**.

Nesse caminho, o `visibilitychange` do `index.html:11505` roda, sincroniza os dados, atualiza as
telas… e o código continua sendo o de semanas atrás.

---

# 3. Matriz de versões

Épocas construídas a partir dos commits reais (**29 commits no `index.html` desde 15/08**).
Todas as épocas a partir de 21/08 se anunciam com **o mesmo `APP_VERSION`**.

| Época (marco) | `APP_VERSION` diz | Contrato de escrita | Slots | Convite | Reentrada | Risco |
|---|---|---|---|---|---|---|
| **≤ 17/08** | anterior | **antigo** — lista local substitui a nuvem, sem preservar PGs desconhecidos | **50** | v2, com fallback perigoso | quebrada | 🔴 **ALTÍSSIMO** |
| **18–19/08** (`130d268`) | anterior | preserva PGs desconhecidos; **sem** guardas G1–G4 | 50 | idem | quebrada | 🔴 **ALTO** |
| **20/08** (`ac7aae8`) | `1.1.0-rc1` | **+ guardas G1–G4**, identidade de PG | **70** | idem | quebrada | 🟠 **MÉDIO** |
| **21/08** (`af18d73`, `fb8376a`) | **`1.2.0-rc1`** | **E1 — contrato único**, fallback do convite removido, guardas alcançam o aceite | 70 | ✅ novo | quebrada | 🟠 **MÉDIO** |
| **24–26/08** (`f622375`) | **`1.2.0-rc1`** | **+ merge escalar** (não retrocede campos do grupo) | 70 | + WhatsApp normalizado, botão corrigido | quebrada | 🟡 **BAIXO** |
| **27/08** (`34ce7ba`) | **`1.2.0-rc1`** | = | 70 | + "Copiar link" | quebrada | 🟡 **BAIXO** |
| **28/08** (`1aafe63`) — **atual** | **`1.2.0-rc1`** | = | 70 | = | ✅ **corrigida** (tombstone) | 🟢 **linha de base** |

## 3.1 O que cada risco significa na prática

| Época | Se um aparelho ainda estiver nela |
|---|---|
| ≤ 19/08 | **Apaga da nuvem os PGs 51–54** e os 4 participantes deles (F-71). Nula campos de schema |
| ≤ 20/08 | Não conhece slots acima de 50: o botão do Painel some, o PG "não existe" para ele |
| ≤ 21/08 | O aceite de convite **não passa pelas guardas** de conteúdo |
| ≤ 26/08 | **Reverte** nome, tutor, coordenador, dia, hora, setores e status de PGs editados por outros |
| ≤ 27/08 | Sem "Copiar link": se o WhatsApp não abrir, o convite fica criado e não é enviado |
| ≤ 28/08 | **Quem foi removido de um PG não consegue entrar em outro** — laço infinito no "trocar de grupo" |

## 3.2 As quatro últimas épocas são indistinguíveis

De 21/08 a 28/08 — **10 commits, incluindo 4 correções de entrada/reentrada** — todas se
apresentam como `1.2.0-rc1 / build 2026-08-21`.

Isto tem consequência direta no diagnóstico de campo: quando alguém relata "não consigo entrar",
**não é possível saber se aquele aparelho tem a correção de 28/08 ou não**. E era justamente a
correção de 28/08 que resolvia "removido não entra em outro PG".

---

# 4. Correção a um diagnóstico corrente do projeto

O projeto vinha tratando "publiquei e não mudou" como **cache do GitHub Pages**, com o remédio de
provar por `curl` e furar o cache com `?v=2`.

**A medição mostra que o cache do Pages dura 10 minutos.** Ele não pode explicar um aparelho preso
numa versão de dias ou semanas atrás.

| Diagnóstico | Veredito |
|---|---|
| "É cache do GitHub Pages" | ❌ **Improvável** — `max-age=600` |
| "É cache do navegador" | ❌ **Improvável** — mesmo cabeçalho, com revalidação por `ETag` |
| "É service worker" | ❌ **Impossível** — não existe nenhum |
| **"A página nunca foi recarregada"** | ✅ **É esta** |

**O que não muda:** `?v=2` continua sendo o remédio certo. Só que ele funciona por outro motivo —
força uma **navegação**, descartando a página em memória. Conferir por `curl` também continua
certo: prova que a publicação chegou ao servidor.

**O que muda:** a instrução a dar a quem está travado. "Espere o cache passar" não resolve nada.
O que resolve é **fechar o app de verdade** (removê-lo do alternador de aplicativos, não só voltar
à tela inicial) ou abrir o endereço com `?v=` e um número novo.

---

# 5. Matriz de risco por cenário de uso

| Como a pessoa usa o app | Recarrega? | Risco de código antigo |
|---|---|---|
| Abre pelo link do convite, cada vez | ✅ sempre | 🟢 mínimo |
| Salva o endereço e abre pelo navegador | ✅ quase sempre | 🟢 baixo |
| Atalho na tela inicial, fecha de verdade entre usos | ✅ na partida a frio | 🟡 médio |
| **Atalho na tela inicial, só alterna entre apps** | ❌ **nunca** | 🔴 **alto** |
| **Deixa a aba aberta no navegador** | ❌ **nunca** | 🔴 **alto** |

Cruzando com a Fase 5: **o atalho da tela inicial já era a forma de uso menos confiável** (perde o
vínculo do participante). Ele é também a que mais retém código antigo. **As duas piores
propriedades do sistema se concentram no mesmo hábito.**

---

# 6. Achados novos da Fase 9

| # | Achado | Sev. |
|---|---|---|
| **F-74** | O app nunca se recarrega: sem verificação de versão, sem aviso de atualização, sem `reload` em caminho normal. Aparelho retomado do segundo plano roda código antigo indefinidamente | **A** |
| **F-75** | `APP_VERSION` congelado em 21/08 (10 commits atrás) e exibido só dentro de um `<details>` numa tela de erro. **Impossível saber a versão de um aparelho**, nem pela nuvem | **A** |
| **F-76** | Nenhuma versão é enviada à nuvem. `lastSuccessfulSyncVersion` é local, nunca sai — e a rota do convite nem a alimenta (F-59). Não há como dimensionar quantos estão atrasados | B |
| **F-77** | O diagnóstico corrente ("é cache do Pages") está errado: `max-age=600`. O remédio `?v=2` continua certo, pelo motivo errado | B |

**Confirmado sem defeito:** ausência de service worker (deliberada e correta), ausência de ativos
versionados (arquivo único elimina a classe do problema), cabeçalhos do Pages (saudáveis e não
configuráveis).

---

# 7. O que decorre disto para as prioridades

Três correções pequenas mudariam o quadro, e nenhuma mexe em arquitetura:

| Correção | Efeito |
|---|---|
| **Atualizar `APP_VERSION` a cada publicação** | Torna as épocas distinguíveis. Sem isso, nenhum diagnóstico de versão é possível |
| **Mostrar a versão numa tela normal** (rodapé do Painel, por exemplo) | Permite que o suporte pergunte "qual número aparece aí?" |
| **Comparar a versão em memória com a do servidor** ao voltar da visibilidade, e avisar | Ataca o F-74 na raiz — o app passa a saber que está velho |

A terceira é a única que resolve de fato. As duas primeiras são pré-requisito para **medir** o
problema, que hoje é invisível.

---

# 8. Limites desta fase

- **Nada foi executado e nada foi gravado.** As medições são requisições `HEAD`/`GET` ao GitHub
  Pages.
- **Os cabeçalhos foram medidos de um único ponto de rede**, uma vez. Bordas de CDN em outras
  regiões podem devolver `Age` diferente — mas `max-age=600` é a política, não uma amostra.
- **O comportamento de retomada de aplicativo não foi testado em aparelho real.** A afirmação de
  que a página retomada não recarrega é padrão de plataforma, não medição própria — mas é
  consistente com os relatos de campo já registrados no projeto.
- **Não há como estimar quantos aparelhos estão em cada época.** É precisamente o F-75/F-76: o
  dado não existe em lugar nenhum.
- **A matriz da §3 usa datas de commit como fronteira de época.** Um aparelho pode ter carregado o
  código em qualquer instante dentro de uma época; a granularidade real é a do commit, não a do
  dia.
