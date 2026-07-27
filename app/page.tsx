'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Copy,
  Database,
  Layers3,
  Search,
  Sparkles,
  Terminal,
  Trash2,
} from 'lucide-react';

import { parseSQL } from '@/lib/sqlParser';

const SAMPLE_QUERIES = [
  {
    label: 'Active Users',
    sql: `SELECT name, email
FROM users
WHERE active = true
ORDER BY name
LIMIT 50;`,
  },
  {
    label: 'Revenue',
    sql: `SELECT customers.name, COUNT(orders.id) AS total_orders, SUM(orders.amount) AS total_spent
FROM customers
INNER JOIN orders ON customers.id = orders.customer_id
WHERE orders.status = 'completed'
GROUP BY customers.id, customers.name
ORDER BY total_spent DESC
LIMIT 10;`,
  },
  {
    label: 'Inventory',
    sql: `SELECT category, AVG(price) AS avg_price, COUNT(*) AS item_count
FROM products
WHERE stock_quantity > 0
GROUP BY category
HAVING COUNT(*) > 5
ORDER BY avg_price DESC;`,
  },
];

export default function SQLLensPage() {
  const [query, setQuery] = useState(SAMPLE_QUERIES[0].sql);
  const [copied, setCopied] = useState(false);
  const [activeClause, setActiveClause] = useState<string | null>(null);

  const result = useMemo(() => parseSQL(query), [query]);

  async function copyQuery() {
    if (!query) return;

    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  }

  function clearQuery() {
    setQuery('');
    setActiveClause(null);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-[-180px] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[360px] w-[360px] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
              <Search className="h-5 w-5 text-cyan-400" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold tracking-tight text-white">
                  SQLLens
                </h1>

                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                  v1
                </span>
              </div>

              <p className="hidden text-xs text-slate-500 sm:block">
                SQL made visual.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hidden sm:inline">Runs locally</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 pb-8 pt-12 text-center sm:px-6 sm:pt-16">
        <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          Visual SQL Query Explainer
        </div>

        <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
          Understand SQL
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {' '}
            at a glance.
          </span>
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
          Paste a SELECT query and SQLLens breaks it into logical execution
          steps with simple explanations.
        </p>
      </section>

      <section className="relative mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-12">
        {/* SQL Editor */}
        <div className="space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Code2 className="h-4 w-4 text-cyan-400" />
              SQL Input
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyQuery}
                disabled={!query}
                className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 disabled:opacity-40"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <button
                onClick={clearQuery}
                disabled={!query}
                className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.map((sample) => (
              <button
                key={sample.label}
                onClick={() => setQuery(sample.sql)}
                className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-400 transition hover:border-cyan-500/30 hover:text-cyan-300"
              >
                {sample.label}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-3 font-mono text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                query.sql
              </span>

              <span>{query.length} chars</span>
            </div>

            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              spellCheck={false}
              placeholder="SELECT * FROM users WHERE active = true;"
              className="min-h-[360px] w-full resize-none bg-transparent p-5 font-mono text-sm leading-7 text-cyan-200 outline-none placeholder:text-slate-700 lg:min-h-[470px]"
            />
          </div>

          {result.isValid && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Query map
              </p>

              <div className="flex flex-wrap gap-2 font-mono text-xs">
                {result.clauses.map((clause) => (
                  <button
                    key={clause.id}
                    onMouseEnter={() => setActiveClause(clause.id)}
                    onMouseLeave={() => setActiveClause(null)}
                    className={`rounded-lg border px-2.5 py-1.5 transition ${
                      activeClause === clause.id
                        ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {clause.type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="space-y-5 lg:col-span-7">
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-900/80 to-slate-900 p-6">
            <div className="absolute right-[-50px] top-[-50px] h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-300">
              <BookOpen className="h-4 w-4" />
              Plain English
            </div>

            {result.isValid ? (
              <p className="relative text-lg font-medium leading-8 text-white sm:text-xl">
                {result.summary}
              </p>
            ) : (
              <p className="text-sm leading-6 text-slate-500">
                Enter a valid SELECT query to generate an explanation.
              </p>
            )}
          </div>

          {!result.isValid && result.error && (
            <div className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

              <div>
                <p className="font-semibold">Unable to analyze query</p>
                <p className="mt-1 text-red-300/80">{result.error}</p>
              </div>
            </div>
          )}

          {result.isValid && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Layers3 className="h-4 w-4 text-indigo-400" />
                  Execution Flow
                </div>

                <span className="font-mono text-xs text-slate-600">
                  {result.clauses.length} steps
                </span>
              </div>

              <div className="space-y-3">
                {result.clauses.map((clause, index) => {
                  const active = activeClause === clause.id;

                  return (
                    <article
                      key={clause.id}
                      onMouseEnter={() => setActiveClause(clause.id)}
                      onMouseLeave={() => setActiveClause(null)}
                      className={`group rounded-2xl border p-4 transition duration-200 ${
                        active
                          ? 'translate-x-1 border-cyan-400/50 bg-slate-800 shadow-xl shadow-cyan-950/20'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-950 font-mono text-xs font-bold text-slate-400">
                          {String(index + 1).padStart(2, '0')}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-md border px-2 py-0.5 font-mono text-xs font-bold ${clause.badgeColor}`}
                            >
                              {clause.type}
                            </span>

                            <span className="text-xs text-slate-500">
                              {clause.title}
                            </span>
                          </div>

                          <p className="text-sm leading-6 text-slate-300">
                            {clause.explanation}
                          </p>

                          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 font-mono text-xs text-cyan-300">
                            {clause.rawText}
                          </div>
                        </div>

                        {index < result.clauses.length - 1 && (
                          <ArrowRight className="mt-2 hidden h-4 w-4 shrink-0 text-slate-700 sm:block" />
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {/* Privacy */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-800/70 bg-slate-900/30 p-4">
            <Database className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

            <div>
              <p className="text-xs font-semibold text-slate-300">
                Private by design
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                SQLLens analyzes queries directly in your browser. No database
                connection or AI API is required.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-slate-900 py-7 text-center text-xs text-slate-600">
        Built to make SQL easier to understand.
      </footer>
    </main>
  );
}
