# REVIEW — Seam launch film (54s, 1920x1080, 30fps)

- VO: Deepgram aura-2-thalia-en, 53.0s, placed at 0.4s. Script: Lagos/Kano blackout hook → failed transfers/fees → Seam reveal → Mint 100/Seal 50 proof → market payoff → end card.
- Screenshots: 5 real captures from localhost:8081 at 390x844 (home, mint, send, receive, settings), framed in CSS phone mock, crossfading with VO proof beat.
- Checks: lint 0 errors (9 nested-structure warnings, single-file intentional), layout 0 errors, motion/runtime/audio clean.
- Render: renders/seam-video_2026-11-17_16-17-26.mp4, 4.2MB, h264+aac, 54.0s. Three acts: slides 0–12s (Lagos/Kano blackout + failed-transfers hook) → phone-only 12–42s (drive.mp4 media 5–35s: Mint 100 → Seal 50 QR → Receive, notch removed, zero overlays) → slides 42–54s (offline proof + Dakar 2026 end card). Spot frames at 2/8/15/27/44/50s verified: slides centered, phone centered, header clear.
- Known limits: no BGM (VO-only mix); slide holds trigger dead-stretch warnings by design; phone small at 1080p by design (real UI, never redrawn).
