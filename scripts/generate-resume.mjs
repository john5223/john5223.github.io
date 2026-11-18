#!/usr/bin/env node
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(repoRoot, 'src/config.ts');
const templateDocx = path.join(repoRoot, 'public/JohnCurranJr-Resume-2026.docx');
const publicDocx = templateDocx;
const publicPdf = path.join(repoRoot, 'public/JohnCurranJr-Resume-2026.pdf');
const require = createRequire(import.meta.url);
const ts = require('typescript');

function loadSiteConfig(sourcePath = configPath) {
  const source = readFileSync(sourcePath, 'utf8');
  const { outputText, diagnostics } = ts.transpileModule(source, {
    fileName: sourcePath,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const errors = (diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  if (errors.length) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
      getCurrentDirectory: () => path.dirname(sourcePath),
      getCanonicalFileName: (fileName) => fileName,
      getNewLine: () => '\n',
    }));
  }

  const loadedModule = { exports: {} };
  const runModule = new Function('exports', 'require', 'module', outputText);
  runModule(loadedModule.exports, require, loadedModule, sourcePath, path.dirname(sourcePath));
  const siteConfig = loadedModule.exports.siteConfig;
  for (const section of ['experience', 'projects', 'education']) {
    if (!Array.isArray(siteConfig?.[section])) {
      throw new Error(`siteConfig.${section} must be an array in ${sourcePath}`);
    }
  }
  return siteConfig;
}

function run(command, args, options = {}) {
  try {
    const input = options.input;
    return execFileSync(command, args, {
      ...options,
      stdio: input === undefined ? 'inherit' : ['pipe', 'inherit', 'inherit'],
    });
  } catch (error) {
    const detail = error?.stderr?.toString() || error?.message || String(error);
    throw new Error(`${command} failed: ${detail}`);
  }
}

function exportPdfWithPages(docxPath, pdfPath, tempDir) {
  const applescriptPath = path.join(tempDir, 'export-resume.applescript');
  const asString = (value) => `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
  writeFileSync(applescriptPath, `tell application "Pages"\n  activate\n  set resumeDocument to open POSIX file ${asString(docxPath)}\n  export resumeDocument to POSIX file ${asString(pdfPath)} as PDF\n  close resumeDocument saving no\nend tell\n`);
  run('osascript', ['-s', 's', applescriptPath]);
}

function exportPdfWithLibreOffice(docxPath, pdfPath, tempDir) {
  const command = process.env.LIBREOFFICE_BIN || 'libreoffice';
  try {
    run(command, ['--headless', '--convert-to', 'pdf', '--outdir', tempDir, docxPath]);
  } catch (error) {
    throw new Error(`Linux PDF export requires LibreOffice (${command}). ${error.message}`);
  }
  if (!existsSync(pdfPath)) {
    throw new Error(`LibreOffice did not create the expected PDF: ${pdfPath}`);
  }
}

function selectedBackend() {
  const option = process.argv.find((argument) => argument.startsWith('--backend='));
  const backend = option ? option.slice('--backend='.length) : 'ruby';
  if (!['ruby', 'python'].includes(backend)) {
    throw new Error(`Unknown DOCX generator backend "${backend}". Choose "ruby" or "python".`);
  }
  return backend;
}

function installPair(docxSource, pdfSource, tempDir) {
  const stagedDocx = path.join(repoRoot, 'public', `.resume-${process.pid}.docx`);
  const stagedPdf = path.join(repoRoot, 'public', `.resume-${process.pid}.pdf`);
  const previousDocx = path.join(tempDir, 'previous.docx');
  const previousPdf = path.join(tempDir, 'previous.pdf');
  const hadDocx = existsSync(publicDocx);
  const hadPdf = existsSync(publicPdf);

  if (hadDocx) copyFileSync(publicDocx, previousDocx);
  if (hadPdf) copyFileSync(publicPdf, previousPdf);
  copyFileSync(docxSource, stagedDocx);
  copyFileSync(pdfSource, stagedPdf);

  try {
    renameSync(stagedDocx, publicDocx);
    renameSync(stagedPdf, publicPdf);
  } catch (error) {
    if (hadDocx) copyFileSync(previousDocx, publicDocx);
    if (hadPdf) copyFileSync(previousPdf, publicPdf);
    throw error;
  } finally {
    rmSync(stagedDocx, { force: true });
    rmSync(stagedPdf, { force: true });
  }
}

function main() {
  if (!existsSync(templateDocx)) {
    throw new Error(`DOCX template not found: ${templateDocx}`);
  }
  if (!existsSync(path.join(repoRoot, 'node_modules/typescript/lib/typescript.js'))) {
    throw new Error('TypeScript is required to load src/config.ts. Run npm install in the website repository first.');
  }
  if (!['darwin', 'linux'].includes(process.platform)) {
    throw new Error(`Resume PDF generation is supported on macOS and Linux, not ${process.platform}.`);
  }

  const siteConfig = loadSiteConfig();
  const backend = selectedBackend();
  const resumeProjects = siteConfig.projects.filter((project) => project.includeInResume === true);
  if (resumeProjects.length === 0) {
    throw new Error('Mark at least one siteConfig.projects entry with includeInResume: true to include it in the downloadable resume.');
  }
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'portfolio-resume-'));
  try {
    const generatedDocx = path.join(tempDir, 'JohnCurranJr-Resume-2026.docx');
    const generatedPdf = path.join(tempDir, 'JohnCurranJr-Resume-2026.pdf');
    const configInput = JSON.stringify({
      experience: siteConfig.experience,
      projects: resumeProjects,
      education: siteConfig.education,
    });
    if (backend === 'ruby') {
      const rubyGenerator = path.join(repoRoot, 'scripts/generate-resume-docx.rb');
      run('ruby', [rubyGenerator, templateDocx, generatedDocx], { input: configInput });
    } else {
      const pythonGenerator = path.join(repoRoot, 'scripts/generate-resume-docx.py');
      run(process.env.PYTHON_BIN || 'python3', [pythonGenerator, templateDocx, generatedDocx], { input: configInput });
    }
    run('unzip', ['-tq', generatedDocx]);

    if (process.platform === 'darwin') {
      exportPdfWithPages(generatedDocx, generatedPdf, tempDir);
    } else {
      exportPdfWithLibreOffice(generatedDocx, generatedPdf, tempDir);
    }
    if (!readFileSync(generatedPdf).subarray(0, 5).equals(Buffer.from('%PDF-'))) {
      throw new Error('The PDF exporter did not produce a valid PDF file.');
    }

    installPair(generatedDocx, generatedPdf, tempDir);
    console.log(`Generated DOCX with the ${backend} backend.`);
    console.log(`Updated ${path.relative(repoRoot, publicDocx)}`);
    console.log(`Updated ${path.relative(repoRoot, publicPdf)}`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

try {
  if (process.env.RESUME_CONFIG_TEST) {
    console.log(JSON.stringify(loadSiteConfig(process.env.RESUME_CONFIG_TEST)));
  } else {
    main();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
