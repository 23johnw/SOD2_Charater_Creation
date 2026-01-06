# PowerShell script to set up GitHub repository
Write-Host "SOD2 Character Generator - GitHub Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Host "✓ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is not installed. Please install Git first." -ForegroundColor Red
    Write-Host "  Download from: https://git-scm.com/downloads" -ForegroundColor Yellow
    exit 1
}

# Check if already a git repository
if (Test-Path ".git") {
    Write-Host "✓ Git repository already initialized" -ForegroundColor Green
} else {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Repository initialized" -ForegroundColor Green
}

# Add all files
Write-Host ""
Write-Host "Adding files to git..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "Committing files..." -ForegroundColor Yellow
    git commit -m "Initial commit: SOD2 Character Generator"
    Write-Host "✓ Files committed" -ForegroundColor Green
} else {
    Write-Host "✓ No changes to commit" -ForegroundColor Green
}

# Ask for GitHub repository URL
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Create a new repository on GitHub (or use existing one)" -ForegroundColor White
Write-Host "2. Copy the repository URL (e.g., https://github.com/YOUR_USERNAME/sod2-character-generator.git)" -ForegroundColor White
Write-Host "3. Run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "   git branch -M main" -ForegroundColor Yellow
Write-Host "   git remote add origin YOUR_REPO_URL" -ForegroundColor Yellow
Write-Host "   git push -u origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "Or if you already have a remote:" -ForegroundColor Cyan
Write-Host "   git remote set-url origin YOUR_REPO_URL" -ForegroundColor Yellow
Write-Host "   git push -u origin main" -ForegroundColor Yellow
Write-Host ""

$repoUrl = Read-Host "Enter your GitHub repository URL (or press Enter to skip)"
if ($repoUrl) {
    Write-Host ""
    Write-Host "Setting up remote and pushing..." -ForegroundColor Yellow
    
    # Check if remote already exists
    $remote = git remote get-url origin 2>$null
    if ($remote) {
        Write-Host "Remote 'origin' already exists. Updating URL..." -ForegroundColor Yellow
        git remote set-url origin $repoUrl
    } else {
        git remote add origin $repoUrl
    }
    
    # Set branch to main
    git branch -M main 2>$null
    
    # Push
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "To enable GitHub Pages:" -ForegroundColor Cyan
        Write-Host "1. Go to your repository on GitHub" -ForegroundColor White
        Write-Host "2. Click Settings → Pages" -ForegroundColor White
        Write-Host "3. Select branch 'main' as source" -ForegroundColor White
        Write-Host "4. Your site will be live at: https://YOUR_USERNAME.github.io/sod2-character-generator/" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "⚠ Push failed. You may need to:" -ForegroundColor Yellow
        Write-Host "  - Create the repository on GitHub first" -ForegroundColor White
        Write-Host "  - Authenticate with GitHub (use GitHub CLI or SSH keys)" -ForegroundColor White
    }
}

