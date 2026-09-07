import React, { useState } from 'react';
import { 
  Network, 
  Plus, 
  Edit3, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  Building2, 
  ArrowRight, 
  RefreshCw,
  Search,
  Filter,
  Layers,
  Send,
  Trash2,
  X
} from 'lucide-react';

export interface WebChartNode {
  id: string;
  name: string;
  layer: 'ingress' | 'ai_core' | 'dispatch' | 'relief';
  agency: string;
  leadOfficer: string;
  status: 'optimal' | 'active' | 'warning' | 'critical';
  latency: string;
  activeLoad: number;
  capacity: number;
  description: string;
  comments: NodeComment[];
}

export interface NodeComment {
  id: string;
  author: string;
  role: string;
  agency: string;
  timestamp: string;
  text: string;
}

const INITIAL_NODES: WebChartNode[] = [
  // Layer 1: Ingress
  {
    id: 'node-ing-1',
    name: 'Kiosk Offline Sync',
    layer: 'ingress',
    agency: 'Panchayat & Rural Dev',
    leadOfficer: 'Insp. R. Verma',
    status: 'optimal',
    latency: '1.2s avg',
    activeLoad: 142,
    capacity: 500,
    description: 'Direct bi-directional mesh sync for 180 Gram Panchayat touch-kiosks with offline token storage.',
    comments: [
      {
        id: 'c1',
        author: 'Sunil Nair',
        role: 'Field Systems Eng.',
        agency: 'NIC District Centre',
        timestamp: '10m ago',
        text: 'Sync interval adjusted to 90s for low-bandwidth taluks in Eastern Zone.'
      }
    ]
  },
  {
    id: 'node-ing-2',
    name: 'IVR Voice Toll-Free 1800',
    layer: 'ingress',
    agency: 'State Police Command',
    leadOfficer: 'DySP K. Meena',
    status: 'active',
    latency: '340ms',
    activeLoad: 412,
    capacity: 600,
    description: 'Multi-lingual toll-free helpline supporting 9 regional dialects with real-time whisper transcription.',
    comments: [
      {
        id: 'c2',
        author: 'DySP K. Meena',
        role: 'Nodal Officer',
        agency: 'State Police Command',
        timestamp: '1h ago',
        text: 'Added 4 extra audio channels to handle seasonal distress spikes.'
      }
    ]
  },
  {
    id: 'node-ing-3',
    name: 'Citizen Android/Web App',
    layer: 'ingress',
    agency: 'TRACE Digital Platform',
    leadOfficer: 'A. Singhania',
    status: 'optimal',
    latency: '95ms',
    activeLoad: 890,
    capacity: 2000,
    description: 'End-to-end encrypted mobile client with disguised icon mode and tamper-evident local audit log.',
    comments: []
  },

  // Layer 2: AI Core
  {
    id: 'node-ai-1',
    name: 'Speech Dialect Transcriber',
    layer: 'ai_core',
    agency: 'TRACE Core AI',
    leadOfficer: 'Dr. P. Deshmukh',
    status: 'optimal',
    latency: '820ms',
    activeLoad: 58,
    capacity: 200,
    description: 'Fine-tuned acoustic model resolving caste slurs, colloquial coercion markers, and regional audio cues.',
    comments: [
      {
        id: 'c3',
        author: 'Dr. P. Deshmukh',
        role: 'NLP Lead',
        agency: 'TRACE Core AI',
        timestamp: '3h ago',
        text: 'Dialect model v4.2 calibrated with 1,200 verified SC/ST Commission transcripts.'
      }
    ]
  },
  {
    id: 'node-ai-2',
    name: 'SVI Vulnerability Engine',
    layer: 'ai_core',
    agency: 'TRACE Risk Analytics',
    leadOfficer: 'S. Banerjee',
    status: 'optimal',
    latency: '45ms',
    activeLoad: 74,
    capacity: 350,
    description: '14-factor weighted statutory risk matrix scoring physical danger, social boycott, and economic blockade.',
    comments: []
  },
  {
    id: 'node-ai-3',
    name: 'PII De-Identification Masker',
    layer: 'ai_core',
    agency: 'Data Privacy Cell',
    leadOfficer: 'Adv. S. Raman',
    status: 'warning',
    latency: '140ms',
    activeLoad: 188,
    capacity: 220,
    description: 'Zero-knowledge scrubber eliminating witness names, hamlet landmarks, and Aadhaar numbers prior to cloud relay.',
    comments: [
      {
        id: 'c4',
        author: 'Adv. S. Raman',
        role: 'Privacy Ombudsman',
        agency: 'Data Privacy Cell',
        timestamp: '35m ago',
        text: 'Running at 85% capacity. Secondary hashing container deployed on node-worker-04.'
      }
    ]
  },

  // Layer 3: Dispatch Router
  {
    id: 'node-disp-1',
    name: 'SC/ST Protection Officer Desk',
    layer: 'dispatch',
    agency: 'Special Police Wing',
    leadOfficer: 'ACP V. Gaikwad',
    status: 'optimal',
    latency: '2.1m ack',
    activeLoad: 31,
    capacity: 80,
    description: 'Statutory First Response Officers mandated under Section 15A of POA Act for immediate physical security.',
    comments: [
      {
        id: 'c5',
        author: 'ACP V. Gaikwad',
        role: 'Commanding Officer',
        agency: 'Special Police Wing',
        timestamp: '25m ago',
        text: 'Night patrol units cross-linked directly with village vigil alarms.'
      }
    ]
  },
  {
    id: 'node-disp-2',
    name: '112 QRT Immediate Escort',
    layer: 'dispatch',
    agency: 'District Quick Response',
    leadOfficer: 'Sub-Insp. A. Rawat',
    status: 'active',
    latency: '8.4m dispatch',
    activeLoad: 19,
    capacity: 40,
    description: 'Armed escort vehicles with GPS telemetry dispatched for red-tier critical threats.',
    comments: []
  },
  {
    id: 'node-disp-3',
    name: 'Legal Aid Counsel Queue',
    layer: 'dispatch',
    agency: 'DLSA Legal Cell',
    leadOfficer: 'Adv. T. Murthy',
    status: 'warning',
    latency: '18m queue',
    activeLoad: 42,
    capacity: 50,
    description: 'Panel advocate roster assigning state-funded legal defense within 24 hours of FIR registration.',
    comments: [
      {
        id: 'c6',
        author: 'Adv. T. Murthy',
        role: 'Secretary DLSA',
        agency: 'DLSA Legal Cell',
        timestamp: '4h ago',
        text: 'Pending 3 Advocate appointments in North Sub-division. Re-routing to empanelled senior counsel.'
      }
    ]
  },

  // Layer 4: Relief & Justice
  {
    id: 'node-rel-1',
    name: 'District Magistrate Relief Treasury',
    layer: 'relief',
    agency: 'Revenue & District Admin',
    leadOfficer: 'DM K. S. Rao',
    status: 'optimal',
    latency: '4.2h DBT',
    activeLoad: 12,
    capacity: 100,
    description: 'Mandatory 25% interim compensation disbursed directly to DBT bank accounts under SC/ST Rules.',
    comments: [
      {
        id: 'c7',
        author: 'DM K. S. Rao',
        role: 'District Collector',
        agency: 'District Administration',
        timestamp: '1h ago',
        text: 'Zero backlog on interim tranche. ₹14.5 Lakh released across 8 verified dockets today.'
      }
    ]
  },
  {
    id: 'node-rel-2',
    name: 'Trauma & Safe House Allocation',
    layer: 'relief',
    agency: 'Dept. of Social Justice',
    leadOfficer: 'Dr. Anita Joshi',
    status: 'active',
    latency: '1.5h placement',
    activeLoad: 17,
    capacity: 30,
    description: 'Secure temporary transit accommodation and psychological trauma counselling for displaced victims.',
    comments: []
  },
  {
    id: 'node-rel-3',
    name: 'Special Atrocity Court Fast-Track',
    layer: 'relief',
    agency: 'Judicial Directorate',
    leadOfficer: 'Registrar M. Khan',
    status: 'critical',
    latency: '42d hearing',
    activeLoad: 128,
    capacity: 90,
    description: 'Designated Special Court under Section 14 POA Act for trial completion within 60 days.',
    comments: [
      {
        id: 'c8',
        author: 'Registrar M. Khan',
        role: 'Court Administrator',
        agency: 'Judicial Directorate',
        timestamp: '2h ago',
        text: 'Over-capacity alert. Special Sessions Bench requested to schedule daily afternoon hearings.'
      }
    ]
  }
];

const LAYER_CONFIG = {
  ingress: { title: '1. Ingress & Telemetry', color: '#5B8DEF', desc: 'Field touchpoints & distress ingestion' },
  ai_core: { title: '2. SVI AI Core & Triage', color: '#B688F7', desc: 'Transcription, scoring & de-identification' },
  dispatch: { title: '3. Statutory Dispatch', color: '#E0A23D', desc: 'Police escort & legal counsel routing' },
  relief: { title: '4. Inter-Agency Relief', color: '#6FA287', desc: 'DBT compensation & Special Courts' },
};

interface PipelineWebChartProps {
  onNotify?: (msg: string) => void;
}

export const PipelineWebChart: React.FC<PipelineWebChartProps> = ({ onNotify }) => {
  const [nodes, setNodes] = useState<WebChartNode[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-disp-1');
  const [filterAgency, setFilterAgency] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals & drawers
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isAddingNode, setIsAddingNode] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>('');

  // Form states
  const selectedNode: WebChartNode = nodes.find(n => n.id === selectedNodeId) || nodes[0] || (INITIAL_NODES[0] as WebChartNode);
  
  const [editFormData, setEditFormData] = useState<WebChartNode>(selectedNode);
  const [newNodeData, setNewNodeData] = useState<Omit<WebChartNode, 'id' | 'comments'>>({
    name: '',
    layer: 'dispatch',
    agency: '',
    leadOfficer: '',
    status: 'optimal',
    latency: '5m avg',
    activeLoad: 10,
    capacity: 50,
    description: ''
  });

  // Select node handler
  const handleSelectNode = (node: WebChartNode) => {
    setSelectedNodeId(node.id);
    setEditFormData(node);
    setIsEditing(false);
  };

  // Save edited node
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setNodes(prev => prev.map(n => n.id === editFormData.id ? { ...editFormData, comments: n.comments } : n));
    setIsEditing(false);
    onNotify?.(`Updated pipeline node: "${editFormData.name}"`);
  };

  // Add comment to node
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: NodeComment = {
      id: 'c-' + Date.now(),
      author: 'Current User (Admin)',
      role: 'District Admin Lead',
      agency: 'TRACE Executive Cell',
      timestamp: 'Just now',
      text: newCommentText.trim()
    };

    setNodes(prev => prev.map(n => {
      if (n.id === selectedNodeId) {
        return {
          ...n,
          comments: [newComment, ...n.comments]
        };
      }
      return n;
    }));

    setNewCommentText('');
    onNotify?.('Directive comment added to node');
  };

  // Create new node
  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeData.name || !newNodeData.agency) return;

    const created: WebChartNode = {
      ...newNodeData,
      id: 'node-custom-' + Date.now(),
      comments: [
        {
          id: 'c-init',
          author: 'Current User (Admin)',
          role: 'District Admin Lead',
          agency: 'TRACE Executive Cell',
          timestamp: 'Just now',
          text: `Node commissioned into layer: ${newNodeData.layer.toUpperCase()}`
        }
      ]
    };

    setNodes(prev => [...prev, created]);
    setSelectedNodeId(created.id);
    setEditFormData(created);
    setIsAddingNode(false);
    setNewNodeData({
      name: '',
      layer: 'dispatch',
      agency: '',
      leadOfficer: '',
      status: 'optimal',
      latency: '5m avg',
      activeLoad: 10,
      capacity: 50,
      description: ''
    });
    onNotify?.(`Commissioned new agency node: "${created.name}"`);
  };

  // Delete node
  const handleDeleteNode = (id: string) => {
    if (nodes.length <= 1) return;
    const remaining = nodes.filter(n => n.id !== id);
    setNodes(remaining);
    const nextNode: WebChartNode = remaining[0] || (INITIAL_NODES[0] as WebChartNode);
    setSelectedNodeId(nextNode.id);
    setEditFormData(nextNode);
    onNotify?.('Node decommissioned from pipeline');
  };

  // Filter nodes
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          node.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          node.leadOfficer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAgency = filterAgency === 'all' || node.agency.toLowerCase().includes(filterAgency.toLowerCase());
    return matchesSearch && matchesAgency;
  });

  const getNodesByLayer = (layer: WebChartNode['layer']) => {
    return filteredNodes.filter(n => n.layer === layer);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controls Top Bar */}
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
            <Network size={18} color="var(--a-accent)" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Inter-Agency Pipeline Topology</span>
            <span className="badge" style={{ background: 'rgba(91,141,239,0.15)', color: 'var(--a-accent)', borderColor: 'rgba(91,141,239,0.3)' }}>
              {nodes.length} Connected Nodes
            </span>
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--a-muted)' }} />
            <input 
              type="text"
              className="search-box"
              placeholder="Search nodes or officers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 30, height: 34, fontSize: 12.5 }}
            />
          </div>

          {/* Filter by Agency */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="var(--a-muted)" />
            <select 
              className="search-box"
              value={filterAgency}
              onChange={(e) => setFilterAgency(e.target.value)}
              style={{ height: 34, fontSize: 12, width: 'auto', padding: '0 10px' }}
            >
              <option value="all">All Departments</option>
              <option value="police">Police & QRT</option>
              <option value="ai">TRACE AI Core</option>
              <option value="dlsa">Legal Aid DLSA</option>
              <option value="admin">Revenue & District Admin</option>
              <option value="social">Social Justice</option>
              <option value="judicial">Judicial Directorate</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            className="btn btn-primary"
            onClick={() => setIsAddingNode(true)}
            style={{ padding: '6px 14px', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Add Agency Node
          </button>
        </div>
      </div>

      {/* Main Interactive Topology Area */}
      <div className="pipeline-chart-layout">
        {/* Left: Web Chart Network */}
        <div className="web-chart-wrap" style={{ position: 'relative' }}>
          {/* Subtle connection guidance watermark */}
          <div style={{ 
            position: 'absolute', 
            top: 10, 
            right: 16, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16, 
            fontSize: 11, 
            color: 'var(--a-muted)' 
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="node-status-dot optimal" /> Optimal
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="node-status-dot active" /> Active
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="node-status-dot warning" /> High Load
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="node-status-dot critical" /> Critical SLA
            </span>
          </div>

          <div className="web-chart-layers">
            {(['ingress', 'ai_core', 'dispatch', 'relief'] as const).map((layerKey, idx) => {
              const layerMeta = LAYER_CONFIG[layerKey];
              const layerNodes = getNodesByLayer(layerKey);

              return (
                <div key={layerKey} className="web-layer">
                  <div className="web-layer-header">
                    <span style={{ color: layerMeta.color }}>{layerMeta.title}</span>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{layerNodes.length} nodes</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--a-muted)', padding: '0 4px', lineHeight: 1.3 }}>
                    {layerMeta.desc}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
                    {layerNodes.map(node => {
                      const isSelected = node.id === selectedNodeId;
                      const loadPct = Math.round((node.activeLoad / node.capacity) * 100);

                      return (
                        <div 
                          key={node.id} 
                          className={`web-node-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectNode(node)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSelectNode(node); }}
                        >
                          <div className="web-node-top">
                            <span className="web-node-title">
                              <span className={`node-status-dot ${node.status}`} />
                              {node.name}
                            </span>
                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--a-muted)' }}>
                              {node.latency}
                            </span>
                          </div>

                          <div className="web-node-agency">
                            <Building2 size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
                            {node.agency}
                          </div>

                          <div style={{ margin: '8px 0 6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--a-muted)', marginBottom: 3 }}>
                              <span>Load: {node.activeLoad}/{node.capacity}</span>
                              <span style={{ color: loadPct > 80 ? 'var(--a-critical)' : 'inherit' }}>{Math.min(loadPct, 100)}%</span>
                            </div>
                            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                              <div 
                                style={{ 
                                  height: '100%', 
                                  width: `${Math.min(loadPct, 100)}%`, 
                                  background: loadPct > 80 ? 'var(--a-critical)' : loadPct > 60 ? 'var(--a-high)' : 'var(--a-accent)' 
                                }} 
                              />
                            </div>
                          </div>

                          <div className="web-node-metrics">
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <User size={11} /> {node.leadOfficer}
                            </span>
                            {node.comments.length > 0 && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--a-accent)' }}>
                                <MessageSquare size={11} /> {node.comments.length}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {layerNodes.length === 0 && (
                      <div style={{ 
                        border: '1px dashed var(--a-border)', 
                        borderRadius: 10, 
                        padding: 24, 
                        textAlign: 'center', 
                        color: 'var(--a-muted)',
                        fontSize: 12 
                      }}>
                        No nodes matching filter
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Node Detail & Collaboration Panel */}
        <div style={{ 
          background: 'var(--a-panel)', 
          border: '1px solid var(--a-border)', 
          borderRadius: 14, 
          padding: 20, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 16,
          maxHeight: 700,
          overflowY: 'auto'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--a-border)', paddingBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`node-status-dot ${selectedNode.status}`} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>{selectedNode.name}</h3>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--a-muted)' }}>
                {LAYER_CONFIG[selectedNode.layer].title}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {!isEditing ? (
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditFormData(selectedNode);
                    setIsEditing(true);
                  }}
                  style={{ padding: '4px 10px', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <Edit3 size={12} /> Edit
                </button>
              ) : (
                <button 
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(false)}
                  style={{ padding: '4px 8px', fontSize: 11.5 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Body: View vs Edit Mode */}
          {!isEditing ? (
            <>
              {/* Key Specs Card */}
              <div style={{ 
                background: 'var(--a-panel2)', 
                border: '1px solid var(--a-border)', 
                borderRadius: 10, 
                padding: 14, 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 12 
              }}>
                <div>
                  <span style={{ fontSize: 10.5, color: 'var(--a-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Agency</span>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', marginTop: 2 }}>{selectedNode.agency}</div>
                </div>
                <div>
                  <span style={{ fontSize: 10.5, color: 'var(--a-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lead Officer</span>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', marginTop: 2 }}>{selectedNode.leadOfficer}</div>
                </div>
                <div>
                  <span style={{ fontSize: 10.5, color: 'var(--a-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SLA / Latency</span>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--a-accent)', marginTop: 2 }}>{selectedNode.latency}</div>
                </div>
                <div>
                  <span style={{ fontSize: 10.5, color: 'var(--a-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Workload</span>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', marginTop: 2 }}>
                    {selectedNode.activeLoad} / {selectedNode.capacity} units
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--a-muted)', textTransform: 'uppercase' }}>Description & Scope</span>
                <p style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--a-text)' }}>
                  {selectedNode.description}
                </p>
              </div>

              {/* Collaborative Comments Section */}
              <div style={{ borderTop: '1px solid var(--a-border)', paddingTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={13} color="var(--a-accent)" /> 
                    Collaborative Node Notes ({selectedNode.comments.length})
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--a-muted)' }}>Multi-Agency Log</span>
                </div>

                {/* Comment Input */}
                <form onSubmit={handleAddComment} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="text"
                      className="search-box"
                      placeholder="Add an operational directive or note..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      style={{ height: 36, fontSize: 12 }}
                    />
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={!newCommentText.trim()}
                      style={{ padding: '0 12px', height: 36 }}
                    >
                      <Send size={13} />
                    </button>
                  </div>
                </form>

                {/* Comment List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
                  {selectedNode.comments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11.5, color: 'var(--a-muted)' }}>
                      No notes recorded yet. Post instructions for inter-agency coordination.
                    </div>
                  ) : (
                    selectedNode.comments.map(c => (
                      <div key={c.id} style={{ 
                        background: 'var(--a-panel2)', 
                        border: '1px solid rgba(255,255,255,0.06)', 
                        borderRadius: 8, 
                        padding: '10px 12px' 
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff' }}>{c.author}</span>
                            <span className="badge" style={{ fontSize: 9.5, padding: '1px 6px' }}>{c.agency}</span>
                          </div>
                          <span style={{ fontSize: 10.5, color: 'var(--a-muted)' }}>{c.timestamp}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--a-text)', lineHeight: 1.4 }}>
                          {c.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--a-border)' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  style={{ color: 'var(--a-critical)', borderColor: 'rgba(224,88,79,0.3)', fontSize: 11.5, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <Trash2 size={12} /> Decommission Node
                </button>
              </div>
            </>
          ) : (
            /* Edit Form */
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontSize: 11.5 }}>Node Name</label>
                <input 
                  type="text" 
                  className="search-box"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 11.5 }}>Pipeline Layer</label>
                  <select 
                    className="search-box"
                    value={editFormData.layer}
                    onChange={(e) => setEditFormData({ ...editFormData, layer: e.target.value as any })}
                  >
                    <option value="ingress">1. Ingress & Telemetry</option>
                    <option value="ai_core">2. SVI AI Core</option>
                    <option value="dispatch">3. Statutory Dispatch</option>
                    <option value="relief">4. Inter-Agency Relief</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 11.5 }}>Operational Status</label>
                  <select 
                    className="search-box"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  >
                    <option value="optimal">Optimal Performance</option>
                    <option value="active">Active Normal</option>
                    <option value="warning">High Load Warning</option>
                    <option value="critical">Critical SLA Breach</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 11.5 }}>Responsible Agency</label>
                  <input 
                    type="text" 
                    className="search-box"
                    value={editFormData.agency}
                    onChange={(e) => setEditFormData({ ...editFormData, agency: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 11.5 }}>Lead Officer</label>
                  <input 
                    type="text" 
                    className="search-box"
                    value={editFormData.leadOfficer}
                    onChange={(e) => setEditFormData({ ...editFormData, leadOfficer: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 11.5 }}>SLA / Latency</label>
                  <input 
                    type="text" 
                    className="search-box"
                    value={editFormData.latency}
                    onChange={(e) => setEditFormData({ ...editFormData, latency: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 11.5 }}>Active Load</label>
                  <input 
                    type="number" 
                    className="search-box"
                    value={editFormData.activeLoad}
                    onChange={(e) => setEditFormData({ ...editFormData, activeLoad: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 11.5 }}>Max Capacity</label>
                  <input 
                    type="number" 
                    className="search-box"
                    value={editFormData.capacity}
                    onChange={(e) => setEditFormData({ ...editFormData, capacity: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 11.5 }}>Scope & Instructions</label>
                <textarea 
                  className="search-box"
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Add New Node Modal */}
      {isAddingNode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: 'var(--a-panel)',
            border: '1px solid var(--a-border)',
            borderRadius: 14,
            padding: 24,
            width: '100%',
            maxWidth: 540,
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} color="var(--a-accent)" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Commission New Agency Node</h3>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsAddingNode(false)}
                style={{ padding: '4px 8px' }}
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateNode} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Node Title</label>
                <input 
                  type="text" 
                  className="search-box"
                  placeholder="e.g., Forensic Medical Examination Unit"
                  value={newNodeData.name}
                  onChange={(e) => setNewNodeData({ ...newNodeData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Pipeline Stage</label>
                  <select 
                    className="search-box"
                    value={newNodeData.layer}
                    onChange={(e) => setNewNodeData({ ...newNodeData, layer: e.target.value as any })}
                  >
                    <option value="ingress">1. Ingress & Telemetry</option>
                    <option value="ai_core">2. SVI AI Core</option>
                    <option value="dispatch">3. Statutory Dispatch</option>
                    <option value="relief">4. Inter-Agency Relief</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Initial Health Status</label>
                  <select 
                    className="search-box"
                    value={newNodeData.status}
                    onChange={(e) => setNewNodeData({ ...newNodeData, status: e.target.value as any })}
                  >
                    <option value="optimal">Optimal</option>
                    <option value="active">Active</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Parent Agency / Directorate</label>
                  <input 
                    type="text" 
                    className="search-box"
                    placeholder="e.g., District Hospital Civil Surgeon"
                    value={newNodeData.agency}
                    onChange={(e) => setNewNodeData({ ...newNodeData, agency: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Lead Nodal Officer</label>
                  <input 
                    type="text" 
                    className="search-box"
                    placeholder="e.g., Dr. S. K. Gupta"
                    value={newNodeData.leadOfficer}
                    onChange={(e) => setNewNodeData({ ...newNodeData, leadOfficer: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Target SLA / Latency</label>
                  <input 
                    type="text" 
                    className="search-box"
                    placeholder="e.g., 2h statutory turnaround"
                    value={newNodeData.latency}
                    onChange={(e) => setNewNodeData({ ...newNodeData, latency: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Max Concurrency / Capacity</label>
                  <input 
                    type="number" 
                    className="search-box"
                    value={newNodeData.capacity}
                    onChange={(e) => setNewNodeData({ ...newNodeData, capacity: parseInt(e.target.value) || 20 })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Operational Mandate & Description</label>
                <textarea 
                  className="search-box"
                  rows={3}
                  placeholder="Describe the statutory role and operating procedure of this agency unit..."
                  value={newNodeData.description}
                  onChange={(e) => setNewNodeData({ ...newNodeData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsAddingNode(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Commission Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
