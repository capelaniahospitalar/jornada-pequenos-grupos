# Especificação Funcional Consolidada — v1.0 (2026-07-01)

> Este documento reúne as **regras de negócio oficiais** do app de discipulado em Pequenos
> Grupos do Hospital Adventista Silvestre (HAS). Não contém código. É a fonte de referência
> para decidir se um comportamento é um **defeito** (contraria uma regra daqui) ou uma
> **decisão de projeto** (já prevista aqui). Qualquer dúvida de implementação, ou proposta de
> mudança, deve ser confrontada com este documento antes de alterar o código. Convive com o
> `ESTADO-E-ROADMAP.md` (que é o handoff técnico/operacional) — este aqui é o "porquê"; aquele
> é o "onde estamos".
>
> Origem: consolidado a partir da auditoria completa de 2026-07-01 (5 fases + verificações
> extras) e de decisões tomadas ao longo dessa conversa.

## Papéis

- **Colaborador** — participante comum de um Pequeno Grupo. Faz a jornada de 13 estudos,
  participa do grupo, pode ter um Companheiro de Jornada.
- **Coordenador** — um colaborador com responsabilidade de administrar **o seu próprio** PG
  (papéis, reunião, campanhas). Não é um papel de sistema separado — é um colaborador com
  atribuição adicional dentro do mesmo grupo.
- **Tutor (Capelão)** — um dos **4 capelães** da instituição. Acompanha (supervisiona) um ou
  mais PGs. Não é "participante" desses grupos — é responsável espiritual por eles.

## Regras de pertencimento e supervisão

1. **Um colaborador participa de apenas um Pequeno Grupo por vez.**
   Pertencimento é exclusivo — não é possível estar inscrito em dois PGs simultaneamente como
   colaborador comum.
   *Status na implementação: **não garantido hoje** — ver `DB-01` no `ESTADO-E-ROADMAP.md`.*

2. **Um coordenador administra apenas o seu próprio PG.**
   Não tem visão de administração sobre outros grupos.
   *Status: implementado corretamente (verificado na Fase 4 da auditoria).*

3. **Os 4 Tutores (capelães) supervisionam grupos — eles não "participam" desses grupos.**
   Um Tutor pode acompanhar vários PGs ao mesmo tempo; isso é supervisão, não participação
   múltipla (não é uma exceção à regra 1, é um papel de natureza diferente).
   *Status: implementado (modelo de Meus Vínculos, Etapa 1) — mas a implementação atual não
   distingue tecnicamente "supervisionar" de "participar", o que é a raiz do `DB-01`.*

4. **Não existe um papel de "administrador" dentro do app.**
   Acesso realmente global só existe fora do app, via Console do Firebase.

## Identidade e continuidade

5. **A identidade da pessoa deve ser permanente**, não amarrada a um único aparelho ou à
   grafia exata do nome digitado.
   *Status: parcialmente implementado — existe `memberId` (Etapa 1), mas partes do app ainda
   comparam por nome exato (`DB-02`), e não há caminho de recuperação de identidade num
   segundo aparelho (`FLOW-01`).*

6. **A jornada espiritual (estudos, XP, sequência de dias) acompanha o colaborador,
   independentemente do Pequeno Grupo em que estiver.**
   Trocar de grupo não deve reiniciar o progresso pessoal.
   *Status: verdadeiro para o progresso central (fica no aparelho), mas os agregados
   enviados ao grupo só refletem o grupo "aberto" no momento (`DB-03`), e o progresso
   detalhado não sobrevive à perda/troca do aparelho (ver regra 8).*

## Privacidade

7. **O Diário Espiritual (incluindo decisões pessoais registradas) é privado.**
   Ninguém além do próprio colaborador tem acesso — nem o Companheiro de Jornada, nem o
   Coordenador, nem o Tutor.
   *Status: implementado deliberadamente (`ARCH-01`). Não é defeito. Melhoria futura possível:
   backup/exportação privada, sem alterar a confidencialidade.*

8. **Dados de acompanhamento ministerial (ex.: campanhas, presença) devem sobreviver à troca
   ou perda do aparelho** — diferente do diário (regra 7), esse tipo de dado é operacional, não
   confidencial, e precisa ser confiável entre dispositivos.
   *Status: **não garantido hoje** para campanhas (`DB-04`, dado só local).*

## Companheiro de Jornada

9. **O Companheiro de Jornada é um vínculo entre dois participantes do mesmo grupo**
   (convite → aceite → parceria ativa), com no máximo um vínculo ativo por pessoa.

10. **É possível encerrar a parceria e formar uma nova** (`CJ-01`). Motivo: colaboradores mudam
    de setor, turno, grupo, ou deixam a instituição — um vínculo permanente sem saída tornaria o
    recurso insustentável ao longo do tempo. Fluxo: convida → aceita → parceria ativa →
    **encerrar parceria** → qualquer um dos dois pode convidar outra pessoa.
    *Status: **já implementado** (`removeCompanion()`). Confirmado por teste ao vivo em
    2026-07-01 (ambiente isolado da rede, sem tocar dados reais): o vínculo é desfeito para os
    dois lados na mesma ação, e o diário/decisões/XP/estudos concluídos permanecem intactos.
    Único ponto cosmético (não é defeito): o botão hoje se chama "🔄 Trocar companheiro" —
    considerar renomear para algo como "Encerrar parceria" ou "Escolher outro companheiro",
    já que "trocar" pode sugerir substituição imediata, quando na verdade o app primeiro encerra
    e só depois permite um novo convite.*

## Referência cruzada com a auditoria

Para o detalhamento técnico de cada item (onde no código, evidência, gravidade), ver a tabela
final de pendências no `ESTADO-E-ROADMAP.md`. Resumo de prioridade combinado nesta conversa:

- **P1 — Segurança:** `PERM-01` (acesso ao painel por nome, sem verificação)
- **P2 — Integridade de grupos:** `DB-01` (pertencimento múltiplo não bloqueado)
- **P3 — Identidade:** `DB-02` (completar migração para `memberId`)
- **Segunda onda:** `DB-03`, `DB-04`, `FLOW-01`
- **Terceira onda (limpeza, não muda experiência do usuário):** `DB-05`, `FUNC-01`, `STR-01` a `STR-05`
- **Não são defeitos:** `ARCH-01` (Diário Privado), `PERM-02` (já era conhecido e aceito pela
  equipe antes desta auditoria — permanece como decisão a revisitar se o nível de segurança
  esperado pelo HAS mudar)
- **Concluído nesta auditoria, sem pendência:** `CJ-01` (Companheiro de Jornada — confirmado já
  implementado; único item aberto é uma sugestão de UX no rótulo do botão, não uma correção)
