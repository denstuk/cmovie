import { useState } from 'react';
import type { Video } from '../../models/video';
import { getSampleVideos } from '../../mocks/videos';
import { Page } from '../page';

// List of countries for the blocklist selection
const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia",
  "Germany", "France", "Japan", "Brazil", "India", "China"
];

interface VideoMetrics {
  totalViews: number;
  averageWatchTime: string;
  totalLikes: number;
}

interface EditModalProps {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
  onSave: (video: Video) => void;
}

const EditModal = ({ video, isOpen, onClose, onSave }: EditModalProps) => {
  const [editedVideo, setEditedVideo] = useState<Video>(video);
  const [currentTag, setCurrentTag] = useState("");

  if (!isOpen) return null;

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim() !== '') {
      e.preventDefault();
      if (!editedVideo.tags.includes(currentTag.trim())) {
        setEditedVideo({
          ...editedVideo,
          tags: [...editedVideo.tags, currentTag.trim()]
        });
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedVideo({
      ...editedVideo,
      tags: editedVideo.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleCountryChange = (country: string) => {
    setEditedVideo({
      ...editedVideo,
      regions_blacklist: editedVideo.regions_blacklist.includes(country)
        ? editedVideo.regions_blacklist.filter(c => c !== country)
        : [...editedVideo.regions_blacklist, country]
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-[800px]">
        <h2 className="text-xl font-bold mb-4 text-white">Edit Video Metadata</h2>
        <form className="space-y-8">
          {/* Title Section */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-white">Title</label>
            <input
              id="title"
              type="text"
              value={editedVideo.title}
              onChange={(e) => setEditedVideo({ ...editedVideo, title: e.target.value })}
              className="shadow-sm bg-gray-700 focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-600 rounded-lg h-12 text-white px-4"
            />
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-white">Description</label>
            <textarea
              id="description"
              rows={4}
              value={editedVideo.description}
              onChange={(e) => setEditedVideo({ ...editedVideo, description: e.target.value })}
              className="shadow-sm bg-gray-700 focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-600 rounded-lg text-white px-4 py-2"
            />
          </div>

          {/* Country Blocklist Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Blocked Countries</label>
            <p className="text-xs text-gray-400">Select countries where this video should not be available</p>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {COUNTRIES.map(country => (
                <div key={country} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`country-${country}`}
                    checked={editedVideo.regions_blacklist.includes(country)}
                    onChange={() => handleCountryChange(country)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 bg-gray-700 border-gray-500 rounded"
                  />
                  <label htmlFor={`country-${country}`} className="ml-2 text-sm text-gray-300">
                    {country}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Tags Input Section */}
          <div className="space-y-2">
            <label htmlFor="tags" className="block text-sm font-medium text-white">Tags</label>
            <div className="mt-1">
              <div className="flex flex-wrap gap-2 mb-2">
                {editedVideo.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-gray-700 text-white"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 -mr-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-gray-400 hover:bg-gray-600 hover:text-white focus:outline-none focus:bg-red-600 focus:text-white transition-colors duration-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                id="tags"
                className="shadow-sm bg-gray-700 focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-600 rounded-lg text-white px-4 py-2"
                placeholder="Add tags (press Enter to add)"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>
            <p className="text-xs text-gray-400">Press Enter to add a tag</p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-700 rounded text-white hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(editedVideo);
                onClose();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ManagePage = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // Mock metrics data
  const metrics: VideoMetrics = {
    totalViews: 15427,
    averageWatchTime: '4:32',
    totalLikes: 892
  };

  const handleSaveVideo = (updatedVideo: Video) => {
    // TODO: Implement API call to update video metadata
    console.log('Updating video metadata:', updatedVideo);
  };

  return (
    <Page>
      <div className="container mx-auto px-4 py-16 lg:px-8">
      <h1 className="text-2xl font-bold mb-8 text-white">Manage Videos</h1>

      {/* Metrics Section */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-400">Total Views</h3>
          <p className="text-3xl font-bold text-white">{metrics.totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-400">Average Watch Time</h3>
          <p className="text-3xl font-bold text-white">{metrics.averageWatchTime}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-400">Total Likes</h3>
          <p className="text-3xl font-bold text-white">{metrics.totalLikes.toLocaleString()}</p>
        </div>
      </div>

      {/* Videos List */}
      <div className="bg-gray-800 rounded-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Published Videos</h2>
          <div className="space-y-4">
            {getSampleVideos().map((video: Video) => (
              <div key={video.video_id} className="border border-gray-700 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">{video.title}</h3>
                  <p className="text-sm text-gray-400">Uploaded on {new Date(video.upload_date).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => setSelectedVideo(video)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedVideo && (
        <EditModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onSave={handleSaveVideo}
        />
      )}
      </div>
    </Page>
  );
};
