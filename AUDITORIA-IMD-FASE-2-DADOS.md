# AUDITORIA DOS DADOS REAIS — FASE 2

**Data da fotografia:** 18/08/2026 · Semana ISO corrente `2026-W34` · Mês corrente `2026-08`
**Natureza:** somente leitura. Nada foi alterado no app nem gravado na nuvem.
**Matriz completa (29 colunas, 50 PGs):** `AUDITORIA-IMD-FASE-2-MATRIZ.csv` (abre no Excel; separador `;`)
**Base conceitual:** `AUDITORIA-IMD-FASE-1.md` (fórmula reproduzida e validada)

---

## 1. Como os números foram obtidos

Mesmo procedimento da Fase 1: documento de produção do Firestore lido por `GET`; app publicado aberto em
modo de teste isolado (`?teste=1`, que bloqueia leitura e escrita no Firebase); dados carregados apenas na
memória do navegador; números produzidos pelas **próprias funções do app** (`classificarPgsV2`,
`getPgIMDv2`, `calcularDistribuicaoIndicadoresV2`, `contarIndicadoresV2`, `participanteElegivelV2`).

---

## 2. Matriz dos 50 PGs

Legenda: **Part** = participantes ativos · **Car** = em carência (< 7 dias) · **Eleg** = elegíveis ·
**Evid** = com Evidência de Engajamento (≥ 3 de 7 indicadores) · **Cob** = cobertura/Capilaridade
(Evid ÷ Eleg) · **Pos** = posição no ranking.
Falhas de dado: `SE` sem encontro no mês · `SC` sem coordenador · `SP` sem participante ·
`SD` sem dia de reunião · `NP` nome placeholder · `SW` participante sem WhatsApp · `SV` participante sem vínculo.

| PG | Status | Part | Car | Eleg | Evid | Cob | IMD | Pos | Categoria | Falhas |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 PG - Capelania | ATIVO | 4 | 0 | 4 | 3 | 75% | 37 | 4 | Baixo Engajamento | SE |
| 2 Foco no alto | ATIVO | 4 | 0 | 4 | 1 | 25% | 17 | 11 | Baixo Engajamento | SE |
| 3 Higienização plantão B | ATIVO | 5 | 0 | 5 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 4 Multibençãos | ATIVO | 13 | 1 | 12 | 1 | 8% | 9 | 15 | Baixo Engajamento | SE |
| 5 Manutenção da Fé | ATIVO | 9 | 0 | 9 | 3 | 33% | 19 | 8 | Baixo Engajamento | SE |
| **6 Serviço social** | ATIVO | 9 | 1 | 8 | 5 | 63% | **48** | **2** | **Engajado** | — |
| 7 Plantão B Hotelaria | EM_FORMACAO | 0 | 0 | 0 | 0 | 0% | 0 | 19 | Não Engajado | SC SE SP |
| 8 Gestão de almas | ATIVO | 11 | 1 | 10 | 5 | 50% | 30 | 7 | Baixo Engajamento | SE |
| 9 PÃO DA VIDA | ATIVO | 7 | 0 | 7 | 0 | 0% | 0 | 19 | Não Engajado | SE SW |
| 10 Primícias | ATIVO | 8 | 1 | 7 | 0 | 0% | 0 | 19 | Não Engajado | SE SW SV |
| 11 Conectados | EM_FORMACAO | 0 | 0 | 0 | 0 | 0% | 0 | 19 | Não Engajado | SC SE SP |
| 12 Deus é minha fortaleza P1 | ATIVO | 5 | 1 | 4 | 2 | 50% | 31 | 6 | Baixo Engajamento | SE |
| 13 Plantão B Hotelaria | EM_FORMACAO | 0 | 0 | 0 | 0 | 0% | 0 | 19 | Não Engajado | SC SE SP |
| 14 Portaria de Deus - P3 | ATIVO | 2 | 0 | 2 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 15 DEUS SALVA VIDA | ATIVO | 4 | 0 | 4 | 1 | 25% | 14 | 13 | Baixo Engajamento | SE |
| 16 Lugar de Transformação | ATIVO | 3 | 0 | 3 | 1 | 33% | 19 | 9 | Baixo Engajamento | SE |
| 17 Maranata | ATIVO | 12 | 0 | 12 | 2 | 17% | 19 | 10 | Baixo Engajamento | — |
| 18 Amigos | ATIVO | 4 | 0 | 4 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 19 Farol | ATIVO | 3 | 0 | 3 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 20 Cristo Vive | ATIVO | 2 | 0 | 2 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 21 Recepcionando Vidas | ATIVO | 8 | 0 | 8 | 1 | 13% | 8 | 18 | Baixo Engajamento | SE |
| 22 Farmácia da Cura | ATIVO | 1 | 0 | 1 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 23 DIAGNOSTICO DE ESPERANÇA | ATIVO | 8 | 0 | 8 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| **24 CONEXÃO REAL** | ATIVO | 6 | 0 | 6 | 3 | 50% | 37 | 5 | Eng. Moderado | — |
| 25 Limpando corações | ATIVO | 1 | 0 | 1 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 26 Conexão | EM_FORMACAO | 0 | 0 | 0 | 0 | 0% | 0 | 19 | Não Engajado | SC SE SP |
| 27 Esperança VivA | ATIVO | 1 | 0 | 1 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 28 Mãos que curam | EM_FORMACAO | 0 | 0 | 0 | 0 | 0% | 0 | 19 | Não Engajado | SC SE SP |
| 29 Ide | ATIVO | 9 | 1 | 8 | 1 | 13% | 8 | 17 | Baixo Engajamento | SE |
| 30 Auditoria pra Jesus | ATIVO | 1 | 0 | 1 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 31 Medicina | ATIVO | 3 | 2 | 1 | 0 | 0% | 0 | 19 | Não Engajado | SD SE |
| 32 Manutenção da Fé | EM_FORMACAO | 0 | 0 | 0 | 0 | 0% | 0 | 19 | Não Engajado | SC SE SP |
| 33 Alfa | ATIVO | 1 | 0 | 1 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 34 Beta | ATIVO | 6 | 0 | 6 | 1 | 17% | 17 | 12 | Baixo Engajamento | SE |
| 35 Gama | EM_FORMACAO | 0 | 0 | 0 | 0 | 0% | 0 | 19 | Não Engajado | SC SE SP |
| 36 Delta | ATIVO | 1 | 0 | 1 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 37 Plantão noite A | ATIVO | 8 | 5 | 3 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 38 Foco no Alto | EM_FORMACAO | 0 | 0 | 0 | 0 | 0% | 0 | 19 | Não Engajado | SC SE SP |
| 39 BÁLSAMO | ATIVO | 1 | 0 | 1 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| **40 Conta as Bênçãos** | ATIVO | 5 | 0 | 5 | 2 | 40% | **46** | **3** | Eng. Moderado | SD NP SW |
| **41 FORTALEZA** | ATIVO | 3 | 2 | **1** | 1 | 100% | **78** | **1** | Baixo Engajamento | SE |
| 42 Autorizados por Deus | ATIVO | 7 | 1 | 6 | 1 | 17% | 10 | 14 | Baixo Engajamento | SE |
| 43 REFUGIO ILUMINADO | ATIVO | 1 | 0 | 1 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 44 MANÁ | ATIVO | 3 | 2 | 1 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 45 Fortaleza | EM_FORMACAO | 0 | 0 | 0 | 0 | 0% | 0 | 19 | Não Engajado | SC SE SP |
| 46 HEMOGLOBINA ESPIRITUAL | ATIVO | 6 | 1 | 5 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 47 Diretoria | ATIVO | 1 | 1 | 0 | 0 | 0% | 0 | 19 | Não Engajado | SE |
| 48 Limpando corações | EM_FORMACAO | 0 | 0 | 0 | 0 | 0% | 0 | 19 | Não Engajado | SC SE SP |
| **49 Limpando corações** | ATIVO | 8 | **8** | **0** | 0 | 0% | 9 | 16 | Não Engajado | — |
| 50 Nutrição | LIVRE | 1 | 1 | 0 | 0 | 0% | 0 | 19 | Não Engajado | SE |

**Totais:** 195 participantes ativos · 29 em carência · 166 elegíveis · 34 com Evidência ·
taxa de conversão 20% · 17 PGs com pelo menos 1 pessoa com Evidência · 5 PGs registraram encontro no mês.

---

## 3. Cobertura de cada critério no sistema (base: 166 elegíveis)

| Critério | Pessoas | % dos elegíveis |
|---|---|---|
| Estudo concluído | 97 | 58% |
| Sequência (streak > 0) | 75 | 45% |
| Embaixadores no mês | 23 | 14% |
| Missão semanal | 21 | 13% |
| Oração registrada | 19 | 11% |
| Gratidão compartilhada | 16 | 10% |
| **Ato de bondade** | **0** | **0%** |

**Distribuição por número de critérios cumpridos (corte de Evidência = 3):**

| Critérios | 0 | 1 | 2 | **3** | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| Pessoas | 53 | 32 | 47 | **20** | 6 | 7 | 1 | 0 |

- 132 dos 166 elegíveis (80%) estão **abaixo** do corte.
- **47 pessoas estão a exatamente um critério** de virar "com Evidência" — é o maior grupo isolado depois do zero.
- Ninguém no sistema cumpre os 7. Uma única pessoa cumpre 6 (e é ela que sustenta o 1º lugar).

**Frescor dos dados** (semana do último `contrib` registrado, 123 pessoas têm algum):

| Semana | W34 (atual) | W33 | W32 | W31 | W30 | W29 |
|---|---|---|---|---|---|---|
| Pessoas | 14 | 51 | 33 | 16 | 3 | 6 |

Só 14 pessoas em 195 têm atividade **desta** semana. As outras 109 contam para o IMD com dados de até 5 semanas atrás.

---

## 4. Casos extremos

### 4.1 TESTE OBRIGATÓRIO — PG 41 "FORTALEZA": IMD 78 com 1 elegível

| Participante | Dias de cadastro | Elegível? | Critérios | Semana do dado |
|---|---|---|---|---|
| Glícia Lima de Souza Marinho | 12 | **sim** | 6 de 7 | 2026-W33 |
| Janaina da glória brito Mendonça | 5 | não (carência) | 0 | — |
| Victor Hugo vannier Velasque | 4 | não (carência) | 1 | 2026-W33 |

O PG tem 3 pessoas, mas é medido como se tivesse **uma**. Essa pessoa cumpre 6 dos 7 critérios, então
Capilaridade, Engajamento e Missão dão 100% cada — as três dimensões que somam 75% do peso do índice.

**Teste de sensibilidade (só para diagnóstico — nada foi alterado no app):** recalculando o mesmo PG com
os 3 participantes, ou seja, retirando apenas o efeito da carência:

| | Cob. | Engaj. | Missão | Regul. | Prof. | **IMD** |
|---|---|---|---|---|---|---|
| Como o app calcula hoje (1 elegível) | 100 | 100 | 100 | 0 | 26 | **78 — 1º lugar** |
| Com os 3 participantes | 33 | 33 | 33 | 0 | 26 | **27 — cairia para ~7º** |

**Uma regra sozinha — a carência de 7 dias — responde por 51 dos 78 pontos e pela liderança do ranking.**

### 4.2 O espelho invertido — PG 49 "Limpando corações": o mais novo e mais ativo, classificado "Não Engajado"

Os 8 participantes entraram há 3–4 dias. **Todos os 8 estão em carência**, então o PG tem **zero elegível**
e Capilaridade 0 — apesar de 3 deles já cumprirem 3, 4 e 3 critérios (seriam "com Evidência" hoje mesmo).
O PG ainda registrou 1 encontro no mês (Regularidade 63), e mesmo assim fica em 16º com IMD 9.

| | Cob. | Engaj. | Missão | Regul. | Prof. | **IMD** |
|---|---|---|---|---|---|---|
| Como o app calcula hoje (0 elegíveis) | 0 | 0 | 0 | 63 | 0 | **9 — 16º lugar** |
| Com os 8 participantes | 38 | 25 | 0 | 63 | 9 | **28 — subiria para ~6º** |

Os dois casos são a **mesma regra** produzindo efeitos opostos: no PG 41 a carência esconde os inativos e
infla a nota; no PG 49 ela esconde os ativos e zera a nota.

### 4.3 PG 40 "Conta as Bênçãos" (3º lugar) — pódio sustentado por participantes sem nome

| Participante | Dias | Elegível? | Critérios |
|---|---|---|---|
| Júlia Percia (coordenadora) | 26 | sim | **0** |
| Colaborador 1 (nome a confirmar) | 26 | sim | 5 |
| Colaborador 2 (nome a confirmar) | 26 | sim | 2 |
| Colaborador 3 (nome a confirmar) | 26 | sim | 2 |
| Colaborador 4 (nome a confirmar) | 26 | sim | 5 |

As duas pessoas com Evidência **não têm nome real cadastrado**. Além disso, o PG não tem dia de reunião
cadastrado — o que, pela fórmula, lhe deu Regularidade 100 com um único encontro no mês (ver A-05 da Fase 1).

### 4.4 PG 6 "Serviço social" (2º lugar) — duplicata não detectada que prejudica o próprio PG

Convivem "Ketellen Guedes" (3 critérios) e "Ketelllen Guedes" (1 critério, três "l"). O deduplicador só
pega nomes idênticos, então as duas contam como pessoas diferentes. Isso **aumenta o denominador** e
derruba a cobertura do PG: 5 de 8 (63%) em vez de 5 de 7 (71%). Se corrigido, o PG 6 passaria a
Capilaridade 71 — ainda abaixo do PG 41.

### 4.5 PG 37 "Plantão noite A" — PG novo praticamente invisível

8 participantes, 5 deles cadastrados há 0–1 dia. 3 elegíveis, nenhum com registro de nada. IMD 0.

### 4.6 PG 47 "Diretoria" — está no ranking e não deveria

É o PG institucional (gestão interna), que a regra `classificarPgsV2` excluiria — mas o campo
`institucional` não está gravado em **nenhum** PG. Tem 1 participante, cadastrado há 5 dias, em carência:
0 elegíveis, IMD 0, 19º lugar empatado.

### 4.7 PG 50 "Nutrição" — status incoerente

Marcado como `LIVRE` (slot livre) mas tem nome, tutor, coordenadora e 1 participante cadastrado há 5 dias.

---

## 5. Achados de dado (Fase 2)

**D-01 — O critério "Ato de bondade" tem cobertura zero em todo o sistema.**
Nenhum dos 166 elegíveis tem `contrib.bondades > 0`. O caminho existe no código (registrar vitória sobre
um Obstáculo, e a missão de serviço/amor, chamam `bumpPgProgress('bondades')`), mas em produção nunca foi
acionado. Na prática o IMD tem **6 critérios**, não 7 — e ninguém pode chegar a 7 de 7.
*Não investiguei se é falta de uso ou defeito de interface: isso exigiria abrir a tela, o que está fora do escopo desta fase.*

**D-02 — 29 pessoas (15%) estão invisíveis ao índice pela carência, concentradas em poucos PGs.**
PG 49 (8 de 8), PG 37 (5 de 8), PG 41 (2 de 3), PG 31 (2 de 3), PG 44 (2 de 3), PG 47 (1 de 1), PG 50 (1 de 1).
Nos PGs 47, 49 e 50 a carência zera o denominador inteiro. O efeito não é uniforme: **pune PG novo e
premia PG que acabou de receber gente**, dependendo apenas de quem já estava dentro.

**D-03 — 80% dos elegíveis estão abaixo do corte de 3 critérios, e 47 estão a 1 critério de distância.**
O corte em 3 é o que mais move o índice depois da carência: se fosse 2, a conversão do sistema saltaria de
20% para 49%. Isso não é recomendação de mudança — é a medida da sensibilidade do modelo a esse número.

**D-04 — Os dados que sustentam o índice são majoritariamente antigos.**
Só 14 pessoas registraram algo nesta semana; 109 contam com dados de 1 a 5 semanas atrás; 54 elegíveis
nunca registraram nada (`contrib` inexistente). O IMD de hoje é, em boa parte, uma foto de julho.

**D-05 — 12 PGs (24%) não têm nenhum participante cadastrado.**
Slots 7, 11, 13, 26, 28, 32, 35, 38, 45, 48 (todos `EM_FORMACAO`, sem coordenador) — e todos entram no
ranking e nos denominadores dos indicadores gerais.

**D-06 — 45 dos 50 PGs não registraram encontro no mês.**
Só 6, 17, 24, 40 e 49 registraram. Dos 5, dois (40 e 49) têm Regularidade alta com **um único** encontro.

**D-07 — Nomes de participante que não identificam pessoas.**
"Colaborador 1 a 4 (nome a confirmar)" no PG 40 (dois deles sustentam o 3º lugar); "Refúgio iluminado"
como nome de coordenador no PG 43; nomes de uma palavra sem sobrenome ("Jorge", "Gustavo", "Gustav",
"Adriel", "Sandy", "Rayonnaira") em vários PGs — o que também torna a deduplicação por nome frágil.

**D-08 — Duplicata de pessoa por grafia diferente.**
Confirmada no PG 6 ("Ketellen"/"Ketelllen Guedes"). O PG 17 tem "Gustavo", "GUSTAVO DA SILVA ALVES" e
"Gustav" — possivelmente a mesma pessoa três vezes, o que derrubaria a cobertura do PG de 17% para até 22%.
**Não confirmei**: exige conferência humana, não dá para decidir por dado.

**D-09 — Campos de contato ausentes.**
PGs 9, 10 e 40 têm participante sem WhatsApp; o PG 10 tem participante sem vínculo (`memberId`), o que
significa que essa pessoa não consegue ser reconhecida pelo próprio aparelho.

**D-10 — Nomes de PG repetidos entre slots diferentes.**
"Limpando corações" (25, 48, 49), "Plantão B Hotelaria" (7, 13), "Manutenção da Fé" (5, 32),
"Foco no alto" (2, 38), "Fortaleza/FORTALEZA" (41, 45). Em todos os pares, um dos slots está vazio ou em
formação — e no ranking aparecem dois PGs com o mesmo nome.

---

## 6. O que a Fase 2 comprova sobre a Fase 1

| Achado da Fase 1 | Status após olhar o dado |
|---|---|
| A-01 denominador pequeno decide o topo | **Confirmado e quantificado**: 51 dos 78 pontos do 1º lugar |
| A-02 carência distorce nos dois sentidos | **Confirmado** com par simétrico: PG 41 (infla) × PG 49 (zera) |
| A-03 nota e categoria incoerentes | **Confirmado**: 1º lugar "Baixo Engajamento"; 16º "Não Engajado" com nota 9 |
| A-04 regularidade mede quem registra reunião | **Confirmado**: 45 de 50 PGs com 0 |
| A-05 não cadastrar dia de reunião dá vantagem | **Confirmado**: PG 40 tirou 100 com 1 encontro |
| A-07 indicadores sem recorte de tempo | **Confirmado e quantificado**: só 14 de 195 pessoas têm dado desta semana |
| A-09 slots vazios entram no ranking | **Confirmado**: 12 PGs sem nenhum participante |
| A-10 PG institucional não é excluído | **Confirmado**: campo não existe em nenhum PG |
| A-11 duplicatas só por nome idêntico | **Confirmado**: caso real no PG 6, suspeita no PG 17 |
| Novo | **D-01**: um dos 7 critérios (bondade) nunca foi usado por ninguém |

---

*Fim da Fase 2. Nenhuma alteração de código foi feita ou proposta. Os testes de sensibilidade são cálculos
de diagnóstico feitos fora do app, para medir o peso de cada regra — não são propostas de modelo.*
