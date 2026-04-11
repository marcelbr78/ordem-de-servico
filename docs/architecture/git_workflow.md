# Git Branch Protection & Workflow Rules

To ensure a stable and reliable codebase, strictly adhere to the following Git workflow methodologies. The `main` branch is protected and receives changes only through peer-reviewed pull requests.

## Branch Conventions

1. **`main`**: The production-ready branch. **Never** commit directly or push directly to this branch.
2. **`develop`**: The integration branch. All feature branches are merged here first before a release is prepped for `main`.
3. **`feature/*`**: Used for all new feature implementations (e.g., `feature/admin-panel`). Branched off of `develop`.

## Repository Rules

Local git hooks (`pre-commit` and `pre-push`) have been configured in `.git/hooks` to prevent accidental direct pushes and commits to the `main` branch.

In addition, the remote repository (GitHub/GitLab) should be configured with the following Branch Protection Rules for `main`:

* **Require pull request reviews before merging**: Ensures at least one approved review before code merges into `main`.
* **Require branch to be up to date before merging**: Ensures linear history or passing CI/CD.
* **Do not allow bypassing the above settings**: Even administrators must respect the workflow.
* **Only allow merge from `develop`**: Configure actions or rules preventing feature branches from merging directly into `main`.

## Standard Feature Workflow

1. Ensure you are on the `develop` branch.

   ```bash
   git checkout develop
   ```

2. Pull the latest integrated changes.

   ```bash
   git pull origin develop
   ```

3. Checkout a new descriptive feature branch from `develop`.

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. Commit changes to your feature branch.
5. Push the feature branch to the remote repository and open a Pull Request targeting `develop`.
