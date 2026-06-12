from __future__ import annotations

from sweetroll_lm.schemas import ChatMessage, ChatRole, PromptTemplate


def render_prompt(
    messages: list[ChatMessage], template: PromptTemplate
) -> tuple[str, list[str]]:
    if template == PromptTemplate.chatml:
        return _render_chatml(messages), stop_tokens_for_template(template)
    if template == PromptTemplate.llama3:
        return _render_llama3(messages), stop_tokens_for_template(template)
    if template == PromptTemplate.mistral:
        return _render_mistral(messages), stop_tokens_for_template(template)
    return _render_plain(messages), stop_tokens_for_template(template)


def stop_tokens_for_template(template: PromptTemplate) -> list[str]:
    if template == PromptTemplate.chatml:
        return ["<|im_end|>", "\n<|im_start|>user", "\nUser:", "\n###"]
    if template == PromptTemplate.llama3:
        return ["<|eot_id|>", "<|EOT|>", "\nUser:", "\n###"]
    if template == PromptTemplate.mistral:
        return ["</s>", "[INST]", "\nUser:", "\n###"]
    return ["\n### User:", "\nUser:", "\n### System:", "\n###"]


def _render_chatml(messages: list[ChatMessage]) -> str:
    parts = []
    for message in messages:
        parts.append(f"<|im_start|>{message.role.value}\n{message.content}<|im_end|>")
    parts.append("<|im_start|>assistant\n")
    return "\n".join(parts)


def _render_llama3(messages: list[ChatMessage]) -> str:
    parts = ["<|begin_of_text|>"]
    for message in messages:
        role = message.role.value
        parts.append(
            f"<|start_header_id|>{role}<|end_header_id|>\n\n"
            f"{message.content}<|eot_id|>"
        )
    parts.append("<|start_header_id|>assistant<|end_header_id|>\n\n")
    return "".join(parts)


def _render_mistral(messages: list[ChatMessage]) -> str:
    system = _first_system_message(messages)
    rendered: list[str] = []
    open_instruction = True

    for message in messages:
        if message.role == ChatRole.system:
            continue
        if message.role == ChatRole.user:
            prefix = f"{system}\n\n" if system and not rendered else ""
            rendered.append(f"<s>[INST] {prefix}{message.content} [/INST]")
            open_instruction = False
        elif message.role == ChatRole.assistant:
            rendered.append(f" {message.content}</s>")
            open_instruction = True

    if open_instruction:
        rendered.append("<s>[INST] ")
    return "".join(rendered)


def _render_plain(messages: list[ChatMessage]) -> str:
    labels = {
        ChatRole.system: "System",
        ChatRole.user: "User",
        ChatRole.assistant: "Assistant",
    }
    parts = [f"### {labels[message.role]}:\n{message.content}" for message in messages]
    parts.append("### Assistant:\n")
    return "\n\n".join(parts)


def _first_system_message(messages: list[ChatMessage]) -> str:
    for message in messages:
        if message.role == ChatRole.system:
            return message.content
    return ""
