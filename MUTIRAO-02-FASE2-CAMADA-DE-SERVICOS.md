# MUTIRÃO DE NATAL 2026 · FASE 2 — Camada de serviços

**Data:** 2026-09-08 · **Base:** `1.3.0-rc1` · **Status:** ✅ implementada e testada
**Alteração:** `index.html` — **319 linhas inseridas, 0 removidas.** Nenhuma linha existente foi tocada.

---

# 1. O que foi criado

Um bloco único e isolado em `index.html`, entre `renderPgProgressHome()` e a seção do Mural de Gratidão.

| Função | Papel |
|---|---|
| `registrarMinhaEntregaNatal({quantidadeKg, data})` | **TIPO 1** — o participante registra a própria entrega |
| `registrarEntregaExternaNatal({nome, setor, quantidadeKg, data})` | **TIPO 2** — o Coordenador registra um colaborador externo |
| `listarEntregasNatalDoPG(pgNum, opts)` | entregas vivas do PG (tombstone filtrado por padrão) |
| `calcularTotalKgNatalDoPG(pgNum)` | `{ participantes, externos, total, entregas }` — colunas separadas |
| `anularEntregaNatal(entregaId)` | correção de erro por tombstone; **nunca apaga** |
| `validarEntregaNatal(reg)` | guardião do invariante da FASE 1 §4.1 |
| `mutiraoNormalizarKg(v)` | aceita `"2,5"`, recusa zero/negativo/texto/fora dos limites |
| `mutiraoSouCoordenadorDoPG(pgNum)` | autoridade, pelos dois caminhos que o app já usa |
| `autoTesteMutirao()` | bateria de 30 testes, sem interface |

Constantes: `MUTIRAO_KEY`, `MUTIRAO_ORIGEM`, `MUTIRAO_NATAL`.

---

# 2. Como as regras foram garantidas

> A escolha foi tornar as regras **estruturais** sempre que possível — impossíveis de violar por construção — em vez de apenas verificadas.

| Regra | Como é garantida |
|---|---|
| Participante só registra a **própria** entrega | `registrarMinhaEntregaNatal()` **não tem parâmetro de identidade**. A pessoa vem de `loadMeuGrupo()` + `getMyMemberId()`. Não existe argumento a preencher |
| Participante **não escolhe** outro participante | idem — passar `participante` na chamada é simplesmente ignorado (**M-13**) |
| Participante **não pode** registrar externo | a função fixa `tipoOrigem: PARTICIPANTE_PG` e `externo: null` **no corpo**, não a partir da entrada (**M-14**) |
| Coordenador **pode** registrar externo | `mutiraoSouCoordenadorDoPG()` — reconhece pelo registro de participante **e** pela autenticação do Painel |
| Registro fica vinculado **ao PG do coordenador** | `pgNum` vem de `loadMeuGrupo()`, nunca de parâmetro (**M-18**) |
| Coordenador **não pode** registrar externo como participante do PG | `registrarEntregaExternaNatal()` fixa `participante: null` no corpo. **Não existe caminho** de código que produza um `PARTICIPANTE_PG` com dados de externo (**M-17**) |
| Os dois tipos **jamais se confundem** | `validarEntregaNatal()` recusa as 4 combinações inválidas, e recusa **alto** (log de erro + motivo), nunca em silêncio |

---

# 3. ✅ Critério de aceite — testado

`autoTesteMutirao()` executada em navegador real, sobre a versão servida, em modo de teste isolado.

```
30 testes · 30 PASSOU · 0 FALHOU
```

| Grupo | Testes |
|---|---|
| Normalização da quantidade | M-01 … M-04 |
| **Invariante de exclusividade mútua** | M-05 … M-08 |
| Participante registra a própria | M-09 … M-14 |
| Autoridade sobre externo | M-15 … M-20 |
| **Critério de aceite da FASE 1** | **M-21 … M-23** |
| Listagem e soma | M-24 … M-26 |
| Tombstone | M-27 … M-30 |

## 3.1 A demonstração pedida

Duas entregas de **10 kg**, mesmo PG, mesmo dia, produzidas pelas funções reais:

**A — participante**
```json
{ "entregaId": "cf43664a-d93c-45c0-a2d3-677f8c3b5d00",
  "mutiraoNatal": "2026", "pgNum": 70, "pgId": null,
  "tipoOrigem": "PARTICIPANTE_PG", "quantidadeKg": 10, "data": "2026-12-05",
  "registradoPor": { "memberId": "demo-maria", "nome": "Maria da Silva", "papel": "colaborador" },
  "participante":  { "memberId": "demo-maria", "nome": "Maria da Silva" },
  "externo": null, "removed": false }
```

**B — colaborador externo**
```json
{ "entregaId": "0b8e23bb-5235-4cec-8665-992d35cb18b6",
  "mutiraoNatal": "2026", "pgNum": 70, "pgId": null,
  "tipoOrigem": "EXTERNO", "quantidadeKg": 10, "data": "2026-12-05",
  "registradoPor": { "memberId": "demo-ana", "nome": "Ana Beatriz", "papel": "coordenador" },
  "participante": null,
  "externo": { "nome": "Joao Pereira", "setor": "Farmacia" },
  "removed": false }
```

Distinguíveis por **4 marcas independentes** (`tipoOrigem`, `participante`, `externo`, `registradoPor.papel`) e por `entregaId` único.

**Soma verificada:** com 13 kg de participantes e 10 kg de externo →
`{ participantes: 13, externos: 10, total: 23, entregas: 3 }`.
Após anular a entrega externa → `{ participantes: 13, externos: 0, total: 13, entregas: 2 }`, **e o registro anulado continua no banco** (M-29).

---

# 4. Verificações de segurança

| Verificação | Resultado |
|---|---|
| Chamadas ao Firestore durante os testes | **nenhuma** — `read_network_requests` filtrado por `firestore`: vazio |
| Referência a rede no código novo | **nenhuma** — o diff não contém `fetch`, `firestore` nem `fbWriteGrupos` |
| Chave de armazenamento usada | `teste_jdpg_mutirao_natal_v1` — **isolada** |
| Chave real `jdpg_mutirao_natal_v1` | **nunca tocada** (`null` ao final) |
| Limpeza após a bateria | confirmada — nada sobrou |
| Fim de linha do arquivo | CRLF consistente (15 307 CR = 15 307 LF) |
| Diff | 319 inserções, **0 remoções** |

## 4.1 Erro de console — investigado e inocentado

Aparece no arranque, em modo de teste:

```
Firestore: gravação CANCELADA — intenção inválida: intencao ausente ou invalida
```

**Não é defeito e não é meu.** É a própria bateria `autoTesteE1()` do app, disparada por `setTimeout(autoTesteE1, 600)` na linha 15148 — que só roda **dentro de `if (MODO_TESTE)`**, nunca em produção. Ela faz de propósito uma chamada no formato antigo (posicional) para provar que o contrato a recusa alto (linha 9516). O erro no console **é a prova de que a proteção funciona**. Confirmado recarregando a página sem executar nada meu.

---

# 5. ⚠️ O que NÃO foi feito, e por quê

| Item | Motivo |
|---|---|
| **Sincronização com o Firestore** | Depende da decisão da FASE 1 §7.2 nº 10 (campo de topo `mutirao` × documento próprio `jdpg/mutirao`). Enquanto não houver decisão, a camada é **só local** — o que também garante que nada aqui possa escrever em produção |
| Qualquer interface | É a FASE 3 |
| Chamada a estas funções | Nenhuma tela do app as invoca. **O comportamento do app está inalterado** |

---

# 6. Suposições declaradas (provisórias)

Implementei com valores provisórios para não travar, e estão isolados em `MUTIRAO_NATAL` — mudar é editar uma linha:

| Suposição | Valor | Pergunta em aberto |
|---|---|---|
| Edição da campanha | `"2026"` | FASE 1 §7.1 nº 1 |
| Casas decimais | 2 (aceita `"2,5"`) | §7.1 nº 2 |
| Mínimo por entrega | 0,1 kg | §7.1 nº 2 |
| **Máximo por entrega** | **200 kg** | §7.1 nº 2 — é o valor que barra "1000 em vez de 10". **Confirme ou corrija** |
| Unidade | quilo | §7.1 nº 3 |
| Tutor registra externo | **não** — só o Coordenador, conforme a regra escrita | §7.2 nº 6 |

---

# 7. Situação

| | |
|---|---|
| FASE 0 | ✅ concluída |
| FASE 1 | ✅ contrato — 10 perguntas ainda abertas |
| FASE 2 | ✅ camada de serviços · 30/30 testes |
| FASE 3 (interface) | ⏳ bloqueada pela decisão A/B/C da FASE 0 §7 |
| Sincronização na nuvem | ⏳ bloqueada pela decisão Opção 1 × Opção 2 |
| `main` | 🔒 intocada em `1aafe63` |
| Produção | 🔒 nenhuma escrita |
