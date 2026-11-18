
# Prerequisites

- Node.js and npm
- `unzip` (used to validate the generated DOCX)
- For the Ruby backend: Ruby and `zip`
- For the Python backend: Python 3.9+ (standard library only)
- For PDF export: Apple Pages on macOS, or LibreOffice on Linux



# Run local

```
npm install
npm run dev
```

## Generate downloadable resume files

The DOCX and PDF are generated from the experience, projects, and education entries in `src/config.ts`. The legacy/default command uses Ruby:

```
npm run resume:generate
```

Choose a DOCX generator explicitly with either command:

```
npm run resume:generate:ruby
npm run resume:generate:python
```

The Python implementation uses only the standard library. Set `PYTHON_BIN` if Python 3 is not available as `python3`. Both commands update `public/JohnCurranJr-Resume-2026.docx` and `public/JohnCurranJr-Resume-2026.pdf`. Apple Pages exports the PDF on macOS; headless LibreOffice exports it on Linux. PDF pagination can differ between these applications, so review both generated files before committing. If LibreOffice is installed as `soffice` rather than `libreoffice`, set `LIBREOFFICE_BIN=soffice` when running the script.


Based on https://github.com/RyanFitzgerald/devportfolio?tab=readme-ov-file