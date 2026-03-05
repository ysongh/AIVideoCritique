import React, { useState, useEffect } from 'react';
import { AlertCircle, ExternalLink, Grid, List, Package, Code, BarChart3, Download, Calendar, Shield, Loader2, FileText, Search, ChevronDown, ChevronUp, Upload } from 'lucide-react';

const PY_COLORS = {
  primary: '#306998',
  secondary: '#FFD43B',
  accent: '#4B8BBE',
  dark: '#1e3a5f',
  bg: '#f8fafc',
  surface: '#ffffff',
  muted: '#64748b',
  border: '#e2e8f0',
};

const PythonDependenciesViewer = () => {
  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [inputMode, setInputMode] = useState('url'); // 'url' or 'paste'
  const [dependencies, setDependencies] = useState(null);
  const [pypiDetails, setPypiDetails] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedPkg, setExpandedPkg] = useState(null);

  // Parse requirements.txt content into structured data
  const parseRequirements = (text) => {
    const lines = text.split('\n');
    const deps = [];

    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#') || line.startsWith('-')) continue;

      // Handle: package==1.0, package>=1.0, package~=1.0, package!=1.0, package<=1.0, package<1.0, package>1.0
      const match = line.match(/^([a-zA-Z0-9_\-.\[\]]+)\s*(==|>=|<=|~=|!=|>|<)?\s*(.*)$/);
      if (match) {
        const name = match[1].replace(/\[.*\]/, ''); // strip extras like requests[security]
        const extras = match[1].includes('[') ? match[1].match(/\[(.+)\]/)?.[1] : null;
        const operator = match[2] || null;
        const version = match[3]?.split(',')[0]?.trim() || null;
        deps.push({ name, operator, version, extras, raw: line });
      }
    }

    return deps;
  };

  const fetchPypiDetails = async (deps) => {
    setDetailsLoading(true);
    const details = {};

    const fetchBatch = async (batch) => {
      const promises = batch.map(async (dep) => {
        try {
          const res = await fetch(`https://pypi.org/pypi/${dep.name}/json`);
          if (!res.ok) throw new Error('PyPI fetch failed');
          const data = await res.json();

          const info = data.info;
          const releases = Object.keys(data.releases || {});
          const latestRelease = data.releases?.[info.version] || [];
          const latestUpload = latestRelease.length > 0 ? latestRelease[0].upload_time_iso_8601 : null;

          // Calculate total downloads from recent file uploads (approximate)
          details[dep.name] = {
            description: info.summary || 'No description available',
            latest: info.version || 'N/A',
            license: info.license && info.license.length < 80 ? info.license : (info.classifiers?.find(c => c.startsWith('License'))?.split(':: ').pop() || 'N/A'),
            homepage: info.home_page || info.project_urls?.Homepage || info.project_urls?.homepage || null,
            repository: info.project_urls?.Repository || info.project_urls?.Source || info.project_urls?.['Source Code'] || info.project_urls?.GitHub || null,
            docs: info.project_urls?.Documentation || info.project_urls?.Docs || null,
            author: info.author || info.maintainer || null,
            authorEmail: info.author_email || null,
            requiresPython: info.requires_python || null,
            keywords: info.keywords ? info.keywords.split(',').map(k => k.trim()).filter(Boolean).slice(0, 6) : [],
            classifiers: info.classifiers?.filter(c => c.startsWith('Programming Language :: Python :: 3')).map(c => c.split(':: ').pop()) || [],
            lastUpload: latestUpload,
            totalReleases: releases.length,
            requiresDist: info.requires_dist?.slice(0, 10) || [],
            yanked: latestRelease.some(f => f.yanked) || false,
          };
        } catch {
          details[dep.name] = {
            description: 'Failed to load details from PyPI',
            latest: 'N/A',
            license: 'N/A',
            homepage: null,
            repository: null,
            docs: null,
            author: null,
            authorEmail: null,
            requiresPython: null,
            keywords: [],
            classifiers: [],
            lastUpload: null,
            totalReleases: 0,
            requiresDist: [],
            yanked: false,
          };
        }
      });
      await Promise.all(promises);
    };

    for (let i = 0; i < deps.length; i += 5) {
      const batch = deps.slice(i, i + 5);
      await fetchBatch(batch);
      setPypiDetails(prev => ({ ...prev, ...details }));
    }

    setDetailsLoading(false);
  };

  useEffect(() => {
    if (dependencies && viewMode === 'list' && Object.keys(pypiDetails).length === 0 && dependencies.length > 0) {
      fetchPypiDetails(dependencies);
    }
  }, [dependencies, viewMode]);

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  const fetchFromUrl = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDependencies(null);
    setPypiDetails({});

    try {
      let rawUrl = url;
      if (url.includes('github.com')) {
        rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      }

      const response = await fetch(rawUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      const text = await response.text();
      const deps = parseRequirements(text);

      if (deps.length === 0) throw new Error('No valid dependencies found in the file.');
      setDependencies(deps);
    } catch (err) {
      setError(err.message || 'Failed to fetch or parse requirements file.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    setError(null);
    setDependencies(null);
    setPypiDetails({});

    const deps = parseRequirements(rawText);
    if (deps.length === 0) {
      setError('No valid dependencies found. Make sure the format is correct (e.g. package==1.0.0).');
      return;
    }
    setDependencies(deps);
  };

  const getSummaryStats = () => {
    if (!dependencies) return null;
    const total = dependencies.length;
    const pinned = dependencies.filter(d => d.operator === '==').length;
    const minimum = dependencies.filter(d => d.operator === '>=').length;
    const compatible = dependencies.filter(d => d.operator === '~=').length;
    const unpinned = dependencies.filter(d => !d.operator).length;
    const other = total - pinned - minimum - compatible - unpinned;
    const withExtras = dependencies.filter(d => d.extras).length;

    return { total, pinned, minimum, compatible, unpinned, other, withExtras };
  };

  const SummaryPanel = () => {
    const stats = getSummaryStats();
    if (!stats) return null;

    const items = [
      { label: 'Pinned (==)', count: stats.pinned, color: '#306998' },
      { label: 'Minimum (>=)', count: stats.minimum, color: '#4B8BBE' },
      { label: 'Compatible (~=)', count: stats.compatible, color: '#FFD43B' },
      { label: 'Unpinned', count: stats.unpinned, color: '#94a3b8' },
      { label: 'Other', count: stats.other, color: '#cbd5e1' },
    ].filter(i => i.count > 0);

    return (
      <div style={{ marginBottom: 24, padding: 20, background: 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)', border: `1px solid ${PY_COLORS.border}`, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <BarChart3 size={20} color={PY_COLORS.dark} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: PY_COLORS.dark, margin: 0, fontFamily: "'Source Code Pro', monospace" }}>Summary</h3>
        </div>

        <div style={{ textAlign: 'center', padding: 16, background: PY_COLORS.surface, borderRadius: 8, border: `1px solid ${PY_COLORS.border}`, marginBottom: 16 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: PY_COLORS.dark, fontFamily: "'Source Code Pro', monospace" }}>{stats.total}</span>
          <p style={{ fontSize: 13, color: PY_COLORS.muted, marginTop: 4 }}>
            Total Packages{stats.withExtras > 0 && ` · ${stats.withExtras} with extras`}
          </p>
        </div>

        {/* Distribution bar */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: PY_COLORS.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Version Constraints</p>
          <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden' }}>
            {items.map(item => (
              <div key={item.label} style={{ width: `${(item.count / stats.total) * 100}%`, background: item.color, transition: 'width 0.3s ease' }} title={`${item.label}: ${item.count}`} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {items.map(item => (
            <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, background: PY_COLORS.surface, border: `1px solid ${PY_COLORS.border}`, borderRadius: 20, padding: '4px 10px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
              {item.label}: <strong>{item.count}</strong>
            </span>
          ))}
        </div>
      </div>
    );
  };

  const DependencyCardGrid = ({ dep }) => (
    <div style={{ padding: 12, background: PY_COLORS.surface, border: `1px solid ${PY_COLORS.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'border-color 0.2s, box-shadow 0.2s', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = PY_COLORS.accent; e.currentTarget.style.boxShadow = '0 2px 8px rgba(48,105,152,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = PY_COLORS.border; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ flex: 1 }}>
        <a href={`https://pypi.org/project/${dep.name}/`} target="_blank" rel="noopener noreferrer"
          style={{ fontWeight: 600, color: PY_COLORS.primary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'Source Code Pro', monospace", fontSize: 14 }}>
          {dep.name}
          <ExternalLink size={12} />
        </a>
        <div style={{ fontSize: 12, color: PY_COLORS.muted, marginTop: 2, fontFamily: "'Source Code Pro', monospace" }}>
          {dep.operator ? `${dep.operator}${dep.version}` : 'any version'}
          {dep.extras && <span style={{ marginLeft: 6, color: PY_COLORS.accent }}>[{dep.extras}]</span>}
        </div>
      </div>
    </div>
  );

  const DependencyCardList = ({ dep }) => {
    const detail = pypiDetails[dep.name];
    const isLoading = !detail;
    const isExpanded = expandedPkg === dep.name;

    return (
      <div style={{ marginBottom: 12, background: PY_COLORS.surface, border: `1px solid ${PY_COLORS.border}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = PY_COLORS.accent; e.currentTarget.style.boxShadow = '0 2px 12px rgba(48,105,152,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = PY_COLORS.border; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <a href={`https://pypi.org/project/${dep.name}/`} target="_blank" rel="noopener noreferrer"
                  style={{ fontWeight: 700, color: PY_COLORS.primary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'Source Code Pro', monospace", fontSize: 15 }}>
                  {dep.name}
                  <ExternalLink size={12} />
                </a>
                <span style={{ fontSize: 11, fontFamily: "'Source Code Pro', monospace", background: '#f1f5f9', color: PY_COLORS.muted, padding: '2px 8px', borderRadius: 4 }}>
                  {dep.operator ? `${dep.operator}${dep.version}` : 'any'}
                </span>
                {dep.extras && (
                  <span style={{ fontSize: 11, background: '#eff6ff', color: PY_COLORS.accent, padding: '2px 8px', borderRadius: 4 }}>extras: {dep.extras}</span>
                )}
                {detail?.yanked && (
                  <span style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>Yanked</span>
                )}
              </div>

              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
                  <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Loading from PyPI...
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 1.5 }}>{detail.description}</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                    {detail.latest && detail.latest !== 'N/A' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: PY_COLORS.muted }}>
                        <Package size={13} />
                        Latest: <strong style={{ color: '#334155' }}>{detail.latest}</strong>
                      </span>
                    )}
                    {detail.license && detail.license !== 'N/A' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: PY_COLORS.muted }}>
                        <Shield size={13} />
                        {detail.license}
                      </span>
                    )}
                    {detail.lastUpload && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: PY_COLORS.muted }}>
                        <Calendar size={13} />
                        Published {formatDate(detail.lastUpload)}
                      </span>
                    )}
                    {detail.totalReleases > 0 && (
                      <span style={{ fontSize: 12, color: PY_COLORS.muted }}>
                        {detail.totalReleases} releases
                      </span>
                    )}
                    {detail.author && (
                      <span style={{ fontSize: 12, color: PY_COLORS.muted }}>
                        by <strong style={{ color: '#334155' }}>{detail.author}</strong>
                      </span>
                    )}
                  </div>

                  {detail.requiresPython && (
                    <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, background: '#fefce8', color: '#a16207', padding: '3px 8px', borderRadius: 4 }}>
                      🐍 Requires Python {detail.requiresPython}
                    </div>
                  )}

                  {detail.keywords.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {detail.keywords.map(kw => (
                        <span key={kw} style={{ fontSize: 11, background: '#f1f5f9', color: PY_COLORS.muted, padding: '2px 8px', borderRadius: 12 }}>{kw}</span>
                      ))}
                    </div>
                  )}

                  {/* Expandable section for sub-dependencies */}
                  {detail.requiresDist.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <button onClick={() => setExpandedPkg(isExpanded ? null : dep.name)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: PY_COLORS.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {detail.requiresDist.length} sub-dependencies
                      </button>
                      {isExpanded && (
                        <div style={{ marginTop: 8, padding: 12, background: '#f8fafc', borderRadius: 6, border: `1px solid ${PY_COLORS.border}` }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {detail.requiresDist.map((rd, i) => {
                              const subName = rd.split(/[<>=!;\s]/)[0];
                              return (
                                <a key={i} href={`https://pypi.org/project/${subName}/`} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: 11, fontFamily: "'Source Code Pro', monospace", background: PY_COLORS.surface, border: `1px solid ${PY_COLORS.border}`, borderRadius: 4, padding: '3px 8px', color: PY_COLORS.primary, textDecoration: 'none', transition: 'background 0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                                  onMouseLeave={e => e.currentTarget.style.background = PY_COLORS.surface}
                                >
                                  {rd.length > 50 ? rd.substring(0, 50) + '…' : rd}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ marginLeft: 12, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <a href={`https://pypi.org/project/${dep.name}/`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: PY_COLORS.muted, textDecoration: 'none', whiteSpace: 'nowrap', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = PY_COLORS.primary}
                onMouseLeave={e => e.currentTarget.style.color = PY_COLORS.muted}
              >
                PyPI →
              </a>
              {detail?.repository && (
                <a href={detail.repository} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: PY_COLORS.muted, textDecoration: 'none', whiteSpace: 'nowrap', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = PY_COLORS.primary}
                  onMouseLeave={e => e.currentTarget.style.color = PY_COLORS.muted}
                >
                  Source →
                </a>
              )}
              {detail?.docs && (
                <a href={detail.docs} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: PY_COLORS.muted, textDecoration: 'none', whiteSpace: 'nowrap', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = PY_COLORS.primary}
                  onMouseLeave={e => e.currentTarget.style.color = PY_COLORS.muted}
                >
                  Docs →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32, fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Source+Code+Pro:wght@400;500;600;700&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${PY_COLORS.primary}, ${PY_COLORS.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PY_COLORS.secondary, fontSize: 22 }}>
          🐍
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: PY_COLORS.dark, margin: 0, fontFamily: "'Source Code Pro', monospace" }}>
            Python Dependencies Viewer
          </h1>
          <p style={{ fontSize: 13, color: PY_COLORS.muted, margin: 0, marginTop: 2 }}>
            Analyze requirements.txt from GitHub or paste directly
          </p>
        </div>
      </div>

      {/* Input mode tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: `2px solid ${PY_COLORS.border}` }}>
        <button onClick={() => setInputMode('url')}
          style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, color: inputMode === 'url' ? PY_COLORS.primary : PY_COLORS.muted, background: 'none', border: 'none', borderBottom: inputMode === 'url' ? `2px solid ${PY_COLORS.primary}` : '2px solid transparent', marginBottom: -2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', transition: 'color 0.2s' }}>
          <Search size={14} />
          From URL
        </button>
        <button onClick={() => setInputMode('paste')}
          style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, color: inputMode === 'paste' ? PY_COLORS.primary : PY_COLORS.muted, background: 'none', border: 'none', borderBottom: inputMode === 'paste' ? `2px solid ${PY_COLORS.primary}` : '2px solid transparent', marginBottom: -2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', transition: 'color 0.2s' }}>
          <FileText size={14} />
          Paste Content
        </button>
      </div>

      {/* URL input */}
      {inputMode === 'url' && (
        <form onSubmit={fetchFromUrl} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/user/repo/blob/main/requirements.txt"
              style={{ flex: 1, padding: '10px 14px', border: `1px solid ${PY_COLORS.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Source Code Pro', monospace", outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = PY_COLORS.accent}
              onBlur={e => e.target.style.borderColor = PY_COLORS.border}
            />
            <button type="submit" disabled={loading || !url}
              style={{ padding: '10px 24px', background: loading ? '#94a3b8' : PY_COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', fontFamily: 'inherit' }}>
              {loading ? 'Loading...' : 'Fetch'}
            </button>
          </div>
        </form>
      )}

      {/* Paste input */}
      {inputMode === 'paste' && (
        <form onSubmit={handlePaste} style={{ marginBottom: 24 }}>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`flask==2.3.2\nrequests>=2.28.0\nnumpy~=1.24\npandas`}
            rows={8}
            style={{ width: '100%', padding: '12px 14px', border: `1px solid ${PY_COLORS.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Source Code Pro', monospace", outline: 'none', resize: 'vertical', transition: 'border-color 0.2s', lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = PY_COLORS.accent}
            onBlur={e => e.target.style.borderColor = PY_COLORS.border}
          />
          <button type="submit" disabled={!rawText.trim()}
            style={{ marginTop: 12, padding: '10px 24px', background: !rawText.trim() ? '#94a3b8' : PY_COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: !rawText.trim() ? 'not-allowed' : 'pointer', transition: 'background 0.2s', fontFamily: 'inherit' }}>
            Parse Dependencies
          </button>
        </form>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginBottom: 24, padding: 16, background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} color="#ef4444" />
            <p style={{ fontWeight: 600, color: '#dc2626', margin: 0, fontSize: 14 }}>Error</p>
          </div>
          <p style={{ marginTop: 4, color: '#dc2626', fontSize: 13 }}>{error}</p>
        </div>
      )}

      {/* Results */}
      {dependencies && dependencies.length > 0 && (
        <div>
          {/* View toggle + loading indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setViewMode('grid')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  background: viewMode === 'grid' ? '#dbeafe' : 'transparent', color: viewMode === 'grid' ? PY_COLORS.primary : PY_COLORS.muted }}>
                <Grid size={15} /> Grid
              </button>
              <button onClick={() => setViewMode('list')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  background: viewMode === 'list' ? '#dbeafe' : 'transparent', color: viewMode === 'list' ? PY_COLORS.primary : PY_COLORS.muted }}>
                <List size={15} /> List
              </button>
            </div>
            {detailsLoading && viewMode === 'list' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: PY_COLORS.muted }}>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                Fetching PyPI details...
              </div>
            )}
          </div>

          {/* Summary (list view only) */}
          {viewMode === 'list' && <SummaryPanel />}

          {/* Dependencies list */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: PY_COLORS.dark, marginBottom: 12, fontFamily: "'Source Code Pro', monospace" }}>
              Packages
              <span style={{ fontSize: 13, fontWeight: 400, color: PY_COLORS.muted, marginLeft: 8 }}>({dependencies.length})</span>
            </h3>

            {viewMode === 'grid' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {dependencies.map(dep => (
                  <DependencyCardGrid key={dep.name} dep={dep} />
                ))}
              </div>
            ) : (
              <div>
                {dependencies.map(dep => (
                  <DependencyCardList key={dep.name} dep={dep} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PythonDependenciesViewer;
