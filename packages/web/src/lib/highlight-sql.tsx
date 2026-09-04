import type { ReactNode } from "react"

type TokenKind =
  | "keyword"
  | "type"
  | "string"
  | "number"
  | "ident"
  | "punct"
  | "plain"

interface Token {
  kind: TokenKind
  text: string
  start: number
}

const KEYWORDS = new Set([
  "CREATE",
  "TABLE",
  "TYPE",
  "AS",
  "ENUM",
  "PRIMARY",
  "KEY",
  "FOREIGN",
  "REFERENCES",
  "NOT",
  "NULL",
  "UNIQUE",
  "DEFAULT",
  "INDEX",
  "ON",
  "DELETE",
  "UPDATE",
  "CASCADE",
  "RESTRICT",
  "SET",
  "NOW",
])

const TYPES = new Set([
  "INTEGER",
  "INT",
  "BIGINT",
  "SMALLINT",
  "SERIAL",
  "BIGSERIAL",
  "TEXT",
  "VARCHAR",
  "CHAR",
  "BOOLEAN",
  "BOOL",
  "TIMESTAMP",
  "TIMESTAMPTZ",
  "DATE",
  "TIME",
  "DECIMAL",
  "NUMERIC",
  "REAL",
  "DOUBLE",
  "PRECISION",
  "FLOAT",
  "JSONB",
  "JSON",
  "BYTEA",
  "UUID",
])

const TOKEN_CLASS: Record<TokenKind, string> = {
  keyword: "text-violet-700 dark:text-violet-300",
  type: "text-amber-700 dark:text-amber-400",
  string: "text-emerald-700 dark:text-emerald-400",
  number: "text-sky-700 dark:text-sky-400",
  ident: "text-foreground",
  punct: "text-muted-foreground",
  plain: "text-foreground",
}

function classifyWord(word: string): TokenKind {
  const upper = word.toUpperCase()
  if (KEYWORDS.has(upper)) {
    return "keyword"
  }
  if (TYPES.has(upper)) {
    return "type"
  }
  if (/^\d+(\.\d+)?$/.test(word)) {
    return "number"
  }
  return "ident"
}

function charAt(sql: string, index: number): string {
  return sql.charAt(index)
}

/** Lex SQL DDL into simple highlight tokens (keywords, types, strings, etc.). */
export function tokenizeSql(sql: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < sql.length) {
    const ch = charAt(sql, i)

    if (ch === "'" || ch === '"') {
      const quote = ch
      let j = i + 1
      while (j < sql.length) {
        if (charAt(sql, j) === quote) {
          if (charAt(sql, j + 1) === quote) {
            j += 2
            continue
          }
          j += 1
          break
        }
        j += 1
      }
      tokens.push({
        kind: quote === "'" ? "string" : "ident",
        text: sql.slice(i, j),
        start: i,
      })
      i = j
      continue
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1
      while (j < sql.length && /[A-Za-z0-9_]/.test(charAt(sql, j))) {
        j += 1
      }
      if (charAt(sql, j) === "[" && charAt(sql, j + 1) === "]") {
        const word = sql.slice(i, j)
        tokens.push({ kind: classifyWord(word), text: word, start: i })
        tokens.push({ kind: "punct", text: "[]", start: j })
        i = j + 2
        continue
      }
      const word = sql.slice(i, j)
      tokens.push({ kind: classifyWord(word), text: word, start: i })
      i = j
      continue
    }

    if (/\d/.test(ch)) {
      let j = i + 1
      while (j < sql.length && /[\d.]/.test(charAt(sql, j))) {
        j += 1
      }
      tokens.push({ kind: "number", text: sql.slice(i, j), start: i })
      i = j
      continue
    }

    if (/[(),;.]/.test(ch)) {
      tokens.push({ kind: "punct", text: ch, start: i })
      i += 1
      continue
    }

    let j = i + 1
    while (
      j < sql.length &&
      !/[A-Za-z0-9_'"]/.test(charAt(sql, j)) &&
      !/[(),;.]/.test(charAt(sql, j))
    ) {
      j += 1
    }
    tokens.push({ kind: "plain", text: sql.slice(i, j), start: i })
    i = j
  }

  return tokens
}

export function renderHighlightedSql(sql: string): ReactNode[] {
  return tokenizeSql(sql).map((token) => (
    <span
      key={`${token.start}:${token.kind}:${token.text.length}`}
      className={TOKEN_CLASS[token.kind]}
    >
      {token.text}
    </span>
  ))
}
