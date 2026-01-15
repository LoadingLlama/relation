/**
 * ContactsList - Simple text list of contacts (macOS style)
 */

import { Relationship } from '../../types';
import './Contacts.css';

interface ContactsListProps {
  relationships: Relationship[];
  onContactClick: (relationship: Relationship) => void;
  selectedId?: string;
  currentUserId: string;
}

export function ContactsList({ relationships, onContactClick, selectedId }: ContactsListProps) {
  // Sort alphabetically by name
  const sortedRelationships = [...relationships].sort((a, b) => {
    const nameA = a.user_b_data?.name || '';
    const nameB = b.user_b_data?.name || '';
    return nameA.localeCompare(nameB);
  });

  // Group by first letter
  const grouped = sortedRelationships.reduce((acc, rel) => {
    const name = rel.user_b_data?.name || '';
    const letter = name.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(rel);
    return acc;
  }, {} as Record<string, Relationship[]>);

  const letters = Object.keys(grouped).sort();

  if (relationships.length === 0) {
    return (
      <div className="contacts-empty">
        <p>No connections yet</p>
        <p className="contacts-empty-hint">Click + to add a connection</p>
      </div>
    );
  }

  return (
    <div className="contacts-list">
      {letters.map(letter => (
        <div key={letter}>
          <div className="contacts-section">{letter}</div>
          {grouped[letter].map(rel => {
            const contact = rel.user_b_data;
            if (!contact) return null;

            return (
              <div
                key={rel.id}
                className={`contact-item ${selectedId === rel.id ? 'selected' : ''}`}
                onClick={() => onContactClick(rel)}
              >
                <span className="contact-name">{contact.name}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
