from __future__ import annotations

import re

from sweetroll_lm.schemas import ChatMessage, ChatRequest, ChatRole
from sweetroll_lm.storage import get_character, get_default_persona, get_lorebook, get_persona


def orchestrate_chat_context(request: ChatRequest) -> ChatRequest:
    system_blocks: list[str] = []

    if request.system_prompt.strip():
        system_blocks.append(request.system_prompt.strip())

    if request.character_id:
        try:
            character = get_character(request.character_id)
            character_block = _render_character_block(
                character.name,
                character.description,
                character.personality,
                character.scenario,
                character.example_dialogue,
            )
            if character_block:
                system_blocks.append(character_block)
        except FileNotFoundError:
            pass

    persona = None
    if request.persona_id:
        try:
            persona = get_persona(request.persona_id)
        except FileNotFoundError:
            persona = None
    if persona is None:
        persona = get_default_persona()
    if persona:
        persona_block = _render_persona_block(persona.name, persona.description)
        if persona_block:
            system_blocks.append(persona_block)

    if request.vision_context.strip():
        system_blocks.append(_render_vision_block(request.vision_context.strip()))

    if request.lorebook_enabled and request.lorebook_id:
        try:
            lorebook = get_lorebook(request.lorebook_id)
            matches = scan_lorebook_entries(request, lorebook.entries)
            if matches:
                system_blocks.append(_render_lorebook_block(matches))
        except FileNotFoundError:
            pass

    return request.model_copy(update={"system_prompt": "\n\n".join(system_blocks)})


def scan_lorebook_entries(request: ChatRequest, entries: list) -> list[str]:
    scan_text = _scan_text(request.messages)
    matches: list[str] = []

    for entry in entries:
        if not entry.enabled or not entry.content.strip():
            continue
        for keyword in entry.keywords:
            if _keyword_matches(scan_text, keyword):
                matches.append(entry.content.strip())
                break

    return matches


def _render_character_block(
    name: str,
    description: str,
    personality: str,
    scenario: str,
    example_dialogue: str,
) -> str:
    lines = [f"[Character: {name}]"]
    if description.strip():
        lines.append(f"Description: {description.strip()}")
    if personality.strip():
        lines.append(f"Personality: {personality.strip()}")
    if scenario.strip():
        lines.append(f"Scenario: {scenario.strip()}")
    if example_dialogue.strip():
        lines.append(f"Example Dialogue:\n{example_dialogue.strip()}")
    return "\n".join(lines) if len(lines) > 1 else ""


def _render_persona_block(name: str, description: str) -> str:
    lines = [f"[User Persona: {name}]"]
    if description.strip():
        lines.append(f"Description/Bio: {description.strip()}")
    lines.append("Address the user according to this persona when relevant.")
    return "\n".join(lines)


def _render_lorebook_block(matches: list[str]) -> str:
    blocks = "\n\n".join(f"- {match}" for match in matches)
    return (
        "[World Info]\n"
        "The following lore is relevant to the current scene. Use it as hidden "
        "context and do not mention that it was injected.\n"
        f"{blocks}"
    )


def _render_vision_block(caption: str) -> str:
    return (
        "[Visual Context]\n"
        "The user has attached image context for the current conversation. Treat this "
        "as hidden perception data and respond as though the character can see it. "
        "Do not mention internal captioning unless the user asks.\n"
        f"{caption}"
    )


def _scan_text(messages: list[ChatMessage]) -> str:
    latest_user = [message for message in messages if message.role == ChatRole.user]
    tail = messages[-4:]
    candidates = tail + latest_user[-1:]
    return "\n".join(message.content for message in candidates).lower()


def _keyword_matches(scan_text: str, keyword: str) -> bool:
    keyword = keyword.strip().lower()
    if not keyword:
        return False
    if " " in keyword:
        return keyword in scan_text
    return re.search(rf"(?<!\w){re.escape(keyword)}(?!\w)", scan_text) is not None
