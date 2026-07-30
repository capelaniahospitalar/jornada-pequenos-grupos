# ARQ-005 — Recuperação, Backup e Continuidade Operacional (somente diagnóstico/projeto)

> Realizado em 2026-07-30, sobre a base de ARQ-001 a ARQ-004.1 e ADR-003/ADR-004. **Nenhum
> código foi alterado, nenhum backup foi executado por esta sessão** (ver nota ao final sobre a
> ação imediata proposta pelo usuário). A pergunta que orienta este documento, nas palavras do
> usuário: *"se amanhã ocorrer o pior cenário, quanto tempo leva para o sistema voltar a
> funcionar, e quanto dado será perdido?"*

---

## 0. Restrição de realidade que precisa guiar todas as respostas abaixo

Este app **não tem backend** — é um arquivo estático (`index.html`) servido diretamente, sem
servidor próprio, sem `cron`, sem função agendada. Isso significa que **backup automatizado de
verdade (rodando sozinho, todo dia, sem ninguém precisar lembrar) exige infraestrutura que hoje
não existe** — tipicamente, no ecossistema Firebase, isso seria um Cloud Function + Cloud
Scheduler + um bucket de armazenamento, tudo fora do `index.html`, com custo e manutenção
próprios. Ignorar essa restrição levaria a propor um "RPO de 24h" bonito no papel, mas
inalcançável na prática atual do projeto. Este documento propõe **dois caminhos em sequência**:
um imediato, sem infraestrutura nova (fecha o risco agora, com esforço humano), e um automatizado
(fecha o risco de vez, com investimento técnico que é uma decisão separada, não incluída aqui).

---

## 1. Backup Físico

**Curto prazo (sem infraestrutura nova) — recomendado para já:** um botão "🔒 Exportar backup"
dentro do Painel do Tutor/Administrador, que pega o estado atual já carregado em memória
(`PEQUENOS_GRUPOS`, `TUTORS`, `SETORES_MESTRE` etc. — o mesmo dado que `trySaveGrupos` já monta)
e oferece como download de um arquivo `.json` — mecanismo 100% client-side, sem servidor novo,
tecnicamente equivalente ao "Exportar" que qualquer app deste tipo já teria. Responsabilidade:
um humano (hoje, o "Administrador do projeto", nas suas palavras) clica periodicamente — não é
automático, mas fecha a lacuna com esforço mínimo.

- **Frequência recomendada:** semanal, no mínimo; antes de qualquer sessão de mudança
  estrutural grande (como a migração do ARQ-004.1) — nunca menos que "antes de mexer na
  fundação".
- **Retenção:** manter os últimos 8-12 arquivos (≈ 2-3 meses semanais) — custo de
  armazenamento é irrelevante (arquivos pequenos), não há motivo para apagar cedo.
- **Onde guardar:** fora do Firestore e **fora do repositório Git** (o arquivo contém dado
  pessoal real — nome, WhatsApp — não deve entrar em controle de versão nem em local público).
  Google Drive/OneDrive já usados pelo usuário resolvem isso sem ferramenta nova.

**Médio/longo prazo (requer infraestrutura nova, decisão separada):** exportação automática via
Cloud Scheduler + Cloud Function do Firebase, gravando num bucket do Google Cloud, diária. Isso
é a evolução natural, mas é a primeira peça de infraestrutura de servidor que o projeto passaria
a ter e manter — sinalizado como decisão de investimento, não incluído nesta recomendação como
obrigatório imediato.

---

## 2. Backup Lógico (Histórico de Eventos / Audit Trail)

Só existe de forma confiável **depois** de `personId`/`authUid` (ARQ-003) estarem implementados
— um evento sem autor verificado é só um log de conveniência, não uma auditoria (mesmo ponto já
levantado no ARQ-002.1). Formato (já esboçado no ARQ-003, seção 7, reaproveitado aqui como a
peça central deste pilar):

```
Evento {
  eventoId,
  personId,        // de onde? do authUid verificado — nunca de um campo que o cliente envia
  acao,            // ex.: "alterou coordenador"
  entidade, entidadeId,
  antes, depois,
  quando           // timestamp do servidor
}
```

Vive na coleção `/auditoria` já prevista no modelo-alvo do ARQ-004 — **append-only**, nunca
editado nem apagado, mesmo padrão já validado no projeto para `SETORES_EFETIVO.historico[]`
(ADR-001). Custo de implementação baixo **depois** que as escritas já estiverem centralizadas
por entidade (ARQ-004.1) — cada função de escrita passa a gravar 1 evento a mais, no mesmo
momento em que já grava o dado.

---

## 3. Snapshots

Distinto do backup físico (cópia sob demanda) e do backup lógico (o que aconteceu): um snapshot
é **uma fotografia completa do estado em um instante**, para restaurar rápido sem precisar
reprocessar todo o histórico de eventos.

```
Snapshot 30/07 02:00
Snapshot 29/07 02:00
Snapshot 28/07 02:00
```

No curto prazo, **o mesmo botão de exportação da seção 1 já cumpre esse papel** — cada arquivo
exportado é, por definição, um snapshot daquele momento. Não há necessidade de construir um
segundo mecanismo agora; snapshot automatizado por horário fixo (`02:00` todo dia) só faz
sentido junto da automação de backup físico (Cloud Scheduler), não antes.

---

## 4. Recuperação de Identidade

Já desenhado no `ARQ-003` (seção 4) — este documento só referencia, não reformula:

```
Novo aparelho → Firebase Auth gera authUid novo → busca Pessoa por WhatsApp
→ encontrou: religa authUid ao personId existente, recupera todos os vínculos
→ não encontrou: trata como Pessoa nova
```

---

## 5. Recuperação de Dados

Fluxo geral, por severidade:

```
Detectar problema
  (painel de diagnóstico do ARQ-004.1 flagando divergência,
   OU relato humano — "meu PG sumiu")
        ↓
Identificar último estado válido
  (snapshot mais recente antes do problema, OU replay do /auditoria
   até o evento anterior ao que causou o dano)
        ↓
Restaurar
  (grava de volta o estado identificado — SEMPRE com confirmação humana
   explícita antes de sobrescrever, nunca automático)
        ↓
Registrar evento
  (a própria restauração vira um Evento em /auditoria — quem restaurou,
   quando, a partir de qual snapshot/ponto do histórico)
```

**Diferença importante em relação aos dois incidentes já reais (Grupo 1, Grupo 22):** sob o
modelo-alvo do ARQ-004 (coleções por entidade), "PG perdeu participantes" passa a ser um
problema **localizado** — restaura-se só os documentos de `/participacoes` daquele PG, não o
"documento inteiro do aplicativo" como a arquitetura atual obrigaria. Blast radius menor, restore
mais rápido, menos risco de o próprio processo de restauração introduzir um novo erro em dado
que não tinha nada a ver com o problema original.

---

## 6. Rollback de Migrações

Já coberto pelo `ADR-004`/`ARQ-004.1` — reafirmado aqui como parte do mesmo guarda-chuva de
continuidade: enquanto uma migração estrutural estiver em período de coexistência, rollback é
sempre uma troca de *feature flag*, nunca uma reconstrução de dado.

---

## 7. Cenários de Desastre (catálogo)

| Cenário | Já ocorreu? | Defesa hoje | Defesa proposta |
|---|---|---|---|
| Perda de 1 participante | Sim, mitigado | Tombstone (30 dias) | Mantido + Evento em `/auditoria` explica o quê/quando |
| Perda de 1 PG inteiro | **Sim, 2x** (Grupo 1, Grupo 22) | Nenhuma — recuperação manual via PATCH/log de convite | Backup físico semanal (seção 1) + restauração localizada (seção 5) |
| Corrupção/perda do documento inteiro | Não (ainda) | Nenhuma | Backup físico (seção 1); mitigado estruturalmente pelo ARQ-004 (não existe mais "o documento inteiro" no modelo-alvo) |
| **Perda de acesso administrativo à conta Google/Firebase** | Não, mas já é risco registrado (memória do projeto: "projeto está numa conta Google diferente da padrão") | Nenhuma defesa conhecida — ponto cego real | **Fora do escopo técnico deste ARQ** — é gestão de acesso institucional (ex.: segunda pessoa com acesso à conta, ou conta institucional em vez de pessoal), decisão organizacional, não arquitetural |
| Escrita/leitura maliciosa (AUD-002) | Não materializado | Nenhuma | Depende do ARQ-006 (Hardening) — fora do escopo deste documento |

O cenário "perda de acesso administrativo" é um achado novo desta etapa — não é resolvido por
nenhum backup técnico (um backup não ajuda se ninguém consegue mais acessar o projeto Firebase
para restaurá-lo). Vale registrar como recomendação separada: garantir que **mais de uma pessoa**
tenha acesso administrativo à conta Google do projeto, fora do escopo de arquitetura de dados.

---

## 8. RPO e RTO — propostos com honestidade sobre a maturidade atual

| | Hoje (sem nenhuma mudança) | Curto prazo (botão de exportação, seção 1) | Médio/longo prazo (automação, requer infra nova) |
|---|---|---|---|
| **RPO** (quanto dado se pode perder) | Indefinido — depende de existir, por acaso, um jeito de reconstruir (log de convite, memória de quem editou por último) | **≤ 7 dias** (backup semanal) | 24h (export diário automatizado) |
| **RTO** (tempo para restaurar) | Horas a dias — já levou isso nos 2 incidentes reais, envolvendo investigação manual | **1-2 horas** (restaurar de um arquivo conhecido, sem precisar investigar) | < 1 hora (com ferramenta de restauração dedicada, não console manual) |

**Por que não propor "RPO de 24h" já no curto prazo:** seria uma meta que ninguém consegue
cumprir sem a automação — e uma meta que não pode ser cumprida não é uma meta, é uma promessa
vazia. O salto de "indefinido" para "≤ 7 dias" já é uma melhoria real e alcançável com o esforço
mínimo da seção 1; o salto para 24h é uma decisão de investimento em infraestrutura, não uma
tarefa desta série ARQ.

---

## Riscos

| Risco | Mitigação |
|---|---|
| Backup manual depende de alguém lembrar de clicar | Aceito como limitação do curto prazo — ainda assim, infinitamente melhor que a situação atual (zero backup) |
| Arquivo de backup contém dado pessoal real, pode vazar se mal guardado | Orientação explícita (seção 1): nunca no Git, sempre em armazenamento pessoal já usado e já confiável para o usuário |
| Restauração malfeita pode reintroduzir dado errado (mesmo risco que já existe hoje, ao vivo, no console) | Confirmação humana obrigatória antes de qualquer sobrescrita (seção 5) — nunca automático |

## Critérios de Validação

Reaproveita o mesmo painel de diagnóstico já proposto no `ARQ-004.1`: depois de qualquer
restauração, comparar contagens (pessoas, participações, setores) contra o esperado, antes de
considerar o incidente encerrado.

## Recomendação Final

Aprovar os dois horizontes propostos: (1) botão de exportação manual — implementável a qualquer
momento, sem depender de nenhum outro ARQ, e (2) audit trail (`/auditoria`) — naturalmente
encaixado na migração já planejada pelo ARQ-004.1, sem custo adicional relevante se implementado
junto. Automação plena (Cloud Scheduler) fica registrada como evolução futura, não bloqueante.

**Nota sobre a ação imediata mencionada pelo usuário (export manual do documento atual antes de
qualquer próxima mudança estrutural):** esta sessão ainda não executou esse export — envolve
acessar o Firestore de produção (leitura, mas dado real). Antes de fazer isso, prefiro confirmar
com você a forma (ver pergunta em separado nesta resposta).

**Este documento é exclusivamente diagnóstico/de projeto — nenhum código foi escrito, nenhum
backup foi executado, nenhuma coleção nova foi criada.**
