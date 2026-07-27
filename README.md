# SQLLens 🔍

### Understand SQL at a glance.

SQLLens turns SQL `SELECT` queries into simple visual execution steps and plain-English explanations.

> SQL made visual. Break down queries, understand execution, learn faster.

## ✨ Features

* 🔍 Break SQL queries into logical clauses
* 🧠 Plain-English explanations
* 🔄 Visual SQL execution order
* 🎯 Supports SELECT, FROM, JOIN, WHERE, GROUP BY, HAVING, ORDER BY and LIMIT
* ⚡ Instant client-side analysis
* 🔒 No database connection required
* 🤖 No AI API required
* 🌙 Modern developer-focused dark UI

## 🚀 Example

Input:

```sql
SELECT name, email
FROM users
WHERE active = true
ORDER BY name
LIMIT 50;
```

SQLLens breaks it down into:

```text
1. FROM
   Start with data from users

2. WHERE
   Keep only active users

3. SELECT
   Return name and email

4. ORDER BY
   Sort results by name

5. LIMIT
   Return at most 50 rows
```

## 🧠 Why SQLLens?

SQL queries are written in one order but logically processed in another.

SQLLens makes that execution flow easier to understand visually, making it useful for developers, students, and anyone learning SQL.

## 🛠️ Tech Stack

* Next.js
* TypeScript
* Tailwind CSS
* Lucide React

## 💻 Run Locally

```bash
git clone https://github.com/HS7MAX/sqllens.git
cd sqllens
npm install
npm run dev
```

Then open `http://localhost:3000`.

## 🗺️ Roadmap

* [ ] Advanced SQL parsing
* [ ] Subquery support
* [ ] CTE support
* [ ] Interactive JOIN visualization
* [ ] Query complexity score
* [ ] Multiple SQL dialects
* [ ] Shareable query explanations

## 🤝 Contributing

Contributions, ideas, and bug reports are welcome. Feel free to open an issue or submit a pull request.

## 📄 License

MIT License
