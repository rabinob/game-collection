#!/bin/bash

echo "🎮 Game Collection Deployment Script"
echo "======================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Run 'git init' first."
    exit 1
fi

# Add all changes
echo "📝 Adding changes to git..."
git add .

# Ask for commit message
echo "💬 Enter commit message (or press Enter for default):"
read commit_message

if [ -z "$commit_message" ]; then
    commit_message="Update game collection"
fi

# Commit changes
echo "💾 Committing changes..."
git commit -m "$commit_message"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your game will be available at:"
echo "   GitHub Pages: https://USERNAME.github.io/REPO_NAME"
echo "   (Replace USERNAME and REPO_NAME with your actual values)"
echo ""
echo "📝 Don't forget to:"
echo "   1. Enable GitHub Pages in repository settings"
echo "   2. Wait 1-2 minutes for deployment to complete" 