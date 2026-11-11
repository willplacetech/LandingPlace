# Especificação de design — landing page PlaceTech

## Objetivo

Criar uma página institucional/portfólio responsiva para apresentar as soluções da PlaceTech a empresas e profissionais e facilitar o contato comercial.

## Direção visual

- Usar a identidade da apresentação: alternar seções com fundo preto e branco, texto de alto contraste e laranja como cor de destaque, com estética tecnológica.
- Criar uma composição editorial, atual e própria para a PlaceTech; não tratar a apresentação como um template literal.
- Usar hierarquia tipográfica clara, espaços generosos, superfícies escuras e imagens ou composições visuais de tecnologia que apoiem o conteúdo sem competir com ele.
- Usar superfícies escuras e claras alternadas entre os blocos principais; manter transições sutis em navegação, botões e cards, além de animações de entrada discretas quando apropriado.
- Respeitar `prefers-reduced-motion` e manter conteúdo, links e ações utilizáveis sem animação.

## Estrutura e conteúdo

1. **Cabeçalho:** marca PlaceTech, navegação por âncoras para soluções, empresa e contato, e ação para falar com a equipe.
2. **Hero:** posicionamento como soluções em tecnologia e representação comercial em São Paulo/SP, chamada clara para contato e elemento visual relacionado a tecnologia.
3. **Empresa e diferenciais:** texto baseado na apresentação, destacando atendimento consultivo e personalizado, agilidade na entrega e no suporte, qualidade, garantia e suporte pós-venda.
4. **Soluções:** apresentar, em blocos navegáveis, os seguintes grupos:
   - Servidores: armazenamento centralizado, sistemas e aplicações internas, backup e continuidade; dimensionamento conforme porte e necessidade.
   - Conectividade e telefonia: switches, patch cords, patch panels, hubs, roteadores, repetidores e linhas domésticas e empresariais.
   - Mobilidade premium: notebooks Apple das linhas Air e Pro, novos ou seminovos com garantia, para profissionais e equipes criativas.
   - Notebooks: diferentes marcas e configurações para uso diário, renovação de parque e home office corporativo.
   - Celulares: diferentes marcas e faixas de preço para equipes comerciais, comunicação corporativa e gestão de aparelhos.
   - Acessórios: teclados, mouses, headsets, cabeamento, suportes e monitores.
5. **Clientes:** carrossel automático em loop com os seis logos incluídos na apresentação: ANDRITZ, Palmeiras, Engemon, Renault Brasil, ampm e Santos FC. Pausar em interação, oferecer controle de pausa, respeitar movimento reduzido e evitar criar novos nomes, métricas ou depoimentos.
6. **Contato e rodapé:** CTA destacado, telefone `(11) 91597-1190`, e-mail `vendas@placotech.com.br` e Instagram `@placotechh`, com links funcionais para os respectivos canais.

## Ação de contato

Dar destaque a uma conversa pelo WhatsApp usando o telefone informado na apresentação, com endereço internacional `+55 11 91597-1190`; manter também ligação e e-mail como alternativas visíveis. O link deve ter rótulo acessível e abrir em nova aba com as proteções adequadas caso use `target="_blank"`.

## Implementação prevista

- Página estática em `index.html`, com HTML, CSS e JavaScript no próprio arquivo, sem framework ou dependências de runtime.
- Layout responsivo, com navegação por âncoras e menu utilizável em telas pequenas.
- JavaScript limitado ao controle de pausa do carrossel; sem JavaScript, apresentar a lista de clientes de forma estática e completa.
- Conteúdo em português brasileiro, com semântica HTML, foco visível, links distinguíveis e contraste adequado.
- Não incluir formulários sem destino funcional, preços, promessas, logos ou provas sociais que não constem na apresentação.

## Critérios de aceitação

- Em desktop e mobile, a página apresenta os blocos acima sem rolagem horizontal e com navegação e CTAs operáveis.
- Telefone, e-mail e Instagram correspondem aos dados da apresentação; o CTA de WhatsApp usa o telefone formatado com código do Brasil.
- Os seis grupos de soluções, diferenciais e seis logos de clientes do PDF estão representados sem inventar características comerciais.
- Transições são discretas; carrossel pode ser pausado e fica estático com movimento reduzido.
- O documento pode ser aberto diretamente como arquivo HTML sem instalação de pacotes ou servidor.
- Verificar HTML/JS e abrir a página no navegador em larguras desktop e mobile; confirmar navegação, destinos de contato e ausência de overflow horizontal.

## Premissas e limites

- O PDF é a fonte de verdade para marca, portfólio, diferenciais e contatos. Se um detalhe for ambíguo, usar o texto explicitamente visível na apresentação em vez de criar novos dados.
- A direção para uma página estática sem framework foi aprovada pelo usuário em 2026-11-11. Em seguida, o usuário pediu para iniciar a implementação sem um plano separado.
- Em 2026-11-11, o usuário pediu substituir “placotech” por “placetech” na identidade visual e adicionar os logos de clientes do PDF num carrossel automático. Os identificadores de contato permanecem conforme a fonte original para não criar endereços não verificados.
