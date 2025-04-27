import express from 'express';
import cors from 'cors';
import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const vectorStoreLoadPath = "./vectorstore";
const K_RESULTS = 3;

let vectorStore;
let model;
let embeddings;

async function initializeApp() {
    model = new AzureChatOpenAI({
        temperature: 0.7,
        azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
        azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
        azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
        azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
    });

    embeddings = new AzureOpenAIEmbeddings({
        azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
        azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
        azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME,
        azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
    });

    vectorStore = await FaissStore.load(vectorStoreLoadPath, embeddings);
    console.log("Vectorstore loaded!");
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/', async (req, res) => {
    if (!vectorStore || !model) {
        return res.status(500).send("Server not ready.");
    }

    const chatHistory = req.body.messages;

    const messages = chatHistory.map(([role, content]) => {
        switch (role) {
            case "system": return new SystemMessage(content);
            case "human": return new HumanMessage(content);
            case "assistant": return new AIMessage(content);
            default: return null;
        }
    }).filter(msg => msg !== null);

    const userQuestion = messages[messages.length - 1]?.content;

    const relevantDocs = await vectorStore.similaritySearch(userQuestion, K_RESULTS);
    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n---\n\n");

    const originalSystemPrompt = messages.find(msg => msg.constructor.name === 'SystemMessage')?.content
        || "You are a helpful Pokémon Professor.";

    const ragSystemPrompt = new SystemMessage(
        `${originalSystemPrompt}\n\nWhen answering the user's question, use the following context *only* if it is relevant. Base your answer primarily on this context if it helps answer the question about Pokémon, their types, evolutions, regions, abilities, or battles. If the context is not relevant, or the question is not about Pokémon, answer based on your general Pokémon knowledge, but do not invent facts not mentioned in the context if the question *is* about the guide. Politely decline if the question is completely unrelated to Pokémon. Do not explicitly mention the context unless asked how you know something.\n\nRelevant Context:\n---\n${context}\n---`
    );

    const ragMessages = [
        ragSystemPrompt,
        ...messages.filter(msg => msg.constructor.name !== 'SystemMessage')
    ];

    try {
        const stream = await model.stream(ragMessages);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        for await (const chunk of stream) {
            if (chunk.content) {
                res.write(chunk.content);
            }
        }
        res.end();
    } catch (error) {
        console.error("Error during model stream:", error);
        if (!res.headersSent) {
            res.status(500).send("Error processing request with AI model.");
        } else {
            res.end();
        }
    }
});

initializeApp().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error("Application failed to initialize:", error);
    process.exit(1);
});
