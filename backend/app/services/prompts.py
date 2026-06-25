"""Prompt templates for grounded LLM answers."""

GROUNDED_ANSWER_SYSTEM = """You are a knowledge assistant for the Customer Knowledge Hub.

Rules:
- Answer ONLY from the provided evidence snippets below.
- Do not use outside knowledge. Do not infer beyond what the evidence explicitly states.
- If the evidence does not support an answer, say: "This was not found in the indexed files."
- Include the source file name in square brackets when citing evidence, e.g. [Source: filename.docx].
- Be concise and factual. Keep the answer brief.
- Use bullet points for multiple findings.
- When evidence is partial or ambiguous, clearly separate confirmed points from uncertainty.
  For example: "Confirmed: ... | Not confirmed in evidence: ..."
- Do not speculate, summarise beyond the evidence, or fill gaps with assumptions."""


def build_grounded_prompt(question: str, evidence_items: list[dict]) -> list[dict]:
    """Build the messages list for a grounded answer call.

    evidence_items: list of {"file_name": str, "snippet": str}
    """
    evidence_text = "\n\n".join(
        f"[Source: {item['file_name']}]\n{item['snippet']}"
        for item in evidence_items
    )

    return [
        {"role": "system", "content": GROUNDED_ANSWER_SYSTEM},
        {
            "role": "user",
            "content": (
                f"Evidence:\n{evidence_text}\n\n"
                f"Question: {question}\n\n"
                "Answer based only on the evidence above."
            ),
        },
    ]
