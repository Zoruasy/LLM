import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const vectorStoreSavePath = "./vectorstore"; // waar je vectordatabase komt te staan

const embeddings = new AzureOpenAIEmbeddings({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
});

async function createVectorStore() {
    try {
        const loader = new TextLoader("./pokemon.txt"); // <-- jouw Pokémon info bestand
        const docs = await loader.load();

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const splitDocs = await splitter.splitDocuments(docs);

        const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
        await vectorStore.save(vectorStoreSavePath);

        console.log(`Vectorstore saved at ${vectorStoreSavePath}!`);
    } catch (error) {
        console.error("Failed to create vectorstore:", error);
    }
}

createVectorStore();
