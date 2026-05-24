# 2.13 TypeScript for React Developers

## Lesson Overview

This coaching session introduces TypeScript as a layer of safety on top of React. Rather than starting a new project from scratch in TypeScript, learners migrate a small working JavaScript app called `ts-contacts` — a contact list with search, add, and remove functionality — to TypeScript in six progressive stages. Each stage introduces one concept: basic type annotations, interfaces, typed component props, typed state and event handlers, typed context with `createContext`, and typed API responses fetched from json-server. The session ends with a concrete demonstration of type erasure — breaking `db.json` to show that TypeScript's compile-time assertions cannot protect against unexpected runtime data — and a brief discussion of what TypeScript cannot do.

## Dependencies

- [Lesson](./lesson.md)

## Lesson Objectives

- Annotate React component props, state, and event handlers with TypeScript types
- Define shared data shapes using interfaces and apply them across components
- Explain the difference between TypeScript's compile-time guarantees and runtime behaviour

## Lesson Plan

| Duration | What | How or Why |
|---|---|---|
| 25 min | Lecture | Slides: why TypeScript, TypeScript as a superset of JavaScript, primitive types, interfaces, generics, type erasure, TypeScript in React, the toolchain |
| 15 min | Setup + Part 1 | Scaffold `ts-contacts` with `--template react-ts`; install json-server; replace default files with starter code; add basic type annotations; observe type inference and a type error |
| 25 min | Part 2: Interface | Create `src/types/Contact.ts`; annotate `initialContacts`; demonstrate typo detection and autocomplete |
| 5 min | Break | — |
| 30 min | Part 3: Typed props | Type `ContactList` props; demonstrate missing and wrong prop errors; add optional `title` prop; Activity: type `SearchBar` props including a function type |
| 30 min | Part 4: Typed state and event handlers | Add `useState` type parameters; type `addContact` and form event handlers; Activity: add typed `removeContact` wired through `ContactListProps` |
| 5 min | Break | — |
| 20 min | Part 5: Typed `useContext` | Create `ThemeContext` with `createContext<T \| null>(null)`; add `ThemeProvider` and `useTheme` hook with null guard; wire up light/dark toggle |
| 20 min | Part 6: Typed API fetch | Replace hardcoded data with `useEffect` fetch from json-server; use type assertion; break `db.json` to demonstrate type erasure; add loading and error state |
| 5 min | Wrap up and Q&A | Summary table; what TypeScript does not do; bonus challenges |
| **Total** | | **180 min** |
