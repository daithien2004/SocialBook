---
name: explain-file-by-evolution
description: Recipe for explaining a source file by rebuilding it step by step — read the file and every related file first, start from the simplest working version of that file, show what is wrong or missing in it, add the next part of the real file with the reason, and repeat until the actual file is reached, reviewing the code quality at each version and showing how the file links to its neighbours. Read-only, it explains and never edits or runs anything. Use it whenever the user asks to explain, walk through, understand or onboard to a file, component, module or function, "giải thích file này", "file này làm gì", "đọc hiểu code", "tại sao viết như vậy", even if they only give a file path.
---

# Explain a file by its evolution

The user gives a file. Read it and what surrounds it, then explain it by **growing it**: a minimal v0 of that same file, why v0 is not enough, v1 with the next real part added and why, and so on until the version equals the real file. The reader learns why each part of the file exists, not only what it does. While growing it, also judge whether the code at each stage is good.

## Vocabulary

- **Target file**: the file the user named.
- **Related files**: whatever determines the target's behaviour: files it imports, files that import or call it, shared types and constants, config, tests, and version files (`package.json`, lockfile).
- **Version (vN)**: the target file reduced to a subset of its real code that still works on its own. The last version is the file exactly as it is.
- **Gap**: something v(n) lacks that makes it wrong or insufficient. It is fixed by a later version.
- **Flaw**: something in the real code that is not good and stays in the final file. It is reported, not "fixed later".
- **Link**: how the target connects to a related file (who calls whom, what crosses the boundary, what breaks if it changes).

## Process

1. **Read everything first.** Read the target in full, then the related files, then search the codebase for who uses the target. Do not start explaining until this is done. If a related file cannot be found or read, say which one and what that limits.
2. **State the purpose** of the file in one or two sentences, and name the closest neighbours (who calls it, what it depends on).
3. **Plan the versions from the real code.** Split the file into parts (imports, types, constants, helpers, main logic, edge cases, error handling, exports). Order them by dependency and by the pain they remove, not by line order. Every piece of the real file lands in exactly one version; nothing is invented that the file does not contain.
4. **Write v0.** The smallest piece of the real file that works on the happy path, as real code. Say what it does and run one concrete input through it.
5. **Show what is wrong or missing.** A concrete input or situation (empty value, second caller, failure, wrong type, concurrency, bad user input) that makes v(n) wrong or insufficient, and its consequence. Name the gap in one sentence.
6. **Write v(n+1).** Add the next real part of the file that closes exactly that gap. Mark the new lines. Explain what it does, why it has this form, and what it costs. Bring in a related file at the version that first needs it, with a summary of only the relevant part and the link.
7. **Review the code at this version.** Look at what the file contains so far and say if anything is not good: naming, duplication, wrong abstraction, missing validation, error handling, coupling, performance, security, API misuse. For each point say whether it is a *gap* (a later version fixes it) or a *flaw* (it stays in the real file). Explain why it is a problem and what would be better.
8. **Repeat steps 5 to 7** until the version is the real file.
9. **Finish with** the full file's responsibilities and links, the recap table, and the list of remaining flaws with suggested improvements written out in the reply.

## Template

```
## Files read
<target, related files read, anything not found>

## Purpose
<what the file is for, who calls it, what it depends on>

## v0 — <plain name>
<real code excerpt>
<what it does, one input run through it>
**Gap:** <trigger> → <consequence>.
**Code review at v0:** <flaws or gaps in this code, each labelled gap or flaw, with why and a better way>

## v1 — <what is added>
**Added:** <part> — <responsibility>. **Why:** <the gap it closes>. **Cost:** <trade-off>.
<code excerpt, new lines marked>
**Link:** <related file, who calls whom, what crosses>
**Gap:** ...
**Code review at v1:** ...

... (repeat)

## Final file
<how all parts fit; the order they run at runtime>
| Part | Responsibility | Talks to | Contract | If removed |
|---|---|---|---|---|

## Recap
| Version | Gap | Added | Review notes |
|---|---|---|---|

## Remaining flaws
| # | Flaw | Why it matters | Suggested change | Severity |
|---|---|---|---|---|
```

## Rules

- Read-only. Do not edit, create or delete files and do not run builds, tests or scripts. Show suggested changes as code blocks in the reply; if asked to apply them, say this skill only explains and offer a separate step.
- Read the target and the related files fully before the first sentence of explanation. Never explain from the file name or from what similar files usually contain.
- Versions are built from the real code: v0 and every later version are subsets of the actual file, and the last version matches it. Do not show invented code and call it the file.
- Start at the basic version every time, even for a small or familiar file; adjust the speed, not the order.
- Every part of the file appears once, with its reason. If a part has no reason (dead code, unused import, leftover), say so instead of inventing one.
- Every "not good" is demonstrated with a trigger and a consequence, not asserted.
- Keep gaps and flaws apart. A gap is normal in an early version; a flaw is a judgement about the real file and goes in the final list.
- When a code-quality claim depends on documented behaviour (API semantics, deprecations, security guidance), check it against the official source and cite it; if it cannot be verified, label it as an opinion.
- Say what is inferred rather than read (for example, why a decision was made); the code shows what, not always why.
- Explain links, not only code: for each related file, who calls whom and what crosses the boundary.
- Aim for three to six versions. A long file is explained in sections, each section evolving separately, then joined.
- Reply in the user's language; keep identifiers and code as they are.

## Mini example (one step)

> **v0** — `getUser(id)` returns `db.users.find(id)`. Works for an existing id.
> **Gap:** for an unknown id it returns `undefined` and the caller crashes on `user.name`. Pain: the missing-user case is unhandled.
> **Code review at v0:** the name `find` hides that it can return nothing — a *gap*, fixed next.
> **v1** — adds `if (!user) throw new NotFoundError(id)`. **Why:** callers get a clear failure instead of a crash later. **Cost:** callers must now handle the error. **Link:** `routes/users.ts` maps `NotFoundError` to HTTP 404.

## Protections that must stay

Reading the target and related files before explaining, versions built from the real code ending at the real file, a gap and a code review at each step, the link to related files, and the final flaw list. Dropping any needs the user's explicit request.

## Test it

- Concatenate all additions: does the result equal the real file, with nothing missing and nothing extra?
- Cover the version titles: can the reader predict the next gap from the previous version?
- Check that every related file mentioned was actually read, and every link stated is visible in the code.

## Review checklist

- [ ] Target and all related files read in full; "Files read" lists them
- [ ] Purpose and neighbours stated before v0
- [ ] v0 is real code from the file and works on the happy path
- [ ] Each version adds real code, marks it, and says why and at what cost
- [ ] Each transition shows a concrete trigger and consequence
- [ ] Code review at every version, gaps and flaws labelled apart
- [ ] Links to related files explained where they first matter
- [ ] The last version equals the real file
- [ ] Final table, recap table and remaining flaws included
- [ ] Nothing edited or executed; suggestions only in the reply
- [ ] Written in the user's language
