/**
 * Generates UTF-8 AI reference files from lists of project-relative paths.
 * Future options such as append mode, exclusions, line numbers, file-size
 * limits, and token limits can be added to ReferenceOptions.
 */
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

interface ReferenceDefinition {
  readonly listFile: string;
  readonly outputFile: string;
}

interface ReferenceOptions {
  readonly append?: boolean;
  readonly maxFileBytes?: number;
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..', '..');
const inputDirectory = path.join(scriptDirectory, 'input');
const outputDirectory = path.join(scriptDirectory, 'output');
const separator = '# =========================================';

const references: readonly ReferenceDefinition[] = [
  { listFile: path.join(inputDirectory, 'code_files.txt'), outputFile: path.join(outputDirectory, 'code_reference.txt') },
  { listFile: path.join(inputDirectory, 'component_files.txt'), outputFile: path.join(outputDirectory, 'component_reference.txt') },
];

function displayPath(absolutePath: string): string {
  return path.relative(projectRoot, absolutePath).split(path.sep).join('/');
}

function resolveProjectPath(listedPath: string): string | undefined {
  // Normalize either Windows or POSIX separators from list files.
  const resolvedPath = path.resolve(projectRoot, listedPath.replace(/[\\/]+/g, path.sep));
  const relativePath = path.relative(projectRoot, resolvedPath);
  if (relativePath === '' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    return undefined;
  }
  return resolvedPath;
}

async function readFileList(listFile: string): Promise<readonly string[]> {
  try {
    const contents = await fs.readFile(listFile, 'utf8');
    return contents.split(/\r?\n/).map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`Unable to read file list ${displayPath(listFile)}: ${detail}`);
    return [];
  }
}

function formatFile(relativePath: string, contents: string): string {
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

async function generateReference(
  definition: ReferenceDefinition,
  options: ReferenceOptions = {},
): Promise<void> {
  const seenFiles = new Set<string>();
  const sections: string[] = [];
  const includedFiles: string[] = [];

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
      if (options.maxFileBytes !== undefined && Buffer.byteLength(contents, 'utf8') > options.maxFileBytes) {
        console.error(`Skipping oversized file: ${displayPath(sourcePath)}`);
        continue;
      }
      const relativePath = displayPath(sourcePath);
      sections.push(formatFile(relativePath, contents));
      includedFiles.push(relativePath);
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error(`Missing or unreadable file ${displayPath(sourcePath)}: ${detail}`);
    }
  }

  await fs.mkdir(path.dirname(definition.outputFile), { recursive: true });
  await fs.writeFile(definition.outputFile, sections.join('\n'), {
    encoding: 'utf8',
    flag: options.append ? 'a' : 'w',
  });
  console.log(`Wrote ${sections.length} file(s) to ${displayPath(definition.outputFile)}.`);
  for (const includedFile of includedFiles) {
    console.log(`  - ${includedFile}`);
  }
}

async function main(): Promise<void> {
  for (const definition of references) await generateReference(definition);
}

void main().catch((error: unknown) => {
  const detail = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`AI reference generation failed: ${detail}`);
  process.exitCode = 1;
});
