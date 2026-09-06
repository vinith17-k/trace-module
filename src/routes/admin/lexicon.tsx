import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { ConfirmModal } from '@/components/trace/ConfirmModal';
import { Toast } from '@/components/trace/Toast';

export const Route = createFileRoute('/admin/lexicon')({
  component: RiskLexiconPage,
});

const LEXICON_ENTRIES = [
  { category: 'Self-harm language', language: 'English', weight: '0.9', status: 'Active' },
  { category: 'Threat-received language', language: 'Hindi', weight: '0.8', status: 'Active' },
  { category: 'Violence reference', language: 'Marathi', weight: '0.85', status: 'Active' },
  { category: 'Intimidation cues', language: 'Tamil', weight: '0.95', status: 'Active' },
  { category: 'Domestic abuse references', language: 'English', weight: '0.8', status: 'Active' },
];

function RiskLexiconPage() {
  const [selectedLang, setSelectedLang] = useState('English');
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = LEXICON_ENTRIES.filter(
    (e) => e.language.toLowerCase() === selectedLang.toLowerCase()
  );

  return (
    <StaffLayout mode="admin">
      <div className="auth-topline">
        <h2>Risk Lexicon Management</h2>
        <button
          type="button"
          className="btn-dash"
          onClick={() => setModalOpen(true)}
        >
          + Add term
        </button>
      </div>

      <div className="filter-row">
        {['English', 'Hindi', 'Marathi', 'Tamil'].map((lang) => (
          <button
            key={lang}
            type="button"
            className={`chip ${selectedLang === lang ? 'on' : ''}`}
            onClick={() => setSelectedLang(lang)}
          >
            {lang}
          </button>
        ))}
      </div>

      <table className="case-table">
        <thead>
          <tr>
            <th>Phrase category</th>
            <th>Language</th>
            <th>Weight</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item, idx) => (
            <tr key={idx}>
              <td>{item.category}</td>
              <td>{item.language}</td>
              <td>{item.weight}</td>
              <td>
                <span className="tag" style={{ color: 'var(--a-low)', borderColor: 'rgba(111,162,135,0.4)' }}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontSize: 12, color: 'var(--a-muted)', marginTop: 14 }}>
        Exact phrases are intentionally masked in this overview for sensitivity and safety review; full edit access is logged.
      </p>

      <ConfirmModal
        open={modalOpen}
        title="Add lexicon term"
        body="New terms go through a two-reviewer moderated queue before going live to avoid duplicate or contradictory patterns."
        confirmLabel="Send to review"
        confirmClass="btn-dash"
        showNote={true}
        noteLabel="New phrase or pattern (visible only to reviewers)"
        onConfirm={() => {
          setModalOpen(false);
          setToastMessage('Sent to moderated review queue.');
        }}
        onCancel={() => setModalOpen(false)}
      />

      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </StaffLayout>
  );
}
