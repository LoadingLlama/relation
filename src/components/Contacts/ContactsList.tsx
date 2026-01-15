/**
 * ContactsList - Simple list view of all connections
 */

import { Relationship } from '../../types';
import './Contacts.css';

interface ContactsListProps {
  relationships: Relationship[];
  onContactClick: (relationship: Relationship) => void;
  currentUserId: string;
}

export function ContactsList({ relationships, onContactClick, currentUserId }: ContactsListProps) {
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
        <p className="contacts-empty-hint">Add your first connection to get started</p>
      </div>
    );
  }

  return (
    <div className="contacts-list">
      {letters.map(letter => (
        <div key={letter} className="contacts-group">
          <div className="contacts-letter">{letter}</div>
          {grouped[letter].map(rel => {
            const contact = rel.user_b_data;
            if (!contact) return null;

            return (
              <div
                key={rel.id}
                className="contact-item"
                onClick={() => onContactClick(rel)}
              >
                <div className="contact-avatar">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="contact-info">
                  <span className="contact-name">{contact.name}</span>
                  <span className="contact-type">{rel.relationship_type}</span>
                </div>
                <svg className="contact-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
