import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { BadgeRisk } from '@/components/trace/BadgeRisk';

export const Route = createFileRoute('/staff/queue')({
  component: CaseQueuePage,
});

interface CaseItem {
  id: string;
  refId: string;
  risk: 'critical' | 'high' | 'moderate' | 'low';
  indicators: string[];
  channel: string;
  since: string;
  status: string;
}

const INITIAL_CASES: CaseItem[] = [
  {
    id: '1',
    refId: 'NHAA-4F82-K91',
    risk: 'critical',
    indicators: ['suicidal ideation', 'intimidation'],
    channel: 'Voice',
    since: '12 min',
    status: 'Pending',
  },
  {
    id: '2',
    refId: 'NHAA-2C10-B44',
    risk: 'high',
    indicators: ['fear', 'isolation'],
    channel: 'Chat',
    since: '38 min',
    status: 'Dispatched',
  },
  {
    id: '3',
    refId: 'NHAA-9A73-L02',
    risk: 'moderate',
    indicators: ['depression'],
    channel: 'IVRS',
    since: '1 hr',
    status: 'Pending',
  },
  {
    id: '4',
    refId: 'NHAA-7E55-Q19',
    risk: 'low',
    indicators: ['general distress'],
    channel: 'Webform',
    since: '3 hr',
    status: 'Resolved',
  },
];

function CaseQueuePage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'moderate' | 'low'>('all');
  const [search, setSearch] = useState('');

  const filteredCases = useMemo(() => {
    return INITIAL_CASES.filter((c) => {
      const matchesFilter = filter === 'all' || c.risk === filter;
      const matchesSearch =
        !search.trim() ||
        c.refId.toLowerCase().includes(search.toLowerCase()) ||
        c.indicators.some((ind) => ind.toLowerCase().includes(search.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  return (
    <StaffLayout mode="staff">
      <div className="auth-topline">
        <h2>Case Queue</h2>
        <span className="auth-role">Counsellor · Priya S.</span>
      </div>

      <div className="filter-row">
        {(['all', 'critical', 'high', 'moderate', 'low'] as const).map((tier) => (
          <button
            key={tier}
            type="button"
            className={`chip ${filter === tier ? 'on' : ''}`}
            onClick={() => setFilter(tier)}
          >
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </button>
        ))}

        <input
          className="search-box"
          id="queueSearch"
          placeholder="Search reference ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search reference ID"
        />
      </div>

      <div className="queue-meta">
        <span id="queueCount">
          Showing {filteredCases.length} of {INITIAL_CASES.length} cases
        </span>
        <span className="sort-indicator">
          Sorted by: <b style={{ color: 'var(--a-text)' }}>Risk (highest first)</b>
        </span>
      </div>

      <table className="case-table">
        <thead>
          <tr>
            <th>Ref ID</th>
            <th>Risk</th>
            <th>Indicators</th>
            <th>Channel</th>
            <th>Since</th>
            <th>Status</th>
            <th aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {filteredCases.map((c) => (
            <tr
              key={c.id}
              className="case-row-btn"
              tabIndex={0}
              role="button"
              aria-label={`Open case ${c.refId}, ${c.risk} risk, ${c.status}`}
              onClick={() => navigate({ to: '/staff/case/$id', params: { id: c.refId } })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate({ to: '/staff/case/$id', params: { id: c.refId } });
                }
              }}
            >
              <td><b>{c.refId}</b></td>
              <td>
                <BadgeRisk level={c.risk} />
              </td>
              <td>
                {c.indicators.map((ind) => (
                  <span key={ind} className="tag">
                    {ind}
                  </span>
                ))}
              </td>
              <td>{c.channel}</td>
              <td>{c.since}</td>
              <td>{c.status}</td>
              <td className="row-chevron" aria-hidden="true">
                ›
              </td>
            </tr>
          ))}
          {filteredCases.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--a-muted)' }}>
                No cases match the selected filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </StaffLayout>
  );
}
