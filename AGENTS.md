# Resume and portfolio editing guidance

## Source of truth
- Resume and project entries are configured in `src/config.ts` under `siteConfig.experience`, `siteConfig.projects`, `siteConfig.skills`, and `siteConfig.education`.
- `src/components/Experience.astro` renders experience bullets; `src/components/Projects.astro` renders project descriptions and skills. Prefer updating the configuration over hard-coding resume content in components.
- Downloadable resume files in `public/` are separate artifacts. Do not edit or regenerate PDF/DOCX files when making website-only updates unless explicitly requested.

## Accuracy
- Preserve the user's stated titles and employment dates. Do not infer employment dates from Git commit dates; ask for confirmation when dates or role attribution conflict.
- Keep resume claims factual and supported by project source, tests, documentation, or user-provided resume content. Do not invent metrics, outcomes, ownership, or technologies.
- When summarizing project work, distinguish implemented features from planned or experimental work. For the candlestick project, verify claims against `homma` source and its tests when available.
- Keep bullets concise, action-oriented, and grouped by theme. Avoid duplicate claims across adjacent bullets and use consistent past tense for completed work.
- Preserve existing links and HTML markup embedded in configured bullet strings; renderers use `set:html` for those strings.

## Workflow
- Read the current `src/config.ts` and check the Git diff before editing; preserve unrelated or user-authored changes.
- After editing, run editor diagnostics and `git diff --check`.
- Run `npm run build` when practical to validate the Astro site. Report environment/toolchain failures separately from code errors; do not modify dependencies or lockfiles just to work around a local runtime issue unless requested.
- Make website-only changes unless the user explicitly asks to update generated resume files or other assets.

## Generating downloadable resumes
- When explicitly asked to refresh the downloadable resume, use `siteConfig.experience`, `siteConfig.projects`, and `siteConfig.education` in `src/config.ts` as the source for those sections. Keep the summary and skills from the existing resume unless the user requests changes to them.
- Run `npm run resume:generate` from the website repository to regenerate both downloadable files from `src/config.ts`. This keeps Ruby as the legacy/default backend; use `npm run resume:generate:ruby` or `npm run resume:generate:python` to select explicitly.
- The generator uses the existing `public/JohnCurranJr-Resume-2026.docx` as the Word layout template. Preserve paragraph styles, heading styles, bullet numbering, emphasis, and date alignment; keep employers and role titles bold, omit punctuation after employer names, add spacing between employment entries, and add spacing before and after each section title in the DOCX/PDF only. Do not add this section spacing to the webpage unless requested; do not rebuild the document as plain text or HTML.
- The generator exports the PDF from the newly generated DOCX through Apple Pages on macOS or headless LibreOffice on Linux. Linux requires the `libreoffice` executable (or `LIBREOFFICE_BIN=soffice`); PDF pagination may differ between exporters, so inspect the output for split headings and orphaned content.
- Do not update either downloadable file unless explicitly requested. Back up the current DOCX outside `public/` before changing the template/layout; temporary artifacts must not be left in the deployable `public/` directory.
- To inspect or change the workflow, edit `scripts/generate-resume.mjs` (loads `src/config.ts`, selects a backend, and coordinates output/export), plus both `scripts/generate-resume-docx.rb` and `scripts/generate-resume-docx.py` (update WordprocessingML while reusing template paragraph styles). Keep the Ruby and Python backends behaviorally aligned and validate outputs with each command when changing generation logic.
- Verify the DOCX archive opens and its extracted text reflects the configured sections. Open/render the exported PDF, check page count and pagination for split headings or orphaned section content, and confirm the key updated names, dates, and descriptions appear in both files.
