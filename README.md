# 2.13 TypeScript for React Developers

## Lesson Overview

This coaching session introduces TypeScript as a layer of safety on top of React. Rather than starting a new project from scratch in TypeScript, learners migrate a small working JavaScript app called `ts-contacts`, a contact list with search, add, and remove functionality, to TypeScript in six progressive stages. Each stage introduces one concept: basic type annotations, type aliases, typed component props, typed state and event handlers, typed API responses fetched from json-server, and (optional) typed context with `createContext`. Part 6 (typed context) is optional self-study; all three Lesson Objectives are already met by the end of Part 5. The session ends with a concrete demonstration of type erasure, breaking `db.json` to show that TypeScript's compile-time annotations cannot protect against unexpected runtime data, and a brief discussion of what TypeScript cannot do.

To keep the session inside a standard 3-hour slot, three parts are lighter than a full hands-on treatment by default: the Part 3 and Part 4 activities are assigned as take-home practice rather than done live, and Part 5 (typed API fetch) is run as an instructor demo rather than coded along by every learner. All three can be switched back to hands-on if there is time to spare.

The session opens with a recap of Lessons 2.11-2.12 (form validation with Yup, deployment, and an introduction to Next.js) before the 2.13 lecture and lab begin.

## Dependencies

- [Lesson](./lesson.md)

## Lesson Objectives

- Annotate React component props, state, and event handlers with TypeScript types
- Define shared data shapes using type aliases and apply them across components
- Explain the difference between TypeScript's compile-time guarantees and runtime behaviour

## Lesson Plan

| Duration | What | How or Why |
|---|---|---|
| 15 min | Recap: Lessons 2.11-2.12 | Slides: Yup schema validation, deployment to Netlify with environment variables, Next.js App Router, Server vs. Client Components, middleware, Server Actions |
| 25 min | Lecture: Lesson 2.13 | Slides: what a type is, static vs. dynamic typing, why TypeScript, TypeScript as a superset, primitive types, type aliases, union types, generics, TypeScript in React, the toolchain |
| 20 min | Setup + Part 1 | Scaffold `ts-contacts` with `--template react-ts`; walk through the TypeScript template's changes; turn off two ESLint rules for this lesson; install json-server; replace default files with starter code (including a working add-contact form); observe type inference and a type error |
| 15 min | Part 2: Type alias | Create a `Contact` type alias inline in `App.tsx`; annotate `initialContacts`; demonstrate typo detection and autocomplete; note on `interface` as an alternative keyword |
| 5 min | Break | |
| 25 min | Part 3: Typed props | Move `Contact` to `src/types/`, then `SearchBar` and `ContactList` to `src/components/`; type `ContactList` props; demonstrate missing and wrong prop errors; add optional `title` prop. Activity (type `SearchBar` props) assigned as take-home, not live |
| 25 min | Part 4: Typed state and event handlers | Type `useState` calls, `addContact`'s parameter, and `handleAdd`'s form event; contrast contextual typing (inline `onChange` handlers) with an explicit annotation (a named handler). Activity (typed `removeContact`) assigned as take-home, not live |
| 5 min | Break | |
| 10 min | Part 5: Typed API fetch (instructor demo) | Instructor demos, learners watch rather than code along: introduce the type parameter via `useState<Contact[]>([])`; fetch from json-server; type the parsed JSON; break `db.json` to demonstrate type erasure; add loading and error state |
| 5 min | Wrap up and Q&A | Summary table; what TypeScript does not do; bonus challenges |
| **Total (Part 6 as self-study)** | | **~150 min (2 hr 30 min)** |
| 20 min | Part 6 (optional): Typed `useContext` | Create `AuthContext` with `createContext<AuthContextValue \| null>(null)`; introduce the union type via `role: 'admin' \| 'member'`; add `AuthProvider` and `useAuth` hook with null guard; wire up login/logout |
| **Total (with Part 6 taught live)** | | **~170 min (2 hr 50 min)** |

Part 6 is the part to cut or assign as take-home reading if the session is still running behind; nothing later in the lesson depends on it. If there is extra time to spare instead, Part 3, Part 4, and Part 5 can each revert to a fully hands-on treatment (their activities done live, Part 5 coded along rather than demoed), which adds back roughly 35 minutes (10 min per activity, 15 min for Part 5 hands-on instead of demo).
