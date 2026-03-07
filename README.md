# App Test Deployment Pipeline

This repository contains a unified CI/CD workflow testing an end-to-end deployment strategy, including code scanning, container building, container scanning, pushing images, updating an ArgoCD GitOps repository, and finally ensuring ArgoCD applies the changes to a Kubernetes cluster.

## Features Included in the `ci-cd.yml` Workflow:

1. **SonarQube Scan**: Static code analysis and test coverage.
2. **Trivy Filesystem Scan**: Scans the root filesystem for vulnerabilities.
3. **Build, Scan, & Push**: Builds the Docker container, scans the container with Trivy, and pushes it to DockerHub tagged with the commit SHA and `latest`.
4. **Update GitOps**: Modifies the target `helm-argocd` repository values to use the newly pushed image.
5. **ArgoCD Deploy**: Idempotently creates/syncs an Argo Application for immediate deployment.

## Automation Script

An `auto-push.sh` script is provided for quickly pushing your changes to GitHub to trigger this unified pipeline.

### Usage

```bash
./auto-push.sh "Your commit message"
```

If no commit message is provided, it defaults to: `Auto-commit: update configurations and code`

Make sure it's executable first (already done upon file creation):

```bash
chmod +x auto-push.sh
```

---

_This is a Next.js project bootstrapped with `create-next-app`._
