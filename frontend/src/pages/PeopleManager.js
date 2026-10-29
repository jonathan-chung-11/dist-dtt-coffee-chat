import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Avatar from '../components/Avatar';
import './Pairings.css';

export default function PeopleManager({ data, refreshData, API }) {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingEmail, setEditingEmail] = useState(null); // person name being edited
  const [editEmailVal, setEditEmailVal] = useState('');

  const rawPeople = data?.people || [];
  // Normalize: support both string[] (legacy) and object[] formats
  const people = rawPeople.map(p => typeof p === 'string' ? { name: p, email: '' } : p);

  const addPerson = async () => {
    if (!newName.trim()) return;
    if (people.find(p => p.name === newName.trim())) {
      toast.error('Already on the list!');
      return;
    }
    setSaving(true);
    try {
      const updated = [...people, { name: newName.trim(), email: newEmail.trim() }];
      await axios.put(`${API}/people`, { people: updated });
      toast.success(`${newName.trim()} added to the coffee crew! ☕`);
      setNewName('');
      setNewEmail('');
      refreshData();
    } catch (e) {
      toast.error('Failed to add person');
    } finally {
      setSaving(false);
    }
  };

  const removePerson = async (name) => {
    if (!window.confirm(`Remove ${name} from the list?`)) return;
    try {
      await axios.put(`${API}/people`, { people: people.filter(p => p.name !== name) });
      toast.success(`${name} removed`);
      refreshData();
    } catch (e) {
      toast.error('Failed to remove');
    }
  };

  const startEditEmail = (person) => {
    setEditingEmail(person.name);
    setEditEmailVal(person.email || '');
  };

  const saveEmail = async (personName) => {
    try {
      const updated = people.map(p =>
        p.name === personName ? { ...p, email: editEmailVal.trim() } : p
      );
      await axios.put(`${API}/people`, { people: updated });
      toast.success('Email updated');
      setEditingEmail(null);
      refreshData();
    } catch (e) {
      toast.error('Failed to update email');
    }
  };

  const cancelEditEmail = () => {
    setEditingEmail(null);
    setEditEmailVal('');
  };

  const missingEmails = people.filter(p => !p.email).length;

  return (
    <div className="people-page">
      <div className="page-header">
        <h1 className="page-title">🧑‍🤝‍🧑 Team Members</h1>
        <p className="page-subtitle">Manage who's in the coffee chat rotation. Add emails to enable sending coffee chat invites.</p>
      </div>

      {missingEmails > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 10,
            padding: '10px 16px',
            marginBottom: 16,
            fontSize: 12,
            color: '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          ⚠️ <strong>{missingEmails} member{missingEmails > 1 ? 's' : ''}</strong> missing email — click the ✏️ icon on any row to add it.
        </motion.div>
      )}

      {/* Add form */}
      <motion.div
        className="card"
        style={{ marginBottom: 20 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="section-label">Add New Member</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="add-person-form" style={{ marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Full name (e.g. Jane Smith)..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPerson()}
              style={{ fontSize: 14 }}
            />
            <input
              type="email"
              placeholder="Email address (optional)..."
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPerson()}
              style={{ fontSize: 14, flex: 1.2 }}
            />
            <motion.button
              className="btn btn-primary"
              onClick={addPerson}
              disabled={!newName.trim() || saving}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              + Add
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* People list */}
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="section-label">Current Team</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge badge-primary">{people.length} members</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {people.filter(p => p.email).length} with email
            </span>
          </div>
        </div>

        <motion.div
          className="people-list"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        >
          <AnimatePresence>
            {people.map((person, i) => (
              <motion.div
                key={person.name}
                className="person-row"
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: '10px 14px' }}
                variants={{
                  hidden: { opacity: 0, x: -20, scale: 0.95 },
                  visible: { opacity: 1, x: 0, scale: 1 }
                }}
                exit={{ opacity: 0, x: 30, scale: 0.9, transition: { duration: 0.2 } }}
                layout
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={person.name} size={38} />
                  <div className="person-info" style={{ flex: 1 }}>
                    <div className="person-name">{person.name}</div>
                    <div className="person-idx">#{String(i + 1).padStart(2, '0')}</div>
                  </div>
                  <motion.button
                    onClick={() => startEditEmail(person)}
                    title="Edit email"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: person.email ? 'var(--accent-1)' : 'var(--text-muted)',
                      fontSize: 13, padding: '4px 6px', borderRadius: 6,
                    }}
                  >
                    ✏️
                  </motion.button>
                  <motion.button
                    onClick={() => removePerson(person.name)}
                    whileHover={{ scale: 1.2, color: '#EF4444' }}
                    whileTap={{ scale: 0.85 }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', fontSize: 15, padding: '4px 6px',
                      borderRadius: 6, display: 'flex', alignItems: 'center',
                      transition: 'color 0.2s',
                    }}
                  >
                    ✕
                  </motion.button>
                </div>

                {/* Email display / edit */}
                <AnimatePresence>
                  {editingEmail === person.name ? (
                    <motion.div
                      key="edit"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ marginTop: 8 }}
                    >
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', width: '100%' }}>
                        <input
                          type="email"
                          value={editEmailVal}
                          onChange={e => setEditEmailVal(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEmail(person.name);
                            if (e.key === 'Escape') cancelEditEmail();
                          }}
                          placeholder="email@example.com"
                          autoFocus
                          style={{ fontSize: 12, padding: '5px 10px', flex: 1, minWidth: 0 }}
                        />
                        <motion.button
                          className="btn btn-primary"
                          onClick={() => saveEmail(person.name)}
                          whileHover={{ scale: 1.04 }}
                          style={{ fontSize: 11, padding: '5px 12px', flexShrink: 0 }}
                        >
                          Save
                        </motion.button>
                        <motion.button
                          className="btn btn-secondary"
                          onClick={cancelEditEmail}
                          whileHover={{ scale: 1.04 }}
                          style={{ fontSize: 11, padding: '5px 10px', flexShrink: 0 }}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : person.email ? (
                    <motion.div
                      key="display"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        marginTop: 4,
                        paddingLeft: 50,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <span>📧</span>
                      <span style={{ color: 'var(--accent-1)', fontFamily: "'DM Mono', monospace" }}>
                        {person.email}
                      </span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
