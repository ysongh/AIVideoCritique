import React, { useState } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';

const GitHubDependenciesViewer = () => {
  const [url, setUrl] = useState('');
  const [dependencies, setDependencies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      setData(result);
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

  const DependencySection = ({ title, deps }) => {
    if (!deps || Object.keys(deps).length === 0) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {Object.entries(deps).map(([name, version]) => (
            <div key={name} className="p-2 bg-gray-100 rounded-md flex items-center justify-between group">
              <div>
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
          ))}
        </div>
      </div>
    );
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? 'Loading...' : 'Fetch'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="font-semibold text-red-700">Error</p>
          </div>
          <p className="mt-1 text-red-600">{error}</p>
        </div>
      )}

      {dependencies && (
        <div>
          <DependencySection title="Dependencies" deps={dependencies.dependencies} />
          <DependencySection title="Dev Dependencies" deps={dependencies.devDependencies} />
          <DependencySection title="Peer Dependencies" deps={dependencies.peerDependencies} />
        </div>
      )}
    </div>
  );
};

export default GitHubDependenciesViewer;
