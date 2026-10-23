---
title: "Docker 'Port Is Already Allocated' (and Other Common Docker Errors), Explained"
description: "Port conflicts, a daemon that won't connect, and container exit codes are the errors that eat the most Docker debugging time. Here's what causes each and the fastest way to fix them."
date: "2026-08-04"
author: "ToolNinja"
coverEmoji: "🐳"
tags: ["docker port already allocated", "bind for 0.0.0.0 failed", "cannot connect to the docker daemon", "docker error response from daemon", "docker exit code 137", "docker port conflict fix", "docker daemon not running", "docker errors explained", "docker", "devops", "errors"]
relatedTools: ["docker-run-to-compose"]
faqs:
  - q: "How do I find out what's already using the port Docker is complaining about?"
    a: "On Linux/macOS, run lsof -i :PORT (e.g. lsof -i :8080) to see the process holding that port. On Windows, netstat -ano | findstr :PORT gives you the process ID, which you can then look up in Task Manager. Often it's a previous container you forgot was still running — docker ps will show you."
  - q: "Why does 'Cannot connect to the Docker daemon' happen even though I just used Docker five minutes ago?"
    a: "The most common cause on Linux is simply that the Docker service stopped or the machine restarted without Docker set to auto-start. On macOS/Windows with Docker Desktop, it usually means the Docker Desktop application itself isn't running — the docker CLI command is just a client that talks to a daemon process, and if that daemon isn't up, every command fails the same way regardless of what you're trying to do."
  - q: "What does exit code 137 mean on a Docker container?"
    a: "Exit code 137 means the container's process was killed with SIGKILL — and in the overwhelming majority of cases in production, that's the Linux kernel's OOM (out-of-memory) killer terminating the container because it exceeded its memory limit, or because the host itself ran out of memory. It is the most common production Docker issue, and the fix is almost always to set an explicit, adequate memory limit rather than leaving it unbounded."
  - q: "Is it safe to just kill whatever process is using the port I need?"
    a: "Only if you're sure what that process actually is — check before you kill. If it's an old container of your own, docker stop/rm it cleanly instead of killing the process directly. If it's an unrelated service (a local database, another dev server) that something else on your machine depends on, killing it can break that other thing. When in doubt, run your container on a different host port instead."
---

## Three Errors, One Root Cause: You Don't Know What Docker Actually Did

Most Docker errors that eat real debugging time aren't exotic — they're one of a small handful of well-understood failure modes. Here are the three that come up constantly, what's really happening, and the fastest fix for each.

---

## "Port Is Already Allocated"

```
Error response from daemon: driver failed programming external connectivity
on endpoint myapp: Bind for 0.0.0.0:8080 failed: port is already allocated
```

**What it means:** you're telling Docker to bind container port X to host port 8080, but something on your machine — another process, or another container — is already listening on host port 8080. Only one process can bind a given port at a time; this is an operating system constraint, not a Docker-specific one.

**The most common actual cause:** it's usually a container of your own, from a previous run, that you forgot was still up. Check first:

```bash
docker ps
```

If you see an old container mapped to the same port, stop it:

```bash
docker stop <container-id>
```

**If it's not a container**, find whatever process is holding the port:

```bash
# Linux / macOS
lsof -i :8080

# Windows
netstat -ano | findstr :8080
```

**Fix without killing anything:** just run your container on a different host port — the container's internal port doesn't need to match:

```bash
docker run -p 8081:8080 myapp
```

---

## "Cannot Connect to the Docker Daemon"

```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock.
Is the docker daemon running?
```

**What it means:** the `docker` command you're running is a **client** — it doesn't do anything itself. It talks to a background **daemon** process (`dockerd`) that actually manages containers, images, and networking. This error means that daemon isn't reachable, for one of three reasons:

1. **The daemon isn't running.** On Linux:
   ```bash
   sudo systemctl start docker
   sudo systemctl status docker   # confirm it's actually up
   ```
   On macOS/Windows, this usually means **Docker Desktop itself isn't running** — open the application, wait for it to fully start, then retry.

2. **Your user isn't in the `docker` group** (Linux), so you don't have permission to talk to the daemon's socket:
   ```bash
   sudo usermod -aG docker $USER
   ```
   Then log out and back in — group membership changes don't apply to an already-open terminal session.

3. **`DOCKER_HOST` is pointed somewhere wrong** — if you've been working with a remote Docker context or a VM, check `echo $DOCKER_HOST` and reset it if it's stale.

---

## Exit Code 137 (the Silent Production Killer)

A container that exits with code 137 didn't crash from a bug in your code in the usual sense — it was **killed**, specifically with `SIGKILL` (signal 9, and 128 + 9 = 137). In production, the overwhelming majority of the time, this is the Linux kernel's **out-of-memory (OOM) killer** terminating your container because it exceeded its memory limit, or because the host ran out of available memory entirely.

This is widely reported as the single most common production Docker issue, and it's caused specifically by **missing or too-low memory limits** — either the container has no `--memory` limit set and consumes more than the host can spare, or it has a limit set too low for what the application actually needs under real load.

**Fix:** set an explicit, realistic memory limit and monitor actual usage to size it correctly, rather than leaving containers unbounded:

```bash
docker run --memory=512m myapp
```

In Compose:

```yaml
services:
  myapp:
    deploy:
      resources:
        limits:
          memory: 512M
```

If you're still hitting 137 after setting a limit, that's a signal the application genuinely needs more memory than you gave it — check for a real memory leak before just raising the limit indefinitely.

---

## Quick Reference

| Error | Root cause | Fastest fix |
|---|---|---|
| Port is already allocated | Something else is bound to that host port | `docker ps` to check for an old container, or use a different `-p` host port |
| Cannot connect to the Docker daemon | `dockerd` isn't running, or a permissions/`DOCKER_HOST` issue | Start Docker Desktop / `systemctl start docker`; check group membership |
| Exit code 137 | OOM kill — container hit its memory limit | Set an explicit `--memory` limit sized to real usage |

---

## Working With `docker run` Without Memorizing Every Flag

If you're translating a `docker run` command into a reusable, version-controlled setup — which is exactly where port and memory settings should live instead of being re-typed at the command line every time — **[ToolNinja's Docker Run to Compose converter →](/tools/docker-run-to-compose)** turns any `docker run` command into a ready-to-use `docker-compose.yml`, including port mappings, environment variables, volumes, and healthchecks, with a best-practices scorer to flag things like a missing memory limit before they become a 3am page.

---

Sources:
- [How to Resolve Docker Port Already in Use Conflicts — OneUptime](https://oneuptime.com/blog/post/2026-01-16-docker-port-conflicts/view)
- [The 10 Docker Errors That Waste the Most Time (and the One-Line Fix) — DEV Community](https://dev.to/devopsaitoolkit/the-10-docker-errors-that-waste-the-most-time-and-the-one-line-fix-45mg)
