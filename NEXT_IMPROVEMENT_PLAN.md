# LearnSphere — Next Improvement Plan (Post-MVP)

This document outlines genuine follow-up initiatives that extend beyond the verified MVP criteria.

---

## 1. Cloud Infrastructure & Media Streaming (v1.1)

- **HLS / DASH Adaptive Bitrate Streaming:** Integrate FFmpeg transcode pipeline to generate multi-resolution streaming manifests (`.m3u8` / `.mpd`) from uploaded instructor videos.
- **S3-Compatible Object Storage:** Add `S3StorageProvider` implementation for AWS S3 / Cloudflare R2 alongside the verified `LocalFileStorageProvider`.
- **CDN Invalidation & Edge Caching:** Deliver static thumbnails, course media, and assets via Cloudflare edge workers with cache invalidation webhooks.

---

## 2. Advanced Learning Experience & Collaboration (v1.2)

- **Interactive Code Playgrounds:** Embed Sandpack / WebContainers for hands-on TypeScript and SQL code execution inside the learning player.
- **Discussion Forums & Q&A:** Threaded lesson comments allowing learners to ask instructors questions with code snippets.
- **Notes & Bookmarking:** Learner-side timestamped note taking synchronized with video position.

---

## 3. Production Enterprise Operations (v1.3)

- **Transactional Email Gateway:** Integrate Resend or Postmark for transactional emails (welcome message, password reset tokens, certificate awards).
- **Automated Certificate Generation:** Server-side PDF certificate creation with cryptographic verification QR code on course completion.
- **OpenTelemetry & APM:** Distributed tracing with Grafana Tempo / Prometheus metrics for database query performance monitoring.
