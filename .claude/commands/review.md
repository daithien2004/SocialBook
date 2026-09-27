---
description: Review uncommitted changes as a code reviewer
argument-hint: '[--staged | --branch <ref> | <path>]'
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Read, Grep, Glob
---

Act as the code reviewer defined in `.claude/agents/reviewer.md`. Review the changes
selected by `$ARGUMENTS` and report findings in that file's output format.

## 1. Determine the scope

If `$ARGUMENTS` is empty, review everything uncommitted:

```bash
git status --short
git diff
git diff --cached
```

Otherwise honor the argument:

- `--staged` → `git diff --cached` only
- `--branch <ref>` → `git diff <ref>...HEAD`
- a path → `git diff -- <path>` plus `git diff --cached -- <path>`

If the diff is empty, say so and stop — do not invent findings.

## 2. Read the changed files in full

The diff shows what moved, not what the code now means. Read each changed file
before judging it, and follow the call sites of anything whose signature changed.

## 3. Check the project invariants first

The reviewer file lists six invariants that have caused real bugs here —
pagination shape, no-`any`, Clean Architecture direction, the shared package build,
the React Query/Zustand split, and cache/queue fail-safety. Verify each one that
the diff could plausibly affect, then continue to the focus areas
(correctness, architecture, security, performance, maintainability, testing).

## 4. Consult the relevant skills

Read the skill matching the area under review — the table at the top of
`.claude/agents/reviewer.md` maps areas to files under `.claude/skills/`.
Judge the code against the project's actual conventions in those skills, not
generic advice.

## 5. Report

Use the reviewer's output format: Summary, then 🔴 Critical / 🟡 Warning /
🔵 Suggestion, then Recommendations, then the verdict. Cite `file:line`.
Rank by impact and drop nitpicks — a short honest list beats a padded one.

This is a read-only review: do not edit, stage, or commit any file.
