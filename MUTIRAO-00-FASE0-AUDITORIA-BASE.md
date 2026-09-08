# MUTIRÃO DE NATAL 2026 · FASE 0 — Congelamento e auditoria da base

**Data:** 2026-09-08 · **Executor:** auditoria só de leitura · **Status:** ✅ concluída
**Nada foi modificado.** A árvore continua limpa e a `main` intocada.

---

# 1. Identidade da base (congelada)

| | |
|---|---|
| Branch | `audit/fix-invite-reentry` |
| Commit | `6a7aee8db84535125c1d7eb82a1fa661bc1aa282` (`6a7aee8`) |
| Mensagem | *docs: protocolo do R2 para dois aparelhos reais* |
| Data do commit | 2026-08-31 16:15:03 -0300 |
| Sincronia | idêntico a `origin/audit/fix-invite-reentry` |
| Alterações locais | **0** |
| Versão declarada | `APP_VERSION = { version: '1.3.0-rc1', build: '2026-08-31', schema: 2 }` — linha 11320 |
| SHA-256 do `index.html` | `dba935431171d71bba31f83f2a24dac523755c3300e901d249e465ad1f363a96` |
| Tamanho | 14 988 linhas · 963 082 bytes |
| `main` | `1aafe63` — **intocada** |

✅ **Confirmado: a base é exatamente a `1.3.0-rc1`.**

## 1.1 Ponto de restauração (item 5)

| Recurso | Onde |
|---|---|
| Tag Git local | `base-mutirao-natal` → `6a7aee8` (**não empurrada** para o GitHub) |
| Cópia física | `RESTAURACAO-base-1.3.0-rc1-6a7aee8.html` (fora do repositório) |
| Reversão total | `git checkout base-mutirao-natal -- index.html` |

---

# 2. Estrutura do Firestore

| | |
|---|---|
| Documento único | `jdpg/grupos` (`FB_COLL='jdpg'`, `FB_DOC='grupos'` — linhas 11267–11268) |
| URL | `firestore.googleapis.com/v1/projects/<projectId>/databases/(default)/documents/jdpg/grupos` |
| Campos de topo aceitos | `dados`, `tutores`, `convites`, `setoresMestre`, `setoresEfetivo`, `embaixadoresExternos` — `FB_CAMPOS_CONTRATO`, linha 11631 |
| Contrato de escrita | `validarIntencao()` recusa qualquer chave fora da lista — linha 11637 |
| Trava de concorrência | pré-condição `currentDocument.updateTime` em `fbWriteGrupos` |
| Campos transportados sem interpretação | `PG_CAMPOS_TRANSPORTADOS = ['pgId','setorId','historico','pgProgress']` — linha 9298 |

> ⚠️ **Regra herdada:** campo novo que precise sincronizar tem de entrar na `FB_CAMPOS_CONTRATO` **e** na allowlist da regra do Firestore, senão vira 403 mascarado de "sem conexão". Isso vale para qualquer campo que o Mutirão venha a gravar.

---

# 3. Estrutura da Home

Ordem visual dos blocos (`#screen-home`, a partir da linha 1525):

| Bloco | Contêiner | Preenchido por |
|---|---|---|
| 1 — Meu Caminho Hoje | `#next-area` | render da trilha |
| — Diretoria (PG 47) | `#h-diretoria-area` | `renderDiretoriaTemasHome()` |
| **2 — Meu Pequeno Grupo** | **`#h-grupo-area`** | **`renderGruposBtnHome()` + `renderPgProgressHome()`** |
| 5 — Ferramentas | `#h-ai-area` | `renderAIArea()` |
| 6 — Liderança do PG | `#h-lideranca-area` | `renderShareArea()` (só Tutor/Coordenador) |
| — Comunidade | `#h-comunidade-area` | `renderComunidadeBtnHome()` |

Sequência de montagem — linhas 6938–6946, dentro de um `setTimeout(…, 30)`:

```
renderGruposBtnHome()     ->  cria a âncora vazia #grupos-home-btn
renderPgProgressHome()    ->  insere #pg-progress-card logo depois da âncora
renderComunidadeBtnHome()
renderDiretoriaTemasHome()
renderRestartArea()
```

---

# 4. Onde o Progresso do PG está implementado

## 4.1 Apresentação (o que aparece na tela)

| Item | Linhas | Papel |
|---|---|---|
| CSS `.pg-progress-*` | 1347–1366 | aparência do card |
| Âncora `#grupos-home-btn` | 12844–12858 (`renderGruposBtnHome`) | div vazio; só ponto de inserção |
| **`renderPgProgressHome()`** | **14448–14603** | **monta e insere o card inteiro** |
| Chamada | 6941 | dentro do `setTimeout` da Home |

O card recebe `id="pg-progress-card"` e é inserido com `anchor.after(div)`.

## 4.2 Conteúdo do card (5 partes, de cima para baixo)

| # | Parte | Origem no código |
|---|---|---|
| 0 | Cabeçalho "Progresso — *nome do PG*" + contador 👥 | 14578–14586 |
| **1** | **Card do grupo — flâmula, nome, tipo, data, link `openInscricao()`** | **`grupoInfoHtml`, 14560–14572** |
| 2 | 📘 Progresso do Percurso (acumulado) | `estudosBar` |
| 3 | Nível do PG | `nivelHtml`, 14538–14558 |
| 4 | 📅 Meta da Semana (5 indicadores + faixa de %) | `goalsHtml` + `weekBanner`, 14520–14526 |
| 5 | 👥 Engajamento do Grupo | `engajamentoHtml`, 14530–14536 |

## 4.3 Lógica que alimenta a seção

| Função | Linha | O que faz |
|---|---|---|
| `getPgWeekMetas()` | 12878 | as 5 metas semanais |
| `getPgGroupWeek()` | 12900 | soma a contribuição da semana ISO de cada participante |
| `getGratidoesDaSemanaISO()` | 12895 | gratidões da semana corrente, direto do Mural |
| `getPgEngajamentoSemana()` | 12927 | mede **pessoas** ativas, não tarefas |
| `getPgGrupoLevel()` / `PG_GRUPO_LEVELS` | 14213 / 14190 | nível do PG por semanas completas |
| `getOrInitPgProgress()` | 14118 | lê/cria `g.pgProgress` |
| `loadPgProgress()` / `savePgProgress()` | 14103 / 14109 | leitura e gravação do campo |
| `bumpPgProgress()` | 14155 | **o gravador** — registra a atividade quando ela acontece |
| `registrarSemanaAtiva()` | 14145 | marca a semana como completa |
| `participantesAtivos()` | — | filtra tombstones (`removed`) |
| `generatePennantSvg()` | — | desenha a flâmula |

---

# 5. ACHADOS

## 🔴 ACHADO 1 — O card não contém só o Progresso

**Dentro do conteúdo expansível do card vive o card do grupo** (`grupoInfoHtml`, linhas 14560–14572): flâmula, "Grupo *N* — *nome*", tipo de participante, data de inscrição e o botão que abre `openInscricao()`.

O próprio código registra que isso foi uma consolidação deliberada:

> *"Card do grupo (flâmula + nome + dados) — antes era um botão separado na Home (`#grupos-home-btn`), agora vive dentro do conteúdo expansível deste botão único."* — linha 14559

**Consequência:** ocultar o card inteiro **também tira da Home o único acesso do participante ao próprio grupo** — a flâmula, os dados de inscrição e a entrada para `openInscricao()`.

**Isto exige decisão do usuário antes de qualquer alteração.** Ver §7.

## 🟢 ACHADO 2 — Nenhuma função de dados fica órfã

Toda função que alimenta o Progresso tem **outro consumidor** além da Home:

| Função | Outro consumidor |
|---|---|
| `getPgWeekMetas`, `getOrInitPgProgress`, `getPgGroupWeek`, `getPgGrupoLevel`, `PG_GRUPO_LEVELS` | `renderTutorGrupoDetalhe()` — **Painel do Tutor/Coordenador**, linha 3844 |
| `getPgGroupWeek`, `getPgWeekMetas` | `pgImdPercent()`, `calcularMissaoScore()`, `calcularCrescimentoScore()` — **motor do IMD / Ranking dos PGs** |
| `getPgEngajamentoSemana` | `pgImdPercent()` — IMD |
| `getGratidoesDaSemanaISO` | `getPgEngajamentoSemana()` |
| `bumpPgProgress`, `registrarSemanaAtiva` | chamadas espalhadas pelo app quando a atividade ocorre |
| `generatePennantSvg` | 4 outros pontos |

**Consequência (boa notícia):** ocultar a exibição na Home **não interrompe a coleta de dados, não quebra o Ranking IMD e não afeta o Painel do Tutor**. O Progresso continua sendo calculado, gravado e visível para a liderança — some apenas da Home do participante.

## 🟡 ACHADO 3 — `pgProgress` é campo transportado

`pgProgress` está em `PG_CAMPOS_TRANSPORTADOS` (linha 9298). O comentário do próprio código registra que esse campo **já sumiu silenciosamente do documento uma vez**. Ocultar a interface não pode, em nenhuma hipótese, remover `pgProgress` do payload de gravação.

---

# 6. Trechos que serão APENAS OCULTADOS

*Conforme o item 4 do plano — nenhuma função do Progresso será apagada.*

| Trecho | Linhas | Tratamento proposto |
|---|---|---|
| Chamada `renderPgProgressHome()` na Home | 6941 | **desativar a chamada** atrás de uma constante única (`MOSTRAR_PROGRESSO_PG_HOME = false`) |
| Corpo de `renderPgProgressHome()` | 14448–14603 | **intacto** — permanece no arquivo, deixa de ser chamado |
| CSS `.pg-progress-*` | 1347–1366 | **intacto** |
| Todas as funções de dados (§4.3) | — | **intactas e ativas** |
| `renderGruposBtnHome()` / âncora | 12844–12858 | **intacta** — passa a ser a âncora do botão do Mutirão |

**Restauração no momento oportuno:** trocar a constante de `false` para `true`. Uma linha.

---

# 7. ⛔ DECISÃO PENDENTE — bloqueia a FASE 1

O ACHADO 1 abre uma escolha que é do usuário, não minha:

**Se a seção Progresso do PG sair da Home, o que acontece com o card do grupo (flâmula + nome + dados + acesso a `openInscricao()`), que hoje mora dentro dela?**

| Opção | Efeito |
|---|---|
| **A** | O card do grupo **volta a ser um botão próprio** na Home, como era antes da consolidação. O participante continua vendo sua flâmula e seu grupo. É a mais conservadora. |
| **B** | O card do grupo **também some** provisoriamente. A Home fica mais limpa e focada no Mutirão, mas o participante perde o acesso à própria inscrição pela Home. |
| **C** | O card do grupo passa a viver **dentro do novo card do Mutirão**, repetindo a consolidação atual. |

Nada será alterado até esta escolha.

---

# 8. Ainda não informado pelo usuário

Para a FASE 1 (desenho da funcionalidade) faltam as **regras estabelecidas do Mutirão de Natal**:

1. O que exatamente é registrado — item, quantidade, valor, doador?
2. Quem pode registrar — qualquer participante, só o coordenador, só o tutor?
3. O registro é por pessoa, por PG, ou institucional?
4. Existe meta — por PG, por setor, global?
5. O dado precisa sincronizar entre aparelhos (ou seja, ir para o Firestore)?
6. Há prazo — data de início e de encerramento do mutirão?
7. A cor é laranja escuro; existe alguma referência visual ou ela fica a critério do desenho?

---

# 9. Situação

| | |
|---|---|
| FASE 0 | ✅ concluída |
| Modificações no código | **nenhuma** |
| Ponto de restauração | ✅ tag `base-mutirao-natal` + cópia física |
| `main` | 🔒 intocada em `1aafe63` |
| Produção | 🔒 nenhuma escrita |
| FASE 1 | ⏳ bloqueada pela decisão do §7 e pelas regras do §8 |
