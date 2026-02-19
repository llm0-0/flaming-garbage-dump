# Audio files for realistic Malayalam pronunciation

To make pronunciation sound natural, add real recordings from a native speaker.

## Letter audio files expected

Put MP3 files in `audio/letters/` with these exact names:

- `a.mp3`
- `aa.mp3`
- `i.mp3`
- `ee.mp3`
- `u.mp3`
- `ka.mp3`
- `ma.mp3`
- `pa.mp3`
- `tha.mp3`
- `na.mp3`

## Word audio files expected

Put MP3 files in `audio/words/` with these exact names:

- `amma.mp3`
- `kapa.mp3`
- `pana.mp3`

## Recording tips

- Use a quiet room.
- Ask a native speaker to say each item naturally (not spelling letters).
- Keep each clip short (about 0.5s to 1.5s for letters, 1s to 2s for words).
- Export as MP3.

If a file is missing, the app falls back to browser speech.

## Download from web sources

If you have direct MP3 links (for example from Wikimedia Commons or your own hosted files):

1. Put links into `audio/sources.json`.
2. Run:

```bash
python3 scripts/fetch_audio.py
```

This saves files directly into `audio/letters/` and `audio/words/`.
