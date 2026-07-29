#!/usr/bin/env node

/**
 * verify_api_contract.mjs
 *
 * Validates that controller implementations conform to API standards:
 *   - Every public controller method has @ApiOperation
 *   - Every controller has @ApiTags
 *   - Response envelope pattern is used (TransformInterceptor applied)
 *   - Error responses are documented
 *   - Auth guards are applied to non-public endpoints
 *
 * Usage: node scripts/verify_api_contract.mjs [src/]
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.argv[2] || 'src';

const CHECKS = [
  {
    name: 'Controller must have @ApiTags',
    check: (content, filePath) => {
      if (!content.includes('@Controller(')) return [];
      if (content.includes('@ApiTags(')) return [];
      return [{ message: 'Missing @ApiTags decorator on controller class' }];
    },
  },
  {
    name: 'Controller methods must have @ApiOperation',
    check: (content, filePath) => {
      const violations = [];
      const methodDecorators = ['@Get', '@Post', '@Put', '@Patch', '@Delete'];

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const hasRouteDecorator = methodDecorators.some(d => line.startsWith(d));
        if (!hasRouteDecorator) continue;

        // Look backward up to 10 lines for @ApiOperation
        let foundApiOp = false;
        for (let j = Math.max(0, i - 10); j < i; j++) {
          if (lines[j].includes('@ApiOperation')) {
            foundApiOp = true;
            break;
          }
        }

        if (!foundApiOp) {
          // Extract method name (look forward for the method declaration)
          let methodName = 'unknown';
          for (let j = i; j < Math.min(lines.length, i + 5); j++) {
            const methodMatch = lines[j].match(/async\s+(\w+)|(\w+)\s*\(/);
            if (methodMatch) {
              methodName = methodMatch[1] || methodMatch[2];
              break;
            }
          }
          violations.push({
            message: `Method "${methodName}" (line ${i + 1}) missing @ApiOperation`,
            line: i + 1,
          });
        }
      }
      return violations;
    },
  },
  {
    name: 'Controller methods should document error responses',
    check: (content, filePath) => {
      const violations = [];
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.startsWith('@Post') && !line.startsWith('@Put') && !line.startsWith('@Patch') && !line.startsWith('@Delete')) {
          continue;
        }

        // Look backward for at least one @ApiResponse with 4xx status
        let foundErrorResponse = false;
        for (let j = Math.max(0, i - 15); j < i; j++) {
          if (lines[j].match(/@ApiResponse\(\s*\{\s*status:\s*(4\d\d|'4\d\d')/)) {
            foundErrorResponse = true;
            break;
          }
        }

        if (!foundErrorResponse) {
          violations.push({
            message: `Mutation endpoint at line ${i + 1} should document at least one 4xx @ApiResponse`,
            line: i + 1,
          });
        }
      }
      return violations;
    },
  },
  {
    name: 'Non-health endpoints should have auth guards',
    check: (content, filePath) => {
      if (filePath.includes('health')) return [];
      if (!content.includes('@Controller(')) return [];

      const hasClassLevelGuard = content.includes('@UseGuards(JwtAuthGuard') ||
                                  content.includes('@UseGuards(AuthGuard');
      const hasPublicDecorator = content.includes('@Public()');

      if (hasClassLevelGuard || hasPublicDecorator) return [];

      // Check if individual methods have guards
      const lines = content.split('\n');
      const methodDecorators = ['@Get', '@Post', '@Put', '@Patch', '@Delete'];
      const ungardedMethods = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const hasRouteDecorator = methodDecorators.some(d => line.startsWith(d));
        if (!hasRouteDecorator) continue;

        let hasGuard = false;
        for (let j = Math.max(0, i - 8); j < i; j++) {
          if (lines[j].includes('@UseGuards') || lines[j].includes('@Public')) {
            hasGuard = true;
            break;
          }
        }

        if (!hasGuard) {
          ungardedMethods.push({ line: i + 1 });
        }
      }

      if (ungardedMethods.length > 0) {
        return [{
          message: `Controller has ${ungardedMethods.length} endpoint(s) without auth guards or @Public decorator. Consider adding @UseGuards(JwtAuthGuard) at class level.`,
        }];
      }
      return [];
    },
  },
  {
    name: 'Response DTO should follow envelope pattern',
    check: (content, filePath) => {
      if (!filePath.includes('.dto.')) return [];
      // Check response DTOs for envelope fields
      if (!filePath.includes('response')) return [];

      if (content.includes('success') && content.includes('data')) return [];

      return [{
        message: 'Response DTO should include success/data fields (envelope pattern), or use TransformInterceptor globally.',
      }];
    },
  },
];

// --- Scanner ---

async function* walkControllers(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      yield* walkControllers(fullPath);
    } else if (entry.name.endsWith('.controller.ts') || entry.name.endsWith('.dto.ts')) {
      yield fullPath;
    }
  }
}

// --- Main ---

async function main() {
  let totalViolations = 0;
  const results = [];

  for await (const filePath of walkControllers(ROOT)) {
    const content = await readFile(filePath, 'utf-8');
    const relPath = relative(process.cwd(), filePath);

    for (const check of CHECKS) {
      const violations = check.check(content, filePath);
      for (const v of violations) {
        totalViolations++;
        results.push({
          file: relPath,
          check: check.name,
          ...v,
        });
      }
    }
  }

  if (results.length === 0) {
    console.log('✅ All API contracts verified.');
    process.exit(0);
  }

  console.log(`\n⚠  Found ${totalViolations} API contract issue(s):\n`);

  const byFile = {};
  for (const r of results) {
    if (!byFile[r.file]) byFile[r.file] = [];
    byFile[r.file].push(r);
  }

  for (const [file, issues] of Object.entries(byFile)) {
    console.log(`  ${file}`);
    for (const issue of issues) {
      const loc = issue.line ? ` (line ${issue.line})` : '';
      console.log(`    ⚠  ${issue.message}${loc}`);
    }
    console.log();
  }

  process.exit(1);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(2);
});
