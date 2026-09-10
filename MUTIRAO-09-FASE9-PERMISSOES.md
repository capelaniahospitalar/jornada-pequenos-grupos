# MUTIRÃO DE NATAL 2026 · FASE 9 — Segurança e regras de permissão

**Data:** 2026-09-08 · **Base:** `65d0b22` (FASE 8 commitada) · **Status:** ✅ verificada
**Alteração:** `index.html` — **133 inserções, 0 remoções.** Só a bateria de testes: **nenhuma linha de código de produção precisou mudar.**

---

# 1. Resultado

Bateria nova `autoTesteMutiraoPermissoes()` — **20 testes, 20 passaram.**

| Bateria | Resultado |
|---|---|
| `autoTesteMutiraoPermissoes()` | **0 falhas de 20** |
| `autoTesteMutirao()` | **0 falhas de 49** |
| `autoTesteFase4()` | **0 falhas de 11** |
| `autoTesteE1()` | **0 falhas de 27** |
| **Total** | **107 testes, 0 falhas** |

---

# 2. Matriz do PARTICIPANTE

| Regra | Teste | Como é garantida |
|---|---|---|
| ✅ **Pode** registrar a própria entrega | S-01 | — |
| ✅ **Pode** ver os próprios registros, e só eles | S-02 | filtra por identidade; um colega registrou junto e não apareceu |
| ✅ **Pode** ver o resumo do seu PG | S-03 | total do PG = 13 kg, incluindo a entrega do colega |
| ❌ **Não pode** registrar por outro participante | S-04 | **estrutural** — a função não tem parâmetro de identidade |
| ❌ **Não pode** registrar externo | S-05, S-07 | `tipoOrigem` fixado no corpo + `sem_autoridade` |
| ❌ **Não pode** registrar em outro PG | S-06 | **estrutural** — o PG vem de `loadMeuGrupo()` |
| ❌ **Não pode** alterar registro de terceiro | S-08, S-09 | `sem_autoridade`; o registro do outro continua vivo e intacto |
| ✅ **Pode** corrigir a própria entrega | S-10 | é autor, então pode anular |

## 2.1 O ataque que o teste faz

O S-04/05/06 não pedem educadamente. Eles montam **uma chamada maliciosa de propósito**, com tudo ao mesmo tempo:

```js
registrarMinhaEntregaNatal({
  quantidadeKg: 3,
  participante: { memberId: 'QA-P2', nome: 'Bruno Reis' },  // registrar por outro
  tipoOrigem: 'EXTERNO',                                     // virar externo
  externo:   { nome: 'Fantasma' },
  pgNum: OUTRO,                                              // outro PG
})
```

**Resultado:** o registro nasceu como `QA-P1` (quem chamou), `PARTICIPANTE_PG`, `externo: null`, no **próprio** PG. Os quatro campos forjados foram ignorados — não porque foram checados, mas porque **a função nunca os lê**.

---

# 3. Matriz do COORDENADOR

| Regra | Teste | Como é garantida |
|---|---|---|
| ✅ **Pode** registrar externo do seu PG | S-11 | `mutiraoSouCoordenadorDoPG()` |
| ✅ O externo nasce vinculado ao PG dele | S-12 | PG vem de `loadMeuGrupo()`, não de parâmetro |
| ✅ **Pode** ver os registros do PG | S-13 | 2 de participantes + 1 externo |
| ✅ **Pode** acompanhar os totais | S-14 | 33 kg · 3 pessoas mobilizadas |
| ❌ **Não pode** transformar externo em participante | S-15 | **estrutural** — `participante: null` fixado no corpo |
| ❌ **Não pode** registrar em outro PG | S-16 | `sem_autoridade` |
| ❌ **Não pode** anular em PG onde não é coordenador | S-17 | `sem_autoridade` |
| ✅ **Pode** anular pelo mecanismo autorizado | S-18 | tombstone |
| ❌ **Não pode** apagar de verdade | S-19, S-20 | o registro **continua no banco** com `removed: true`; some das listas e dos totais |

---

# 4. 🔎 O teste que falhou — e por que era o teste, não o código

Na primeira rodada, **S-17 falhou**. Antes de mudar qualquer coisa, fui ver por quê.

**Cenário que eu tinha montado:** a coordenadora do PG 70, com o aparelho mostrando o PG 69, tentava anular uma entrega **do PG 70**.

**O que o código fez:** permitiu. E está certo — `anularEntregaNatal()` avalia a autoridade pelo **PG da entrega**, não pelo PG que a tela está mostrando. Ela É coordenadora do PG 70, logo pode anular no PG 70.

```
mutiraoSouCoordenadorDoPG(70)  →  true    (é coordenadora)
mutiraoSouCoordenadorDoPG(69)  →  false
```

**Era a premissa do meu teste que estava errada.** Refiz o S-17 para o cenário certo — uma entrega que **pertence** ao PG 69, feita por outra pessoa, que a coordenadora do 70 tenta anular. Aí sim: `sem_autoridade`.

O achado positivo disso: **a autoridade é uma propriedade do PG da entrega**, não do que o aparelho está exibindo. Trocar de tela não dá poder sobre nada.

---

# 5. Dois tipos de trava, e a diferença importa

| Tipo | Como funciona | Onde aparece |
|---|---|---|
| **Estrutural** | a função **não tem** como receber o dado. Não há o que burlar | identidade do doador, PG da entrega, tipo de origem |
| **Verificada** | a função **checa** e recusa com motivo | registrar externo, anular entrega alheia |

Sempre que deu, escolhi a estrutural. Uma checagem pode ter um caminho esquecido; um parâmetro que não existe, não.

## 5.1 Não existe função de edição

Auditei todos os caminhos que escrevem entregas no app. São **dois**:

| Caminho | O que faz |
|---|---|
| `mutiraoPersistir()` | cria um registro novo |
| `anularEntregaNatal()` | marca `removed: true` |

**Não há função que altere um registro existente.** Um valor errado não pode ser reescrito — só anulado e substituído por outro, e os dois ficam no banco. Isso não foi pedido nesta fase; é consequência do desenho da FASE 1, e vale a pena estar registrado.

---

# 6. As travas de tela também foram conferidas

Os testes acima atacam as **funções**, porque esconder um botão não é permissão — é cortesia. Mas conferi as duas camadas:

| Situação | Formulário de externo aparece? |
|---|---|
| Participante comum no Painel | ❌ não |
| Coordenador no **próprio** PG | ✅ sim |
| Coordenador olhando **outro** PG | ❌ não |
| Tela do participante | **um único campo: os quilos** — nenhum seletor de pessoa |

---

# 7. 🔴 O limite honesto desta fase

**Isto é uma bateria de permissões de uso, não uma prova de segurança contra um adversário.**

As regras vivem no aparelho. Elas impedem o engano, o atalho e o uso indevido por distração — que é o risco real numa campanha com dezenas de pessoas digitando no celular. **Elas não impedem alguém mal-intencionado**, porque neste app:

- não existe **Firebase Auth** (achado AUD-002 da auditoria RC5.0, ainda em aberto);
- a **regra do Firestore é permissiva** e a chave da API é pública, por ser um app de página única;
- quem abrir o console do navegador contorna qualquer uma destas travas.

Registrei isso como comentário no próprio código da bateria, para que ninguém leia "20 testes de segurança passaram" e conclua mais do que os testes provam.

**Segurança de verdade exigiria autenticação e regras de servidor** — decisão de arquitetura bem maior que o Mutirão, e que não vou encostar sem você pedir.

---

# 8. Pendências que continuam

| | |
|---|---|
| 🔴 **Sincronização** | decisão Opção 1 × Opção 2 |
| **Botão de desfazer na tela** | o motor está pronto e agora **provado** (S-10, S-18) — falta só o botão |
| **`kgMax = 200`** | continua sendo suposição minha |
| **Campo de setor do externo** | desempataria homônimos |
| **Verificação com dados simulados** | o caminho real só no R2 |

---

# 9. Situação

| | |
|---|---|
| FASE 0 → 9 | ✅ todas concluídas |
| Permissões | ✅ 20 testes, ambas as matrizes provadas |
| Código de produção alterado nesta fase | **nenhum** — nenhum defeito de permissão foi encontrado |
| `main` | 🔒 intocada em `1aafe63` |
| Produção | 🔒 nenhuma escrita |
