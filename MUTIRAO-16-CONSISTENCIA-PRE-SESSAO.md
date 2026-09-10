# MUTIRÃO-16 — Consistência entre os protocolos e o kit da sessão de campo

**Data:** 2026-09-10
**Objeto auditado:** `AUDIT-17-PROTOCOLO-R2.md`, `MUTIRAO-13-PROTOCOLO-R2.md` e o kit da sessão
**Kit de referência:** commit `4b9ccb2`, branch `audit/fix-invite-reentry`
**Motivo:** dois passos do protocolo se revelaram inexecutáveis no dia da sessão, com pessoa
disponível e servidor no ar. A sessão foi adiada. Esta auditoria existe para que isso não
volte a acontecer.

---

## 1. Por que esta auditoria foi necessária

Os dois protocolos foram escritos em 31/08 e 08–09/09. Entre a escrita e a execução, o aplicativo
mudou. **Nenhum dos dois documentos foi reconferido contra o app antes de marcar a sessão.**

O resultado foi descobrir, ao vivo, que o passo 9 do `AUDIT-17` §1.3 — *"ir à tela Grupos e tocar
no selo ☁️ Nuvem ativa"* — descrevia uma tela **removida do app**. Sem esse passo não há como
apontar um aparelho ao projeto de teste, e sem isso a sessão gravaria em produção.

Um protocolo desatualizado não é um documento imperfeito: é um **teste que não pode ser
executado**, descoberto no pior momento possível.

---

## 2. Método

Cada elemento de interface, função e comportamento citado pelos dois protocolos foi conferido
contra o `index.html` do commit `4b9ccb2` — por leitura de código e, onde havia dúvida, por
execução do app.

Elementos conferidos: 9 de interface, 4 funções do motor de limpeza do Mutirão, o sinal de
validade do R2-D, o procedimento de servir a candidata e a versão de referência do commit.

---

## 3. Achados

| # | Origem | Divergência | Gravidade | Situação |
|---|---|---|---|---|
| **C-01** | `AUDIT-17` §1.3 p.9 | "tela Grupos / selo ☁️ Nuvem ativa" **não existe** — removida no FUNC-02c junto com a `screen-grupos`. `openFbSetup()` ficou sem nenhum chamador | 🔴 **Bloqueador** | ✅ **Corrigido no app** (`4b9ccb2`): botão no Painel do Tutor, nos dois caminhos. Doc a atualizar |
| **C-02** | `AUDIT-17` TC-5 e §checklist; `MUTIRAO-13` §7.1 e §checklist | Exigem *"versão conferida na tela, não presumida"* — o app **não exibe a versão** em lugar algum | 🔴 **Bloqueador** | ✅ **Resolvido por procedimento**, sem mexer no app (ver §4) |
| **C-03** | `AUDIT-17` TC-3 | Exige o aparelho B rodando a versão **publicada** e apontado ao projeto de teste. **A versão publicada (`1aafe63`) tem o mesmo defeito C-01** — não há como apontá-la a outro projeto. Mantê-la na produção viola o §1.4 | 🔴 **Bloqueador estrutural** | ⚠️ **TC-3 é inexecutável neste R2.** Decisão pendente (ver §5) |
| **C-04** | `MUTIRAO-13` §6.3 | Manda ler `mutiraoConflitos` **no console do navegador**. Em iPhone/Safari não há console acessível — e `mutiraoConflitos` não aparece em nenhuma tela | 🟠 **Bloqueador operacional** | Proposta em §4 |
| **C-05** | `MUTIRAO-13` §6.3 | Cita a linha `"...disparou na tentativa 1 — outro aparelho gravou primeiro."`. O texto real hoje é `"...disparou no PG N, tentativa N — ..."` (mudou na migração por PG de 09/09) | 🟡 Menor | Corrigir citação |
| **C-06** | `AUDIT-17` §1.3 p.2 | Extrai só `index.html` e `manifest.json`. **Faltam `icon-192.png` e `icon-512.png`**, referenciados pelo manifest | 🟡 Menor | ✅ Kit já serve os **4** arquivos; comprovado por registro de acesso do celular |
| **C-07** | `AUDIT-17` §1.3 p.3 | Manda servir com `http://+:8099/` e "liberar a porta no firewall". Isso exige `netsh http add urlacl` — **comando de administrador, impossível nesta máquina** | 🔴 **Bloqueador** | ✅ **Superado**: kit usa `TcpListener` (socket comum, sem privilégio). Firewall comprovadamente desnecessário |
| **C-08** | `AUDIT-17` §1.3 p.1 | Espera HEAD em `ed366c0` | 🟡 Menor | Atualizar referência para `4b9ccb2` |

**Total:** 8 divergências — **4 bloqueadoras** (2 corrigidas no app, 1 resolvida por procedimento,
1 estrutural pendente), 1 operacional e 3 menores.

---

## 4. Resoluções adotadas

### C-02 — verificação de versão, sem alterar o app

O app tem, no alto da Home, o botão **🔄**, que recarrega a página com um endereço novo
(`?atualizar=<timestamp>`), forçando o download do arquivo.

Isso **garante** a versão nova, mas não a **comprova**. A comprovação vem do servidor do kit, que
registra cada arquivo entregue em `registro-da-sessao.txt`, com hora, IP de origem e resultado:

```
17:32:05  10.31.34.227  /index.html  200 OK
```

Como o md5 do arquivo servido é conferido contra o commit na montagem do kit, cada linha dessas
prova: *"este aparelho baixou, nesta hora, exatamente os bytes de `4b9ccb2`"* — evidência mais
forte do que ler um número na tela.

**Ritual obrigatório antes de cada rodada:** cada participante toca no 🔄; confere-se a linha
correspondente no registro; só então o teste roda. **A ausência da linha denuncia o F-74** (página
antiga ainda viva na memória, retomada do segundo plano sem recarregar).

O servidor ainda envia `Cache-Control: no-store` em toda resposta, o que elimina o cache como
causa e deixa apenas o caso da página em memória — coberto pelo ritual acima.

### C-04 — leitura do `mutiraoConflitos`

`mutiraoConflitos` só existe na memória do JavaScript e só é legível pelo console. **Um iPhone não
oferece console**, o que torna o sinal de validade do R2-D inacessível justamente no aparelho onde
o teste é mais realista.

**Proposta:** o **aparelho B passa a ser o navegador do próprio PC**, com o segundo participante
usando o celular como aparelho A. Os dois continuam sendo clientes reais do mesmo PG gravando ao
mesmo tempo — que é o que o R2-D exige — e o `mutiraoConflitos` fica legível no PC.

**Desvio declarado:** perde-se o cenário "dois celulares em rede móvel". A variante §6.4 (rede
degradada) continua possível no aparelho A. Registrar como limitação do R2-D.

---

## 4-bis. Decisões formais do usuário — 2026-09-10

### C-03 / TC-3 — **BLOQUEADO / não executável nesta homologação**

> *"Não devemos publicar a versão candidata apenas para criar a condição necessária para testar a
> publicação. Isso inverteria a lógica da homologação."*

- O TC-3 fica registrado como **teste não executado por ausência de pré-condição** — **não** como
  aprovado, **nem** como reprovado.
- O risco correspondente fica **formalmente transferido para a FASE 6**, com o mecanismo de
  atualização / "fura-cache" destinado aos coordenadores.

**Aplicado em:** `AUDIT-17-PROTOCOLO-R2.md` — cabeçalho do TC-3 e critério de aprovação (§6).

### C-04 / `mutiraoConflitos` — **APROVADO COM DESVIO CONTROLADO**

Configuração aceita:

| | |
|---|---|
| Aparelho A | celular do segundo participante, **em rede móvel** |
| Aparelho B | **navegador do PC**, autenticado como Tutor |
| Gravação | concorrente, os dois clientes no mesmo PG |
| `mutiraoConflitos` | observado no console do PC |
| Degradação de rede | permanece testável no aparelho A |

**Exigência explícita do usuário:** *"O protocolo deve declarar explicitamente que o desvio é a
substituição do segundo celular por um navegador de PC, sem apresentar isso como se fosse o
cenário original de dois celulares."*

**Aplicado em:** `MUTIRAO-13-PROTOCOLO-R2.md` §6.1 (bloco de desvio declarado) e §6.3.

---

## 5. Fundamentação do TC-3 (mantida para registro)

O TC-3 pergunta: *"a versão publicada consegue destruir alteração feita pela candidata?"*

É uma pergunta legítima e importante — o padrão "aparelho com app antigo reverte dado novo" é a
causa de vários incidentes deste projeto. Mas **ela não pode ser respondida neste R2**:

- o aparelho B teria de rodar a versão publicada;
- a versão publicada não tem como ser apontada ao projeto de teste (C-01 vale para ela também);
- mantê-la apontada à produção viola a regra 🔒 do §1.4.

E há circularidade: publicar a candidata resolveria o impasse, mas a publicação é justamente o que
esta homologação existe para autorizar.

**Encaminhamento recomendado:** declarar o TC-3 **BLOQUEADO**, com a mesma honestidade com que o
`AUDIT-17` já declarou o T9 — não é defeito de código, é ausência de condição de execução. O risco
que ele investiga **permanece aberto** e deve ser tratado na FASE 6 do lançamento (aviso aos
coordenadores com link que fura o cache), não na sessão de campo.

---

## 6. Veredicto — fechado em 2026-09-10

| Item | Decisão |
|---|---|
| Kit `4b9ccb2` | ✅ **Apto** |
| C-01 | ✅ Fechado |
| C-02 | ✅ Fechado por procedimento |
| C-03 / TC-3 | 🟠 **Bloqueado e formalmente justificado** |
| C-04 | 🟠 **Aprovado com desvio controlado** |
| C-05 a C-08 | ✅ Tratados |
| `AUDIT-17-PROTOCOLO-R2.md` | ✅ Atualizado |
| `MUTIRAO-13-PROTOCOLO-R2.md` | ✅ Atualizado |
| Homologação em campo | ❌ **Ainda não iniciada** |
| FASE 5 (merge autorizado) | ❌ Não começou |
| FASE 6 (publicação e aviso) | ❌ Não começou |
| **Lançamento definitivo** | ❌ **Não** |

**Estado declarado: PRONTO PARA HOMOLOGAR.**

Nenhuma alteração funcional adicional deve ser feita no aplicativo a partir deste ponto. O próximo
marco é a execução da sessão de homologação sobre o kit `4b9ccb2`, sem mudança de bytes.

---

## 7. O que este documento **não** significa

Chegar ao fim desta auditoria com os itens fechados significa **uma coisa só**: que a sessão de
homologação externa pode ser executada sem levar a campo um protocolo desatualizado.

**Não significa:**

- que o Mutirão está liberado para os 70 PGs;
- que a `main` pode receber o pacote;
- que a candidata está homologada.

A homologação **depende de a sessão acontecer e passar**. Enquanto o R2-D não for executado com
dois clientes reais no mesmo PG, e enquanto a matriz do `AUDIT-17` não for percorrida, a
`1.3.0-rc1` continua sendo **candidata** — e a `main` continua intocada em `1aafe63`.

O lançamento definitivo é a FASE 5 (merge autorizado) seguida da FASE 6 (prova por `curl` de que a
versão está no ar e aviso aos coordenadores com link que fura o cache). Nenhuma das duas começou.
