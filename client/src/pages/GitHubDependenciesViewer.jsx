import React, { useState, useEffect } from 'react';
import { AlertCircle, ExternalLink, Grid, List, Package, Code, Users, BarChart3, Download, Calendar, Shield, Loader2, FileText, Search } from 'lucide-react';

const GitHubDependenciesViewer = () => {
  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [inputMode, setInputMode] = useState('url');
  const [dependencies, setDependencies] = useState(null);
  const [npmDetails, setNpmDetails] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState(null);

  const fetchNpmDetails = async (allDeps) => {
    setDetailsLoading(true);
    const packageNames = Object.keys(allDeps);
    const details = {};

    const fetchBatch = async (names) => {
      const promises = names.map(async (name) => {
        try {
          const registryRes = await fetch(`https://registry.npmjs.org/${name}`);
          if (!registryRes.ok) throw new Error('Registry fetch failed');
          const registryData = await registryRes.json();

          const downloadsRes = await fetch(`https://api.npmjs.org/downloads/point/last-week/${name}`);
          const downloadsData = downloadsRes.ok ? await downloadsRes.json() : null;

          const latest = registryData['dist-tags']?.latest;
          const latestInfo = latest ? registryData.versions?.[latest] : null;
          const timeData = registryData.time || {};

          details[name] = {
            description: registryData.description || 'No description available',
            latest: latest || 'N/A',
            license: latestInfo?.license || registryData.license || 'N/A',
            homepage: registryData.homepage || null,
            repository: registryData.repository?.url?.replace(/^git\+/, '').replace(/\.git$/, '') || null,
            weeklyDownloads: downloadsData?.downloads || null,
            lastPublish: timeData[latest] || null,
            author: registryData.author?.name || (typeof registryData.author === 'string' ? registryData.author : null),
            keywords: registryData.keywords?.slice(0, 5) || [],
            deprecated: latestInfo?.deprecated || null,
          };
        } catch {
          details[name] = {
            description: 'Failed to load details',
            latest: 'N/A',
            license: 'N/A',
            homepage: null,
            repository: null,
            weeklyDownloads: null,
            lastPublish: null,
            author: null,
            keywords: [],
            deprecated: null,
          };
        }
      });
      await Promise.all(promises);
    };

    // Batch requests in groups of 6
    for (let i = 0; i < packageNames.length; i += 6) {
      const batch = packageNames.slice(i, i + 6);
      await fetchBatch(batch);
      setNpmDetails((prev) => ({ ...prev, ...details }));
    }

    setDetailsLoading(false);
  };

  useEffect(() => {
    if (dependencies && viewMode === 'list') {
      const allDeps = {
        ...dependencies.dependencies,
        ...dependencies.devDependencies,
        ...dependencies.peerDependencies,
      };
      if (Object.keys(npmDetails).length === 0 && Object.keys(allDeps).length > 0) {
        fetchNpmDetails(allDeps);
      }
    }
  }, [dependencies, viewMode]);

  const formatDownloads = (num) => {
    if (!num) return null;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

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

  const getSummaryStats = () => {
    if (!dependencies) return null;
    const deps = dependencies.dependencies || {};
    const devDeps = dependencies.devDependencies || {};
    const peerDeps = dependencies.peerDependencies || {};
    const allDeps = { ...deps, ...devDeps, ...peerDeps };
    const totalCount = Object.keys(allDeps).length;
    const depsCount = Object.keys(deps).length;
    const devDepsCount = Object.keys(devDeps).length;
    const peerDepsCount = Object.keys(peerDeps).length;
    const pinned = Object.values(allDeps).filter(v => /^\d/.test(v)).length;
    const caret = Object.values(allDeps).filter(v => v.startsWith('^')).length;
    const tilde = Object.values(allDeps).filter(v => v.startsWith('~')).length;
    const other = totalCount - pinned - caret - tilde;
    const scoped = Object.keys(allDeps).filter(n => n.startsWith('@')).length;
    return { totalCount, depsCount, devDepsCount, peerDepsCount, pinned, caret, tilde, other, scoped };
  };

  const SummaryPanel = () => {
    const stats = getSummaryStats();
    if (!stats) return null;

    const breakdownItems = [
      { label: 'Dependencies', count: stats.depsCount, icon: <Package className="h-4 w-4" />, color: 'bg-blue-500' },
      { label: 'Dev Dependencies', count: stats.devDepsCount, icon: <Code className="h-4 w-4" />, color: 'bg-amber-500' },
      { label: 'Peer Dependencies', count: stats.peerDepsCount, icon: <Users className="h-4 w-4" />, color: 'bg-emerald-500' },
    ].filter(item => item.count > 0);

    const versionItems = [
      { label: 'Caret (^)', count: stats.caret, color: 'bg-blue-400' },
      { label: 'Tilde (~)', count: stats.tilde, color: 'bg-violet-400' },
      { label: 'Pinned', count: stats.pinned, color: 'bg-emerald-400' },
      { label: 'Other', count: stats.other, color: 'bg-gray-400' },
    ].filter(item => item.count > 0);

    return (
      <div className="mb-6 p-5 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">Summary</h3>
        </div>
        <div className="mb-4 text-center p-3 bg-white rounded-lg border border-slate-200">
          <span className="text-3xl font-bold text-slate-800">{stats.totalCount}</span>
          <p className="text-sm text-slate-500 mt-1">Total Packages{stats.scoped > 0 && ` · ${stats.scoped} scoped`}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {breakdownItems.map(item => (
            <div key={item.label} className="flex flex-col items-center p-3 bg-white rounded-lg border border-slate-200">
              <div className={`${item.color} text-white p-1.5 rounded-md mb-1.5`}>{item.icon}</div>
              <span className="text-xl font-bold text-slate-800">{item.count}</span>
              <span className="text-xs text-slate-500 text-center">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 mb-1.5">Distribution</p>
          <div className="flex h-3 rounded-full overflow-hidden">
            {breakdownItems.map(item => (
              <div key={item.label} className={`${item.color} transition-all`} style={{ width: `${(item.count / stats.totalCount) * 100}%` }} title={`${item.label}: ${item.count}`} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Version Ranges</p>
          <div className="flex flex-wrap gap-2">
            {versionItems.map(item => (
              <span key={item.label} className="inline-flex items-center gap-1.5 text-xs bg-white border border-slate-200 rounded-full px-2.5 py-1">
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                {item.label}: <strong>{item.count}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const ViewToggle = () => (
    <div className="flex gap-2 mb-4 mt-4">
      <button
        onClick={() => setViewMode('grid')}
        className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
      >
        <Grid className="h-4 w-4" />
        Grid
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
      >
        <List className="h-4 w-4" />
        List
      </button>
    </div>
  );

  const DependencyCardGrid = ({ name, version }) => (
    <div className="p-2 bg-gray-100 rounded-md flex items-center group">
      <div className="flex-1">
        <a href={`https://www.npmjs.com/package/${name}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
          {name}
          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
        <span className="text-gray-600 text-sm">{version}</span>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <a href={`https://www.npmjs.com/package/${name}/v/${version.replace('^', '').replace('~', '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-700">
          View version
        </a>
      </div>
    </div>
  );

  const DependencyCardList = ({ name, version }) => {
    const detail = npmDetails[name];
    const isLoading = !detail;

    return (
      <div className="mb-3 p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all group">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <a href={`https://www.npmjs.com/package/${name}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                {name}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{version}</span>
              {detail?.deprecated && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">Deprecated</span>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 mt-2 text-sm text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading details...
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{detail.description}</p>

                {detail.deprecated && (
                  <p className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">{detail.deprecated}</p>
                )}

                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {detail.latest && detail.latest !== 'N/A' && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Package className="h-3 w-3" />
                      Latest: <strong className="text-slate-700">{detail.latest}</strong>
                    </span>
                  )}
                  {detail.license && detail.license !== 'N/A' && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Shield className="h-3 w-3" />
                      {detail.license}
                    </span>
                  )}
                  {detail.weeklyDownloads && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Download className="h-3 w-3" />
                      {formatDownloads(detail.weeklyDownloads)}/week
                    </span>
                  )}
                  {detail.lastPublish && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      Published {formatDate(detail.lastPublish)}
                    </span>
                  )}
                  {detail.author && (
                    <span className="text-xs text-slate-500">
                      by <strong className="text-slate-700">{detail.author}</strong>
                    </span>
                  )}
                </div>

                {detail.keywords.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {detail.keywords.map(kw => (
                      <span key={kw} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{kw}</span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="ml-3 flex-shrink-0">
            <a href={`https://www.npmjs.com/package/${name}/v/${version.replace('^', '').replace('~', '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-blue-600 transition-colors whitespace-nowrap">
              View on npm →
            </a>
          </div>
        </div>
      </div>
    );
  };

  const DependencySection = ({ title, deps }) => {
    if (!deps || Object.keys(deps).length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          {title}
          <span className="text-sm font-normal text-slate-400 ml-2">({Object.keys(deps).length})</span>
        </h3>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.entries(deps).map(([name, version]) => (
              <DependencyCardGrid key={name} name={name} version={version} />
            ))}
          </div>
        ) : (
          <div>
            {Object.entries(deps).map(([name, version]) => (
              <DependencyCardList key={name} name={name} version={version} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const checkForMalicious = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:4000/api/dependencies/checkismalicious', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dependencies })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      setResult(result.text);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    setError(null);
    setDependencies(null);
    setNpmDetails({});
    setResult("");

    try {
      const data = JSON.parse(rawText);
      const deps = {
        dependencies: data.dependencies || {},
        devDependencies: data.devDependencies || {},
        peerDependencies: data.peerDependencies || {}
      };
      const total = Object.keys(deps.dependencies).length + Object.keys(deps.devDependencies).length + Object.keys(deps.peerDependencies).length;
      if (total === 0) {
        setError('No dependencies found in the pasted JSON.');
        return;
      }
      setDependencies(deps);
    } catch {
      setError('Invalid JSON. Make sure you paste a valid package.json content.');
    }
  };

  const fetchDependencies = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDependencies(null);
    setNpmDetails({});
    try {
      const rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      const response = await fetch(rawUrl);
      if (!response.ok) throw new Error('Failed to fetch package.json');
      const data = await response.json();
      setDependencies({
        dependencies: data.dependencies || {},
        devDependencies: data.devDependencies || {},
        peerDependencies: data.peerDependencies || {}
      });
    } catch (err) {
      setError('Failed to fetch or parse package.json. Make sure the URL is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">GitHub Dependencies Viewer</h1>

      {/* Input mode tabs */}
      <div className="flex gap-0 mb-4 border-b-2 border-slate-200">
        <button onClick={() => setInputMode('url')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition-colors ${inputMode === 'url' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
          <Search className="h-3.5 w-3.5" />
          From URL
        </button>
        <button onClick={() => setInputMode('paste')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition-colors ${inputMode === 'paste' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
          <FileText className="h-3.5 w-3.5" />
          Paste Content
        </button>
      </div>

      {/* URL input */}
      {inputMode === 'url' && (
        <form onSubmit={fetchDependencies} className="mb-6">
          <div className="flex gap-4">
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter GitHub package.json URL" className="flex-1 p-2 border rounded-md" />
            <button type="submit" disabled={loading} className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400">
              {loading ? 'Loading...' : 'Fetch'}
            </button>
          </div>
        </form>
      )}

      {/* Paste input */}
      {inputMode === 'paste' && (
        <form onSubmit={handlePaste} className="mb-6">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={'{\n  "dependencies": {\n    "react": "^18.2.0",\n    "express": "^4.18.2"\n  },\n  "devDependencies": {\n    "eslint": "^8.0.0"\n  }\n}'}
            rows={8}
            className="w-full p-3 border rounded-md font-mono text-sm resize-y focus:outline-none focus:border-blue-400 transition-colors"
          />
          <button type="submit" disabled={!rawText.trim()}
            className="cursor-pointer mt-3 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-sm font-semibold transition-colors">
            Parse Dependencies
          </button>
        </form>
      )}

      {dependencies && (
        <button onClick={checkForMalicious} disabled={loading} className="cursor-pointer mb-3 w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400">
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="font-semibold text-red-700">Error</p>
          </div>
          <p className="mt-1 text-red-600">{error}</p>
        </div>
      )}

      {result && <p>{result}</p>}

      {dependencies && (
        <div>
          <div className="flex items-center justify-between">
            <ViewToggle />
            {detailsLoading && viewMode === 'list' && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching npm details...
              </div>
            )}
          </div>
          {viewMode === 'list' && <SummaryPanel />}
          <DependencySection title="Dependencies" deps={dependencies.dependencies} />
          <DependencySection title="Dev Dependencies" deps={dependencies.devDependencies} />
          <DependencySection title="Peer Dependencies" deps={dependencies.peerDependencies} />
        </div>
      )}
    </div>
  );
};

export default GitHubDependenciesViewer;
