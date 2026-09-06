import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { Toast } from '@/components/trace/Toast';

export const Route = createFileRoute('/admin/lexicon')({
  component: RiskLexiconPage,
});

interface LexiconTerm {
  id: string;
  category: string;
  language: string;
  weight: number;
  phraseSample: string;
  status: 'Active' | 'Under Review';
}

const INITIAL_LEXICON: LexiconTerm[] = [
  // English
  { id: '1', category: 'Self-harm & suicide ideation', language: 'English', weight: 0.95, phraseSample: 'want to end my life / no reason to live', status: 'Active' },
  { id: '2', category: 'Physical intimidation & threats', language: 'English', weight: 0.85, phraseSample: 'they will come back / kill us all', status: 'Active' },
  { id: '3', category: 'Social boycott & water denial', language: 'English', weight: 0.80, phraseSample: 'stopped us from drawing well water', status: 'Active' },

  // Hindi
  { id: '4', category: 'Death threats & intimidation', language: 'Hindi', weight: 0.90, phraseSample: 'जान से मार देंगे (threat to kill)', status: 'Active' },
  { id: '5', category: 'Casteist slur & public humiliation', language: 'Hindi', weight: 0.85, phraseSample: 'जातिसूचक गालियां / अपमान (caste slur)', status: 'Active' },
  { id: '6', category: 'Village exclusion & boycott', language: 'Hindi', weight: 0.80, phraseSample: 'गांव से निकाल दिया (expelled from village)', status: 'Active' },

  // Marathi
  { id: '7', category: 'Severe physical assault', language: 'Marathi', weight: 0.90, phraseSample: 'जीवे मारण्याची धमकी (death threat)', status: 'Active' },
  { id: '8', category: 'Social boycott & outcast', language: 'Marathi', weight: 0.85, phraseSample: 'गावातून वाळीत टाकले (socially boycotted)', status: 'Active' },

  // Tamil
  { id: '9', category: 'Violence & weapon intimidation', language: 'Tamil', weight: 0.90, phraseSample: 'கொலை மிரட்டல் (murder threat)', status: 'Active' },
  { id: '10', category: 'Temple / pathway denial', language: 'Tamil', weight: 0.80, phraseSample: 'ஊரை விட்டு ஒதுக்கி வைத்தனர் (ostracized)', status: 'Active' },

  // Telugu
  { id: '11', category: 'Intimidation & village eviction', language: 'Telugu', weight: 0.85, phraseSample: 'చంపేస్తామని బెదిరింపు (death threat)', status: 'Active' },

  // Bengali
  { id: '12', category: 'Severe coercion & assault', language: 'Bengali', weight: 0.85, phraseSample: 'খুন করার হুমকি (threat to murder)', status: 'Active' },

  // Gujarati
  { id: '13', category: 'Land dispossession & threats', language: 'Gujarati', weight: 0.85, phraseSample: 'જાનથી મારી નાખવાની ધમકી (death threat)', status: 'Active' },

  // Kannada
  { id: '14', category: 'Social boycott & denial of dignity', language: 'Kannada', weight: 0.85, phraseSample: 'ಕೊಲ್ಲುವ ಬೆದರಿಕೆ (threat to kill)', status: 'Active' },
];

const SUPPORTED_LANGUAGES = ['All', 'English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada'];

function RiskLexiconPage() {
  const [lexicon, setLexicon] = useState<LexiconTerm[]>(INITIAL_LEXICON);
  const [selectedLang, setSelectedLang] = useState('All');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New term form
  const [newCat, setNewCat] = useState('Violence reference');
  const [newLang, setNewLang] = useState('Hindi');
  const [newWeight, setNewWeight] = useState(0.85);
  const [newPhrase, setNewPhrase] = useState('');

  const filtered = useMemo(() => {
    return lexicon.filter((item) => {
      const matchLang = selectedLang === 'All' || item.language.toLowerCase() === selectedLang.toLowerCase();
      const matchSearch =
        !search.trim() ||
        item.category.toLowerCase().includes(search.toLowerCase()) ||
        item.phraseSample.toLowerCase().includes(search.toLowerCase());
      return matchLang && matchSearch;
    });
  }, [lexicon, selectedLang, search]);

  const handleAddTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhrase.trim()) return;

    const term: LexiconTerm = {
      id: Date.now().toString(),
      category: newCat,
      language: newLang,
      weight: newWeight,
      phraseSample: newPhrase,
      status: 'Active',
    };

    setLexicon([term, ...lexicon]);
    setModalOpen(false);
    setNewPhrase('');
    setToastMessage(`New phrase added to the ${newLang} lexicon.`);
  };

  return (
    <StaffLayout mode="admin">
      <div className="auth-topline">
        <div>
          <h2>Risk Lexicon Management</h2>
          <p style={{ fontSize: 12.5, color: 'var(--a-muted)', margin: '4px 0 0' }}>
            Multilingual keyword dictionary spanning 8 official Indian languages for instant trauma cue matching
          </p>
        </div>
        <button
          type="button"
          className="btn-dash"
          onClick={() => setModalOpen(true)}
        >
          + Add Lexicon Term
        </button>
      </div>

      {/* Language Filter Chips */}
      <div className="filter-row">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SUPPORTED_LANGUAGES.map((lang) => (
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

        <input
          className="search-box"
          placeholder="Search categories or phrases…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="case-table">
          <thead>
            <tr>
              <th>Phrase Category</th>
              <th>Language</th>
              <th>Weight (0–1.0)</th>
              <th>Pattern Sample (Masked Preview)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <b>{item.category}</b>
                </td>
                <td>
                  <span className="tag">{item.language}</span>
                </td>
                <td>{item.weight.toFixed(2)}</td>
                <td style={{ fontSize: 13, color: 'var(--a-text)', fontFamily: 'monospace' }}>
                  {item.phraseSample}
                </td>
                <td>
                  <span
                    className="tag"
                    style={{
                      color: item.status === 'Active' ? 'var(--a-low)' : 'var(--a-high)',
                      borderColor: item.status === 'Active' ? 'rgba(111,162,135,0.4)' : 'rgba(224,162,61,0.4)',
                    }}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="confirm-modal-backdrop open" onClick={() => setModalOpen(false)}>
          <div className="confirm-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <h3>Add New Lexicon Term</h3>
            <p style={{ fontSize: 13, color: 'var(--a-muted)', margin: '0 0 14px' }}>
              Add a new threat, violence, or caste-atrocity cue phrase to the detection dictionary
            </p>

            <form onSubmit={handleAddTerm}>
              <div style={{ marginBottom: 12 }}>
                <label className="field-label">Language</label>
                <select
                  className="field-input"
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value)}
                >
                  {SUPPORTED_LANGUAGES.filter((l) => l !== 'All').map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="field-label">Category</label>
                <input
                  className="field-input"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder="e.g. Physical threats, Caste slur, Water denial"
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="field-label">Weight Contribution (0.50 – 1.00)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="1.0"
                  className="field-input"
                  value={newWeight}
                  onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0.8)}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="field-label">Phrase or Regex Pattern</label>
                <input
                  className="field-input"
                  value={newPhrase}
                  onChange={(e) => setNewPhrase(e.target.value)}
                  placeholder="Enter exact phrase in target script or Romanized"
                  required
                />
              </div>

              <div className="row">
                <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-dash">
                  Add to Dictionary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </StaffLayout>
  );
}
