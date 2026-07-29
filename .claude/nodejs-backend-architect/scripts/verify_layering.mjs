#!/usr/bin/env node

/**
 * verify_layering.mjs
 *
 * Enforces the Clean Architecture dependency rule:
 *   - Controllers must NOT import from Prisma, repositories, or database modules
 *   - UseCases must NOT import from @nestjs/common (except Injectable), controllers, or HTTP concepts
 *   - Entities must NOT import from any framework, Prisma, or infrastructure
 *   - Repositories can import Prisma (they're the adapter), but NOT controllers or usecases
 *
 * Usage: node scripts/verify_layering.mjs src/
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.argv[2] || 'src';

// --- Rule Definitions ---

const RULES = [
  {
    name: 'Controller must not import Prisma directly',
    filePattern: /\.controller\.ts$/,
    forbidden: [
      { pattern: /@prisma\/client/,  message: 'Controllers must not import @prisma/client' },
      { pattern: /PrismaService/,    message: 'Controllers must not use PrismaService' },
      { pattern: /prisma\./,         message: 'Controllers must not call prisma methods' },
    ],
  },
  {
    name: 'Controller must not contain business logic',
    filePattern: /\.controller\.ts$/,
    forbidden: [
      { pattern: /\.findMany\(|\.findFirst\(|\.create\(|\.update\(|\.delete\(/,
        message: 'Controllers must not call ORM methods — delegate to UseCases' },
    ],
  },
  {
    name: 'UseCase must not import HTTP/framework concepts',
    filePattern: /\.usecase\.ts$/,
    forbidden: [
      { pattern: /from\s+['"]@nestjs\/common['"](?!.*Injectable)/,
        message: 'UseCases should only import Injectable from @nestjs/common' },
      { pattern: /import.*\b(Request|Response|HttpException|HttpStatus)\b.*from/,
        message: 'UseCases must not use HTTP concepts (Request, Response, HttpException)' },
      { pattern: /import.*Controller/,
        message: 'UseCases must not import Controllers' },
    ],
  },
  {
    name: 'Entity must be framework-free',
    filePattern: /\.entity\.ts$/,
    forbidden: [
      { pattern: /from\s+['"]@nestjs/,          message: 'Entities must not import NestJS modules' },
      { pattern: /from\s+['"]@prisma\/client/,   message: 'Entities must not import Prisma' },
      { pattern: /from\s+['"]class-validator/,    message: 'Entities must not use class-validator (use DTOs instead)' },
      { pattern: /from\s+['"]class-transformer/,  message: 'Entities must not use class-transformer' },
    ],
  },
  {
    name: 'Repository must not import controllers or usecases',
    filePattern: /\.repository\.ts$/,
    forbidden: [
      { pattern: /import.*Controller/,  message: 'Repositories must not import Controllers' },
      { pattern: /import.*UseCase/,     message: 'Repositories must not import UseCases' },
    ],
  },
  {
    name: 'No cross-module repository imports',
    filePattern: /\.ts$/,
    check: (filePath, content) => {
      const violations = [];
      // Extract the module this file belongs to
      const moduleMatch = filePath.match(/modules\/([^/]+)\//);
      if (!moduleMatch) return violations;
      const currentModule = moduleMatch[1];

      // Find imports of repository files from other modules
      const importRegex = /from\s+['"].*modules\/([^/]+)\/repositories/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importedModule = match[1];
        if (importedModule !== currentModule) {
          violations.push({
            message: `Cross-module repository import: "${currentModule}" imports repository from "${importedModule}". Use the module's exported service instead.`,
          });
        }
      }
      return violations;
    },
  },
];

// --- File Scanner ---

async function* walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      yield* walkDir(fullPath);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      yield fullPath;
    }
  }
}

// --- Main ---

async function main() {
  let totalViolations = 0;
  const results = [];

  for await (const filePath of walkDir(ROOT)) {
    const content = await readFile(filePath, 'utf-8');
    const relPath = relative(process.cwd(), filePath);

    for (const rule of RULES) {
      // Check if this rule applies to this file
      if (rule.filePattern && !rule.filePattern.test(filePath)) continue;

      if (rule.forbidden) {
        for (const { pattern, message } of rule.forbidden) {
          // Check line by line for better reporting
          const lines = content.split('\n');
          lines.forEach((line, i) => {
            if (pattern.test(line)) {
              totalViolations++;
              results.push({
                file: relPath,
                line: i + 1,
                rule: rule.name,
                message,
                code: line.trim(),
              });
            }
          });
        }
      }

      if (rule.check) {
        const violations = rule.check(filePath, content);
        for (const v of violations) {
          totalViolations++;
          results.push({
            file: relPath,
            line: null,
            rule: rule.name,
            message: v.message,
            code: null,
          });
        }
      }
    }
  }

  // --- Output ---

  if (results.length === 0) {
    console.log('✅ No layering violations found.');
    process.exit(0);
  }

  console.log(`\n❌ Found ${totalViolations} layering violation(s):\n`);

  // Group by file
  const byFile = {};
  for (const r of results) {
    if (!byFile[r.file]) byFile[r.file] = [];
    byFile[r.file].push(r);
  }

  for (const [file, violations] of Object.entries(byFile)) {
    console.log(`  ${file}`);
    for (const v of violations) {
      const loc = v.line ? `:${v.line}` : '';
      console.log(`    ⚠  ${v.message}${loc}`);
      if (v.code) console.log(`       ${v.code}`);
    }
    console.log();
  }

  process.exit(1);
}

main().catch((err) => {
  console.error('Error running layering check:', err);
  process.exit(2);
});
