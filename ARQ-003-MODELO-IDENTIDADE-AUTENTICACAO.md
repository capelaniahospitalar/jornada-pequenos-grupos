# ARQ-003 — Modelo de Identidade e Autenticação (somente diagnóstico/projeto)

> Realizado em 2026-07-30, sobre a fundação do ARQ-002 (Pessoa é a entidade raiz), ARQ-002.1
> (`personId` é o identificador canônico, `memberId` não é identidade universal) e ADR-003.
> **Nenhum código foi alterado, nenhuma autenticação foi ligada, nenhuma migração foi
> executada.** Este documento é desenho conceitual.

---

## 0. Prior art já existente no código (ponto de partida, não invenção nova)

Antes de propor qualquer mecanismo, vale registrar que o projeto **já resolveu, parcialmente,
uma parte deste problema** — só não de forma centralizada:

- **`DEDUP-01`** (index.html:3047-3063, comentário original do código): *"o WhatsApp é a prova
  real de identidade, não o nome"* — usado para reconhecer um Tutor/Coordenador que digita uma
  variação do próprio nome, convergindo pelo WhatsApp cadastrado.
- **`IDENT-01`** (index.html:8478-8494): ao aceitar um convite num aparelho novo, procura um
  cadastro existente por nome+WhatsApp antes de criar um Participante duplicado.
- **`verificarWhatsappDoPapel`** (index.html:2978-2994): a "senha" de Tutor/Coordenador só pode
  ser criada depois de confirmar o WhatsApp já registrado naquele papel.

O ARQ-003 não substitui esses três mecanismos — **generaliza o princípio que eles já aplicam
localmente** ("WhatsApp prova identidade, nome não") para um modelo único, central, que cobre
todas as entidades do domínio, não só o login do Tutor.

---

## 1. Ciclo de vida de uma Pessoa

```
Criação ──► Convite recebido ──► Entrada no PG ──► Mudança de papel ──► Saída ──► Recuperação
```

- **Criação:** uma `Pessoa` nasce no **primeiro contato identificável** com o sistema — hoje
  isso acontece em dois pontos diferentes e não-unificados: (a) aceitar um convite
  (`confirmarEntradaConvite`), ou (b) se identificar como Tutor via allowlist
  (`tutorIdentificar`). O modelo unifica os dois: qualquer um dos dois caminhos passa a
  **primeiro** buscar/criar um registro `Pessoa` (por WhatsApp, ver seção 3), e só depois anexar
  o papel ou a participação correspondente.
- **Convite recebido:** o `Convite` (já bem modelado, ARQ-002 seção 6) passa a referenciar
  `personId` no campo `deId` (quem convidou) — troca direta do que já é `memberId` hoje.
- **Entrada no PG:** cria uma `ParticipacaoPG { personId, pgId, tipo, dataEntrada, status:
  'ativo' }` — o que hoje é a criação de um registro em `g.participantes[]`.
- **Mudança de papel:** vira uma atualização de atributo (`papel` na `ParticipacaoPG`, ou uma
  nova entrada em `PapelDaPessoa` para Administrador, que não é ligado a um PG) — nunca a
  criação de uma pessoa nova, mesmo que hoje, ao virar Coordenador, o fluxo pareça um "novo
  cadastro" por causa da tela de convite.
- **Saída:** marca `ParticipacaoPG.status = 'removido'` (evolução direta do tombstone já
  existente, `removed:true`) — a `Pessoa` em si **não é afetada**; ela só perde uma participação
  ativa. Isso resolve diretamente a pergunta "ela deixa de existir? Não, só muda um
  relacionamento" levantada na decisão do ARQ-002.1.
- **Recuperação:** ver seção 4 — o ponto mais importante deste documento.

---

## 2. Relação entre `personId`, Firebase Auth UID, telefone/WhatsApp, e-mail e convite

**Ponto central, que precisa ficar explícito para não virar confusão de implementação:**
`personId` e o UID do Firebase Authentication **não são a mesma coisa, e não devem ser
tratados como intercambiáveis.**

```
Pessoa
 ├── personId          (estável para sempre — nunca muda, nunca é reciclado)
 ├── whatsapp           (natural key para busca/recuperação — pode mudar, editável)
 ├── nome               (só apresentação)
 └── authUid            (aponta para a credencial ATUAL do Firebase — PODE mudar)
        │
        └── Firebase Auth (anônimo hoje viável; telefone/e-mail são evolução possível,
            não necessária para o primeiro passo)
```

- **`personId`** é a chave que todo o resto do sistema referencia (Participação, papel, autoria
  de gratidão, Companheiro de Jornada). Nunca exposto na UI, nunca digitado por ninguém.
- **`authUid`** é só "qual credencial do Firebase está autenticada agora, neste aparelho,
  reivindicando ser esta Pessoa". Pode mudar (reinstalar o app com Firebase Anônimo gera um UID
  novo) sem que nada mais no sistema precise mudar — só a ponte `Pessoa.authUid` é atualizada.
- **WhatsApp** não é um identificador técnico — é o **elo de prova humana** (a pessoa "prova"
  que é dona daquele registro por já ter aquele número associado a ele, mesmo mecanismo do
  `DEDUP-01`/`verificarWhatsappDoPapel` já existentes). Pode mudar (troca de aparelho/número) —
  por isso não pode ser o identificador canônico, só a chave de busca/recuperação.
- **E-mail:** não existe hoje em nenhum ponto do app (confirmado — nenhum campo de e-mail
  encontrado no cadastro de participante/tutor). Não é necessário para o modelo funcionar;
  fica como possibilidade futura, não requisito.
- **Convite:** continua sendo o mecanismo de **apresentação formal** de uma Pessoa a um PG/papel
  — sua função não muda, só a referência interna (`deId`) passa a ser `personId` em vez de
  `memberId`.

---

## 3. Como evitar duplicação de Pessoa

Regra única, generalizando o `DEDUP-01` já existente: **antes de criar uma `Pessoa` nova, sempre
buscar por WhatsApp normalizado (dígitos, com/sem prefixo de país) entre todas as Pessoas já
existentes** — nunca por nome (nome já provou ser ambíguo, RC-REST-02).

- Se encontrar → reaproveita o `personId` existente, atualiza `nome`/dados se necessário.
- Se não encontrar → cria `Pessoa` nova.

**Limitação já conhecida, não resolvida por este modelo (registrar como aceita, não ignorada):**
WhatsApp compartilhado (celular da família) ou reciclado (número trocou de dono) pode colidir
duas Pessoas reais num só registro, ou impedir a recuperação de uma Pessoa cujo número mudou.
Isso já é um risco aceito hoje (o mecanismo de "senha" de Tutor tem a mesma limitação) — o
modelo novo não piora nem resolve sozinho; resolver isso de verdade exigiria um segundo fator
(e-mail, código enviado por outro canal), fora do escopo deste ARQ.

---

## 4. Como recuperar uma identidade em outro dispositivo

Esta é a mudança mais visível para quem usa o app — hoje:

```
perdeu localStorage  =  perdeu identidade  (sem volta)
```

Proposto:

```
Novo aparelho
     │
     ▼
Firebase Auth (anônimo) gera um authUid novo, automaticamente, sem ação do usuário
     │
     ▼
App pergunta: "Qual o WhatsApp que você já usa no sistema?"
     │
     ▼
Busca Pessoa por WhatsApp (mesma lógica do item 3)
     │
     ├── Encontrou → religa authUid novo a esse personId (authUid antigo, se existir, é
     │   substituído — só o mais recente vale, sem necessidade de "revogar" nada à parte)
     │   → todas as Participações/papéis são recuperados, porque todos referenciam personId,
     │   não authUid nem memberId
     │
     └── Não encontrou → trata como Pessoa nova (fluxo de cadastro normal)
```

**Grau de prova, honestamente avaliado:** digitar um WhatsApp que já está no banco **não é uma
prova forte** (qualquer um que soubesse o número de outra pessoa poderia reivindicar a
identidade dela) — mas é **exatamente o mesmo nível de prova que o sistema já aceita hoje** para
criar a senha de Tutor (`verificarWhatsappDoPapel`). Este ARQ não piora a segurança existente;
formaliza e generaliza o que já era aceito. Elevar o rigor (ex.: enviar um código via WhatsApp
Business API para confirmar posse real do número) é uma melhoria possível, mas é uma **decisão
de produto/custo separada** — sinalizada aqui como ponto indefinido (seção 7), não decidida por
este documento.

---

## 5. Papéis (Participante, Tutor, Coordenador, Administrador)

```
Pessoa (personId: P001)
  │
  ├── ParticipacaoPG { pgId: 3, tipo: 'colaborador', papel: null,          status: 'ativo' }
  ├── ParticipacaoPG { pgId: 9, tipo: 'tutor',        papel: 'tutor',      status: 'ativo' }
  └── PapelGlobal    { papel: 'administrador',                              status: 'ativo' }  (hoje: 0 registros — papel inexistente na prática)
```

- **Participante/Tutor/Coordenador** continuam ligados a **um PG específico** (`ParticipacaoPG`)
  — mesma pessoa pode ter papéis diferentes em PGs diferentes, exatamente como hoje já é
  tecnicamente possível (nada no código impede), só que hoje isso não é rastreável de forma
  unificada.
- **Administrador** é modelado como **papel global**, sem `pgId` — não ligado a nenhum grupo
  específico. Não existe hoje nenhuma instância desse papel; o modelo só reserva o espaço,
  sem necessidade de implementar a tela/fluxo agora (mesmo padrão já usado no projeto para
  campos reservados como `ativo`/`departamentoPaiId` do Setor).

---

## 6. Permissões

Modelo de checagem, em duas camadas (cliente decide o que mostrar; servidor decide o que
permitir — a camada que falta hoje é a segunda, AUD-002):

```
authUid (Firebase) → Pessoa.personId → papéis ativos → permissões derivadas
```

Exemplos de permissão (nome ilustrativo, não é proposta de nomenclatura final de código):
`podeCriarPG` (Tutor ou Administrador) · `podeEditarParticipantes` (Tutor/Coordenador do
**próprio** PG, checado via `ParticipacaoPG.pgId`) · `podeVerRankingInstitucional` (Tutor/
Coordenador de qualquer PG, já é assim hoje) · `podeEditarSetoresMestre` (Tutor/Administrador).

**O ganho real sobre o modelo atual:** hoje essa checagem só existe no cliente (esconder botão).
Com `Pessoa`+`authUid` central, a mesma checagem pode ser expressa nas regras do Firestore
(`request.auth.uid` → consulta `Pessoa` → confere papel) — fechando o AUD-002 de verdade, não só
na interface. O desenho detalhado dessas regras fica para o ARQ-006 (Hardening); aqui só se
estabelece que o modelo de dados já nasce pronto para suportar isso.

---

## 7. Auditoria confiável

Só se torna possível **depois** deste modelo existir — é o motivo de Identidade vir antes de
Observabilidade na sequência já acordada. Formato proposto (conceitual, não implementação):

```
Evento { personId (do authUid verificado, nunca do cliente alegando quem é),
         at (timestamp do servidor, nunca do cliente),
         acao, entidade, entidadeId,
         antes, depois }
```

A diferença crucial em relação a um log ingênuo: **`personId` vem da verificação
`authUid → Pessoa`, nunca de um campo que o próprio cliente envia** — é isso que torna o evento
confiável e não apenas "mais um dado que o cliente poderia forjar", o mesmo problema que hoje
afeta `recordSync` (ARQ-001, Pilar Observabilidade).

---

## 8. Plano Conceitual de Migração

Estende o plano já iniciado no ARQ-002.1, com as etapas específicas de autenticação:

1. **(Já descrito no ARQ-002.1)** Criar `Pessoa` a partir de todo `memberId` existente; resolver
   órfãos (tutor/coordenador só por nome).
2. **Introduzir Firebase Authentication anônimo, silenciosamente** — todo aparelho que abrir o
   app passa a receber um `authUid`, sem pedir nada ao usuário ainda. Ligado ao `personId` já
   conhecido daquele aparelho (via `personId` local hoje equivalente ao `memberId`/identidade
   atual) — não muda nenhuma experiência visível.
3. **Formalizar o fluxo de recuperação por WhatsApp** (seção 4) — só passa a ser necessário
   quando alguém troca de aparelho ou limpa dados; não afeta quem já está identificado.
4. **Mover as checagens de permissão para as regras do Firestore** (`authUid` → `Pessoa` →
   papel) — só depois dos passos 1-3 estarem estáveis em produção. É este passo que finalmente
   fecha o AUD-002.

Nenhuma etapa exige quebrar a experiência atual do usuário em nenhum ponto — cada uma é aditiva
sobre a anterior, mesmo princípio de compatibilidade retroativa já adotado no projeto.

---

## Riscos

| Risco | Descrição | Mitigação proposta |
|---|---|---|
| WhatsApp como prova fraca | Qualquer um que saiba o número de outra pessoa poderia reivindicar a identidade dela | Aceito como risco já existente hoje (mesmo nível do mecanismo atual de senha de Tutor); não piora, não resolve sozinho |
| Número reciclado/compartilhado | Duas Pessoas reais podem colidir num só registro | Não resolvido por este modelo — precisa de decisão de produto (2º fator), fora de escopo |
| Migração dos "órfãos" (tutor só por nome) | Risco de colisão de nome já documentado (RC-REST-02) | Reconciliação assistida, não automática — ver ARQ-002.1 seção 6 |
| `authUid` anônimo não é uma "conta" de verdade | Se o Firebase limpar sessões anônimas antigas (política própria do Google), a religação depende do fluxo de recuperação (seção 4) funcionar bem | Recuperação por WhatsApp é o plano de contingência formal, não um extra |

## Pontos ainda indefinidos (decisão de produto, não técnica — não resolvidos aqui de propósito)

- Grau de prova de identidade aceitável na recuperação: manter "digitar o WhatsApp já
  cadastrado" (grátis, já é o padrão do projeto) ou evoluir para confirmação real via código
  enviado (custo operacional/API paga, ainda não avaliado)?
- Papel de Administrador: implementar agora (mesmo sem ninguém pedir) ou manter só reservado no
  modelo, sem tela, até haver necessidade real?
- Editar o próprio WhatsApp cadastrado: quem autoriza — a própria Pessoa autenticada, ou precisa
  de confirmação adicional (para não virar um vetor de sequestro de identidade)?

## Recomendação Final

Aprovar o modelo conceitual acima como base para a implementação (fora do escopo desta série
ARQ, que permanece só diagnóstica). Sequência de implementação sugerida, quando decidido
avançar: passos 1-4 da seção 8, nesta ordem, cada um homologado antes do próximo — mesmo
princípio de incrementalidade já usado em todas as RCs anteriores do projeto.

**Este documento é exclusivamente diagnóstico/de projeto — nenhum código foi escrito, nenhuma
autenticação foi ligada, nenhuma migração foi executada.**
