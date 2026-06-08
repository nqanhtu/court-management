# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes.

These instructions apply to all tasks unless explicitly overridden by repository-specific requirements.

**Tradeoff:** These guidelines prioritize correctness, clarity, and minimal changes over implementation speed. For trivial tasks, use reasonable judgment.

---

# 1. Think Before Coding

Do not assume requirements.

Before implementing:

- State assumptions explicitly.
- If requirements are ambiguous, ask clarifying questions.
- If multiple interpretations exist, present the alternatives instead of silently choosing one.
- Surface important tradeoffs.
- If a simpler solution exists, propose it.
- If something is unclear, stop and explain what is unclear before proceeding.

Guiding principle:

> Clarification before implementation is preferable to correction after implementation.

---

# 2. Simplicity First

Implement the smallest solution that fully satisfies the request.

Rules:

- Do not add features that were not requested.
- Do not introduce abstractions for single-use code.
- Do not add configurability unless explicitly required.
- Do not implement speculative future requirements.
- Do not add error handling for impossible scenarios.
- Prefer straightforward code over clever code.

Before finalizing, ask:

> Would a senior engineer consider this unnecessarily complex?

If yes, simplify.

---

# 3. Surgical Changes

Modify only what is required for the task.

When editing existing code:

- Do not refactor unrelated code.
- Do not modify unrelated comments.
- Do not reformat unrelated files.
- Follow the existing code style of the repository.
- If unrelated issues are discovered, mention them separately rather than fixing them.

Cleanup rules:

- Remove imports, variables, functions, or files made unused by your own changes.
- Do not remove pre-existing dead code unless explicitly requested.

Validation rule:

> Every modified line should directly support the requested outcome.

---

# 4. Goal-Driven Execution

Convert requests into verifiable outcomes.

Examples:

- "Fix a bug"
  - Reproduce the bug.
  - Implement the fix.
  - Verify the bug no longer occurs.

- "Add validation"
  - Add tests covering invalid inputs.
  - Implement validation.
  - Verify tests pass.

- "Refactor"
  - Establish baseline behavior.
  - Refactor.
  - Verify behavior remains unchanged.

For multi-step tasks, provide a concise plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Verification should be objective whenever possible.

Avoid vague success criteria such as:

- "looks correct"
- "should work"
- "seems fixed"

Prefer:

- tests pass
- build succeeds
- lint passes
- reproduction no longer fails
- expected output matches requirements

---

# 5. Communication Style

When working on tasks:

- Be concise.
- Be explicit about assumptions.
- Explain reasoning only when useful.
- Highlight risks and tradeoffs.
- Prefer facts over speculation.

If confidence is low:

- Say so.
- Explain why.
- Ask for clarification.

Never pretend certainty when uncertainty exists.

---

# Success Criteria

These instructions are working when:

- Diffs remain small and focused.
- Clarifying questions happen before implementation.
- Solutions are simpler rather than more abstract.
- Unrequested changes are minimized.
- Verification is performed before declaring success.

# Project Rules

## TypeScript

- Never use `any`.
- Prefer `unknown` over `any`.
- Enable strict typing.

## Code Quality

- Run lint before completion.
- Run type checking before completion.
- Do not leave unused imports.

## Architecture

- Keep business logic outside UI components.
- Prefer composition over inheritance.
