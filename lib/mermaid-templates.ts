export interface MermaidTemplate {
  id: string;
  label: string;
  code: string;
}

export const mermaidTemplates: MermaidTemplate[] = [
  {
    id: "flowchart",
    label: "Flowchart",
    code: `graph TD
  A[Start] --> B{Is it valid?}
  B -->|Yes| C[Process request]
  B -->|No| D[Return error]
  C --> E[End]
  D --> E`,
  },
  {
    id: "sequence",
    label: "Sequence Diagram",
    code: `sequenceDiagram
  participant Client
  participant API
  participant DB
  Client->>API: POST /login
  API->>DB: Verify credentials
  DB-->>API: User record
  API-->>Client: 200 OK + token`,
  },
  {
    id: "class",
    label: "Class Diagram",
    code: `classDiagram
  class User {
    +String id
    +String email
    +login()
  }
  class Session {
    +String token
    +Date expiresAt
  }
  User "1" --> "*" Session : has`,
  },
  {
    id: "state",
    label: "State Diagram",
    code: `stateDiagram-v2
  [*] --> Idle
  Idle --> Loading: fetch()
  Loading --> Success: onSuccess
  Loading --> Error: onError
  Success --> Idle: reset()
  Error --> Idle: reset()`,
  },
  {
    id: "gantt",
    label: "Gantt Chart",
    code: `gantt
  title Release Plan
  dateFormat YYYY-MM-DD
  section Design
  Wireframes      :a1, 2026-01-01, 5d
  Review          :after a1, 2d
  section Build
  Implementation  :a2, after a1, 10d
  Testing         :after a2, 5d`,
  },
  {
    id: "pie",
    label: "Pie Chart",
    code: `pie title Traffic Sources
  "Organic Search" : 42
  "Direct" : 28
  "Referral" : 18
  "Social" : 12`,
  },
  {
    id: "er",
    label: "ER Diagram",
    code: `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  CUSTOMER {
    string id
    string name
  }
  ORDER {
    string id
    date createdAt
  }`,
  },
];
