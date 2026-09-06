import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { Toast } from '@/components/trace/Toast';

export const Route = createFileRoute('/admin/users')({
  component: UsersManagementPage,
});

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'Counsellor' | 'Law Enforcement' | 'District Magistrate' | 'System Admin';
  department: string;
  district: string;
  status: 'Active' | 'Pending invite';
  lastActive: string;
}

const INITIAL_USERS: UserAccount[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    email: 'priya.s@nhaa.gov.in',
    role: 'Counsellor',
    department: 'NHAA National Support Cell',
    district: 'National',
    status: 'Active',
    lastActive: '4 min ago',
  },
  {
    id: '2',
    name: 'SI Rakesh Yadav',
    email: 'r.yadav@police.mh.gov.in',
    role: 'Law Enforcement',
    department: 'Maharashtra Police (Pune Rural)',
    district: 'Pune',
    status: 'Active',
    lastActive: '12 min ago',
  },
  {
    id: '3',
    name: 'Anita Deshmukh, IAS',
    email: 'a.deshmukh@socialjustice.gov.in',
    role: 'District Magistrate',
    department: 'District Atrocity Vigilance Committee',
    district: 'Nagpur',
    status: 'Active',
    lastActive: '3 hr ago',
  },
  {
    id: '4',
    name: 'Dr. Ramesh Iyer',
    email: 'r.iyer@socialjustice.gov.in',
    role: 'System Admin',
    department: 'Ministry of Social Justice & Empowerment',
    district: 'New Delhi HQ',
    status: 'Active',
    lastActive: '1 hr ago',
  },
  {
    id: '5',
    name: 'Inspector S. Gaikwad',
    email: 's.gaikwad@police.mh.gov.in',
    role: 'Law Enforcement',
    department: 'Thane Commissionerate',
    district: 'Thane',
    status: 'Pending invite',
    lastActive: 'Never',
  },
];

function UsersManagementPage() {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Invite form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserAccount['role']>('Counsellor');
  const [department, setDepartment] = useState('District Atrocity Protection Unit');
  const [district, setDistrict] = useState('Pune');

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchRole = roleFilter === 'All' || u.role === roleFilter;
      const matchSearch =
        !search.trim() ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.district.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [users, roleFilter, search]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    const newUser: UserAccount = {
      id: Date.now().toString(),
      name,
      email,
      role,
      department,
      district,
      status: 'Pending invite',
      lastActive: 'Invitation sent',
    };

    setUsers([newUser, ...users]);
    setModalOpen(false);
    setName('');
    setEmail('');
    setToastMessage(`Encrypted setup credentials sent to ${email}.`);
  };

  return (
    <StaffLayout mode="admin">
      <div className="auth-topline">
        <div>
          <h2>User &amp; Role Management</h2>
          <p style={{ fontSize: 12.5, color: 'var(--a-muted)', margin: '4px 0 0' }}>
            Authorised government and medical personnel with role-based access scoping
          </p>
        </div>
        <button
          type="button"
          className="btn-dash"
          onClick={() => setModalOpen(true)}
        >
          + Invite Authorised User
        </button>
      </div>

      <div className="filter-row">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['All', 'Counsellor', 'Law Enforcement', 'District Magistrate', 'System Admin'].map((r) => (
            <button
              key={r}
              type="button"
              className={`chip ${roleFilter === r ? 'on' : ''}`}
              onClick={() => setRoleFilter(r)}
            >
              {r}
            </button>
          ))}
        </div>

        <input
          className="search-box"
          placeholder="Search by name, email, or district…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="case-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Department / Agency</th>
                <th>District</th>
                <th>Status</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <b>{u.name}</b>
                  </td>
                  <td style={{ color: 'var(--a-muted)' }}>{u.email}</td>
                  <td>
                    <span
                      className="tag"
                      style={{
                        borderColor:
                          u.role === 'Law Enforcement'
                            ? 'var(--a-accent)'
                            : u.role === 'Counsellor'
                              ? 'var(--a-low)'
                              : 'var(--a-high)',
                        color: '#fff',
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{u.department}</td>
                  <td>{u.district}</td>
                  <td>
                    <span
                      className="tag"
                      style={{
                        color: u.status === 'Active' ? 'var(--a-low)' : 'var(--a-high)',
                        borderColor: u.status === 'Active' ? 'rgba(111,162,135,0.4)' : 'rgba(224,162,61,0.4)',
                      }}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--a-muted)' }}>{u.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="confirm-modal-backdrop open" onClick={() => setModalOpen(false)}>
          <div className="confirm-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <h3>Invite Authorised Personnel</h3>
            <p style={{ fontSize: 13, color: 'var(--a-muted)', margin: '0 0 14px' }}>
              Issue a secure authentication token for case management
            </p>

            <form onSubmit={handleInvite}>
              <div style={{ marginBottom: 12 }}>
                <label className="field-label">Official Name</label>
                <input
                  className="field-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sub-Inspector R. Gaikwad"
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="field-label">Government Email (.gov.in / .nic.in)</label>
                <input
                  type="email"
                  className="field-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@police.mh.gov.in"
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="field-label">System Role</label>
                <select
                  className="field-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserAccount['role'])}
                >
                  <option value="Counsellor">Counsellor (Intake &amp; Triage)</option>
                  <option value="Law Enforcement">Law Enforcement (Police &amp; Witness Escort)</option>
                  <option value="District Magistrate">District Magistrate (Vigilance Monitoring)</option>
                  <option value="System Admin">System Admin (Full Configuration)</option>
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="field-label">Department / Police Station</label>
                <input
                  className="field-input"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Swargate Police Station"
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="field-label">Jurisdiction District</label>
                <select
                  className="field-input"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                >
                  <option value="Pune">Pune District</option>
                  <option value="Nagpur">Nagpur District</option>
                  <option value="Thane">Thane District</option>
                  <option value="Nashik">Nashik District</option>
                  <option value="Mumbai">Mumbai Commissionerate</option>
                  <option value="National">National Cell (All)</option>
                </select>
              </div>

              <div className="row">
                <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-dash">
                  Send Authorisation
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
