#!/usr/bin/env python3
"""Push all files (including dotfiles and .github) to a GitHub repo via Contents API."""
import subprocess, json, base64, sys, os, glob

REPO = sys.argv[1]
DIR = sys.argv[2]

def gh_api(method, url, body=None):
    cmd = ["assistant", "oauth", "request", "--provider", "github", "-X", method]
    if body:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(body)]
    cmd += [url]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(result.stdout.strip())
    except Exception:
        lines = (result.stdout + result.stderr).strip().split("\n")
        for i, line in enumerate(lines):
            if line.strip().startswith("{"):
                try:
                    return json.loads("\n".join(lines[i:]))
                except Exception:
                    pass
        print(f"PARSE FAIL. stdout={result.stdout[:300]} stderr={result.stderr[:300]}")
        return None

def main():
    # Collect all files, including dotfiles and .github, but exclude node_modules, dist, .git
    skip_dirs = {'.git', 'node_modules', 'dist', '__pycache__', '.pytest_cache'}
    files = []
    for root, dirs, fnames in os.walk(DIR):
        # Filter out skip dirs in-place
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for f in fnames:
            full = os.path.join(root, f)
            files.append(full)
    files.sort()
    
    # Filter out build artifacts
    files = [f for f in files if not f.endswith(('.tsbuildinfo', '.d.ts')) and 'vite.config.js' not in f]
    
    commit_sha = None
    pushed = 0
    
    for fname in files:
        rel = os.path.relpath(fname, DIR)
        with open(fname, "rb") as f:
            content = base64.b64encode(f.read()).decode()

        body = {
            "message": f"Add {rel}" if commit_sha else "Initial commit: Decibel Meter v1.0.0",
            "content": content,
            "branch": "main",
        }
        if commit_sha:
            body["sha"] = commit_sha

        resp = gh_api("PUT", f"https://api.github.com/repos/{REPO}/contents/{rel}", body)
        if resp and "commit" in resp:
            commit_sha = resp["commit"]["sha"]
            pushed += 1
            print(f"[{pushed}/{len(files)}] {rel} -> {commit_sha[:8]}")
        else:
            print(f"FAILED on {rel}: {resp}")
            return 1

    if commit_sha:
        repo = gh_api("GET", f"https://api.github.com/repos/{REPO}")
        if repo:
            print(f"\nRepo: {repo.get('full_name')}")
            print(f"URL: {repo.get('html_url')}")
            print(f"Default branch: {repo.get('default_branch')}")
            print(f"Private: {repo.get('private')}")
            print(f"Pushed {pushed} file(s), HEAD {commit_sha[:8]}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
