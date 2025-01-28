import { useState } from 'react';

const FeedbackForm = () => {
  const [data, setData] = useState(null);
  const [videoID, setVideoID] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getFeedback = async () => {
    setLoading(true);
    setError(null);

    const formData = {
      videoID: videoID,
    };
    console.log(formData);

    try {
      const response = await fetch('http://localhost:4000/api/video/texts', {
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

  return (
    <div className="max-w-md mx-auto p-6">
      <form className="space-y-4">
        <div>
          <label htmlFor="videoID" className="block text-sm font-medium mb-1">
            Video ID
          </label>
          <input
            type="text"
            id="videoID"
            name="videoID"
            value={videoID}
            onChange={(e) => setVideoID(e.target.value)}
            className="w-full border rounded-md p-2"
          />
        </div>

        <button
          onClick={getFeedback}
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      {data && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md">
          {data.feedback}
        </div>
      )}
    </div>
  );
};

export default FeedbackForm;