# Lesson 2.13: TypeScript for React Developers

## Overview

- **Duration:** ~2.5 hours (hands-on lab, including two 5-minute breaks)
- **Prerequisites:** Lesson 2.10 — Custom Hooks

## Learning Objectives

By the end of this lesson, you will be able to:

1. **Annotate** React component props, state, and event handlers with TypeScript types
2. **Define** shared data shapes using interfaces and apply them across components
3. **Explain** the difference between TypeScript's compile-time guarantees and runtime behaviour

## Introduction

TypeScript is JavaScript with types. It does not change how React works — components, props, state, and hooks are all the same. What TypeScript adds is a layer of checking that catches mistakes in your editor before you run the app: a mistyped property name, a missing required prop, a function called with the wrong argument type.

In this lesson you will migrate a small working React app from JavaScript to TypeScript, one step at a time. The app — `ts-contacts` — manages a list of contacts. You will not be rewriting logic; you will be adding type information to code that already works, and watching the editor and compiler use that information to protect you.

By the end of the session, all six parts of the app will be fully typed: variables, interfaces, component props, state, context, and API responses.

---

## Setup: The `ts-contacts` App

### Scaffold the Project

Create a new Vite project with the React TypeScript template:

```bash
npm create vite@latest ts-contacts -- --template react-ts
cd ts-contacts
npm install
```

This template sets up TypeScript, `tsconfig.json`, and `.tsx` files automatically. The project compiles and runs with types enabled from the start.

### Install json-server

You will need json-server in Part 6 to simulate an API:

```bash
npm install -D json-server
```

### Add the Database File

Create `db.json` in the project root:

```json
{
  "contacts": [
    { "id": 1, "name": "Alice Tan", "email": "alice@example.com" },
    { "id": 2, "name": "Bob Lim", "email": "bob@example.com" },
    { "id": 3, "name": "Carol Wong", "email": "carol@example.com" },
    { "id": 4, "name": "David Chen", "email": "david@example.com" }
  ]
}
```

### Add Scripts to `package.json`

Open `package.json` and add a `server` script alongside the existing ones:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "server": "json-server --watch db.json --port 3001"
  }
}
```

### Replace the Starter Files

Delete the default Vite files and replace them with the starter code for this lesson. Replace `src/App.tsx` with the following:

```tsx
// src/App.tsx
import { useState } from 'react';

const initialContacts = [
  { id: 1, name: 'Alice Tan', email: 'alice@example.com' },
  { id: 2, name: 'Bob Lim', email: 'bob@example.com' },
  { id: 3, name: 'Carol Wong', email: 'carol@example.com' },
  { id: 4, name: 'David Chen', email: 'david@example.com' },
];

export default function App() {
  const [contacts, setContacts] = useState(initialContacts);
  const [query, setQuery] = useState('');

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  function addContact(newContact) {
    setContacts(prev => [...prev, newContact]);
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>ts-contacts</h1>
      <SearchBar query={query} onQueryChange={setQuery} />
      <ContactList contacts={filtered} />
    </div>
  );
}

function SearchBar({ query, onQueryChange }) {
  return (
    <input
      value={query}
      onChange={e => onQueryChange(e.target.value)}
      placeholder="Search contacts..."
      style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', fontSize: '1rem' }}
    />
  );
}

function ContactList({ contacts }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {contacts.map(c => (
        <li key={c.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
          <strong>{c.name}</strong> — {c.email}
        </li>
      ))}
    </ul>
  );
}
```

Replace `src/index.css` with:

```css
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; background: #f8fafc; color: #1a202c; }
```

### Start the Dev Server

```bash
npm run dev
```

Open `http://localhost:5173`. You should see a list of four contacts and a working search input. This is the starting point — the app works, but none of the types are explicit yet.

---

## Part 1: Basic Types and the `.tsx` Extension (20 minutes)

The project already uses `.tsx` files because we used the `--template react-ts` flag. Open `src/App.tsx` and look at the top of the file. The app is valid TypeScript even without annotations — TypeScript infers types from the values you write.

### Type Inference

Add a variable to the top of `App.tsx` to see inference in action:

```tsx
const appTitle = 'ts-contacts';
```

Hover over `appTitle` in your editor. It shows `const appTitle: string`. TypeScript inferred the type from the string literal — you did not have to write it.

Now add an explicit annotation:

```tsx
const appTitle: string = 'ts-contacts';
```

The annotation adds no new information here, but it does add clarity. A future reader does not need to infer the intent from the value.

### Seeing a Type Error

Try assigning the wrong type:

```tsx
const appTitle: string = 42; // Error: Type 'number' is not assignable to type 'string'
```

The editor underlines this immediately. Revert it to the correct value before continuing.

### The Union Type

TypeScript can express "this value is one of several specific options" using a union type with `|`:

```ts
type Status = 'active' | 'inactive' | 'pending';
```

A value of type `Status` can only be one of those three strings. You will use this pattern in Part 5.

> **TypeScript is additive**
>
> You can add types gradually. A file with no annotations is still valid TypeScript — inference handles the rest. This is important when migrating an existing JavaScript codebase: you do not have to type everything at once.

---

## Part 2: Typing a Data Shape with an Interface (25 minutes)

The contact objects in `initialContacts` each have three fields: `id`, `name`, and `email`. Right now nothing enforces this — you could write `{ id: 1, naam: 'Alice' }` and the compiler would not complain because it has no declared shape to check against.

An interface gives the shape a name and makes it enforceable.

### Create the Interface

Create a new file `src/types/Contact.ts`:

```ts
// src/types/Contact.ts
export interface Contact {
  id: number;
  name: string;
  email: string;
}
```

This declares that any `Contact` must have:
- `id` — a number
- `name` — a string
- `email` — a string

### Use the Interface

Import the interface in `App.tsx` and annotate `initialContacts`:

```tsx
import { Contact } from './types/Contact';

const initialContacts: Contact[] = [
  { id: 1, name: 'Alice Tan', email: 'alice@example.com' },
  { id: 2, name: 'Bob Lim', email: 'bob@example.com' },
  { id: 3, name: 'Carol Wong', email: 'carol@example.com' },
  { id: 4, name: 'David Chen', email: 'david@example.com' },
];
```

`Contact[]` means "an array of Contact". TypeScript now checks every object in the array against the interface.

### See the Interface in Action

Introduce a typo in one of the objects:

```tsx
{ id: 1, naam: 'Alice Tan', email: 'alice@example.com' }, // Error: Object literal may only specify known properties
```

The compiler flags this immediately. Restore the correct field name before continuing.

Now type `c.` inside the `.filter()` callback. Your editor suggests `id`, `name`, and `email` — and nothing else. Autocomplete is driven by the interface.

> **Keep interfaces in `src/types/`**
>
> Defining the interface in the component file works, but as soon as two components need the same type, you would have to import it from somewhere. Starting in `src/types/` avoids that refactor later.

---

## Part 3: Typing Component Props (30 minutes)

Props are the primary API of a component. A typed props interface documents exactly what a component needs and lets the compiler catch mismatches at the call site — where you use the component — rather than inside the component's rendering logic.

### Type `ContactList` Props

Add a props interface above the `ContactList` function in `App.tsx`:

```tsx
import { Contact } from './types/Contact';

interface ContactListProps {
  contacts: Contact[];
}

function ContactList({ contacts }: ContactListProps) {
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {contacts.map(c => (
        <li key={c.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
          <strong>{c.name}</strong> — {c.email}
        </li>
      ))}
    </ul>
  );
}
```

The `{ contacts }: ContactListProps` syntax destructures the props object and types it in one step.

### Test the Prop Checking

In the `App` component JSX, temporarily remove the `contacts` prop:

```tsx
<ContactList /> // Error: Property 'contacts' is missing
```

The compiler flags the missing required prop. Restore it before continuing.

Now try passing the wrong type:

```tsx
<ContactList contacts="not an array" /> // Error: Type 'string' is not assignable to type 'Contact[]'
```

Restore the correct value.

### Optional Props

Add a `title` prop to `ContactListProps` that is optional:

```tsx
interface ContactListProps {
  contacts: Contact[];
  title?: string;
}
```

The `?` means the prop can be omitted at the call site. If provided, it must be a `string`. Update `ContactList` to render the title if it is present:

```tsx
function ContactList({ contacts, title }: ContactListProps) {
  return (
    <>
      {title && <h2>{title}</h2>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {contacts.map(c => (
          <li key={c.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
            <strong>{c.name}</strong> — {c.email}
          </li>
        ))}
      </ul>
    </>
  );
}
```

Pass the title from `App`:

```tsx
<ContactList contacts={filtered} title="Contacts" />
```

---

### Activity: Type the `SearchBar` Props (10 minutes)

`SearchBar` currently has untyped props. Your task is to add a props interface.

The component accepts:
- `query` — a string
- `onQueryChange` — a function that receives a string and returns nothing

**Hints:**

1. A function type that receives a string and returns nothing is written as `(value: string) => void`.
2. Add the interface directly above the `SearchBar` function, the same way you did for `ContactList`.
3. After adding the interface, try passing a number as `query` in the `App` JSX and observe the error before fixing it.

<details>
<summary>Reference solution</summary>

```tsx
interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
}

function SearchBar({ query, onQueryChange }: SearchBarProps) {
  return (
    <input
      value={query}
      onChange={e => onQueryChange(e.target.value)}
      placeholder="Search contacts..."
      style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', fontSize: '1rem' }}
    />
  );
}
```

</details>

---

## Part 4: Typing State and Event Handlers (30 minutes)

### Typing `useState`

`useState` is a generic function — it accepts a type parameter that constrains what the state can hold. TypeScript infers the type from the initial value, but you can be explicit:

```tsx
const [contacts, setContacts] = useState<Contact[]>(initialContacts);
const [query, setQuery] = useState<string>('');
```

Both are equivalent to what TypeScript infers automatically. The explicit parameter is useful when the initial value is `null` or `[]`, because TypeScript cannot infer the full type from an empty array:

```tsx
// Without the type parameter, TypeScript infers never[]
const [contacts, setContacts] = useState([]);

// With the type parameter, TypeScript knows the array holds Contact objects
const [contacts, setContacts] = useState<Contact[]>([]);
```

Add the type parameters to the two `useState` calls in `App.tsx`.

### Typing a Function Parameter

Add the `addContact` function with a typed parameter:

```tsx
function addContact(newContact: Contact): void {
  setContacts(prev => [...prev, newContact]);
}
```

The `: void` return type annotation means the function returns nothing. This is optional but makes intent clear.

Test the type safety: temporarily call `addContact` with an object that is missing `email`:

```tsx
addContact({ id: 5, name: 'Eve Ng' }); // Error: Property 'email' is missing
```

Restore the correct call before continuing.

### Typing Event Handlers

Add a form to `App` that lets the user add a contact. The `onChange` handlers on input elements receive a typed event object:

```tsx
function App() {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [query, setQuery] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  function addContact(newContact: Contact): void {
    setContacts(prev => [...prev, newContact]);
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!newName || !newEmail) return;
    addContact({ id: Date.now(), name: newName, email: newEmail });
    setNewName('');
    setNewEmail('');
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>ts-contacts</h1>
      <SearchBar query={query} onQueryChange={setQuery} />
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          value={newName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
          placeholder="Name"
          style={{ flex: 1, padding: '0.4rem' }}
        />
        <input
          value={newEmail}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
          placeholder="Email"
          style={{ flex: 1, padding: '0.4rem' }}
        />
        <button type="submit">Add</button>
      </form>
      <ContactList contacts={filtered} title="Contacts" />
    </div>
  );
}
```

`React.ChangeEvent<HTMLInputElement>` comes from React's own type definitions — you do not write it from scratch. Your editor suggests it when you hover over the event parameter. The `<HTMLInputElement>` part tells TypeScript which DOM element the event came from, which determines which properties are available on `e.target`.

> **You do not need to memorise event types**
>
> In practice, you hover over the handler in your editor and it tells you the type. Or you write the handler inline and let TypeScript infer it. Writing the explicit annotation is good for teaching — in daily work, inference usually handles it.

---

### Activity: Add a Remove Button (10 minutes)

Add a `removeContact` function to `App` and a remove button to each contact in `ContactList`.

**Task:**

1. Write a `removeContact` function in `App` that accepts an `id` of type `number` and removes the matching contact from state.
2. Add `onRemove` to `ContactListProps` as a function that accepts a `number` and returns `void`.
3. Pass `removeContact` as the `onRemove` prop to `<ContactList />`.
4. Render a button in each list item that calls `onRemove` with the contact's `id`.

**Hints:**

1. The function signature is `function removeContact(id: number): void`.
2. Use `contacts.filter(c => c.id !== id)` inside the function.
3. The type of `onRemove` in `ContactListProps` is `(id: number) => void`.
4. In the list item: `<button onClick={() => onRemove(c.id)}>Remove</button>`.

<details>
<summary>Reference solution</summary>

In `App`:
```tsx
function removeContact(id: number): void {
  setContacts(prev => prev.filter(c => c.id !== id));
}

// In JSX:
<ContactList contacts={filtered} title="Contacts" onRemove={removeContact} />
```

Updated `ContactListProps` and `ContactList`:
```tsx
interface ContactListProps {
  contacts: Contact[];
  title?: string;
  onRemove: (id: number) => void;
}

function ContactList({ contacts, title, onRemove }: ContactListProps) {
  return (
    <>
      {title && <h2>{title}</h2>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {contacts.map(c => (
          <li key={c.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>{c.name}</strong> — {c.email}</span>
            <button onClick={() => onRemove(c.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </>
  );
}
```

</details>

---

## Part 5: Typing `useContext` (20 minutes)

`createContext` is a generic function. You pass a type parameter to tell TypeScript what the context value will hold.

### Create a Typed Context

Create `src/contexts/ThemeContext.tsx`:

```tsx
// src/contexts/ThemeContext.tsx
import { createContext, useContext, useState } from 'react';

interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
```

The type parameter is `ThemeContextValue | null`. The `| null` is necessary because `createContext` requires an initial value, and at the point the context is created there is no provider yet — `null` is the honest initial value. The union type acknowledges this and forces every consumer to handle the `null` case.

### Add the Provider

```tsx
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  function toggleTheme(): void {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

`React.ReactNode` is the type for anything React can render: JSX, strings, numbers, arrays, `null`. It is the correct type for a `children` prop.

### Add a Typed Consumer Hook

Rather than calling `useContext(ThemeContext)` in every component — which returns `ThemeContextValue | null` and requires each consumer to handle `null` — write a hook that handles the null check once:

```tsx
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return context;
}
```

The return type annotation `: ThemeContextValue` (without `| null`) tells TypeScript that after the null check, the value is guaranteed to be present. Consumers of `useTheme()` receive a fully typed, non-null value.

> **Why `createContext<T | null>(null)` with a wrapping hook?**
>
> This is the standard TypeScript pattern for React context. The alternative — providing a fake default value to avoid `null` — silently hides the case where a component is used outside its provider. The `null` initial value plus the guard in the hook makes that mistake loud and obvious.

### Wire Up the Provider and Consumer

In `src/main.tsx`, wrap `<App />` with `<ThemeProvider>`:

```tsx
import { ThemeProvider } from './contexts/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
```

In `App.tsx`, import and use `useTheme`:

```tsx
import { useTheme } from './contexts/ThemeContext';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{
      maxWidth: 600,
      margin: '2rem auto',
      fontFamily: 'sans-serif',
      background: theme === 'light' ? '#fff' : '#1a202c',
      color: theme === 'light' ? '#1a202c' : '#f8fafc',
      padding: '1rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>ts-contacts</h1>
        <button onClick={toggleTheme}>
          Switch to {theme === 'light' ? 'dark' : 'light'} mode
        </button>
      </div>
      {/* rest of the JSX */}
    </div>
  );
}
```

Click the button to toggle between light and dark mode. TypeScript knows `theme` is `'light' | 'dark'` — not just `string` — so autocomplete and exhaustiveness checks both work correctly.

### Verify the Error Guard

Temporarily move `useTheme()` outside the `<ThemeProvider>` by calling it in a component rendered before the provider wraps the app. The runtime throws the descriptive error. This guard would be impossible without the hook — a direct `useContext` call would return `null` silently.

Undo the change before continuing.

---

## Part 6: Typing an API Fetch (20 minutes)

### What `fetch` Returns

`fetch` is a standard browser API. Its return type in TypeScript is `Promise<Response>`. The `.json()` method on `Response` returns `Promise<any>` — TypeScript does not know what shape the data has.

This means that without additional annotation, data fetched from an API is typed as `any`, and TypeScript cannot check how you use it.

### Setup: Start json-server

Open a second terminal and run:

```bash
npm run server
```

json-server serves `db.json` at `http://localhost:3001`. The contacts endpoint is at `http://localhost:3001/contacts`.

### Replace the Hardcoded Data

In `App.tsx`, remove `initialContacts` and add a `useEffect` that fetches from json-server instead. Add `useEffect` to the React import:

```tsx
import { useState, useEffect } from 'react';
```

Update the `App` component:

```tsx
export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/contacts')
      .then(res => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data: Contact[]) => {
        setContacts(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // ... rest of the component
```

The annotation `(data: Contact[])` in the `.then()` callback is a **type assertion** — you are telling TypeScript to treat the parsed JSON as `Contact[]`. TypeScript trusts this claim.

### The Limitation: Runtime vs. Compile Time

Before the next step, it helps to understand why TypeScript cannot protect you from bad API data.

Think of TypeScript like a spell-checker. It marks mistakes while you write, but when you print the document, the red underlines are gone — the printed page has no memory that any checking happened. TypeScript works the same way: `tsc` checks your types during development, then strips every annotation out before the browser runs the code. The browser sees plain JavaScript with no knowledge that types ever existed.

This means TypeScript can only check things it can see at development time: the code you write. It cannot check data that arrives after the app is running — API responses, values from `localStorage`, user input. By the time that data arrives, the types are already gone.

The assertion `(data: Contact[])` is a promise you make to the compiler. The compiler trusts it. But if the server returns something different, there is nothing left at runtime to catch the mismatch.

To make this concrete, temporarily break `db.json` by renaming `email` to `emailAddress` in one record:

```json
{ "id": 1, "name": "Alice Tan", "emailAddress": "alice@example.com" }
```

Save the file and reload the app. The data loads without any TypeScript error. But in the rendered list, Alice's email shows as blank — `c.email` is `undefined` at runtime because the field does not exist.

TypeScript did not catch this. The assertion `(data: Contact[])` is a compile-time claim. At runtime, the data is raw JSON from the network — TypeScript has no way to verify it.

**TypeScript's types are erased at runtime. The assertion cannot protect against unexpected data from an external source.**

Restore `db.json` to the correct field name before continuing.

### The Alternative Assertion Syntax

The same assertion can be written with `as`:

```tsx
.then(data => {
  setContacts(data as Contact[]);
  setLoading(false);
})
```

Both forms are equivalent. The inline parameter annotation is slightly more readable in `.then()` chains; `as` is more explicit about the fact that you are making a claim the compiler cannot verify.

### Render the Loading and Error States

Update the `App` return to handle the three states:

```tsx
if (loading) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</p>;
if (error) return <p style={{ color: 'red', textAlign: 'center', marginTop: '2rem' }}>Error: {error}</p>;

return (
  // ... existing JSX
);
```

The type of `error` is `string | null`. TypeScript knows that inside the `if (error)` branch, `error` is narrowed to `string` — so rendering `{error}` is safe without any additional null check.

> **For production apps: validate API responses**
>
> When the shape of an API response cannot be fully trusted — a third-party API, a backend under active development — a runtime validation library like Zod (covered in Lesson 2.11) can verify the shape before you use the data. The assertion `as Contact[]` is a convenience for trusted sources; Zod is the right tool when you need a guarantee.

---

## Wrap-Up: What TypeScript Does Not Do (5 minutes)

TypeScript is a compile-time tool. Once the compiler finishes, every type annotation is stripped out and the app runs as plain JavaScript.

This means:

- **Runtime data is untyped until you assert or validate it.** API responses, `localStorage` values, and user input are all `any` or `unknown` until you annotate them. An assertion like `as Contact[]` is a claim, not a guarantee.
- **TypeScript does not prevent logical bugs.** If your logic is correctly typed but semantically wrong — filtering by the wrong field, calculating an incorrect value — TypeScript will not catch it. Tests do.
- **TypeScript makes refactoring safer.** Change an interface and the compiler tells you every place that needs updating. Rename a prop and every callsite is flagged immediately.

---

## Bonus Challenges

These challenges have no provided solution. They are for learners who finish the lab early.

1. Add a `ContactCard` component that renders a single contact's details. Type its props. Make the `email` prop optional and display a placeholder string when it is absent.
2. Change the `Contact` interface so that `email` is `string | null` instead of `string`. The compiler will highlight every location that needs to handle `null` — fix each one.
3. Extract the `addContact` and `removeContact` logic into a custom hook named `useContacts` that returns `{ contacts, addContact, removeContact }`. Add an explicit return type annotation to the hook.
4. Add a cleanup function to the `useEffect` in Part 6 using an `ignore` flag (the pattern from Lesson 2.10) so that a stale response from an earlier fetch cannot overwrite the result of a later one.

---

## Common Pitfalls

**Forgetting `| null` in `createContext`**

```tsx
// Wrong — TypeScript infers the context type as 'undefined', not your interface
const ThemeContext = createContext<ThemeContextValue>(undefined);

// Correct — the initial value is null and the type includes null
const ThemeContext = createContext<ThemeContextValue | null>(null);
```

**Trusting a type assertion on API data**

```tsx
// This compiles with no errors even if the API returns something completely different
.then((data: Contact[]) => setContacts(data))

// The assertion is a claim to the compiler, not a runtime check.
// If the API shape changes, your app breaks silently.
```

**Using `any` to silence errors**

```tsx
// Wrong — 'any' turns off all type checking for this value
function addContact(newContact: any) { ... }

// Correct — use the actual interface
function addContact(newContact: Contact) { ... }
```

**Calling `useState` with an empty array and no type parameter**

```tsx
// Wrong — TypeScript infers never[], so setContacts will reject Contact objects
const [contacts, setContacts] = useState([]);

// Correct — provide the type parameter so TypeScript knows what the array holds
const [contacts, setContacts] = useState<Contact[]>([]);
```

---

## Summary

| Concept | What it does |
|---|---|
| Type annotations | Document the expected type of a variable, parameter, or return value |
| `interface` | Names the required shape of an object and makes it reusable |
| Typed props | Lets the compiler catch missing or wrong props at the call site |
| `useState<T>` | Constrains what the state can hold; essential when the initial value is `[]` or `null` |
| `createContext<T \| null>` | The standard pattern for typed context; the wrapping hook handles the null check once |
| Type assertion (`as T`) | Claims a type the compiler cannot verify; safe for trusted sources, not for external data |

TypeScript does not change how React works. It adds a layer of checking that catches mistakes earlier, makes editors smarter, and makes large codebases safer to change.

---

## Additional Resources

- [TypeScript for JavaScript Programmers — TypeScript documentation](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [useState with TypeScript — React documentation](https://react.dev/reference/react/useState#storing-information-from-previous-renders)
