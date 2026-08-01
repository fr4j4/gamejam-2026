# Skill Registry — gamejam-2026 (participante/gabogabucho)

> Location note: placed under `participantes/gabogabucho/.atl/` instead of the repo
> root to respect the gamejam rule "trabaja solo dentro de tu carpeta". Also kept
> OUT of `lastre/` because that folder is published verbatim to Cloudflare Pages.
> Persisted: engram (project: `gamejam`, topic_key: `skill-registry`).

## User Skills (deduplicated by name)

| Skill | Location | Trigger |
|-------|----------|---------|
| branch-pr | ~/.config/opencode/skills/branch-pr | PR creation workflow for Agent Teams Lite (issue-first enforcement) |
| customize-opencode | built-in | Editing opencode's own config (opencode.json, .opencode/, ~/.config/opencode/) |
| find-skills | ~/.agents/skills/find-skills | Discovering/installing agent skills |
| go-testing | ~/.config/opencode/skills/go-testing | Writing Go tests / teatest / Bubbletea TUI testing |
| issue-creation | ~/.config/opencode/skills/issue-creation | Creating GitHub issues (issue-first enforcement) |
| judgment-day | ~/.config/opencode/skills/judgment-day | Parallel adversarial dual-review of a target |
| orca-cli | ~/.agents/skills/orca-cli | Orca worktrees, terminals, browser, handoffs via `orca` CLI |
| orchestration | ~/.agents/skills/orchestration | Structured multi-agent coordination (DAGs, ask/reply, dispatch) |
| skill-creator | ~/.config/opencode/skills/skill-creator | Creating new agent skills (Agent Skills spec) |
| windows-admin | ~/.claude/skills/windows-admin | Windows admin via PowerShell (SSH/WSL2) |
| google-ads-analyze | ~/.claude/skills/google-ads-analyze | GAQL performance analysis of Google Ads accounts |
| google-ads-setup | ~/.claude/skills/google-ads-setup | Diagnose/configure google-ads MCP server |
| google-ads-ga4 | ~/.claude/skills/google-ads-ga4 | GA4 + Google Ads cross analysis |
| google-ads-manage | ~/.claude/skills/google-ads-manage | Safe campaign management (pause/activate/RSAs/negatives) |

## SDD Skills (excluded from registry per convention, listed for reference)

sdd-init, sdd-explore, sdd-propose, sdd-spec, sdd-design, sdd-tasks, sdd-apply,
sdd-verify, sdd-archive — located at ~/.config/opencode/skills/ (and mirrored at
~/.claude/skills/).

## Project Conventions (relevant to skill selection)

- No `AGENTS.md` / `CLAUDE.md` / `.cursorrules` at repo root or in the game folder.
- Global `~/.config/opencode/AGENTS.md` defines the Engram persistent-memory protocol (mandatory mem_save / mem_session_summary).
- `~/.gemini/GEMINI.md` carries the global `strict-tdd-mode: enabled` marker (highest-priority source).
- Stack is browser JS (Phaser 4.2.1 + Matter.js, UMD, no build) → `go-testing` (Go-specific) is NOT applicable here.
- Skills with no match to the current project (Google Ads, windows-admin, orca, orchestration) are listed for completeness only.
