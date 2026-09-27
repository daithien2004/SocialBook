#!/usr/bin/env bash
# Nhắc lại hai lỗi tốn thời gian nhất của repo này, ngay lúc lệnh sắp chạy.
#
# Chỉ chèn context (additionalContext) — KHÔNG chặn lệnh. Không dùng jq để khỏi
# phụ thuộc; grep thẳng trên JSON thô là đủ, false positive chỉ tốn một dòng nhắc.
#
# Bối cảnh: memory backend-jest-run-protocol, backend-lint-has-fix.

input=$(cat)
note=''

case "$input" in
  *jest*)
    note='JEST (repo nay): thieu --forceExit la TREO VO HAN — MongoMemoryReplSet leak khi beforeAll nem loi, jest in did-not-exit roi khong bao gio thoat. KHONG pipe output (buffer => khong hien gi, roi treo): ghi ra file roi grep file. Boc: timeout 180 npx jest --selectProjects <x> --forceExit > /tmp/jest.log 2>&1'
    ;;
esac

case "$input" in
  *'npm run lint'*)
    [ -n "$note" ] && note="$note  ||  "
    note="${note}LINT (repo nay): 'npm run lint' = eslint --fix TOAN REPO, se reformat ca file khong lien quan (da tung lam ban diff). Dung: npx eslint <cac file da doi>"
    ;;
esac

if [ -n "$note" ]; then
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"%s"}}\n' "$note"
fi

exit 0
