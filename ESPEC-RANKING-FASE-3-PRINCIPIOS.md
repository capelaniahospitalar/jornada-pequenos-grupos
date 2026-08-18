# ESPECIFICAÇÃO FUNCIONAL DO NOVO RANKING — FASE 3 (princípios de justiça)

**Data:** 18/08/2026
**Base:** `AUDITORIA-IMD-FASE-1.md` (fórmula atual) · `AUDITORIA-IMD-FASE-2-DADOS.md` (dados reais)
**Natureza:** documento de decisão. **Nenhuma fórmula final e nenhum código aqui.** Números concretos
(pesos, pisos, limiares) são da Fase 4.
**O que esta fase entrega:** o que o ranking tem de garantir, e como provar que garantiu.

---

## 0. Premissa assumida (precisa ser confirmada)

Esta especificação assume que o IMD passa a ter **dois usos distintos**:

| Uso | Público | Conteúdo | Situação |
|---|---|---|---|
| **Diagnóstico pastoral** | Tutor e Coordenador | Tudo: nota, dimensões, distribuição dos 7 critérios, PGs fracos | já existe hoje |
| **Ranking público** | Todos os PGs / divulgação | Só o que for justo e auditável publicamente | **é o que está sendo especificado** |

São coisas separadas de propósito: o diagnóstico pode apontar fraqueza porque é pastoral e privado; o
ranking público não pode expor ninguém. **Se a intenção for outra, esta especificação muda.**

---

## 1. O que significa "competição justa" entre PGs de tamanhos diferentes

> **Um ranking é justo quando a posição de um PG só pode mudar por algo que aquele PG efetivamente
> viveu — nunca pelo seu tamanho, pela data em que as pessoas se cadastraram, por quais recursos do
> aplicativo o coordenador domina, nem por dados que o sistema não tem como saber.**

Disso decorre um teste único, que vale para qualquer regra que venha a ser proposta na Fase 4:

> **Teste do espelho:** se dois PGs viveram exatamente a mesma vida discipular, eles têm de terminar na
> mesma posição — mesmo que um tenha 3 pessoas e o outro 13, mesmo que um tenha se formado há 6 meses e
> o outro há 6 dias, mesmo que um registre reuniões no app e o outro não saiba que essa tela existe.

Hoje o app **reprova** esse teste em todos os três casos: o PG 41 lidera com 1 pessoa medida de 3
(tamanho), o PG 49 é "Não Engajado" com 3 pessoas engajadas (data de cadastro), e 45 dos 50 PGs levam
zero em Regularidade (uso do app).

### 1.1 As seis propriedades formais que traduzem essa frase

Toda fórmula proposta na Fase 4 terá de satisfazer as seis. São verificáveis com os dados reais.

| # | Propriedade | Enunciado |
|---|---|---|
| **F1** | **Invariância de escala** | Se um PG dobrar de tamanho mantendo a mesma proporção de engajados, a nota não muda. Só a confiança na nota aumenta. |
| **F2** | **Monotonicidade** | Acrescentar uma pessoa que não fez nada **nunca aumenta** a nota. Acrescentar uma pessoa engajada **nunca diminui**. |
| **F3** | **Influência individual limitada** | Nenhuma pessoa isolada pode responder por mais do que uma fração declarada da nota do seu PG. |
| **F4** | **Neutralidade do dado ausente** | Dado que não existe não vira 0 nem 100. Vira "não medido", e isso tem consequência declarada. |
| **F5** | **Consistência de Pareto** | Se o PG A é igual ou melhor que o B em **todas** as dimensões, e melhor em pelo menos uma, A vem à frente. Sem exceção. |
| **F6** | **Determinismo e auditabilidade** | Mesmos dados ⇒ mesma nota, sempre. E todo número exibido tem de ser reconstruível na própria tela, sem componente oculto. |

> F6 não é novidade: é o **princípio de transparência dos indicadores** já vigente no projeto desde a
> RC4.8.1-3. O ranking público fica submetido a ele.

---

## 2. Os sete princípios, traduzidos em regra funcional

Cada princípio vira uma regra que a Fase 4 tem de implementar, e um teste que a homologação tem de rodar.

### P1 — Um participante não pode dominar o ranking

**Regra funcional.** Um PG só recebe posição no ranking quando tem um número mínimo de pessoas
efetivamente medidas (parâmetro `N_MIN`, sugerido 3). Abaixo disso o PG não recebe nota pública — recebe
o estado **"Em medição"** (§3.1). Adicionalmente, a nota de um PG pequeno é tratada com **suavização por
confiança**: quanto menos gente medida, mais a nota é puxada em direção à média do sistema, até que haja
evidência suficiente para sustentá-la sozinha.

**Por que as duas coisas juntas.** O piso sozinho cria um degrau injusto (2 pessoas = fora, 3 pessoas =
nota cheia). A suavização sozinha ainda deixaria 1 pessoa definir o topo. Juntas, resolvem: ninguém entra
sem grupo, e entrar com o mínimo não vale o mesmo que entrar com muitos.

**Teste de aceitação TA-01.** O PG 41 "FORTALEZA" (1 medível de 3 participantes) **não pode aparecer em
1º lugar**. Com a regra proposta ele sai do ranking e vai para "Em medição" — verificado com dado real.

---

### P2 — PG pequeno não pode ser automaticamente penalizado

**Regra funcional.** Tamanho nunca entra na fórmula como penalidade. Um PG de 3 pessoas em que as 3 vivem
a jornada tem de poder chegar ao topo. O que o tamanho pequeno reduz não é a nota, é a **certeza** — e
isso é tratado pela suavização de P1, que é simétrica: puxa para baixo uma nota alta pouco sustentada, e
para cima uma nota baixa pouco sustentada.

**O conflito com P1, dito abertamente.** P1 e P2 se empurram: limitar a influência de uma pessoa
necessariamente rebaixa o teto de um PG muito pequeno. A resolução adotada é: **o teto do PG pequeno não
é cortado, é adiado** — ele sobe conforme as pessoas do próprio PG forem se engajando, sem depender de
crescer. Um PG de 3 chega a 100% de cobertura com 3 pessoas engajadas; um PG de 13, com 13.

**Teste de aceitação TA-02.** O PG 16 "Lugar de Transformação" (3 participantes, 3 medíveis) tem de
continuar no ranking, classificado normalmente — e não pode ser removido só por ser pequeno.
*Verificado: com a regra proposta ele permanece classificado.*

---

### P3 — PG grande não pode ser automaticamente favorecido

**Regra funcional.** Nenhuma dimensão pode usar **soma absoluta** (total de estudos, total de orações,
total de pessoas). Toda dimensão é **proporção de pessoas** dentro do próprio PG. Isso já vale hoje e é
mantido. Adicionalmente, o índice não pode ter nenhum termo que cresça com o tamanho.

**Teste de aceitação TA-03 (medível).** Ao final, calcular a correlação entre a posição no ranking e o
número de participantes dos PGs classificados. Ela tem de ser estatisticamente indistinguível de zero.
Se for positiva, o modelo favorece grandes; se negativa, favorece pequenos. **Nos dois casos, reprova.**

---

### P4 — A carência não pode prejudicar injustamente

**O problema real, medido na Fase 2.** A carência de 7 dias hoje remove a pessoa do numerador **e** do
denominador. Isso produz dois erros opostos com a mesma regra: no PG 41 ela **esconde os inativos** e
infla a nota de 27 para 78; no PG 49 ela **esconde os ativos** e derruba a nota de 28 para 9.

**Regra funcional.** A carência deixa de ser um filtro de pessoas e passa a ser um **estado de medição do
PG**:

1. A carência **protege a pessoa**: quem entrou há poucos dias não é contado como alguém que "não fez".
2. A carência **não pode premiar o PG**: se a maior parte do PG está em carência, o PG **não é medido** —
   ele não recebe nota alta nem nota baixa, recebe o estado "Em medição".
3. Quem está em carência **mas já tem evidência** entra na medição: quando o dado existe, ignorá-lo é
   apagar um fato.

**Teste de aceitação TA-04.** Os PGs 41 (2 de 3 em carência) e 49 (8 de 8 em carência) **não podem
receber posição no ranking**, e o PG 49 **não pode aparecer rotulado como "Não Engajado"**, porque três
de seus participantes já cumprem 3 ou mais critérios. *Verificado: ambos vão para "Em medição".*

---

### P5 — Critério sem dado não pode virar zero indevidamente

**A distinção central desta especificação:**

> **Ausência por limitação do sistema ≠ ausência por escolha do PG.**
> A primeira nunca pode pontuar contra ninguém. A segunda pode — mas só se todos tiverem a mesma chance real de evitá-la.

**Regra funcional — admissão de critérios.** Um critério só pode **pontuar** no ranking público se
cumprir as três condições:

| Condição | O que significa | Situação hoje |
|---|---|---|
| **Registrável** | Existe caminho no app para a pessoa/PG registrar | Bondade: existe, mas ver abaixo |
| **Praticado** | Tem adoção mínima real no sistema (parâmetro `ADOCAO_MIN`) | Bondade **0%** dos 166 elegíveis; Regularidade **10%** dos PGs |
| **Ao alcance de todos** | Nenhum PG está impedido de cumprir por condição alheia a ele | Regularidade depende de o coordenador conhecer a tela |

Critério que não passa nas três: **continua sendo exibido no diagnóstico, mas não pontua no ranking
público, e seu peso é redistribuído entre os critérios admitidos** — nunca convertido em zero para todo mundo.

**Consequência imediata, com os dados de hoje:**
- **Ato de bondade** (0 de 166 pessoas) — não admitido. Hoje ele é um critério que ninguém pode cumprir,
  e ainda assim compõe o denominador de "3 de 7". *Fica pendente descobrir se é desuso ou defeito de tela —
  se for defeito, a decisão muda depois de corrigido.*
- **Regularidade** (5 de 50 PGs) — não admitida **enquanto** a adoção for essa. Hoje ela vale 15% do
  índice e, pior, é uma das duas chaves da categoria: na prática o rótulo "Engajado" mede se o
  coordenador registra reunião no app.

**Regra complementar — ausência controlada pelo PG.** Quando o critério for admitido e o PG simplesmente
não fez, aí sim conta como ausência. E o buraco do dia de reunião (§6, G-02) tem de ser fechado: **não
declarar um dado não pode render nota melhor do que declarar**.

**Teste de aceitação TA-05.** Um critério com 0% de cobertura no sistema não pode reduzir a nota de
nenhum PG. E o PG 40 "Conta as Bênçãos" não pode obter nota máxima de regularidade **por não ter dia de
reunião cadastrado**.

---

### P6 — Qualidade e abrangência precisam ser distinguidas

**Regra funcional.** O ranking passa a ter **dois eixos declarados e sempre exibidos juntos**:

| Eixo | Pergunta que responde | Natureza |
|---|---|---|
| **Abrangência** | *Quantos do PG estão realmente vivendo a jornada?* | proporção de pessoas |
| **Profundidade** | *Quão longe foram os que estão vivendo?* | intensidade por pessoa |

Regras de convivência entre eles:
1. Nenhum dos dois pode ser omitido do cartão publicado. Uma nota única sem os dois números ao lado é proibida.
2. Um eixo **não compensa integralmente** o outro: um PG onde uma pessoa foi longe não pode superar um PG
   onde muitos caminharam junto — isso é o caso FORTALEZA na origem.
3. A ordenação segue a Abrangência como eixo dominante (é o que "Pequeno **Grupo**" significa), com a
   Profundidade como diferencial — e o cartão deixa isso escrito, não implícito.

**Teste de aceitação TA-06.** Dado um PG com 1 pessoa muito avançada e um PG com muitas pessoas
caminhando, o segundo vem à frente — e o cartão mostra por quê, com os dois números visíveis.

---

### P7 — Todos os PGs precisam competir sob a mesma regra

**Regra funcional — cinco exigências:**

1. **Sem exceção manual.** Nenhum PG é incluído, excluído ou ajustado por decisão caso a caso. Toda
   exclusão é uma regra publicada, aplicada sobre **dado gravado** e verificável.
   *Hoje isso falha: o PG 47 "Diretoria" deveria estar fora por ser institucional, mas o campo
   `institucional` não está gravado em nenhum PG — a regra existe no código e nunca é aplicada.*
2. **Mesma janela de tempo para todos.** Um ciclo declarado (início e fim), igual para todo mundo.
   *Hoje isso falha: o índice usa "o último registro de cada pessoa, de qualquer semana" — 14 pessoas
   estão medidas pela semana atual e 109 por semanas de até 5 semanas atrás, tudo no mesmo ranking.*
3. **Regra congelada durante o ciclo.** Pesos, pisos e limiares não mudam no meio da competição. Mudança
   só vale para o ciclo seguinte, e fica registrada.
4. **Resultado congelado ao fim do ciclo.** A posição publicada tem de ser um **retrato gravado** — com
   data, versão do algoritmo e os números que a produziram. *Hoje isso não existe: o ranking é
   recalculado ao vivo e nada é guardado; um pódio publicado hoje não pode ser reconferido amanhã.*
5. **Mesma visibilidade.** Todo PG classificado vê sua própria posição e a régua completa. Ninguém
   descobre a regra depois do resultado.

**Teste de aceitação TA-07.** Recalcular o ranking do ciclo encerrado a partir do retrato gravado tem de
devolver exatamente as mesmas posições.

---

## 3. Especificação funcional do ranking

### 3.1 Estados do PG — a peça central

Todo PG está em **um** dos três estados. Só um deles compete.

| Estado | Quando | O que aparece publicamente |
|---|---|---|
| **CLASSIFICADO** | PG ativo, com pelo menos `N_MIN` pessoas medíveis, e essas pessoas sendo a maior parte do PG | Posição, nota, Abrangência e Profundidade |
| **EM MEDIÇÃO** | PG ativo, mas ainda não há base suficiente: poucas pessoas medíveis, ou maioria em carência | Aparece em lista própria, **sem posição e sem nota**, com a frase "ainda em medição" |
| **NÃO CLASSIFICÁVEL** | Sem participantes, status diferente de ativo, ou institucional | Não aparece no ranking |

**Este é o mecanismo que resolve os dois casos extremos ao mesmo tempo**, sem regra especial para nenhum
dos dois — o que é exatamente o exigido por P7.

**Simulação com os dados reais de 18/08/2026** (usando `N_MIN` = 3 e maioria = 60%):

| Estado | Qtd | Casos notáveis |
|---|---|---|
| CLASSIFICADO | **23** | inclui o PG 16 com apenas 3 pessoas (P2 respeitado) |
| EM MEDIÇÃO | **16** | inclui **41 FORTALEZA** (1 medível de 3) e **49 Limpando corações** (0 de 8 fora da carência) |
| NÃO CLASSIFICÁVEL | **11** | os 10 slots vazios `EM_FORMACAO` + o slot 50 marcado `LIVRE` |

Os 32 PGs que hoje empatam em último com nota 0 e percentil de 62% deixam de existir como categoria: ou
são medidos de verdade, ou estão declaradamente sem base para medição.

### 3.2 População medível de um PG

Em ordem:
1. Participantes **ativos** (não removidos), sem duplicata.
2. **Menos** quem está em carência **e** ainda não tem nenhuma evidência (protegido por P4).
3. **Mais** quem está em carência **mas já tem evidência** (o dado existe; ignorá-lo seria apagar um fato).
4. O PG só é CLASSIFICADO se esse conjunto tiver `N_MIN` pessoas **e** representar a maior parte dos ativos.

### 3.3 Estrutura do índice

Sem números — isto é a Fase 4. A estrutura exigida é:

```
Abrangência   = proporção de pessoas do PG com evidência de vida discipular no ciclo
Profundidade  = quão longe foram, em média, as pessoas com evidência
Nota          = combinação declarada das duas, com Abrangência dominante,
                suavizada pela confiança (nº de pessoas medidas)
Confiança     = exibida junto, nunca escondida ("nota apoiada em N pessoas medidas")
```

Só entram na composição os critérios **admitidos** por P5. Os demais aparecem no cartão como informação,
marcados como "não pontua neste ciclo" — e o motivo fica escrito.

### 3.4 Empate e desempate

Empate real é empate: mesma posição (1, 2, 2, 4), como já é hoje. O desempate segue uma ordem declarada e
publicada de antemão, e **nunca** usa sorteio, ordem alfabética ou número do slot.

### 3.5 O que é publicado

1. Só o **pódio e as categorias** — nunca uma lista completa que exponha os últimos colocados. O ranking
   público reconhece; o diagnóstico privado corrige.
2. Todo número publicado vem acompanhado da base ("5 de 8 pessoas") — exigência de F6.
3. Publicação só a partir do **retrato congelado** do ciclo (P7.4), nunca de um cálculo ao vivo.
4. Os PGs "em medição" são citados como **em formação**, com data prevista de entrada — nunca como
   perdedores.

---

## 4. Conflitos entre os princípios, e como foram resolvidos

Honestidade estrutural: os sete princípios **não são todos compatíveis ao mesmo tempo**. Três conflitos
reais e a decisão adotada:

| # | Conflito | Decisão |
|---|---|---|
| **C1** | P1 (limitar 1 pessoa) × P2 (não punir PG pequeno) | Piso de entrada + suavização por confiança. O PG pequeno não perde teto, ele o conquista conforme as próprias pessoas se engajam. |
| **C2** | P4 (carência não prejudica) × P1 (ninguém domina) | Carência vira estado do **PG**, não filtro de pessoa. PG majoritariamente novo não é medido — nem para cima, nem para baixo. |
| **C3** | P5 (sem dado ≠ zero) × P7 (mesma regra para todos) | Critério não praticado sai do cálculo **para todos**, não só para quem não o tem. Redistribuir peso caso a caso criaria regras diferentes por PG — proibido. |

---

## 5. Vetores de manipulação que a Fase 4 tem de fechar

Um ranking público cria incentivo para manipular. Os quatro caminhos abertos hoje, medidos na Fase 2:

| # | Como se ganha vantagem hoje | Fechado por |
|---|---|---|
| **G-01** | Cadastrar pessoas novas antes da medição: elas somem do denominador e a nota sobe | P4 + estado "Em medição" |
| **G-02** | **Não** cadastrar o dia de reunião: a Regularidade passa a ser só presença (PG 40 tirou 100 com 1 encontro) | P5 — não declarar não pode render mais que declarar |
| **G-03** | Registrar um único encontro com presença total | Regra de regularidade a redefinir na Fase 4 |
| **G-04** | Remover participante pouco engajado antes do fechamento — a proporção sobe | **Ainda aberto.** Exige que a remoção no ciclo seja auditável e/ou que o retrato use a população do início do ciclo. **Decisão da Fase 4.** |

Um quinto risco não é manipulação, mas contamina o resultado: **participantes sem nome real**
("Colaborador 1 a 4 (nome a confirmar)", no PG 40, sustentam o atual 3º lugar). Enquanto existirem, uma
posição de pódio pode estar apoiada em registros que ninguém consegue conferir.

---

## 6. Testes de aceitação obrigatórios da Fase 4

A fórmula proposta só será aceita se passar nos onze:

| ID | Teste | Origem |
|---|---|---|
| TA-01 | PG 41 (1 medível de 3) não lidera | P1 |
| TA-02 | PG 16 (3 pessoas) permanece classificado | P2 |
| TA-03 | Correlação entre posição e tamanho ≈ 0 | P3 |
| TA-04 | PGs 41 e 49 sem posição; PG 49 não rotulado "Não Engajado" | P4 |
| TA-05 | Critério com 0% de cobertura não penaliza ninguém; PG 40 não tira nota máxima por dado ausente | P5 |
| TA-06 | Muitos caminhando > um caminhando longe | P6 |
| TA-07 | Ranking do ciclo reconstruível a partir do retrato gravado | P7 |
| TA-08 | Acrescentar pessoa sem evidência nunca aumenta a nota | F2 |
| TA-09 | Dobrar o PG com mesma proporção não muda a nota | F1 |
| TA-10 | PG melhor em todas as dimensões nunca fica atrás | F5 |
| TA-11 | Todo número do cartão reconstruível na própria tela | F6 |

---

## 7. Parâmetros a fixar na Fase 4

Nenhum é decidido aqui. Todos precisam de valor **e** de justificativa registrada:

| Parâmetro | O que controla | Sugestão inicial |
|---|---|---|
| `N_MIN` | Mínimo de pessoas medíveis para competir | 3 |
| `MAIORIA_MEDIVEL` | % dos ativos que precisa estar medível | 60% |
| `CARENCIA_DIAS` | Proteção do recém-chegado (hoje 7) | manter 7 |
| `CRITERIOS_MIN` | Quantos critérios definem "evidência" (hoje 3 de 7) | rever — 47 pessoas estão a **um** critério do corte |
| `ADOCAO_MIN` | Adoção mínima para um critério pontuar | a definir |
| `FORCA_SUAVIZACAO` | Quanto a nota de PG pequeno é puxada à média | a definir |
| Pesos dos eixos | Abrangência × Profundidade | a definir |
| Duração do ciclo | Janela de medição | a definir |

---

## 8. Decisões que dependem de você (não posso tomar sozinho)

1. **A premissa do §0 está certa?** O ranking passa a ser público, e o diagnóstico continua privado?
2. **Qual é o ciclo?** Mês, trimestre, ou a Jornada até a Semana de Oração da Primavera? Isso define a
   janela de medição e a data do retrato congelado.
3. **PG "em medição" aparece na divulgação?** Recomendo que sim, como "em formação" — mas é escolha
   pastoral, não técnica.
4. **Regularidade (registro de reuniões): sai do ranking ou o app passa a cobrar o registro?** Com 5 de
   50 PGs registrando, manter no cálculo é medir uso do app; tirar é perder a única métrica de constância.
5. **Ato de bondade com 0 registros: é desuso ou defeito de tela?** Precisa ser verificado antes de
   decidir se sai do modelo ou se é consertado.
6. **G-04 (remover participante antes do fechamento):** aceitar o risco, ou congelar a população no
   início do ciclo?

---

*Fim da Fase 3. Nenhuma alteração de código foi feita. As simulações de estado (§3.1) foram calculadas
fora do app, apenas para verificar que as regras propostas produzem o efeito pretendido nos dados reais.*
