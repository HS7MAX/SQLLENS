export type ClauseType =
  | 'FROM'
  | 'JOIN'
  | 'WHERE'
  | 'GROUP BY'
  | 'HAVING'
  | 'SELECT'
  | 'ORDER BY'
  | 'LIMIT';

export interface ClauseDetail {
  id: string;
  type: ClauseType;
  title: string;
  rawText: string;
  explanation: string;
  logicalStep: number;
  badgeColor: string;
}

export interface ParsedSQLResult {
  isValid: boolean;
  isSelectQuery: boolean;
  error?: string;
  summary: string;
  clauses: ClauseDetail[];
}

const CLAUSE_META: Record<
  ClauseType,
  {
    step: number;
    title: string;
    color: string;
  }
> = {
  FROM: {
    step: 1,
    title: 'Choose data source',
    color:
      'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  },

  JOIN: {
    step: 2,
    title: 'Combine tables',
    color:
      'bg-teal-500/10 text-teal-300 border-teal-500/30',
  },

  WHERE: {
    step: 3,
    title: 'Filter rows',
    color:
      'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  },

  'GROUP BY': {
    step: 4,
    title: 'Create groups',
    color:
      'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  },

  HAVING: {
    step: 5,
    title: 'Filter groups',
    color:
      'bg-purple-500/10 text-purple-300 border-purple-500/30',
  },

  SELECT: {
    step: 6,
    title: 'Choose output',
    color:
      'bg-amber-500/10 text-amber-300 border-amber-500/30',
  },

  'ORDER BY': {
    step: 7,
    title: 'Sort results',
    color:
      'bg-rose-500/10 text-rose-300 border-rose-500/30',
  },

  LIMIT: {
    step: 8,
    title: 'Limit results',
    color:
      'bg-sky-500/10 text-sky-300 border-sky-500/30',
  },
};

/**
 * Makes SQL expressions easier to read without pretending
 * to fully understand every possible SQL expression.
 */
function humanizeExpression(expression: string): string {
  return expression
    .replace(/\bIS\s+NOT\s+NULL\b/gi, 'has a value')
    .replace(/\bIS\s+NULL\b/gi, 'is empty')
    .replace(/\bNOT\s+IN\b/gi, 'is not in')
    .replace(/\bIN\b/gi, 'is in')
    .replace(/\bILIKE\b/gi, 'matches, ignoring letter case')
    .replace(/\bLIKE\b/gi, 'matches')
    .replace(/\bBETWEEN\b/gi, 'is between')
    .replace(/\bAND\b/gi, 'and')
    .replace(/\bOR\b/gi, 'or')
    .replace(/<>|!=/g, ' is not equal to ')
    .replace(/>=/g, ' is greater than or equal to ')
    .replace(/<=/g, ' is less than or equal to ')
    .replace(/(?<![<>!])=(?!=)/g, ' equals ')
    .replace(/>/g, ' is greater than ')
    .replace(/</g, ' is less than ')
    .replace(/\s+/g, ' ')
    .trim();
}

function removeAlias(value: string): string {
  const cleaned = value.trim();

  // users AS u
  const withAs = cleaned.match(/^([^\s]+)\s+AS\s+[^\s]+$/i);

  if (withAs) {
    return withAs[1];
  }

  // users u
  const simpleAlias = cleaned.match(/^([^\s]+)\s+[A-Za-z_][\w$]*$/);

  if (simpleAlias) {
    return simpleAlias[1];
  }

  return cleaned;
}

function splitCommaSeparated(value: string): string[] {
  const items: string[] = [];

  let current = '';
  let depth = 0;
  let quote: string | null = null;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];

    if (quote) {
      current += char;

      if (char === quote && value[i - 1] !== '\\') {
        quote = null;
      }

      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      current += char;
      continue;
    }

    if (char === '(') {
      depth++;
      current += char;
      continue;
    }

    if (char === ')') {
      depth = Math.max(0, depth - 1);
      current += char;
      continue;
    }

    if (char === ',' && depth === 0) {
      if (current.trim()) {
        items.push(current.trim());
      }

      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    items.push(current.trim());
  }

  return items;
}

function explainSelect(content: string): string {
  let cleaned = content.trim();

  const distinct = /^DISTINCT\b/i.test(cleaned);

  cleaned = cleaned.replace(/^DISTINCT\s+/i, '');

  if (cleaned === '*') {
    return distinct
      ? 'Returns all columns while removing duplicate result rows.'
      : 'Returns all available columns from the resulting data.';
  }

  const columns = splitCommaSeparated(cleaned);

  if (columns.length === 1) {
    return `${
      distinct ? 'Returns unique values for' : 'Returns'
    } "${columns[0]}".`;
  }

  const preview = columns.slice(0, 4).join(', ');

  if (columns.length > 4) {
    return `${
      distinct ? 'Returns unique combinations of' : 'Returns'
    } ${columns.length} selected fields, including ${preview}, and ${
      columns.length - 4
    } more.`;
  }

  return `${
    distinct ? 'Returns unique combinations of' : 'Returns'
  } ${columns.length} fields: ${preview}.`;
}

function explainJoin(content: string): string {
  const match = content.match(
    /^(?:(LEFT|RIGHT|INNER|FULL|CROSS)\s+)?JOIN\s+([^\s]+)(?:\s+(?:AS\s+)?([A-Za-z_][\w$]*))?(?:\s+ON\s+([\s\S]+))?$/i
  );

  if (!match) {
    return `Combines rows using ${content}.`;
  }

  const joinType = (match[1] || 'INNER').toUpperCase();
  const table = match[2];
  const condition = match[4];

  if (joinType === 'CROSS') {
    return `Combines every row with every row from "${table}" using a CROSS JOIN.`;
  }

  if (!condition) {
    return `Combines data with "${table}" using a ${joinType} JOIN.`;
  }

  return `Combines data with "${table}" using a ${joinType} JOIN where ${humanizeExpression(
    condition
  )}.`;
}

function explainClause(
  type: ClauseType,
  content: string,
  fullRawText: string
): string {
  const clean = content.trim();

  switch (type) {
    case 'FROM': {
      const table = removeAlias(clean);

      return `Starts with rows from "${table}".`;
    }

    case 'JOIN':
      return explainJoin(fullRawText);

    case 'WHERE':
      return `Keeps only rows where ${humanizeExpression(clean)}.`;

    case 'GROUP BY': {
      const fields = splitCommaSeparated(clean);

      if (fields.length === 1) {
        return `Groups rows that share the same "${fields[0]}" value.`;
      }

      return `Groups rows using ${fields.join(', ')}.`;
    }

    case 'HAVING':
      return `After grouping, keeps only groups where ${humanizeExpression(
        clean
      )}.`;

    case 'SELECT':
      return explainSelect(clean);

    case 'ORDER BY': {
      const fields = splitCommaSeparated(clean);

      if (fields.length === 1) {
        const descending = /\bDESC\b/i.test(fields[0]);

        const field = fields[0]
          .replace(/\bASC\b/gi, '')
          .replace(/\bDESC\b/gi, '')
          .trim();

        return `Sorts the final results by "${field}" in ${
          descending ? 'descending' : 'ascending'
        } order.`;
      }

      return `Sorts the final results using ${fields.join(', ')}.`;
    }

    case 'LIMIT': {
      const number = clean.match(/\d+/)?.[0];

      return number
        ? `Returns at most ${number} row${number === '1' ? '' : 's'}.`
        : `Restricts how many rows are returned using "${clean}".`;
    }

    default:
      return clean;
  }
}

interface ClauseMatch {
  index: number;
  keyword: string;
}

function normalizeClauseType(keyword: string): ClauseType {
  const normalized = keyword
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

  if (normalized.includes('JOIN')) {
    return 'JOIN';
  }

  return normalized as ClauseType;
}

function buildSummary(clauses: ClauseDetail[]): string {
  const select = clauses.find((clause) => clause.type === 'SELECT');
  const from = clauses.find((clause) => clause.type === 'FROM');
  const joinCount = clauses.filter(
    (clause) => clause.type === 'JOIN'
  ).length;

  const where = clauses.find((clause) => clause.type === 'WHERE');
  const group = clauses.find((clause) => clause.type === 'GROUP BY');
  const order = clauses.find((clause) => clause.type === 'ORDER BY');
  const limit = clauses.find((clause) => clause.type === 'LIMIT');

  if (!select || !from) {
    return 'SQLLens detected a SELECT query and broke it into its logical execution steps.';
  }

  const fromContent = from.rawText
    .replace(/^FROM\s+/i, '')
    .trim();

  const table = removeAlias(fromContent);

  const selectContent = select.rawText
    .replace(/^SELECT\s+/i, '')
    .replace(/^DISTINCT\s+/i, '')
    .trim();

  let summary =
    selectContent === '*'
      ? `Get data from ${table}`
      : `Get ${selectContent} from ${table}`;

  if (joinCount === 1) {
    summary += ' and combine it with another table';
  } else if (joinCount > 1) {
    summary += ` and combine it with ${joinCount} additional tables`;
  }

  if (where) {
    const condition = where.rawText.replace(/^WHERE\s+/i, '');

    summary += `, keeping only rows where ${humanizeExpression(condition)}`;
  }

  if (group) {
    const groupFields = group.rawText.replace(/^GROUP\s+BY\s+/i, '');

    summary += `, grouped by ${groupFields}`;
  }

  if (order) {
    const orderValue = order.rawText.replace(/^ORDER\s+BY\s+/i, '');

    summary += `, then sorted by ${orderValue}`;
  }

  if (limit) {
    const limitValue = limit.rawText.replace(/^LIMIT\s+/i, '');

    summary += `, returning at most ${limitValue} rows`;
  }

  return `${summary}.`;
}

export function parseSQL(sqlQuery: string): ParsedSQLResult {
  const trimmed = sqlQuery.trim().replace(/;+\s*$/, '');

  if (!trimmed) {
    return {
      isValid: false,
      isSelectQuery: false,
      error: 'Your query is empty. Paste a SELECT query to analyze it.',
      summary: '',
      clauses: [],
    };
  }

  if (!/^SELECT\b/i.test(trimmed)) {
    return {
      isValid: false,
      isSelectQuery: false,
      error:
        'SQLLens v1 currently supports SELECT queries only. Try a query beginning with SELECT.',
      summary: '',
      clauses: [],
    };
  }

  /**
   * SQLLens v1 is intentionally lightweight.
   *
   * This detects common top-level SELECT clauses.
   * It is not intended to replace a full SQL grammar parser.
   */
  const clauseRegex =
    /\b(SELECT|FROM|(?:LEFT\s+|RIGHT\s+|INNER\s+|FULL\s+|CROSS\s+)?JOIN|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/gi;

  const matches: ClauseMatch[] = [];

  let match: RegExpExecArray | null;

  while ((match = clauseRegex.exec(trimmed)) !== null) {
    matches.push({
      index: match.index,
      keyword: match[0],
    });
  }

  const hasSelect = matches.some(
    (item) => normalizeClauseType(item.keyword) === 'SELECT'
  );

  const hasFrom = matches.some(
    (item) => normalizeClauseType(item.keyword) === 'FROM'
  );

  if (!hasSelect) {
    return {
      isValid: false,
      isSelectQuery: true,
      error: 'SQLLens could not detect a valid SELECT clause.',
      summary: '',
      clauses: [],
    };
  }

  if (!hasFrom) {
    return {
      isValid: false,
      isSelectQuery: true,
      error:
        'SQLLens v1 expects a FROM clause. Try something like SELECT name FROM users.',
      summary: '',
      clauses: [],
    };
  }

  const clauses: ClauseDetail[] = [];

  for (let index = 0; index < matches.length; index++) {
    const current = matches[index];

    const next = matches[index + 1];

    const contentStart =
      current.index + current.keyword.length;

    const contentEnd = next ? next.index : trimmed.length;

    const content = trimmed
      .slice(contentStart, contentEnd)
      .trim();

    const type = normalizeClauseType(current.keyword);

    const meta = CLAUSE_META[type];

    if (!meta) {
      continue;
    }

    const rawText = `${current.keyword} ${content}`.trim();

    clauses.push({
      id: `clause-${index}-${type
        .toLowerCase()
        .replace(/\s+/g, '-')}`,

      type,

      title: meta.title,

      rawText,

      explanation: explainClause(
        type,
        content,
        rawText
      ),

      logicalStep: meta.step,

      badgeColor: meta.color,
    });
  }

  /**
   * SQL is written SELECT -> FROM -> WHERE...
   * but conceptually processed FROM -> WHERE -> SELECT...
   *
   * Sorting here lets SQLLens teach that execution flow.
   */
  const logicalClauses = [...clauses].sort((a, b) => {
    if (a.logicalStep === b.logicalStep) {
      return clauses.indexOf(a) - clauses.indexOf(b);
    }

    return a.logicalStep - b.logicalStep;
  });

  return {
    isValid: true,
    isSelectQuery: true,
    summary: buildSummary(clauses),
    clauses: logicalClauses,
  };
}
