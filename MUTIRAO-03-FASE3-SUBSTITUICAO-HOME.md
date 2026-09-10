# MUTIRÃO DE NATAL 2026 · FASE 3 — Substituição temporária do Progresso na Home

**Data:** 2026-09-08 · **Base:** `912c083` (FASE 2 commitada) · **Status:** ✅ implementada e verificada
**Alteração:** `index.html` — **136 inserções, 11 remoções.** As 11 remoções são markup **relocado**, não excluído (§4).

---

# 1. ✅ Critério de aceite — verificado em execução

Navegador real, servidor local, modo de teste isolado, Home montada:

| Critério | Resultado |
|---|---|
| **PROGRESSO não aparece** | ✅ `#pg-progress-card` ausente do DOM |
| **MUTIRÃO DE NATAL aparece** | ✅ `#mutirao-card` presente, cabeçalho `linear-gradient(135deg, rgb(181,84,26), rgb(201,105,27))` |
| **Nenhuma outra funcionalidade da Home é afetada** | ✅ ver §2 |

## 1.1 Como ficou

```
┌─────────────────────────────────────────────┐
│  🛡  Grupo 1 — PG DEMONSTRACAO          ›    │   ← card do grupo, preservado
│      🏥 Farmácia · 05/12/2026                │
├─────────────────────────────────────────────┤
│ 🎁  Mutirão de Natal          [19,5 kg]  ▾   │   ← laranja escuro
│     Toque para ver as doações do seu PG      │
├─────────────────────────────────────────────┤
│   PARTICIPANTES        EXTERNOS              │
│   7,5 kg               12 kg                 │
│   2 entregas registradas neste Pequeno Grupo │
└─────────────────────────────────────────────┘
```

Os números vêm da camada de serviços da FASE 2 (`calcularTotalKgNatalDoPG`), com duas entregas semeadas pelas funções reais — 7,5 kg de participante + 12 kg de externo = 19,5 kg, **com as colunas separadas**, como manda o contrato.

---

# 2. "Nenhuma outra funcionalidade é afetada" — o que isso exigiu

## 2.1 🔴 O card do grupo teria sido levado junto

A FASE 0 já havia detectado: o card do grupo (flâmula + nome + tipo + data de inscrição + acesso a `openInscricao()`) **morava dentro** do card de Progresso.

Remover o Progresso inteiro teria tirado da Home o único acesso do participante à própria inscrição — violando o seu próprio critério de aceite. **Seu critério, portanto, decidiu o A/B/C da FASE 0: é a opção A.**

**Solução:** o markup foi extraído para `htmlCardDoGrupo(mg, solto)` — **fonte única**, usada nos dois estados:

| Estado | Onde o card do grupo aparece |
|---|---|
| `MOSTRAR_PROGRESSO_PG_HOME = false` (agora) | solto na Home, em `#grupos-home-btn`, como era antes da consolidação |
| `MOSTRAR_PROGRESSO_PG_HOME = true` (restaurado) | de volta para dentro do card de Progresso |

**Verificado nos dois estados: aparece exatamente 1 vez. Nunca zero, nunca duplicado.**

## 2.2 Áreas da Home conferidas uma a uma

`next-area` · `h-grupo-area` · `h-ai-area` · `h-lideranca-area` · `h-comunidade-area` · `h-diretoria-area` — **todas presentes**.

## 2.3 Sem regressão nas baterias existentes

| Bateria | Resultado |
|---|---|
| `autoTesteFase4()` — invariantes do app | **0 falhas de 11** |
| `autoTesteMutirao()` — camada de serviços | **0 falhas de 30** |

---

# 3. ✅ Reversibilidade — provada, não prometida

Uma constante, uma linha:

```js
const MOSTRAR_PROGRESSO_PG_HOME = false;   // troque para true e o Progresso volta
```

**Teste executado:** troquei para `true`, recarreguei, conferi; troquei de volta para `false`, recarreguei, conferi.

| Com `true` | Com `false` |
|---|---|
| Progresso volta ✅ | Progresso ausente ✅ |
| Card do grupo volta para dentro dele ✅ | Card do grupo solto na Home ✅ |
| 1 card do grupo (não duplicado) ✅ | 1 card do grupo ✅ |
| Mutirão continua ✅ | Mutirão presente ✅ |
| Ordem: âncora → Progresso → Mutirão | Ordem: âncora → Mutirão |

---

# 4. O que NÃO foi removido

| Item | Situação |
|---|---|
| `renderPgProgressHome()` | **inteira no arquivo** — ganhou um `return` na primeira linha quando a chave é `false` |
| CSS `.pg-progress-*` | **intacto** |
| `getPgWeekMetas`, `getPgGroupWeek`, `getPgEngajamentoSemana`, `getPgGrupoLevel`, `PG_GRUPO_LEVELS`, `getOrInitPgProgress`, `bumpPgProgress`, `registrarSemanaAtiva` | **intactas e ativas** — continuam sendo chamadas |
| **Coleta de dados do Progresso** | **não parou.** `bumpPgProgress` continua gravando a cada atividade |
| **Painel do Tutor/Coordenador** | **não afetado** — continua exibindo nível, meta semanal e engajamento |
| **Ranking IMD** | **não afetado** — continua consumindo as mesmas funções |

## 4.1 Sobre as 11 linhas removidas no diff

São o markup do card do grupo que **saiu de dentro de `renderPgProgressHome()` e foi para `htmlCardDoGrupo()`** — relocação, não exclusão. Sem isso, o markup existiria em duas cópias e uma correção num lugar não chegaria no outro. `renderPgProgressHome()` agora chama `htmlCardDoGrupo(meuGrupo, false)` e produz exatamente o mesmo resultado de antes — confirmado no teste de reversibilidade.

---

# 5. A cor

A paleta do app não tinha laranja. Foram criadas três variáveis, seguindo a convenção existente (`--coral` / `--coral-light`):

```css
--orange: #B5541A;        /* laranja escuro */
--orange-mid: #C9691B;    /* segundo ponto do gradiente */
--orange-light: #FBEADF;  /* fundo dos números */
```

- **Contraste 4,95:1** com texto branco — acima do mínimo de 4,5:1 para acessibilidade.
- Distante o bastante do `--coral` (`#C0392B`, usado para alertas) para não ser lido como erro.
- O card usa **a mesma forma** dos demais da Home: mesma margem, mesmo raio, mesma borda, mesmo cabeçalho em gradiente com conteúdo expansível por `toggleSection`. Só a cor muda.

---

# 6. Alterações, uma a uma

| # | Onde | O quê |
|---|---|---|
| 1 | `:root` | 3 variáveis de cor laranja |
| 2 | CSS | bloco `.mutirao-*` (espelha `.pg-progress-*`) |
| 3 | antes de `renderPgProgressHome` | `MOSTRAR_PROGRESSO_PG_HOME` + `htmlCardDoGrupo()` |
| 4 | `renderPgProgressHome()` | `return` quando a chave é `false`; usa `htmlCardDoGrupo()` |
| 5 | `renderGruposBtnHome()` | renderiza o card do grupo quando o Progresso está oculto |
| 6 | após `renderGruposBtnHome` | `renderMutiraoBtnHome()` |
| 7 | sequência da Home | chamada de `renderMutiraoBtnHome()` |

---

# 7. ⚠️ Ressalvas honestas

1. **O card ainda não registra nada.** Ele exibe os totais e expande; a tela de registro de entregas é a FASE 4. Quem tocar hoje vê os números, não um formulário.
2. **Os dados são locais.** A camada da FASE 2 grava só no aparelho. A sincronização depende da decisão em aberto (Opção 1 × Opção 2 da FASE 1 §2) — **duas pessoas do mesmo PG ainda não veem as entregas uma da outra.**
3. **A verificação usou um participante simulado.** Em modo de teste não há inscrição real, então a Home foi montada com `loadMeuGrupo()` forjado. A estrutura foi conferida no DOM e visualmente; o caminho real de um participante inscrito só será exercitado no R2.
4. **`kgMax = 200` continua sendo suposição minha.**

---

# 8. Situação

| | |
|---|---|
| FASE 0 · 1 · 2 | ✅ concluídas |
| FASE 3 | ✅ concluída e verificada |
| FASE 4 (tela de registro) | ⏳ próxima |
| Sincronização na nuvem | ⏳ decisão em aberto |
| `main` | 🔒 intocada em `1aafe63` |
| Produção | 🔒 nenhuma escrita |
