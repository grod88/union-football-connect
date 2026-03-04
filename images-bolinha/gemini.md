1. Validação da Arquitetura (OBS + ElevenLabs)
A sua arquitetura é excelente e de nível profissional. O fluxo Evento -> Edge Function (Claude + ElevenLabs) -> Supabase Realtime (WebSockets) -> OBS Browser Source é exatamente o padrão ouro para overlays interativos de baixa latência.

Pontos de atenção e dicas de especialista:

Latência do Áudio (Base64 vs URL): Enviar o áudio em base64 pelo Supabase Realtime funciona bem para arquivos curtos, mas pode estourar o limite de tamanho da mensagem do WebSockets se o áudio passar de uns 10 segundos. Uma alternativa mais segura é a Edge Function salvar o áudio num storage temporário (ou bucket do Supabase) e enviar apenas a URL pública no payload. O React no OBS simplesmente faz um <audio src="url">.

Pre-loading de Imagens (Crucial para o OBS): Quando o React recebe o comando para trocar da pose "Neutra" para "Comemorando", se a imagem não estiver no cache, o Bolinha vai piscar ou sumir por uma fração de segundo. Dica: No seu ObsBolinha.tsx, crie tags <img src="..." style={{display: 'none'}} /> para todas as imagens do Bolinha logo que o widget carregar. Assim, elas já estarão na RAM do OBS e a troca será instantânea.

Segurança (Whitelabel): Sua ideia de não usar marcas (como a da Adidas ou logos dos times) é perfeita para evitar strikes no YouTube/Twitch. Mantenha os prompts focados apenas nas cores e em padrões geométricos.

2. Dicas de Design e Consistência de Personagem (O Desafio da IA)
Manter o mesmo rosto em várias gerações de IA é o maior desafio atual. O modelo pode mudar levemente o formato dos olhos ou o tamanho das mãos entre uma geração e outra.

Estratégia de Ouro:

Gere apenas a bola base perfeita (sem braços e sem rosto, ou com um rosto muito básico).

Use uma ferramenta como Photoshop, Canva ou Figma para adicionar os braços, olhos e bocas como "adesivos" por cima da bola.

Isso garante 100% de consistência na estrutura da bola. Você só precisará gerar a bola com as cores dos times uma vez, e depois aplicar as expressões por cima.

Cuidado com o Fundo Verde: Se você pedir para a IA gerar em fundo #00FF00, a luz verde vai refletir na textura branca e dourada da bola (o chamado color spill). Isso vai deixar o Bolinha com bordas esverdeadas na live. O ideal é pedir um fundo branco ou cinza claro e usar uma ferramenta de IA como o remove.bg para apagar o fundo com precisão.

3. Prompts Otimizados para o Nano Banana 2
Os prompts em inglês costumam ter um desempenho superior em modelos de imagem. Otimizei seus prompts para garantir o estilo 3D Pixar, evitar logos e focar nas emoções.

Prompt 1: Base / Neutro (Trionda)

A cute 3D cartoon mascot of a soccer ball, Pixar Disney animation style. The ball has NO LEGS, it floats, and has tiny white cartoon gloved hands floating beside it. Expressive large round eyes and a small friendly welcoming smile. The ball's design features 4 flowing wavy panels in Red, Blue, and Green, connected by a triangular motif, with golden embossed details. STRICTLY NO LOGOS, NO TEXT, NO BRANDS. Solid light gray background. Soft studio lighting, 8k resolution, highly detailed 3D CGI render, front 3/4 angle.

Prompt 2: Comemorando (Exemplo: São Paulo)

A cute 3D cartoon mascot of a soccer ball celebrating excitedly, Pixar Disney style. The ball has NO LEGS, it floats. Both tiny white gloved hands are raised high in the air. Mouth wide open screaming with happiness, eyes sparkling. The ball's design features wavy panels colored STRICTLY in RED, WHITE, and BLACK (tricolor), with golden embossed details. NO LOGOS, NO TEXT. Confetti floating around. Solid light gray background. High energy studio lighting, 3D CGI render.

Prompt 3: Triste (Exemplo: Genérico)

A cute 3D cartoon mascot of a soccer ball looking sad and disappointed, Pixar Disney style. The ball has NO LEGS. One tiny white gloved hand is facepalming or touching its cheek in an "oh no" gesture. Droopy sad eyes, small frown. The character looks slightly deflated. The ball's design features wavy panels in Red, Blue, and Green with golden details. NO LOGOS. Solid light gray background. Soft, slightly dim studio lighting, 3D CGI render.

Prompt 4: Pensando / Curiosidade

A cute 3D cartoon mascot of a soccer ball in a thoughtful pose, Pixar Disney style. The ball has NO LEGS. One tiny white gloved hand is resting on its chin, eyes looking up and to the side thoughtfully, one eyebrow raised, slight smirk. The ball's design features wavy panels in Red, Blue, and Green with golden details. NO LOGOS. Solid light gray background. Intellectual studio lighting, 3D CGI render.

Prompt 5: Indignado (Juiz roubou!)

A cute 3D cartoon mascot of a soccer ball looking angry and indignant but still cute, Pixar Disney style. The ball has NO LEGS. Furrowed angry eyebrows, gritted teeth, one tiny white gloved hand pointing forward accusingly. A small comedic steam cloud coming from the top. The ball's design features wavy panels in Red, Blue, and Green with golden details. NO LOGOS. Solid light gray background. Dramatic studio lighting, 3D CGI render.