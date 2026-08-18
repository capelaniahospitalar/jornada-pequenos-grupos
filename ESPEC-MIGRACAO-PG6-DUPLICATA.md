# ESPECIFICAÇÃO DE MIGRAÇÃO — Consolidação de cadastro duplicado (PG 6)

> ## ⚠️ ESTA ESPECIFICAÇÃO **NÃO FOI EXECUTADA**
> Documento autorizado a existir; a operação **não** está autorizada a rodar. Nenhum dado de
> produção foi alterado. A execução exige autorização explícita, em momento próprio, fora da
> Fase 7.

**Data:** 18/08/2026 · **Origem:** achado D-08 (Fase 2), evidência conclusiva no Anexo B da Fase 6
**Alvo:** PG 6 "Serviço social" · **Pessoa:** Ketellen Guedes
**Ordem obrigatória:** preservar histórico → consolidar → validar → neutralizar duplicata

---

## 1. O caso

Uma mesma pessoa possui dois cadastros no PG 6:

| | **A — abandonado** | **B — vivo** |
|---|---|---|
| Nome | `Ketelllen Guedes` (3 "l") | `Ketellen Guedes` |
| WhatsApp | `5521993558217` | `5521993558217` |
| memberId | `02e83f75-bb3c-4a5c-9296-0df2ea494d0a` | `54d80ba8-95e4-4d50-aa21-c5a31a237b1b` |
| ts (inscrição) | 29/07/2026 13:46:15 | 29/07/2026 14:51:50 |
| XP | 120 | 405 |
| Estudos concluídos | 0 | 2 |
| Sequência | 0 | 1 |
| Última atualização | 29/07/2026 | 12/08/2026 |
| `embaixadores["2026-07"]` | **participou ✔** | ausente |
| Critérios cumpridos | 1 | 3 |

**Decisão de identidade (já homologada):** é a mesma pessoa. **B é o registro vivo; A é o abandonado.**

**Único dado que existe em A e não em B:** a participação nos **Embaixadores de julho/2026**.
É isso, e somente isso, que precisa ser preservado.

---

## 2. Escopo — o que fazer e o que NÃO fazer

**Fazer:**
1. Copiar `embaixadores["2026-07"]` de **A** para **B**.
2. Neutralizar **A** por *tombstone* (`removed: true`), nunca por exclusão direta.

**NÃO fazer — cada item abaixo inventaria ou destruiria dado:**

| Não fazer | Por quê |
|---|---|
| Somar os XP (120 + 405) | XP é placar de um registro, não fato do mundo. Somar cria um número que a pessoa nunca teve. |
| Somar estudos, sequência ou `missoesConcluidas` | Mesmo motivo. B já reflete a jornada real e continuada. |
| Renomear B para "Ketelllen" | O Mural (`gratidoes`) atribui autoria **por string de nome**. Existe uma gratidão de autoria `Ketellen Guedes` no PG 6; renomear a órfãozaria. |
| Apagar A do array de participantes | Um aparelho com cópia antiga **ressuscitaria** o registro no próximo merge. O tombstone existe exatamente para isso. |
| Corrigir a causa (`buscarCadastroExistente`) junto | É a dívida `IDENT-02`, correção independente. |
| Aproveitar para mexer em qualquer outro PG | Escopo é um registro, num PG. |

---

## 3. Pré-condições

1. **Autorização explícita** para executar (não concedida até esta data).
2. **Backup íntegro** do documento: `GET` completo salvo em arquivo, com `updateTime` anotado.
3. **Janela de baixo uso** — a operação é uma escrita de documento inteiro; alguém usando o app ao
   mesmo tempo pode gerar conflito.
4. **Estado conferido na hora**: os dois registros ainda existem, com os mesmos `memberId`.
   *Estado verificado em 18/08/2026: documento com `updateTime` `2026-08-18T14:20:44.779396Z`,
   277.655 bytes, 50 PGs, ambos os registros presentes.*

---

## 4. Riscos específicos desta operação

**⚠️ A proteção de persistência publicada em 18/08 NÃO cobre esta operação.** Aquela proteção age
dentro do app, quando o app grava. Um `PATCH` manual no Firestore escreve o campo `dados` inteiro
por fora do app — se o payload for montado errado, **os 50 PGs são substituídos pelo que estiver
nele**. Daí a exigência de backup e de validação em cada passo.

| Risco | Mitigação |
|---|---|
| Payload incompleto apaga PGs | Montar a partir do documento lido; validar contagem = 50 antes de gravar |
| Gravação concorrente sobrescreve alguém | Usar precondição `currentDocument.updateTime` do backup |
| PATCH sem `updateMask` apaga `tutores`/`convites`/setores | Usar `updateMask.fieldPaths=dados` **e** `ts` — nunca omitir |
| Corrupção de acentuação | No PowerShell 5.1, ler/escrever com UTF-8 explícito (`-Encoding utf8`); nunca usar `Get-Content` sem encoding |
| Registro ressuscitado por outro aparelho | Tombstone (`removed:true` + `updatedAt` recente), nunca exclusão |

---

## 5. Procedimento

### Passo 1 — Backup e leitura
`GET` do documento completo. Salvar em arquivo com data no nome. Anotar `updateTime`.
**Validação:** arquivo abre, contém 50 ocorrências de `"num":`, e os dois registros do PG 6.

### Passo 2 — Preservar o histórico (consolidação)
No registro **B**, acrescentar o campo `embaixadores` com a chave `"2026-07"` copiada de **A**,
exatamente como está (`participou`, `data`, `hora`).
**Não** tocar em nenhum outro campo de B.
**Validação:** B passa a ter `embaixadores["2026-07"].participou === true`; todos os demais campos
de B byte a byte idênticos aos do backup.

### Passo 3 — Gravar e validar
`PATCH` com `updateMask.fieldPaths=dados&updateMask.fieldPaths=ts` e precondição de `updateTime`.
**Validação obrigatória após gravar:** reler o documento e conferir
(a) 50 PGs, (b) `tutores`/`convites`/setores intactos, (c) B com o histórico de julho,
(d) A ainda presente e inalterado.

> **Ponto de parada.** Se qualquer validação falhar aqui, **restaurar o backup e parar**. O passo 4
> só começa com o passo 3 confirmado.

### Passo 4 — Neutralizar a duplicata
Marcar **A** com `removed: true` e `updatedAt` = agora (milissegundos).

**Caminho preferido:** usar a própria função de **"remover participante"** do app (disponível ao
Tutor ou Coordenador do PG 6, desde 14/08). Ela cria o tombstone no formato correto, respeita a
sincronização e passa pela proteção de persistência — é mais seguro que um PATCH manual.
**Caminho alternativo:** PATCH manual, se por algum motivo a função do app não puder ser usada.

### Passo 5 — Validação final
| Verificação | Esperado |
|---|---|
| Participantes ativos do PG 6 | **8** (era 9) |
| Registro A | `removed: true`, com `updatedAt` |
| Registro B | intacto + `embaixadores["2026-07"]` |
| Gratidão no Mural de `Ketellen Guedes` | ainda presente e atribuída |
| Total de participantes no sistema | **194** (era 195) |
| PGs no documento | **50** |
| Demais PGs | inalterados |

---

## 6. Critérios de aceitação (efeito no ranking)

Calculado com a fórmula homologada na Fase 6:

| | Antes | Depois |
|---|---|---|
| Medíveis do PG 6 | 8 | **7** |
| Com evidência | 5 | 5 |
| Abrangência | 63% | **71%** |
| IMD | 49 | **55** |
| Posição | 2º | **1º** |
| PG 1 PG - Capelania | 1º (51) | **2º** (51, inalterado) |
| Qualquer outro PG | — | **inalterado** |

Se o resultado divergir disto, a migração não fez o que deveria — investigar antes de seguir.

---

## 7. Rollback

Restaurar o campo `dados` do arquivo de backup por `PATCH`, com `updateMask` e precondição.
Como a operação toca **um** participante, o rollback é integral e sem perda: nada além deste
registro foi alterado no intervalo — desde que a janela de baixo uso tenha sido respeitada.

---

## 8. Decisões humanas ainda pendentes dentro desta migração

1. **Tombstone ou exclusão definitiva?** A especificação recomenda **tombstone** (o app o poda
   sozinho após 30 dias). Exclusão imediata só se houver motivo para não deixar rastro.
2. **A pessoa deve ser avisada?** Ela tem dois cadastros; o abandonado é o que registrou os
   Embaixadores de julho. Decisão pastoral, não técnica.
3. **Quando executar?** Recomendado **antes** do baseline final da Fase 7, para que o motor v3 seja
   comparado contra a base já correta. Se for depois, o baseline precisa ser refeito.

---

*Especificação pronta. Nenhuma etapa foi executada.*
