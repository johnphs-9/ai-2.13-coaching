# Lesson 2.13: TypeScript for React Developers

## Overview

- **Duration:** ~2 hours 30 minutes (hands-on lab, including two 5-minute breaks), assuming the Part 3 and Part 4 activities are assigned as take-home practice and Part 5 is run as an instructor demo. Part 6 (Typing `useContext`) is optional self-study and adds ~20 minutes if taught live; neither Part 6 nor the two activities are counted in this duration. See the notes at the start of Part 3, Part 4, Part 5, and Part 6.

## Learning Objectives

By the end of this lesson, you will be able to:

1. **Annotate** React component props, state, and event handlers with TypeScript types
2. **Define** shared data shapes using type aliases and apply them across components
3. **Explain** the difference between TypeScript's compile-time guarantees and runtime behaviour

## Introduction

TypeScript is JavaScript with types. It does not change how React works: components, props, state, and hooks are all the same. What TypeScript adds is a layer of checking that catches mistakes in your editor before you run the app: a mistyped property name, a missing required prop, a function called with the wrong argument type.

In this lesson you will migrate a small working React app from JavaScript to TypeScript, one step at a time. The app, `ts-contacts`, manages a list of contacts. You will not be rewriting logic; you will be adding type information to code that already works, and watching the editor and compiler use that information to protect you.

By the end of the session, five parts of the app will be fully typed: variables, type aliases, component props, state, and API responses. A sixth part, typing React context, is included as optional self-study for anyone who wants to see the same ideas applied a second time.

---

## Setup: The `ts-contacts` App (20 minutes)

### Scaffold the Project

Create a new Vite project with the React TypeScript template:

```bash
npm create vite@latest ts-contacts -- --template react-ts --eslint
cd ts-contacts
npm install
```

### What the TypeScript Template Changed

Before moving on, open the project folder and compare it to a plain JavaScript Vite project. A few things look different, and it is worth knowing what each change means before you start editing:

- **`src/App.tsx` and `src/main.tsx`**: every `.jsx` file is now `.tsx`, and there is no `.js`/`.jsx` file anywhere in `src/`. The `.tsx` extension is what tells the compiler "this file contains JSX and should be type-checked."
- **`vite.config.ts`**: Vite's own configuration file is also written in TypeScript now. You will not need to edit this file in this lesson, but it is worth noticing that the TypeScript template applies to the whole project, not just your components.
- **`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`**: three new configuration files that did not exist in the JavaScript template. `tsconfig.json` is mostly a pointer to the other two: `tsconfig.app.json` holds the compiler settings for your application code in `src/`, and `tsconfig.node.json` holds separate settings for tooling files like `vite.config.ts` that run in Node rather than the browser. You will not need to edit any of these three files in this lesson, since Vite's template configures them correctly by default, but you will hear them referred to again in the toolchain discussion at the end of the lecture.
- **`package.json` scripts**: the `build` script is now `"tsc -b && vite build"` instead of just `"vite build"`. `tsc -b` runs the TypeScript compiler in "build mode" first, checking every file for type errors; only if that check passes does Vite proceed to bundle the app. This is why a type error can fail a production build even if the dev server never complained.
- **One line of unfamiliar syntax in `src/main.tsx`**: open the file and look at the line that mounts the app:

  ```tsx
  // src/main.tsx
  createRoot(document.getElementById('root')!).render(
  ```

  The `!` immediately after `getElementById('root')` is a **non-null assertion**. `document.getElementById` can technically return `null` if the element is not found, so its return type is `HTMLElement | null`. The `!` tells TypeScript "trust me, this will not be null here" and removes `null` from the type without changing anything at runtime. You do not need to use this syntax yourself today, but you will see it in generated files, so it helps to recognise it on sight rather than mistake it for a typo.

> **You do not need to configure any of this**
>
> Every project in this lesson uses Vite's `react-ts` template, which wires up `tsconfig.json`, the build script, and ESLint's TypeScript rules correctly out of the box. Knowing what these files do is useful background, not something you need to set up from scratch.

### Turn Off Two ESLint Rules for This Lesson

The template's ESLint configuration includes `@typescript-eslint/no-unused-vars`, a rule that flags any variable, function, or parameter that is declared but never used. This is a genuinely useful rule in a real project, but it works against this specific lesson: several steps ahead deliberately introduce a variable or function before it is used, purely to demonstrate a TypeScript concept, and this rule would flag every one of them as an error.

The template also includes `react-refresh/only-export-components`, which expects every file to export only components, so that React's Fast Refresh can reliably hot-reload it in isolation. Part 6 (optional self-study, see that part's note) exports both a component (`AuthProvider`) and a hook (`useAuth`) from the same file, `AuthContext.tsx`, which is a common and reasonable pattern for a context, but it trips this rule. Turning it off now, during setup, means it is out of the way whether or not you reach Part 6 today.

Open `eslint.config.js` and add a `rules` block to the existing configuration object:

```js
// eslint.config.js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "react-refresh/only-export-components": "off",
    },
  },
]);
```

Both are deliberate, lesson-specific exceptions, not a general recommendation. In a real project you would keep `no-unused-vars` on, since an unused variable is almost always a mistake or leftover code; today it is off because the mistake it detects is exactly what several steps ask you to write on purpose. `react-refresh/only-export-components` is more situational: many real projects leave a context file exporting both its provider and its hook, exactly as `AuthContext.tsx` does here, and either accept the slightly slower hot-reload on that one file or disable the rule for context files specifically. Turning it off here avoids a distracting warning on code this lesson has not typed yet.

### Install json-server

You will need json-server in Part 5 to simulate an API:

```bash
npm install -D json-server
```

### Add the Database File

Create a `data/` folder in the project root, then create `data/db.json` inside it:

```json
// data/db.json
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
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "server": "json-server --watch data/db.json --port 3001"
  }
}
```

### Replace the Starter Files

Delete the default Vite files and replace them with the starter code for this lesson. This lesson is about TypeScript, not CSS, so all styling lives in a single `src/App.css` file that you import once and reuse with plain class names. Copy the full stylesheet from [assets/App.css](assets/App.css) into `src/App.css`, overwriting the default Vite styles. Delete `src/index.css` and remove its import from `src/main.tsx` so that `App.css` is the only stylesheet in the project. You will not need to touch `App.css` again for the rest of the lesson.

Replace `src/App.tsx` with the following:

```tsx
// src/App.tsx
import { useState } from "react";
import "./App.css";

const initialContacts = [
  { id: 1, name: "Alice Tan", email: "alice@example.com" },
  { id: 2, name: "Bob Lim", email: "bob@example.com" },
  { id: 3, name: "Carol Wong", email: "carol@example.com" },
  { id: 4, name: "David Chen", email: "david@example.com" },
];

export default function App() {
  const [contacts, setContacts] = useState(initialContacts);
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const addContact = (newContact) => {
    setContacts((prev) => [...prev, newContact]);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName || !newEmail) return;
    addContact({ id: Date.now(), name: newName, email: newEmail });
    setNewName("");
    setNewEmail("");
  };

  return (
    <div className="app">
      <h1>ts-contacts</h1>
      <SearchBar query={query} onQueryChange={setQuery} />
      <form onSubmit={handleAdd} className="add-contact-form">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Name"
        />
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Email"
        />
        <button type="submit">Add</button>
      </form>
      <ContactList contacts={filtered} />
    </div>
  );
}

function SearchBar({ query, onQueryChange }) {
  return (
    <input
      className="search-input"
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      placeholder="Search contacts..."
    />
  );
}

function ContactList({ contacts }) {
  return (
    <ul className="contact-list">
      {contacts.map((c) => (
        <li key={c.id} className="contact-item">
          <strong>{c.name}</strong> · {c.email}
        </li>
      ))}
    </ul>
  );
}
```

### Start the Dev Server

```bash
npm run dev
```

Open `http://localhost:5173`. You should see a list of four contacts, a working search input, and a form for adding a new contact by name and email. Try it: fill in the form and submit, and the new contact should appear in the list. This is the starting point: the app works, but none of the types are explicit yet.

> **Your editor is already showing red underlines, and that is expected**
>
> Look at `addContact`, `handleAdd`, and the props on `SearchBar` and `ContactList`. The TypeScript compiler is already flagging several parameters as having no declared type. This is not a mistake in the starter code; it is the reason today's lesson exists. `npm run dev` still works because Vite does not type-check before serving the app, so you can keep coding along normally. Do not run `npm run build` yet, though: that script runs the TypeScript compiler first, and it will fail until the app is fully typed by the end of Part 6.

---

## Part 1: Basic Types and the `.tsx` Extension (15 minutes)

The project already uses `.tsx` files because we used the `--template react-ts` flag. Open `src/App.tsx` and look at the top of the file. The app is valid TypeScript even without annotations: TypeScript infers types from the values you write.

### Type Inference

Add a variable to the top of `App.tsx` to see inference in action:

```tsx
// src/App.tsx
const appTitle = "ts-contacts";
```

Hover over `appTitle` in your editor. It shows `const appTitle: string`. TypeScript inferred the type from the string literal; you did not have to write it.

Now add an explicit annotation:

```tsx
// src/App.tsx
const appTitle: string = "ts-contacts";
```

The annotation adds no new information here, since TypeScript already inferred `string` on its own. In real code you would not annotate a case this obvious; most style guides consider it redundant. It is written explicitly here only to show what the annotation syntax looks like, before Part 3 onwards, where explicit annotations are genuinely necessary.

### Seeing a Type Error

Try assigning the wrong type:

```tsx
// src/App.tsx
const appTitle: string = 42; // Error: Type 'number' is not assignable to type 'string'
```

The editor underlines this immediately. Revert it to the correct value before continuing.

> **TypeScript is additive**
>
> You can add types gradually. A file with no annotations is still valid TypeScript: inference handles the rest. This is important when migrating an existing JavaScript codebase: you do not have to type everything at once.

---

## Part 2: Typing a Data Shape with a Type Alias (20 minutes)

The contact objects in `initialContacts` each have three fields: `id`, `name`, and `email`. Right now nothing enforces this; you could write `{ id: 1, naam: 'Alice' }` and the compiler would not complain because it has no declared shape to check against.

A type alias gives the shape a name and makes it enforceable.

### Create the Type Alias

Add the type alias directly above `initialContacts` in `App.tsx`:

```tsx
// src/App.tsx
type Contact = {
  id: number;
  name: string;
  email: string;
};

const initialContacts: Contact[] = [
  { id: 1, name: "Alice Tan", email: "alice@example.com" },
  { id: 2, name: "Bob Lim", email: "bob@example.com" },
  { id: 3, name: "Carol Wong", email: "carol@example.com" },
  { id: 4, name: "David Chen", email: "david@example.com" },
];
```

`Contact` declares that any value of this type must have:

- `id`: a number
- `name`: a string
- `email`: a string

`Contact[]` means "an array of Contact". TypeScript now checks every object in the array against the type.

### See the Type Alias in Action

Introduce a typo in one of the objects:

```tsx
// src/App.tsx
{ id: 1, naam: 'Alice Tan', email: 'alice@example.com' }, // Error: Object literal may only specify known properties
```

The compiler flags this immediately. Restore the correct field name before continuing.

Now type `c.` inside the `.filter()` callback. Your editor suggests `id`, `name`, and `email`, and nothing else. Autocomplete is driven by the type alias.

### A Note on `interface`

`Contact` was declared with `type`, which is what this course uses by default for object shapes, unions, and everything else that needs a name. Using one keyword consistently means you never have to stop and decide which one applies.

> **The other keyword you may see: `interface`**
>
> TypeScript also has an `interface` keyword, and you will encounter it often in other codebases and tutorials. For a plain object shape like `Contact`, it behaves almost identically to `type`:
>
> ```ts
> interface Contact {
>   id: number;
>   name: string;
>   email: string;
> }
> ```
>
> The one real difference is that `interface` supports `extends`, which lets one shape build on another. This is a genuinely useful feature for composing large, layered shapes, but it is a more advanced use case that this lesson does not need: every shape here is small enough to write out directly.
>
> The wider TypeScript community is genuinely split on this: some style guides and codebases prefer `interface` for object shapes, others prefer `type`. This course picks `type` as the default so that you are learning one keyword for naming a shape while you get used to the type system, not because `interface` is wrong. Consistency within a codebase matters far more than which one it settles on. You do not need to use `interface` anywhere in this lesson; it is included here only so that you recognise it when you meet it elsewhere.

---

## Part 3: Typing Component Props (25 minutes; the activity below is optional / take-home)

Props are the primary API of a component. A typed props type documents exactly what a component needs and lets the compiler catch mismatches at the call site, where you use the component, rather than inside the component's rendering logic.

### Move `Contact` to Its Own File

`ContactList` needs to describe its props as "an array of `Contact`", which means the `Contact` type declared in Part 2 is now needed in a second place. This is the point where it is worth moving out of `App.tsx`: leaving it there works, but every component that needs it from now on would have to import it from a file whose main purpose is something else.

Create `src/types/Contact.ts` and move the type there:

```ts
// src/types/Contact.ts
export type Contact = {
  id: number;
  name: string;
  email: string;
};
```

> **Why `src/types/`, and why now**
>
> A single-use type is fine living next to the code that uses it. Once a second component needs the same shape, as `ContactList` does here, giving it a shared, predictable location avoids a second refactor later when a third component needs it too. `src/types/` is that predictable location for this project.

### Move `SearchBar` and `ContactList` Into Their Own Files

Right now `SearchBar` and `ContactList` are defined inside `App.tsx`, alongside `App` itself. This was fine while the file was small, but it is the reason `Contact`'s new home in `src/types/` has not paid off yet: both components still live in the same file that would import it, so nothing has actually been shared across files.

Create `src/components/ContactList.tsx`, moving the component exactly as it is, with its props still untyped:

```tsx
// src/components/ContactList.tsx
export function ContactList({ contacts }) {
  return (
    <ul className="contact-list">
      {contacts.map((c) => (
        <li key={c.id} className="contact-item">
          <strong>{c.name}</strong> · {c.email}
        </li>
      ))}
    </ul>
  );
}
```

Create `src/components/SearchBar.tsx`, the same way:

```tsx
// src/components/SearchBar.tsx
export function SearchBar({ query, onQueryChange }) {
  return (
    <input
      className="search-input"
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      placeholder="Search contacts..."
    />
  );
}
```

Remove both function definitions from `App.tsx` and import them instead:

```tsx
// src/App.tsx
import { SearchBar } from "./components/SearchBar";
import { ContactList } from "./components/ContactList";
```

`initialContacts` and the rest of `App`'s logic keep working exactly as before; only the location of the two components changed. Neither file imports `Contact` yet; that happens in the next step, where typing `ContactList`'s props is what actually needs it.

### Type `ContactList` Props

Add a props type above the `ContactList` function, now in its own file:

```tsx
// src/components/ContactList.tsx
import { Contact } from "../types/Contact";

type ContactListProps = {
  contacts: Contact[];
};

export function ContactList({ contacts }: ContactListProps) {
  return (
    <ul className="contact-list">
      {contacts.map((c) => (
        <li key={c.id} className="contact-item">
          <strong>{c.name}</strong> · {c.email}
        </li>
      ))}
    </ul>
  );
}
```

The `{ contacts }: ContactListProps` syntax destructures the props object and types it in one step.

Notice the import path: `../types/Contact`, not `./types/Contact` as it was when `Contact` was imported directly into `App.tsx`. This is the payoff of the two moves you just made: `Contact` now has one definition that both a page-level component (`App.tsx`) and a reusable component (`ContactList.tsx`) import, from two different relative paths, instead of being redeclared or copy-pasted in each place that needs it.

### Test the Prop Checking

In the `App` component JSX, temporarily remove the `contacts` prop:

```tsx
// src/App.tsx
<ContactList /> // Error: Property 'contacts' is missing
```

The compiler flags the missing required prop. Restore it before continuing.

Now try passing the wrong type:

```tsx
// src/App.tsx
<ContactList contacts="not an array" /> // Error: Type 'string' is not assignable to type 'Contact[]'
```

Restore the correct value.

### Optional Props

Add a `title` prop to `ContactListProps` that is optional:

```tsx
// src/components/ContactList.tsx
type ContactListProps = {
  contacts: Contact[];
  title?: string;
};
```

The `?` means the prop can be omitted at the call site. If provided, it must be a `string`. Update `ContactList` to render the title if it is present:

```tsx
// src/components/ContactList.tsx
export function ContactList({ contacts, title }: ContactListProps) {
  return (
    <>
      {title && <h2>{title}</h2>}
      <ul className="contact-list">
        {contacts.map((c) => (
          <li key={c.id} className="contact-item">
            <strong>{c.name}</strong> · {c.email}
          </li>
        ))}
      </ul>
    </>
  );
}
```

Pass the title from `App`:

```tsx
// src/App.tsx
<ContactList contacts={filtered} title="Contacts" />
```

---

### Activity: Type the `SearchBar` Props (10 minutes, optional / take-home)

If time is short, this activity can be assigned as take-home practice instead of done live; `SearchBar` is not required by anything in the parts that follow. Note, though, that `npm run build` will keep failing until `SearchBar`'s props are typed, since that is one of the remaining untyped spots from the starter code.

`SearchBar` currently has untyped props. Your task is to add a props type in `src/components/SearchBar.tsx`.

The component accepts:

- `query`: a string
- `onQueryChange`: a function that receives a string and returns nothing

**Hints:**

1. A function type that receives a string and returns nothing is written as `(value: string) => void`.
2. Add the type directly above the `SearchBar` function, the same way you did for `ContactList`.
3. After adding the type, try passing a number as `query` in the `App` JSX and observe the error before fixing it.

<details>
<summary>Reference solution</summary>

```tsx
// src/components/SearchBar.tsx
type SearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function SearchBar({ query, onQueryChange }: SearchBarProps) {
  return (
    <input
      className="search-input"
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      placeholder="Search contacts..."
    />
  );
}
```

</details>

---

## Part 4: Typing State and Event Handlers (25 minutes; the activity below is optional / take-home)

### Typing `useState`

`useState` infers the type of its state from the initial value you give it, so most calls need no extra work at all:

```tsx
// src/App.tsx
const [contacts, setContacts] = useState(initialContacts);
const [query, setQuery] = useState("");
```

`initialContacts` is already declared as `Contact[]` from Part 2, so TypeScript infers `contacts` as `Contact[]` without being told; `''` is already a `string`, so `query` is inferred as `string` the same way. Neither line needs any extra annotation, and this is the common case: most `useState` calls in this app, and in most React code, are typed correctly by inference alone.

This works because the initial value carries enough information for TypeScript to infer the type from. That is not always true: later in this lesson, `useState` is given an empty array as its initial value, and an empty array carries no information about what it will eventually hold. When inference has nothing to work with like this, `useState` needs to be told the type explicitly, which is covered when it comes up.

### Typing a Function Parameter

`addContact` already exists in `App`, with an untyped parameter. Add the type:

```tsx
// src/App.tsx
const addContact = (newContact: Contact) => {
  setContacts((prev) => [...prev, newContact]);
};
```

There is no return type annotation here, and there should not be one: `addContact` has no `return` statement, so TypeScript infers its return type as `void` on its own. Writing `: void` explicitly would add nothing, the same way `useState<string>('')` added nothing back in Part 4's opening example; leave it off.

An explicit return type earns its place when a function's return value is not obvious from its body, or when you want to document the shape a caller can rely on without reading the implementation:

```ts
function getContact(id: number): Contact {
  // ...
}
```

Even here, TypeScript could likely infer `Contact` correctly on its own. The annotation is not filling a gap in inference; it is a deliberate contract, useful when the return value matters enough to a caller that stating it explicitly is worth the extra line. `addContact` returns nothing meaningful to any caller, so no such contract is needed.

Test the type safety: temporarily call `addContact` with an object that is missing `email`:

```tsx
// src/App.tsx
addContact({ id: 5, name: "Eve Ng" }); // Error: Property 'email' is missing
```

Restore the correct call before continuing.

### Typing Event Handlers

`App` already has a form for adding a contact, along with `newName`, `newEmail`, and `handleAdd` to support it; none of it is typed yet. `handleAdd` needs an explicit type, but the two `onChange` handlers on the inputs do not, for a reason worth understanding rather than memorising:

```tsx
// src/App.tsx
function App() {
  const [contacts, setContacts] = useState(initialContacts);
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const addContact = (newContact: Contact) => {
    setContacts((prev) => [...prev, newContact]);
  };

  const handleAdd = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newName || !newEmail) return;
    addContact({ id: Date.now(), name: newName, email: newEmail });
    setNewName("");
    setNewEmail("");
  };

  return (
    <div className="app">
      <h1>ts-contacts</h1>
      <SearchBar query={query} onQueryChange={setQuery} />
      <form onSubmit={handleAdd} className="add-contact-form">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Name"
        />
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Email"
        />
        <button type="submit">Add</button>
      </form>
      <ContactList contacts={filtered} title="Contacts" />
    </div>
  );
}
```

- `handleAdd` requires an explicit type annotation `: React.SubmitEvent<HTMLFormElement>` annotation on its `e` parameter because nothing tells TypeScript what `e` is.

- The two `onChange` handlers are written directly inline, hence the event type can be inferred automatically. This is called **contextual typing**: the type flows in from where the function is used, not from an annotation you wrote.

> **Why keep `addContact` separate from `handleAdd`?**
>
> `addContact`'s one line could be inlined directly into `handleAdd`, and the app would behave identically either way; this is not a rule TypeScript enforces. The previous section typed `addContact` on its own, with a single manual call to trigger the missing-field error, before touching `handleAdd` at all. That was a deliberate sequencing choice: typing a plain function parameter and typing a form event handler are two different things to learn, and separating them meant each one had its own small, isolated example rather than both landing in the same code block at once. Keeping `addContact` separate also has a small ongoing benefit: `addContact({ id, name, email })` reads as "add this contact," independent of where the data came from, which keeps `handleAdd` focused on reading the form.

> **You do not need to memorise event types**
>
> In practice, you hover over the handler in your editor and it tells you the type. Or you write the handler inline and let TypeScript infer it. Writing the explicit annotation is good for teaching; in daily work, inference usually handles it.

---

### Activity: Add a Remove Button (10 minutes, optional / take-home)

If time is short, this activity can be assigned as take-home practice instead of done live; nothing later in the lesson depends on the remove button existing. (Bonus Challenge 3 does build on `removeContact`, so skip that challenge too if this activity was not done.)

Add a `removeContact` function to `App` and a remove button to each contact in `ContactList`.

**Task:**

1. Write a `removeContact` function in `App` that accepts an `id` of type `number` and removes the matching contact from state.
2. Add `onRemove` to `ContactListProps` as a function that accepts a `number` and returns `void`.
3. Pass `removeContact` as the `onRemove` prop to `<ContactList />`.
4. Render a button in each list item that calls `onRemove` with the contact's `id`.

**Hints:**

1. The function signature is `const removeContact = (id: number) => { ... }`. No return type annotation is needed, since the function has no `return` statement and TypeScript infers `void` on its own.
2. Use `contacts.filter(c => c.id !== id)` inside the function.
3. The type of `onRemove` in `ContactListProps` is `(id: number) => void`.
4. In the list item: `<button onClick={() => onRemove(c.id)}>Remove</button>`.

<details>
<summary>Reference solution</summary>

In `App`:

```tsx
// src/App.tsx
const removeContact = (id: number) => {
  setContacts((prev) => prev.filter((c) => c.id !== id));
};

// In JSX:
<ContactList contacts={filtered} title="Contacts" onRemove={removeContact} />;
```

Updated `ContactListProps` and `ContactList` in `src/components/ContactList.tsx`:

```tsx
// src/components/ContactList.tsx
type ContactListProps = {
  contacts: Contact[];
  title?: string;
  onRemove: (id: number) => void;
};

export function ContactList({ contacts, title, onRemove }: ContactListProps) {
  return (
    <>
      {title && <h2>{title}</h2>}
      <ul className="contact-list">
        {contacts.map((c) => (
          <li key={c.id} className="contact-item">
            <span>
              <strong>{c.name}</strong> · {c.email}
            </span>
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

## Part 5: Typing an API Fetch (10 minutes, instructor demo)

> **This part is a demo, not hands-on coding.** The instructor walks through this section live, at the front of the room, narrating each step; learners watch and follow along on the projector rather than typing the code themselves. This keeps the lesson's signature payoff, the `db.json` type-erasure demonstration, without spending live time on every learner independently wiring up `useEffect` and error handling. If time allows, learners can revisit this part on their own afterward using the code below.

### A New Piece of Syntax: the Type Parameter

`fetch` is a standard browser API. Its return type in TypeScript is `Promise<Response>`. The `.json()` method on `Response` returns `Promise<any>`; TypeScript does not know what shape the data has. This means that without additional annotation, data fetched from an API is typed as `any`, and TypeScript cannot check how you use it.

The state that holds the fetched contacts has the same problem, for a related reason. It starts out empty, before any data has arrived:

```ts
const [contacts, setContacts] = useState([]);
```

`[]` on its own gives TypeScript nothing to infer an element type from, so TypeScript infers the narrowest possible type it can justify: `never[]`, an array that can never hold anything. Every later call to `setContacts(data)` would then fail to compile, since no array of real contacts is assignable to `never[]`.

This is where `useState` accepts a **type parameter**: a type, written inside angle brackets `<...>` right after the function name, alongside its regular value argument in parentheses. Passing a type parameter tells TypeScript directly what the value should be treated as, when the value on its own is not enough to tell:

```ts
useState<Contact[]>([]);
//       ^^^^^^^^^ a type, passed as a type parameter
//                  ^^ a value, passed as a regular argument
```

Without the type parameter, TypeScript infers `never[]`. With it, TypeScript treats the state as `Contact[]`, even though the value passed in right now is empty. This is why `useState` is called a **generic function**: it is not hardcoded to hold one specific type, it holds whatever type you tell it to, via the type parameter.

### Setup: Start json-server

Open a second terminal and run:

```bash
npm run server
```

json-server serves `data/db.json` at `http://localhost:3001`. The contacts endpoint is at `http://localhost:3001/contacts`.

### Replace the Hardcoded Data

In `App.tsx`, remove `initialContacts` and add a `useEffect` that fetches from json-server instead. Add `useEffect` to the React import:

```tsx
// src/App.tsx
import { useState, useEffect } from "react";
```

Update the `App` component:

```tsx
// src/App.tsx
export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContacts = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3001/contacts');

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const data: Contact[] = await response.json();
        setContacts(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, []);

  // ... rest of the component
```

This is the same `async/await` with `try / catch / finally` structure from Lesson 2.5, with one addition: `const data: Contact[] = await response.json()`.

`response.json()` returns `Promise<any>`, so without this annotation, `data` would simply be `any`. Try removing it: `const data = await response.json()` compiles with no error, and so does `setContacts(data)` right after it, since `any` is assignable everywhere with no checking at all. The annotation is not fixing an error; there is no error to fix either way. What it does instead is stop `any` from silently spreading into the rest of the app: without it, `data.map(...)`, `data[0].email`, and every other place `contacts` is later used would all go unchecked too, since `any` disables checking wherever it flows. `const data: Contact[] = ...` is a **type annotation**: it declares what type the variable is supposed to have, and TypeScript trusts that declaration for a value coming from `any`, rather than verifying it.

Notice also `(err as Error).message` in the `catch` block, which uses a different piece of syntax: `as Error` is a **type assertion**, not an annotation. The distinction matters: an annotation (`const data: Contact[] = ...`) declares the type of a variable; an assertion (`value as Type`) tells TypeScript to treat an existing expression as a different type, right where it is used, without declaring a new variable. TypeScript types a caught error as `unknown` by default, because JavaScript allows you to `throw` any value, not just an `Error`. The `as Error` assertion tells TypeScript to treat `err` as an `Error` so that `.message` is accessible. Both the annotation and the assertion end up trusting a claim TypeScript cannot verify, since both `any` and `unknown` are cases where TypeScript has no shape of its own to check against; that is why they can feel interchangeable here, even though they are different tools.

### The Limitation: Runtime vs. Compile Time

Before the next step, it helps to understand why TypeScript cannot protect you from bad API data.

Think of TypeScript like a spell-checker. It marks mistakes while you write, but when you print the document, the red underlines are gone: the printed page has no memory that any checking happened. TypeScript works the same way: `tsc` checks your types during development, then strips every annotation out before the browser runs the code. The browser sees plain JavaScript with no knowledge that types ever existed.

This means TypeScript can only check things it can see at development time: the code you write. It cannot check data that arrives after the app is running: API responses, values from `localStorage`, user input. By the time that data arrives, the types are already gone.

The annotation `const data: Contact[] = ...` is a promise you make to the compiler. The compiler trusts it, since `data`'s actual type at this point is `any` and TypeScript has nothing of its own to check the annotation against. But if the server returns something different, there is nothing left at runtime to catch the mismatch.

To make this concrete, temporarily break `data/db.json` by renaming `email` to `emailAddress` in one record:

```json
// data/db.json
{ "id": 1, "name": "Alice Tan", "emailAddress": "alice@example.com" }
```

Save the file and reload the app. The data loads without any TypeScript error. But in the rendered list, Alice's email shows as blank: `c.email` is `undefined` at runtime because the field does not exist.

TypeScript did not catch this. The annotation `const data: Contact[] = ...` is a compile-time claim. At runtime, the data is raw JSON from the network; TypeScript has no way to verify it.

**TypeScript's types are erased at runtime. Neither an annotation nor an assertion can protect against unexpected data from an external source.**

Restore `data/db.json` to the correct field name before continuing.

### Render the Loading and Error States

Update the `App` return to handle the three states:

```tsx
// src/App.tsx
if (loading) return <p className="status-message">Loading...</p>;
if (error) return <p className="status-message error">Error: {error}</p>;

return (
  // ... existing JSX
);
```

The type of `error` is `string | null`. TypeScript knows that inside the `if (error)` branch, `error` is narrowed to `string`, so rendering `{error}` is safe without any additional null check.

> **For production apps: validate API responses**
>
> When the shape of an API response cannot be fully trusted, such as a third-party API or a backend under active development, a runtime validation library like Yup (covered in Lesson 2.11 for form validation) can verify the shape before you use the data. The annotation `Contact[]` is a convenience for trusted sources; a validation library is the right tool when you need a guarantee.

---

## Part 6: Typing `useContext` (20 minutes, optional self-study)

> **This part is optional.** Everything in the Learning Objectives is already covered by the end of Part 5; Part 6 is a bonus part for learners who want to see the type parameter and union types applied to a second, different pattern (context, rather than state and fetch). If time in the room runs short, it is safe to stop after Part 5 and either skip Part 6 or assign it as self-study, since nothing later in this lesson depends on it.

`createContext` is a generic function too, the same kind you just saw with `useState<Contact[]>` in Part 5. It also needs a type parameter, for a similar reason.

### Create a Typed Context

Create `src/contexts/AuthContext.tsx`:

```tsx
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState } from "react";

type User = {
  id: number;
  name: string;
  role: "admin" | "member";
};

type AuthContextValue = {
  user: User | null;
  login: (name: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
```

Look at the `role` field on `User`: `'admin' | 'member'`. A plain `string` would accept any text at all, but a user's role is only ever one of these two specific values. TypeScript expresses "this value must be one of exactly these options, and nothing else" with a **union type**, written using `|` between the allowed values. Try assigning anything else to see the compiler reject it:

```tsx
// src/contexts/AuthContext.tsx
const testUser: User = { id: 1, name: "Alice", role: "guest" }; // Error: Type '"guest"' is not assignable to type '"admin" | "member"'
```

Remove this test line before continuing; it was only added to see the error. This pattern, an explicit list of allowed string values joined with `|`, is called a **string literal union**, and it is why autocomplete offers only `'admin'` and `'member'` when you type `role:` inside a `User` object.

Now look at the type parameter passed to `createContext`: `AuthContextValue | null`. `createContext` needs an initial value, and at the point the context is created there is no provider yet, so `null` is the honest initial value to pass. But `createContext(null)` on its own would give TypeScript nothing to infer beyond `null` itself, the same problem `useState([])` had in Part 5. The type parameter `<AuthContextValue | null>` tells TypeScript to treat the context as that whole union instead, even though the value passed in right now is just `null`.

Notice that `AuthContextValue` itself also has a `user: User | null` field. This is a second, separate use of `| null`: `AuthContext` can be `null` before the provider mounts, and `user` can be `null` after the provider mounts but before anyone logs in. Keeping the two straight is the main source of confusion with typed context, so it is worth pausing on: one `null` means "no provider," the other means "no logged-in user."

### Add the Provider

```tsx
// src/contexts/AuthContext.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (name: string) => {
    setUser({ id: Date.now(), name, role: "member" });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

`React.ReactNode` is the type for anything React can render: JSX, strings, numbers, arrays, `null`. It is the correct type for a `children` prop.

### Add a Typed Consumer Hook

Rather than calling `useContext(AuthContext)` in every component, which returns `AuthContextValue | null` and requires each consumer to handle `null`, write a hook that handles the null check once:

```tsx
// src/contexts/AuthContext.tsx
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
```

The return type annotation `: AuthContextValue` (without `| null`) tells TypeScript that after the null check, the value is guaranteed to be present. Consumers of `useAuth()` receive a fully typed, non-null value. Note that this guard only removes the "no provider" `null`; `user` inside `AuthContextValue` can still be `null`, and every consumer still has to check it before reading `user.name`.

> **Why `createContext<T | null>(null)` with a wrapping hook?**
>
> This is the standard TypeScript pattern for React context. The alternative, providing a fake default value to avoid `null`, silently hides the case where a component is used outside its provider. The `null` initial value plus the guard in the hook makes that mistake loud and obvious.

### Wire Up the Provider and Consumer

In `src/main.tsx`, wrap `<App />` with `<AuthProvider>`:

```tsx
// src/main.tsx
import { AuthProvider } from "./contexts/AuthContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
```

In `App.tsx`, import and use `useAuth`:

```tsx
// src/App.tsx
import { useAuth } from "./contexts/AuthContext";

export default function App() {
  const { user, login, logout } = useAuth();

  return (
    <div className="app">
      <div className="app-header">
        <h1>ts-contacts</h1>
        {user ? (
          <button onClick={logout}>Log out ({user.name})</button>
        ) : (
          <button onClick={() => login("Alice Tan")}>Log in</button>
        )}
      </div>
      {/* rest of the JSX */}
    </div>
  );
}
```

TypeScript knows `user` is `User | null`. Inside the `user ? ... : ...` branch, TypeScript narrows `user` to `User` on the true side, so `user.name` is safe to read without an extra check. On the false side, TypeScript knows `user` is `null`, which is why the login button does not try to read from it.

### Verify the Error Guard

Temporarily move `useAuth()` outside the `<AuthProvider>` by calling it in a component rendered before the provider wraps the app. The runtime throws the descriptive error. This guard would be impossible without the hook: a direct `useContext` call would return `null` silently, and `user` would be indistinguishable from "logged out."

Undo the change before continuing.

---

## Wrap-Up: What TypeScript Does Not Do (5 minutes)

TypeScript is a compile-time tool. Once the compiler finishes, every type annotation is stripped out and the app runs as plain JavaScript.

This means:

- **Runtime data is untyped until you assert or validate it.** API responses, `localStorage` values, and user input are all `any` or `unknown` until you annotate them. An assertion like `as Contact[]` is a claim, not a guarantee.
- **TypeScript does not prevent logical bugs.** If your logic is correctly typed but semantically wrong, such as filtering by the wrong field or calculating an incorrect value, TypeScript will not catch it. Tests do.
- **TypeScript makes refactoring safer.** Change a type and the compiler tells you every place that needs updating. Rename a prop and every callsite is flagged immediately.

---

## Bonus Challenges

These challenges have no provided solution. They are for learners who finish the lab early.

1. Add a `ContactCard` component that renders a single contact's details. Type its props. Make the `email` prop optional and display a placeholder string when it is absent.
2. Change the `Contact` type so that `email` is `string | null` instead of `string`. The compiler will highlight every location that needs to handle `null`; fix each one.
3. Extract the `addContact` and `removeContact` logic into a custom hook named `useContacts` that returns `{ contacts, addContact, removeContact }`. Add an explicit return type annotation to the hook.
4. Add a cleanup function to the `useEffect` in Part 5 using an `ignore` flag, so that a stale response from an earlier fetch cannot overwrite the result of a later one:
   ```tsx
   useEffect(() => {
     let ignore = false;
     fetch("http://localhost:3001/contacts")
       .then((res) => res.json())
       .then((data: Contact[]) => {
         if (!ignore) setContacts(data);
       });
     return () => {
       ignore = true;
     };
   }, []);
   ```

---

## Common Pitfalls

**Forgetting `| null` in `createContext`**

```tsx
// Wrong: TypeScript infers the context type as 'undefined', not your type
const AuthContext = createContext<AuthContextValue>(undefined);

// Correct: the initial value is null and the type includes null
const AuthContext = createContext<AuthContextValue | null>(null);
```

**Trusting an unverified type on API data**

```tsx
// This compiles with no errors even if the API returns something completely different
const data: Contact[] = await response.json();
setContacts(data);

// The annotation is a claim to the compiler, not a runtime check.
// (The same is true of an `as Contact[]` assertion.)
// If the API shape changes, your app breaks silently.
```

**Using `any` to silence errors**

```tsx
// Wrong: 'any' turns off all type checking for this value
function addContact(newContact: any) { ... }

// Correct: use the actual type
function addContact(newContact: Contact) { ... }
```

**Calling `useState` with an empty array and no type parameter**

```tsx
// Wrong: TypeScript infers never[], so setContacts will reject Contact objects
const [contacts, setContacts] = useState([]);

// Correct: provide the type parameter so TypeScript knows what the array holds
const [contacts, setContacts] = useState<Contact[]>([]);
```

---

## Cheat Sheet: What to Type in a Typical React App

Use this table as a quick reference after the lesson. It lists the parts of a component that need a type annotation, and what to reach for.

| What                                                   | Typical annotation                                                               | Example                                                                |
| ------------------------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Object / data shape                                    | `type`                                                                           | `type Contact = { id: number; name: string; email: string; };`         |
| Union of fixed values                                  | `type`                                                                           | `type Status = 'active' \| 'inactive' \| 'pending';`                   |
| Component props                                        | `type` above the component, destructured in the signature                        | `function ContactList({ contacts }: ContactListProps)`                 |
| Optional prop                                          | `?` after the field name                                                         | `title?: string;`                                                      |
| `useState`                                             | Type parameter, required when the initial value is `[]` or `null`                | `useState<Contact[]>([])`                                              |
| Function prop / callback                               | Function type in the props type                                                  | `onRemove: (id: number) => void;`                                      |
| Form submit handler (named, declared separately)       | `React.SubmitEvent<HTMLFormElement>` on the `e` parameter                        | `const handleAdd = (e: React.SubmitEvent<HTMLFormElement>) => { ... }` |
| Input change handler (inline, written in the JSX prop) | No annotation needed; contextual typing infers it                                | `onChange={e => setNewName(e.target.value)}`                           |
| `children` prop                                        | `React.ReactNode`                                                                | `{ children }: { children: React.ReactNode }`                          |
| API response                                           | Type annotation on the parsed JSON, or a validation library for untrusted sources | `data: Contact[]` (or Yup, see Lesson 2.11)                          |
| Context value                                          | `type`, unioned with `null` in `createContext`                                   | `createContext<AuthContextValue \| null>(null)`                        |
| Custom hook return                                     | Explicit return type on the hook function                                        | `function useContacts(): { contacts: Contact[]; addContact: ... }`     |

> **Rule of thumb:** if you can hover over a value in your editor and it already shows the type you want, you do not need to write it. Add explicit annotations where TypeScript cannot infer enough on its own, most often: empty initial state, function parameters, event handlers, and data coming from outside the app (APIs, `localStorage`, user input).

---

## Summary

| Concept                    | What it does                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| Type annotations           | Document the expected type of a variable, parameter, or return value                      |
| `type`                     | Names the required shape of an object and makes it reusable                               |
| Typed props                | Lets the compiler catch missing or wrong props at the call site                           |
| `useState<T>`              | Constrains what the state can hold; essential when the initial value is `[]` or `null`    |
| Type assertion (`as T`)    | Claims a type the compiler cannot verify; safe for trusted sources, not for external data |
| `createContext<T \| null>` | The standard pattern for typed context; the wrapping hook handles the null check once     |

TypeScript does not change how React works. It adds a layer of checking that catches mistakes earlier, makes editors smarter, and makes large codebases safer to change.

---

## Additional Resources

- [TypeScript for JavaScript Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html), TypeScript documentation
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [useState with TypeScript](https://react.dev/reference/react/useState#storing-information-from-previous-renders), React documentation
