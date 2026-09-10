# MUTIRÃO DE NATAL 2026 · FASE 6 — Prevenção de duplicidade

**Data:** 2026-09-08 · **Base:** `1471477` (FASE 5 commitada) · **Status:** ✅ implementada e verificada
**Alteração:** `index.html` — **139 inserções, 10 remoções.** As 10 remoções são linhas alteradas no lugar (§6).

---

# 1. O princípio que guiou a decisão

> **O sistema detecta. A pessoa decide.**

Duas entregas iguais **não provam** engano: alguém pode mesmo entregar 10 kg duas vezes no mesmo dia. Um sistema que bloqueasse calado **perderia entrega legítima** — e ninguém saberia.

Por isso a camada de serviços **não recusa**: ela devolve `duplicata_possivel` com a entrega já existente, e a tela **pergunta**. Quem responde é a pessoa que está ali, olhando o próprio histórico.

## 1.1 O que conta como "a mesma entrega"

Assinatura = **mesmo PG · mesma edição · mesmo doador · mesma quantidade · mesma data**.

| Situação | É duplicata? |
|---|---|
| Maria, 10 kg, 10/12 → Maria, 10 kg, 10/12 | ✅ pergunta |
| Maria, 10 kg, 10/12 → Maria, **4 kg**, 10/12 | ❌ grava direto |
| Maria, 10 kg, 10/12 → Maria, 10 kg, **11/12** | ❌ grava direto |
| Maria, 10 kg, 10/12 → **Carla**, 10 kg, 10/12 | ❌ grava direto |
| João (externo) 20 kg 08/12 → **"joao pereira"** 20 kg 08/12 | ✅ pergunta — ignora maiúsculas |
| Entrega **anulada** de 20 kg → novo registro de 20 kg | ❌ grava direto |

Só entregas **vivas** entram na comparação: uma entrega anulada não pode impedir o registro de outra igual.

---

# 2. Participante — verificado em execução

| Passo | O que aconteceu |
|---|---|
| Registra 10 kg | ✅ *"**10 kg registrados.** Veja abaixo, no seu histórico."* · histórico mostra `08/09 — 10 kg` |
| **Reenvia o formulário com 10 kg** | ❓ Pergunta: *"Você já registrou 10 kg em 08/09. Esta é uma entrega NOVA, além daquela?"* |
| Responde **Cancelar** | ✅ **nada registrado** · continua 1 entrega · aviso: *"Nada foi registrado. A entrega anterior continua no seu histórico."* · campo limpo |
| Responde **OK** (é entrega nova mesmo) | ✅ registrada · 2 entregas · total 20 kg |

---

# 3. Coordenador — histórico dos externos

Bloco novo no Painel, **imediatamente acima do formulário**, exatamente para o que você descreveu — perceber antes de lançar de novo:

```
COLABORADORES EXTERNOS JÁ REGISTRADOS (1)

  João Pereira                  08/12        20 kg

  Confira esta lista antes de lançar —
  evita registrar a mesma entrega duas vezes.
```

E a mesma pergunta protege o lançamento:

| Passo | O que aconteceu |
|---|---|
| Lança João Pereira · 20 kg · 08/12 | ✅ registrado, e aparece na lista |
| Lança de novo o mesmo | ❓ *"Já existe uma entrega de João Pereira — 20 kg — 08/12. Esta é uma entrega NOVA, além daquela?"* |
| **Cancelar** | ✅ nada registrado · *"A entrega anterior continua na lista acima."* |
| **OK** | ✅ registrada · lista passa a mostrar as duas |

> Este bloco também fecha a lacuna que eu havia sinalizado na FASE 5 §7: antes, o Coordenador **não tinha onde ver** o que já havia lançado.

---

# 4. Testes

**11 testes novos** (M-31 a M-41), todos passando:

```
OK  M-31 repetição idêntica NÃO grava            [duplicata_possivel]
OK  M-32 devolve a entrega já existente
OK  M-33 continua com uma entrega só             [total=1]
OK  M-34 confirmada pela pessoa, a segunda é gravada  [total=2]
OK  M-35 quantidade diferente não é duplicata
OK  M-36 data diferente não é duplicata
OK  M-37 outra pessoa, mesmo valor e dia, não é duplicata
OK  M-38 externo repetido é detectado (ignora maiúsculas)
OK  M-39 outro externo, mesmo valor e dia, não é duplicata
OK  M-40 entrega anulada não bloqueia um registro igual
OK  M-41 histórico de externos mostra só os vivos  [vivos=2]
```

| Bateria | Resultado |
|---|---|
| `autoTesteMutirao()` | **0 falhas de 41** |
| `autoTesteFase4()` | **0 falhas de 11** |
| `autoTesteE1()` | **0 falhas de 27** |
| **Total** | **79 testes, 0 falhas** |

---

# 5. Sobre o identificador do colaborador externo

Você pediu para **não** inventar um cadastro complexo agora — e não inventei. O externo continua identificado só pelo nome digitado.

Consequência conhecida, nos dois sentidos:

- **Dois "João Pereira" diferentes** que entreguem a mesma quantidade no mesmo dia disparam a pergunta sem serem a mesma pessoa. Como é pergunta e não bloqueio, o Coordenador responde "sim, é nova" e segue — **nada se perde**.
- Eles também continuam contando como **1 pessoa** em "Colaboradores externos mobilizados".

O contrato da FASE 1 já reserva `externo.setor` para desempatar quando você quiser. Um campo, sem cadastro.

---

# 6. As 10 linhas removidas

Todas são **linhas alteradas no lugar**, não funcionalidade excluída:

| O que era | Virou |
|---|---|
| `function mutiraoPersistir(reg)` | `(reg, confirmarDuplicata)` |
| `registrarMinhaEntregaNatal({quantidadeKg, data})` | `+ confirmarDuplicata` |
| `registrarEntregaExternaNatal({...})` | `+ confirmarDuplicata` |
| duas cópias locais de `dataBr` | uma função só, `mutiraoDataBr()` |
| as duas chamadas de registro nas telas | passaram a tratar `duplicata_possivel` |
| mensagem *"Entrega de X kg registrada"* | *"**X kg registrados.** Veja abaixo, no seu histórico."* |

---

# 7. 🔴 O limite desta proteção — leia com atenção

**A prevenção de duplicidade só enxerga o que está no próprio aparelho.**

Como os dados ainda não sincronizam, se a mesma entrega for lançada em **dois celulares diferentes**, nenhum dos dois detecta nada: cada um acha que é o primeiro registro. E quando a sincronização entrar, as duas cópias vão se somar.

Isso não é defeito desta fase — é a mesma pendência de sempre, mas agora ela **contamina a proteção que acabamos de construir**. A prevenção de duplicidade só fica completa depois da decisão **Opção 1 × Opção 2**.

Enquanto isso, a regra prática é: **cada entrega tem um único aparelho responsável** — o participante lança a dele, o Coordenador lança os externos.

## 7.1 As outras pendências

- **Sem desfazer.** Se a pessoa confirmar por engano, o registro fica. `anularEntregaNatal()` está pronta e testada desde a FASE 2 — falta o botão.
- **`kgMax = 200`** continua sendo suposição minha.
- **Verificação com dados simulados**, como nas fases anteriores; o caminho real só no R2.

---

# 8. Situação

| | |
|---|---|
| FASE 0 · 1 · 2 · 3 · 4 · 5 · 6 | ✅ concluídas |
| Sincronização na nuvem | 🔴 **decisão Opção 1 × 2 — bloqueia a campanha e agora também a proteção da FASE 6** |
| Botão de desfazer | ⏳ recomendado |
| Campo de setor do externo | ⏳ opcional |
| `main` | 🔒 intocada em `1aafe63` |
| Produção | 🔒 nenhuma escrita |
