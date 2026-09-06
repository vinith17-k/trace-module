import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Filter, 
  Search, 
  Pin, 
  Check, 
  CheckCheck, 
  AlertTriangle, 
  Building2, 
  User, 
  ShieldAlert, 
  Tag, 
  CornerDownRight 
} from 'lucide-react';

export interface DirectiveComment {
  id: string;
  caseRef?: string | undefined;
  author: string;
  role: string;
  agency: string;
  agencyType: 'police' | 'admin' | 'dlsa' | 'social' | 'medical' | 'triage';
  category: 'urgent' | 'statutory' | 'coordination' | 'alert' | 'general';
  text: string;
  timestamp: string;
  isPinned: boolean;
  acknowledgedBy: string[];
}

const INITIAL_DIRECTIVES: DirectiveComment[] = [
  {
    id: 'd-1',
    caseRef: 'TR-2026-089',
    author: 'DM K. S. Rao, IAS',
    role: 'District Magistrate & Collector',
    agency: 'District Collectorate Executive Desk',
    agencyType: 'admin',
    category: 'urgent',
    text: 'DIRECTIVE: Immediate deployment of Section 15A protection perimeter in village Rampur. Tahsildar to coordinate with Sub-Divisional Police Officer for round-the-clock patrol log.',
    timestamp: '25m ago',
    isPinned: true,
    acknowledgedBy: ['ACP V. Gaikwad (Police)', 'Adv. T. Murthy (DLSA)', 'DySP K. Meena (IO)']
  },
  {
    id: 'd-2',
    caseRef: 'TR-2026-074',
    author: 'Adv. T. Murthy',
    role: 'Secretary, DLSA',
    agency: 'District Legal Services Authority',
    agencyType: 'dlsa',
    category: 'statutory',
    text: 'Empanelled Senior Advocate assigned for Section 15A deposition before Special Court. Legal aid kit & travel allowance voucher credited to complainant.',
    timestamp: '1h ago',
    isPinned: false,
    acknowledgedBy: ['Registrar M. Khan (Court)']
  },
  {
    id: 'd-3',
    caseRef: 'TR-2026-089',
    author: 'Dr. Anita Joshi, MD',
    role: 'Chief Medical Officer',
    agency: 'District Civil Hospital Trauma Cell',
    agencyType: 'medical',
    category: 'coordination',
    text: 'Medical trauma report corroborated and uploaded to digital docket. Forensic swab kits dispatched under cold chain custody to State FSL.',
    timestamp: '2h ago',
    isPinned: false,
    acknowledgedBy: ['DySP K. Meena (IO)']
  },
  {
    id: 'd-4',
    caseRef: 'SYSTEM',
    author: 'TRACE Automated SLA Monitor',
    role: 'Core Engine Triage',
    agency: 'TRACE Executive Analytics',
    agencyType: 'triage',
    category: 'alert',
    text: 'SLA ADVISORY: 4 dockets approaching the 48-hour statutory deadline for interim compensation DBT sanction. Nodal Welfare Officers notified.',
    timestamp: '3h ago',
    isPinned: true,
    acknowledgedBy: ['DM K. S. Rao, IAS']
  },
  {
    id: 'd-5',
    caseRef: 'TR-2026-052',
    author: 'ACP V. Gaikwad',
    role: 'Assistant Commissioner of Police',
    agency: 'Special Police Wing for SC/ST',
    agencyType: 'police',
    category: 'statutory',
    text: 'Draft charge-sheet finalized under Section 3(2)(v) POA Act with electronic CDR cell-tower mapping. Ready for scrutiny prior to 60-day deadline.',
    timestamp: '4h ago',
    isPinned: false,
    acknowledgedBy: ['Adv. T. Murthy (DLSA)']
  }
];

interface CollaborativeNotesFeedProps {
  onNotify?: (msg: string) => void;
}

export const CollaborativeNotesFeed: React.FC<CollaborativeNotesFeedProps> = ({ onNotify }) => {
  const [directives, setDirectives] = useState<DirectiveComment[]>(INITIAL_DIRECTIVES);
  const [filterAgency, setFilterAgency] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states for new directive
  const [newText, setNewText] = useState<string>('');
  const [newCaseRef, setNewCaseRef] = useState<string>('');
  const [newCategory, setNewCategory] = useState<DirectiveComment['category']>('coordination');
  const [newAgencyType, setNewAgencyType] = useState<DirectiveComment['agencyType']>('admin');

  // Handle post
  const handlePostDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const agencyNames = {
      police: 'Special Police Wing',
      admin: 'District Collectorate Desk',
      dlsa: 'District Legal Services Authority',
      social: 'Social Justice Directorate',
      medical: 'Civil Hospital Trauma Cell',
      triage: 'TRACE Core AI Operations'
    };

    const roles = {
      police: 'Police Nodal Officer',
      admin: 'District Administration Lead',
      dlsa: 'Empanelled Legal Counsel',
      social: 'Welfare Protection Officer',
      medical: 'Forensic Medical Officer',
      triage: 'AI Platform Operator'
    };

    const newDirective: DirectiveComment = {
      id: 'd-' + Date.now(),
      caseRef: newCaseRef.trim() ? newCaseRef.trim().toUpperCase() : undefined,
      author: 'Current User (Admin)',
      role: roles[newAgencyType],
      agency: agencyNames[newAgencyType],
      agencyType: newAgencyType,
      category: newCategory,
      text: newText.trim(),
      timestamp: 'Just now',
      isPinned: newCategory === 'urgent',
      acknowledgedBy: []
    };

    setDirectives(prev => [newDirective, ...prev]);
    setNewText('');
    setNewCaseRef('');
    onNotify?.('Inter-agency directive posted to active feed');
  };

  // Toggle acknowledge
  const handleToggleAcknowledge = (directiveId: string) => {
    const userAckName = 'Admin Operations Lead';
    setDirectives(prev => prev.map(d => {
      if (d.id === directiveId) {
        const hasAcked = d.acknowledgedBy.includes(userAckName);
        const updatedAck = hasAcked 
          ? d.acknowledgedBy.filter(name => name !== userAckName)
          : [...d.acknowledgedBy, userAckName];
        return { ...d, acknowledgedBy: updatedAck };
      }
      return d;
    }));
    onNotify?.('Directive acknowledgement updated');
  };

  // Toggle pinned
  const handleTogglePin = (directiveId: string) => {
    setDirectives(prev => prev.map(d => d.id === directiveId ? { ...d, isPinned: !d.isPinned } : d));
  };

  // Filter directives
  const filteredDirectives = directives.filter(d => {
    const matchesSearch = d.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.caseRef && d.caseRef.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAgency = filterAgency === 'all' || d.agencyType === filterAgency;
    const matchesCategory = filterCategory === 'all' || d.category === filterCategory;
    return matchesSearch && matchesAgency && matchesCategory;
  });

  const getCategoryBadge = (category: DirectiveComment['category']) => {
    switch (category) {
      case 'urgent':
        return <span className="badge badge-critical" style={{ fontSize: 10 }}>Urgent Directive</span>;
      case 'alert':
        return <span className="badge badge-high" style={{ fontSize: 10 }}>SLA Breach Alert</span>;
      case 'statutory':
        return <span className="badge badge-med" style={{ fontSize: 10 }}>Statutory Notice</span>;
      case 'coordination':
        return <span className="badge" style={{ background: 'rgba(91,141,239,0.15)', color: 'var(--a-accent)', fontSize: 10 }}>Inter-Agency</span>;
      default:
        return <span className="badge" style={{ fontSize: 10 }}>Notice</span>;
    }
  };

  const getAgencyColor = (agencyType: DirectiveComment['agencyType']) => {
    switch (agencyType) {
      case 'police': return '#5B8DEF';
      case 'admin': return '#6FA287';
      case 'dlsa': return '#B688F7';
      case 'medical': return '#E0A23D';
      case 'triage': return '#E0584F';
      default: return 'var(--a-accent)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top filter toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        background: 'var(--a-panel)',
        border: '1px solid var(--a-border)',
        borderRadius: 12,
        padding: '12px 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={18} color="var(--a-accent)" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Inter-Agency Directives & Direct Orders</span>
            <span className="badge" style={{ background: 'rgba(91,141,239,0.15)', color: 'var(--a-accent)', borderColor: 'rgba(91,141,239,0.3)' }}>
              {filteredDirectives.length} Messages
            </span>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', minWidth: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--a-muted)' }} />
            <input 
              type="text"
              className="search-box"
              placeholder="Search orders, cases or officers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 30, height: 34, fontSize: 12.5 }}
            />
          </div>

          {/* Agency Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="var(--a-muted)" />
            <select
              className="search-box"
              value={filterAgency}
              onChange={(e) => setFilterAgency(e.target.value)}
              style={{ height: 34, fontSize: 12, width: 'auto', padding: '0 10px' }}
            >
              <option value="all">All Departments</option>
              <option value="police">Police Wing</option>
              <option value="admin">District Collectorate</option>
              <option value="dlsa">Legal Aid DLSA</option>
              <option value="medical">Civil Hospital</option>
              <option value="triage">TRACE AI Core</option>
            </select>
          </div>

          {/* Category Filter */}
          <select
            className="search-box"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ height: 34, fontSize: 12, width: 'auto', padding: '0 10px' }}
          >
            <option value="all">All Directives</option>
            <option value="urgent">Urgent Only</option>
            <option value="statutory">Statutory Orders</option>
            <option value="alert">SLA Alerts</option>
            <option value="coordination">Coordination</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Left: Feed of Directives */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredDirectives.map(directive => {
            const hasAcked = directive.acknowledgedBy.includes('Admin Operations Lead');

            return (
              <div 
                key={directive.id} 
                className="comment-card"
                style={{ 
                  borderLeft: directive.isPinned ? '3px solid var(--a-critical)' : '1px solid var(--a-border)',
                  background: directive.isPinned ? 'rgba(224,88,79,0.03)' : 'var(--a-panel)'
                }}
              >
                <div className="comment-header">
                  <div className="comment-author">
                    <div 
                      className="comment-avatar"
                      style={{ background: getAgencyColor(directive.agencyType) }}
                    >
                      {directive.author.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{directive.author}</span>
                        <span style={{ fontSize: 11, color: 'var(--a-muted)' }}>({directive.role})</span>
                        {directive.caseRef && (
                          <span className="badge" style={{ fontFamily: 'monospace', fontSize: 10 }}>
                            {directive.caseRef}
                          </span>
                        )}
                        {getCategoryBadge(directive.category)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--a-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Building2 size={11} /> {directive.agency} • <span>{directive.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button 
                      onClick={() => handleTogglePin(directive.id)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: directive.isPinned ? 'var(--a-critical)' : 'var(--a-muted)',
                        padding: 4 
                      }}
                      title={directive.isPinned ? 'Unpin directive' : 'Pin to top'}
                    >
                      <Pin size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: 13, color: 'var(--a-text)', lineHeight: 1.5, margin: '8px 0 12px', paddingLeft: 36 }}>
                  {directive.text}
                </div>

                {/* Footer: Acknowledgements */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  borderTop: '1px solid rgba(255,255,255,0.06)', 
                  paddingTop: 8,
                  paddingLeft: 36 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--a-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCheck size={13} color="#6FA287" /> Acknowledged by ({directive.acknowledgedBy.length}):
                    </span>
                    {directive.acknowledgedBy.map((ack, idx) => (
                      <span key={idx} className="badge" style={{ fontSize: 9.5, padding: '1px 6px' }}>
                        {ack}
                      </span>
                    ))}
                  </div>

                  <button 
                    className={`btn ${hasAcked ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => handleToggleAcknowledge(directive.id)}
                    style={{ padding: '3px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Check size={12} /> {hasAcked ? 'Acknowledged' : 'Acknowledge Directive'}
                  </button>
                </div>
              </div>
            );
          })}

          {filteredDirectives.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--a-muted)', background: 'var(--a-panel)', borderRadius: 12 }}>
              No directives found matching current filter criteria.
            </div>
          )}
        </div>

        {/* Right: Broadcast New Directive Composer */}
        <div style={{ 
          background: 'var(--a-panel)', 
          border: '1px solid var(--a-border)', 
          borderRadius: 14, 
          padding: 20, 
          height: 'fit-content',
          position: 'sticky',
          top: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, borderBottom: '1px solid var(--a-border)', paddingBottom: 12 }}>
            <Send size={16} color="var(--a-accent)" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Post Operational Directive</h3>
          </div>

          <form onSubmit={handlePostDirective} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="form-label">Issuing Department</label>
              <select 
                className="search-box"
                value={newAgencyType}
                onChange={(e) => setNewAgencyType(e.target.value as any)}
              >
                <option value="admin">District Collectorate Desk</option>
                <option value="police">Special Police Wing / QRT</option>
                <option value="dlsa">District Legal Services (DLSA)</option>
                <option value="medical">Civil Hospital Trauma Unit</option>
                <option value="social">Social Justice Department</option>
                <option value="triage">TRACE AI Core Operations</option>
              </select>
            </div>

            <div>
              <label className="form-label">Classification Level</label>
              <select 
                className="search-box"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
              >
                <option value="coordination">Inter-Agency Coordination</option>
                <option value="urgent">Urgent Protection Order (Sec 15A)</option>
                <option value="statutory">Statutory Notice</option>
                <option value="alert">SLA Escalation Alert</option>
                <option value="general">Routine Update</option>
              </select>
            </div>

            <div>
              <label className="form-label">Associated Case Reference (Optional)</label>
              <input 
                type="text" 
                className="search-box"
                placeholder="e.g., TR-2026-089 or SYSTEM"
                value={newCaseRef}
                onChange={(e) => setNewCaseRef(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Directive Instruction & Mandate</label>
              <textarea 
                className="search-box"
                rows={5}
                placeholder="Detail the operational order, responsible nodal officer, and expected compliance deadline..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!newText.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}
            >
              <Send size={14} /> Transmit Inter-Agency Directive
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
