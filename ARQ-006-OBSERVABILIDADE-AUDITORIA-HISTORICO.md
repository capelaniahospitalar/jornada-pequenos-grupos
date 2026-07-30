# ARQ-006 — Observabilidade, Auditoria e Histórico de Alterações (somente diagnóstico/projeto)

> Realizado em 2026-07-30, fechando o ciclo iniciado no ARQ-001. **Nenhum código foi alterado.**
> Este documento responde: quem alterou, quando, o quê, qual era o estado anterior, e por que o
> sistema se comportou de determinada forma — sempre distinguindo **log técnico** (por que o
> sistema falhou) de **auditoria de negócio** (o que mudou no domínio), como pedido.

---

## 0. A transformação que este documento provoca — dita com precisão, não como slogan

O usuário observou que, depois deste ARQ, incidentes que hoje são "bugs relatados de boca"
passam a ser eventos explicáveis. Vale mostrar isso com os casos **reais** já registrados neste
projeto, não um exemplo hipotético:

| Hoje (sem Event Log) | Depois (com Event Log de domínio) |
|---|---|
| "Coordenador perdeu os botões" (`TUTORS` ficou `null` em produção, 2x — memória do projeto) | `PG_COORDENADOR_ALTERADO { pgId: X, antes: 'Maria', depois: null, personId: null (escrita sem autor verificado), quando: ... }` — o evento mostraria exatamente quando e por qual escrita o campo foi zerado |
| "Participantes desapareceram" (Grupo 1, 2x, Grupo 22) | `PARTICIPACAO_REMOVIDA { pgId, participacaoId, personId (quem removeu), quando }` para cada saída legítima — a **ausência** de um evento correspondente para os participantes que sumiram seria, ela mesma, a prova de que não foi uma remoção normal, e sim uma sobrescrita de dado |
| "Progresso ficou desatualizado" (AUD-003) | Não é bem um "evento que faltou" — é um campo que nunca era gravado; o Event Log não cria o dado que falta, mas **teria tornado o sintoma visível muito antes**, porque a ausência de eventos `PROGRESSO_ATUALIZADO` seria óbvia no histórico |

Esta é a diferença real: não é que o Event Log "resolve" os bugs — é que ele transforma "o
participante sumiu, ninguém sabe por quê" (uma investigação manual, cara, como as duas já
feitas) em "aqui está exatamente o que aconteceu, em segundos de consulta".

---

## 1. Distinção fundamental: Log Técnico × Auditoria de Negócio

| | Log Técnico | Auditoria de Negócio (Event Log de domínio) |
|---|---|---|
| Responde | Por que o sistema falhou/se comportou assim? | O que mudou no domínio, e quem mudou? |
| Exemplo | `ERRO_FIRESTORE_WRITE_FAILED { timestamp, statusHTTP, deviceId, appVersion }` | `PARTICIPANTE_REMOVIDO { personId (quem), alvo: personId, antes: 'ativo', depois: 'removido', quando }` |
| Já existe hoje, mesmo que incompleto? | Parcialmente — `recordSync()` (index.html:8846-8859), mas só como **contadores agregados** em `localStorage`, nunca evento por evento | Não existe — nenhuma escrita de negócio gera qualquer registro do que mudou |
| Contém dado pessoal? | Raramente | Quase sempre (`personId`, indiretamente nome/WhatsApp via consulta) |
| Retenção | Curta (dias a poucos meses) — mesmo padrão de poda já usado no projeto para Mural/convites | Longa — é o histórico institucional em si |
| Quem consulta | Quem investiga um problema técnico (hoje: só quem tem acesso ao console do dispositivo) | Tutor/Coordenador do próprio PG, a própria Pessoa sobre si mesma, Administrador (ver seção 12) |
| Imutabilidade | Desejável, mas o dado é descartável | **Inegociável** — é a fonte da verdade do que aconteceu |

**Achado ao verificar o código:** o projeto já tem, sem usar, o *hook* certo para logs técnicos
por evento — `saveGruposToFirebase()` já gera um `syncId` único por tentativa de sincronização
(`const syncId = uuid().slice(0, 8);`, index.html:9163), usado hoje só para identificar mensagens
de `console.warn` — nunca persistido em lugar nenhum. É o mesmo padrão dos outros achados desta
série (RC5.0, Matriz de Causas Raiz): a peça já existe, só não foi conectada a um destino
persistente.

---

## 2. Event Log de Domínio — arquitetura recomendada

Vive na coleção `/auditoria`, já prevista no modelo-alvo do ARQ-004 — não é infraestrutura nova,
é a mesma migração já planejada, com um uso a mais.

```
Evento {
  eventoId,
  tipo,                 // ex.: 'PARTICIPACAO_REMOVIDA'
  personId,             // de onde? SEMPRE do authUid verificado (ARQ-003) — nunca de um
                         // campo que o próprio cliente envia
  entidade, entidadeId,
  antes, depois,        // só os campos que mudaram, não o objeto inteiro
  quando,               // timestamp do SERVIDOR, nunca do cliente
  deviceId,             // opcional, útil pra depurar concorrência entre aparelhos
  corrige: null,        // preenchido só quando este evento corrige um evento anterior
                         // registrado errado (ver seção 11) — nunca aponta pra apagar, só pra
                         // complementar a história
}
```

## 3. Eventos obrigatórios (catálogo mínimo)

Derivado diretamente das entidades já catalogadas no ARQ-002 — cada mudança de estado relevante
de uma entidade de domínio gera um evento:

`PESSOA_CRIADA` · `PESSOA_WHATSAPP_ALTERADO` (decisão já tomada no ARQ-002.1: alteração de
WhatsApp é sempre auditada) · `PARTICIPACAO_CRIADA` · `PARTICIPACAO_REMOVIDA` ·
`PARTICIPACAO_RESTAURADA` (recuperação via IDENT-01) · `PAPEL_ALTERADO` (virou/deixou de ser
Tutor/Coordenador) · `PG_CRIADO` · `PG_TUTOR_ALTERADO` · `PG_COORDENADOR_ALTERADO` ·
`SETOR_CRIADO` · `SETOR_EFETIVO_ATUALIZADO` · `CONVITE_CRIADO` · `CONVITE_UTILIZADO` ·
`COMPANHEIRO_VINCULADO` · `COMPANHEIRO_REMOVIDO` · `SINCRONIZACAO_CONFLITO_RESOLVIDO` (quando o
merge decide entre duas versões concorrentes) · `BACKUP_EXECUTADO` (ARQ-005) ·
`MIGRACAO_FASE_ALTERADA` (quando uma `FB_FLAG` de migração muda, ARQ-004.1).

**Dados mínimos em cada evento:** `personId` do autor (verificado), tipo, entidade+id afetada,
o que mudou (antes/depois — só os campos relevantes, não o registro inteiro), timestamp do
servidor. Sem esses 4, o evento não vale como auditoria — é só um log de conveniência (mesmo
alerta já registrado no ARQ-002.1/ARQ-005).

## 4. Histórico de Entidades

Não é um armazenamento à parte — é uma **consulta** sobre o Event Log (`where entidadeId ==` +
ordenar por `quando`). Criar uma segunda estrutura de dados só pra isso duplicaria a fonte da
verdade sem necessidade (mesmo princípio já aplicado no projeto: não abstrair até existir um
segundo consumidor real que justifique).

## 5. Rastreamento de Sincronização (log técnico)

Evolução direta de `recordSync()`: em vez de só incrementar contadores, cada tentativa de
sincronização grava **um registro técnico por evento**, aproveitando o `syncId` que já existe:
`{ syncId, deviceId, resultado, tentativas, durationMs, quando }`. Retenção curta (semanas),
sem necessidade de imutabilidade rígida — é diagnóstico, não histórico institucional.

## 6. Registro de Erros (log técnico)

Hoje, todo erro capturado vira só `console.warn`/`console.error` — visível **apenas no
dispositivo onde aconteceu**, invisível para qualquer um tentando dar suporte remotamente
(confirmado: padrão `catch(e) { console.warn(...) }` repetido por todo o código). Proposta:
erros relevantes (falha de escrita, JSON inválido ao ler, `sizeExceeded`) também gravam um
registro técnico mínimo, sem dado pessoal no corpo do erro (ver seção 12).

## 7. Diagnóstico Remoto

Consequência direta de 5+6: com log técnico centralizado, um problema relatado por um
Tutor/Coordenador ("meu app travou") passa a ser investigável **sem precisar estar com o
aparelho na mão** — hoje isso é impossível (achado já registrado no ARQ-001, Pilar
Observabilidade).

## 8. Métricas de Saúde do Aplicativo

Distinto das métricas **pastorais** já existentes (Taxa de Conversão, IMD, Capilaridade —
medem o discipulado, não o software). Métricas de saúde técnica são agregadas a partir do log
técnico: % de sincronizações bem-sucedidas, tempo médio de sincronização, taxa de erro por tipo
— já parcialmente calculável a partir do que `recordSync()` já guarda hoje, só precisa de um
painel que ainda não existe.

## 9. Relação entre `personId` e Eventos

Regra não-negociável, já estabelecida no ARQ-003/ARQ-005 e reafirmada aqui: `personId` num
evento **só é confiável se vier da verificação `authUid → Pessoa`**, nunca de um campo que o
cliente afirma. Um evento com `personId` auto-declarado pelo cliente é tão confiável quanto o
`recordSync` de hoje — ou seja, nada, do ponto de vista de auditoria real.

## 10. Retenção dos Registros

| Tipo | Retenção proposta | Precedente já usado no projeto |
|---|---|---|
| Log técnico | 30-90 dias | Poda de convites/gratidões expiradas já existe (`podarConvites`, `podarGratidoesExpiradas`) — mesmo princípio |
| Evento de negócio (estrutura do evento) | Indefinida — é histórico institucional | Nenhum precedente de poda para isto — deliberadamente diferente |
| Vínculo do evento com dado pessoal identificável | Sujeito a anonimização (ver seção 12) | — |

## 11. Impacto na Migração do Modelo Atual (ARQ-004/004.1)

**Ponto crítico, que evita repetir um erro já visto três vezes neste projeto:** implementar o
Event Log **antes** da migração de persistência (ARQ-004.1) estar na Fase 3 (escrita
centralizada por entidade) reproduziria exatamente o padrão de causa raiz já identificado na
RC5.0 ("assimetria escrita↔leitura ao estender o payload de sincronização", AUD-001/003/007) —
cada um dos dezenas de pontos de escrita hoje espalhados pelo código precisaria lembrar de
também gravar um evento, e algum inevitavelmente esqueceria. **Sequenciamento correto: Event Log
só entra depois que as escritas já estiverem centralizadas por entidade** — nesse ponto, o custo
marginal de gravar 1 evento a mais por escrita é baixo e uniforme.

## 12. Imutabilidade dos Eventos

Regra proposta, exatamente como pedido:

```
Evento criado → nunca editado → nunca apagado → só novos eventos complementam a história
```

**Precedente já validado neste código** (terceira vez que este padrão aparece nesta série, o que
reforça que não é uma invenção nova): `SETORES_EFETIVO.historico[]` (ADR-001) já é append-only —
"editar nunca sobrescreve, sempre empilha uma nova entrada". O Event Log generaliza esse mesmo
princípio para todas as entidades, não só Setor.

**Mecanismo de correção (sem violar imutabilidade):** se um evento foi gravado errado (ex.:
`personId` errado por um bug), a correção é um **novo evento** apontando para o original
(`corrige: eventoId`) — nunca uma edição do registro existente. Mesmo princípio de um livro
contábil: nunca se apaga um lançamento errado, lança-se um estorno.

**Enforcement técnico (fora do escopo de implementação deste ARQ, só sinalizado):** regra do
Firestore pode impor isso estruturalmente — `allow create: if ...; allow update, delete: if
false;` na coleção `/auditoria`. Decisão de implementação para o ARQ-006 futuro de Hardening,
não deste documento.

---

## 13. Privacidade e LGPD

**Ressalva necessária:** o que segue é uma leitura arquitetural alinhada aos princípios gerais
da LGPD (minimização, finalidade, transparência, direitos do titular) — **não é parecer
jurídico**. Antes de qualquer política de retenção/privacidade ser adotada oficialmente pela
Capelania, recomendo revisão por alguém com formação jurídica adequada; o que seguem são
decisões de arquitetura de dados, não uma interpretação legal vinculante.

**Dado pessoal já presente no domínio, confirmado pelo ARQ-002:** nome, WhatsApp (dado pessoal
sob a LGPD), histórico de participação, relacionamentos (Companheiro de Jornada), e — o mais
sensível de todos — **o conteúdo de pedidos de oração**, que pode revelar informação de saúde,
situação familiar ou outra condição sensível de quem escreveu, mesmo sem a intenção de ser um
"dado sensível" no sentido jurídico do termo.

**Quem pode visualizar (proposta):**
- A própria Pessoa pode ver seu próprio histórico de eventos (direito de acesso).
- Tutor/Coordenador vê eventos do **próprio** PG — nunca de outros (mesmo portão de acesso já
  usado em todo o app).
- Conteúdo do Mural (gratidão/oração) permanece visível como já é hoje — dentro do próprio PG,
  não fica mais nem menos exposto pelo Event Log (o Event Log registra "que algo foi publicado",
  não precisa duplicar o texto em si).
- Não existe hoje um papel de Administrador (ARQ-002) com visão de tudo — se vier a existir, seu
  próprio acesso a dado sensível de outros PGs deveria, no mínimo, também gerar evento (uma
  auditoria de quem consultou auditoria) — sinalizado como princípio, não como requisito a
  implementar já.

**Separação entre dado pessoal e evento (decisão de design que resolve a tensão entre
imutabilidade e "direito ao esquecimento"):** o evento referencia `personId` (um identificador
opaco), **nunca** nome/WhatsApp diretamente no corpo do evento. Isso permite que, se uma Pessoa
pedir para ser esquecida, `Pessoa.nome`/`Pessoa.whatsapp` sejam anonimizados **sem precisar tocar
em nenhum evento** — a estrutura factual ("algo aconteceu, quando") permanece intacta para fins
de histórico institucional agregado, mas deixa de apontar para um nome real.

**Retenção/anonimização:** eventos mantidos indefinidamente como estrutura; o vínculo
identificável (nome/WhatsApp associado a um `personId`) é candidato a anonimização depois de um
período de inatividade prolongada — número exato de dias/anos é decisão institucional/jurídica,
não técnica, deliberadamente não fixada aqui.

---

## Deliverables consolidados

- **Arquitetura recomendada:** duas trilhas separadas — log técnico (curta retenção, sem
  imutabilidade rígida) e Event Log de domínio (`/auditoria`, longa retenção, append-only).
- **Eventos obrigatórios:** catálogo da seção 3.
- **Dados mínimos:** `personId` verificado, tipo, entidade+id, antes/depois, timestamp do
  servidor.
- **Eventos que nunca podem ser apagados:** todos os de negócio, por definição — correção é
  sempre um evento novo, nunca uma edição/remoção.
- **Quem consulta o quê:** seção 12.
- **Estratégia de implementação futura:** só depois da Fase 3 do ARQ-004.1 (escrita
  centralizada por entidade) — nunca antes, para não repetir a causa raiz já vista 3x no
  projeto (RC5.0).

## Riscos

| Risco | Mitigação |
|---|---|
| Implementar antes da hora repete o padrão de bug já visto (seção 11) | Sequenciamento explícito: só após ARQ-004.1 Fase 3 |
| Log técnico vazar dado pessoal sem querer (ex.: payload de erro incluindo nome) | Regra explícita: corpo de erro nunca inclui campos de dado pessoal, só identificadores opacos |
| Auditoria virar vigilância excessiva entre Tutores | Escopo de leitura restrito ao próprio PG (seção 12), mesmo princípio já usado em todo o app |

## Recomendação Final

Aprovar o modelo de duas trilhas (log técnico / Event Log de domínio) como destino, com
implementação sequenciada **depois** da Fase 3 do ARQ-004.1 — não em paralelo, não antes. Com
isso, a série ARQ completa o ciclo: identidade (ARQ-002/003) → onde o dado mora (ARQ-004) →
como migrar com segurança (ARQ-004.1) → como recuperar se algo der errado (ARQ-005/005.1) →
como explicar o que aconteceu (ARQ-006). As cinco perguntas that motivaram o ARQ-001 já têm,
agora, uma resposta arquitetural coerente para cada uma.

**Este documento é exclusivamente diagnóstico/de projeto — nenhum código foi escrito, nenhum
evento foi registrado, nenhuma coleção nova foi criada.**
