import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Upload from '../components/Upload';
import MediaGallery from '../components/MediaGallery';
import MediaPreview from '../components/MediaPreview';
import Stats from '../components/Stats';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const handleUploadComplete = (media) => {
    setRefreshTrigger(n => n + 1);
    toast.success(`"${media.originalName}" uploaded successfully!`);
  };

  return (
    <>
      {/* User welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.username}! 👋
        </h2>
        <p className="text-gray-500 mt-1">
          Manage your media files with ease
        </p>
      </div>

      {/* Stats */}
      <Stats />

      {/* Upload Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Upload</h3>
        <Upload onUploadComplete={handleUploadComplete} />
      </div>

      {/* Recent Media */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Media</h3>
        </div>
        <MediaGallery
          refreshTrigger={refreshTrigger}
          onMediaClick={setSelectedMedia}
        />
      </div>

      {/* Preview Modal */}
      {selectedMedia && (
        <MediaPreview
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </>
  );
}
