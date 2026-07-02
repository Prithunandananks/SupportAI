class PromptBuilder:
    """
    Builds prompts for the LLM using retrieved context.
    """

    SYSTEM_PROMPT = """
You are SupportAI, an AI customer support assistant.

Answer ONLY using the provided context.

If the answer is not contained in the context,
respond politely that the information is unavailable.

Do not make up information.

Keep responses clear and concise.
"""

    @classmethod
    def build_prompt(
        cls,
        question: str,
        contexts: list[str],
    ) -> str:
        """
        Build the final prompt sent to the LLM.
        """

        context_text = "\n\n".join(contexts)

        return f"""
{cls.SYSTEM_PROMPT}

Context
-----------------------
{context_text}

-----------------------

Question:
{question}

Answer:
"""