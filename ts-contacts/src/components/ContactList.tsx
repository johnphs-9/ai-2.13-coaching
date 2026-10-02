// src/components/ContactList.tsx
import type { Contact } from "../types/Contact";

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
