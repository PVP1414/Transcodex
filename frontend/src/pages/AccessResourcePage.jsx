import { useState } from 'react';
import axios from 'axios';
import { useToast } from '../context/toast';
import VideoPlayer from '../components/VideoPlayer';
import ImagePlayer from '../components/ImagePlayer';

export default function AccessResourcePage() {
  const toast = useToast();
  const [mediaId, setMediaId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const api = axios.create({
    baseURL: apiBaseUrl,
  });

  const handleAccessResource = async (e) => {
    e.preventDefault();

    if (!mediaId.trim()) {
      toast.error('Please enter a media ID');
      return;
    }

    if (!apiKey.trim()) {
      toast.error('Please enter your API key');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const infoRes = await api.get(`/signed/info/${mediaId}`, {
        headers: { 'x-api-key': apiKey },
      });
      setMedia(infoRes.data.data);
      toast.success('Resource loaded successfully');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to access resource';
      toast.error(message);
      setError(message);
      setMedia(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMedia(null);
    setMediaId('');
    setApiKey('');
  };

  if (media) {
    if (media.mediaType === 'video') {
      return <VideoPlayer media={media} onClose={handleReset} apiKey={apiKey} />;
    }
    return <ImagePlayer media={media} onClose={handleReset} apiKey={apiKey} />;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Access Resource</h2>
        <p className="text-gray-500 mt-1">
          Access private media using an API key
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <form onSubmit={handleAccessResource} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Media ID
            </label>
            <input
              type="text"
              value={mediaId}
              onChange={(e) => setMediaId(e.target.value)}
              placeholder="Enter the media ID (24 character hex string)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-gray-500 text-sm mt-1">
              The media ID from your dashboard or gallery URL
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="mhs_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-gray-500 text-sm mt-1">
              Your API key from the API Keys page
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Loading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Access Resource
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">How to use:</h4>
          <ol className="text-sm text-gray-500 space-y-2 list-decimal list-inside">
            <li>Go to your Dashboard or Gallery and copy a media ID</li>
            <li>Go to the API Keys page and create or copy an API key</li>
            <li>Paste the media ID and API key above</li>
            <li>Click "Access Resource" to view the media</li>
          </ol>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 rounded-xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-indigo-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Note</h4>
            <p className="text-sm text-gray-500 mt-1">
              The access token is valid for 1 hour. Re-authenticate if the session expires.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}