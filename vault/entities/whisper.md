---
title: Whisper (OpenAI)
type: entity
status: active
tags: [ai-model, transcription, openai]
sources: [trellis-project-architecture, trellis-product-requirements]
created: 2026-05-12
updated: 2026-05-12
---

# Whisper

OpenAI's speech-to-text model. Trellis MVP uses the Whisper API for audio capture transcription.

## Key facts

- **Used for**: transcribing audio notes captured via the browser's MediaRecorder API. (see [[trellis-product-requirements]])
- **Audio format**: WebM/Opus (browser default).
- **MVP cap**: 5-minute maximum recording duration (demo simplification).
- **Latency**: transcription happens via API call (not on-device in MVP). Result is editable before save.
- **Cost envelope**: $5–$10 for the hackathon period. (see [[trellis-project-architecture]] §12)
- **External marketing**: the local-first architecture promises on-device transcription at V1; MVP transcription is honestly cloud.

## Role in capture flow

1. Lawyer records via MediaRecorder (waveform indicator, duration counter, 5-minute cap).
2. Stop triggers transcription via Whisper.
3. Transcribed text becomes the body of a new note; the original audio Blob is stored in IndexedDB.
4. [[auto-organization-pipeline]] runs on the transcript.

## Relations

- **Used by**: [[trellis]] audio capture surface
- **Complement**: [[gemini]] (text/image pipelines), [[gemini|Gemini Vision]] (image capture)

## Open questions

- Path for on-device speech recognition at V1 — Whisper.cpp on desktop, native speech APIs on mobile, or both?

## Sources

- [[trellis-project-architecture]]
- [[trellis-product-requirements]]
