# ESPEC — IMD v2.1: Capilaridade Ponderada, Alcance e Participação Regular

**Estado:** **aprovada pelo usuário em 2026-08-19.** A Etapa A (histórico semanal) está
implementada; as Etapas B a E seguem pendentes e **o cálculo em produção não foi alterado**.
**Data:** 2026-08-19
**Origem:** decisão do usuário nesta data, a partir do diagnóstico do caso PG 41 FORTALEZA.

---

## 1. Princípio reitor

> O IMD não deve premiar quem consegue produzir a maior porcentagem com poucas pessoas. Deve
> reconhecer grupos que combinam profundidade, regularidade, missão e capacidade de envolver o
> maior número possível de pessoas.

Esta frase é do usuário e é o critério de aceitação desta especificação: qualquer fórmula proposta
aqui que a contrarie está errada, mesmo que produza números bonitos.

---

## 2. O problema que motivou a revisão

### 2.1 O caso concreto (dado real de produção, leitura em 2026-08-19)

O PG 41 "FORTALEZA" aparecia em **1º lugar** com IMD 78, enquanto o próprio app o classificava como
**"Baixo Engajamento"** — duas afirmações contraditórias sobre o mesmo grupo, no mesmo painel.

| Pessoa | Dias no grupo | Elegível? | Indicadores |
|---|---|---|---|
| Glícia Lima de Souza Marinho | 13 | sim | 6 de 7 |
| Janaina da glória brito Mendonça | 5 | não (carência) | 0 |
| Victor Hugo vannier Velasque | 5 | não (carência) | 1 |

O grupo tem três pessoas. Duas estavam dentro da carência de 7 dias, então o denominador virou 1 —
e 1 de 1 resultou em 100% de Capilaridade.

**Observação importante para a leitura pastoral:** a participante Glícia cumpre 6 dos 7 indicadores.
Ela é genuinamente uma das pessoas mais engajadas do sistema. O defeito não está no comportamento
dela nem do grupo — está na aritmética de um percentual sobre denominador mínimo.

### 2.2 O problema estrutural, maior que o caso

Corrigir só o FORTALEZA seria remendo. O defeito é estrutural:

- **21 dos 37 PGs com elegíveis têm 4 pessoas elegíveis ou menos.** Nesses grupos, uma única
  pessoa move a Capilaridade entre 25 e 100 pontos.
- Um percentual sobre 1–4 pessoas é volátil por natureza: o índice muda sem que ninguém mude de
  comportamento. O próprio FORTALEZA cairia sozinho de 100% para 33% em dois dias, quando os dois
  participantes novos saíssem da carência.
- A régua atual, medindo só proporção, **favorece estruturalmente o grupo pequeno** e penaliza o
  grupo grande que se esforça para engajar mais gente.

### 2.3 Contexto de maturidade do sistema

O PG com mais pessoas ativas em todo o sistema tem **5 pessoas ativas**. Nenhum grupo está perto de
"muita gente engajada". Isso não invalida a régua, mas informa o que se pode concluir dela hoje —
ver seção 9.

---

## 3. Dimensões e pesos (o que muda e o que não muda)

| # | Dimensão | Peso | Muda nesta versão? |
|---|---|---|---|
| 1 | **Capilaridade Ponderada** | 30% | **SIM** — deixa de ser só proporção |
| 2 | **Engajamento Coletivo** | 25% | **SIM** — 5 indicadores, bondade separada de gratidão |
| 3 | Missão Coletiva | 20% | não |
| 4 | Regularidade | 15% | não |
| 5 | Profundidade | 10% | não |
| 6 | Evolução | 0% | não (segue reservada, falta histórico) |

Os pesos entre dimensões **não mudam**. A mudança está dentro das dimensões 1 e 2.

---

## 4. Dimensão 1 — Capilaridade Ponderada (30%)

### 4.1 Os dois fatores

**Proporção** — percentual de participantes elegíveis com participação regular.
Responde: *que fatia do grupo está de fato caminhando?*

**Alcance** — número absoluto de participantes com participação regular, comparado a uma
referência fixa.
Responde: *quantas vidas estão efetivamente sendo alcançadas?*

```
proporcao = regulares / elegiveis * 100
alcance   = min(regulares / ALCANCE_REFERENCIA, 1) * 100
```

### 4.2 A combinação: média geométrica

```
capilaridadePonderada = raiz_quadrada(proporcao * alcance)
```

**Por que média geométrica e não média simples.** A média geométrica não permite que um fator
compense o outro: se o alcance é baixo, uma proporção alta não salva a nota, e vice-versa. É a
tradução matemática exata do princípio reitor da seção 1 — e é o mesmo raciocínio que o projeto já
adotou em 2026-07-23 ao definir que "nenhuma dimensão compensa capilaridade baixa", agora aplicado
um nível abaixo, dentro da própria Capilaridade.

**Registro explícito da motivação (palavras do usuário, 2026-08-19):** a média geométrica *não* foi
escolhida para "tirar o FORTALEZA do ranking". Foi escolhida porque traduz matematicamente o
princípio pastoral já definido — um grupo não deve compensar alcance muito baixo com uma
porcentagem excepcionalmente alta. A saída do FORTALEZA do topo é **consequência** da regra, não
seu objetivo. Esta distinção importa para a governança: o projeto proíbe ajustar a régua para
produzir resultado conveniente, e é a ordem dos fatores (princípio → fórmula → resultado) que
mantém esta mudança do lado certo dessa linha.

### 4.2.1 Exemplos de referência

**PG com 2 ativos em 2 elegíveis**
- Proporção = 100%
- Alcance = 2/8 = 25%
- Capilaridade Ponderada = √(1,00 × 0,25) = **50%**

**PG com 6 ativos em 10 elegíveis**
- Proporção = 60%
- Alcance = 6/8 = 75%
- Capilaridade Ponderada = √(0,60 × 0,75) ≈ **67%**

O segundo grupo, embora tenha proporção menor, demonstra alcance discipular muito maior — e a régua
passa a reconhecer isso.

### 4.3 Evidência: simulação com dado real (2026-08-19, somente leitura)

Top 3 sob cada fórmula candidata, com os dados de produção do dia:

| Fórmula | 1º | 2º | 3º | Posição do FORTALEZA |
|---|---|---|---|---|
| Só proporção (**atual**) | FORTALEZA | PG Capelania | Serviço social | **1º** |
| Média 60/40 | Serviço social | FORTALEZA | PG Capelania | 2º |
| Média 50/50 | Serviço social | Gestão de almas | PG Capelania | 4º |
| **Média geométrica** | **Serviço social** | **Gestão de almas** | **PG Capelania** | **fora do top 6** |

Só a média geométrica resolve o caso de regressão. As médias aritméticas apenas o atenuam.

Resultado com média geométrica (referência = 8):

| PG | Ativos / Elegíveis | Proporção | Alcance | Capilaridade Ponderada |
|---|---|---|---|---|
| 6 — Serviço social | 5 / 7 | 71% | 63% | **67** |
| 8 — Gestão de almas | 5 / 10 | 50% | 63% | **56** |
| 1 — PG Capelania | 3 / 4 | 75% | 38% | **53** |
| 24 — CONEXÃO REAL | 3 / 6 | 50% | 38% | **43** |
| 5 — Manutenção da Fé | 3 / 9 | 33% | 38% | **35** |
| 41 — FORTALEZA | 1 / 1 | 100% | 13% | **35** |

O "Gestão de almas" (11 pessoas, 5 ativas), que estava em 7º, passa a 2º. É a correção pastoral
que se buscava.

### 4.4 Sensibilidade ao parâmetro de referência

Testado com ALCANCE_REFERENCIA em 4, 5, 6, 8 e 10:

- A **ordem do topo é estável** em todos os valores (Serviço social sempre em 1º).
- O FORTALEZA **não aparece no top 5 em nenhum** dos valores testados.
- O parâmetro altera a escala dos números, não quem está à frente.

Conclusão: o parâmetro é menos sensível do que aparenta, mas continua sendo uma decisão explícita —
ver seção 8.

### 4.5 Exibição obrigatória

Pelo princípio de transparência do projeto (RC4.8.1-3: todo percentual exibido deve ser 100%
auditável na tela), o painel deve mostrar **os dois fatores separados**, não só o resultado:

> Capilaridade Ponderada **56** — proporção 50% (5 de 10) · alcance 63% (5 de 8 de referência)

Nunca exibir apenas o número final.

---

## 5. Participação Regular (novo critério de "ativo")

### 5.1 Definição — e a distinção entre elegível e ativo

Decisão do usuário (2026-08-19): **elegível e ativo não são a mesma coisa e não devem ser
confundidos.** As duas definições passam a ser:

> **Participante elegível:** membro do PG há pelo menos 7 dias e não removido.
>
> **Participante ativo:** participante elegível que demonstra participação em **duas ou mais
> semanas distintas** da Jornada.

Elegibilidade é uma condição de *cadastro* — quem já está no grupo tempo suficiente para ser
contado. Atividade é uma condição de *comportamento ao longo do tempo*. Todo ativo é elegível;
nem todo elegível é ativo.

Isso substitui o critério atual ("cumpriu 3 dos 7 indicadores", sem nenhum recorte temporal), que
tinha um defeito conceitual: quem fez alguma coisa uma única vez ficava classificado como ativo
**permanentemente**. Com a nova definição, quem participa numa semana e desaparece na seguinte
deixa de ser ativo, e a proporção do grupo reflete essa irregularidade.

### 5.2 Por que hoje é impossível medir

O `contrib` do participante guarda **uma única semana** (`weekKey` + contadores) e é substituído
quando a semana vira — está escrito no próprio código (`index.html:11465`): *"contrib não guarda
histórico, só a última semana em que a pessoa agiu"*.

Não há como reconstruir o passado. Decisão do usuário: **não tentar reconstruir**.

### 5.3 Estrutura de dado — IMPLEMENTADA (Etapa A, 2026-08-19)

```
p.progresso.semanasAtivas = ['2026-W34', '2026-W35', ...]
```

- Gravada em `registrarSemanaAtiva()`, chamada de `bumpPgProgress()` — ou seja, quando o
  participante registra estudo, oração, bondade, gratidão ou missão semanal.
- Sem duplicatas; limitada às 26 semanas mais recentes (`SEMANAS_HISTORICO_MAX`), meio ano.
- Fica **dentro** de `dados`, já permitido pela regra do Firestore — **confirmado**, não exige
  mudança de allowlist.
- **Custo medido em 2026-08-19:** `dados` = 104.881 caracteres; pior caso desta lista com 200
  participantes = +57 mil, chegando a ~162 mil. Limite: 500.000. Folga confortável.
- **Nenhum cálculo, nota, ranking, categoria ou tela lê este campo.** Verificado por busca: as
  únicas três ocorrências de `semanasAtivas` no arquivo estão dentro da própria função que grava.

**Armadilha para as etapas seguintes:** o `getISOWeekPg()` não preenche a semana com zero à
esquerda — gera `2026-W5`, não `2026-W05`. Comparar ou ordenar essas chaves como texto dá resultado
errado (`2026-W9` > `2026-W10`). Para a Etapa A isso é inofensivo, porque só há acréscimo ao fim da
lista e contagem de itens distintos. **Quem implementar a Etapa D precisa tratar isso** — ou
normalizando na leitura, ou passando a gravar com dois dígitos e migrando o que já existe.

### 5.4 Regra de transição (ponto que exige decisão)

Ligando o histórico hoje, **nenhum participante terá 2 semanas registradas antes de ~2 semanas**, e
a Capilaridade de todos os PGs iria a zero nesse período. Isso é inaceitável na prática.

**Proposta:** enquanto o histórico do participante tiver menos de 2 semanas de cobertura, aplicar o
critério antigo (3 dos 7 indicadores na última semana registrada). A troca acontece por participante,
automaticamente, à medida que o histórico amadurece — sem data de corte manual e sem período cego.

O painel deve indicar quantos participantes já estão sob o critério novo, para que ninguém leia
uma métrica em transição como se fosse definitiva.

---

## 6. Dimensão 2 — Engajamento Coletivo (25%)

Passa de 3 para **5 indicadores**, cada um medido como percentual de elegíveis que o cumprem, e a
nota é a média deles:

| Indicador | Situação técnica |
|---|---|
| 🙏 Pedidos de oração | já sincronizado |
| ❤️ **Atos de bondade** | já sincronizado — **separado da gratidão** |
| 🙌 Gratidões registradas | já sincronizado — **separado da bondade** |
| 🎯 Missão semanal | já sincronizado |
| 🤝 **Companheiro de Jornada** | **já sincronizado** (`p.compParceiro`) — nunca havia sido usado |

**Mudança em relação ao atual:** hoje bondade e gratidão contam como um item só (`bondades > 0 ||
gratidao > 0`), o que apaga a diferença entre quem faz as duas coisas e quem faz uma. Passam a ser
indicadores independentes, por decisão do usuário.

**Linha de base do Companheiro:** 12 de 200 participantes têm companheiro registrado (6%). Sinal
baixo, mas real — e é exatamente o comportamento que a Capelania quer estimular.

---

## 7. O que fica de fora, e por quê

### 7.1 Diário Espiritual — fora, por decisão pastoral

O diário nunca sai do aparelho, e a tela de privacidade do app promete isso à pessoa. Decisão do
usuário: **não entra no cálculo enquanto continuar deliberadamente privado.**

Reavaliação futura possível, e só ela: sincronizar **apenas a data do último preenchimento**, nunca
o conteúdo — mediria constância sem que uma linha escrita saia do aparelho. Se um dia for adotado,
entra na dimensão Profundidade, não no Engajamento.

### 7.2 Arquitetura da Vida — fora por ora, por limitação técnica

O app sabe se a pessoa fez (`ST.missionsDone` contém `arqvida_sem_*`), mas para a nuvem sobe apenas
a **quantidade** de missões concluídas (`index.html:5901`), não quais. Não há como distinguir a
Arquitetura da Vida de qualquer outra missão.

Correção necessária antes de incluir: sincronizar a marca dessa missão específica. Pequena, mas é
mudança no que o app grava — não entra nesta especificação.

### 7.3 Presença física e Desafios do Discipulado

Continuam fora, como já apontado na auditoria de 18/08. Não há coleta.

---

## 8. Parâmetros que exigem decisão explícita (não implementar sem)

| Parâmetro | Valor | Estado |
|---|---|---|
| `ALCANCE_REFERENCIA` | **8** | **Decidido, com ressalva** — ver abaixo |
| `SEMANAS_PARA_REGULAR` | 2 | Decidido pelo usuário |
| `SEMANAS_HISTORICO_MAX` | 26 semanas | Implementado; só limite de armazenamento, sem efeito no cálculo |
| Limiares de categoria | inalterados | Marcados como "linha de base, não homologados" desde a RC3.5.3. Recalibrar só após a Fase 1 |

**Sobre o valor 8 — registro literal da decisão do usuário (2026-08-19):**

> `ALCANCE_REFERENCIA = 8`, definido como **parâmetro inicial de calibração pastoral, sujeito à
> revisão após o primeiro ciclo de dados históricos.**

O usuário fez questão de registrar assim para **evitar que um número arbitrário vire uma "verdade
matemática"**. Não é uma constante descoberta; é uma escolha pastoral provisória — quantas pessoas
ativas a Capelania considera "alcance pleno" para um Pequeno Grupo.

A simulação de 2026-08-19 sustenta essa provisoriedade sem risco: testado com 4, 5, 6, 8 e 10, a
ordem do topo permanece estável e o FORTALEZA não aparece no top 5 em nenhum valor. O parâmetro
mexe na escala dos números, não em quem está à frente. Revisá-lo depois **não invalida** as
conclusões tomadas agora.

---

## 9. Decisão sobre publicação (tomada pelo usuário em 2026-08-19)

**Não publicar ranking geral dos 5 melhores PGs agora.** O sistema é jovem demais: o grupo com mais
gente ativa tem 5 pessoas. Um ranking público hoje separaria quem usa o aplicativo de quem não usa,
não quem está discipulando mais.

Sequência combinada:

1. **🟢 PGs em destaque** — reconhecimento dos grupos que atingiram determinado nível de
   engajamento, sem posições nem competição.
2. **🏆 Ranking da Jornada Discipular** — só quando houver histórico suficiente e a régua estiver
   homologada.

---

## 10. Plano de implantação sugerido (em etapas, cada uma homologável)

Ordem definida pelo usuário em 2026-08-19:

| Etapa | O que faz | Estado |
|---|---|---|
| **A** | 📥 Registrar histórico semanal — **sem alterar ranking, notas ou telas** | ✅ **IMPLEMENTADA** em 2026-08-19 |
| B | Implementar Capilaridade Ponderada (+ exibição dos dois fatores) | pendente |
| C | Separar bondade e gratidão | pendente |
| D | Incorporar os novos indicadores mensuráveis (Companheiro, e Arquitetura da Vida se sincronizada) e a troca para Participação Regular, com a regra de transição da seção 5.4 | pendente — precisa de ~2 semanas de dado da Etapa A |
| E | Recalibrar e homologar o ranking | pendente — só após a Fase 1 |

**Por que a Etapa A foi separada e feita de imediato.** É a única com urgência real: cada semana
que passa sem esse registro é informação que **jamais poderá ser recuperada**. Ela não altera
nenhum cálculo, nota ou tela — só acumula. Isso preserva integralmente a governança da Fase 1 (que
proíbe mudança de fórmula) e, ao mesmo tempo, para a perda de histórico.

**Consequência positiva registrada pelo usuário:** quando o ranking finalmente for publicado, ele
não será "quem mais clicou no aplicativo", mas uma medida construída sobre **alcance +
participação + engajamento + missão + regularidade + profundidade**.

---

## 11. Riscos e o que NÃO fazer

- **Não ativar o motor v3** que está escrito e inerte no `index.html`. Esta especificação é sobre o
  v2, que é o motor oficial.
- **Não recalibrar limiares de categoria** junto com esta mudança. Misturar as duas coisas torna
  impossível saber o que causou o quê.
- **Não ajustar fórmula para produzir resultado pastoralmente conveniente** — regra de governança
  vigente do projeto. As mudanças aqui são justificadas por defeito estrutural documentado, não por
  insatisfação com o resultado.
- **Não publicar ranking durante a transição** da etapa D, quando parte dos participantes estará sob
  um critério e parte sob outro.

---

## 12. Relação com a governança vigente

A regra da Fase 1 (até ~2026-09-03) proíbe mudança de fórmula, **exceto correção de defeito real**.
Esta especificação se divide nos dois lados dessa linha, e a distinção deve ser consciente:

- **Correção de defeito:** a Capilaridade Ponderada — o caso FORTALEZA está registrado na auditoria
  de 18/08 como regressão permanente.
- **Evolução de construto:** os indicadores novos do Engajamento Coletivo e a Participação Regular —
  pertencem à homologação que está congelada aguardando avaliação pastoral (Fase 7B).

**Decisão do usuário (2026-08-19):** aprovar a especificação **sem alterar o cálculo em produção**.
Só a Etapa A foi implementada, e ela não é mudança de fórmula — é coleta de dado. A exceção da
Fase 1 **não foi aberta**. As Etapas B a E entram depois, pela porta da homologação normal.

---

## 13. Verificação da Etapa A (2026-08-19)

Testado no servidor local com `?teste=1` (leitura e escrita no Firebase bloqueadas). Nenhuma
gravação alcançou produção: 12 escritas bloqueadas registradas, zero chaves fora do prefixo
`teste_`, e a execução se deu em `localhost`.

| Teste | Resultado |
|---|---|
| Primeira semana registrada em participante sem `progresso` | ✅ |
| Mesma semana registrada duas vezes | ✅ não duplica |
| Semanas diferentes acumulam em ordem | ✅ |
| `xp`, `streak` e `contrib` preservados | ✅ intactos |
| Limite de 26 semanas | ✅ mantém as mais recentes |
| Participante nulo / semana nula | ✅ não quebra |
| Ação real do app (`bumpPgProgress`) grava e persiste | ✅ |
| Algum cálculo lê `semanasAtivas`? | ✅ **nenhum** |

Diff da Etapa A: **22 linhas acrescentadas, nenhuma linha existente alterada.**
