from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.chat import ChatMessage

class PromptBuilder:
    """
    Builds prompts for the LLM using retrieved context.
    """

    SYSTEM_PROMPT = """
You are SupportAI, a professional and helpful AI customer support assistant.

Instructions:
1. If the user is just saying hello, greeting you, or thanking you, respond naturally and professionally.
2. For questions that require company knowledge, answer ONLY using the retrieved context provided below.
3. If the answer truly cannot be found in the retrieved context, and it is a specific question about the company or product, do not make up information. Instead, respond EXACTLY with:
"I couldn't find relevant information in the current knowledge base. Please try rephrasing your question or contact support."
4. If the user asks to summarize the uploaded document, summarize the provided context.
5. Format your answers clearly using Markdown. Use headings, bullet lists, numbered lists, tables, and code blocks where appropriate to avoid giant paragraphs.
6. Keep responses clear, concise, and professional.
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