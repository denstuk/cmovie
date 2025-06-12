import { useState, useEffect } from 'react';
import type { Video } from '../../models/video';
import { getSampleVideos } from '../../mocks/videos';
import { Page } from '../page';
import { updateVideoMetadata, searchVideos } from '../../api/api';
import { toast } from 'sonner';
import { PageLoader } from '../../components/page-loader';

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
  const [isSaving, setIsSaving] = useState(false);

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
              disabled={isSaving}
              className={`px-4 py-2 border border-gray-700 rounded text-white hover:bg-gray-700 ${
                isSaving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={async () => {
                try {
                  setIsSaving(true);
                  await onSave(editedVideo);
                  onClose();
                } catch {
                  // Error handling is done in the parent component
                } finally {
                  setIsSaving(false);
                }
              }}
              className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ${
                isSaving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ManagePage = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Mock metrics data
  const metrics: VideoMetrics = {
    totalViews: 15427,
    averageWatchTime: '4:32',
    totalLikes: 892
  };

  // Fetch videos from the API
  const fetchVideos = async (reset = true) => {
    try {
      setIsLoading(true);
      if (reset) {
        // Starting fresh
        const { videos: fetchedVideos, nextToken: token } = await searchVideos('');
        setVideos(fetchedVideos);
        setNextToken(token || null);
        setHasMore(!!token);
      } else {
        // Loading more videos
        if (!nextToken) return;

        // We'd need to implement this properly in the searchVideos function
        const { videos: moreVideos, nextToken: token } = await searchVideos('');
        setVideos(prev => [...prev, ...moreVideos]);
        setNextToken(token || null);
        setHasMore(!!token);
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError('Failed to load videos. Using sample data instead.');
      // Fallback to sample data if API fails
      if (reset) {
        setVideos(getSampleVideos());
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveVideo = async (updatedVideo: Video) => {
    try {
      setIsUpdating(true);
      const updatedVideoData = await updateVideoMetadata(
        updatedVideo.video_id,
        {
          title: updatedVideo.title,
          description: updatedVideo.description,
          tags: updatedVideo.tags,
          blockedCountries: updatedVideo.regions_blacklist,
        }
      );

      // Update the video in the local videos array
      setVideos(prevVideos =>
        prevVideos.map(video =>
          video.video_id === updatedVideoData.video_id ? updatedVideoData : video
        )
      );

      toast.success('Video metadata updated successfully');
      return Promise.resolve(); // Return a resolved promise to signal success
    } catch (error) {
      console.error('Error updating video metadata:', error);
      toast.error('Failed to update video metadata');
      return Promise.reject(error); // Re-throw to be caught by the modal
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Page>
      <div className="container mx-auto px-4 py-16 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Manage Videos</h1>
        <button
          onClick={() => {
            fetchVideos(true);
            toast.success('Refreshing videos...');
          }}
          disabled={isLoading}
          className={`px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Videos'}
        </button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-400">Total Views</h3>
          {isLoading ? (
            <div className="h-10 flex items-center">
              <div className="w-16 h-6 bg-gray-700 animate-pulse rounded"></div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-white">{metrics.totalViews.toLocaleString()}</p>
          )}
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-400">Average Watch Time</h3>
          {isLoading ? (
            <div className="h-10 flex items-center">
              <div className="w-14 h-6 bg-gray-700 animate-pulse rounded"></div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-white">{metrics.averageWatchTime}</p>
          )}
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-400">Total Likes</h3>
          {isLoading ? (
            <div className="h-10 flex items-center">
              <div className="w-12 h-6 bg-gray-700 animate-pulse rounded"></div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-white">{metrics.totalLikes.toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Videos List */}
      <div className="bg-gray-800 rounded-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Published Videos</h2>

          {isLoading ? (
            <div className="py-8 flex justify-center">
              <PageLoader />
            </div>
          ) : error ? (
            <div className="py-4 text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Reload
              </button>
            </div>
          ) : videos.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-white text-lg">No videos found</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {videos.map((video: Video) => (
                  <div key={video.video_id} className="border border-gray-700 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-white">{video.title}</h3>
                      <p className="text-sm text-gray-400">
                        Uploaded on {
                          video.upload_date ?
                            new Date(video.upload_date).toLocaleDateString() :
                            'Unknown date'
                        }
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tags: {video.tags && video.tags.length > 0 ? video.tags.join(', ') : 'None'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Restricted in: {video.regions_blacklist && video.regions_blacklist.length > 0
                          ? video.regions_blacklist.join(', ')
                          : 'No restrictions'}
                      </p>
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

              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => fetchVideos(false)}
                    disabled={isLoading}
                    className={`px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isLoading ? 'Loading...' : 'Load More Videos'}
                  </button>
                </div>
              )}
            </>
          )}
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

      {/* Loading overlay for the entire page when updating */}
      {isUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p>Updating video metadata...</p>
          </div>
        </div>
      )}
      </div>
    </Page>
  );
};
