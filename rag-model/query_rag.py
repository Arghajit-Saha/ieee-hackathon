import os
import sys
import json
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from dotenv import load_dotenv
from openrouter import OpenRouter
import time

start = time.time()
load_dotenv("keys.env")
persistent_directory = "db/chroma_db"

def query_rag(query_text, history=[]):
    embedding_model = OllamaEmbeddings(model='nomic-embed-text:v1.5')
    db = Chroma(
        persist_directory=persistent_directory, 
        embedding_function=embedding_model, 
        collection_metadata={"hnsw:space": "cosine"}
    )
    
    retriever = db.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5}
    )

    relevant_docs = retriever.invoke(query_text)
    
    if not relevant_docs:
        return "I could not find any relevant disease profiles in the database to match those symptoms."

    combined_input = f"""You are an analytical medical assistant. The user is experiencing the following symptoms: "{query_text}"

    Below are disease profiles retrieved from our database. Each profile lists the disease name followed by its associated symptoms or features.
    
    Database Profiles:
    {chr(10).join([f"--- Profile ---{chr(10)}{doc.page_content}" for doc in relevant_docs])}

    Task:
    1. Analyze the retrieved disease profiles carefully.
    2. Compare the user's symptoms against the features of each disease profile.
    3. Identify which disease(s) are the most likely match.
    4. Provide a clear breakdown explaining why, mapping the user's symptoms to the disease's profile.
    5. Include a standard medical disclaimer at the end stating that you are an AI and they should consult a doctor.

    If none of the retrieved diseases match the user's symptoms well, state that clearly.
    """

    messages = [
        {"role": "system", "content": "You are a helpful and precise medical diagnostic assistant."}
    ]
    
    if history:
        messages.extend(history)
        messages.append({"role": "user", "content": query_text})
    else:
        messages.append({"role": "user", "content": combined_input})

    with OpenRouter(
        api_key=os.getenv("OPENROUTER_API_KEY", ""),
    ) as open_router:
        res = open_router.chat.send(
            messages=messages, 
            model="openai/gpt-4o-mini", 
            stream=False
        )
    
    return res.choices[0].message.content.strip()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            input_data = json.loads(sys.argv[1])
            query = input_data.get("query", "")
            history = input_data.get("history", [])
            result = query_rag(query, history)
            print(json.dumps({"result": result}))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    else:
        print(json.dumps({"error": "No input provided"}))
