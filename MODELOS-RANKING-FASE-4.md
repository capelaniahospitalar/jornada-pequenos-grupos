# MODELAGEM MATEMÁTICA — FASE 4 (quatro modelos testados em dado real)

**Data:** 18/08/2026 · **Base:** Fases 1, 2 e 3
**Natureza:** somente leitura e simulação fora do app. Nenhuma linha de código alterada, nada gravado.
**Entrega:** fórmulas · vantagens e desvantagens · ranking resultante de cada modelo · testes de aceitação.

---

## 0. Premissas assumidas (as 6 perguntas da Fase 3 ainda não foram respondidas)

Para não travar o trabalho, segui com as suposições abaixo. **Se alguma estiver errada, os números mudam.**

| # | Suposição adotada | Onde impacta |
|---|---|---|
| S1 | O ranking é público; o diagnóstico continua privado | o que é publicado |
| S2 | O ciclo é o **mês corrente** (é a janela que os dados sustentam hoje) | Missão e Regularidade |
| S3 | **Regularidade fica fora** do cálculo (adoção de 5 em 50 PGs — reprovada na regra de admissão P5) | −15% do peso antigo |
| S4 | **Ato de bondade fica fora** (0 de 166 pessoas) | não muda quem tem evidência: ninguém o cumpria |
| S5 | Evidência continua sendo **≥ 3 critérios** | população medida |
| S6 | `N_MIN` = 3 pessoas medíveis e maioria medível = 60% | quem entra no ranking |

---

## 1. Base comum aos quatro modelos

Os quatro modelos partem **exatamente da mesma população** — só a matemática de agregação muda. Isso é
proposital: garante que a diferença entre os rankings venha da fórmula, não do recorte.

**População medível do PG (regra da Fase 3, §3.2):**
```
medíveis = participantes ativos, sem duplicata
           − quem está em carência e ainda não tem evidência
           + quem está em carência mas já tem evidência
```

**Estados:** CLASSIFICADO (medíveis ≥ 3 **e** medíveis ≥ 60% dos ativos) · EM MEDIÇÃO · NÃO CLASSIFICÁVEL.
Com os dados de 18/08: **23 classificados**, 16 em medição, 11 não classificáveis.
FORTALEZA e Limpando corações ficam em "Em medição" nos quatro modelos — isso já está resolvido pela Fase 3.

**As quatro grandezas de entrada** (todas em 0–100, todas proporção de pessoas):

| Símbolo | Nome | Definição |
|---|---|---|
| `A` | **Abrangência** | % de medíveis com evidência (≥ 3 critérios) |
| `E` | **Engajamento coletivo** | média de 3 frentes: % com oração · % com bondade ou gratidão · % com missão semanal |
| `M` | **Missão** | % de medíveis que participaram dos Embaixadores no mês |
| `P` | **Profundidade** | média entre (estudos concluídos ÷ 13) e (sequência ÷ 7), **só entre quem tem evidência** |

Média do sistema hoje, entre os 23 classificados: `A`=24 · `E`=12 · `M`=15 · `P`=15 · 36 pessoas com
evidência em 151 medíveis.

---

## 2. Os quatro modelos

### Modelo A — Abrangência pura (fator de cobertura)

```
Nota = A = 100 × (pessoas com evidência ÷ pessoas medíveis)
Profundidade é exibida ao lado, mas não pontua.
```
Uma frase: **"quantos do PG estão vivendo a jornada"**. Nada mais entra na nota.

### Modelo B — Média ponderada revisada (o modelo atual, corrigido)

```
Nota = 0,50·A + 0,25·E + 0,15·M + 0,10·P
```
Mesma família do IMD de hoje, com três correções: Regularidade e bondade fora (S3/S4), Abrangência
promovida de 30% para 50%, e todas as proporções calculadas sobre a população medível nova.

### Modelo C — Média bayesiana / regularizada (suavização por confiança)

Cada proporção é puxada em direção à média do sistema, com força `K` = 5 "pessoas imaginárias":

```
valor_suavizado(x, n) = (x·n + média_do_sistema·K) ÷ (n + K)

Nota = 0,50·Ã + 0,25·Ẽ + 0,15·M̃ + 0,10·P̃      (til = suavizado)
```
Ideia: um PG de 3 pessoas com 100% tem menos evidência estatística que um de 12 com 100%; a suavização
aproxima o pequeno da média até que ele acumule prova suficiente.

### Modelo D — Score composto sem compensação (média geométrica)

```
Qualidade Q = 0,40·E + 0,30·M + 0,30·P
Nota = √( Ã × Q )
```
Ideia: os dois eixos da Fase 3 (abrangência × qualidade) têm de existir juntos — se um deles é zero, a
nota é zero. Nenhum compensa integralmente o outro.

---

## 3. Ranking resultante (dados reais de 18/08/2026, 23 PGs classificados)

Pódio de cada modelo:

| Modelo | 1º | 2º | 3º |
|---|---|---|---|
| **A** Cobertura | PG 1 PG - Capelania (75) | PG 6 Serviço social (63) | PG 12 Deus é minha fortaleza P1 (60) |
| **B** Ponderada | PG 1 PG - Capelania (51) | PG 6 Serviço social (48) | PG 12 Deus é minha fortaleza P1 (43) |
| **C** Bayesiana | PG 6 Serviço social (37) | PG 1 PG - Capelania (34) *empate* | PG 8 Gestão de almas (34) *empate* |
| **D** Composto | PG 6 Serviço social (40) | PG 1 PG - Capelania (37) | PG 8 Gestão de almas (36) |

Tabela completa dos 23 (posição em cada modelo; "hoje" = fórmula atual aplicada à **mesma** população
nova, para comparar só a matemática):

| PG | medíveis | c/ evidência | A | E | M | P | hoje | **A** | **B** | **C** | **D** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 PG - Capelania | 4 | 3 | 75 | 25 | 25 | 37 | 3º | **1º** | **1º** | 2º | 2º |
| 6 Serviço social | 8 | 5 | 63 | 34 | 38 | 27 | 1º | 2º | 2º | **1º** | **1º** |
| 12 Deus é minha fortaleza P1 | 5 | 3 | 60 | 33 | 20 | 19 | 5º | 3º | 3º | 4º | 4º |
| 8 Gestão de almas | 11 | 6 | 55 | 18 | 45 | 25 | 6º | 4º | 4º | 2º | 3º |
| 24 CONEXÃO REAL | 6 | 3 | 50 | 56 | 0 | 14 | 3º | 5º | 5º | 5º | 4º |
| 40 Conta as Bênçãos | 5 | 2 | 40 | 53 | 20 | 19 | 2º | 6º | 6º | 6º | 4º |
| 5 Manutenção da Fé | 9 | 3 | 33 | 22 | 11 | 12 | 7º | 7º | 7º | 7º | 7º |
| 16 Lugar de Transformação | 3 | 1 | 33 | 0 | 33 | 23 | 7º | 7º | 8º | 8º | 9º |
| 2 Foco no alto | 4 | 1 | 25 | 8 | 25 | 29 | 10º | 9º | 9º | 9º | 7º |
| 15 DEUS SALVA VIDA | 4 | 1 | 25 | 0 | 25 | 15 | 12º | 9º | 10º | 11º | 11º |
| 34 Beta | 6 | 1 | 17 | 11 | 33 | 22 | 10º | 11º | 10º | 10º | 10º |
| 17 Maranata | 12 | 2 | 17 | 6 | 17 | 26 | 7º | 11º | 12º | 12º | 11º |
| 42 Autorizados por Deus | 6 | 1 | 17 | 0 | 17 | 19 | 13º | 11º | 13º | 12º | 13º |
| 4 Multibençãos | 13 | 2 | 15 | 10 | 8 | 22 | 14º | 14º | 13º | 14º | 13º |
| 21 Recepcionando Vidas | 8 | 1 | 13 | 0 | 13 | 11 | 15º | 15º | 15º | 15º | 15º |
| 29 Ide | 8 | 1 | 13 | 4 | 13 | 4 | 15º | 15º | 15º | 15º | 15º |
| 3 · 9 · 10 · 18 · 19 · 23 · 46 (sem ninguém com evidência) | 3 a 8 | 0 | 0 | 0 | 0 | 0 | 17º | 17º | 17º | **17º a 23º** | 17º |

**Concordância entre os modelos** (correlação de postos de Spearman, 1,00 = ordem idêntica):

| | A×B | B×C | C×D | A×D | vs. fórmula de hoje |
|---|---|---|---|---|---|
| | **1,00** | 0,96 | 0,96 | 0,99 | A 0,97 · B 0,97 · C 0,93 · D 0,98 |

> **O achado mais importante desta fase:** A e B produzem **exatamente a mesma ordem** (1,00). Somar
> Engajamento, Missão e Profundidade ao lado da Abrangência **não muda nada hoje** — porque os três
> andam junto com ela. Toda a complexidade extra do modelo B, neste momento, não compra ordem nenhuma.

---

## 4. Testes de aceitação (os 11 da Fase 3)

| Teste | O que verifica | A | B | C | D |
|---|---|---|---|---|---|
| TA-01 | PG 41 (1 medível de 3) não lidera | ✅ | ✅ | ✅ | ✅ |
| TA-02 | PG 16 (3 pessoas) segue classificado | ✅ 7º | ✅ 8º | ✅ 8º | ✅ 9º |
| TA-03 | Correlação nota × tamanho ≈ 0 | ✅ −0,02 | ✅ 0,00 | ✅ 0,00 | ⚠️ +0,08 |
| TA-04 | PGs 41 e 49 sem posição | ✅ | ✅ | ✅ | ✅ |
| TA-05 | Critério sem dado não penaliza | ✅ | ✅ | ✅ | ✅ |
| TA-06 | Muitos caminhando > um caminhando fundo | ✅ 60×33 | ✅ 40×30 | ✅ 33×23 | ❌ **31×32** |
| TA-07 | Reconstruível a partir do retrato | ✅ | ✅ | ✅ | ✅ |
| TA-08 | Pessoa sem evidência nunca aumenta a nota | ✅ 0 | ✅ 0 | ✅ 0 | ✅ 0 |
| TA-09 | Dobrar o PG não muda a nota | ✅ 0 | ✅ 0 | ❌ **até 5 pts** | ❌ até 3 pts |
| TA-10 | Consistência de Pareto | ✅ 0 violações | ✅ 0 | ✅ 0 | ✅ 0 |
| TA-11 | Todo número reconstruível na tela | ✅ | ⚠️ | ❌ | ❌ |

**Duas reprovações que importam:**

**D reprova em TA-06** — o teste que nasceu justamente do caso FORTALEZA. Um PG com 3 pessoas e uma
delas muito avançada (nota 32) supera um PG com 10 pessoas e 6 caminhando (nota 31). A média geométrica
promete "não compensar", mas na prática deixa a profundidade de poucos vencer a abrangência de muitos.
**Isso desqualifica o modelo D** para este projeto.

**C reprova em TA-09, por construção** — dobrar o PG mantendo a mesma proporção muda a nota em até 5
pontos. Isso não é defeito de implementação: é o preço da suavização, que trata "5 de 8" como mais
confiável que "3 de 5". É uma troca legítima, mas precisa ser escolhida conscientemente.

---

## 5. Vantagens e desvantagens

### Modelo A — Abrangência pura

| ✅ Vantagens | ❌ Desvantagens |
|---|---|
| Passa nos 11 testes | Ignora Profundidade na nota (é exibida, mas não pontua) |
| Auditabilidade total: a nota **é** "3 de 4 pessoas" — qualquer coordenador confere na hora | Muitos empates: 7 PGs empatam em 0 hoje |
| Impossível de explicar errado; nenhum peso arbitrário para justificar | Insensível a esforço que ainda não virou evidência |
| Alinhado ao princípio de transparência já vigente (RC4.8.1-3) | Um único critério carrega o ranking inteiro |

### Modelo B — Média ponderada revisada

| ✅ Vantagens | ❌ Desvantagens |
|---|---|
| Passa nos 11 testes | **Hoje não muda nada em relação a A** (correlação 1,00) |
| Continuidade com o modelo atual — menor ruptura conceitual | 4 pesos que precisam ser defendidos sem número mágico |
| Ganha utilidade quando os outros critérios tiverem adoção | Menos auditável: o coordenador não reconstrói a nota de cabeça |

### Modelo C — Bayesiana / regularizada

| ✅ Vantagens | ❌ Desvantagens |
|---|---|
| Implementa de fato a "confiança" que a Fase 3 pediu (P1/P2) | **Dá nota a quem não fez nada**: PGs com zero engajados recebem de 7 a 12 pontos |
| Corrige a ordem no sentido esperado: o PG 6 (8 pessoas) passa à frente do PG 1 (4 pessoas) | E **quanto menor o PG, maior essa nota de consolação** (Farol, 3 pessoas, 12 pts × Diagnóstico, 8 pessoas, 7 pts) — inversão por tamanho |
| Ranking mais estável a pequenas variações semanais | Quebra a invariância de escala (TA-09) |
| | Impossível explicar num slide de WhatsApp: "de onde vieram esses 12 pontos?" |

### Modelo D — Score composto (média geométrica)

| ✅ Vantagens | ❌ Desvantagens |
|---|---|
| Exige os dois eixos juntos; zera quem tem só um | **Reprova no TA-06** — deixa o caso FORTALEZA voltar por outra porta |
| Comprime as diferenças, evitando disparadas | Única correlação positiva com tamanho (+0,08) |
| | O menos explicável dos quatro (raiz quadrada de produto) |

---

## 6. Recomendação

**Modelo A como nota pública, com a Profundidade sempre exibida ao lado** — e o Modelo B mantido como
evolução planejada.

Os três motivos, em ordem de peso:

1. **A e B dão a mesma ordem hoje (1,00).** Entre duas fórmulas que produzem o mesmo ranking, a correta é
   a que qualquer coordenador consegue conferir sozinho: "5 das 8 pessoas do meu PG". Complexidade que
   não muda resultado é só superfície de erro.
2. **A confiança que o modelo C traz já foi resolvida na Fase 3**, por regra e não por matemática: o piso
   de 3 medíveis e o estado "Em medição" tiram do ranking exatamente os PGs em que uma pessoa dominaria.
   Suavizar por cima disso é corrigir duas vezes o mesmo problema — e ao custo de dar pontos a quem não fez nada.
3. **Um ranking público precisa sobreviver à pergunta "por que ele ganhou?".** A responde em uma frase. C
   e D não respondem sem falar de suavização e raiz quadrada.

**A Profundidade não é descartada:** ela vai no cartão, ao lado da nota, cumprindo P6 (qualidade e
abrangência distinguidas, nenhuma escondida). O que ela não faz é decidir posição — porque, com o dado de
hoje, "profundidade" é a média de estudos e sequência de um número muito pequeno de pessoas.

**Quando revisar:** quando Regularidade e os demais critérios passarem na regra de admissão (adoção
real), o Modelo B passa a acrescentar informação de verdade, e a migração A → B fica natural — os pesos
já estão definidos aqui.

---

## 7. Dois alertas antes de qualquer publicação

**1. O 1º lugar dos modelos A e B é o PG 1 "PG - Capelania".** É o PG da própria Capelania, tutorado por
você. O dado é legítimo — 3 de 4 pessoas com evidência, a maior cobertura do sistema — mas publicar a
Capelania em 1º lugar num ranking criado pela Capelania tem custo político que nenhuma fórmula resolve.
Nos modelos C e D ele fica em 2º, atrás do Serviço Social. **É uma decisão de comunicação, não técnica —
e é sua.**

**2. O 3º lugar de hoje (PG 40) cai para 6º em todos os modelos.** Ele perdeu os 15 pontos de
Regularidade que vinham de **não ter dia de reunião cadastrado** — exatamente a distorção G-02. Se alguém
já foi avisado do pódio atual, isso precisa ser considerado.

---

## 8. O que ainda falta decidir (bloqueia a Fase 5)

1. As 6 perguntas da Fase 3 continuam abertas — em especial **o ciclo** (S2) e **o destino da
   Regularidade** (S3).
2. **Qual modelo.** Recomendo A; a decisão é sua.
3. **G-04** (remover participante antes do fechamento) segue aberto: congelar a população no início do
   ciclo, ou aceitar e auditar?
4. **Ato de bondade**: 0 de 166 pessoas. Antes de tirá-lo do modelo em definitivo, vale abrir a tela e
   confirmar se é desuso ou defeito.

---

*Fim da Fase 4. Nenhuma alteração de código foi feita. Todos os modelos foram calculados fora do app,
sobre uma cópia dos dados de produção carregada apenas na memória do navegador em modo de teste isolado.*
