# MUTIRÃO-17 — Execução do R2-D e do R2-E parcial

**Data:** 2026-09-10, 17:35–18:40
**Bytes testados:** commit `4b9ccb2` · md5 do `index.html` `a0b7359f9c391142617512e1ac430462`
**Projeto Firebase:** `mutirao-teste-campo` (de teste, criado no mesmo dia)
**Documento sob teste:** `jdpg/mutirao/2026/1`

---

## 1. Veredicto

| Etapa | Resultado |
|---|---|
| **R2-D — simultaneidade** | ✅ **APROVADO** |
| **TC-4 — reentrada real** | ✅ **APROVADO** (executado por necessidade, não por plano) |
| Prevenção de duplicidade | ✅ observada em campo |
| Correção de entrega ("corrigir") | ✅ observada em aparelho real |
| **Produção tocada?** | ❌ **NÃO** — ver §5 |

---

## 2. R2-D — a evidência

O critério de validade (`MUTIRAO-13` §6.3, revisto em MUTIRÃO-16 / C-09) é
`mutiraoConflitos ≥ 1` lido no cliente observável.

```
+1286721 ms   cliente A   0,9 kg
+1286721 ms   cliente B   1,1 kg
                    ↑ diferença entre os dois registros: 0 ms

mutiraoConflitos no cliente A : 1     ← a trava atuou
entregas no documento          : 10   ← nenhuma perdida
total                          : 4,8 kg
```

**O que a trava fez:** os dois clientes leram o mesmo estado; B gravou primeiro; a gravação de A
foi **recusada pela pré-condição**; A releu, remesclou e regravou. As duas entregas sobreviveram.

**É a primeira vez que a trava é exercitada contra o Firestore real com dois clientes
independentes.** Até aqui ela fora provada contra servidor falso (N-16 a N-25) e, em produção, com
um aparelho simulando dois (R2-C, 09/09).

### 2.1 Rodadas anteriores, e por que falharam em disputar

| Rodada | Clientes | Δ entre registros | Conflitos | Leitura |
|---|---|---|---|---|
| 1 | celular + PC | 845 ms | 0 | serializaram |
| 3 | celular + PC | **108 ms** | 0 | serializaram |
| 4 | 2 navegadores, temporizador | 688 ms | 0 | timer estrangulado em aba de segundo plano |
| **6** | **2 navegadores, espera ativa** | **0 ms** | **1** | ✅ **disputa real** |

---

## 3. Achados que só a execução revelou

### C-12 — o R2-D, como escrito, só pode ser tentado 1× por dia

O protocolo manda `0,1 kg` nos dois aparelhos. **Da 2ª rodada em diante isso dispara a caixa de
confirmação de duplicidade** (mesma pessoa, mesmo valor, mesmo dia) — e uma caixa de diálogo no
instante crítico **destrói a simultaneidade**.

**Correção:** valores distintos por rodada e por pessoa.

### C-13 — celular + PC não conseguem disputar

O PC (rede cabeada) completa ler+gravar em ~100 ms; o celular (rede móvel) leva ~400 ms só para
ler. **O PC termina antes de o celular começar** — nunca leem o mesmo estado.

E a disputa é **inobservável**: se o celular clicar primeiro, quem colide é o celular, cujo
contador não é legível — que foi justamente o motivo do desvio C-04.

**A troca que resolveu o problema de leitura criou o problema de velocidade.**

### C-15 — temporizador de aba em segundo plano é estrangulado

`setTimeout` numa aba fora de foco atrasa até ~1 s (medido: **688 ms**). Isso sozinho serializa as
gravações.

**Técnica que funcionou:** agendar o temporizador para **5 s antes** do alvo e fazer **espera
ativa** (`while (Date.now() < T) {}`) no trecho final. A execução de JavaScript não é estrangulada,
só os temporizadores. Desvio medido: **0 ms nos dois clientes**.

⚠️ A espera ativa bloqueia a aba — chamadas de automação sobre ela expiram enquanto isso.

---

## 4. Desvio adicional declarado — variante de dois navegadores

O R2-D aprovado **não** foi executado com dois celulares (cenário original) nem com celular + PC
(desvio C-04). Foi executado com **dois navegadores no mesmo computador, em origens diferentes**
(`localhost:8099` e `http://<IP>:8099`), o que os torna clientes independentes, com armazenamento
separado, ambos observáveis.

| Preservado | Perdido |
|---|---|
| Dois clientes independentes do mesmo PG | Aparelho físico real |
| Gravação concorrente no mesmo documento | Rede móvel |
| Firestore real e regra real | Comportamento de PWA |
| Contadores observáveis nos dois lados | |

**A parte com aparelho real foi executada nas rodadas 1 a 3** (entregas preservadas, produção
intocada) — o que aquelas rodadas não puderam produzir foi a disputa.

---

## 5. Isolamento da produção — a prova

| | |
|---|---|
| `jdpg/mutirao/2026/1` **na produção** | **HTTP 404** — o documento não existe |
| Entregas da sessão | **10, todas no projeto de teste** |
| `jdpg/grupos` de produção | 70 PGs antes e depois; **nenhum participante desapareceu** |

O `jdpg/grupos` de produção mudou 3× durante a janela, e cada mudança foi investigada e
identificada como **uso normal de campo**: XP de participantes, `reunioesMes` em três PGs, e
**2 gratidões podadas** pela regra dos 7 dias — esta última fez o documento **encolher 317 bytes**,
o que à primeira vista parece perda de dados e não é.

---

## 6. O que continua em aberto

| | |
|---|---|
| **TC-3** | 🟠 BLOQUEADO — ver `AUDIT-17` e MUTIRÃO-16 §4-bis |
| **R2-E** | parcial: persistência e reentrada observadas; limpeza (§7.3) não executada |
| TC-1, TC-2, TC-1c, TC-5 | não executados |
| **Homologação** | **não concluída** |

**Este documento não autoriza merge nem publicação.** A `main` permanece em `1aafe63`.
