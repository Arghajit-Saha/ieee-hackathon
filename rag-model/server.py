import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from dotenv import load_dotenv
from openrouter import OpenRouter

load_dotenv("keys.env")

app = FastAPI(title="RAG Medical Triage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load vector DB once at startup ──
persistent_directory = "db/chroma_db"
embedding_model = OllamaEmbeddings(model='nomic-embed-text:v1.5')
db = Chroma(
    persist_directory=persistent_directory,
    embedding_function=embedding_model,
    collection_metadata={"hnsw:space": "cosine"}
)

# ── Request / Response models ──
class ChatMessage(BaseModel):
    role: str
    content: str

class QueryRequest(BaseModel):
    query: str
    history: list[ChatMessage] = []

class DiseaseMatch(BaseModel):
    name: str
    matchPercentage: int
    matchedSymptoms: list[str]
    unmatchedSymptoms: list[str]
    recommendation: str

class AssessmentData(BaseModel):
    summary: str
    diseases: list[DiseaseMatch]
    disclaimer: str

class QueryResponse(BaseModel):
    result: str
    assessment: AssessmentData | None = None

# ── Main endpoint ──
@app.post("/query", response_model=QueryResponse)
async def query_rag(req: QueryRequest):
    try:
        retriever = db.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )
        # Combine recent history with query for better RAG retrieval
        user_messages = [m.content for m in req.history if m.role == 'user']
        search_context = " ".join(user_messages[-3:] + [req.query])
        relevant_docs = retriever.invoke(search_context)

        if not relevant_docs:
            return QueryResponse(
                result="I could not find any relevant disease profiles in the database to match those symptoms. Please consult a doctor for proper evaluation."
            )

        user_message_count = len([m for m in req.history if m.role == 'user'])

        # Build conversation based on whether it's first message or follow-up
        system_prompt = f"""You are Dr. Aura, an analytical and empathetic medical AI assistant.
You have access to the following relevant disease profiles from our verified medical database:
{os.linesep.join([f"- {doc.page_content}" for doc in relevant_docs])}

Task:
1. Engage in a natural, conversational triage process with the user.
2. DO NOT ask a question that you have already asked previously. Ask a maximum of ONE crisp, direct follow-up question at a time.
"""
        if user_message_count >= 3:
            system_prompt += "3. CRITICAL LIMIT: You have already asked enough questions. You MUST NOT ask any more follow-up questions. You MUST immediately synthesize the available info and populate the 'assessment' field to provide a final diagnosis.\n"
        else:
            system_prompt += "3. DO NOT immediately jump to a diagnosis if you only have 1 or 2 vague symptoms. Ask ONE concise question to form a confident medical picture.\n"

        system_prompt += """4. Once you have enough information (or reach the limit), synthesize your own medical reasoning with the RAG dataset to provide a comprehensive answer and diagnosis.
5. IF AND ONLY IF you have reached a confident conclusion and are ready to provide a diagnosis, populate the 'assessment' field with the structured data. If you are still asking follow-up questions, leave 'assessment' as null.
6. FORMATTING: Your 'result' string MUST be richly formatted using Markdown. Use **bold** text for diseases and emphasis, use bullet points (-) for listing symptoms/advice, and use double newlines (\\n\\n) to create distinct, readable paragraphs. Never output a giant wall of text.

You MUST reply ONLY with a valid JSON object matching exactly this structure:
{{
  "result": "Your response to the user (either a follow-up question, or the final descriptive diagnosis based on your reasoning and the dataset)...",
  "assessment": {{
    "summary": "Short clinical summary...",
    "diseases": [
      {{
        "name": "Disease Name",
        "matchPercentage": 85,
        "matchedSymptoms": ["..."],
        "unmatchedSymptoms": ["..."],
        "recommendation": "..."
      }}
    ],
    "disclaimer": "..."
  }} // OR null if you are still asking questions
}}"""

        if not req.history:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.query}
            ]
        else:
            messages = [
                {"role": "system", "content": system_prompt}
            ] + [{"role": m.role, "content": m.content} for m in req.history] + [{"role": "user", "content": req.query}]

        with OpenRouter(api_key=os.getenv("OPENROUTER_API_KEY", "")) as open_router:
            res = open_router.chat.send(
                messages=messages,
                model="openai/gpt-4o-mini",
                stream=False
            )

        raw_output = res.choices[0].message.content.strip()
        if raw_output.startswith("```json"):
            raw_output = raw_output.replace("```json", "").replace("```", "").strip()
        
        try:
            data = json.loads(raw_output)
            return QueryResponse(
                result=data.get("result", "I've analyzed your symptoms."),
                assessment=data.get("assessment")
            )
        except json.JSONDecodeError:
            # Fallback if LLM fails to output valid JSON
            return QueryResponse(result=raw_output)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DynamicQueryRequest(BaseModel):
    region: str
    history: list[ChatMessage] = []
    forceAssessment: bool = False

# Already defined above

class DynamicQueryResponse(BaseModel):
    isComplete: bool
    question: str | None = None
    questionType: str | None = None # 'yesno' | 'scale' | 'duration'
    assessment: AssessmentData | None = None

# ── Dynamic Endpoint ──
@app.post("/query_dynamic", response_model=DynamicQueryResponse)
async def query_dynamic(req: DynamicQueryRequest):
    try:
        # 1. Parse history to separate confirmed vs denied symptoms
        confirmed_symptoms = []
        denied_symptoms = []
        asked_duration = False
        
        # history alternates: assistant (question) -> user (answer)
        for i in range(0, len(req.history) - 1, 2):
            q_msg = req.history[i]
            a_msg = req.history[i+1]
            if q_msg.role == 'assistant' and a_msg.role == 'user':
                ans = a_msg.content.strip().lower()
                
                # Check if we asked about duration
                if "how long" in q_msg.content.lower() or "how many days" in q_msg.content.lower() or "duration" in q_msg.content.lower():
                    asked_duration = True
                    confirmed_symptoms.append(f"Duration: {a_msg.content}")
                    continue

                # Consider it confirmed if "yes" or a high number (>= 5)
                if ans == 'yes' or (ans.isdigit() and int(ans) >= 5):
                    confirmed_symptoms.append(q_msg.content)
                elif ans == 'no' or (ans.isdigit() and int(ans) < 5):
                    denied_symptoms.append(q_msg.content)

        # 2. Build the search query for RAG
        # Prioritize region + specifically confirmed symptoms to find exact matching diseases
        search_query = f"Affected region: {req.region}."
        if confirmed_symptoms:
            search_query += " Patient has confirmed experiencing: " + " ".join(confirmed_symptoms)

        # Retrieve docs based on confirmed symptoms
        retriever = db.as_retriever(search_type="similarity", search_kwargs={"k": 5})
        relevant_docs = retriever.invoke(search_query)

        # 3. Build prompt enforcing JSON output and strict filtering
        system_prompt = f"""You are an expert, analytical medical AI diagnostician.
Your goal is to assess the user's symptoms dynamically step-by-step.

Current State:
- Primary Region: {req.region}
- Confirmed Symptoms/Details: {", ".join(confirmed_symptoms) if confirmed_symptoms else "None yet"}
- Denied Symptoms: {", ".join(denied_symptoms) if denied_symptoms else "None yet"}

You have access to the following relevant disease profiles from our database (retrieved based on the confirmed symptoms):
"""
        system_prompt += "\n".join([f"- {doc.page_content}" for doc in relevant_docs])
        
        system_prompt += """
Task Rules:
1. FILTERING: Actively filter out and ignore any disease profiles that do not align with the Confirmed Symptoms, or that require the Denied Symptoms.
"""

        if not asked_duration and len(req.history) >= 2:
            system_prompt += """2. DURATION RULE: Since you have not yet asked about symptom duration, you MUST make your very next question about duration. Ask how many days they have had the symptoms, and set questionType to "duration".
"""
        else:
            system_prompt += """2. You have successfully gathered initial symptoms (and duration if applicable).
"""

        system_prompt += """3. DO NOT REPEAT QUESTIONS: You MUST review the provided Confirmed Symptoms, Denied Symptoms, and the chat history. NEVER ask about a symptom that the patient has already answered.
4. BE DIRECT AND CONCISE: When generating a question, make it as brief, direct, and simple as possible (e.g., "Do you have a sore throat?" instead of "Could you please tell me if you are currently experiencing any soreness in your throat?").\n"""

        if getattr(req, 'forceAssessment', False):
            system_prompt += """5. CRITICAL OVERRIDE: You MUST set isComplete to true and output the final JSON AssessmentData NOW based on the symptoms gathered so far. Do NOT ask any more questions. Formulate the best possible broad diagnosis.\n"""
        else:
            system_prompt += """5. If you have narrowed it down to 1-3 highly probable diseases that match the confirmed symptoms (at least 3-4 symptoms gathered), you have enough to diagnose. Set isComplete to true.
6. If there are still multiple conflicting possibilities in the database, generate the SINGLE best differentiating question to ask the user next. This question MUST help you distinguish between the remaining valid diseases.\n"""

        system_prompt += """
You MUST reply ONLY with a valid JSON object matching this schema:
{
  "isComplete": boolean, // true if you have enough info to diagnose, false if you need to ask another question
  "question": string | null, // The distinguishing question (or duration question) to ask next. Null if isComplete is true.
  "questionType": "yesno" | "scale" | "duration" | null, // The type of question layout. MUST be "duration" if asking about duration.
  "assessment": { // MUST be populated if isComplete is true. Null otherwise.
       "summary": string, // High level clinical summary of the patient's condition and triage urgency.
       "diseases": [
           {
               "name": string, // Name of the disease
               "matchPercentage": number, // Estimated probability match (0-100) based on confirmed symptoms
               "matchedSymptoms": [string], // List of symptoms they have that match this disease
               "unmatchedSymptoms": [string], // List of symptoms expected for this disease but denied by user
               "recommendation": string // Specific next steps for this potential match
           }
       ],
       "disclaimer": string // Standard medical disclaimer (e.g. consult a doctor)
  } | null
}
Do NOT wrap the output in markdown code blocks. Just output the raw JSON string.
"""

        messages = [{"role": "system", "content": system_prompt}]

        # Ask the LLM
        with OpenRouter(api_key=os.getenv("OPENROUTER_API_KEY", "")) as open_router:
            res = open_router.chat.send(
                messages=messages,
                model="openai/gpt-4o-mini",
                stream=False
            )
        
        raw_output = res.choices[0].message.content.strip()
        
        # Clean markdown if accidentally included
        if raw_output.startswith("```json"):
            raw_output = raw_output[7:]
        if raw_output.startswith("```"):
            raw_output = raw_output[3:]
        if raw_output.endswith("```"):
            raw_output = raw_output[:-3]
        raw_output = raw_output.strip()

        import json
        try:
            parsed = json.loads(raw_output)
            return DynamicQueryResponse(
                isComplete=parsed.get("isComplete", False),
                question=parsed.get("question"),
                questionType=parsed.get("questionType", "yesno"),
                assessment=parsed.get("assessment")
            )
        except json.JSONDecodeError:
            # Fallback if AI fails JSON format
            return DynamicQueryResponse(
                isComplete=True,
                assessment=AssessmentData(
                    summary="The AI encountered an error evaluating your symptoms. Please consult a doctor for a proper evaluation.",
                    diseases=[],
                    disclaimer="Please consult a doctor for proper medical evaluation."
                )
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "model": "nomic-embed-text:v1.5", "db": persistent_directory}
