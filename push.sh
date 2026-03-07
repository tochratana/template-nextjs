#!/bin/bash

# Default commit message if none is provided
COMMIT_MSG=${1:-"Auto-commit: update configurations and code"}

echo "Status of the repository before adding:"
git status

echo "Adding all changes..."
git add .

echo "Committing with message: '$COMMIT_MSG'"
git commit -m "$COMMIT_MSG"

echo "Pushing changes to GitHub..."
git push

echo "Successfully pushed! The CI/CD Pipeline should start shortly."
