# Tastir: starter folder

This folder is everything Claude Code needs to start the project. Open it in Claude Code and paste the prompt below.

## What is here

| File | Purpose |
| --- | --- |
| `CLAUDE.md` | Project rules and how to work; Claude Code reads it automatically |
| `docs/PRD.md` | The product requirements |
| `docs/TASKS.md` | Phase 0 as eight tasks, each with an acceptance test |
| `docs/tutorial-format.md` | The tutorial JSON format, v0 |
| `tutorials/eight-fold-star-and-cross.json` | The first tutorial, with golden values already checked |
| `docs/geometry-notes.md` | Lessons from the prototype and research on two harder patterns |
| `docs/prototype/` | The working Zellige Studio prototype and a guide to what to port |
| `docs/research/` | Reference photo and construction drawings (private, never shipped) |

## Before you start

Have Node 20 or newer, pnpm and git installed. If you want Claude Code to create the GitHub repo, install the GitHub CLI and run `gh auth login` first; otherwise create an empty private repo yourself and give it the URL.

## The first prompt

```
Read CLAUDE.md, then docs/PRD.md, docs/TASKS.md, docs/tutorial-format.md and docs/geometry-notes.md.

Then do task 0.1 from docs/TASKS.md, and only that task. Keep every existing file in this folder where it is.

Before you run anything, tell me your plan for 0.1 in a few connected sentences and wait for my OK. When the task is done, show me the output of the test and lint commands, tick the box in docs/TASKS.md, and commit.
```

## Every prompt after that

```
Do task 0.N from docs/TASKS.md, and only that task. Plan first and wait for my OK.
```

Start a fresh session for each task, so each one begins from the files and not from an old conversation.
