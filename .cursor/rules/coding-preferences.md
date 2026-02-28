---
description: Personal coding style preferences for TypeScript/JavaScript
alwaysApply: true
---

# Coding Preferences

## Type Definitions

- Prefer `type` keyword over `interface`
- Prefer optional modifier over union with `undefined` (e.g. `product?: string` over `product: string | undefined`)
- Always define component props as a separate named type (e.g., `type SmartMeterInfoProps = { ... }`)

```typescript
// Preferred - optional modifier
type Example = { product?: string }

// Avoid - union with undefined
type Example = { product: string | undefined }
```

```typescript
// Preferred
type User = {
  name: string
  email: string
}

// Avoid
interface User {
  name: string
  email: string
}
```

```tsx
// Preferred - separate named type for props
type SmartMeterInfoProps = {
  color: string
  energyType: 'electricity' | 'gas'
}

const SmartMeterInfo = ({ color, energyType }: SmartMeterInfoProps) => { ... }

// Avoid - inline prop types
const SmartMeterInfo = ({ color, energyType }: { color: string; energyType: 'electricity' | 'gas' }) => { ... }
```

## Return Types

- Omit explicit return types unless there's a specific reason (e.g., complex inference, public API)

```typescript
// Preferred
const getUser = (id: string) => users.find((u) => u.id === id)

// Avoid (unless needed)
const getUser = (id: string): User | undefined => users.find((u) => u.id === id)
```

## Control Flow

- Avoid switch statements - use object lookups or early returns

```typescript
// Preferred
const statusColors = {
  peak: "orange",
  "off-peak": "green",
  "super-off-peak": "lightGreen",
} as const

const getColor = (status: string) => statusColors[status] ?? "gray"

// Avoid
const getColor = (status: string) => {
  switch (status) {
    case "peak":
      return "orange"
    case "off-peak":
      return "green"
    default:
      return "gray"
  }
}
```

## Enums

- Avoid enums - use objects with `as const`

```typescript
// Preferred
const Status = {
  Active: "active",
  Inactive: "inactive",
} as const

type Status = (typeof Status)[keyof typeof Status]

// Avoid
enum Status {
  Active = "active",
  Inactive = "inactive",
}
```

## Functions

- Prefer implicit returns for simple expressions
- Prefer arrow functions over function declarations

```typescript
// Preferred
const double = (n: number) => n * 2
const users = items.filter((item) => item.active)

// Avoid
function double(n: number) {
  return n * 2
}
```

## Loops

- Prefer `.map()` or `Array.from()` over `for` loops with `.push()`

```typescript
// Preferred
const items = Array.from({ length: 10 }, (_, i) => createItem(i))
const doubled = numbers.map((n) => n * 2)

// Avoid
const items = []
for (let i = 0; i < 10; i++) {
  items.push(createItem(i))
}
```

## Naming

- Variables always in camelCase
- Avoid SHOUT_CASE for constants
- Avoid one-letter variable names — use descriptive names (e.g. `status`, `item`, `user` instead of `s`, `i`, `u`)

```typescript
// Preferred
const maxRetries = 3
const apiBaseUrl = "https://api.example.com"
const filtered = order.filter((status) => statusSet.has(status))

// Avoid
const MAX_RETRIES = 3
const API_BASE_URL = "https://api.example.com"
const filtered = order.filter((s) => statusSet.has(s))
```

## React

### useMemo / useCallback

- Only use `useMemo` for expensive calculations (large arrays, complex computations)
- Simple object lookups, string operations, and basic calculations don't need memoization
- `useCallback` is fine for functions passed to child components or used in dependency arrays

```typescript
// Preferred - cheap operations don't need useMemo
const status = getCurrentStatus(now)
const config = getStatusConfig(status)

// Appropriate - expensive calculation
const sortedItems = useMemo(
  () => items.sort((a, b) => complexComparison(a, b)),
  [items],
)

// Appropriate - stable callback for child components
const handleClick = useCallback(() => doSomething(id), [id])
```

### No Render Functions

- Never use inner render functions (`renderFoo()`) that return JSX. Extract them into proper React components instead.

```tsx
// Preferred - extract a real component
const MeterReadingsList = ({ meters, ...props }: MeterReadingsListProps) => {
  if (!meters) return null
  return meters.map((meter) => <MeterReadingInput key={meter.id} {...props} />)
}

// Avoid - render function returning JSX
const renderMeterReadings = () => {
  if (!meters) return null
  return meters.map((meter) => <MeterReadingInput key={meter.id} />)
}
```

### Styling (React Native / Restyle)

- Prefer component props over `style` prop when the prop is available (e.g., `width`, `height`, `padding`)

```tsx
// Preferred
<Box width="100%" height={50} padding="m">

// Avoid
<Box style={{ width: "100%", height: 50, padding: 16 }}>
```

### Tests (React Testing Library)

- Prefer calling `getByText(...)` / `findByText(...)` directly over wrapping in `expect(...).toBeTruthy()` — the query throws if not found, so the test fails either way.

```typescript
// Preferred
getByText("smartFlex.statusPeak.test")
await findByText("smartFlex.statusPeak.test")

// Avoid
expect(getByText("smartFlex.statusPeak.test")).toBeTruthy()
```

- Avoid `container` methods (`querySelector`, `querySelectorAll`). Use Testing Library queries (`getByRole`, `queryByRole`, `getAllByRole`, etc.) instead.

```typescript
// Preferred
expect(getAllByRole("link")).toHaveLength(2)
expect(queryByRole("link")).not.toBeInTheDocument()
expect(getByRole("link")).toHaveAttribute("href", "/some-path")

// Avoid
const anchors = container.querySelectorAll("a")
expect(anchors).toHaveLength(2)
const anchor = container.querySelector("a")
expect(anchor?.getAttribute("href")).toContain("/some-path")
```
