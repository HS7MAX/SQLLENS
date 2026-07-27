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

const META: Record<
  ClauseType,
  { step: number; title: string; color: string }
> = {
  FROM: {
    step: 1,
    title: 'Choose data source',
    color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  },
  JOIN: {
    step: 2,
    title: 'Combine tables',
    color: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
  },
  WHERE: {
    step: 3,
    title: 'Filter rows',
    color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  },
  'GROUP BY': {
    step: 4,
    title: 'Create groups',
    color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  },
  HAVING: {
    step: 5,
    title: 'Filter groups',
    color: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  },
  SELECT: {
    step: 6,
    title: 'Choose output',
    color: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  },
  'ORDER BY': {
    step: 7,
    title: 'Sort results',
    color: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  },
  LIMIT: {
    step: 8,
    title: 'Limit results',
    color: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  },
};

function humanize(value: string): string {
  return value
    .replace(/\bIS NOT NULL\b/gi, 'has a value')
    .replace(/\bIS NULL\b/gi, 'is empty')
    .replace(/\bAND\b/gi, 'and')
    .replace(/\bOR\b/gi, 'or')
    .replace(/\bLIKE\b/gi, 'matches')
    .replace(/!=|<>/g, ' is not equal to ')
    .replace(/>=/g, ' is greater than or equal to ')
    .replace(/<=/g, ' is less than or equal to ')
    .replace(/=/g, ' equals ')
    .replace(/>/g, ' is greater than ')
    .replace(/</g, ' is less than ')
    .replace(/\s+/g, ' ')
    .trim();
}

function explainClause(
  type: ClauseType,
  content: string,
  rawText: string
): string {
  const clean = content.trim();

  switch (type) {
    case 'FROM':
      return `Starts with data from "${clean}".`;

    case 'JOIN': {
      const match = rawText.match(
        /^(?:(LEFT|RIGHT|INNER|FULL|CROSS)\s+)?JOIN\s+([^\s]+)(?:\s+ON\s+(.+))?/i
      );

      if (!match) {
        return `Combines data using ${rawText}.`;
      }

      const joinType = (match[1] || 'INNER').toUpperCase();
      const table = match[2];
      const condition = match[3];

      if (condition) {
        return `Combines data with "${table}" using a ${joinType} JOIN where ${humanize(
          condition
        )}.`;
      }

      return `Combines data with "${table}" using a ${joinType} JOIN.`;
    }

    case 'WHERE':
      return `Keeps only rows where ${humanize(clean)}.`;

    case 'GROUP BY':
      return `Groups rows using "${clean}".`;

    case 'HAVING':
      return `Keeps only grouped results where ${humanize(clean)}.`;

    case 'SELECT':
      if (clean === '*') {
        return 'Returns all available columns.';
      }

      return `Returns the selected fields: ${clean}.`;

    case 'ORDER BY': {
      const descending = /\bDESC\b/i.test(clean);

      const field = clean
        .replace(/\bASC\b/gi, '')
        .replace(/\bDESC\b/gi, '')
        .trim();

      return `Sorts results by "${field}" in ${
        descending ? 'descending' : 'ascending'
      } order.`;
    }

    case 'LIMIT':
      return `Returns at most ${clean} row(s).`;
  }
}

function normalizeType(keyword: string): ClauseType {
  const normalized = keyword
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized.includes('JOIN')) {
    return 'JOIN';
  }

  return normalized as ClauseType;
}

function buildSummary(clauses: ClauseDetail[]): string {
  const select = clauses.find((c) => c.type === 'SELECT');
  const from = clauses.find((c) => c.type === 'FROM');
  const where = clauses.find((c) => c.type === 'WHERE');
  const order = clauses.find((c) => c.type === 'ORDER BY');
  const limit = clauses.find((c) => c.type === 'LIMIT');

  if (!select || !from) {
    return 'SQLLens broke this query into its logical execution steps.';
  }

  const fields = select.rawText.replace(/^SELECT\s+/i, '').trim();
  const table = from.rawText.replace(/^FROM\s+/i, '').trim();

  let summary =
    fields === '*'
      ? `Get all columns from ${table}`
      : `Get ${fields} from ${table}`;

  if (where) {
    const condition = where.rawText.replace(/^WHERE\s+/i, '');

    summary += ` where ${humanize(condition)}`;
  }

  if (order) {
    const ordering = order.rawText.replace(/^ORDER\s+BY\s+/i, '');

    summary += `, sorted by ${ordering}`;
  }

  if (limit) {
    const amount = limit.rawText.replace(/^LIMIT\s+/i, '');

    summary += `, limited to ${amount} rows`;
  }

  return `${summary}.`;
}

export function parseSQL(sqlQuery: string): ParsedSQLResult {
  const sql = sqlQuery.trim().replace(/;+\s*$/, '');

  if (!sql) {
    return {
      isValid: false,
      isSelectQuery: false,
      error: 'Paste a SQL SELECT query to get started.',
      summary: '',
      clauses: [],
    };
  }

  if (!/^SELECT\b/i.test(sql)) {
    return {
      isValid: false,
      isSelectQuery: false,
      error: 'SQLLens v1 currently supports SELECT queries only.',
      summary: '',
      clauses: [],
    };
  }

  const clauseRegex =
    /\b(SELECT|FROM|(?:LEFT\s+|RIGHT\s+|INNER\s+|FULL\s+|CROSS\s+)?JOIN|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/gi;

  const matches: { index: number; keyword: string }[] = [];

  let match: RegExpExecArray | null;

  while ((match = clauseRegex.exec(sql)) !== null) {
    matches.push({
      index: match.index,
      keyword: match[0],
    });
  }

  const hasFrom = matches.some(
    (item) => normalizeType(item.keyword) === 'FROM'
  );

  if (!hasFrom) {
    return {
      isValid: false,
      isSelectQuery: true,
      error:
        'SQLLens v1 expects a FROM clause. Example: SELECT name FROM users;',
      summary: '',
      clauses: [],
    };
  }

  const clauses: ClauseDetail[] = [];

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];

    const start = current.index + current.keyword.length;
    const end = next ? next.index : sql.length;

    const content = sql.slice(start, end).trim();
    const type = normalizeType(current.keyword);
    const meta = META[type];

    if (!meta) continue;

    const rawText = `${current.keyword} ${content}`.trim();

    clauses.push({
      id: `clause-${i}-${type.toLowerCase().replace(/\s+/g, '-')}`,
      type,
      title: meta.title,
      rawText,
      explanation: explainClause(type, content, rawText),
      logicalStep: meta.step,
      badgeColor: meta.color,
    });
  }

  const logicalClauses = [...clauses].sort(
    (a, b) => a.logicalStep - b.logicalStep
  );

  return {
    isValid: true,
    isSelectQuery: true,
    summary: buildSummary(clauses),
    clauses: logicalClauses,
  };
}
