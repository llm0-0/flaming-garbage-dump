# flaming-garbage-dump
just stuff

Clickable Malayalam learning prototype that runs locally and on GitHub Pages.

## What is implemented now

- 10 target letters: അ, ആ, ഇ, ഈ, ഉ, ക, മ, പ, ത, ന.
- 1 unit with 7 lessons (3 letters per lesson).
- Every target letter appears in at least 2 lessons.
- Each lesson flow:
  - flashcards (letter + sound + example + audio button),
  - 2 practice questions,
  - lesson only passes when both are correct,
  - on failure, learner repeats flashcards and gets a new practice set.
- Unit quiz with mixed question types:
  - sound -> letter,
  - letter -> sound,
  - drag-and-drop word build.
- Quiz requires 85% to pass and can be retaken with a reshuffled question set.
- Unit screen has step locking:
  - future lessons locked until prior lesson is passed,
  - quiz locked until all lessons are passed.
- Home screen shows units and per-unit progress.
- Audio now prefers real MP3 clips (native-speaker recordings) and only falls back to browser voice if a file is missing.

## Run locally (PowerShell only, step-by-step)

Use these commands exactly, one line at a time.

```powershell
cd C:\Users\lekha\Downloads
cd .\flaming-garbage-dump-main
cd .\flaming-garbage-dump-main
dir
python -m http.server 4173
```

What each line does:

1. First `cd ...Downloads` moves you into your Downloads folder.
2. Second and third `cd ...flaming-garbage-dump-main` move into the unzipped folder and then the inner project folder.
3. `dir` should show `index.html`, `app.js`, and `styles.css`.
4. `python -m http.server 4173` starts the app.

Then open this in Chrome:

`http://localhost:4173/index.html`

To stop it later: go back to PowerShell and press `Ctrl + C`.

## Make audio sound more realistic

The app is now set up to play real audio files first.

1. Add your recorded MP3 files into:
   - `audio/letters/`
   - `audio/words/`
2. Use the exact filenames listed in `audio/README.md`.
3. Start the app again and click play buttons.

If a file is not there, the app uses browser speech as backup.

### Option: pull native-speaker files from web links automatically

1. Open `audio/sources.json`.
2. Replace each `https://example.com/...` URL with a real direct MP3 URL from a source you are allowed to use.
3. Run:

```bash
python3 scripts/fetch_audio.py
```

This downloads all clips into the exact file paths the app already expects.

## If you get "File not found"

You are in the wrong folder. In PowerShell, run:

```powershell
dir
```

If you do not see `index.html`, run:

```powershell
cd .\flaming-garbage-dump-main
dir
```

Then start again:

```powershell
python -m http.server 4173
```
