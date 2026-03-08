import os
import pandas as pd
from langchain_core.documents import Document
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from dotenv import load_dotenv

load_dotenv()


def load_documents(docs_path="docs"):
    print(f"Loading documents from {docs_path}...")

    if not os.path.exists(docs_path):
        raise FileNotFoundError(f"The directory {docs_path} does not exist. Please create it and add your files.")
    
    # We will accumulate symptoms across all datasets
    # Mapping constraint: Disease Name -> Set of Symptoms
    disease_profiles = {}
    
    for filename in os.listdir(docs_path):
        if filename.endswith('.csv'):
            file_path = os.path.join(docs_path, filename)
            print(f"Processing {file_path}...")
            
            try:
                # Try UTF-8 first
                df = pd.read_csv(file_path, low_memory=False)
            except UnicodeDecodeError:
                # Fallback to Latin-1 for datasets like training.csv
                try:
                    df = pd.read_csv(file_path, low_memory=False, encoding='latin-1')
                except Exception as e:
                    print(f"  Error reading {file_path} with latin-1: {e}")
                    continue
            except Exception as e:
                print(f"  Error reading {file_path}: {e}")
                continue

            # Detect the disease column name dynamically
            disease_col = None
            possible_names = ['diseases', 'Prognosis', 'disease', 'Disease', 'prognosis']
            for col in possible_names:
                if col in df.columns:
                    disease_col = col
                    break
            
            if not disease_col:
                print(f"  Warning: No recognizable disease column found in {filename}. Skipping.")
                continue

            # Group by disease and aggregate symptoms (max will find any '1')
            print(f"  Aggregating symptoms from {len(df[disease_col].unique())} unique diseases in {filename}...")
            grouped = df.groupby(disease_col).max()
            
            for disease, row in grouped.iterrows():
                disease_name = str(disease).strip()
                if not disease_name or disease_name.lower() == 'nan':
                    continue
                
                if disease_name not in disease_profiles:
                    disease_profiles[disease_name] = set()
                
                for col in grouped.columns:
                    val = row[col]
                    # If it's a '1', it's a symptom
                    if str(val) == '1' or val == 1:
                        disease_profiles[disease_name].add(col.strip())

    # Form document strings
    all_documents = []
    for disease_name, sys_set in disease_profiles.items():
        if not sys_set:
            continue
        
        content_lines = [f"Disease: {disease_name}", "Symptoms: " + ", ".join(sorted(sys_set))]
        page_content = "\n".join(content_lines)
        
        doc = Document(
            page_content=page_content,
            metadata={"source": disease_name}
        )
        all_documents.append(doc)

    if len(all_documents) == 0:
        raise FileNotFoundError(f"No valid data found in .csv files in {docs_path}. Please add your documents.")

    print(f"\nLoaded {len(all_documents)} aggregated global disease profiles.")
    
    # Preview
    for i, doc in enumerate(all_documents[:2]):
        print(f"\nDocument {i+1}:")
        print(f"  Source: {doc.metadata['source']}")
        print(f"  Content Preview: {doc.page_content[:200]}...")

    return all_documents


def split_documents(documents, chunk_size=2000, chunk_overlap=150):
    print("\nSplitting documents into chunks...")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )

    chunks = text_splitter.split_documents(documents)

    if chunks:
        for i, chunk in enumerate(chunks[:2]):
            print(f"\n--- Chunk {i+1} ---")
            print(f"Source: {chunk.metadata['source']}")
            print(chunk.page_content[:150] + "...")

    return chunks


def create_vector_store(chunks, persist_directory="db/chroma_db"):
    print("\nCreating embeddings and storing in ChromaDB...")

    # Clear old DB
    if os.path.exists(persist_directory):
        import shutil
        shutil.rmtree(persist_directory)
        print("Cleared old vector store.")

    embedding_model = OllamaEmbeddings(model='nomic-embed-text:v1.5')

    print("----- Creating Vector Store (Batching to save memory) -----")
    
    # Batch size of 40000 to prevent SQLite limits
    batch_size = 40000 
    vectorstore = None
    
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:min(i + batch_size, len(chunks))]
        print(f"  Indexing batch {i//batch_size + 1} ({len(batch)} chunks)...")
        
        if vectorstore is None:
            vectorstore = Chroma.from_documents(
                documents=batch,
                embedding=embedding_model,
                persist_directory=persist_directory,
                collection_metadata={"hnsw:space" : "cosine"}
            )
        else:
            vectorstore.add_documents(batch)
            
    print("----- Finished creating vector store -----")
    
    print(f"Vector store created and saved to {persist_directory}")
    return vectorstore


def main():
    print("Starting ingestion...")

    # 1. Loading the Documents
    # Flexible column name to handle both sets
    documents = load_documents(docs_path="docs")

    # 2. Chunking the Documents
    chunks = split_documents(documents)

    # 3. Embedding and storing in Vector DB
    vectorstore = create_vector_store(chunks)

    print("Ingestion complete!")


if __name__ == "__main__":
    main()