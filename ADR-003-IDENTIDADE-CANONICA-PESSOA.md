# ADR-003 — Identidade Canônica da Pessoa

**Data:** 2026-07-30 · **Status:** Proposto (decisão conceitual — ainda não implementado, não
homologado)

> Numeração: o `ARCHITECTURE.md` já registra ADR-001 (Separação de Setores, RC4.8.2A) e ADR-002
> (Participante só conta para setor que o próprio PG acompanha, RC4.8.5A). Este é o **ADR-003**,
> não um "ADR-001" novo. Por regra já estabelecida no próprio `ARCHITECTURE.md` ("documento
> protegido... só alterado quando uma nova RC for homologada, nunca para registrar planejamento
> em aberto"), este ADR **vive como documento avulso até a implementação ser homologada** —
> migra para dentro do `ARCHITECTURE.md` nesse momento, não antes.

---

**Problema:** o modelo atual não tem uma entidade `Pessoa`. A identidade de quem usa o sistema
está fragmentada em três representações sem vínculo formal — `memberId` (Participante,
`g.participantes[]`), nome solto (`g.tutor`/`g.coordenador`), e nome+timestamp
(`compParceiro`, Companheiro de Jornada) — confirmado em código (ARQ-002). Isso impede, na
raiz, qualquer autenticação real (AUD-002/004, ARQ-001), auditoria confiável, ou recuperação de
identidade entre dispositivos.

**Alternativas consideradas** (avaliadas formalmente no `ARQ-002.1-DECISAO-IDENTIDADE-PESSOA.md`):
1. Promover `memberId` (já existente no Participante) a identificador universal de Pessoa —
   descartada: `memberId` só existe hoje aninhado dentro de `g.participantes[]` de um PG
   específico; não há como "promovê-lo" sem primeiro extraí-lo para um registro central — o que
   equivale, na prática, a construir a alternativa 2.
2. **Criar `Pessoa` como entidade raiz, com `personId` próprio — adotada.**

**Decisão:** adotar a alternativa 2.

1. Toda pessoa cadastrada no sistema possui um `personId` (UUID, estável, nunca reaproveitado —
   mesmo padrão já usado para `memberId`, `inviteId`, `setorId`).
2. Papéis (Tutor, Coordenador, Administrador) e participações em Pequenos Grupos são
   atributos/relacionamentos de uma `Pessoa`, nunca uma identidade própria.
3. Tutor, Coordenador e Participante nunca são identificados por nome em nenhuma referência
   entre entidades — nome é sempre campo de apresentação (`displayName`), nunca chave.
4. `memberId` é descontinuado como candidato a identidade universal — passa a ser tratado como
   identificador da relação `ParticipacaoPG` (participação de uma Pessoa num PG específico), não
   da Pessoa em si.
5. Toda referência nova ou migrada entre entidades usa identificador estável (`personId`),
   nunca nome ou combinação nome+timestamp.

**Consequências positivas:**
- Resolve, na origem, o caso já confirmado em código (`confirmarCriarPg`, index.html:3169-3190)
  de um Tutor existir sem nenhum `memberId` associado — hoje uma lacuna, sob este modelo um caso
  normal (Pessoa existe desde o primeiro contato, antes de qualquer participação).
- Abre caminho direto para autenticação real (ARQ-003), auditoria confiável (futuro ARQ-005) e
  recuperação de identidade entre dispositivos — hoje inexistentes.
- Consistente com o padrão arquitetural já usado no projeto para Setor (ADR-001): identidade
  central e estável, separada do estado operacional que muda com o tempo.

**Limitações conhecidas:**
- Não resolve sozinho a prova de identidade (autenticação) — só cria o alicerce sobre o qual ela
  se apoia. Ver `ARQ-003-MODELO-IDENTIDADE-AUTENTICACAO.md`.
- Migração de dados existentes não é automática para os casos "órfãos" (tutor/coordenador só
  identificado por nome, sem `memberId` associado) — exige reconciliação assistida, mesmo risco
  de colisão de nome já documentado na RC-REST-02.
- Nenhum código foi alterado por este ADR — é registro de decisão, não implementação.
