# Setting up this studio on another PC

The code, brand assets and project briefs are in Git. Per-machine things are not:
`.venv`, `remotion-studio/node_modules`, `tools/` (whisper.cpp, RIFE, Real-ESRGAN — about 2.2 GB).
Finished videos live in `OneDrive\Hidden Impact Videos` and appear here as the `Final videos` link.

## Daily workflow (two PCs)
- Start of work: `git pull`
- End of work: `git add -A; git commit -m "what changed"; git push`
- Never work on the same project on both PCs at the same time.

## First-time setup on a new PC
Prerequisites: Git, Node.js, Python 3.12, FFmpeg (all via winget).

```powershell
mkdir C:\Projects; cd C:\Projects
git clone <repo-url> "ai vedio edetor"
cd "ai vedio edetor"

# Python tools
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Remotion
cd remotion-studio; npm install; cd ..

# Finished videos (OneDrive) linked into the project
cmd /c mklink /J "Final videos" "$env:USERPROFILE\OneDrive\Hidden Impact Videos"
```

Copy `tools/` from the other PC (e.g. via a USB drive or `D:\`) into the project folder.
