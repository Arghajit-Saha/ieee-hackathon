import os
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from dotenv import load_dotenv
from openrouter import OpenRouter

load_dotenv("keys.env")

persistent_directory = "db/chroma_db"

# Loading Text Embedding Model
embedding_model = OllamaEmbeddings(model='nomic-embed-text:v1.5')

# Loading Vector Store
db = Chroma(
    persist_directory=persistent_directory, 
    embedding_function=embedding_model, 
    collection_metadata={"hnsw:space": "cosine"}
)

chat_history = []

def ask_question(query):
    # --- FIRST INTERACTION: SYMPTOM DIAGNOSIS & RAG ---
    if not chat_history:
        print("\nAnalyzing symptoms and searching database...")
        
        retriever = db.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )

        relevant_docs = retriever.invoke(query)

        if not relevant_docs:
            print("\nAnswer:\nI could not find any relevant disease profiles in the database to match those symptoms.")
            return

        combined_input = f"""You are an analytical medical assistant. The user is experiencing the following symptoms: "{query}"

        Below are disease profiles retrieved from our database. Each profile lists symptoms as either 'yes' or 'no'.
        
        Database Profiles:
        {chr(10).join([f"- {doc.page_content}" for doc in relevant_docs])}

        Task:
        1. Analyze the retrieved disease profiles. ONLY consider symptoms marked as 'yes' for a given disease.
        2. Compare the user's symptoms against the 'yes' symptoms of each disease.
        3. Identify which disease(s) are the most likely match.
        4. Provide a clear breakdown explaining why, mapping the user's symptoms to the disease's 'yes' symptoms.
        5. Include a standard medical disclaimer at the end stating that you are an AI and they should consult a doctor.

        If none of the retrieved diseases have 'yes' for the user's symptoms, state that you cannot determine a match based on the database.
        """

        messages = [
            {"role": "system", "content": "You are a helpful and precise medical diagnostic assistant."},
            {"role": "user", "content": combined_input}
        ]

        with OpenRouter(
            api_key=os.getenv("OPENROUTER_API_KEY", ""),
        ) as open_router:
            res = open_router.chat.send(
                messages=messages, 
                model="openai/gpt-4o-mini", 
                stream=False
            )
        
        answer = res.choices[0].message.content.strip()
        print(f"\nDiagnosis:\n{answer}")

        # Append the raw query (not the massive prompt) to keep the history clean for follow-ups
        chat_history.append({"role": "user", "content": query})
        chat_history.append({"role": "assistant", "content": answer})

    # --- SUBSEQUENT INTERACTIONS: CONVERSATIONAL CHAT ---
    else:
        # We pass the chat history to the LLM so it remembers the diagnosis it just gave you
        messages = [
            {"role": "system", "content": "You are a helpful medical AI assistant. You previously suggested potential diseases based on the user's symptoms. Answer their follow-up questions thoughtfully based on the ongoing conversation context. Always maintain a supportive tone and remind them to consult a doctor for formal medical advice."}
        ] + chat_history + [{"role": "user", "content": query}]

        with OpenRouter(
            api_key=os.getenv("OPENROUTER_API_KEY", ""),
        ) as open_router:
            res = open_router.chat.send(
                messages=messages, 
                model="openai/gpt-4o-mini", 
                stream=False
            )
        
        answer = res.choices[0].message.content.strip()
        print(f"\nAI:\n{answer}")

        # Append to chat history to keep the conversation rolling
        chat_history.append({"role": "user", "content": query})
        chat_history.append({"role": "assistant", "content": answer})


def start_chat():
    print("Symptom Checker initialized. Type 'quit' to exit.")
    
    while True:
        # Change the input prompt based on whether it is the first question or a follow-up
        if not chat_history:
            question = input("\nPlease list your symptoms: ")
        else:
            question = input("\nYour follow-up question: ")
        
        if question.lower() == 'quit':
            print("Goodbye!")
            break
            
        ask_question(question)

if __name__ == "__main__":
    start_chat()