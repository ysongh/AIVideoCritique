import React, { useState } from 'react';
import { AlertCircle, ExternalLink, Grid, List, Package, Code, Users, BarChart3 } from 'lucide-react';

const GitHubDependenciesViewer = () => {
  const [url, setUrl] = useState('');
  const [dependencies, setDependencies] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState(null);

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

    // Categorize by version prefix
    const pinned = Object.values(allDeps).filter(v => /^\d/.test(v)).length;
    const caret = Object.values(allDeps).filter(v => v.startsWith('^')).length;
    const tilde = Object.values(allDeps).filter(v => v.startsWith('~')).length;
    const other = totalCount - pinned - caret - tilde;

    // Find scoped packages
    const scoped = Object.keys(allDeps).filter(n => n.startsWith('@')).length;

    return {
      totalCount, depsCount, devDepsCount, peerDepsCount,
      pinned, caret, tilde, other, scoped,
    };
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

        {/* Total count */}
        <div className="mb-4 text-center p-3 bg-white rounded-lg border border-slate-200">
          <span className="text-3xl font-bold text-slate-800">{stats.totalCount}</span>
          <p className="text-sm text-slate-500 mt-1">Total Packages{stats.scoped > 0 && ` · ${stats.scoped} scoped`}</p>
        </div>

        {/* Breakdown by type */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {breakdownItems.map(item => (
            <div key={item.label} className="flex flex-col items-center p-3 bg-white rounded-lg border border-slate-200">
              <div className={`${item.color} text-white p-1.5 rounded-md mb-1.5`}>{item.icon}</div>
              <span className="text-xl font-bold text-slate-800">{item.count}</span>
              <span className="text-xs text-slate-500 text-center">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Stacked bar for category distribution */}
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 mb-1.5">Distribution</p>
          <div className="flex h-3 rounded-full overflow-hidden">
            {breakdownItems.map(item => (
              <div
                key={item.label}
                className={`${item.color} transition-all`}
                style={{ width: `${(item.count / stats.totalCount) * 100}%` }}
                title={`${item.label}: ${item.count}`}
              />
            ))}
          </div>
        </div>

        {/* Version range breakdown */}
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
        className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${
          viewMode === 'grid'
            ? 'bg-blue-100 text-blue-700'
            : 'hover:bg-gray-100'
        }`}
      >
        <Grid className="h-4 w-4" />
        Grid
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${
          viewMode === 'list'
            ? 'bg-blue-100 text-blue-700'
            : 'hover:bg-gray-100'
        }`}
      >
        <List className="h-4 w-4" />
        List
      </button>
    </div>
  );

  const DependencyCard = ({ name, version }) => (
    <div className={`p-2 bg-gray-100 rounded-md flex items-center group ${
      viewMode === 'list' ? 'mb-2' : ''
    }`}>
      <div className="flex-1">
        <a 
          href={`https://www.npmjs.com/package/${name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          {name}
          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
        <span className="text-gray-600 text-sm">{version}</span>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <a 
          href={`https://www.npmjs.com/package/${name}/v/${version.replace('^', '').replace('~', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          View version
        </a>
      </div>
    </div>
  );

  const DependencySection = ({ title, deps }) => {
    if (!deps || Object.keys(deps).length === 0) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
          : ""
        }>
          {Object.entries(deps).map(([name, version]) => (
            <DependencyCard key={name} name={name} version={version} />
          ))}
        </div>
      </div>
    );
  };

  const checkForMalicious = async () => {
    setLoading(true);
    setError(null);

    const formData = {
      dependencies: dependencies,
    };

    try {
      const response = await fetch('http://localhost:4000/api/dependencies/checkismalicious', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResult(result.text);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDependencies(null);

    try {
      const rawUrl = url
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/');

      const response = await fetch(rawUrl);
      if (!response.ok) throw new Error('Failed to fetch package.json');
      
      const data = await response.json();
      const deps = {
        dependencies: data.dependencies || {},
        devDependencies: data.devDependencies || {},
        peerDependencies: data.peerDependencies || {}
      };
      setDependencies(deps);
    } catch (err) {
      setError('Failed to fetch or parse package.json. Make sure the URL is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">GitHub Dependencies Viewer</h1>
      
      <form onSubmit={fetchDependencies} className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter GitHub package.json URL"
            className="flex-1 p-2 border rounded-md"
          />
          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? 'Loading...' : 'Fetch'}
          </button>
        </div>
      </form>

      {dependencies && (
         <button
          onClick={checkForMalicious}
          disabled={loading}
          className="cursor-pointer mb-3 w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
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
          <ViewToggle />
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
