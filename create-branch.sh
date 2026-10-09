#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

PROTECTED_BRANCHES=("main" "master" "development" "develop" "staging" "release")

# Function to check if a branch is protected
is_protected_branch() {
  local branch="$1"
  for protected in "${PROTECTED_BRANCHES[@]}"; do
    if [ "$branch" == "$protected" ]; then
      return 0
    fi
  done
  return 1
}

# Usage helper
show_usage() {
  echo "Usage:"
  echo "  Create new branch from origin/main:"
  echo "    ./create-branch.sh <new-branch-name>"
  echo ""
  echo "  Rename current branch:"
  echo "    ./create-branch.sh -m <new-branch-name>"
  echo "    ./create-branch.sh --rename <new-branch-name>"
  exit 1
}

if [ -z "$1" ]; then
  show_usage
fi

# Handle Rename Mode (-m or --rename)
if [ "$1" == "-m" ] || [ "$1" == "--rename" ]; then
  NEW_BRANCH_NAME="$2"
  if [ -z "$NEW_BRANCH_NAME" ]; then
    echo "Error: New branch name is required for rename mode."
    show_usage
  fi

  CURRENT_BRANCH=$(git branch --show-current)

  if [ -z "$CURRENT_BRANCH" ]; then
    echo "Error: Not currently on any branch (detached HEAD)."
    exit 1
  fi

  if is_protected_branch "$CURRENT_BRANCH"; then
    echo "Error: Cannot rename protected branch '$CURRENT_BRANCH'."
    exit 1
  fi

  echo "Renaming branch '$CURRENT_BRANCH' to '$NEW_BRANCH_NAME'..."
  git branch -m "$NEW_BRANCH_NAME"

  echo "Successfully renamed local branch from '$CURRENT_BRANCH' to '$NEW_BRANCH_NAME'."
  echo "Tip: If you already pushed '$CURRENT_BRANCH' to remote, run:"
  echo "  git push origin -u $NEW_BRANCH_NAME"
  echo "  git push origin --delete $CURRENT_BRANCH"
  exit 0
fi

# Create Mode (default)
BRANCH_NAME="$1"
TARGET_BASE="origin/main"

echo "Fetching latest changes from origin/main..."
git fetch origin main

echo "Creating and checking out branch '$BRANCH_NAME' from '$TARGET_BASE'..."
git checkout -b "$BRANCH_NAME" "$TARGET_BASE"

echo "Successfully created and switched to branch '$BRANCH_NAME'."
