# ARQ-007 — Hardening, Segurança e Plano de Evolução (somente diagnóstico/projeto)

> Realizado em 2026-07-30. Documento de fechamento da série ARQ-001 a ARQ-006. **Nenhum código
> foi alterado.** Responde à pergunta que fecha o ciclo: *"como impedir que os mesmos problemas
> voltem?"* — e entrega o roadmap mestre que une todos os documentos anteriores numa única
> sequência de implementação.

---

## 0. O diagnóstico final desta jornada

O usuário resumiu com precisão o que mudou desde o ARQ-001: o problema nunca foi "vários bugs
soltos" — é **um aplicativo funcional que cresceu além da arquitetura original**. A evidência
mais direta disso, encontrada repetidas vezes ao longo desta série, é que **as peças certas já
existem, só não foram organizadas**:

| Peça já existente | Onde já apareceu nesta série | Só faltava |
|---|---|---|
| `setorId` | ADR-001 (RC4.8.2A) | Já resolvido — modelo institucional completo |
| `memberId` | ARQ-002/002.1 | Estava correto como id de **participação**, mal-empregado como identidade de **pessoa** |
| `syncId` (index.html:9163) | ARQ-006 | Nunca alimentava observabilidade — só uma mensagem de console |
| `historico[]` append-only | ADR-001, reaproveitado no ARQ-006 | Só existia para Setor; princípio nunca generalizado |
| `FB_FLAGS` + comentário "registrada na telemetria/log p/ auditoria futura" (`APP_VERSION`, index.html:8807) | Este ARQ-007 | **O autor original já previa isso** — o comentário no próprio código antecipava exatamente o uso que o ARQ-006 propõe agora |

Isso muda o tom deste ARQ-007: não é "reconstruir", é **organizar e consolidar peças que já
funcionam isoladamente**, dentro de um plano que garante que nenhuma delas se perca no processo.

---

## 1. Segurança Firebase

Achado que se repete de forma exata: **não existe `firestore.rules` versionado neste
repositório** — as regras vivem só no Console (conta separada, já registrada em memória). Isso é,
em si, uma lacuna de hardening independente do conteúdo das regras: regras de segurança deveriam
ser **código revisável**, não configuração invisível fora do controle de versão.

**Controle obrigatório:** assim que a Fase de Identidade (ARQ-003) entrar em implementação,
versionar um `firestore.rules` dentro deste repositório, mesmo que o Firebase continue exigindo
a publicação manual via Console/CLI — o arquivo versionado vira a fonte da verdade revisável;
o Console é só onde ele é aplicado.

## 2. Autenticação e Autorização

Já desenhado por completo no ARQ-003 — este item, aqui, é só a reafirmação de que fechar
**AUD-002** (crítico desde a RC5.0) depende inteiramente da implementação daquele modelo, não de
nenhuma medida isolada. Nenhuma regra de servidor consegue distinguir "quem" sem `authUid` real.

## 3. Controle de Permissões por Papel

Matriz já esboçada no ARQ-003, seção 6 (`podeCriarPG`, `podeEditarParticipantes` etc.).
**Controle obrigatório:** essas permissões precisam existir nas regras do Firestore
(`request.auth.uid` → `Pessoa` → papel), não só como `if` escondendo botão na interface — hoje,
100% da separação de papéis é só isso (confirmado, ARQ-001).

## 4. Validação de Dados

Achado novo desta etapa: a validação de dado hoje é **ad-hoc, por função**, não centralizada —
alguns pontos são exemplares (`EMBAIXADORES_EXTERNOS`: nunca negativo, sempre inteiro, nunca
ultrapassa o efetivo — validação real, já em produção), mas não existe um padrão único aplicado
a toda entidade. O próprio Firestore já teria a ferramenta certa para isso —
`hasOnly([...])`/checagem de tipo nas regras — hoje usada só como allowlist de campos aceitos,
não como validação de conteúdo.

**Controle obrigatório:** ao desenhar as regras da Fase de Identidade, formalizar uma validação
mínima por entidade (formato de WhatsApp, campos obrigatórios presentes, tipos corretos) tanto
no cliente (evita round-trip desperdiçado) quanto na regra do servidor (é a única validação que
não pode ser burlada).

## 5. Proteção contra Corrupção

Este é um dos poucos pontos onde o app **já está bem** — vale reconhecer, não só apontar falha
(mesmo espírito da seção "Pontos Positivos" da RC5.0): proteção contra gravar array vazio por
cima de nuvem com dado (`prepareSaveGrupos`, index.html:9126-9134), trava otimista com
`updateTime`, guarda de tamanho (`sizeExceeded`, ARQ-004 seção 0). **Lacuna que permanece:**
AUD-007 (merge não cobre setores/embaixadores) — resolvido estruturalmente pelo ARQ-004 (coleção
por entidade elimina a necessidade de merge manual), não por uma correção pontual.

## 6. Testes Automatizados

**Confirmado, de novo: zero testes automatizados no repositório.** Este é o item mais honesto
de todo este documento, porque **a solução não é gratuita**: hoje o projeto é um único arquivo
HTML sem build, sem `npm`, sem CI — introduzir testes de verdade exige uma primeira decisão de
ferramenta (mesmo dilema já levantado no ARQ-004.1 para o SDK do Firestore).

**Caminho realista, em 3 estágios, do mais barato ao mais completo:**
1. **Hoje, sem ferramenta nova:** os próprios painéis de diagnóstico comparativo já propostos
   (ARQ-004.1) funcionam como "teste manual visual" — antes de publicar uma mudança grande,
   comparar contagens antes/depois. Já é mais do que existe hoje (nada).
2. **Curto prazo:** extrair as funções do **Motor de Negócio** (já comprovadamente puras — sem
   efeito colateral, ex.: `getPgIMD`, `calcularCoberturaSetorial`, `mergeGruposData`,
   `participanteContaParaSetor`) para serem testáveis por um runner simples (Node, só como
   ferramenta de desenvolvimento — nunca entra no `index.html` publicado). São o alvo mais fácil
   e mais valioso: puras, sem depender de Firebase/DOM.
3. **Médio prazo:** GitHub Actions (gratuito no plano já usado por este repositório) rodando os
   testes do item 2 a cada push — só faz sentido depois que o item 2 existir.

**Os dois exemplos do usuário viram, na prática, exatamente os testes do estágio 2/3:**
`"se um tutor perder seus participantes, o teste falha"` e `"se uma migração apagar setores, o
teste falha"` — ambos são testes de invariante sobre o Motor de Negócio (contagem antes ≤
contagem depois, salvo remoção explícita).

## 7. Controle de Versões

`APP_VERSION` já existe (`{version: '1.0.0', build: '2026-06-30'}`, index.html:8808) mas não há
evidência de que seja incrementada a cada RC. **Controle obrigatório:** versão bump a cada RC
homologada — barato, e o comentário original do código já antecipava esse uso
("registrada na telemetria/log p/ auditoria futura"). `schemaVersion` (já usado em `pgIMD`/
`pgRanking`) deve ser generalizado para toda entidade nova criada a partir do ARQ-004 — suporte
a migração futura sem precisar adivinhar o formato de um registro antigo.

## 8. Feature Flags

**Ponto forte já existente, não uma lacuna** — `FB_FLAGS` (index.html:8797-8805) já tem 7 flags
em uso real, é o mecanismo que sustenta toda a estratégia de migração progressiva do ARQ-004.1/
ADR-004. **Risco de processo, não de arquitetura:** nenhuma flag jamais foi removida — todas as
7 já estão `true` (graduadas), mas os caminhos antigos (`identidadeUuid: false`,
`imdV2: false` etc.) continuam no código, aumentando superfície permanentemente.
**Controle obrigatório:** todo `FB_FLAG` novo (a partir do ARQ-003/004) nasce com uma data-alvo de
remoção do caminho antigo, documentada no `ARCHITECTURE.md` (mesmo padrão já anunciado, mas não
cumprido, para o motor `getPgIMD` antigo — "remoção definitiva prevista para o encerramento da
RC3.6").

## 9. Processo RC e Homologação

**Este pilar já é maduro — nada a corrigir estruturalmente.** `CHANGELOG.md`,
`ESTADO-E-ROADMAP.md`, homologação técnica separada de funcional (já usado no IMD v2), critérios
de saída objetivos (RC5.0) — é o processo mais disciplinado de todos os 12 pontos deste
documento. A própria série ARQ segue o mesmo espírito. Recomendação única: a implementação de
cada ARQ desta série deve virar uma RC formal (RC6.x, seguindo a numeração já em uso), não uma
mudança solta.

## 10. Rollback

Já coberto pelo ADR-004 (coexistência + validação + rollback via flag). Nada a acrescentar aqui
além de reafirmar que **todo** item desta série (identidade, persistência, auditoria) segue essa
mesma regra permanente.

## 11. Segurança Operacional

Dois achados, um já conhecido e um novo:
- **Já conhecido (ARQ-005.1):** conta Google pessoal, sem segundo administrador confirmado.
- **Novo nesta etapa:** **não existe conceito de sessão/logout hoje** — identidade vive
  permanentemente no `localStorage`, sem nenhuma forma de revogar o acesso de um aparelho
  específico (ex.: celular de um Tutor perdido/roubado continua com acesso completo
  indefinidamente). Isso só se torna resolvível **depois** do ARQ-003 (com `authUid`, é possível
  revogar uma credencial específica sem afetar as demais) — mais um item que confirma por que
  Identidade precisou vir primeiro na sequência.

## 12. Plano de Evolução até a Arquitetura Final

Refinando a proposta do usuário, reconciliando com o detalhamento já existente em cada ARQ
individual:

```
Fase 0 — Documentação e preservação atual         [CONCLUÍDA nesta série]
  ARQ-001 a ARQ-006, ADR-003/004, BACKUP-PRE-ARQ-001, ARQ-005.1

Fase 1 — Fundação
  Pessoa/personId, ParticipacaoPG, Firebase Auth anônimo (ARQ-002.1/003)
  + testes automatizados mínimos do Motor de Negócio (seção 6, estágio 2) —
    ANTES da migração, para servir de rede de segurança durante ela

Fase 2 — Migração de Persistência
  ARQ-004.1 completo: escrita dupla → leitura migrada → escrita migrada → corte do
  documento único, entidade por entidade (Pessoa → Participação → PG → Setor)

Fase 3 — Segurança e Auditoria
  firestore.rules versionado e por identidade real (fecha AUD-002)
  + Event Log de domínio (ARQ-006) — só agora, com escrita já centralizada por entidade

Fase 4 — Novas Funcionalidades
  Retoma o roadmap já existente no ARCHITECTURE.md (Épico 4 — Inteligência Pastoral,
  Épico 5 — Gamificação) — só depois da fundação estar consolidada, mesmo princípio
  já declarado no projeto ("inteligência antes da gamificação", agora estendido a
  "fundação antes de tudo")
```

Cada fase segue o ADR-004 (coexistência, validação com dado real, rollback disponível) — nenhuma
é um corte seco.

---

## Princípios Permanentes (consolidado desta série, para incorporar ao `ARCHITECTURE.md`
    quando a Fase 1 homologar)

1. Nenhuma alteração relevante de domínio ocorre sem gerar um evento correspondente (ARQ-006,
   Princípio de Auditoria).
2. Nenhuma peça arquitetural crítica é substituída sem coexistência, validação com dado real e
   rollback disponível (ADR-004).
3. Toda referência entre entidades usa identificador estável — nunca nome, nunca combinação
   nome+timestamp (ADR-003).
4. Dado pessoal identificável e registro de evento são estruturas separadas — eventos referenciam
   `personId`, nunca nome/WhatsApp diretamente (ARQ-006, seção 13).
5. Toda `FB_FLAG` nova nasce com um plano de remoção do caminho antigo, documentado.

## Controles Obrigatórios (checklist de implementação)

- [ ] `firestore.rules` versionado neste repositório.
- [ ] Autenticação real (`authUid`) antes de qualquer regra de permissão por papel.
- [ ] Validação de formato mínima por entidade, cliente + regra do servidor.
- [ ] Testes automatizados do Motor de Negócio, antes de iniciar a Fase 2.
- [ ] `schemaVersion` em toda entidade nova.
- [ ] Data-alvo de remoção documentada em toda `FB_FLAG` nova.
- [ ] Cada fase deste roadmap homologada como RC formal, com critério de saída objetivo.

## Riscos Atuais (herdados, consolidados)

| Risco | Severidade | Depende de |
|---|---|---|
| Ausência de autenticação (AUD-002) | Crítico | ARQ-003 |
| Ausência de backup automatizado | Alto | ARQ-005 (parcialmente mitigado — backup manual já executado) |
| Documento único (teto de 500 KB já ativo) | Alto | ARQ-004 |
| Zero teste automatizado | Alto (risco de regressão silenciosa) | Este ARQ-007, seção 6 |
| Conta Google pessoal, sem 2º administrador | Alto | ARQ-005.1 — ação humana pendente |
| Sem conceito de sessão/logout | Médio (torna-se Alto se um aparelho for perdido) | ARQ-003 |

## Prioridades (ordem recomendada de implementação)

1. Fase 1 (Fundação) — sem isso, nada mais do que foi desenhado nesta série pode começar.
2. Ação humana pendente do ARQ-005.1 (segundo administrador) — pode e deve acontecer em paralelo,
   não depende de nenhuma fase técnica.
3. Fase 2 (Migração) — só depois da Fase 1 validada com dado real.
4. Fase 3 (Segurança e Auditoria) — nunca antes da Fase 2 estar com escrita centralizada.
5. Fase 4 (Novas funcionalidades) — só depois de tudo acima consolidado.

## Recomendação Final

Aprovar o roadmap mestre da seção 12 como plano de implementação, com os Princípios Permanentes
e Controles Obrigatórios acima incorporados ao `ARCHITECTURE.md` no momento em que a Fase 1 for
homologada (não antes — o próprio `ARCHITECTURE.md` já se declara documento protegido, só para o
que já foi implementado). Com este documento, a série de diagnóstico arquitetural
(ARQ-001 a ARQ-007) está formalmente concluída — qualquer próximo passo é implementação, não
mais diagnóstico.

**Este documento é exclusivamente diagnóstico/de projeto — nenhum código foi escrito, nenhuma
regra foi publicada, nenhuma migração foi executada.**
