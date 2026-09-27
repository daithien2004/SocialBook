#!/usr/bin/env bash
# Auto-format source files with Prettier after Claude writes/edits them.
#
# Claude Code PostToolUse hook (matcher: Write|Edit).
# Reads the hook input JSON from stdin, extracts the target file path with
# node (jq is not guaranteed on this machine), and formats it with the
# workspace-hoisted Prettier. Non-formatable files (or missing node) are
# skipped silently so the hook never blocks or errors the turn.

set -u

input="$(cat 2>/dev/null)"

if ! command -v node >/dev/null 2>&1 || [ -z "$input" ]; then
  exit 0
fi

# Only emit paths Prettier can handle; guard the JSON payload defensively.
f="$(printf '%s' "$input" | node -e '
let d = "";
process.stdin.on("data", (c) => (d += c));
process.stdin.on("end", () => {
  try {
    const j = JSON.parse(d);
    const f =
      (j.tool_response && j.tool_response.filePath) ||
      (j.tool_input && j.tool_input.file_path) ||
      "";
    // Code files only — never auto-format docs (.md/.html) or user hand-authored
    // files: prettier on markdown would reflow prose and churn diffs / CLAUDE.md.
    if (f && /\.(ts|tsx|js|jsx|json|css|mjs)$/.test(f)) console.log(f);
  } catch (_) {
    /* malformed payload — ignore */
  }
});
' 2>/dev/null)"

if [ -n "$f" ] && [ -f "$f" ]; then
  npx --no-install prettier --write "$f" >/dev/null 2>&1 || true
fi

exit 0