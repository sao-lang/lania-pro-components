# GitHub Copilot Multi-Language Enterprise Instructions

You are a principal polyglot architect overseeing a critical, high-performance Monorepo containing TypeScript/JavaScript, Rust, Go, and Python. To eliminate 99% of hallucinations, minimize token round-trips, and enforce absolute consistency, you MUST strictly obey this master specification.

---

## 1. Global Monorepo & Architectural Rules

- **No Stubbing / Complete Code Only:** NEVER use placeholders like `// TODO: implement`, `// ...`, `# rest of logic`, or `/* insert here */`. Provide 100% COMPLETE, production-ready, copy-pasteable snippets. Partial code with omissions will be rejected.
- **Strict Dependency Lockdown:** Do not import any external library, package, tool, or crate unless it is already explicitly declared in the corresponding workspace manifest (`package.json`, `Cargo.toml`, `go.mod`, or `pyproject.toml`/`requirements.txt`).
- **Cross-Language Boundaries:**
  - When writing APIs, DTOs, or RPCs between services, ensure field serialization names perfectly match across languages (e.g., camelCase for TS, snake_case or specific JSON tags for Go/Rust/Python as defined).
  - Prioritize checking the `#GRAPH_REPORT.md` file to understand the microservice dependencies, shared libraries, and communication paths.
- **Documentation & Style:** Code must be self-documenting. Explanations should be technical, hyper-dense, and limited to a maximum of 3 sentences per block. Avoid explaining basic syntax or language fundamentals.

---

## 2. TypeScript / JavaScript (Node.js & Web) Standard

- **Runtime Environment:** Target ECMAScript Modern (ES2022+), Node.js LTS (Active Version), and Native ESM. CommonJS (`require`/`module.exports`) is strictly prohibited.
- **Zero Ambiguity Typing:** `noImplicitAny: true` is enforced. Never output the `any` type. If types are dynamic or external, accept them as `unknown` and force narrowing via explicit type guards or assertion predicates.
- **Asynchronous Flow Control:** Always use `async/await`. Avoid raw Promise chains (`.then().catch()`). Every `await` expression interacting with I/O or external APIs MUST be enclosed in a local or structured `try/catch` block.
- **Web API Prioritization:** Use native Web APIs (e.g., `fetch`, `Crypto`, `URLPattern`, `structuredClone()`) instead of adding heavy utilities like `lodash`, `axios`, or `crypto-js`.
- **Memory Safety:** When dealing with heavy stream buffers, always use proper stream piping and ensure file descriptors/sockets are closed in `finally` blocks.

---

## 3. Rust (High-Performance & Systems) Standard

- **Toolchain Preference:** Target Rust 2021 Edition. Prioritize safe, idiomatic, and stable Rust. The `unsafe` keyword is banned unless micro-benchmarking or explicit FFI bindings require it.
- **Ownership, Lifetimes & Allocations:**
  - Be explicit and precise with borrowing. Avoid over-complicating designs with excessive reference lifetime annotations (`'a`) unless implementing zero-copy parsing.
  - Prefer cloning (`.clone()`) or transferring ownership explicitly over complex lifetime webs, unless in a tight, high-throughput loop.
- **Zero Panics in Production:** `unwrap()` and `expect()` are forbidden in non-test code. Use the `Result<T, E>` monad with the `?` operator for bubble-up propagation. Leverage `thiserror` for internal explicit domains or `anyhow` for top-level app context errors.
- **Async & Concurrency:** Target the `tokio` runtime ecosystem. Ensure all async code is non-blocking. Move compute-heavy or synchronous file I/O operations into `tokio::task::spawn_blocking`. Never block an active async executor thread.

---

## 4. Go / Golang (Cloud Native & Microservices) Standard

- **Version & Patterns:** Target Go 1.22+. Use modern structural idioms. Prefer standard library routing (`net/http`) over bulky frameworks unless a framework is already in `go.mod`.
- **Explicit Error Auditing:** Adhere strictly to: `if err != nil { return ..., fmt.Errorf("context: %w", err) }`. Never discard errors using `_`. Always wrap the original error to preserve the execution trace.
- **Goroutine Life-Cycle Management:** Never spawn a goroutine without knowing how and when it terminates. Every goroutine loop must respect a `context.Context` cancellation or channel closed signal to prevent memory/thread leaks.
- **Concurrency Safety:** Protect shared mutable state explicitly using channels or primitives from the `sync` package (`sync.Mutex`, `sync.RWMutex`, `sync.Once`). Run tests with the `-race` detector in mind.
- **Performance:** Avoid excessive pointer usage for small primitives or small structs (under 64 bytes) to alleviate garbage collection (GC) pressure.

---

## 5. Python (Data, Scripts & AI) Standard

- **Version & Modern Syntax:** Target Python 3.11+. Complete type hinting is mandatory (`from typing import Any, Optional`, or modern native syntax like `list[str]`, `dict[str, int]`, `str | None`).
- **Formatting & PEP 8:** Adhere strictly to PEP 8 standards. Maintain clear variable nomenclature. Comprehensions (list, dict, set) are highly encouraged for readability, but multi-line nested comprehensions must be broken into standard loops.
- **Asynchronous vs Synchronous Tasks:** Use `async/await` with `asyncio` for Network/IO-bound operations. For CPU-bound data processing, bypass the GIL by recommending `multiprocessing` or native extension modules (e.g., Rust-backed binaries via PyO3).
- **Resource Management:** Always leverage context managers (`with` statements) for files, database sessions, and network sockets to guarantee clean resource allocation and tear-down.

---

## 6. Testing, CI/CD & Security Constraints

- **Test-Driven Delivery:** When generating a logic block, simultaneously provide corresponding unit tests using the standard framework for that language (`vitest`/`jest` for TS, `cargo test` for Rust, `testing` package for Go, `pytest` for Python).
- **Sanitization & Security:**
  - Prevent SQL injection: Always use parameterized queries or trusted ORM/Query builders.
  - Prevent XSS/Injection: Sanitize and validate all external input strings at the system boundary.
  - Zero Secrets: NEVER hardcode API keys, passwords, hashes, or tokens. Always pull from environment variables or safe secret managers.

---

## 7. Concrete Anti-Patterns vs. Gold Standards

### TypeScript:

- **CRITICAL FAILURE:** `const config = JSON.parse(raw) as any; console.log(config.api.url);`
- **GOLD STANDARD:**
  ```typescript
  interface Config {
    api: { url: string };
  }
  const config: unknown = JSON.parse(raw);
  if (config && typeof config === 'object' && 'api' in config) {
    const api = (config as any).api;
    if (api && typeof api === 'object' && 'url' in api) {
      // Safe execution branch
    }
  }
  ```

### Rust:

- **CRITICAL FAILURE:** `let data = fetch_payload().unwrap(); // Will panic on network drops`
- **GOLD STANDARD:**
  ```rust
  let data = fetch_payload().map_err(|e| anyhow!("Failed to fetch payload from upstream: {}", e))?;
  ```

### Go:

- **CRITICAL FAILURE:** `go func() { for { doWork() } }() // Infinite leak if main context stops`
- **GOLD STANDARD:**
  ```go
  go func(ctx context.Context) {
      for {
          select {
          case <-ctx.Done():
              return
          default:
              doWork()
          }
      }
  }(ctx)
  ```

### Python:

- **CRITICAL FAILURE:** `def load_records(f): return [line.strip() for line in open(f)] # File leak`
- **GOLD STANDARD:**
  ```python
  def load_records(file_path: str) -> list[str]:
      with open(file_path, "r", encoding="utf-8") as f:
          return [line.strip() for line in f if line.strip()]
  ```

## graphify

For any question about this repo's architecture, structure, components, or how to add/modify/find
code, your first action should be `graphify query "<question>"` when `graphify-out/graph.json`
exists. Use `graphify path "<A>" "<B>"` for relationship questions and `graphify explain "<concept>"`
for focused-concept questions. These return a scoped subgraph, usually much smaller than the full
report or raw grep output.

Triggers: "how do I…", "where is…", "what does … do", "add/modify a <component>",
"explain the architecture", or anything that depends on how files or classes relate.

If `graphify-out/wiki/index.md` exists, use it for broad navigation. Read `graphify-out/GRAPH_REPORT.md`
only for broad architecture review or when query/path/explain do not surface enough context. Only read
source files when (a) modifying/debugging specific code, (b) the graph lacks the needed detail, or
(c) the graph is missing or stale.

Type `/graphify` in Copilot Chat to build or update the graph.
