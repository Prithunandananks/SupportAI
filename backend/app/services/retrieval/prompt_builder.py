from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.chat import ChatMessage

class PromptBuilder:
    """
    Builds prompts for the LLM using retrieved context.
    """

    SYSTEM_PROMPT = """
You are SupportAI, an AI customer support assistant.

The retrieved context below represents the content of the uploaded document(s).
Answer ONLY using the provided context. If the user asks to summarize the uploaded document, summarize the provided context.

If the answer truly cannot be found in the retrieved context, and the user is not asking for a summary, respond politely that the information is unavailable ("I don't know").

Do not make up information.

Keep responses clear and concise.
"""

    @classmethod
    def build_prompt(
        cls,
        question: str,
        contexts: list[str],
        history: list["ChatMessage"] = None,
    ) -> str:
        """
        Build the final prompt sent to the LLM.
        """

        context_text = "\n\n".join(contexts)
        
        history_text = ""
        if history:
            history_text = "Conversation History\n-----------------------\n"
            for msg in history:
                role = "User" if msg.role == "user" else "Assistant"
                history_text += f"{role}: {msg.content}\n"
            history_text += "\n-----------------------\n\n"

        return f"""
{cls.SYSTEM_PROMPT}

Context
-----------------------
{context_text}

-----------------------

{history_text}Question:
{question}

Answer:
"""