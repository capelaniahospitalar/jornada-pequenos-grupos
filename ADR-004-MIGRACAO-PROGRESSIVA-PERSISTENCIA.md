# ADR-004 — Estratégia de Migração Progressiva de Persistência

**Data:** 2026-07-30 · **Status:** Aceito (registro permanente — não pré-condiciona nenhuma
implementação, só a forma como qualquer migração estrutural futura deve ser conduzida)

**Problema:** o ARQ-004 decidiu substituir a arquitetura de persistência atual (documento único
do Firestore) por um modelo de coleções por entidade — a mudança estrutural de maior risco já
proposta nesta série. Sem uma regra permanente registrada, cada futura substituição de peça
crítica do sistema (persistência, autenticação, motor de cálculo) corre o risco de repetir
decisões ad-hoc a cada vez, ou pior, tentar uma substituição "big bang" sem rede de segurança.

**Alternativas consideradas:**
1. Migração direta (substituir o modelo antigo pelo novo de uma vez) — descartada: sem período
   de validação com dado real, qualquer defeito no modelo novo só aparece depois que não há mais
   como comparar contra o comportamento anterior.
2. **Migração progressiva com coexistência, validação e rollback — adotada.** Já é,
   coincidentemente, o padrão que o próprio projeto usou duas vezes antes de esta decisão ser
   formalizada: `migrarSetoresParaMestre()` (RC4.8.2A) e o motor `getPgIMDv2` (RC3.5.3→RC3.5.5).

**Decisão:** o sistema nunca substitui uma peça arquitetural crítica por outra sem, nesta ordem:
1. **Coexistência** — o modelo/motor novo convive com o antigo, atrás de uma *feature flag*
   (mesmo padrão de `FB_FLAGS` já em uso), sem remover o antigo.
2. **Validação com dado real** — comparação ativa entre os dois (painel de diagnóstico ou
   equivalente), nunca só teste isolado/hipotético — este projeto não tem suíte de testes
   automatizada (ARQ-001), então a validação com produção real é a rede de segurança que existe.
3. **Rollback disponível até o corte final** — reverter para o modelo antigo deve ser uma troca
   de flag, nunca uma reconstrução de dado, durante todo o período de coexistência.
4. **Corte por critério objetivo, não por calendário nem por impressão** — mesmo princípio já
   usado para a Fase de Implantação do IMD v2 ("não ajustar por reação a um resultado inicial").

**Consequências positivas:**
- Formaliza, como regra permanente, um padrão que já funcionou duas vezes neste projeto — não
  impõe nada novo aos desenvolvedores/à IA que vier a trabalhar aqui no futuro, só nomeia o que
  já era boa prática implícita.
- O plano de migração já desenhado no `ARQ-004.1` é a primeira aplicação formal desta regra, não
  uma exceção a ela.
- Qualquer decisão futura de "vamos trocar X por Y" pode ser avaliada objetivamente contra este
  ADR: tem coexistência? Tem validação com dado real? Tem rollback? Se alguma resposta for não,
  o plano não está pronto para execução.

**Limitações conhecidas:**
- Não elimina o risco de um defeito que só se manifesta depois do corte final (nenhuma
  validação prévia é garantia absoluta) — reduz drasticamente a probabilidade, não a zera.
- Tem custo de manutenção temporário mais alto (dois modelos rodando ao mesmo tempo) — aceito
  como o preço da segurança, mesmo trade-off já aceito nos dois precedentes.
