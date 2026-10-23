// ═══════════════════════════════════════════════════════════════════════════
//  ARQUIVO DO 1º CICLO DOS PEQUENOS GRUPOS — guardado para uso posterior
// ═══════════════════════════════════════════════════════════════════════════
// O 1º ciclo usou 13 estudos ("O Amor de Deus" … "Alegria no Senhor").
// Em 26/10/2026 começou o 2º ciclo, com os 17 estudos do "Aos Pés do Mestre".
// Este arquivo NÃO é carregado pelo app: é só a cópia fiel dos dados do 1º ciclo,
// tirada do index.html do commit 24875c9 (tag ciclo-1-final), para reaproveitar depois.
// Contém: STUDIES, OBSTACLES, JOURNEY_MISSIONS, RPG_LEVELS, STUDY_ATTRS, FASE_UNLOCK,
// BADGES, FASE_LABELS, ENCONTROS, OBSTACULOS.

const STUDIES = [

// ─────────────────────────────────────
// FASE 1 — INICIANTE (estudos 1–3)
// ─────────────────────────────────────
{
  title:'O Amor de Deus', xp:80, fase:'iniciante',
  phases:[
    { type:'opening', html:()=>`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">❤️ O ponto de partida de tudo</p>
      <p class="body-text" style="margin-top:.5rem">Antes de qualquer regra, antes de qualquer exigência, existe uma realidade que fundamenta tudo: <strong>Deus é amor.</strong> Não é que Ele tenha amor — Ele é amor na essência.</p>
      <p class="body-text" style="margin-top:.6rem">A natureza inteira é uma obra de arte que revela esse amor. O sol que nasce todo dia, a chuva que rega os campos, o ar que respiramos sem pedir — tudo é sustentado pelo cuidado de um Pai.</p>
      ${V('Salmo 145.15-16','"Os olhos de todos esperam em Ti, e Tu lhes dás o seu mantimento a seu tempo. Abres a mão e satisfazes os desejos de todos os viventes."')}
      <p class="body-text" style="margin-top:.6rem">Mas há algo que vai muito além da natureza. O amor de Deus é mais profundo do que qualquer coisa que a criação possa expressar.</p>
    `},
    { type:'question', html:`<p class="body-text">Quando você pensa em Deus, qual é a primeira imagem que vem à sua mente?</p>`,
      choices:['Um Pai amoroso e próximo','Um Juiz severo e distante','Ainda estou construindo essa imagem'],
      feedback:['Essa percepção é um presente precioso. Ela é a base de tudo que vem a seguir.','Muita gente cresceu com essa visão. Este estudo existe justamente para desfazer essa sombra e revelar quem Deus realmente é.','Ótimo ponto de partida. A jornada que começa hoje vai ajudar a responder essa pergunta com profundidade.']
    },
    { type:'content', html:`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🌿 Deus revelado em Jesus</p>
      <p class="body-text" style="margin-top:.5rem">Durante séculos, o ser humano distorceu a imagem de Deus. O diabo trabalhou para convencer a humanidade de que Ele é um juiz implacável que espreita os erros para aplicar punição. Essa mentira gerou distância, medo e religiosidade vazia.</p>
      <p class="body-text" style="margin-top:.6rem">Foi para desfazer essa mentira que Jesus veio. Ele não veio apenas <em>falar</em> sobre Deus — Ele veio <em>mostrar</em> Deus. Cada cura, cada conversa, cada refeição partilhada com pecadores revelava o caráter real do Pai.</p>
      ${V('João 14.9','"Quem Me vê a Mim vê o Pai."')}
      <p class="body-text" style="margin-top:.6rem">O amor que Jesus demonstrou não era apenas Seu — era o amor do Pai transbordando através dEle. Ao ver Jesus acolher uma mulher rejeitada, devolver a saúde a um leproso, ressuscitar o filho de uma viúva — você está vendo o coração de Deus.</p>
      <p class="body-text" style="margin-top:.6rem">E o ápice dessa revelação? A cruz. Ali, Deus não exigiu sacrifício — Ele <em>foi</em> o sacrifício. Não foi o Pai obrigando o Filho. Foi o Pai e o Filho, juntos, pagando o preço mais alto por amor à humanidade.</p>
      ${V('João 3.16','"Porque Deus amou o mundo de tal maneira que deu o Seu Filho unigênito, para que todo o que nEle crê não pereça, mas tenha a vida eterna."')}
    `},
    { type:'apply', html:`
      <div class="apply-box"><div class="apply-lbl">Ação prática</div>
      <div class="apply-text">Hoje, observe algo na natureza — um pôr do sol, uma planta, o céu. Pare um momento e diga em voz alta ou no coração: <em>"Isso foi feito por alguém que me ama."</em> Deixe essa verdade pousar devagar.</div></div>
    `},
    { type:'close', html:`
      <p class="body-text">O amor de Deus não depende do que você fez ou deixou de fazer. Ele amou o mundo <em>assim mesmo</em> — e esse "assim mesmo" inclui você, com tudo que carrega.</p>
      ${V('1 João 4.9-10','"Nisto se manifestou o amor de Deus para conosco: que Deus enviou Seu Filho unigênito ao mundo, para que vivamos por Ele. Nisto está o amor — não em que nós tenhamos amado a Deus, mas em que Ele nos amou."')}
      <p class="body-text" style="margin-top:.6rem">Você não precisa conquistar o amor de Deus. Ele já é seu. A jornada que começa aqui não é para merecer esse amor — é para descobrir o quanto ele é real.</p>
    `},
    { type:'question', html:`
      <div class="content-card" style="background:var(--navy);border-color:rgba(255,255,255,0.1)">
        <div class="phase-tag" style="color:var(--gold-mid);letter-spacing:1.2px">✦ Reflexão — Estudo 1</div>
        <p class="body-text" style="color:rgba(255,255,255,0.9);margin-bottom:.75rem">Deus não é um cobrador de dívidas. Ele é um Pai que correu ao encontro do filho pródigo antes mesmo que a confissão fosse completada. Essa é a imagem mais fiel de quem Ele é.</p>
        <p class="body-text" style="color:#fff;font-style:italic">Você estaria disposto a se aproximar de Deus a partir dessa nova imagem — a de um Pai que já te ama?</p>
      </div>
    `,
      choices:['Sim, quero conhecer esse Deus','Ainda tenho dificuldade de acreditar nisso','Estou pensando — me dê mais tempo'],
      feedback:['Essa disposição já é uma resposta ao amor que Ele tem por você. Continue.','A dificuldade é honesta e respeitável. Permita que os próximos estudos mostrem, passo a passo, quem Ele realmente é.','Tudo bem. A fé não é instantânea — ela cresce. Continue caminhando.']
    }
  ]
},

{
  title:'A Ponte Sobre o Abismo', xp:80, fase:'iniciante',
  phases:[
    { type:'opening', html:()=>`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🌉 O problema que nenhum ser humano consegue resolver sozinho</p>
      <p class="body-text" style="margin-top:.5rem">${N()}, há uma realidade que a maioria das pessoas sente, mas poucas sabem nomear: existe uma distância entre nós e Deus. Uma lacuna. Uma separação que não é geográfica, mas espiritual.</p>
      <p class="body-text" style="margin-top:.6rem">O ser humano foi criado para viver em comunhão plena com Deus. Mas o pecado cavou um abismo. E o problema é que nenhuma força humana — educação, esforço moral, religiosidade — é capaz de atravessá-lo.</p>
      ${V('Isaías 59.2','"As vossas iniquidades fazem separação entre vós e o vosso Deus."')}
      <p class="body-text" style="margin-top:.6rem">Mas aqui começa a melhor notícia da história.</p>
    `},
    { type:'question', html:`<p class="body-text">Você já sentiu que algo dentro de você busca mais — uma paz, um pertencimento, um sentido que as coisas do mundo não conseguem preencher?</p>`,
      choices:['Sim, sinto isso claramente','Às vezes, em certos momentos','Não, me sinto realizado com o que tenho'],
      feedback:['Esse vazio é a alma reconhecendo o lugar que só Deus pode preencher. Você está no estudo certo.','Esses momentos têm peso. Eles são o coração respondendo a um chamado maior.','Que bom que você está bem. E mesmo assim, vale explorar o que Deus tem a dizer sobre a vida plena.']
    },
    { type:'content', html:`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🪜 A escada que Jacó sonhou</p>
      <p class="body-text" style="margin-top:.5rem">Certa noite, um homem chamado Jacó dormiu em pleno deserto. Estava fugindo, carregando culpa e medo. Sozinho, deitado sobre a terra fria, parecia que Deus estava a milhas de distância.</p>
      <p class="body-text" style="margin-top:.6rem">Naquela noite, ele sonhou com uma escada que tocava o céu — e anjos subindo e descendo por ela. E Deus falando de cima. O sonho não era apenas uma visão bonita: era uma resposta. Deus estava dizendo: <em>o abismo pode ser atravessado. Existe uma ponte.</em></p>
      <p class="body-text" style="margin-top:.6rem">Séculos depois, Jesus se referiu exatamente a esse sonho:</p>
      ${V('João 1.51','"Vereis o céu aberto e os anjos de Deus subindo e descendo sobre o Filho do Homem."')}
      <p class="body-text" style="margin-top:.6rem"><strong>Jesus é a escada. Jesus é a ponte.</strong> Ele é o único meio de conexão real entre o ser humano e Deus. Não a religião. Não a moralidade. Não o esforço. Ele — em pessoa.</p>
      ${V('João 14.6','"Eu sou o caminho, e a verdade, e a vida. Ninguém vem ao Pai senão por Mim."')}
      <p class="body-text" style="margin-top:.6rem">Isso não é exclusivismo. É salvação. Deus não deixou o ser humano sem saída — abriu um caminho que qualquer pessoa, em qualquer condição, pode percorrer.</p>
    `},
    { type:'apply', html:`
      <div class="apply-box"><div class="apply-lbl">Ação prática</div>
      <div class="apply-text">Pense em algo que você carrega e que sente que o separa de Deus — uma culpa, uma dúvida, um pecado. Escreva em algum lugar (pode ser só para você). Depois diga em oração: <em>"Jesus, eu preciso que Você seja essa ponte para mim."</em></div></div>
    `},
    { type:'close', html:`
      <p class="body-text">O abismo existe, mas a ponte também. E a ponte está de pé, esperando por você — não quando você estiver "pronto", mas agora, exatamente como você está.</p>
      ${V('Romanos 5.8','"Mas Deus prova o Seu amor para conosco, em que Cristo morreu por nós, sendo nós ainda pecadores."')}
    `},
    { type:'question', html:`
      <div class="content-card" style="background:var(--navy);border-color:rgba(255,255,255,0.1)">
        <div class="phase-tag" style="color:var(--gold-mid);letter-spacing:1.2px">✦ Reflexão — Estudo 2</div>
        <p class="body-text" style="color:rgba(255,255,255,0.9);margin-bottom:.75rem">Nenhuma conquista humana atravessa o abismo entre nós e Deus. Só Cristo pode fazer isso. E Ele já o fez — a obra está completa. O que Ele espera é a nossa resposta.</p>
        <p class="body-text" style="color:#fff;font-style:italic">Você está disposto a aceitar Jesus como sua ponte — como o único caminho de volta a Deus?</p>
      </div>
    `,
      choices:['Sim, quero aceitar Jesus como meu caminho','Ainda tenho perguntas sobre isso','Quero entender mais antes de decidir'],
      feedback:['Essa é a decisão mais importante da vida. O Céu inteiro celebra neste momento.','As perguntas são bem-vindas. Continue caminhando — a fé cresce no processo.','Sabedoria não é fraqueza. Continue estudando com o coração aberto.']
    }
  ]
},

{
  title:'Libertos da Culpa', xp:80, fase:'iniciante',
  phases:[
    { type:'opening', html:()=>`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🔓 Arrependimento: não é autopunição — é libertação</p>
      <p class="body-text" style="margin-top:.5rem">A palavra "arrependimento" ficou com má fama. Para muita gente ela soa como humilhação forçada ou autopunição religiosa. Mas o arrependimento bíblico é exatamente o oposto: é o primeiro passo para a liberdade.</p>
      <p class="body-text" style="margin-top:.6rem">Arrepender-se significa <strong>mudar de direção</strong>. É perceber que o caminho que você estava seguindo não levava a lugar nenhum bom — e decidir virar.</p>
      ${V('Atos 3.19','"Arrependei-vos e convertei-vos, para que sejam apagados os vossos pecados."')}
    `},
    { type:'question', html:`<p class="body-text">Quando você pensa em arrependimento, o que vem primeiro à mente?</p>`,
      choices:['Culpa e punição','Uma chance de recomeçar','Algo que prefiro não pensar'],
      feedback:['Essa percepção é comum, mas equivocada. O arrependimento bíblico não é sobre punição — é sobre transformação.','Essa é exatamente a perspectiva correta. O arrependimento é uma porta, não uma prisão.','Compreensível. Este estudo vai ajudar a ressignificar esse conceito.']
    },
    { type:'content', html:`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">💛 O arrependimento que transforma</p>
      <p class="body-text" style="margin-top:.5rem">Há uma diferença enorme entre <em>lamentar as consequências</em> do pecado e <em>se arrepender do pecado em si</em>. Quem sente apenas as consequências — a vergonha social, o medo do castigo — ainda não chegou ao arrependimento genuíno.</p>
      <p class="body-text" style="margin-top:.6rem">O verdadeiro arrependimento nasce quando olhamos para o que o pecado <em>realmente é</em>: uma separação do amor de Deus. Quando entendemos o que custou a reconciliação — a cruz — o coração se parte não de medo, mas de amor correspondido.</p>
      <p class="body-text" style="margin-top:.6rem">O Davi do Salmo 51 é o modelo perfeito. Depois de uma queda grave, ele não tentou se justificar nem minimizar. Ele foi a Deus com o peso todo — e pediu não só perdão, mas um coração novo.</p>
      ${V('Salmo 51.10','"Cria em mim, ó Deus, um coração puro, e renova em mim um espírito reto."')}
      <p class="body-text" style="margin-top:.6rem">E há um detalhe fundamental: o arrependimento em si não é algo que produzimos sozinhos. É o Espírito de Deus que desperta em nós essa consciência e esse desejo de mudar. Você não precisa "gerar" arrependimento — precisa se abrir para o que Deus já está trabalhando em você.</p>
      ${V('Atos 5.31','"Deus O elevou a Príncipe e Salvador, para dar a Israel o arrependimento e remissão dos pecados."')}
    `},
    { type:'apply', html:`
      <div class="apply-box"><div class="apply-lbl">Ação prática</div>
      <div class="apply-text">Pense em uma área da sua vida onde você sente que precisa mudar de direção. Não como autopunição — mas como alguém que quer se aproximar mais de Deus. Traga isso para Ele em oração hoje.</div></div>
    `},
    { type:'close', html:`
      <p class="body-text">Você não precisa se sentir suficientemente arrependido antes de se aproximar de Jesus. Venha como está. A obra de transformação é dEle — sua parte é vir.</p>
      ${V('Mateus 11.28','"Vinde a Mim, todos os que estais cansados e oprimidos, e Eu vos aliviarei."')}
    `},
    { type:'question', html:`
      <div class="content-card" style="background:var(--navy);border-color:rgba(255,255,255,0.1)">
        <div class="phase-tag" style="color:var(--gold-mid);letter-spacing:1.2px">✦ Reflexão — Estudo 3</div>
        <p class="body-text" style="color:rgba(255,255,255,0.9);margin-bottom:.75rem">Arrependimento não é punição — é uma reviravolta. Não é olhar para baixo com vergonha, mas olhar para cima com esperança. Deus não espera a perfeição para nos receber — Ele nos recebe para nos transformar.</p>
        <p class="body-text" style="color:#fff;font-style:italic">Há algo em você que quer mudar de direção — não por medo, mas por amor a Deus?</p>
      </div>
    `,
      choices:['Sim, e quero dar esse passo','Ainda estou processando essa ideia','Prefiro continuar do jeito que estou por enquanto'],
      feedback:['Esse passo é o início da maior liberdade que você vai conhecer.','Processar é honesto. Continue no caminho — a clareza vem com a caminhada.','Tudo bem. A porta continua aberta. Quando você estiver pronto, ela estará lá.']
    }
  ]
},

// ─────────────────────────────────────
// FASE 2 — APRENDIZ (estudos 4–6)
// ─────────────────────────────────────
{
  title:'Abra o Coração a Deus', xp:90, fase:'aprendiz',
  phases:[
    { type:'opening', html:()=>`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🗣️ Confessar: o ato mais corajoso e mais libertador</p>
      <p class="body-text" style="margin-top:.5rem">Existe algo extraordinariamente libertador em dizer a verdade — especialmente para Deus. A confissão não é uma cerimônia religiosa. É simplesmente abrir o coração e ser honesto.</p>
      ${V('Provérbios 28.13','"O que encobre as suas transgressões nunca prosperará; mas o que as confessa e deixa alcançará misericórdia."')}
      <p class="body-text" style="margin-top:.6rem">${N()}, Deus não precisa da sua confissão para saber o que aconteceu. Ele já sabe. A confissão é para <em>você</em> — para que você deixe de carregar o peso sozinho.</p>
    `},
    { type:'question', html:`<p class="body-text">Você já experimentou o alívio de contar para alguém algo que estava te pesando? Como foi?</p>`,
      choices:['Sim — foi libertador','Sim, mas foi difícil e expôs demais','Não costumo fazer isso — guardo tudo para mim'],
      feedback:['Esse alívio que você sentiu é um reflexo pequeno do que acontece quando abrimos o coração para Deus.','A vulnerabilidade tem um custo, e você conhece ele. Com Deus, o risco é zero — Ele já sabe e já ama mesmo assim.','Carregar tudo sozinho é exaustivo. Este estudo pode ser o convite para experimentar algo diferente.']
    },
    { type:'content', html:`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">📖 Como a confissão funciona</p>
      <p class="body-text" style="margin-top:.5rem">A confissão bíblica tem três características: ela é <strong>específica</strong>, ela é <strong>sincera</strong>, e ela leva à <strong>mudança real</strong>. Não é uma lista decorada de pecados genéricos. É nomear o que aconteceu, com honestidade, diante de Deus.</p>
      <p class="body-text" style="margin-top:.6rem">Quando Israel confessou ao profeta Samuel seu erro específico — "a todos os nossos pecados temos acrescentado este mal" — aquela confissão foi o ponto de virada da nação. Nomear o erro é o primeiro passo para sair dele.</p>
      <p class="body-text" style="margin-top:.6rem">A confissão também tem destinatários certos. Alguns pecados são só com Deus. Outros envolvem pessoas — e nesses casos, pedir desculpas à pessoa faz parte da restauração. A reconciliação é sempre o objetivo.</p>
      ${V('1 João 1.9','"Se confessarmos os nossos pecados, Ele é fiel e justo para nos perdoar os pecados e nos purificar de toda injustiça."')}
      <p class="body-text" style="margin-top:.6rem">Note a promessa: Deus é <em>fiel e justo</em> para perdoar. Não é um favor especial que você precisa conquistar. É uma promessa baseada no caráter dEle — e promessas de Deus não falham.</p>
    `},
    { type:'apply', html:`
      <div class="apply-box"><div class="apply-lbl">Ação prática</div>
      <div class="apply-text">Reserve 5 minutos para uma oração honesta. Não precisa ser elaborada. Pode ser simples: <em>"Deus, eu errei em... e preciso do Seu perdão."</em> Se houver alguém a quem você precisa pedir desculpas, dê esse passo também.</div></div>
    `},
    { type:'close', html:`
      <p class="body-text">O coração contrito não é o coração derrotado. É o coração que finalmente baixou a guarda e se abriu para ser cuidado. E Deus está perto de quem chega assim.</p>
      ${V('Salmo 34.18','"Perto está o Senhor dos que têm o coração quebrantado, e salva os contritos de espírito."')}
    `},
    { type:'question', html:`
      <div class="content-card" style="background:var(--navy);border-color:rgba(255,255,255,0.1)">
        <div class="phase-tag" style="color:var(--gold-mid);letter-spacing:1.2px">✦ Reflexão — Estudo 4</div>
        <p class="body-text" style="color:rgba(255,255,255,0.9);margin-bottom:.75rem">Confessar não é se envergonhar para sempre — é se liberar de vez. O perdão de Deus é completo, não parcial. Quando Ele perdoa, o registro é apagado.</p>
        <p class="body-text" style="color:#fff;font-style:italic">Você está pronto para abrir o coração — confessar, deixar e receber o perdão?</p>
      </div>
    `,
      choices:['Sim, quero viver com o coração limpo','Preciso de mais coragem para isso','Ainda estou pensando sobre o que precisa ser confessado'],
      feedback:['Essa decisão traz uma leveza que vai surpreender você.','A coragem vem quando damos o primeiro passo. Comece pequeno — Deus honra a honestidade.','Boa reflexão. Peça ao Espírito de Deus que te mostre. Ele responde com gentileza.']
    }
  ]
},

{
  title:'Consagração', xp:100, fase:'aprendiz',
  phases:[
    { type:'opening', html:()=>`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🎯 Consagração: a entrega que não é perda — é ganho</p>
      <p class="body-text" style="margin-top:.5rem">A palavra "consagração" pode parecer religiosa e distante. Mas ela descreve algo muito concreto: <strong>colocar a sua vida inteira nas mãos de Deus</strong>.</p>
      <p class="body-text" style="margin-top:.6rem">Muita gente tem medo de fazer isso. Parece que entregar a Deus significa perder o controle, abrir mão dos sonhos, viver uma vida sem graça. Mas quem já fez essa entrega sabe: é exatamente o contrário.</p>
      ${V('Romanos 12.1','"Rogo-vos, pois, irmãos, pela compaixão de Deus, que apresenteis os vossos corpos como sacrifício vivo, santo e agradável a Deus, que é o vosso culto racional."')}
    `},
    { type:'question', html:`<p class="body-text">O que você sente quando pensa em entregar o controle da sua vida a Deus?</p>`,
      choices:['Paz — já aprendi a confiar nEle','Um certo medo do que pode acontecer','Resistência — prefiro controlar minhas próprias escolhas'],
      feedback:['Essa paz é o fruto de uma fé que já foi testada. Continue cultivando essa entrega.','Esse medo é honesto. Mas pergunte-se: em quem você está confiando para guiar sua vida agora? Vale comparar.','Essa resistência fala de algo real em você. Este estudo vai ajudar a entender o que a consagração verdadeiramente significa.']
    },
    { type:'content', html:`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🤲 O que é consagrar, de verdade</p>
      <p class="body-text" style="margin-top:.5rem">Consagração não é uma decisão emocional de momento. É uma postura diária de dizer: <em>"Deus, não a minha vontade, mas a Tua."</em> É o que Jesus demonstrou no Getsêmani — não um ser humano sem desejos, mas alguém que escolheu colocar a vontade do Pai acima da própria.</p>
      <p class="body-text" style="margin-top:.6rem">E ela começa com uma pergunta honesta: <em>O que em minha vida ainda não está nas mãos de Deus?</em> Podem ser relacionamentos, planos de carreira, hábitos, medos. A consagração não exige que você esteja perfeito antes de entregar — ela <em>produz</em> a transformação depois que você entrega.</p>
      <p class="body-text" style="margin-top:.6rem">Uma imagem poderosa: imagine uma criança com as mãos cheias de cacos de vidro. Ela não consegue segurar mais nada — e está se machucando. Deus não quer tirar algo bom de você. Ele quer que você solte o que está te ferindo para poder encher as suas mãos com coisas melhores.</p>
      ${V('Jeremias 29.11','"Porque Eu sei os planos que tenho para vós, diz o Senhor, planos de paz e não de mal, para vos dar um futuro e uma esperança."')}
    `},
    { type:'apply', html:`
      <div class="apply-box"><div class="apply-lbl">Ação prática</div>
      <div class="apply-text">Faça uma lista mental (ou escrita) de duas ou três áreas da sua vida que você ainda não entregou a Deus. Uma de cada vez, diga em oração: <em>"Deus, essa área é Sua. Eu confio em Você com ela."</em> Repita essa entrega sempre que a ansiedade voltar.</div></div>
    `},
    { type:'close', html:`
      <p class="body-text">Consagrar não é um evento único — é uma caminhada diária. Toda manhã você pode renovar essa entrega. E a cada renovação, você descobre um pouco mais da paz que ultrapassa o entendimento.</p>
      ${V('Filipenses 4.7','"E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus."')}
    `},
    { type:'question', html:`
      <div class="content-card" style="background:var(--navy);border-color:rgba(255,255,255,0.1)">
        <div class="phase-tag" style="color:var(--gold-mid);letter-spacing:1.2px">✦ Reflexão — Estudo 5</div>
        <p class="body-text" style="color:rgba(255,255,255,0.9);margin-bottom:.75rem">Entregar a vida a Deus não é fraqueza — é a decisão mais inteligente e corajosa que um ser humano pode tomar. Quem entrega a Deus não perde direção — encontra uma direção muito maior.</p>
        <p class="body-text" style="color:#fff;font-style:italic">Você está pronto para fazer essa entrega — colocar sua vida nas mãos de Deus, mesmo sem saber todos os detalhes do que vem a seguir?</p>
      </div>
    `,
      choices:['Sim, quero me consagrar a Deus hoje','Quero fazer isso, mas ainda tenho medos','Preciso pensar mais antes de dar esse passo'],
      feedback:['Essa entrega é o começo de uma vida que você ainda não imagina o quanto pode ser rica.','Leve os medos para Deus também. Eles fazem parte da entrega.','Tudo bem pensar com cuidado. Mas lembre: fé raramente tem todas as respostas antes do primeiro passo.']
    }
  ]
},

{
  title:'Paz Mental', xp:100, fase:'aprendiz',
  phases:[
    { type:'opening', html:()=>`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🕊️ Fé: não é fingir que tudo está bem — é confiar em quem pode fazer tudo ficar bem</p>
      <p class="body-text" style="margin-top:.5rem">Depois do amor, do arrependimento, da confissão e da consagração, chegamos a um momento decisivo: <strong>aceitar, pela fé, a salvação que Deus oferece</strong>.</p>
      <p class="body-text" style="margin-top:.6rem">Fé não é um salto no escuro. É confiar em evidências que já foram dadas — o caráter de Deus revelado em Jesus, as promessas da Palavra, o testemunho de milhares de vidas transformadas. Fé é apoiar o peso sobre quem provou ser digno de confiança.</p>
      ${V('Hebreus 11.1','"Ora, a fé é a certeza daquilo que esperamos e a prova das coisas que não vemos."')}
    `},
    { type:'question', html:`<p class="body-text">Para você, fé é mais próxima de qual dessas imagens?</p>`,
      choices:['Uma âncora — algo que me estabiliza nas tempestades','Um salto às cegas — arriscado e incerto','Uma planta que precisa ser regada todo dia'],
      feedback:['Essa imagem é bíblica! A fé como âncora da alma (Hb 6.19) é exatamente isso.','Muita gente pensa assim. Mas a fé bíblica tem fundamento — ela se baseia em quem Deus provou ser.','Essa é a imagem mais precisa. A fé não é estática — ela cresce com a prática e a nutrição da Palavra.']
    },
    { type:'content', html:`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">✅ Aceitar o perdão que já foi dado</p>
      <p class="body-text" style="margin-top:.5rem">Um dos maiores obstáculos espirituais é a dificuldade de <em>aceitar</em> o perdão. Muitas pessoas sabem intelectualmente que Deus perdoa, mas continuam carregando a culpa — como se a graça fosse para os outros, não para elas.</p>
      <p class="body-text" style="margin-top:.6rem">A fé que dá paz mental é a que diz: <em>"Eu acredito que o que Jesus fez é suficiente. Inclusive para mim."</em> Não é arrogância — é tomar Deus ao pé da letra.</p>
      <p class="body-text" style="margin-top:.6rem">Imagine que alguém pagou uma dívida enorme sua. O banco confirmou. O recibo está em mãos. Mas você continua sofrendo como se ainda devesse. Isso não honra o sacrifício de quem pagou — e não te faz bem.</p>
      ${V('João 1.12','"Mas a todos quantos O receberam, deu-lhes o poder de serem feitos filhos de Deus, aos que creem no Seu nome."')}
      <p class="body-text" style="margin-top:.6rem">A paz mental nasce quando a fé e a aceitação se encontram. Quando você para de tentar merecer e começa a <em>receber</em>.</p>
    `},
    { type:'apply', html:`
      <div class="apply-box"><div class="apply-lbl">Ação prática</div>
      <div class="apply-text">Leia devagar: <em>"Se confessarmos os nossos pecados, Ele é fiel e justo para nos perdoar"</em> (1 Jo 1.9). Depois diga em voz alta: <em>"Eu aceito esse perdão. Obrigado, Jesus."</em> Repita até sentir que as palavras entram no coração.</div></div>
    `},
    { type:'close', html:`
      <p class="body-text">A paz que Deus dá não é a ausência de problemas. É a presença Dele no meio dos problemas. Ela vem quando você decide confiar — não quando tudo está resolvido, mas exatamente quando não está.</p>
      ${V('João 14.27','"Deixo-vos a paz, a Minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize."')}
    `},
    { type:'question', html:`
      <div class="content-card" style="background:var(--navy);border-color:rgba(255,255,255,0.1)">
        <div class="phase-tag" style="color:var(--gold-mid);letter-spacing:1.2px">✦ Reflexão — Estudo 6</div>
        <p class="body-text" style="color:rgba(255,255,255,0.9);margin-bottom:.75rem">A paz mental que Deus oferece vai além do que o mundo pode proporcionar. Ela não depende das circunstâncias — depende de quem está no controle delas.</p>
        <p class="body-text" style="color:#fff;font-style:italic">Você está pronto para aceitar, pela fé, a paz e o perdão que Deus já preparou para você?</p>
      </div>
    `,
      choices:['Sim, aceito essa paz hoje','Quero isso, mas às vezes a culpa volta','Ainda estou aprendendo a confiar nessa promessa'],
      feedback:['Essa aceitação é a porta da transformação. Bem-vindo a uma vida nova.','A culpa que volta é uma tentação, não uma condenação. Continue dizendo "eu aceito" até a certeza se firmar.','Aprender a confiar leva tempo. Continue. A fé cresce com a prática.']
    }
  ]
},

// ─────────────────────────────────────
// FASE 3 — DISCÍPULO (estudos 7–10)
// ─────────────────────────────────────
{
  title:'Uma Nova Pessoa', xp:110, fase:'discipulo',
  phases:[
    { type:'opening', html:()=>`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🌱 Transformação: como ela funciona, de verdade</p>
      <p class="body-text" style="margin-top:.5rem">Uma das perguntas mais comuns após alguém aceitar a Cristo é: <em>"Mas eu ainda sinto as mesmas tentações. Mudei mesmo?"</em></p>
      <p class="body-text" style="margin-top:.6rem">A resposta bíblica surpreende muita gente: ser uma nova pessoa não significa não sentir mais tentações. Significa ter um novo coração, um novo desejo — e um novo poder para responder às tentações de forma diferente.</p>
      ${V('2 Coríntios 5.17','"Se alguém está em Cristo, é nova criação. As coisas antigas passaram; eis que tudo se tornou novo."')}
    `},
    { type:'question', html:`<p class="body-text">Como você percebe transformação real na vida de uma pessoa — o que muda quando alguém se entrega a Deus?</p>`,
      choices:['O jeito de tratar as pessoas e de reagir às dificuldades','A frequência em atividades religiosas e eventos de fé','Uma paz interior visível mesmo nas circunstâncias difíceis'],
      feedback:['Exatamente. A transformação real aparece no caráter — nos relacionamentos e na forma de lidar com o que a vida traz.','A prática religiosa pode acompanhar a transformação, mas não é a transformação em si.','Isso também! A paz interior é uma das marcas mais eloquentes da presença de Deus em uma vida.']
    },
    { type:'content', html:`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">✨ O teste do discipulado</p>
      <p class="body-text" style="margin-top:.5rem">Jesus foi direto: a evidência de que você pertence a Ele não é o que você professa — é o que você vive. Amigos de Jesus são conhecidos pelo amor que têm uns pelos outros. Essa é a marca.</p>
      ${V('João 13.35','"Nisto conhecerão todos que sois Meus discípulos, se vos amardes uns aos outros."')}
      <p class="body-text" style="margin-top:.6rem">Mas essa transformação não acontece por força de vontade. Ninguém se torna uma nova pessoa decidindo muito forte. A mudança vem de uma conexão viva com Jesus — como um galho que permanece na videira e, por isso, produz fruto.</p>
      ${V('João 15.5','"Eu sou a videira; vós, os ramos. Quem permanece em Mim, e Eu nele, esse dá muito fruto; porque sem Mim nada podeis fazer."')}
      <p class="body-text" style="margin-top:.6rem">Permanecer em Jesus — pelo estudo da Palavra, pela oração, pela comunhão com outros discípulos — é a condição do fruto. Não um esforço que você faz para Deus, mas uma conexão que você mantém <em>com</em> Deus.</p>
    `},
    { type:'apply', html:`
      <div class="apply-box"><div class="apply-lbl">Ação prática</div>
      <div class="apply-text">Esta semana, observe uma área da sua vida onde você percebe que está mudando — mesmo que devagar. Agradeça a Deus por essa mudança. Se não perceber nada ainda, pergunte a alguém próximo que te conhece bem.</div></div>
    `},
    { type:'close', html:`
      <p class="body-text">A transformação não precisa ser espetacular para ser real. Uma paciência um pouco maior. Uma palavra gentil que antes não saía. Um momento de bondade inesperado. O Espírito de Deus trabalha assim — em profundidade, com constância.</p>
      ${V('Filipenses 1.6','"Tendo plena confiança de que Aquele que em vós começou a boa obra a completará até ao Dia de Cristo Jesus."')}
    `},
    { type:'question', html:`
      <div class="content-card" style="background:var(--navy);border-color:rgba(255,255,255,0.1)">
        <div class="phase-tag" style="color:var(--gold-mid);letter-spacing:1.2px">✦ Reflexão — Estudo 7</div>
        <p class="body-text" style="color:rgba(255,255,255,0.9);margin-bottom:.75rem">Ser uma nova pessoa não é fingir que o passado não existiu. É receber uma nova identidade — filho de Deus — e deixar que essa identidade vá moldando quem você é no dia a dia.</p>
        <p class="body-text" style="color:#fff;font-style:italic">Você acredita que Deus pode te tornar uma pessoa diferente — não por esforço próprio, mas por conexão com Ele?</p>
      </div>
    `,
      choices:['Sim, acredito e quero essa transformação','Quero acreditar, mas ainda tenho dúvidas','Essa transformação parece muito grande para mim'],
      feedback:['Essa crença é o solo onde a transformação cresce. Mantenha a conexão com Ele.','A dúvida honesta não bloqueia Deus. Continue no caminho — a fé cresce com as evidências que você vai acumulando.','Para Deus, nada é grande demais. A mesma força que criou o universo age na transformação de um coração.']
    }
  ]
},

{
  title:'Crescimento em Cristo', xp:110, fase:'discipulo',
  phases:[
    { type:'opening', html:()=>`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">📈 Crescer na fé não é opcional — é natural</p>
      <p class="body-text" style="margin-top:.5rem">Uma semente plantada precisa crescer. Não por esforço próprio — mas porque a vida dentro dela tende ao crescimento. Com a fé é igual.</p>
      <p class="body-text" style="margin-top:.6rem">O cristão que não cresce é como uma planta sem água e sem sol — pode estar vivo, mas não está prosperando como deveria. Crescimento em Cristo é a expressão natural de uma fé viva e conectada.</p>
      ${V('2 Pedro 3.18','"Crescei na graça e no conhecimento de nosso Senhor e Salvador Jesus Cristo."')}
    `},
    { type:'question', html:`<p class="body-text">Em que área da sua vida espiritual você sente que mais precisa crescer?</p>`,
      choices:['Na consistência da oração e da Palavra','No amor prático pelas pessoas ao meu redor','Na confiança de Deus diante das incertezas da vida'],
      feedback:['Oração e Palavra são a raiz. Crescer aí sustenta tudo o mais.','Amor prático é fé em ação. Esse crescimento transforma não só você, mas todos ao seu redor.','Confiança é o fruto da intimidade com Deus. Ela cresce à medida que você O conhece mais.']
    },
    { type:'content', html:`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🌳 Como o crescimento acontece</p>
      <p class="body-text" style="margin-top:.5rem">Crescimento espiritual tem os mesmos ingredientes do crescimento natural: nutrição, luz e tempo. A nutrição vem da Palavra de Deus — que alimenta a fé. A luz vem da comunhão com o Espírito Santo e com outros cristãos. E o tempo? É o da graça de Deus — Ele não desiste da obra que começou.</p>
      <p class="body-text" style="margin-top:.6rem">Uma prática crucial: <strong>olhar para Jesus constantemente</strong>. Não para os seus próprios fracassos, não para os erros dos outros, não para as circunstâncias. O crescimento vem de fixar o olhar nEle.</p>
      ${V('Hebreus 12.2','"Olhando para Jesus, autor e consumador da fé, O qual, pelo gozo que lhe estava proposto, suportou a cruz, desprezando a vergonha."')}
      <p class="body-text" style="margin-top:.6rem">Outro ingrediente do crescimento: a <strong>comunidade</strong>. Ninguém cresce na fé em isolamento. O grupo em que você está agora não é apenas um contexto social — é um ambiente espiritual projetado para o seu crescimento.</p>
    `},
    { type:'apply', html:`
      <div class="apply-box"><div class="apply-lbl">Ação prática</div>
      <div class="apply-text">Escolha um versículo desta semana para memorizar. Pode ser curto — uma frase que fale com você. Repita ao longo do dia. A Palavra guardada no coração é alimento para o crescimento.</div></div>
    `},
    { type:'close', html:`
      <p class="body-text">O crescimento em Cristo não é uma corrida competitiva. Não se compare com outros discípulos. A única comparação relevante é entre quem você era ontem e quem está se tornando hoje — e Deus está satisfeito com cada passo dado na direção dEle.</p>
      ${V('Colossenses 2.6-7','"Assim como recebestes a Cristo Jesus, o Senhor, assim andai nEle; arraigados e edificados nEle."')}
    `},
    { type:'question', html:`
      <div class="content-card" style="background:var(--navy);border-color:rgba(255,255,255,0.1)">
        <div class="phase-tag" style="color:var(--gold-mid);letter-spacing:1.2px">✦ Reflexão — Estudo 8</div>
        <p class="body-text" style="color:rgba(255,255,255,0.9);margin-bottom:.75rem">Crescer em Cristo é o resultado natural de permanecer conectado a Ele. Não é sobre perfeição — é sobre direção. Cada dia orientado para Ele é um dia de crescimento.</p>
        <p class="body-text" style="color:#fff;font-style:italic">Que passo concreto você pode dar esta semana para aprofundar sua conexão com Jesus?</p>
      </div>
    `,
      choices:['Criar uma rotina de oração e leitura da Bíblia','Investir mais nos relacionamentos com outros cristãos','Buscar servir alguém ao meu redor de forma prática'],
      feedback:['Consistência na Palavra e oração é a base de tudo. Comece pequeno e vá crescendo.','A comunidade cristã é um presente de Deus para o crescimento. Invista nela.','Serviço prático é uma das formas mais rápidas de crescer — você recebe tanto quanto dá.']
    }
  ]
},

{
  title:'Atividade e Vida', xp:120, fase:'discipulo',
  phases:[
    { type:'opening', html:()=>`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🌊 Fé que não age é fé que ainda não chegou a si mesma</p>
      <p class="body-text" style="margin-top:.5rem">Existe um paradoxo interessante: a fé que recebemos é um presente gratuito, que não precisamos merecer. Mas essa mesma fé, quando genuína, inevitavelmente nos leva à ação — ao serviço, ao cuidado com o próximo, à vida ativa em amor.</p>
      ${V('Tiago 2.17','"Assim também a fé, se não tiver obras, é morta em si mesma."')}
      <p class="body-text" style="margin-top:.6rem">Isso não significa que as obras nos salvam — mas que as obras revelam se a fé é viva. Uma fé que não muda nada na vida prática talvez não seja fé ainda — pode ser apenas adesão intelectual a uma doutrina.</p>
    `},
    { type:'question', html:`<p class="body-text">A sua fé tem te levado a agir de alguma forma diferente no relacionamento com as pessoas ao seu redor?</p>`,
      choices:['Sim, percebo mudanças no jeito de tratar as pessoas','Às vezes, mas poderia ser mais consistente','Ainda não — minha fé está mais no plano interno por enquanto'],
      feedback:['Esse é o fruto visível de uma fé que está viva. Continue.','Consistência é construída um passo de cada vez. O desejo de ser mais consistente já é um sinal bom.','A fé interna é a raiz — agora é hora de deixar que ela produza o fruto externo. Esse estudo vai ajudar.']
    },
    { type:'content', html:`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🎯 Por que a ação é parte da fé</p>
      <p class="body-text" style="margin-top:.5rem">Quando alguém passa por uma experiência real com Deus, a primeira coisa que quer é contar para alguém. O leproso curado por Jesus não conseguiu ficar quieto. A mulher samaritana voltou correndo para a cidade. Isso é natural — alegria que não transborda não é alegria plena.</p>
      <p class="body-text" style="margin-top:.6rem">Além disso, a ação tem um poder formativo. Você não age porque já é perfeito — você age e vai sendo formado no processo. Cada ato de generosidade, cada visita ao doente, cada palavra de encorajamento transforma também quem a pratica.</p>
      <p class="body-text" style="margin-top:.6rem">E há algo mais profundo: ao servir os outros, você encontra Jesus. Ele disse que tudo que fizer ao menor de Seus irmãos, faz a Ele. O serviço não é apenas uma obrigação moral — é um encontro espiritual.</p>
      ${V('Mateus 25.40','"Em verdade vos digo que, quando o fizestes a um destes Meus pequeninos irmãos, a Mim o fizestes."')}
    `},
    { type:'apply', html:`
      <div class="apply-box"><div class="apply-lbl">Ação prática</div>
      <div class="apply-text">Esta semana, faça algo concreto por alguém — não por obrigação, mas por amor. Pode ser uma visita, uma mensagem, um gesto prático de cuidado. Faça com atenção, como se estivesse fazendo para Jesus.</div></div>
    `},
    { type:'close', html:`
      <p class="body-text">A vida cristã não é um espetáculo de domingo — é uma prática de segunda a segunda. Cada dia é uma oportunidade de fazer visível o amor invisível de Deus. E essa prática não é um fardo — é a vida mais plena que existe.</p>
      ${V('Gálatas 5.13','"Servi-vos uns aos outros pelo amor."')}
    `},
    { type:'question', html:`
      <div class="content-card" style="background:var(--navy);border-color:rgba(255,255,255,0.1)">
        <div class="phase-tag" style="color:var(--gold-mid);letter-spacing:1.2px">✦ Reflexão — Estudo 9</div>
        <p class="body-text" style="color:rgba(255,255,255,0.9);margin-bottom:.75rem">Atividade e vida espiritual não são opostos — são a mesma coisa vista de ângulos diferentes. A fé viva se expressa em ação; e a ação amorosa alimenta e fortalece a fé.</p>
        <p class="body-text" style="color:#fff;font-style:italic">Como você pode ser, de forma mais intencional, as mãos e os pés de Jesus para alguém ao seu redor esta semana?</p>
      </div>
    `,
      choices:['Já tenho alguém em mente que precisa de cuidado','Vou procurar oportunidades com mais atenção','Preciso primeiro me fortalecer mais espiritualmente para servir'],
      feedback:['Ótimo! Não espere o momento perfeito — vá.','Às vezes as oportunidades já estão ali; só precisamos de olhos atentos ao nosso redor.','Você cresce servindo, não apenas se preparando para servir. Comece onde está, com o que tem.']
    }
  ]
},

{
  title:'O Deus que Eu Conheço', xp:120, fase:'discipulo',
  phases:[
    { type:'opening', html:()=>`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🔭 Conhecer Deus: mais do que saber sobre Ele</p>
      <p class="body-text" style="margin-top:.5rem">Existe uma diferença enorme entre <em>saber sobre</em> Deus e <em>conhecer</em> Deus. Você pode saber tudo sobre uma pessoa — nome, história, personalidade — sem ter intimidade real com ela. Com Deus é igual.</p>
      <p class="body-text" style="margin-top:.6rem">A Bíblia fala de conhecer Deus como uma experiência pessoal, viva, crescente. Não é um acúmulo de informações teológicas — é um relacionamento que se aprofunda com o tempo.</p>
      ${V('João 17.3','"E a vida eterna é esta: que Te conheçam a Ti, o único Deus verdadeiro, e a Jesus Cristo, a quem enviaste."')}
    `},
    { type:'question', html:`<p class="body-text">Como você diria que está a sua intimidade com Deus agora — de 1 a 5?</p>`,
      choices:['4 ou 5 — sinto que tenho um relacionamento próximo','2 ou 3 — conheço, mas sinto distância','1 — ainda estou descobrindo quem Ele é'],
      feedback:['Que presente! Continue investindo nessa intimidade — ela pode crescer sempre.','Essa distância é real, mas não é definitiva. Cada passo de aproximação conta.','E que lugar maravilhoso para estar — no começo da descoberta. Continue.']
    },
    { type:'content', html:`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">📚 A Bíblia como caminho do conhecimento</p>
      <p class="body-text" style="margin-top:.5rem">O principal meio para conhecer Deus é a Palavra. Não como um livro de regras — mas como a revelação do caráter dEle. Quando você lê a Bíblia e encontra Jesus curando, perdoando, chamando pessoas pelo nome — você está vendo quem Deus é.</p>
      <p class="body-text" style="margin-top:.6rem">A natureza também fala. O amanhecer, o oceano, a complexidade de uma folha — tudo revela algo sobre o Criador. Mas a Palavra vai mais fundo: ela revela o <em>coração</em> de Deus, Seus pensamentos, Seus planos para você.</p>
      <p class="body-text" style="margin-top:.6rem">E o Espírito Santo é quem torna esse conhecimento real. Não apenas intelectual — mas vivo. Ele transforma o que você lê em encontro pessoal.</p>
      ${V('1 Coríntios 2.10','"Deus no-las revelou pelo Espírito, porque o Espírito penetra todas as coisas, ainda as profundezas de Deus."')}
    `},
    { type:'apply', html:`
      <div class="apply-box"><div class="apply-lbl">Ação prática</div>
      <div class="apply-text">Hoje, ao ler qualquer trecho da Bíblia, faça uma pergunta antes de começar: <em>"Deus, o que isso me diz sobre quem Você é?"</em> Não busque apenas informação — busque o encontro com a pessoa por trás das palavras.</div></div>
    `},
    { type:'close', html:`
      <p class="body-text">Conhecer Deus é a maior aventura humana possível. E essa aventura não acaba — ela se aprofunda eternamente. Cada dia é uma oportunidade de descobrir mais sobre quem Ele é e quem você é para Ele.</p>
      ${V('Jeremias 9.23-24','"Mas o que se gloria, glorie-se nisto: em me entender e conhecer."')}
    `},
    { type:'question', html:`
      <div class="content-card" style="background:var(--navy);border-color:rgba(255,255,255,0.1)">
        <div class="phase-tag" style="color:var(--gold-mid);letter-spacing:1.2px">✦ Reflexão — Estudo 10</div>
        <p class="body-text" style="color:rgba(255,255,255,0.9);margin-bottom:.75rem">Deus não quer ser apenas conhecido sobre — Ele quer ser conhecido. A intimidade com Ele não é privilégio de poucos. É o convite aberto a todos que se aproximam.</p>
        <p class="body-text" style="color:#fff;font-style:italic">O que você está disposto a fazer de diferente para aprofundar seu conhecimento pessoal de Deus?</p>
      </div>
    `,
      choices:['Comprometer-me a ler a Bíblia com mais regularidade','Reservar tempo de silêncio para ouvir a voz de Deus','Conversar mais com pessoas que têm intimidade com Deus'],
      feedback:['A regularidade na Palavra é o investimento com melhor retorno espiritual possível.','O silêncio é onde Deus muitas vezes fala mais alto. Aprenda a habitá-lo.','Relacionamentos com pessoas de fé madura são um presente — eles nos mostram como é a intimidade com Deus na prática.']
    }
  ]
},

// ─────────────────────────────────────
// FASE 4 — COMPROMETIDO (estudos 11–13)
// ─────────────────────────────────────
{
  title:'O Privilégio de Falar com Deus', xp:130, fase:'comprometido',
  phases:[
    { type:'opening', html:()=>`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🙏 Oração: não é protocolo religioso — é conversa real</p>
      <p class="body-text" style="margin-top:.5rem">Imagine ter acesso direto ao Criador do universo — a qualquer hora, em qualquer lugar, sem burocracia. Isso é exatamente o que a oração é. E é um privilégio que muita gente tem, mas poucos realmente usam.</p>
      <p class="body-text" style="margin-top:.6rem">A oração não é uma técnica mágica nem uma performance religiosa. É simplesmente conversar com Deus — com honestidade, com confiança, com o coração aberto.</p>
      ${V('Filipenses 4.6','"Em nada estejais ansiosos; em tudo, porém, pela oração e pela súplica, com ações de graças, os vossos pedidos sejam conhecidos diante de Deus."')}
    `},
    { type:'question', html:`<p class="body-text">Como é a sua vida de oração hoje?</p>`,
      choices:['Constante — oro com frequência e sinto a presença de Deus','Irregular — oro mais quando estou em dificuldade','Ainda estou aprendendo a orar — não sei bem como funciona'],
      feedback:['Isso é um presente precioso. A oração constante é o coração da vida espiritual.','É honesto. A oração na dificuldade já é oração — mas você pode experimentar a alegria de orar na tranquilidade também.','A melhor forma de aprender a orar é... começar a orar. Não existe oração errada quando o coração é sincero.']
    },
    { type:'content', html:`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">📡 Como a oração funciona</p>
      <p class="body-text" style="margin-top:.5rem">A oração eficaz não depende de palavras elaboradas ou de posição correta. Jesus ensinou que o que Deus observa é o coração — e o publicano que simplesmente disse "tem misericórdia de mim, pecador" foi mais ouvido do que o fariseu cheio de eloquência.</p>
      <p class="body-text" style="margin-top:.6rem">Elementos de uma vida de oração saudável:</p>
      <p class="body-text" style="margin-top:.4rem">• <strong>Adoração</strong> — reconhecer quem Deus é antes de pedir qualquer coisa<br>• <strong>Confissão</strong> — manter o coração limpo perante Ele<br>• <strong>Ação de graças</strong> — cultivar um coração grato<br>• <strong>Intercessão</strong> — orar pelos outros, não apenas por si<br>• <strong>Súplica</strong> — trazer as necessidades reais com confiança</p>
      <p class="body-text" style="margin-top:.6rem">E depois? <strong>Ouvir.</strong> Oração que é só fala, sem espaço para a resposta de Deus, é monólogo. A parte mais transformadora muitas vezes vem no silêncio após as palavras.</p>
      ${V('1 Tessalonicenses 5.17','"Orai sem cessar."')}
    `},
    { type:'apply', html:`
      <div class="apply-box"><div class="apply-lbl">Ação prática</div>
      <div class="apply-text">Escolha um horário fixo hoje — pode ser curto, 5 minutos — e faça uma oração estruturada: comece adorando, depois confesse, agradeça por três coisas, ore por alguém, e por fim traga seus pedidos. Termine em silêncio por 1 minuto.</div></div>
    `},
    { type:'close', html:`
      <p class="body-text">Deus não fica impressionado com o volume das suas palavras. Ele Se move pelo peso do seu coração. Uma oração sincera de uma linha tem mais poder do que uma liturgia elaborada sem intenção. Fale com Ele como você falaria com alguém que te ama — porque Ele é exatamente isso.</p>
      ${V('Mateus 7.7-8','"Pedi, e dar-se-vos-á; buscai, e encontrareis; batei, e abrir-se-vos-á. Porque todo o que pede, recebe; e o que busca, encontra."')}
    `},
    { type:'question', html:`
      <div class="content-card" style="background:var(--navy);border-color:rgba(255,255,255,0.1)">
        <div class="phase-tag" style="color:var(--gold-mid);letter-spacing:1.2px">✦ Reflexão — Estudo 11</div>
        <p class="body-text" style="color:rgba(255,255,255,0.9);margin-bottom:.75rem">Falar com Deus é um privilégio que muita gente ignora ou subestima. Mas quem descobre a oração como um relacionamento real — não como obrigação — descobre uma das maiores riquezas da vida espiritual.</p>
        <p class="body-text" style="color:#fff;font-style:italic">O que você pode mudar na sua rotina para dar mais espaço real à oração?</p>
      </div>
    `,
      choices:['Criar um tempo fixo diário para orar','Transformar momentos do dia em mini-conversas com Deus','Aprender mais sobre oração junto com outras pessoas deste grupo'],
      feedback:['Consistência na oração é um dos maiores investimentos que você pode fazer.','Orar ao longo do dia — no trânsito, no trabalho, nos intervalos — é o que Paulo chama de "orar sem cessar".','Orar junto fortalece tanto quem ora quanto quem é orado. O grupo é um presente para isso.']
    }
  ]
},

{
  title:'Expulse a Dúvida', xp:140, fase:'comprometido',
  phases:[
    { type:'opening', html:()=>`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🔦 Dúvida não é o oposto da fé — abandono é</p>
      <p class="body-text" style="margin-top:.5rem">Existe um mito muito prejudicial no mundo cristão: o de que ter dúvidas significa falta de fé. Mas os maiores homens e mulheres de Deus na Bíblia duvidaram — Abraão, Moisés, João Batista, até Tomé, que estava com Jesus diariamente.</p>
      <p class="body-text" style="margin-top:.6rem">A dúvida honesta, trazida a Deus com sinceridade, pode ser o ponto de partida para uma fé mais profunda e mais real. O problema não é duvidar — é deixar que a dúvida se torne amargura ou abandono.</p>
      ${V('Judas 1.22','"A uns, os que andam em dúvida, tratai com misericórdia."')}
    `},
    { type:'question', html:`<p class="body-text">Você tem dúvidas sobre a fé? Como você costuma lidar com elas?</p>`,
      choices:['Tenho e levo a Deus e a pessoas de fé — procuro respostas','Tenho, mas guardo para mim com medo de parecer fraco','Não tenho muitas dúvidas — minha fé está bem estabelecida'],
      feedback:['Isso é maturidade espiritual. A dúvida que busca resposta fortalece — não enfraquece.','Dúvidas guardadas crescem na escuridão. Trazê-las para a luz é o que as resolve.','Isso é um dom. Use sua estabilidade para ajudar outros que ainda estão encontrando o caminho.']
    },
    { type:'content', html:`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🧭 Como lidar com as dúvidas</p>
      <p class="body-text" style="margin-top:.5rem">A Palavra de Deus não teme as perguntas difíceis. A Bíblia foi escrita em um mundo de conflito, sofrimento, questionamento e busca — e ela responde a esse mundo com profundidade e honestidade. Não fuja das perguntas; mergulhe nelas com a Palavra na mão.</p>
      <p class="body-text" style="margin-top:.6rem">Alguns princípios para navegar as dúvidas:</p>
      <p class="body-text" style="margin-top:.4rem">• <strong>Age a partir do que você já sabe</strong> — não paralise pelo que ainda não sabe<br>• <strong>Mantenha a conexão com Deus</strong> — mesmo quando não entende, continue orando<br>• <strong>Busque comunidade</strong> — outros já passaram pelo que você está passando<br>• <strong>Confie no caráter de Deus</strong> — o que você conhece dEle é mais que suficiente para confiar no que ainda não compreende</p>
      ${V('Isaías 41.10','"Não temas, porque Eu sou contigo; não te assombres, porque Eu sou teu Deus; Eu te fortaleço, e te ajudo, e te sustento com a destra da Minha justiça."')}
    `},
    { type:'apply', html:`
      <div class="apply-box"><div class="apply-lbl">Ação prática</div>
      <div class="apply-text">Escreva uma dúvida que você tem sobre Deus, a fé ou a Bíblia. Não precisa ter a resposta agora. Traga essa pergunta para o grupo — ou para o seu tutor. A dúvida compartilhada já deu o primeiro passo para ser respondida.</div></div>
    `},
    { type:'close', html:`
      <p class="body-text">Deus não é ameaçado pelas suas perguntas. Ele as convida. A fé que sobrevive às perguntas difíceis é a mais sólida. Continue buscando — quem busca, encontra.</p>
      ${V('Jeremias 29.13','"Buscar-Me-eis e Me achareis, quando Me buscardes de todo o vosso coração."')}
    `},
    { type:'question', html:`
      <div class="content-card" style="background:var(--navy);border-color:rgba(255,255,255,0.1)">
        <div class="phase-tag" style="color:var(--gold-mid);letter-spacing:1.2px">✦ Reflexão — Estudo 12</div>
        <p class="body-text" style="color:rgba(255,255,255,0.9);margin-bottom:.75rem">Expulsar a dúvida não significa nunca mais questionar. Significa não deixar a dúvida ter a última palavra. Significa continuar caminhando mesmo quando não vê o caminho todo.</p>
        <p class="body-text" style="color:#fff;font-style:italic">Há alguma dúvida que você está carregando sozinho(a) e que poderia trazer para Deus ou para alguém de confiança?</p>
      </div>
    `,
      choices:['Sim — vou dar esse passo e compartilhar essa dúvida','Tenho dúvidas, mas me sinto mais próximo de respostas','Minha fé está firme, mas quero aprender a ajudar quem duvida'],
      feedback:['Trazer para a luz é o primeiro passo. Você não está sozinho nessa.','Esse movimento em direção à resposta já é fé em ação.','Quem já passou pelas dúvidas é o melhor companheiro para quem ainda está no meio delas.']
    }
  ]
},

{
  title:'Alegria no Senhor', xp:150, fase:'comprometido',
  phases:[
    { type:'opening', html:()=>`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🌅 Alegria: o fruto maduro de uma fé que cresceu</p>
      <p class="body-text" style="margin-top:.5rem">${N()}, chegamos ao último estudo desta jornada com uma verdade que resume tudo: a fé cristã não é um fardo a ser carregado. É uma fonte de alegria que o mundo não consegue dar e não consegue tirar.</p>
      <p class="body-text" style="margin-top:.6rem">Não é a alegria superficial das circunstâncias favoráveis. É uma alegria mais profunda — que coexiste com a dor, persiste na dificuldade, e cresce quanto mais você conhece Deus.</p>
      ${V('Neemias 8.10','"A alegria do Senhor é a vossa força."')}
    `},
    { type:'question', html:`<p class="body-text">Como você descreveria o estado do seu coração hoje, ao chegar ao final desta jornada de estudos?</p>`,
      choices:['Mais leve e com mais esperança do que quando comecei','Reflexivo — muita coisa para processar ainda','Com mais perguntas do que respostas, mas avançando'],
      feedback:['Essa leveza e esperança é o início da alegria que o Senhor quer que você viva.','O processamento é parte do crescimento. Continue refletindo com Ele ao lado.','Mais perguntas que respostas pode significar que você está crescendo. A fé não é a ausência de perguntas — é a presença de Deus no meio delas.']
    },
    { type:'content', html:`
      <p class="body-text" style="font-weight:600;font-size:19px;color:var(--navy2)">🎉 O que produz alegria real</p>
      <p class="body-text" style="margin-top:.5rem">A alegria cristã não é negação da realidade. Jesus não disse que a vida seria fácil — disse que poderíamos ter paz e alegria em meio às tribulações. A diferença é que alguém está no controle e esse alguém nos ama profundamente.</p>
      <p class="body-text" style="margin-top:.6rem">A alegria cresce quando você:</p>
      <p class="body-text" style="margin-top:.4rem">• <strong>Olha para o que Deus já fez</strong> — a gratidão transforma a perspectiva<br>• <strong>Compartilha a fé com outros</strong> — alegria multiplicada é alegria maior<br>• <strong>Serve sem esperar retorno</strong> — existe uma alegria única no amor desinteressado<br>• <strong>Mantém os olhos em Jesus</strong> — e não nas circunstâncias ao redor</p>
      ${V('João 15.11','"Tenho vos dito estas coisas para que a Minha alegria esteja em vós e a vossa alegria seja completa."')}
      <p class="body-text" style="margin-top:.6rem">E a alegria tem um endereço: ela vive na comunidade. O grupo que você está é um lugar onde a alegria pode ser gerada, partilhada e multiplicada. Não é coincidência que você está aqui.</p>
    `},
    { type:'apply', html:`
      <div class="apply-box"><div class="apply-lbl">Ação prática</div>
      <div class="apply-text">Faça uma lista de 5 razões para ser grato a Deus agora — não coisas perfeitas, mas presentes reais na sua vida. Compartilhe pelo menos uma dessas razões com alguém do grupo. A alegria compartilhada se multiplica.</div></div>
    `},
    { type:'close', html:`
      <p class="body-text">Esta jornada foi um começo, não um fim. Você não terminou de crescer — está cada vez mais no centro do processo. O Deus que começou uma boa obra em você vai completá-la.</p>
      <p class="body-text" style="margin-top:.6rem">E a marca dessa obra, quando madura, é essa: <strong>alegria.</strong> Não a alegria de quem não sofre — mas a de quem sabe com quem está.</p>
      ${V('Filipenses 4.4','"Regozijai-vos no Senhor sempre; outra vez digo, regozijai-vos."')}
      <p class="body-text" style="margin-top:.6rem">Continue. O melhor ainda está por vir.</p>
    `},
    { type:'question', html:`
      <div class="content-card" style="background:var(--navy);border-color:rgba(255,255,255,0.1)">
        <div class="phase-tag" style="color:var(--gold-mid);letter-spacing:1.2px">✦ Reflexão Final — Estudo 13</div>
        <p class="body-text" style="color:rgba(255,255,255,0.9);margin-bottom:.75rem">Ao longo destes 13 estudos você percorreu um caminho — do amor de Deus até a alegria no Senhor. Cada capítulo foi um passo. Agora é hora de olhar para trás e ver o quanto você caminhou.</p>
        <p class="body-text" style="color:#fff;font-style:italic">O que mudou em você durante esta jornada? O que você leva daqui para frente?</p>
      </div>
    `,
      choices:['Minha fé ficou mais concreta e viva','Meu relacionamento com Deus ficou mais próximo e real','Encontrei um grupo onde posso crescer junto com outros'],
      feedback:['Fé concreta e viva é o maior fruto possível. Cuide dela.','Proximidade com Deus é o objetivo de toda a vida espiritual. Você chegou lá — e pode ir mais fundo ainda.','O grupo não é um apêndice da fé — é parte central dela. Você encontrou família espiritual.']
    }
  ]
}

]; // end STUDIES

const OBSTACLES = [
  // Sem ação própria de propósito — a ação vive só no card da missão semanal "Arquitetura da
  // Vida" (ver confirmArquiteturaVidaMissao). Este obstáculo só aparece aqui DEPOIS de vencido
  // (ver isObstacleUnlocked), direto na lista de vencidos, pra não duplicar o mesmo botão de
  // ação em dois lugares da tela ao mesmo tempo.
  { id:'cuidado_corpo', label:'Cuidado com a Saúde', icon:'💪', isArqVida:true },
  { id:'falta_oracao',  label:'Falta de Oração',  icon:'🙈', studies:[2],     color:'#1A5276',
    desc:'A oração ficou para depois. O problema não é falta de tempo — é falta de prioridade. E a distância de Deus cresce no silêncio.',
    versiculo:'Orem sem parar.',
    versiculoRef:'1 Tessalonicenses 5.17 — NVT',
    action:'Reserve 5 minutos agora para orar, mesmo que em silêncio. Fale com Deus como falaria com um amigo.' },
  { id:'ressentimento', label:'Ressentimento',    icon:'😤', studies:[3],     color:'#C0392B',
    desc:'Você carrega mágoa de alguém. Talvez com razão. Mas o ressentimento é como tomar veneno esperando que o outro adoeça.',
    versiculo:'Perdoem uns aos outros, assim como Deus os perdoou em Cristo.',
    versiculoRef:'Efésios 4.32 — NVT',
    action:'Pense em alguém que te magoou. Em oração, escolha perdoar essa pessoa hoje — mesmo que o sentimento ainda doa.' },
  { id:'isolamento',    label:'Isolamento',       icon:'🚪', studies:[4,5],   color:'#16A085',
    desc:'Você tem se afastado das pessoas, do grupo, da comunidade. Talvez por dor, por vergonha ou por hábito. Mas ninguém cresce sozinho.',
    versiculo:'Não deixemos de nos reunir, como é costume de alguns.',
    versiculoRef:'Hebreus 10.25 — NVT',
    action:'Envie uma mensagem a alguém da sua comunidade de fé hoje — um "oi, pensei em você" já é um passo.' },
  { id:'desanimo',      label:'Desânimo',         icon:'😔', studies:[6],  color:'#7F8C8D',
    desc:'A energia espiritual está baixa. Você sente que não está avançando, que suas orações não chegam a lugar nenhum.',
    versiculo:'Ele dá força aos cansados e vigor aos que estão sem energia.',
    versiculoRef:'Isaías 40.29 — NVT',
    action:'Escreva 3 coisas pelas quais você é grato hoje, mesmo em meio às dificuldades.' },
  { id:'sedentarismo',  label:'Sedentarismo Espiritual', icon:'🛋️', studies:[7], color:'#117A65',
    desc:'A fé existe — mas ficou confortável. Você parou de avançar, de se desafiar, de crescer. A zona de conforto pode ser uma armadilha silenciosa.',
    versiculo:'Esforce-se para apresentar-se aprovado diante de Deus.',
    versiculoRef:'2 Timóteo 2.15 — NVT',
    action:'Faça uma caminhada curta hoje e use o tempo para conversar com Deus sobre sua saúde física e espiritual.' },
  { id:'materialismo',  label:'Materialismo',     icon:'💰', studies:[8,13],  color:'#F39C12',
    desc:'As coisas materiais estão ocupando um espaço que deveria ser de Deus. Não é pecado ter — é pecado quando as coisas te têm.',
    versiculo:'Onde estiver o seu tesouro, aí também estará o seu coração.',
    versiculoRef:'Mateus 6.21 — NVT',
    action:'Identifique algo que você possui e que poderia compartilhar ou doar esta semana.' },
  { id:'medo',          label:'Medo do Futuro',   icon:'😨', studies:[9],  color:'#8E44AD',
    desc:'A incerteza do amanhã paralisa você. Você passa mais tempo se preocupando com o que pode acontecer do que vivendo o que está acontecendo agora.',
    versiculo:'Não fique preocupado com o dia de amanhã, pois o amanhã trará suas próprias preocupações.',
    versiculoRef:'Mateus 6.34 — NVT',
    action:'Escreva uma preocupação sua e, ao lado, uma promessa bíblica que fala sobre ela. Entregue isso a Deus em oração.' },
  { id:'ansiedade',     label:'Ansiedade',        icon:'😰', studies:[11,12], color:'#2980B9',
    desc:'Seu sistema interno está em alerta constante. A ansiedade drena energia e rouba o presente — antes dos problemas chegarem e depois de eles passarem.',
    versiculo:'Não fiquem ansiosos por nada, mas em tudo, por meio de oração, apresentem seus pedidos a Deus.',
    versiculoRef:'Filipenses 4.6 — NVT',
    action:'Quando a ansiedade vier hoje, pare e respire fundo 3 vezes lembrando: "Jesus está comigo agora."' },
];

const JOURNEY_MISSIONS = [
  // Sem estudo
  { id:'mj_tutor',   label:'Escolher seu Tutor de Jornada',                             icon:'🙋', xp:50,  unlock:[], check:()=>!!((typeof loadMeuGrupo === 'function') ? loadMeuGrupo() : null) },
  // Estudo 1 — O Amor de Deus
  { id:'mj_s1',      label:'Concluir o Estudo 1 — O Amor de Deus',                      icon:'❤️', xp:30,  unlock:[],  check:()=>ST.done.includes(0) },
  { id:'mj_s1_nat',  label:'Observar algo na natureza e registrar sobre o amor de Deus', icon:'🌿', xp:20,  unlock:[0], manual:true, check:()=>(ST.missionsDone||[]).includes('mj_s1_nat') },
  // Estudo 2 — A Ponte Sobre o Abismo
  { id:'mj_s2',      label:'Concluir o Estudo 2 — A Ponte Sobre o Abismo',               icon:'🌉', xp:30,  unlock:[0], check:()=>ST.done.includes(1) },
  { id:'mj_s2_talk', label:'Conversar com seu tutor sobre o que Jesus significa para você',icon:'💬', xp:20, unlock:[1], manual:true, check:()=>(ST.missionsDone||[]).includes('mj_s2_talk') },
  // Estudo 3 — Libertos da Culpa
  { id:'mj_s3',      label:'Concluir o Estudo 3 — Libertos da Culpa',                    icon:'🔓', xp:30,  unlock:[1], check:()=>ST.done.includes(2) },
  { id:'mj_s3_pray', label:'Fazer sua primeira oração pessoal registrada',                icon:'✍️', xp:25,  unlock:[2], check:()=>(ST.journal||[]).length>=1 },
  // Estudo 4 — Abra o Coração a Deus
  { id:'mj_s4',      label:'Concluir o Estudo 4 — Abra o Coração a Deus',                icon:'🗣️', xp:30,  unlock:[2], check:()=>ST.done.includes(3) },
  { id:'mj_s4_conf', label:'Registrar no diário algo que você confessou a Deus',          icon:'📔', xp:25,  unlock:[3], check:()=>(ST.journal||[]).length>=2 },
  // Estudo 5 — Consagração
  { id:'mj_s5',      label:'Concluir o Estudo 5 — Consagração',                          icon:'🎯', xp:30,  unlock:[3], check:()=>ST.done.includes(4) },
  { id:'mj_s5_ent',  label:'Entregar a Deus em oração uma área específica da vida',       icon:'🤲', xp:25,  unlock:[4], manual:true, check:()=>(ST.missionsDone||[]).includes('mj_s5_ent') },
  // Estudo 6 — Paz Mental
  { id:'mj_s6',      label:'Concluir o Estudo 6 — Paz Mental',                           icon:'🕊️', xp:30,  unlock:[4], check:()=>ST.done.includes(5) },
  // Marco — metade da jornada
  { id:'mj_half',    label:'Chegar à metade da Jornada (6 estudos concluídos)',           icon:'⛰️', xp:60,  unlock:[5], check:()=>ST.done.length>=6 },
  // Estudo 7 — Uma Nova Pessoa
  { id:'mj_s7',      label:'Concluir o Estudo 7 — Uma Nova Pessoa',                      icon:'🌱', xp:30,  unlock:[5], check:()=>ST.done.includes(6) },
  { id:'mj_s7_amor', label:'Praticar um ato concreto de amor por alguém esta semana',     icon:'❤️', xp:30,  unlock:[6], manual:true, check:()=>(ST.missionsDone||[]).includes('mj_s7_amor') },
  // Estudo 8 — Crescimento em Cristo
  { id:'mj_s8',      label:'Concluir o Estudo 8 — Crescimento em Cristo',                icon:'📈', xp:30,  unlock:[6], check:()=>ST.done.includes(7) },
  { id:'mj_streak5', label:'Estudar 5 dias seguidos',                                    icon:'🔥', xp:60,  unlock:[7], check:()=>ST.streak>=5 },
  // Estudo 9 — Atividade e Vida
  { id:'mj_s9',      label:'Concluir o Estudo 9 — Atividade e Vida',                     icon:'🌊', xp:30,  unlock:[7], check:()=>ST.done.includes(8) },
  { id:'mj_s9_serv', label:'Visitar ou cuidar de alguém que está em dificuldade',         icon:'🤝', xp:40,  unlock:[8], manual:true, check:()=>(ST.missionsDone||[]).includes('mj_s9_serv') },
  // Estudo 10 — O Deus que Eu Conheço
  { id:'mj_s10',     label:'Concluir o Estudo 10 — O Deus que Eu Conheço',               icon:'🔭', xp:30,  unlock:[8], check:()=>ST.done.includes(9) },
  // Estudo 11 — O Privilégio de Falar com Deus
  { id:'mj_s11',     label:'Concluir o Estudo 11 — O Privilégio de Falar com Deus',      icon:'🙏', xp:35,  unlock:[9], check:()=>ST.done.includes(10) },
  { id:'mj_streak7', label:'Estudar 7 dias seguidos',                                    icon:'🔥', xp:100, unlock:[10], check:()=>ST.streak>=7 },
  // Estudo 12 — Expulse a Dúvida
  { id:'mj_s12',     label:'Concluir o Estudo 12 — Expulse a Dúvida',                    icon:'🔦', xp:35,  unlock:[10], check:()=>ST.done.includes(11) },
  { id:'mj_s12_dvd', label:'Compartilhar uma dúvida com seu tutor ou grupo',              icon:'💬', xp:25,  unlock:[11], manual:true, check:()=>(ST.missionsDone||[]).includes('mj_s12_dvd') },
  // Estudo 13 — Alegria no Senhor
  { id:'mj_s13',     label:'Concluir o Estudo 13 — Alegria no Senhor',                   icon:'🌅', xp:40,  unlock:[11], check:()=>ST.done.includes(12) },
  // Conquista final
  { id:'mj_complete',label:'Completar toda a Jornada — 13 estudos concluídos',            icon:'👑', xp:200, unlock:[12], check:()=>ST.done.length>=13 },
  // ── Missões de campanha dos Pequenos Grupos (desbloqueiam pelo mês) ──────
  // unlockFn substitui unlock[] quando presente
  { id:'pg_visita_jul',   label:'Enviar delegação representando o PG para visitar outro Pequeno Grupo, e orar por eles.', icon:'🚶', xp:50,  unlock:[], unlockFn:()=>new Date().getMonth()+1>=7, manual:true, check:()=>(ST.missionsDone||[]).includes('pg_visita_jul') },
  { id:'pg_visita_ago',   label:'Enviar delegação representando o PG para visitar outro Pequeno Grupo em Agosto, e orar por eles.', icon:'🚶', xp:50,  unlock:[], unlockFn:()=>new Date().getMonth()+1>=8, manual:true, check:()=>(ST.missionsDone||[]).includes('pg_visita_ago') },
  { id:'pg_visita_set',   label:'Enviar delegação representando o PG para visitar outro Pequeno Grupo em Setembro, e orar por eles.', icon:'🚶', xp:50,  unlock:[], unlockFn:()=>new Date().getMonth()+1>=9, manual:true, check:()=>(ST.missionsDone||[]).includes('pg_visita_set') },
  { id:'pg_oracao',       label:'Participar da Semana de Oração com Pastor convidado',                     icon:'🙏', xp:60,  unlock:[], unlockFn:()=>new Date().getMonth()+1>=9, manual:true, check:()=>(ST.missionsDone||[]).includes('pg_oracao') },
];

const RPG_LEVELS = [
  {
    name:'Buscador', icon:'🌱', min:0,
    celebracao:'Você descobriu que Deus o ama. Talvez ainda tenha perguntas. Mas decidiu continuar caminhando.',
    desc:'Você deu o primeiro passo — procurou e encontrou o amor de Deus.<br><em>Estudo 1: O Amor de Deus</em>',
    next:'Complete o Estudo 2 para avançar.',
  },
  {
    name:'Seguidor', icon:'👣', min:80,
    celebracao:'Você está aprendendo a confiar em Jesus. A ponte foi atravessada. Sua jornada está apenas começando.',
    desc:'Você atravessou a ponte e está aprendendo a caminhar com Jesus.<br><em>Estudos 2–3: A Ponte Sobre o Abismo · Libertos da Culpa</em>',
    next:'Continue avançando para se tornar Aprendiz.',
  },
  {
    name:'Aprendiz', icon:'📖', min:240,
    celebracao:'Você abriu o coração, se consagrou e encontrou paz. A fé que antes era distante agora é real.',
    desc:'Você abriu o coração, se consagrou e está encontrando paz.<br><em>Estudos 4–6: Abra o Coração · Consagração · Paz Mental</em>',
    next:'Persevere para alcançar o nível Discípulo.',
  },
  {
    name:'Discípulo', icon:'🙏', min:490,
    celebracao:'Você é uma nova pessoa. Está crescendo, servindo e conhecendo Deus de perto. A transformação é real.',
    desc:'Você é uma nova pessoa, crescendo em Cristo e vivendo a fé na prática.<br><em>Estudos 7–10: Uma Nova Pessoa · Crescimento · Atividade e Vida · O Deus que Eu Conheço</em>',
    next:'Aprofunde-se para se tornar Guardião da Aliança.',
  },
  {
    name:'Guardião da Aliança', icon:'🕊️', min:850,
    celebracao:'Você ora com constância, expulsa a dúvida com fé e vive com alegria genuína. Você é um guardião daquilo que recebeu.',
    desc:'Você ora com constância, navega as dúvidas com fé e vive com alegria genuína.<br><em>Estudos 11–13: Oração · Expulse a Dúvida · Alegria no Senhor</em>',
    next:'O nível final aguarda: Cooperador de Cristo.',
  },
  {
    name:'Cooperador de Cristo', icon:'👑', min:1400,
    celebracao:'Você chegou ao fim desta jornada — e ao começo de uma nova. Agora é sua vez de caminhar com outros.',
    desc:'Você completou a jornada e está pronto para caminhar com outros, compartilhar o caminho e discipular.<br><em>Conquista: jornada completa — 13 encontros</em>',
    next:'',
  },
];

const STUDY_ATTRS = [
  { sabedoria:10, amor:5 },                         // 1  O Amor de Deus
  { sabedoria:10, perseveranca:5 },                 // 2  A Ponte Sobre o Abismo
  { amor:10, sabedoria:5 },                         // 3  Libertos da Culpa
  { amor:15, oracao:5 },                            // 4  Abra o Coração a Deus
  { perseveranca:15, oracao:5 },                    // 5  Consagração
  { oracao:15, perseveranca:5 },                    // 6  Paz Mental
  { amor:10, missao:5, perseveranca:5 },            // 7  Uma Nova Pessoa
  { sabedoria:10, perseveranca:10 },                // 8  Crescimento em Cristo
  { missao:15, amor:10 },                           // 9  Atividade e Vida
  { sabedoria:20, oracao:5 },                       // 10 O Deus que Eu Conheço
  { oracao:25 },                                    // 11 O Privilégio de Falar com Deus
  { perseveranca:15, sabedoria:10 },                // 12 Expulse a Dúvida
  { amor:15, missao:15, perseveranca:10 },          // 13 Alegria no Senhor
];

const FASE_UNLOCK = [
  { ids: [0] },           // Buscador       → 1 estudo
  { ids: [1, 2] },        // Seguidor       → 2 estudos
  { ids: [3, 4, 5] },     // Aprendiz       → 3 estudos
  { ids: [6, 7, 8, 9] },  // Discípulo      → 4 estudos
  { ids: [10, 11, 12] },  // Comprometido   → 3 estudos
  { ids: [] },            // (slot vazio)
  { ids: [] },
  { ids: [] },
];

const BADGES = [
  {id:'nivel1',  name:'Buscador',              icon:'🌱', desc:'Concluiu: Estudo 1 — O Amor de Deus'},
  {id:'nivel2',  name:'Seguidor',              icon:'👣', desc:'Concluiu: 2. A Ponte Sobre o Abismo Sagradas · 3. Libertos da Culpa'},
  {id:'nivel3',  name:'Aprendiz',              icon:'📖', desc:'Concluiu: 4. Abra o Coração a Deus · 5. Consagração'},
  {id:'nivel4',  name:'Discípulo',             icon:'🙏', desc:'Concluiu: 6. Andando com os Amigos de Jesus · 7. Uma Nova Pessoa · 8. Crescimento em Cristo · 9. Atividade e Vida'},
  {id:'nivel5',  name:'Guardião da Aliança',   icon:'🕊️', desc:'Concluiu: 10–13'},
  {id:'complete',name:'Cooperador de Cristo',  icon:'👑', desc:'Concluiu os 13 estudos da Jornada Discipular.'},
  {id:'streak7', name:'7 dias seguidos',       icon:'⚡', desc:'7 dias consecutivos de estudo.'},
];
const FASE_LABELS = {
  iniciante:'Buscador', aprendiz:'Aprendiz',
  discipulo:'Discípulo', comprometido:'Guardião da Aliança'
};

const ENCONTROS = [
  {
    num:1, title:'O Amor de Deus',
    question:'Sou amado mesmo com as minhas falhas?',
    texto:`<p>Antes de qualquer regra ou exigência, existe uma verdade que sustenta tudo: Deus é amor. Não um ser que possui amor como uma qualidade — Ele é amor na sua essência mais profunda.</p>
<p>Toda a natureza ecoa essa realidade. O sol que nasce sem falhar, o ar que respiramos, a chuva que alimenta os campos — tudo é sustentado pelo cuidado de um Pai. Mas a natureza conta apenas parte da história.</p>
<p>A humanidade, ao se afastar de Deus, distorceu a Sua imagem. Passou a enxergá-Lo como um juiz severo, um cobrador implacável que espreita nossos erros para punir. Essa distorção é uma das mais antigas e dolorosas mentiras.</p>
<p>Jesus veio desfazê-la. Cada gesto Seu — acolher um leproso, conversar com uma mulher rejeitada, ressuscitar o filho de uma viúva — revelava quem Deus realmente é. Não um ser distante e exigente, mas um Pai que corre ao encontro do filho antes mesmo de a confissão ser completada.</p>
<p>E o ápice dessa revelação foi a cruz. Ali, o próprio Deus pagou o preço mais alto — não por obrigação, mas por amor. Não para se mostrar poderoso, mas para se mostrar amoroso.</p>
<p>Você não precisa conquistar esse amor. Ele já é seu. A jornada que começa aqui não é para merecer o amor de Deus — é para descobrir o quanto ele já é real.</p>`,
    versiculo:'Porque Deus amou o mundo de tal maneira que deu o Seu Filho unigênito, para que todo o que nEle crê não pereça, mas tenha a vida eterna.',
    versiculoRef:'João 3.16 — NVT',
    conversa:['O que vem à sua mente quando pensa em Deus? Essa imagem é mais parecida com a de um juiz ou com a de um pai?','Já houve um momento em que você sentiu o amor de Deus de forma concreta? Como foi?','O que seria diferente na sua vida se você tivesse certeza absoluta de que Deus te ama exatamente como você é?'],
    espelho:'Pense numa área da sua vida onde você sente dificuldade em acreditar que Deus te ama. O que mudaria se você acreditasse completamente nessa verdade?',
    missao:'Observe algo na natureza hoje — um pôr do sol, uma planta, o céu. Pare e diga em voz alta: "Isso foi feito por alguém que me ama." Repita até as palavras chegarem ao coração.',
    missaoXP:30, missaoIcon:'🌿',
    diario:['O que aprendi sobre o amor de Deus','O que Deus falou comigo neste encontro','Minha oração','Minha decisão'],
  },
  {
    num:2, title:'A Ponte Sobre o Abismo',
    question:'Existe realmente um caminho de volta a Deus?',
    texto:`<p>Há uma lacuna entre o ser humano e Deus — não geográfica, mas espiritual. Uma distância real, que a maioria das pessoas sente em algum momento: a sensação de que algo está faltando, de que existe uma saudade sem nome.</p>
<p>O ser humano foi criado para viver em plena comunhão com Deus. Mas o pecado cavou um abismo. E o problema, que a história inteira confirma, é que nenhum esforço humano consegue atravessá-lo. Educação, moralidade, religiosidade, conquistas: todos chegam à beira do abismo e param.</p>
<p>Certa noite, um homem chamado Jacó dormiu no deserto, fugindo, sozinho, carregando culpa e medo. Ele sonhou com uma escada que ligava a terra ao céu — e Deus falando de cima. O sonho não era apenas poético: era uma resposta. Existe uma ponte.</p>
<p>Séculos depois, Jesus se referiu exatamente a esse sonho: "Vereis o céu aberto e os anjos de Deus subindo e descendo sobre o Filho do Homem." Jesus é a escada. Jesus é a ponte.</p>
<p>Não a religião. Não o esforço. Não a moralidade. Ele — em pessoa. E essa ponte está de pé, aberta, esperando qualquer pessoa em qualquer condição.</p>`,
    versiculo:'Eu sou o caminho, e a verdade, e a vida. Ninguém vem ao Pai senão por mim.',
    versiculoRef:'João 14.6 — NVT',
    conversa:['Você já sentiu aquela saudade de algo maior, um vazio que as conquistas e prazeres não preenchiam? Como descreveria isso?','O que você já tentou para preencher esse vazio? O que funcionou — e o que não funcionou?','A ideia de que Jesus é o único caminho parece exclusivista ou acolhedora para você? Por quê?'],
    espelho:'Pense num momento em que você tentou chegar a Deus por conta própria. O que faltou? O que mudaria se você aceitasse que Jesus já construiu o caminho?',
    missao:'Esta semana, escreva numa folha ou no celular: "Eu preciso de uma ponte." Guarde esse registro. Ore sobre isso todos os dias.',
    missaoXP:30, missaoIcon:'🌉',
    diario:['O que aprendi sobre o caminho de volta a Deus','O que Deus falou comigo neste encontro','Minha oração','Minha decisão'],
  },
  {
    num:3, title:'Libertos da Culpa',
    question:'Dá para realmente se livrar do peso da culpa?',
    texto:`<p>A palavra "arrependimento" tem má fama. Para muita gente soa como autopunição ou humilhação forçada. Mas o arrependimento bíblico é exatamente o oposto: é o primeiro passo real para a liberdade.</p>
<p>Arrepender-se significa mudar de direção. Perceber que o caminho em que você estava não levava a lugar nenhum bom — e virar.</p>
<p>Há uma diferença enorme entre lamentar as consequências do pecado e se arrepender do pecado em si. Quem sente apenas as consequências — a vergonha, o medo do castigo — ainda não chegou ao arrependimento genuíno. O arrependimento real nasce quando entendemos o que o pecado realmente é: uma separação do amor de Deus. E quando olhamos para a cruz e vemos o quanto essa separação custou, algo se parte dentro de nós — não de medo, mas de amor correspondido.</p>
<p>O rei Davi, depois de uma queda grave, não tentou se justificar nem minimizar. Foi a Deus com o peso todo — e pediu não só perdão, mas um coração novo.</p>
<p>E há um detalhe fundamental: você não precisa produzir arrependimento por conta própria. É o Espírito de Deus que desperta essa consciência e esse desejo de mudar. Sua parte é se abrir para o que Ele já está trabalhando em você.</p>`,
    versiculo:'Venham a mim todos os que estão cansados e sobrecarregados, e eu lhes darei descanso.',
    versiculoRef:'Mateus 11.28 — NVT',
    conversa:['Qual a diferença, na prática, entre sentir culpa e se arrepender de verdade?','Você já experimentou o alívio de ser perdoado — por uma pessoa ou por Deus? Como foi?','Existe algo em você que precisa de uma mudança de direção? O que impede de dar esse passo?'],
    espelho:'Pense numa área da sua vida que você sabe que precisa mudar. Não como punição — como libertação. O que seria diferente se essa área estivesse nas mãos de Deus?',
    missao:'Ore por 5 minutos hoje com uma única frase: "Deus, mostra o que precisa mudar em mim." Repita essa oração todos os dias desta semana.',
    missaoXP:35, missaoIcon:'🔓',
    diario:['O que aprendi sobre arrependimento e liberdade','O que Deus falou comigo neste encontro','Minha oração','Minha decisão'],
  },
  {
    num:4, title:'Abra o Coração a Deus',
    question:'Por que confessar algo que Deus já sabe?',
    texto:`<p>Existe algo extraordinariamente libertador em dizer a verdade — especialmente para Deus. A confissão não é uma cerimônia religiosa. É simplesmente abrir o coração e ser honesto.</p>
<p>Deus não precisa da sua confissão para saber o que aconteceu. Ele já sabe. A confissão é para você — para que você deixe de carregar o peso sozinho.</p>
<p>A confissão bíblica tem três características: ela é específica, ela é sincera e ela leva a uma mudança real. Não é uma lista decorada de pecados genéricos. É nomear o que aconteceu, com honestidade, diante de Deus.</p>
<p>A confissão também tem destinatários certos. Alguns pecados são só com Deus. Outros envolvem pessoas — e nesses casos, pedir desculpas faz parte da restauração. A reconciliação é sempre o objetivo.</p>
<p>E a promessa é clara: se confessarmos os nossos pecados, Ele é fiel e justo para nos perdoar e nos purificar de toda injustiça. Não é um favor especial que você precisa conquistar. É uma promessa baseada no caráter de Deus — e promessas de Deus não falham.</p>`,
    versiculo:'Se confessarmos os nossos pecados, Deus é fiel e justo para nos perdoar e nos purificar de toda maldade.',
    versiculoRef:'1 João 1.9 — NVT',
    conversa:['Qual é a diferença entre sentir vergonha de um erro e genuinamente confessá-lo a Deus?','Já houve uma situação em que pedir desculpas a alguém transformou o relacionamento? O que aconteceu?','O que te impede de ser completamente honesto com Deus? O que você acha que Ele faria com essa honestidade?'],
    espelho:'Há algo que você carrega há tempo sem confessar a Deus? Que passo você pode dar ainda hoje para abrir esse espaço?',
    missao:'Reserve 10 minutos esta semana para uma oração honesta — sem rodeios. Diga o que você fez, o que você sente e o que você precisa. Termine recebendo o perdão em silêncio.',
    missaoXP:35, missaoIcon:'🗣️',
    diario:['O que aprendi sobre confissão e perdão','O que Deus falou comigo neste encontro','Minha oração','Minha decisão'],
  },
  {
    num:5, title:'Consagração',
    question:'O que significa realmente entregar minha vida a Deus?',
    texto:`<p>Consagração parece uma palavra religiosa e distante. Mas ela descreve algo muito concreto: colocar a sua vida inteira nas mãos de Deus — incluindo as partes que você ainda não resolveu.</p>
<p>Muita gente tem medo de fazer isso. Parece que entregar a Deus significa perder o controle, abrir mão dos sonhos, viver uma vida sem graça. Mas quem já fez essa entrega sabe: é exatamente o contrário.</p>
<p>Consagração não é uma decisão emocional de momento. É uma postura diária de dizer: "Deus, não a minha vontade, mas a Tua." É o que Jesus demonstrou no Getsêmani — não um ser humano sem desejos, mas alguém que escolheu colocar a vontade do Pai acima da própria.</p>
<p>Uma imagem poderosa: imagine uma criança com as mãos cheias de cacos de vidro. Ela não consegue segurar mais nada — e está se machucando. Deus não quer tirar algo bom de você. Ele quer que você solte o que está te ferindo para poder encher as suas mãos com coisas melhores.</p>
<p>E começa com uma pergunta honesta: o que em minha vida ainda não está nas mãos de Deus? A consagração não exige que você esteja perfeito antes de entregar — ela produz a transformação depois que você entrega.</p>`,
    versiculo:'"Porque eu sei os planos que tenho para vocês", diz o Senhor. "Planos para o bem e não para o mal, a fim de lhes dar um futuro e uma esperança."',
    versiculoRef:'Jeremias 29.11 — NVT',
    conversa:['Qual área da sua vida é mais difícil de entregar a Deus? Por quê?','O que você imagina que Deus faria com o controle da sua vida se você de fato entregasse?','Consagração é um ato único ou um processo contínuo? O que isso muda na forma de você encarar isso?'],
    espelho:'Feche os olhos e pense na área da sua vida que mais te gera ansiedade. Visualize entregando isso nas mãos de Deus. O que você sente?',
    missao:'Escolha uma área concreta da sua vida para consagrar a Deus esta semana. Escreva: "[Área] — Isso é Seu, Deus." Coloque num lugar visível.',
    missaoXP:40, missaoIcon:'🎯',
    diario:['O que aprendi sobre consagração','O que Deus falou comigo neste encontro','Minha oração','Minha decisão'],
  },
  {
    num:6, title:'Paz Mental',
    question:'É possível ter paz real em meio ao caos?',
    texto:`<p>A paz que Deus oferece não é a ausência de problemas. É a presença Dele no meio dos problemas. E essa diferença muda tudo.</p>
<p>Fé não é fingir que está tudo bem. É confiar em quem pode fazer tudo ficar bem — mesmo enquanto ainda não está. É apoiar o peso sobre quem provou ser digno de confiança.</p>
<p>Um dos maiores obstáculos espirituais é a dificuldade de aceitar o perdão. Muitas pessoas sabem intelectualmente que Deus perdoa, mas continuam carregando a culpa — como se a graça fosse para os outros, não para elas. A fé que gera paz mental é a que diz: "Eu acredito que o que Jesus fez é suficiente. Inclusive para mim."</p>
<p>Imagine que alguém pagou uma dívida enorme sua. O banco confirmou. O recibo está em mãos. Mas você continua sofrendo como se ainda devesse. Isso não honra o sacrifício de quem pagou — e não te faz bem.</p>
<p>A paz nasce quando a fé e a aceitação se encontram. Quando você para de tentar merecer e começa a receber. Quando você descansa não porque resolveu tudo — mas porque confia em quem tem tudo nas mãos.</p>`,
    versiculo:'Não fiquem ansiosos por nada, mas em tudo, por meio de oração e súplica, com ações de graça, apresentem seus pedidos a Deus. E a paz de Deus, que excede todo entendimento, guardará os seus corações e as suas mentes em Cristo Jesus.',
    versiculoRef:'Filipenses 4.6-7 — NVT',
    conversa:['O que você normalmente faz quando está ansioso ou sem paz? Funciona a longo prazo?','Qual é a diferença entre paz que depende das circunstâncias e a paz que Deus oferece?','O que seria necessário mudar na sua vida para você viver com mais paz de forma consistente?'],
    espelho:'Em qual situação da sua vida você mais precisa de paz agora? O que impede você de confiar essa situação completamente a Deus?',
    missao:'Por 7 dias, ao acordar, diga em voz alta: "Deus, eu te entrego este dia." Anote ao final de cada dia como foi.',
    missaoXP:40, missaoIcon:'🕊️',
    diario:['O que aprendi sobre fé e paz','O que Deus falou comigo neste encontro','Minha oração','Minha decisão'],
  },
  {
    num:7, title:'Uma Nova Pessoa',
    question:'Posso realmente mudar — ou sempre vou ser assim?',
    texto:`<p>Uma das perguntas mais comuns após alguém se aproximar de Deus é: "Mas eu ainda sinto as mesmas tentações. Mudei mesmo?"</p>
<p>A resposta surpreende muita gente: ser uma nova pessoa não significa não sentir mais tentações. Significa ter um novo coração, um novo desejo — e um novo poder para responder às tentações de forma diferente.</p>
<p>Jesus foi direto: a evidência de que você pertence a Ele não é o que você professa — é o que você vive. Amigos de Jesus são conhecidos pelo amor que têm uns pelos outros. Essa é a marca.</p>
<p>Mas essa transformação não acontece por força de vontade. Ninguém se torna uma nova pessoa decidindo muito forte. A mudança vem de uma conexão viva com Jesus — como um galho que permanece na videira e, por isso, produz fruto naturalmente.</p>
<p>Permanecer em Jesus — pelo estudo da Palavra, pela oração, pela comunhão com outros discípulos — é a condição do fruto. Não um esforço que você faz para Deus, mas uma conexão que você mantém com Deus.</p>
<p>A transformação não precisa ser espetacular para ser real. Uma paciência um pouco maior. Uma palavra gentil que antes não saía. Um momento de bondade inesperado. O Espírito de Deus trabalha em profundidade, com constância — e Ele não desiste da obra que começou em você.</p>`,
    versiculo:'Isso significa que todo aquele que pertence a Cristo tornou-se uma pessoa nova. A vida antiga foi-se; eis que a nova chegou!',
    versiculoRef:'2 Coríntios 5.17 — NVT',
    conversa:['Você percebe alguma mudança real em você desde que começou a se aproximar de Deus? Qual?','Qual é a diferença entre tentar mudar por esforço próprio e deixar Deus mudar você?','O que "permanecer em Jesus" significa na prática do seu dia a dia?'],
    espelho:'Pense numa área onde você percebe que está mudando — mesmo que lentamente. Agradeça a Deus por isso. Se não perceber nada, pergunte a alguém próximo.',
    missao:'Pratique um ato de amor concreto por alguém esta semana — não por obrigação, mas como expressão de quem você está se tornando.',
    missaoXP:40, missaoIcon:'🌱',
    diario:['O que aprendi sobre transformação','O que Deus falou comigo neste encontro','Minha oração','Minha decisão'],
  },
  {
    num:8, title:'Crescimento em Cristo',
    question:'Como a fé cresce — e o que impede isso?',
    texto:`<p>Uma semente plantada precisa crescer. Não por esforço próprio — mas porque a vida dentro dela tende ao crescimento. Com a fé é igual.</p>
<p>O cristão que não cresce é como uma planta sem água e sem sol — pode estar vivo, mas não está prosperando. E o crescimento não acontece por acidente: ele precisa de nutrição, luz e tempo.</p>
<p>A nutrição vem da Palavra de Deus, que alimenta a fé. A luz vem da comunhão com o Espírito Santo e com outros cristãos. E o tempo? É o tempo da graça de Deus — Ele não desiste da obra que começou.</p>
<p>Uma prática fundamental: olhar para Jesus constantemente. Não para seus próprios fracassos, não para os erros dos outros, não para as circunstâncias. O crescimento vem de fixar o olhar nEle.</p>
<p>Outro ingrediente indispensável: a comunidade. Ninguém cresce na fé em isolamento. O grupo em que você está agora não é apenas um contexto social — é um ambiente espiritual projetado para o seu crescimento. Cada encontro aqui é um investimento no que você está se tornando.</p>`,
    versiculo:'Fixemos os olhos em Jesus, o autor e consumador da nossa fé, o qual, pelo gozo que lhe estava proposto, suportou a cruz, desprezando a vergonha.',
    versiculoRef:'Hebreus 12.2 — NVT',
    conversa:['Quais práticas espirituais mais contribuem para o seu crescimento? O que dificulta mantê-las?','Como a comunidade — este grupo — tem contribuído para a sua caminhada?','O que significa para você "fixar os olhos em Jesus" no dia a dia concreto?'],
    espelho:'Em qual área espiritual você mais quer crescer nos próximos meses? O que você pode fazer de forma concreta esta semana para iniciar esse crescimento?',
    missao:'Memorize um versículo curto esta semana. Repita ao longo do dia. A Palavra guardada no coração é raiz para o crescimento.',
    missaoXP:40, missaoIcon:'📈',
    diario:['O que aprendi sobre crescimento espiritual','O que Deus falou comigo neste encontro','Minha oração','Minha decisão'],
  },
  {
    num:9, title:'Atividade e Vida',
    question:'Minha fé precisa sair do papel — mas como?',
    texto:`<p>A fé que recebemos é um presente gratuito que não precisamos merecer. Mas essa mesma fé, quando genuína, inevitavelmente nos leva à ação — ao serviço, ao cuidado com o próximo, à vida ativa em amor.</p>
<p>Quando alguém passa por uma experiência real com Deus, a primeira coisa que quer é contar para alguém. Alegria que não transborda não é alegria plena.</p>
<p>Além disso, a ação tem um poder formativo. Você não age porque já é perfeito — você age e vai sendo formado no processo. Cada ato de generosidade, cada visita ao doente, cada palavra de encorajamento transforma também quem a pratica.</p>
<p>E há algo mais profundo: ao servir os outros, você encontra Jesus. Ele disse que tudo que fizer ao menor de Seus irmãos, faz a Ele. O serviço não é apenas uma obrigação moral — é um encontro espiritual.</p>
<p>A vida cristã não é um espetáculo de domingo — é uma prática de segunda a segunda. Cada dia é uma oportunidade de tornar visível o amor invisível de Deus. E essa prática não é um fardo — é a vida mais plena que existe.</p>`,
    versiculo:'Assim também a fé, se não tiver obras, por si mesma está morta.',
    versiculoRef:'Tiago 2.17 — NVT',
    conversa:['Como a sua fé tem se traduzido em ações práticas no cotidiano? Dê um exemplo concreto.','Existe alguém ao seu redor que está precisando de cuidado e você tem evitado? Por quê?','O que significa para você "servir como se estivesse servindo a Jesus"?'],
    espelho:'Quem ao seu redor precisa de um ato concreto de amor esta semana? Seja específico — nome e ação.',
    missao:'Realize um ato de bondade concreto por alguém esta semana. Faça com atenção, como se estivesse fazendo para Jesus. Registre no diário como foi.',
    missaoXP:45, missaoIcon:'🌊',
    diario:['O que aprendi sobre fé em ação','O que Deus falou comigo neste encontro','Minha oração','Minha decisão'],
  },
  {
    num:10, title:'O Deus que Eu Conheço',
    question:'Conhecer sobre Deus é diferente de conhecer Deus?',
    texto:`<p>Existe uma diferença enorme entre saber sobre Deus e conhecer Deus. Você pode saber tudo sobre uma pessoa — nome, história, personalidade — sem ter intimidade real com ela. Com Deus é igual.</p>
<p>A Bíblia fala de conhecer Deus como uma experiência pessoal, viva, crescente. Não é um acúmulo de informações teológicas — é um relacionamento que se aprofunda com o tempo.</p>
<p>O principal meio para conhecer Deus é a Palavra. Não como um livro de regras — mas como a revelação do caráter dEle. Quando você lê a Bíblia e encontra Jesus curando, perdoando, chamando pessoas pelo nome, você está vendo quem Deus é.</p>
<p>A natureza também fala. O amanhecer, o oceano, a complexidade de uma folha — tudo revela algo sobre o Criador. Mas a Palavra vai mais fundo: ela revela o coração de Deus, Seus pensamentos, Seus planos para você.</p>
<p>E o Espírito Santo é quem torna esse conhecimento real — não apenas intelectual, mas vivo. Ele transforma o que você lê em encontro pessoal. Conhecer Deus é a maior aventura humana possível. E ela não tem fim — se aprofunda eternamente.</p>`,
    versiculo:'E a vida eterna é esta: que te conheçam, o único Deus verdadeiro, e a Jesus Cristo, a quem enviaste.',
    versiculoRef:'João 17.3 — NVT',
    conversa:['Como você descreve a diferença entre saber sobre Deus e realmente O conhecer?','O que você descobriu sobre Deus nesta jornada que mudou a forma como você O vê?','O que você faria de diferente na sua rotina para aprofundar esse conhecimento pessoal?'],
    espelho:'Ao ler a Bíblia, você busca informação ou busca encontro? O que mudaria se você abordasse a leitura como uma conversa com Deus?',
    missao:'Ao ler qualquer texto bíblico esta semana, faça antes uma pergunta: "Deus, o que isso me revela sobre quem Você é?" Registre o que perceber.',
    missaoXP:45, missaoIcon:'🔭',
    diario:['O que aprendi sobre conhecer a Deus','O que Deus falou comigo neste encontro','Minha oração','Minha decisão'],
  },
  {
    num:11, title:'O Privilégio de Falar com Deus',
    question:'Oração: dever ou conversa real?',
    texto:`<p>Imagine ter acesso direto ao Criador do universo — a qualquer hora, em qualquer lugar, sem burocracia. Isso é exatamente o que a oração é. E é um privilégio que muita gente tem, mas poucos realmente aproveitam.</p>
<p>A oração não é uma técnica mágica nem uma performance religiosa. É simplesmente conversar com Deus — com honestidade, com confiança, com o coração aberto.</p>
<p>Deus não fica impressionado com o volume das suas palavras. Ele se move pelo peso do seu coração. Uma oração sincera de uma linha tem mais poder do que uma liturgia elaborada sem intenção.</p>
<p>Elementos de uma vida de oração saudável: adoração — reconhecer quem Deus é; confissão — manter o coração limpo; ação de graças — cultivar gratidão; intercessão — orar pelos outros; súplica — trazer suas necessidades reais.</p>
<p>E depois de falar? Ouvir. Oração que é só fala, sem espaço para a resposta de Deus, é monólogo. A parte mais transformadora muitas vezes vem no silêncio após as palavras.</p>`,
    versiculo:'Orem sem parar.',
    versiculoRef:'1 Tessalonicenses 5.17 — NVT',
    conversa:['Como é a sua vida de oração hoje? O que você gostaria que fosse diferente?','Você já experimentou uma resposta clara a uma oração? O que aconteceu?','O que você acha mais difícil na oração — começar, manter a consistência ou confiar nas respostas de Deus?'],
    espelho:'Se você tratasse a oração como uma conversa com alguém que te ama profundamente, o que você diria a Deus hoje que ainda não disse?',
    missao:'Ore por 5 minutos diários esta semana — estruturado: adore, confesse, agradeça, interceda, peça. Termine em 1 minuto de silêncio.',
    missaoXP:50, missaoIcon:'🙏',
    diario:['O que aprendi sobre oração','O que Deus falou comigo neste encontro','Minha oração','Minha decisão'],
  },
  {
    num:12, title:'Expulse a Dúvida',
    question:'Dúvida é falta de fé — ou parte do caminho?',
    texto:`<p>Existe um mito prejudicial no mundo cristão: o de que ter dúvidas significa falta de fé. Mas os maiores homens e mulheres de Deus na Bíblia duvidaram — Abraão, Moisés, João Batista, Tomé, que estava com Jesus diariamente.</p>
<p>A dúvida honesta, trazida a Deus com sinceridade, pode ser o ponto de partida para uma fé mais profunda e mais real. O problema não é duvidar — é deixar que a dúvida se torne amargura ou abandono.</p>
<p>A Palavra de Deus não teme as perguntas difíceis. Ela foi escrita em um mundo de conflito, sofrimento e questionamento — e responde a esse mundo com profundidade e honestidade.</p>
<p>Alguns princípios para navegar as dúvidas: aja a partir do que você já sabe — não paralise pelo que ainda não sabe. Mantenha a conexão com Deus — mesmo quando não entende, continue orando. Busque comunidade — outros já passaram pelo que você está passando. Confie no caráter de Deus — o que você já conhece dEle é mais que suficiente para confiar no que ainda não compreende.</p>
<p>Deus não é ameaçado pelas suas perguntas. Ele as convida. A fé que sobrevive às perguntas difíceis é a mais sólida.</p>`,
    versiculo:'Se me procurarem com todo o coração, permitirei que me encontrem.',
    versiculoRef:'Jeremias 29.13 — NVT',
    conversa:['Qual dúvida sobre a fé você tem carregado que ainda não compartilhou com ninguém?','Como você distingue uma dúvida saudável de uma dúvida que está te afastando de Deus?','O que você faria de diferente se acreditasse que Deus não tem medo das suas perguntas?'],
    espelho:'Escreva sua maior dúvida sobre Deus ou a fé. Ore sobre ela. Compartilhe com seu tutor ou companheiro esta semana.',
    missao:'Compartilhe uma dúvida que você tem com seu tutor, companheiro ou alguém do grupo. A dúvida compartilhada deu o primeiro passo para ser respondida.',
    missaoXP:50, missaoIcon:'🔦',
    diario:['O que aprendi sobre dúvida e fé','O que Deus falou comigo neste encontro','Minha oração','Minha decisão'],
  },
  {
    num:13, title:'Alegria no Senhor',
    question:'Alegria cristã é real ou é performance?',
    texto:`<p>Chegamos ao último encontro com uma verdade que resume tudo: a fé cristã não é um fardo a ser carregado. É uma fonte de alegria que o mundo não consegue dar e não consegue tirar.</p>
<p>Não é a alegria superficial das circunstâncias favoráveis. É uma alegria mais profunda — que coexiste com a dor, persiste na dificuldade, e cresce quanto mais você conhece Deus.</p>
<p>A alegria cristã não é negação da realidade. Jesus não disse que a vida seria fácil — disse que poderíamos ter paz e alegria em meio às tribulações. A diferença é que alguém está no controle e esse alguém nos ama profundamente.</p>
<p>A alegria cresce quando você olha para o que Deus já fez — a gratidão transforma a perspectiva. Quando você compartilha a fé com outros — alegria multiplicada é alegria maior. Quando você serve sem esperar retorno. Quando você mantém os olhos em Jesus — e não nas circunstâncias.</p>
<p>Esta jornada foi um começo, não um fim. Você não terminou de crescer — está cada vez mais no centro do processo. E a marca dessa obra, quando madura, é exatamente essa: alegria. Não a de quem não sofre — mas a de quem sabe com quem está.</p>`,
    versiculo:'Alegrem-se sempre no Senhor! Repetirei: alegrem-se!',
    versiculoRef:'Filipenses 4.4 — NVT',
    conversa:['Qual é a diferença entre felicidade e alegria? Você já experimentou alegria em meio a uma situação difícil?','O que esta jornada mudou em você — na forma de ver Deus, a si mesmo e os outros?','O que você quer levar daqui para frente? Que próximo passo você quer dar?'],
    espelho:'Faça uma lista de 5 motivos para ser grato a Deus agora — não coisas perfeitas, mas presentes reais. Compartilhe pelo menos um com o grupo.',
    missao:'Compartilhe com alguém fora do grupo algo que você aprendeu nesta jornada. Conte sua história — de onde você saiu e onde está agora.',
    missaoXP:60, missaoIcon:'🌅',
    diario:['O que aprendi nesta jornada completa','O que Deus falou comigo neste encontro','Minha oração','Minha decisão'],
  },
];

const OBSTACULOS = [
  { id:'falta-oracao', icon:'🙈', name:'Falta de Oração',
    desc:'A oração ficou para depois. O problema não é falta de tempo — é falta de prioridade. E a distância de Deus cresce no silêncio.',
    versiculo:'Orem sem parar.',
    versiculoRef:'1 Ts 5.17 — NVT',
    acao:'Ore por apenas 5 minutos hoje. Não precisa ser elaborado — uma conversa honesta com Deus já conta.',
    attrs:{oracao:15, perseveranca:5}, xp:40 },
  { id:'ressentimento', icon:'😤', name:'Ressentimento',
    desc:'Você carrega mágoa de alguém. Talvez com razão. Mas o ressentimento é como tomar veneno esperando que o outro adoeça.',
    versiculo:'Perdoem uns aos outros, assim como Deus os perdoou em Cristo.',
    versiculoRef:'Efésios 4.32 — NVT',
    acao:'Pense na pessoa que você precisa perdoar. Ore por ela pelo nome — não pedindo que ela mude, mas pedindo paz para o seu coração.',
    attrs:{amor:20, perseveranca:5}, xp:50 },
  { id:'isolamento', icon:'🚪', name:'Isolamento',
    desc:'Você tem se afastado das pessoas, do grupo, da comunidade. Talvez por dor, por vergonha ou por hábito. Mas ninguém cresce sozinho.',
    versiculo:'Não deixemos de nos reunir, como é costume de alguns.',
    versiculoRef:'Hebreus 10.25 — NVT',
    acao:'Entre em contato com alguém do grupo hoje — uma mensagem, uma ligação curta. Um passo na direção da comunidade.',
    attrs:{amor:15, perseveranca:10}, xp:40 },
  { id:'desanimo', icon:'😔', name:'Desânimo',
    desc:'A energia espiritual está baixa. Você sente que não está avançando, que suas orações não chegam a lugar nenhum.',
    versiculo:'Ele dá força aos cansados e vigor aos que estão sem energia.',
    versiculoRef:'Isaías 40.29 — NVT',
    acao:'Leia o Salmo 42 devagar, como se fosse uma oração sua. Deixe que as palavras do salmista expressem o que você está sentindo.',
    attrs:{perseveranca:20, oracao:5}, xp:45 },
  { id:'sedentarismo', icon:'🛋️', name:'Sedentarismo Espiritual',
    desc:'A fé existe — mas ficou confortável. Você parou de avançar, de se desafiar, de crescer. A zona de conforto pode ser uma armadilha silenciosa.',
    versiculo:'Esforce-se para apresentar-se aprovado diante de Deus.',
    versiculoRef:'2 Timóteo 2.15 — NVT',
    acao:'Faça algo que te desafie espiritualmente esta semana — um estudo novo, uma conversa difícil, um ato de serviço fora da sua zona de conforto.',
    attrs:{perseveranca:15, missao:10}, xp:45 },
  { id:'materialismo', icon:'💰', name:'Materialismo',
    desc:'As coisas materiais estão ocupando um espaço que deveria ser de Deus. Não é pecado ter — é pecado quando as coisas te têm.',
    versiculo:'Pois onde estiver o seu tesouro, aí também estará o seu coração.',
    versiculoRef:'Mateus 6.21 — NVT',
    acao:'Doe algo esta semana — dinheiro, tempo ou habilidade — para alguém que precisa. Pratique a generosidade como ato de fé.',
    attrs:{amor:15, missao:10}, xp:45 },
  { id:'medo-futuro', icon:'😨', name:'Medo do Futuro',
    desc:'A incerteza do amanhã paralisa você. Você passa mais tempo se preocupando com o que pode acontecer do que vivendo o que está acontecendo agora.',
    versiculo:'Não fique preocupado com o dia de amanhã, pois o amanhã trará suas próprias preocupações.',
    versiculoRef:'Mateus 6.34 — NVT',
    acao:'Liste 3 medos concretos sobre o futuro. Para cada um, escreva: "Deus, eu te entrego isso." Ore sobre essa lista.',
    attrs:{perseveranca:15, oracao:10}, xp:40 },
  { id:'ansiedade', icon:'😰', name:'Ansiedade',
    desc:'Seu sistema interno está em alerta constante. A ansiedade drena energia e rouba o presente — antes dos problemas chegarem e depois de eles passarem.',
    versiculo:'Não fiquem ansiosos por nada, mas em tudo, por meio de oração, apresentem seus pedidos a Deus.',
    versiculoRef:'Filipenses 4.6 — NVT',
    acao:'Quando a ansiedade chegar hoje, pare por 2 minutos. Respire fundo. Diga: "Deus, esse momento é Seu." Repita até a tensão diminuir.',
    attrs:{oracao:15, perseveranca:10}, xp:40 },
];

