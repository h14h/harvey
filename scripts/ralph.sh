#!/usr/bin/env bash
set -euo pipefail

owner="h14h"
project_number="3"
project_id="PVT_kwHOBzhxms4BNQag"
status_field_id="PVTSSF_lAHOBzhxms4BNQagzg8TglE"
in_progress_option_id="47fc9ee4"

# Fetch items and filter to only Todo or In Progress status
items=$(
  gh project item-list "$project_number" --owner "$owner" \
    --format json \
    --jq '.items[] | select(.status == "Todo" or .status == "In Progress") | "\(.id)\t\(.content.number)\t\(.content.title)"'
)

if [[ -z "${items}" ]]; then
  echo "No issues with status 'Todo' or 'In Progress' found for project ${project_number} owned by ${owner}." >&2
  exit 1
fi

# Format for display (hide item_id from user, show issue number and title)
display_items=$(printf '%s\n' "$items" | while IFS=$'\t' read -r item_id issue_num title; do
  printf '%s\t%s\t%s\n' "$item_id" "$issue_num" "$title"
done)

selected=""

# Count number of items
item_count=$(printf '%s\n' "$display_items" | wc -l | tr -d ' ')

if [[ "$item_count" -eq 1 ]]; then
  # Auto-select the only item
  selected="$display_items"
  issue_num=$(echo "$selected" | cut -f2)
  title=$(echo "$selected" | cut -f3)
  echo "Auto-selecting the only item: #${issue_num} ${title}" >&2
elif [[ ! -t 0 ]]; then
  selected=$(printf '%s\n' "$display_items" | head -n 1)
elif command -v fzf >/dev/null 2>&1; then
  # Show only issue number and title in fzf, but keep item_id in the data
  selected=$(printf '%s\n' "$display_items" | fzf --prompt="Issue > " --height=40% --border --with-nth=2.. --delimiter=$'\t')
else
  mapfile -t lines <<<"$display_items"
  # Create display-friendly version for select menu
  display_lines=()
  for line in "${lines[@]}"; do
    display_lines+=("$(echo "$line" | cut -f2-)")
  done
  PS3="Select issue: "
  select choice in "${display_lines[@]}"; do
    if [[ -n "${choice}" ]]; then
      # Find the matching full line with item_id
      for i in "${!display_lines[@]}"; do
        if [[ "${display_lines[$i]}" == "$choice" ]]; then
          selected="${lines[$i]}"
          break
        fi
      done
      break
    fi
    echo "Invalid selection." >&2
  done
fi

if [[ -z "${selected}" ]]; then
  echo "No issue selected." >&2
  exit 1
fi

# Parse item_id and issue_number from selection
item_id=$(echo "$selected" | cut -f1)
issue_number=$(echo "$selected" | cut -f2)

# Update status to "In Progress"
echo "Updating issue #${issue_number} status to 'In Progress'..." >&2
gh project item-edit \
  --project-id "$project_id" \
  --id "$item_id" \
  --field-id "$status_field_id" \
  --single-select-option-id "$in_progress_option_id"

while :; do
  # Check if issue is closed before running codex
  issue_state=$(gh issue view "$issue_number" --json state --jq '.state')
  if [[ "$issue_state" == "CLOSED" ]]; then
    break
  fi

  gh issue view --comments "$issue_number" --json title,body,comments --jq '.title, "", .body, (if (.comments | length) > 0 then "", "### Comments (IMPORTANT!!)", "", ((.comments[].body) | ., "") else empty end)' | cat | codex exec --dangerously-bypass-approvals-and-sandbox -
done

cat << "EOF"
          \ | / | /
        /           \
       /  (.)   (.)  \      __________________
      |       c       |    /                  \
      |    \_____/    |   <  I'm learnding!    |
       \             /     \__________________/
        \___________/
       / /   |   \ \
      (_/    |    \_)
EOF
