import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { BadgeRisk } from '@/components/trace/BadgeRisk';
import { ConfirmModal } from '@/components/trace/ConfirmModal';
import { Toast } from '@/components/trace/Toast';

export const Route = createFileRoute('/staff/police')({
  component: LawEnforcementPage,
});

interface PoliceCase {
  refId: string;
  risk: 'critical' | 'high';
  action: string;
  district: string;
  policeStation: string;
  unit: string;
  since: string;
  status: 'Dispatched' | 'En route' | 'On scene' | 'Witness secured' | 'FIR registered';
  firNumber?: string | undefined;
  applicableSections: string[];
}

const INITIAL_POLICE_CASES: PoliceCase[] = [
  {
    refId: 'NHAA-4F82-K91',
    risk: 'critical',
    action: 'Witness protection + Armed escort',
    district: 'Pune',
    policeStation: 'Swargate PS',
    unit: 'PCR-14 (SI R. Yadav)',
    since: '12 min ago',
    status: 'En route',
    applicableSections: ['PoA Sec 3(1)(r)', 'PoA Sec 3(1)(s)', 'IPC 506'],
  },
  {
    refId: 'NHAA-3D88-R21',
    risk: 'high',
    action: 'Immediate police intervention',
    district: 'Nagpur',
    policeStation: 'Kamptee PS',
    unit: 'PCR-03 (PSI Deshmukh)',
    since: '34 min ago',
    status: 'On scene',
    applicableSections: ['PoA Sec 3(2)(va)', 'IPC 323'],
  },
  {
    refId: 'NHAA-8B12-T90',
    risk: 'critical',
    action: 'Safehouse relocation',
    district: 'Thane',
    policeStation: 'Wagle Estate PS',
    unit: 'Protection Unit 2',
    since: '1 hr ago',
    status: 'Witness secured',
    firNumber: 'FIR/2026/0482',
    applicableSections: ['PoA Sec 15A (Protection)', 'IPC 504'],
  },
  {
    refId: 'NHAA-5C44-M09',
    risk: 'high',
    action: 'Restraining order enforcement',
    district: 'Nashik',
    policeStation: 'Panchavati PS',
    unit: 'PCR-08 (HC Shinde)',
    since: '2 hr ago',
    status: 'FIR registered',
    firNumber: 'FIR/2026/0119',
    applicableSections: ['PoA Sec 3(1)(p)', 'IPC 341'],
  },
];

function LawEnforcementPage() {
  useAuthGuard();
  const navigate = useNavigate();
  const [cases, setCases] = useState<PoliceCase[]>(INITIAL_POLICE_CASES);
  const [filter, setFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [selectedCase, setSelectedCase] = useState<PoliceCase | null>(null);
  const [newStatus, setNewStatus] = useState<PoliceCase['status']>('On scene');
  const [firInput, setFirInput] = useState('');
  const [officerNote, setOfficerNote] = useState('');

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchStatus = filter === 'all' || c.status.toLowerCase() === filter.toLowerCase();
      const matchDistrict = districtFilter === 'all' || c.district.toLowerCase() === districtFilter.toLowerCase();
      return matchStatus && matchDistrict;
    });
  }, [cases, filter, districtFilter]);

  const handleOpenUpdate = (c: PoliceCase) => {
    setSelectedCase(c);
    setNewStatus(c.status);
    setFirInput(c.firNumber || '');
    setOfficerNote('');
  };

  const handleSaveUpdate = () => {
    if (!selectedCase) return;

    setCases((prev) =>
      prev.map((item) => {
        if (item.refId !== selectedCase.refId) return item;
        const updatedItem: PoliceCase = {
          ...item,
          status: newStatus,
          firNumber: firInput.trim() || item.firNumber,
        };
        return updatedItem;
      })
    );

    setToastMessage(`Updated status for ${selectedCase.refId} → ${newStatus}`);
    setSelectedCase(null);
  };

  return (
    <StaffLayout mode="staff">
      <div className="auth-topline">
        <div>
          <h2>Law Enforcement &amp; Witness Protection Portal</h2>
          <p style={{ fontSize: 12.5, color: 'var(--a-muted)', margin: '4px 0 0' }}>
            State Nodal Coordination · Scheduled Castes &amp; Scheduled Tribes (PoA) Act Monitoring
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="auth-role" style={{ borderColor: 'var(--a-accent)' }}>
            👮 Sub-Inspector Rakesh Yadav (Badge #MH-4019)
          </span>
        </div>
      </div>

      {/* Police KPI Cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <b>{cases.length}</b>
          <span>Active Police Referrals</span>
        </div>
        <div className="stat-card">
          <b style={{ color: 'var(--a-critical)' }}>
            {cases.filter((c) => c.risk === 'critical').length}
          </b>
          <span>Immediate Armed Escort</span>
        </div>
        <div className="stat-card">
          <b style={{ color: 'var(--a-accent)' }}>
            {cases.filter((c) => c.status === 'En route' || c.status === 'On scene').length}
          </b>
          <span>Patrol Units Deployed</span>
        </div>
        <div className="stat-card">
          <b style={{ color: 'var(--a-low)' }}>
            {cases.filter((c) => c.status === 'Witness secured' || c.status === 'FIR registered').length}
          </b>
          <span>Secured / FIR Lodged</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', 'En route', 'On scene', 'Witness secured', 'FIR registered'].map((st) => (
            <button
              key={st}
              type="button"
              className={`chip ${filter.toLowerCase() === st.toLowerCase() ? 'on' : ''}`}
              onClick={() => setFilter(st)}
            >
              {st === 'all' ? 'All Dispatches' : st}
            </button>
          ))}
        </div>

        <select
          className="search-box"
          style={{ maxWidth: 160 }}
          aria-label="Filter district"
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
        >
          <option value="all">All Jurisdictions</option>
          <option value="Pune">Pune District</option>
          <option value="Nagpur">Nagpur District</option>
          <option value="Thane">Thane District</option>
          <option value="Nashik">Nashik District</option>
        </select>
      </div>

      {/* Police Cases Table */}
      <div className="panel" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="case-table">
            <thead>
              <tr>
                <th>Ref ID</th>
                <th>Threat Level</th>
                <th>Action Needed</th>
                <th>Precinct / Station</th>
                <th>Assigned Unit</th>
                <th>Elapsed</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => (
                <tr key={c.refId}>
                  <td>
                    <b
                      style={{ cursor: 'pointer', color: 'var(--a-accent)' }}
                      onClick={() => navigate({ to: '/staff/case/$id', params: { id: c.refId } })}
                    >
                      {c.refId}
                    </b>
                    {c.firNumber && (
                      <div style={{ fontSize: 11, color: 'var(--a-muted)', marginTop: 2 }}>
                        {c.firNumber}
                      </div>
                    )}
                  </td>
                  <td>
                    <BadgeRisk level={c.risk} />
                  </td>
                  <td>
                    <div>{c.action}</div>
                    <div style={{ marginTop: 4 }}>
                      {c.applicableSections.map((sec) => (
                        <span key={sec} className="tag" style={{ fontSize: 10 }}>
                          {sec}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <b>{c.district}</b>
                    <div style={{ fontSize: 11.5, color: 'var(--a-muted)' }}>{c.policeStation}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12.5 }}>{c.unit}</span>
                  </td>
                  <td>{c.since}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span
                        className={`badge ${
                          c.status === 'FIR registered'
                            ? 'low'
                            : c.status === 'Witness secured'
                              ? 'low'
                              : c.status === 'On scene'
                                ? 'high'
                                : 'critical'
                        }`}
                      >
                        {c.status}
                      </span>

                      {/* Step progress tracker */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        {(['Dispatched', 'En route', 'On scene', 'Witness secured', 'FIR registered'] as const).map(
                          (stepName, stepIdx) => {
                            const order = ['Dispatched', 'En route', 'On scene', 'Witness secured', 'FIR registered'];
                            const currentIdx = order.indexOf(c.status);
                            const isDone = stepIdx <= currentIdx;
                            return (
                              <div
                                key={stepName}
                                title={stepName}
                                style={{
                                  width: 14,
                                  height: 5,
                                  borderRadius: 3,
                                  background: isDone ? (c.risk === 'critical' && currentIdx < 3 ? 'var(--a-critical)' : 'var(--a-low)') : 'var(--a-panel2)',
                                  border: '1px solid var(--a-border)',
                                }}
                              />
                            );
                          }
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-dash"
                      style={{ fontSize: 12, padding: '5px 10px' }}
                      onClick={() => handleOpenUpdate(c)}
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}

              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--a-muted)' }}>
                    No police dispatches match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statutory Notice */}
      <div className="inline-legend" style={{ marginTop: 18, lineHeight: 1.6 }}>
        <b style={{ color: 'var(--a-text)' }}>Statutory Notice — SC/ST (Prevention of Atrocities) Act, Section 15A:</b>
        <br />
        It is the statutory duty of the state police apparatus to afford complete protection to victims, their dependents, and witnesses against any intimidation or coercion. Access to victim coordinates and audio is restricted strictly to designated investigative officers.
      </div>

      {/* Update Police Status Dialog */}
      {selectedCase && (
        <div className="confirm-modal-backdrop open" onClick={() => setSelectedCase(null)}>
          <div className="confirm-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <h3>Update Incident Status — {selectedCase.refId}</h3>
            <p style={{ fontSize: 13, color: 'var(--a-muted)', margin: '0 0 14px' }}>
              Action: <b>{selectedCase.action}</b> ({selectedCase.policeStation})
            </p>

            <div style={{ marginBottom: 12 }}>
              <label className="field-label">Operational Status</label>
              <select
                className="field-input"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as PoliceCase['status'])}
              >
                <option value="Dispatched">Dispatched</option>
                <option value="En route">En route</option>
                <option value="On scene">On scene</option>
                <option value="Witness secured">Witness secured in Safehouse</option>
                <option value="FIR registered">FIR registered</option>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="field-label">FIR / Case Number (Optional)</label>
              <input
                className="field-input"
                placeholder="e.g. FIR/2026/0482"
                value={firInput}
                onChange={(e) => setFirInput(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="field-label">Officer Log Notes</label>
              <textarea
                className="field-input"
                style={{ minHeight: 60, resize: 'vertical' }}
                placeholder="Add patrol notes, escort status, safehouse details..."
                value={officerNote}
                onChange={(e) => setOfficerNote(e.target.value)}
              />
            </div>

            <div className="row">
              <button type="button" className="btn-ghost" onClick={() => setSelectedCase(null)}>
                Cancel
              </button>
              <button type="button" className="btn-dash" onClick={handleSaveUpdate}>
                Save Log &amp; Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </StaffLayout>
  );
}
