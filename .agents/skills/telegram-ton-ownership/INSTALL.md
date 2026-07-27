# telegram-ton-ownership — install notes

## Already active in this project
The skill lives at `.agents/skills/telegram-ton-ownership/SKILL.md`. opencode auto-discovers skills in this directory, so it is **already installed and usable** for this project — invoke it with the `skill` tool (`skill name: "telegram-ton-ownership"`) or by saying "enable ownership guard".

## Install elsewhere / via `npx skills add`
`npx skills add <package>` fetches skills from a GitHub repo. To make this skill installable from anywhere:

1. Push the `.agents/skills/telegram-ton-ownership/` directory to its own GitHub repo (or a monorepo sub-path), e.g. `Nimadanesh/agent-skills`.
2. Tag/publish — the skills CLI reads the repo's skill directories (each one has a `SKILL.md` with `name` + `description` frontmatter).
3. Install on any machine:
   ```bash
   npx skills add Nimadanesh/agent-skills@telegram-ton-ownership      # project-local install
   npx skills add Nimadanesh/agent-skills@telegram-ton-ownership -g  # user-global, skip prompts (-y)
   ```
4. Or scaffold a brand-new skill locally with `npx skills init telegram-ton-ownership` then drop this `SKILL.md` in.

## Verification
- Frontmatter: `name: telegram-ton-ownership`, `description` < 1024 chars (currently 399). Conforms to the [agentskills.io spec](https://agentskills.io/specification).
- Triggering conditions are baked into the `description` so agent runtimes will surface it on edits/reviews/phase-gates.
- No external deps. Pure documentation/guardrail skill.