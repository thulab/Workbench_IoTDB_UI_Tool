import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const repoRoot = process.cwd();
const reportsDir = path.join(repoRoot, 'tests', 'e2e', 'reports');
const htmlReportPath = path.join(repoRoot, 'playwright-report', 'index.html');
const testResultsDir = path.join(repoRoot, 'test-results');
const jsonReportPath = path.join(reportsDir, '.playwright-report.json');
const timestamp = new Date();

function readArgs(argv) {
  const config = {
    reportKey: 'playwright-real-report',
    specs: [],
    headed: false,
    workers: '1',
    project: 'chromium',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    switch (current) {
      case '--report-key':
        config.reportKey = argv[index + 1];
        index += 1;
        break;
      case '--spec':
        config.specs.push(argv[index + 1]);
        index += 1;
        break;
      case '--headed':
        config.headed = true;
        break;
      case '--workers':
        config.workers = argv[index + 1];
        index += 1;
        break;
      case '--project':
        config.project = argv[index + 1];
        index += 1;
        break;
      default:
        break;
    }
  }

  if (!config.specs.length) {
    throw new Error('At least one --spec must be provided.');
  }

  return config;
}

function statExists(targetPath) {
  try {
    statSync(targetPath);
    return true;
  } catch {
    return false;
  }
}

function walkFiles(dirPath) {
  if (!statExists(dirPath)) {
    return [];
  }

  const files = [];
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function cleanOldArtifacts() {
  rmSync(testResultsDir, { recursive: true, force: true });
  rmSync(jsonReportPath, { force: true });
}

function toPosixFilePath(targetPath) {
  return targetPath.replace(/\\/g, '/');
}

function stripAnsi(text) {
  return text.replace(/\u001B\[[0-9;]*m/g, '');
}

function formatDuration(durationMs) {
  if (durationMs >= 1000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }

  return `${durationMs}ms`;
}

function normalizeStatus(status) {
  if (status === 'passed') {
    return '通过';
  }

  if (status === 'skipped') {
    return '跳过';
  }

  if (status === 'flaky') {
    return '不稳定';
  }

  if (status === 'timedOut') {
    return '超时';
  }

  if (status === 'interrupted') {
    return '中断';
  }

  return '失败';
}

function pickLastResult(testEntry) {
  if (!Array.isArray(testEntry.results) || !testEntry.results.length) {
    return null;
  }

  return testEntry.results[testEntry.results.length - 1];
}

function collectResultsFromSuites(suites, projectName, parentTitles = [], inheritedFile = '') {
  const collected = [];

  for (const suite of suites ?? []) {
    const file = suite.file || inheritedFile;
    const nextTitles = suite.title ? [...parentTitles, suite.title] : parentTitles;

    if (Array.isArray(suite.specs)) {
      for (const spec of suite.specs) {
        const matchingTests = (spec.tests ?? []).filter((testEntry) => {
          if (!projectName) {
            return true;
          }

          return testEntry.projectName === projectName;
        });

        for (const testEntry of matchingTests) {
          const lastResult = pickLastResult(testEntry);
          const errors = (lastResult?.errors ?? [])
            .map((error) => stripAnsi(error?.message || error?.value || ''))
            .filter(Boolean);
          const suiteTitle = nextTitles.filter((title) => !title.includes('.spec.')).join(' - ');

          collected.push({
            file: spec.file || file || '',
            suiteTitle,
            title: spec.title || '(未命名用例)',
            projectName: testEntry.projectName || projectName,
            status: lastResult?.status || (spec.ok ? 'passed' : 'failed'),
            duration: formatDuration(lastResult?.duration ?? 0),
            errors,
          });
        }
      }
    }

    collected.push(...collectResultsFromSuites(suite.suites, projectName, nextTitles, file));
  }

  return collected;
}

function loadPlaywrightJsonResults(projectName) {
  if (!statExists(jsonReportPath)) {
    throw new Error(`Playwright JSON report was not generated: ${jsonReportPath}`);
  }

  const content = readFileSync(jsonReportPath, 'utf8');
  const parsed = JSON.parse(content);
  const results = collectResultsFromSuites(parsed.suites ?? [], projectName);
  const stats = parsed.stats ?? {};

  return {
    results,
    stats,
  };
}

function groupByFile(results) {
  const grouped = new Map();

  for (const result of results) {
    const fileKey = result.file || '(unknown-file)';
    if (!grouped.has(fileKey)) {
      grouped.set(fileKey, []);
    }
    grouped.get(fileKey).push(result);
  }

  return grouped;
}

function collectFailureArtifacts() {
  return walkFiles(testResultsDir)
    .filter((file) => /\.(png|webm|md)$/i.test(file))
    .filter((file) => !file.endsWith('.last-run.json'))
    .sort((left, right) => left.localeCompare(right));
}

function buildSummary(stats, results, exitCode) {
  const passed = typeof stats.expected === 'number' ? stats.expected : results.filter((item) => item.status === 'passed').length;
  const failed =
    typeof stats.unexpected === 'number'
      ? stats.unexpected
      : results.filter((item) => !['passed', 'skipped'].includes(item.status)).length;
  const skipped = typeof stats.skipped === 'number' ? stats.skipped : results.filter((item) => item.status === 'skipped').length;
  const flaky = typeof stats.flaky === 'number' ? stats.flaky : results.filter((item) => item.status === 'flaky').length;
  const total = results.length || passed + failed + skipped + flaky;
  const duration = typeof stats.duration === 'number' ? `${(stats.duration / 1000).toFixed(1)}s` : '未知';

  return {
    total,
    passed,
    failed,
    skipped,
    flaky,
    duration,
    conclusion: exitCode === 0 ? '通过' : '失败',
  };
}

function buildMarkdownReport({
  reportBaseName,
  latestReportName,
  reportDatePart,
  reportDisplayTime,
  cliConfig,
  exitCode,
  results,
  stats,
  artifacts,
}) {
  const summary = buildSummary(stats, results, exitCode);
  const grouped = groupByFile(results);
  const sections = [];

  sections.push('# Workbench 测试报告');
  sections.push('');
  sections.push('## 执行信息');
  sections.push('');
  sections.push(`- 报告名称: \`${reportBaseName}\``);
  sections.push(`- 执行时间: ${reportDatePart} ${reportDisplayTime}`);
  sections.push('- 执行环境: Workbench + IoTDB');
  sections.push('- Workbench 地址: `http://127.0.0.1:9190`');
  sections.push(`- 报告类型: \`${cliConfig.reportKey}\``);
  sections.push(`- 是否 Headed: \`${cliConfig.headed ? '是' : '否'}\``);
  sections.push(`- 浏览器项目: \`${cliConfig.project}\``);
  sections.push('- 编码策略: `UTF-8 Markdown + Playwright JSON 结果`');
  sections.push('- 执行命令:');
  sections.push('');
  sections.push('```powershell');
  sections.push(
    `$env:PLAYWRIGHT_REAL_BACKEND='true'; node node_modules/playwright/cli.js test ${cliConfig.specs.join(' ')} --project=${cliConfig.project} --workers=${cliConfig.workers}${cliConfig.headed ? ' --headed' : ''}`,
  );
  sections.push('```');
  sections.push('');

  sections.push('## 总体结果');
  sections.push('');
  sections.push(`- 总用例数: \`${summary.total}\``);
  sections.push(`- 通过数: \`${summary.passed}\``);
  sections.push(`- 失败数: \`${summary.failed}\``);
  sections.push(`- 跳过数: \`${summary.skipped}\``);
  sections.push(`- Flaky 数: \`${summary.flaky}\``);
  sections.push(`- 总耗时: \`${summary.duration}\``);
  sections.push(`- 结论: \`${summary.conclusion}\``);
  sections.push('');

  sections.push('## 用例结果明细');
  sections.push('');
  if (!results.length) {
    sections.push('- 本次未解析到任何用例结果，请检查 Playwright JSON 报告是否正常生成。');
    sections.push('');
  } else {
    for (const [file, fileResults] of grouped.entries()) {
      sections.push(`### ${path.basename(file)}`);
      sections.push('');
      fileResults.forEach((item, index) => {
        sections.push(`${index + 1}. ${item.title}`);
        sections.push(`   结果: ${normalizeStatus(item.status)}`);
        sections.push(`   所属套件: ${item.suiteTitle || '-'}`);
        sections.push(`   浏览器项目: ${item.projectName || '-'}`);
        sections.push(`   耗时: ${item.duration}`);
        if (item.errors.length) {
          sections.push(`   失败信息: ${item.errors[0].split('\n')[0]}`);
        }
      });
      sections.push('');
    }
  }

  sections.push('## 失败截图与产物');
  sections.push('');
  if (!artifacts.length) {
    sections.push('- 本次执行无失败产物。');
  } else {
    sections.push('- 以下文件来自本次失败用例自动产物。');
    sections.push('');
    artifacts.forEach((artifactPath, index) => {
      const normalizedPath = toPosixFilePath(artifactPath);
      sections.push(`${index + 1}. \`${artifactPath}\``);
      if (/\.png$/i.test(normalizedPath)) {
        sections.push(`   ![failed-screenshot-${index + 1}](${normalizedPath})`);
      }
    });
  }
  sections.push('');

  sections.push('## 报告文件');
  sections.push('');
  sections.push(`- Markdown 报告: \`tests/e2e/reports/${reportBaseName}\``);
  sections.push(`- Markdown 最新版: \`tests/e2e/reports/${latestReportName}\``);
  sections.push('- Playwright HTML 报告: `playwright-report/index.html`');
  sections.push('- Playwright JSON 报告: `tests/e2e/reports/.playwright-report.json`');
  sections.push('- 失败产物目录: `test-results/`');
  sections.push('');

  return sections.join('\n');
}

async function runPlaywright(playwrightArgs) {
  return await new Promise((resolve) => {
    const playwrightCli = path.join(repoRoot, 'node_modules', 'playwright', 'cli.js');
    const child = spawn(process.execPath, [playwrightCli, ...playwrightArgs], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PLAYWRIGHT_REAL_BACKEND: 'true',
        PLAYWRIGHT_JSON_OUTPUT_FILE: jsonReportPath,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString('utf8');
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString('utf8');
      stderr += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

const cliConfig = readArgs(process.argv.slice(2));
const reportDatePart = [timestamp.getFullYear(), timestamp.getMonth() + 1, timestamp.getDate()].join('-');
const reportTimePart = [
  String(timestamp.getHours()).padStart(2, '0'),
  String(timestamp.getMinutes()).padStart(2, '0'),
  String(timestamp.getSeconds()).padStart(2, '0'),
].join('-');
const reportDisplayTime = [
  String(timestamp.getHours()).padStart(2, '0'),
  String(timestamp.getMinutes()).padStart(2, '0'),
  String(timestamp.getSeconds()).padStart(2, '0'),
].join(':');
const reportBaseName = `Workbench-report_${reportDatePart}_${reportTimePart}.md`;
const latestReportName = 'Workbench-report_latest.md';
const playwrightArgs = [
  'test',
  ...cliConfig.specs,
  `--project=${cliConfig.project}`,
  `--workers=${cliConfig.workers}`,
  ...(cliConfig.headed ? ['--headed'] : []),
];

cleanOldArtifacts();
mkdirSync(reportsDir, { recursive: true });

const result = await runPlaywright(playwrightArgs);
const { results, stats } = loadPlaywrightJsonResults(cliConfig.project);
const artifacts = result.code === 0 ? [] : collectFailureArtifacts();
const reportContent = buildMarkdownReport({
  reportBaseName,
  latestReportName,
  reportDatePart,
  reportDisplayTime,
  cliConfig,
  exitCode: result.code,
  results,
  stats,
  artifacts,
});

const datedReportPath = path.join(reportsDir, reportBaseName);
const latestReportPath = path.join(reportsDir, latestReportName);

writeFileSync(datedReportPath, `\uFEFF${reportContent}`, 'utf8');
writeFileSync(latestReportPath, `\uFEFF${reportContent}`, 'utf8');

console.log(`\nMarkdown report written to: ${datedReportPath}`);
console.log(`Latest markdown report written to: ${latestReportPath}`);
console.log(`JSON report available at: ${jsonReportPath}`);
console.log(`HTML report available at: ${htmlReportPath}`);
if (artifacts.length) {
  console.log(`Failure artifacts collected: ${artifacts.length}`);
}

process.exit(result.code);
