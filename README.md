 De Pokémon AI Chatbot

Een chatbot waarin je vragen kan stellen over Pokémon!  
Deze applicatie gebruikt **Azure OpenAI** via een Node.js server en een client-side frontend gebouwd in **HTML/CSS/JS**.

# Functionaliteiten

- Vraag alles over Pokémon soorten, types, evoluties en regio's!
- Chatgeschiedenis wordt opgeslagen en bijgehouden (met rollen: system, human, assistant).
- Streaming: antwoorden verschijnen woord-voor-woord.
- Markdown-ondersteuning voor mooiere weergave (kopjes, lijsten, vetgedrukte tekst).
- Embeddings van een eigen document (`pokemon.txt`) via LangChain + FAISS.
- API keys zijn beveiligd via `.env` bestand.

  ## 🛠 Installatie-instructies

1. **Clone deze repository**:

```bash
git clone https://github.com/jouwgebruikersnaam/pokemon-ai-chatbot.git
cd pokemon-ai-chatbot

Installeer dependencies:
npm install

Maak een .env bestand:

AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_API_INSTANCE_NAME=your-instance-name
AZURE_OPENAI_API_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME=your-embeddings-deployment
AZURE_OPENAI_API_VERSION=your-api-version

Maak de vectorstore aan:
node --env-file=.env makeVector.js

Start de server:
node --env-file=.env server.js

Open de client/index.html met Live Server of host samen via Vercel/Render. :)
