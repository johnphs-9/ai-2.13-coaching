// src/App.tsx
import { useState } from "react";
import "./App.css";
import { SearchBar } from "./components/SearchBar";
import { ContactList } from "./components/ContactList";

const appTitle: string = "ts-contacts";

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

// function SearchBar({ query, onQueryChange }) {
//   return (
//     <input
//       className="search-input"
//       value={query}
//       onChange={(e) => onQueryChange(e.target.value)}
//       placeholder="Search contacts..."
//     />
//   );
// }

// function ContactList({ contacts }) {
//   return (
//     <ul className="contact-list">
//       {contacts.map((c) => (
//         <li key={c.id} className="contact-item">
//           <strong>{c.name}</strong> · {c.email}
//         </li>
//       ))}
//     </ul>
//   );
// }
