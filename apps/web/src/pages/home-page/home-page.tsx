import { useState, useEffect } from "react";
import type { FC } from "react";
import { Link } from "react-router";
import { Page } from "../page";
import { config } from "../../config";

interface VideoData {
  video_id: string;
  title: string;
  description: string;
  file_key: string;
  upload_date: string;
  tags: string[];
  regions_blacklist: string[];
}

export const HomePage: FC = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/videos/search`);

        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }

        const data = await response.json();
        setVideos(data.videos || []);
        setNextToken(data.nextToken || null);
        setHasMore(!!data.nextToken);
      } catch (err) {
        console.error("Error fetching videos:", err);
        setError('Failed to load videos. Please try again later.');
        // Use sample data as fallback when API fails
        setVideos(getSampleVideos());
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const loadMoreVideos = async () => {
    if (!nextToken || !hasMore) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${config.apiUrl}/videos/search?lastKey=${nextToken}`);

      if (!response.ok) {
        throw new Error('Failed to fetch more videos');
      }

      const data = await response.json();
      setVideos(prevVideos => [...prevVideos, ...(data.videos || [])]);
      setNextToken(data.nextToken || null);
      setHasMore(!!data.nextToken);
    } catch (err) {
      console.error("Error fetching more videos:", err);
      setError('Failed to load more videos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback sample videos when API is not available
  const getSampleVideos = () => [
    {
      video_id: '1',
      title: 'Big Buck Bunny',
      description: 'A short animated film featuring a giant rabbit',
      file_key: 'sample/bunny.mp4',
      upload_date: '2023-01-01T00:00:00.000Z',
      tags: ['animation', 'comedy'],
      regions_blacklist: []
    },
    {
      video_id: '2',
      title: 'Ocean Documentary',
      description: 'Explore the depths of our oceans in this stunning documentary',
      file_key: 'sample/ocean.mp4',
      upload_date: '2023-01-02T00:00:00.000Z',
      tags: ['documentary', 'nature'],
      regions_blacklist: []
    },
    {
      video_id: '3',
      title: 'Mountain Adventure',
      description: 'Follow climbers as they ascend the world\'s tallest peaks',
      file_key: 'sample/mountain.mp4',
      upload_date: '2023-01-03T00:00:00.000Z',
      tags: ['adventure', 'sports'],
      regions_blacklist: []
    }
  ];

  // Generate a thumbnail from the file key or use a placeholder
  const getThumbnailUrl = (fileKey: string) => {
    // In a real implementation, you'd have a proper thumbnail generation system
    // For now, we'll use placeholder images
    const id = parseInt(fileKey.split('/').pop()?.split('.')[0] || '0', 10) % 20 + 100;
    return `https://picsum.photos/id/${id}/400/250`;
  };

  if (isLoading && videos.length === 0) {
    return (
      <Page>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Page>
    );
  }

  if (error && videos.length === 0) {
    return (
      <Page>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600">{error}</h2>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <h1 className="text-3xl font-bold mb-8">Video Library</h1>

      {videos.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">No videos found</h2>
          <p className="mt-2 text-gray-600">Be the first to upload a video!</p>
          <Link to="/upload" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Upload Video
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
              <Link
                key={video.video_id}
                to={`/video/${video.video_id}`}
                className="video-card transition-transform hover:scale-105"
              >
                <div className="relative w-full rounded-lg overflow-hidden">
                  <div className="aspect-video">
                    <img
                      src={getThumbnailUrl(video.file_key)}
                      alt={`${video.title} thumbnail`}
                      className="w-full h-full object-cover rounded-lg shadow-md"
                    />
                  </div>
                  <div className="absolute bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent w-full">
                    <h3 className="text-white font-semibold text-lg">{video.title}</h3>
                    <p className="text-gray-200 text-sm line-clamp-2">{video.description}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{video.tags.join(', ')}</p>
                </div>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8 mb-4">
              <button
                onClick={loadMoreVideos}
                disabled={isLoading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Load More Videos'}
              </button>
            </div>
          )}
        </>
      )}
    </Page>
  );
}
