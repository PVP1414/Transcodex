import MediaGallery from "../components/MediaGallery";

export default function GalleryPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Media Gallery</h2>
        <p className="text-gray-500 mt-1">
          Browse and manage all your uploaded media files
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <MediaGallery refreshTrigger={0} />
      </div>
    </>
  );
}
