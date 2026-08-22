# Architecture

## 目的

Web Toolboxの初期アーキテクチャとソースコード構成を定義する。

初期段階ではシンプルなFrontend Only構成とし、Backendが必要になった段階で拡張する。

---

# 1. Initial Architecture

```text
Browser
   |
   v
React + TypeScript
   |
   v
Static Files
   |
   v
Cloudflare Pages
```

初期段階ではBackendを持たない。

各ツールの処理は、可能な限りブラウザ上で実行する。

---

# 2. Technology Stack

## Frontend

* React
* TypeScript
* Vite

## Routing

React向けのクライアントサイドルーティングを使用する。

具体的なライブラリは初期実装時に選定する。

選定時は以下を重視する。

* 広く利用されている
* シンプルである
* 本プロジェクトの規模に対して過剰ではない
* Cloudflare Pages上で利用できる

## Hosting

* Cloudflare Pages

## Source Control

* Git
* GitHub

---

# 3. Repository Structure

初期構成は以下を想定する。

```text
web-toolbox/
├─ public/
│
├─ src/
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ Header.tsx
│  │  │  └─ Layout.tsx
│  │  │
│  │  └─ tools/
│  │     └─ ToolCard.tsx
│  │
│  ├─ pages/
│  │  └─ HomePage.tsx
│  │
│  ├─ tools/
│  │  ├─ json-formatter/
│  │  │  └─ JsonFormatter.tsx
│  │  │
│  │  └─ registry.ts
│  │
│  ├─ types/
│  │  └─ tool.ts
│  │
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ index.css
│
├─ docs/
│  ├─ prompts/
│  ├─ architecture.md
│  ├─ decisions.md
│  ├─ development-environment.md
│  ├─ development-log.md
│  ├─ requirements.md
│  ├─ screen-design.md
│  └─ tool-development-guide.md
│
├─ AGENTS.md
├─ README.md
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

実装上必要な場合は変更可能とする。

ただし、将来利用する可能性だけを理由にディレクトリやレイヤーを追加しない。

---

# 4. Components

## components/layout

Web Toolbox全体で使用するレイアウト関連コンポーネントを配置する。

初期候補：

```text
Header.tsx
Layout.tsx
```

Footerが必要になった場合はここへ追加する。

---

## components/tools

複数のツールやツール一覧で利用する共通コンポーネントを配置する。

初期候補：

```text
ToolCard.tsx
```

ツール固有のコンポーネントはここへ配置せず、各ツールのディレクトリ内で管理する。

---

# 5. Pages

ルーティング単位のページを配置する。

初期：

```text
pages/
└─ HomePage.tsx
```

ツール詳細については、ツール固有実装を `tools/` 配下に配置する。

将来的に以下のようなページが必要になった場合は `pages/` に追加する。

* About
* Privacy Policy
* Not Found

---

# 6. Tools

各ツール固有の実装を配置する。

```text
tools/
├─ json-formatter/
│  └─ JsonFormatter.tsx
│
└─ registry.ts
```

ツールが単純な場合は1ファイルから開始する。

複雑になった場合のみ、そのツールディレクトリ内で分割する。

例：

```text
json-formatter/
├─ JsonFormatter.tsx
├─ jsonFormatter.ts
└─ JsonFormatter.test.ts
```

---

# 7. Tool Registry

`src/tools/registry.ts` でTool Metadataを一元管理する。

概念例：

```ts
export const tools: Tool[] = [
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "JSONを整形・圧縮します。",
    category: "developer",
    keywords: [
      "json",
      "format",
      "formatter",
      "整形",
      "圧縮"
    ],
    path: "/tools/json-formatter"
  }
]
```

Tool Registryは以下から利用する。

```text
                Tool Registry
                      |
        +-------------+-------------+
        |             |             |
        v             v             v
    Tool List       Search      Related Tools
```

RoutingについてはVersion 0.1では明示的に定義してよい。

Tool RegistryからRoutingまで自動生成する仕組みは、必要性が確認されるまで導入しない。

---

# 8. Types

Tool Metadataなど、複数箇所で利用する型を配置する。

初期：

```text
types/
└─ tool.ts
```

例：

```ts
export type ToolCategory =
  | "developer"
  | "text"
  | "datetime"
  | "network"
  | "other"

export type Tool = {
  id: string
  name: string
  description: string
  category: ToolCategory
  keywords: string[]
  path: string
  relatedTools?: string[]
}
```

---

# 9. Routing

初期ルート：

```text
/
└─ HomePage

/tools/json-formatter
└─ JsonFormatter
```

将来的には以下の形式で追加する。

```text
/tools/{tool-id}
```

例：

```text
/tools/uuid-generator
/tools/timestamp-converter
/tools/text-diff
```

個別URLへ直接アクセスできることを必須とする。

---

# 10. State Management

Version 0.1ではグローバルState Managementライブラリを導入しない。

各ツール固有の状態はReact標準機能で管理する。

例：

* useState
* 必要に応じてuseMemo
* 必要に応じてuseEffect

ReduxなどのグローバルState Managementは、必要性が発生するまで導入しない。

---

# 11. Styling

Version 0.1では、シンプルで一貫したUIを優先する。

不要なUIフレームワークを導入しない。

初期段階では既存のCSS構成をベースとして実装する。

ツール数が増え、共通デザインの管理が難しくなった場合に改めてCSS設計やUIライブラリを検討する。

---

# 12. Browser Processing

以下のような処理はFrontend内で実行する。

```text
User Input
    |
    v
React Component
    |
    v
JavaScript / TypeScript
    |
    v
Result
```

例：

* JSON Parse / Format
* Base64
* URL Encode / Decode
* Timestamp
* UUID
* Text Processing

これらの処理のためだけにBackendを追加しない。

---

# 13. Privacy

ブラウザ内完結ツールでは以下の構成を維持する。

```text
User Input
    |
    v
Browser Processing
    |
    v
Result
```

以下の通信は発生させない。

```text
User Input
    |
    X
External Server
```

外部通信が必要なツールについては別途設計する。

---

# 14. Future Backend Architecture

Backendが必要になった場合は、Frontendとは独立したBackendを追加する。

```text
Browser
   |
   +----------------------+
   |                      |
   v                      v
React                 REST API
                          |
                          v
                     Spring Boot
                          |
                          v
                     PostgreSQL
```

想定技術：

```text
Frontend
- React
- TypeScript

Backend
- Java
- Spring Boot

Database
- PostgreSQL
```

FrontendとBackendはREST APIを介して通信する。

---

# 15. Future Repository Structure

Backend追加後は以下のような構成への変更を想定する。

```text
web-toolbox/
├─ frontend/
│  └─ React application
│
├─ backend/
│  └─ Spring Boot application
│
├─ docs/
│
└─ infra/
```

ただし、Backendが必要になるまでは現在のFrontendを `frontend/` へ移動しない。

不要なディレクトリ移動を先に行わない。

---

# 16. Future AWS Architecture

将来的にBackendをAWSへ配置する場合は以下を候補とする。

```text
                    Internet
                       |
          +------------+------------+
          |                         |
          v                         v
Cloudflare Pages                  AWS
     |                             |
     v                             v
React                        Spring Boot
                                   |
                                   v
                             PostgreSQL / RDS
```

実際のAWSサービス構成はBackend導入時に決定する。

Version 0.1ではAWS固有の実装を行わない。

---

# 17. Architecture Principles

以下を基本原則とする。

* Simple First
* FrontendとBackendを明確に分離する
* Backendが不要な機能ではBackendを使用しない
* 新規ツールを少ない変更で追加できる構造にする
* 過度な共通化を行わない
* 過度なレイヤー分割を行わない
* 不要な外部依存を増やさない
* ユーザー入力を不要に外部へ送信しない
* 将来的なAWS移行を妨げる設計にしない
