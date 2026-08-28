# App Pequenos Grupos ("Jornada Discipular em Pequenos Grupos")

## Identidade deste projeto
- Pasta local neste PC: `jornada-pequenos-grupos` — única pasta de trabalho deste produto
- Repositório GitHub: `capelaniahospitalar/jornada-pequenos-grupos` (confirmar sempre por `git remote -v`)
- Produto: sistema de Pequenos Grupos da Capelania HAS — grupos, tutores, participantes, convites, contadores compartilhados, sincronização Firebase
- Nome instalável do app: "PEQUENO GRUPO SILVESTRE"

## Separação de produtos (decisão de 2026-07-08)
- Este app é INDEPENDENTE do app de discipulado "Aos Pés do Mestre Jesus" (repo `capelaniahospitalar/jornada-discipular`), apesar do histórico Git comum e dos nomes parecidos.
- "Jornada Discipular" no título DESTE app é parte do nome do produto — não confundir com o repo `jornada-discipular`, que é o OUTRO app.
- NUNCA copiar funcionalidades, nomenclaturas ou decisões do app de discipulado para cá sem pedido explícito do usuário (ex.: nível/XP nas boas-vindas foi contaminação e foi removido).
- A pasta `_ANTIGO-pequenos-grupos` é uma cópia antiga deste repo, mantida só como histórico — NUNCA trabalhar nela. Trabalho antigo resgatado está em `Documents\GitHub\_ARQUIVO-resgate-2026-07-08`.

## Antes de qualquer trabalho (obrigatório)
1. Rodar `git fetch origin` e `git status -sb`.
2. Se houver atualizações do GitHub para baixar (behind), fazer `git pull` ANTES de editar qualquer arquivo — o usuário trabalha em mais de um computador e a versão mais recente pode ter sido enviada pelo outro PC.
3. Se houver alterações locais não commitadas de sessão anterior, avisar o usuário antes de prosseguir.

## Sobre o usuário e publicação
- O usuário não é programador: explicar decisões em linguagem simples e confirmar escolhas de design antes de aplicar.
- Publicação via GitHub Desktop (conta capelaniahospitalar) ou upload manual pela web; `git push` direto do terminal pode falhar com erro 403.
- Processo do projeto: mudanças incrementais desenhadas→aprovadas→aplicadas, com testes de aceitação e commits isolados (ver ESTADO-E-ROADMAP.md e CHANGELOG.md).

## ⚠️ Dados pessoais — este repositório é PÚBLICO
- O `main` é servido pelo GitHub Pages e o repositório é aberto a qualquer pessoa. **Commit na main = publicação.**
- NUNCA escrever em arquivo do repositório: telefone/WhatsApp, matrícula, CPF, e-mail pessoal ou endereço de participantes. Esses dados vão para a memória do assistente ou para arquivos FORA do repo (ex.: Área de Trabalho).
- Ao documentar um caso real, usar o mínimo necessário: "WhatsApp idêntico nos dois registros" prova o mesmo que os dígitos, sem expor ninguém.
- Remover o dado do arquivo **não apaga o histórico do Git**, que continua público. Por isso a regra é não escrever — a correção depois é cara e incompleta.
- Incidente de referência: um WhatsApp real entrou em 18/08/2026 pelo commit `e38dc35` e permanece no histórico; os arquivos foram limpos em 28/08/2026 (ver item 5 do ESTADO-E-ROADMAP.md).
