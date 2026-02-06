#!/bin/bash
cd /c/Users/Anushka/OneDrive/Desktop/Fullstack

# Remove old git directory
rm -rf .git

# Initialize fresh repo
git init
git config user.name "Anushka"
git config user.email "anushka@gmail.com"

# Add all files
git add .

# Commit
git commit -m "Complete IDP Platform - Ready for deployment"

# Set main branch
git branch -M main

# Add remote
git remote add origin https://github.com/Anushka157-cha/Internal-Developer-platform.git

# Push with force
git push -u origin main --force

echo "✅ Push complete!"
