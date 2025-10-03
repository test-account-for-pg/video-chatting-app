# GitHub Workflows

This directory contains GitHub Actions workflows for the video chat demo project.

## Workflows

### 1. Prettier Check (`prettier-check.yml`)
- **Triggers**: Every push and pull request to main/develop/master branches
- **Purpose**: Ensures all code follows Prettier formatting standards
- **Action**: Fails the build if code is not properly formatted

### 2. Vercel Deployment (`vercel-deploy.yml`)
- **Triggers**: Only pushes to main/master branches and version tags
- **Purpose**: Automatically deploys to Vercel for production releases
- **Prerequisites**: Requires Vercel secrets to be configured

## Required GitHub Secrets

To enable Vercel deployment, you need to add the following secrets to your GitHub repository:

1. Go to your repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add the following repository secrets:

### Vercel Secrets
- `VERCEL_TOKEN`: Your Vercel API token
- `ORG_ID`: Your Vercel organization ID
- `PROJECT_ID`: Your Vercel project ID
- `VERCEL_SCOPE`: Your Vercel scope (usually your username or team name)

### How to get Vercel secrets:
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel login` and authenticate
3. Run `vercel link` in your project directory
4. Check `.vercel/project.json` for `orgId` and `projectId`
5. Get your token from [Vercel Dashboard](https://vercel.com/account/tokens)

## Local Development

### Formatting Code
```bash
# Format all files
npm run format

# Check if files are formatted correctly
npm run format:check

# Check formatting and show success message
npm run lint:format
```

### Pre-commit Hook (Optional)
You can set up a pre-commit hook to automatically format code before commits:

```bash
# Install husky and lint-staged
npm install --save-dev husky lint-staged

# Add to package.json
"lint-staged": {
  "*.{js,jsx,ts,tsx,json,css,md}": [
    "prettier --write"
  ]
}

# Set up pre-commit hook
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```
