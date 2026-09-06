import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { ConfirmModal } from '@/components/trace/ConfirmModal';
import { Toast } from '@/components/trace/Toast';

export const Route = createFileRoute('/admin/users')({
  component: UsersManagementPage,
});

const USERS = [
  { name: 'Priya Sharma', email: 'priya.s@nhaa.gov.in', role: 'Counsellor', status: 'Active' },
  { name: 'Rakesh Yadav', email: 'r.yadav@police.mh.gov.in', role: 'Law Enforcement', status: 'Active' },
  { name: 'Anita Deshmukh', email: 'a.deshmukh@socialjustice.gov.in', role: 'District Officer', status: 'Pending invite' },
];

function UsersManagementPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <StaffLayout mode="admin">
      <div className="auth-topline">
        <h2>Users &amp; Role Management</h2>
        <button
          type="button"
          className="btn-dash"
          onClick={() => setModalOpen(true)}
        >
          + Invite user
        </button>
      </div>

      <p className="inline-legend" style={{ margin: '0 0 16px', display: 'inline-block' }}>
        Role-based access control grants distinct visibility scoped strictly to operational requirements.
      </p>

      <table className="case-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {USERS.map((u) => (
            <tr key={u.email}>
              <td><b>{u.name}</b></td>
              <td>{u.email}</td>
              <td>{u.role}</td>
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
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmModal
        open={modalOpen}
        title="Invite a new user"
        body="They'll receive an email invite to set up an authorised account within the state or district grievance jurisdiction."
        confirmLabel="Send invite"
        confirmClass="btn-dash"
        showNote={true}
        noteLabel="Email address to invite"
        onConfirm={(note) => {
          setModalOpen(false);
          setToastMessage(`Invitation sent to ${note || 'user'}.`);
        }}
        onCancel={() => setModalOpen(false)}
      />

      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </StaffLayout>
  );
}
