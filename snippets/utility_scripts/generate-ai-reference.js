/**
 * Dependency-free JavaScript version of generate-ai-reference.ts.
 * Run with: node snippets/utility_scripts/generate-ai-reference.js
 */
const fs = require('node:fs/promises');
const path = require('node:path');

const scriptDirectory = __dirname;
const projectRoot = path.resolve(scriptDirectory, '..', '..');
const inputDirectory = path.join(scriptDirectory, 'input');
const outputDirectory = path.join(scriptDirectory, 'output');
const separator = '# =========================================';

const references = [
  { listFile: path.join(inputDirectory, 'code_files.txt'), outputFile: path.join(outputDirectory, 'code_reference.txt') },
  { listFile: path.join(inputDirectory, 'component_files.txt'), outputFile: path.join(outputDirectory, 'component_reference.txt') },
];

function displayPath(absolutePath) {
  return path.relative(projectRoot, absolutePath).split(path.sep).join('/');
}

function resolveProjectPath(listedPath) {
  const resolvedPath = path.resolve(projectRoot, listedPath.replace(/[\\/]+/g, path.sep));
  const relativePath = path.relative(projectRoot, resolvedPath);
  if (relativePath === '' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    return undefined;
  }
  return resolvedPath;
}

async function readFileList(listFile) {
  try {
    const contents = await fs.readFile(listFile, 'utf8');
    return contents.split(/\r?\n/).map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));
  } catch (error) {
    console.error(`Unable to read file list ${displayPath(listFile)}: ${error.message}`);
    return [];
  }
}

function formatFile(relativePath, contents) {
  const trailingNewline = contents.endsWith('\n') ? '' : '\n';
  return [
    separator,
    `# FILE: ${relativePath}`,
    '# Begin File',
    separator,
    '',
    `${contents}${trailingNewline}`,
    '',
    separator,
    '# End File',
    separator,
  ].join('\n');
}

async function generateReference(definition) {
  const seenFiles = new Set();
  const sections = [];
  const includedFiles = [];

  for (const listedPath of await readFileList(definition.listFile)) {
    const sourcePath = resolveProjectPath(listedPath);
    if (sourcePath === undefined) {
      console.error(`Skipping invalid project-relative path: ${listedPath}`);
      continue;
    }
    if (seenFiles.has(sourcePath)) continue;
    seenFiles.add(sourcePath);

    try {
      const contents = await fs.readFile(sourcePath, 'utf8');
      const relativePath = displayPath(sourcePath);
      sections.push(formatFile(relativePath, contents));
      includedFiles.push(relativePath);
    } catch (error) {
      console.error(`Missing or unreadable file ${displayPath(sourcePath)}: ${error.message}`);
    }
  }

  await fs.mkdir(path.dirname(definition.outputFile), { recursive: true });
  await fs.writeFile(definition.outputFile, sections.join('\n'), 'utf8');
  console.log(`Wrote ${sections.length} file(s) to ${displayPath(definition.outputFile)}.`);
  for (const includedFile of includedFiles) {
    console.log(`  - ${includedFile}`);
  }
}

async function main() {
  for (const definition of references) await generateReference(definition);
}

main().catch((error) => {
  console.error(`AI reference generation failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
