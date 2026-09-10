# AUDIT-17-PROTOCOLO-R2 — Validação real de concorrência, PWA e reentrada

**Gate:** R2 · **Branch:** `audit/fix-invite-reentry` @ `ed366c0`
**Versão candidata:** `1.3.0-rc1` / build `2026-08-31`
**Data:** 2026-08-31
**Status:** 📋 **PROTOCOLO — não executado.** Requer dois aparelhos físicos e uma pessoa operando.

> **Etapa 1 já concluída** no commit `ed366c0` (generalização do AUDIT-03). Árvore limpa.

---

## Por que este gate não pode ser simulado

As fases 10, 13, 14 e 15 rodaram em bancada: código real, **dados forjados**, **sem rede**. Elas
provaram que a lógica está correta. **Não provam nada sobre**:

| O que só o R2 alcança | Por quê |
|---|---|
| Latência real | A bancada responde em microssegundos. O aceite envia ~396 KB |
| Armazenamento de dois aparelhos distintos | A bancada simula identidades no mesmo navegador |
| Retomada do PWA pela tela inicial | Comportamento do sistema operacional, não do código |
| Entrega do link pelo WhatsApp | Fora do aplicativo |
| Concorrência com relógios e redes independentes | A bancada é sequencial e determinística |
| Convivência entre versões | Exige duas builds rodando de verdade |

**Nenhum teste artificial substitui isto.** Este documento é o roteiro para executá-lo.

---

# 1. Ambiente

## 1.1 A decisão que torna o R2 seguro

A versão candidata **não está publicada** e a `main` deve permanecer intocada. Ao mesmo tempo, o
R2 precisa de **escrita real e concorrente**. A saída:

> **Servir a versão candidata pela rede local e apontar os aparelhos para um projeto Firebase
> de TESTE — sem alterar uma linha do código candidato.**

Isto é possível porque o próprio aplicativo permite trocar o destino da sincronização: na tela
**Grupos**, o selo **"☁️ Nuvem ativa ✓"** é tocável e abre a tela de configuração, onde se
informa `Project ID` e `API Key` de outro projeto. O destino fica em `localStorage`
(`jdpg_fb_config`) e `loadFbConfig()` passa a usá-lo.

**Consequência:** os aparelhos rodam **os bytes exatos da versão candidata**, com rede real e
concorrência real, e **nenhuma escrita chega à produção**.

## 1.2 Alternativas descartadas, e por quê

| Alternativa | Por que não |
|---|---|
| Rodar com `?teste=1` | O modo isolado **bloqueia leitura e escrita** no Firebase. Sem rede não há concorrência para testar |
| Apontar para a produção num PG vago | Escreve em produção. **Exigiria autorização explícita** e coloca dado real em risco por um teste |
| Publicar a candidata na `main` | É exatamente o que este gate existe para evitar |
| Alterar `FB_DEFAULT_CONFIG` na cópia servida | Os aparelhos deixariam de rodar os bytes exatos da candidata, enfraquecendo o teste |

## 1.3 Preparação

**No computador:**

1. Confirmar a branch e a árvore:
   ```bash
   git status
   git log -1 --format="%H %s"
   ```
   Esperado: árvore limpa, HEAD em **`4b9ccb2`** (ou posterior, na mesma branch).
   *(Revisão MUTIRÃO-16 / C-08 — a referência anterior, `ed366c0`, ficou para trás.)*

2. Extrair a candidata **do commit**, não da pasta de trabalho — **os quatro arquivos**:
   ```bash
   git show HEAD:index.html    > campo/index.html
   git show HEAD:manifest.json > campo/manifest.json
   git show HEAD:icon-192.png  > campo/icon-192.png
   git show HEAD:icon-512.png  > campo/icon-512.png
   ```
   *(Revisão MUTIRÃO-16 / C-06 — a versão anterior extraía só dois. O `manifest.json` referencia
   os dois ícones, e o aparelho os busca: comprovado no registro de acesso de 10/09.)*

   ⚠️ **Os bytes vêm do Git, nunca da pasta de trabalho.** Com `core.autocrlf=true` o arquivo em
   disco tem CRLF e o repositório (e o GitHub Pages) servem LF — 1 byte de diferença por linha.
   Servir o arquivo da pasta faria os aparelhos testarem bytes que nunca vão ao ar.

3. Servir na rede local. ⚠️ **Não use `http://+:8099/` com `HttpListener`**: isso exige
   `netsh http add urlacl`, **comando de administrador**, e a conta desta máquina não é
   administradora. Use **`System.Net.Sockets.TcpListener`** em `0.0.0.0:8099`, que abre socket
   comum sem privilégio. Script pronto e testado: `servidor-campo.ps1`, no kit da sessão.
   *(Revisão MUTIRÃO-16 / C-07.)*

   **Regra de firewall não foi necessária** — comprovado em 01/09 e reconfirmado em 10/09, com o
   aparelho em outra faixa da rede (`10.31.34.x` → PC em `10.31.121.117`).

4. Descobrir o IP do computador e anotar o endereço: `http://<IP>:8099/index.html`
   O próprio script imprime o endereço ao subir. **O IP muda — usar sempre o do dia.**

**No Firebase:**

5. Criar um projeto **novo**, exclusivo para o teste. Firestore em modo de teste.
6. Anotar `Project ID` e `API Key`.
7. ⚠️ **Conferir três vezes que o `Project ID` NÃO é `jornada-pequenos-grupos`.**

**Nos dois aparelhos (A e B):**

8. Abrir `http://<IP>:8099/index.html` no navegador. ⚠️ **Abrir no navegador de verdade**
   (Safari/Chrome), não no navegador embutido do WhatsApp — ele guarda os dados num lugar
   separado e o app "esquece" tudo depois.

   ⚠️ **A partir deste instante o aparelho já está apontado para a PRODUÇÃO.** Sem configuração
   salva, o app usa `FB_DEFAULT_CONFIG`, que é a produção, e sincroniza sozinho ao abrir.
   **Não tocar em mais nada até concluir o passo 10.**

9. Entrar no **Painel do Tutor** e tocar no botão **"☁️ Nuvem: `<projeto>`"**, logo acima de "Sair".

   ⚠️ *(Revisão MUTIRÃO-16 / C-01.)* **A instrução anterior — "ir à tela Grupos e tocar no selo
   ☁️ Nuvem ativa" — era inexecutável.** A `screen-grupos` foi removida no FUNC-02c e o selo, que
   era criado dentro dela, foi junto; `openFbSetup()` ficou sem nenhum chamador na interface.
   Descoberto em 10/09/2026 **com a sessão já montada e uma pessoa disponível**, o que obrigou a
   adiá-la. O botão do Painel foi criado no commit `4b9ccb2` para resolver isso.

10. Informar o `Project ID` e a `API Key` **do projeto de teste**.
11. No **aparelho A apenas**, aceitar "enviar os dados deste aparelho para iniciá-la" — isso semeia
    o projeto de teste. No **aparelho B**, a nuvem já terá conteúdo.
12. **Verificar em cada aparelho, antes de qualquer teste:** o próprio botão passa a exibir
    `☁️ Nuvem: <Project ID>` e fica **laranja** quando o projeto **não** é a produção.
    **Ler o nome em voz alta.** Se aparecer `jornada-pequenos-grupos` — ou se o botão estiver
    cinza —, **parar tudo**.

## 1.4 Regras de segurança do R2

| Regra | |
|---|---|
| 🔒 | **Nenhum aparelho pode ficar apontado para a produção durante o R2** |
| 🔒 | Antes de começar, anotar o `updateTime` da produção; ao terminar, conferir que ele **só mudou por uso normal de campo** |
| 🔒 | `firestore.rules` do projeto de PRODUÇÃO **não é tocada** |
| 🔒 | Ao final, **desfazer a configuração** nos dois aparelhos (ou limpar os dados do site) para que não voltem a produção com estado de teste |
| 🔒 | O convite do teste é gerado **dentro do projeto de teste** — nenhum convite real é usado |

---

# 2. O mecanismo que impede a perda de atualização

*Exigido pelo Teste Crítico 2. Documentado a partir do código, para que o teste confirme ou
refute uma afirmação precisa — não uma impressão.*

## 2.1 Trava otimista por carimbo do servidor

```
1. O aparelho LÊ o documento          → recebe updateTime = T
2. Monta a alteração em memória       → nada é gravado ainda
3. GRAVA enviando ...&currentDocument.updateTime=T
4. O Firestore só aceita se o documento AINDA estiver em T
   · se outro aparelho gravou nesse intervalo → HTTP 400 FAILED_PRECONDITION
5. Em caso de recusa, o laço RELÊ o documento do zero e refaz tudo
```

| Onde | Código |
|---|---|
| Envio da pré-condição | `fbWriteGrupos` — `url += '&currentDocument.updateTime=' + …` |
| Origem do carimbo (rota do convite) | `commitConviteChange` — `baseUpdateTime: remote.updateTime` |
| Origem do carimbo (rota de grupos) | `saveGruposToFirebase` → `trySaveGrupos(cfg, prep.remote.updateTime)` |
| Releitura a cada tentativa | `commitConviteChange` — `fbReadDoc` dentro do laço |

**É este mecanismo, e só ele, que impede o lost update clássico.** Ele é do servidor: não depende
de o aplicativo se comportar bem.

## 2.2 O que a trava **não** cobre

> A pré-condição protege contra **entrelaçamento**, não contra **ignorância**.

Um aparelho que **lê o estado atual** e grava de volta uma versão empobrecida (porque não conhece
certos PGs ou certos campos) faz, do ponto de vista do servidor, uma gravação legítima. Contra
isso agem outras três defesas, todas **do lado do cliente**:

| Defesa | Introduzida em | Protege contra |
|---|---|---|
| `fbGruposPreservados` | 18/08 | PG que a versão não conhece sumir do payload |
| Guardas G1–G4 | 20/08 | Perda, esvaziamento, colisão e invariantes |
| `resolverCampoIdentidade` | 26/08 | Retrocesso de nome, tutor, coordenador, dia, hora, setores, status |
| **`p.updatedAt` carimbado no aceite** | **B1 (candidata)** | **Cópia velha de participante vencer o empate do merge** |

**Previsão testável:** a versão publicada (28/08) possui as três primeiras. Portanto, no Teste
Crítico 3, ela **não deve** conseguir apagar PGs nem retroceder campos de grupo. O que ela poderia
reverter — a reconciliação de identidade feita pela candidata — é justamente o que o carimbo do B1
passa a impedir. **Se o teste mostrar reversão, o carimbo não está funcionando como projetado.**

---

# 3. Protocolo — os 15 itens

| # | Item | Coberto por |
|---|---|---|
| 1 | Aparelho A na versão candidata | Preparação §1.3 |
| 2 | Aparelho B na versão candidata | Preparação §1.3 |
| 3 | Convite entregue pelo WhatsApp | **TC-5** |
| 4 | Abertura do link | TC-5, TC-4 |
| 5 | Retomada do PWA pela tela inicial | **TC-5** |
| 6 | Latência normal | TC-1, TC-4 |
| 7 | Latência elevada | **TC-1b** |
| 8 | Dois aceites próximos | **TC-1** |
| 9 | Duas gravações próximas | **TC-1c** |
| 10 | Participante A + participante B | TC-1 |
| 11 | Preservação simultânea dos dois registros | **TC-1** |
| 12 | Reentrada pelo mesmo convite | **TC-4** |
| 13 | Divergência de identidade | **TC-4b** |
| 14 | Aparelho com estado local anterior | **TC-2** |
| 15 | Comportamento após fechar e reabrir o PWA | **TC-5** |

---

# 4. Testes críticos

## TC-1 — LOST UPDATE

**Objetivo:** provar que duas entradas simultâneas resultam em **X + A + B**.

| | |
|---|---|
| **Preparação** | Um PG de teste com pelo menos 1 participante (estado X). Dois convites pendentes distintos, um para cada aparelho |
| **Passo 1** | Nos **dois** aparelhos, abrir a tela do convite e **parar antes** de tocar em "Entrar na Jornada". Isso garante que ambos já leram o mesmo estado X |
| **Passo 2** | Tocar em "Entrar" no **A** e, **em menos de 2 segundos**, tocar em "Entrar" no **B** |
| **Passo 3** | Aguardar as duas telas concluírem |
| **Passo 4** | Conferir a lista de participantes do PG **num terceiro dispositivo** (ou recarregando A) |
| **Esperado** | Os **dois** participantes presentes, além do estado X original |
| **Falha** | Qualquer resultado com apenas um dos dois, ou com o estado X alterado |

**Evidência exigida:** captura de tela da lista final **e** o número de participantes antes e
depois. "Funcionou" não é evidência.

### TC-1b — o mesmo, sob latência elevada

Repetir o TC-1 com a rede degradada em **um** dos aparelhos (modo avião por 2 s no meio da
gravação, ou rede móvel fraca). **Este é o cenário que mais se aproxima da realidade do
hospital.**
**Esperado:** o aparelho degradado demora mais, pode exibir "Sem conexão" ou "Demorou demais" —
e **em nenhuma hipótese o outro participante desaparece**.

### TC-1c — duas gravações próximas (não são aceites)

Com os dois aparelhos já dentro do PG: postar uma gratidão no A e, quase ao mesmo tempo, outra
no B.
**Esperado:** as **duas** gratidões aparecem.

---

## TC-2 — STALE WRITE

**Objetivo:** provar que um aparelho com estado antigo **não destrói** alteração nova de outro.

| | |
|---|---|
| **Passo 1** | No aparelho A, abrir o app na tela Grupos e **deixá-lo aberto e parado** (não fechar, não recarregar) |
| **Passo 2** | No aparelho B, fazer uma alteração legítima e visível (entrar um participante novo, ou renomear algo que o Painel permita) |
| **Passo 3** | Confirmar que a alteração de B chegou à nuvem |
| **Passo 4** | Voltar ao A — **sem recarregar** — e fazer uma gravação qualquer (postar uma gratidão) |
| **Passo 5** | Conferir o estado final |
| **Esperado** | A gratidão do A aparece **e** a alteração do B **continua lá** |
| **Falha** | A alteração de B desaparecer |

**Mecanismo que deve impedir:** a pré-condição (§2.1). A gravação de A carrega o `updateTime`
que A leu; como B gravou depois, o servidor recusa, A relê e regrava sobre o estado já com a
alteração de B.

**Registrar obrigatoriamente:** quanto tempo A ficou aberto antes da gravação. Se A ficar aberto
por muito tempo, ele passa a ser também um teste do **F-74** (o app não recarrega o código
sozinho).

---

## TC-3 — VERSÃO (candidata × publicada) — 🟠 **BLOQUEADO**

> ## ⛔ DECISÃO FORMAL DO USUÁRIO — 2026-09-10
>
> **O TC-3 fica BLOQUEADO / não executável nesta homologação.**
>
> **Motivo da impossibilidade:** o teste exige o aparelho B rodando a versão **publicada** e
> apontado ao projeto de teste. A versão publicada (`1aafe63`) tem **o mesmo defeito C-01** — não
> possui caminho na interface para configurar a nuvem. Mantê-la apontada à produção violaria a
> regra 🔒 do §1.4 ("nenhum aparelho apontado para a produção durante o R2").
>
> **Razão da decisão, nas palavras do usuário:** *"Não devemos publicar a versão candidata apenas
> para criar a condição necessária para testar a publicação. Isso inverteria a lógica da
> homologação."*
>
> **Registro:** o TC-3 permanece como **teste não executado por ausência de pré-condição** — não
> como aprovado, nem como reprovado. Mesmo tratamento dado ao T9 na matriz do Mutirão: não é
> defeito de código, é ausência de condição de execução.
>
> **Transferência de risco:** o risco que o TC-3 investiga — a versão antiga sobrescrevendo dado
> novo — fica **formalmente transferido para a FASE 6 do lançamento**, cujo mecanismo é o aviso aos
> coordenadores com **link que fura o cache**. Esse risco continua **aberto** até lá.
>
> Ver `MUTIRAO-16-CONSISTENCIA-PRE-SESSAO.md` §5.

**O texto original do teste fica preservado abaixo**, para quando a pré-condição existir — isto é,
depois de a candidata estar publicada, quando "candidata × publicada" passará a comparar a versão
nova contra a *próxima* candidata.

---

**Objetivo:** verificar se a versão publicada consegue destruir alteração feita pela candidata.

⚠️ **Não alterar a versão publicada.** Ela é usada como está, no endereço público.

| | |
|---|---|
| **Aparelho A** | versão **candidata** (`http://<IP>:8099/`) |
| **Aparelho B** | versão **publicada** (`https://capelaniahospitalar.github.io/jornada-pequenos-grupos/`) |
| ⚠️ **Crítico** | **B também precisa ser apontado para o projeto de TESTE** pelo selo de sincronização, antes de qualquer ação. Sem isso, B escreve em PRODUÇÃO |

| | |
|---|---|
| **Passo 1** | Em A (candidata), fazer uma **reconciliação de identidade**: abrir um convite num navegador limpo e entrar digitando o nome com variação (sem acento ou abreviado) |
| **Passo 2** | Confirmar que o registro foi reconciliado e o progresso preservado |
| **Passo 3** | Em B (publicada), abrir o app, deixar sincronizar e fazer uma gravação qualquer |
| **Passo 4** | Voltar a A, recarregar, e conferir o registro |
| **Esperado** | A reconciliação **permanece**. É o efeito do carimbo `updatedAt` do B1 |
| **Falha** | O registro voltar à identidade antiga |

**Também verificar:** nenhum PG desaparece. A versão publicada (28/08) tem as guardas de perda —
se algum PG sumir, é um defeito **da versão publicada**, e muito mais grave que o R2.

---

## TC-4 — REENTRADA REAL

| | |
|---|---|
| **Passo 1** | Participante recebe o convite e **entra** |
| **Passo 2** | Registrar algum progresso (concluir um estudo) e anotar o valor exibido |
| **Passo 3** | **Fechar o PWA de verdade** — removê-lo do alternador de aplicativos, não só voltar à tela inicial |
| **Passo 4** | Abrir novamente |
| **Passo 5** | Receber **o mesmo** link e abri-lo |
| **Passo 6** | Aceitar novamente |
| **Passo 7** | Conferir o estado |

| Esperado | |
|---|---|
| Sem duplicidade | um único registro na lista do PG |
| Sem bloqueio indevido | **não** deve aparecer "utilizado por outra pessoa" |
| Progresso preservado | o valor anotado no passo 2, intacto |
| Convite | continua marcado como utilizado, sem novo consumo |

### TC-4b — divergência de identidade

| | |
|---|---|
| **Passo 1** | No mesmo aparelho, **limpar os dados do site** (ou abrir em outro navegador) — isso cria identidade nova |
| **Passo 2** | Abrir um convite novo e entrar **digitando o nome com variação** (sem acento, ou só o primeiro nome) e o mesmo WhatsApp |
| **Esperado** | Recupera o cadastro; **não** cria segundo registro; progresso preservado; o nome cadastrado **não é substituído pelo abreviado** |

### TC-4c — participante removido

| | |
|---|---|
| **Passo 1** | Coordenador remove o participante pelo Painel |
| **Passo 2** | Confirmar que ele **sumiu** da lista |
| **Passo 3** | Coordenador emite convite novo; participante aceita |
| **Esperado** | Volta a **aparecer na lista**, com o progresso anterior |

---

## TC-5 — WHATSAPP / PWA

**O convite deve ser entregue como um usuário real o receberia.**

| | |
|---|---|
| **Passo 1** | Coordenador gera o convite **pelo app** e envia pelo WhatsApp |
| **Passo 2** | O destinatário abre o link **tocando nele dentro do WhatsApp** |
| **Passo 3** | Registrar **onde o link abriu**: navegador embutido do WhatsApp, navegador padrão, ou PWA |
| **Passo 4** | Entrar |
| **Passo 5** | Instalar na tela inicial ("Instalar app na tela inicial") |
| **Passo 6** | Fechar tudo e abrir **pelo atalho** |
| **Passo 7** | Verificar se o app **reconhece a pessoa** |
| **Passo 8** | Retomar pelo alternador de aplicativos (sem fechar) e verificar de novo |

| Registrar obrigatoriamente | |
|---|---|
| Onde o link abriu | navegador embutido / padrão / PWA |
| Se o atalho reconheceu a pessoa | **é o achado de campo mais recorrente do projeto** |
| Se apareceu algum Service Worker | não deve existir nenhum — o app **desregistra** qualquer um que encontre |
| A versão em execução | ver o procedimento abaixo — **não há versão exibida na tela** |

### Como conferir a versão — *(Revisão MUTIRÃO-16 / C-02)*

⚠️ **O app não exibe a versão em lugar nenhum.** `APP_VERSION` existe no código, mas só aparece
dentro de uma mensagem técnica de erro. A exigência original — *"conferir que a versão exibida é
`1.3.0-rc1`"* — era inexecutável.

**Decidido não alterar o app para isso.** A verificação passa a ser feita assim, e vale como
"conferida, não presumida":

| Passo | |
|---|---|
| 1 | Cada participante toca no botão **🔄** no alto da Home. Ele recarrega com `?atualizar=<timestamp>`, forçando o download do arquivo |
| 2 | Confere-se a linha correspondente em **`registro-da-sessao.txt`**, gravada pelo servidor do kit: `HH:MM:SS  <IP>  /index.html  200 OK` |
| 3 | Só então a rodada roda |

Como o md5 do arquivo servido é conferido contra o commit na montagem do kit, cada linha prova:
*"este aparelho baixou, nesta hora, exatamente os bytes de `4b9ccb2`"*.

**A ausência da linha denuncia o F-74** — página antiga ainda viva na memória, retomada do segundo
plano sem recarregar. Nesse caso **a rodada não vale**.

O servidor ainda envia `Cache-Control: no-store`, o que elimina o cache como causa e deixa apenas
o caso da página em memória, coberto pelo ritual acima.

⚠️ **Atenção especial:** ao **retomar** o app do segundo plano, o código **não é recarregado**
(achado F-74). Se o aparelho tiver aberto a versão publicada antes, pode continuar rodando ela.
**Sempre confirmar a versão antes de cada rodada.**

---

# 5. Ficha de evidência

Uma por cenário. **"Funcionou" não é evidência.**

```
TESTE          :
DISPOSITIVO    :  (modelo, sistema, navegador)
VERSÃO         :  (linha do registro-da-sessao.txt após o 🔄 — hora e IP)
PROJETO FIREBASE: (lido no botão "☁️ Nuvem:" do Painel — deve estar LARANJA)
HORÁRIO        :
AÇÃO A         :
AÇÃO B         :
ESTADO ANTES   :  (nº de participantes, progresso, nomes)
ESTADO DEPOIS  :
RESULTADO      :
PASS/FAIL      :
EVIDÊNCIA      :  (captura de tela / contagem / cópia do documento)
```

**Para os testes de concorrência, anexar também** a leitura do documento no Firebase (Console →
Firestore → `jdpg/grupos`) antes e depois, com o `updateTime`.

---

# 6. Critério de aprovação

```
[ ] lost update não ocorreu                                  (TC-1, TC-1b, TC-1c)
[ ] stale write não destruiu alteração nova                  (TC-2)
[ ] dois participantes preservados                           (TC-1)
[ ] reentrada funcionou                                      (TC-4)
[ ] mesmo convite tratado de forma idempotente               (TC-4)
[ ] WhatsApp funcionou                                       (TC-5)
[ ] retomada do PWA funcionou                                (TC-5)
[ ] identidade permaneceu consistente                        (TC-4b)
[ ] progresso permaneceu íntegro                             (TC-4, TC-4c)
[—] versão antiga não destruiu estado novo                   (TC-3 — BLOQUEADO,
                                                              risco transferido à FASE 6)
[ ] nenhum comportamento inexplicável
```

## Se um teste crítico falhar

**Não corrigir de imediato.** A sequência é:

1. **Registrar** a ficha de evidência completa, com capturas;
2. **Não repetir por cima** — preservar o estado em que a falha ocorreu;
3. **Exportar o documento** do Firebase de teste naquele momento (é o instantâneo do defeito);
4. **Reproduzir isoladamente** — em bancada, se possível, com os dados exportados;
5. **Só então** determinar a causa raiz;
6. Distinguir explicitamente **falha do código** de **falha do protocolo ou do ambiente** — nas
   fases anteriores, **cinco** "defeitos" acabaram sendo erro da bancada, não do aplicativo.

---

# 7. Limites deste protocolo

| Limite | |
|---|---|
| **Não posso executá-lo** | Exige dois aparelhos físicos, WhatsApp e uma pessoa operando |
| Projeto Firebase de teste ≠ produção | O volume de dados será menor; o peso de ~396 KB por aceite **não** será reproduzido fielmente a menos que o projeto de teste receba uma cópia do documento real |
| TC-3 tem alcance limitado | A versão publicada (28/08) já tem todas as guardas de perda. Uma versão **anterior a 18/08** — que é a realmente perigosa — não está disponível para teste sem publicá-la |
| Latência elevada é aproximada | Modo avião não reproduz fielmente uma rede lenta e instável |
| Não cobre o volume real | Um PG de teste com poucas pessoas não estressa o payload como os 70 slots reais |

## Sugestão para aumentar o realismo do TC-1b

Semear o projeto de teste com uma **cópia do documento real de produção** (leitura, nunca
escrita), para que o payload tenha o tamanho verdadeiro (~396 KB) e a latência seja
representativa. ⚠️ Isso coloca dados de pessoas reais num projeto de teste — **só fazer com
autorização explícita**, e apagar o projeto ao final.

---

# 8. Situação

| | |
|---|---|
| Etapa 1 (AUDIT-03) | ✅ concluída — commit `ed366c0` |
| Etapa 2 (protocolo) | ✅ este documento |
| **Execução do R2** | ⏳ **aguardando** dois aparelhos e uma janela de teste |
| Merge · publicação · tag | 🔒 não autorizados |
| `main` | 🔒 intocada em `1aafe63` |
| `firestore.rules` | 🔒 intocado |
| Produção | 🔒 nenhuma escrita |
