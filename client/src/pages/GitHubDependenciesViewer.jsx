import React, { useState } from 'react';
import { AlertCircle, ExternalLink, Grid, List } from 'lucide-react';

const GitHubDependenciesViewer = () => {
  const [url, setUrl] = useState('');
  const [dependencies, setDependencies] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState(null);

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
      // Convert GitHub URL to raw content URL
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
          <DependencySection title="Dependencies" deps={dependencies.dependencies} />
          <DependencySection title="Dev Dependencies" deps={dependencies.devDependencies} />
          <DependencySection title="Peer Dependencies" deps={dependencies.peerDependencies} />
        </div>
      )}
    </div>
  );
};

export default GitHubDependenciesViewer;
