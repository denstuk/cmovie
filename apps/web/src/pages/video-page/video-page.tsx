import { useState, useEffect, useRef } from "react";
import type { FC } from "react";
import { useParams } from "react-router";
import { Page } from "../page";
import { config } from "../../config";
import { videoGeneratePresignedUrl } from "../../api/api";

interface VideoData {
  video_id: string;
  title: string;
  description: string;
  file_key: string;
  upload_date: string;
  tags: string[];
  regions_blacklist: string[];
}

interface Comment {
  id: string;
  text: string;
  author: string;
  date: string;
}

export const VideoPage: FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  console.log(videoId)
  const videoRef = useRef<HTMLVideoElement>(null);
  const VIDEO_PROGRESS_KEY = `video-progress-${videoId}`;

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState<string>('');
  const [comments, setComments] = useState<Comment[]>([
    {id: '1', text: 'Great video! Love the content.', author: 'User1', date: '2 days ago'},
    {id: '2', text: 'Very informative!', author: 'User2', date: '1 day ago'},
  ]);
  const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideoData = async () => {
      if (!videoId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`${config.apiUrl}/videos/${videoId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Video not found');
          }
          throw new Error('Failed to fetch video data');
        }

        const data = await response.json();
        setVideoData(data.video);

        const videoUrl = getVideoUrl(data.video.file_key);
        const signedUrl = await videoGeneratePresignedUrl('1', videoUrl);
        console.log(`Signed URL: ${signedUrl}`);
        setSignedVideoUrl(signedUrl)

      } catch (err) {
        console.error("Error fetching video data:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');

        // Fallback data for testing when API is not available
        if (videoId === '1') {
          setVideoData({
            video_id: '1',
            title: 'Big Buck Bunny',
            description: 'A short animated film featuring a giant rabbit',
            file_key: 'sample/bunny.mp4',
            upload_date: '2023-01-01T00:00:00.000Z',
            tags: ['animation', 'comedy'],
            regions_blacklist: []
          });
          setError(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Load saved progress
    const savedTime = localStorage.getItem(VIDEO_PROGRESS_KEY);
    if (savedTime) {
      video.currentTime = parseFloat(savedTime);
    }

    // Save progress periodically
    const handleTimeUpdate = () => {
      localStorage.setItem(VIDEO_PROGRESS_KEY, video.currentTime.toString());
    };

    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [VIDEO_PROGRESS_KEY, videoData]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      text: comment,
      author: 'You',
      date: 'Just now'
    };

    setComments([newComment, ...comments]);
    setComment('');
  };

  // Get the video URL from the file_key
  const getVideoUrl = (fileKey: string) => {
    // For testing fallback
    if (fileKey.startsWith('sample/')) {
      return "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    }
    console.log(`https://${config.cloudfrontDomain}/${fileKey}`)

    // Real CloudFront URL
    return `https://${config.cloudfrontDomain}/${fileKey}`;
  };

  if (isLoading) {
    return (
      <Page>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Page>
    );
  }

  if (error || !videoData || !signedVideoUrl) {
    return (
      <Page>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600">{error || 'Video not found'}</h2>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Home
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="max-w-full">
        <h1 className="text-4xl font-bold text-gray-800">{videoData.title}</h1>
        <p className="mt-4 text-lg text-gray-600">{videoData.tags.join(', ')}</p>

        {/* Video container with responsive width */}
        <div className="w-full mt-4">
          <video
            className="w-full h-auto"
            controls
            ref={videoRef}
          >
            <source src={signedVideoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Description */}
        <div className="mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Description</h2>
          <p className="text-gray-700">{videoData.description || 'No description provided.'}</p>
        </div>

        {/* Comments section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Comments</h2>

          {/* Add comment form */}
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <div className="flex">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-grow p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition"
              >
                Comment
              </button>
            </div>
          </form>

          {/* Comments list */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-gray-50 rounded-md">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                  <div className="ml-2">
                    <p className="font-medium text-gray-800">{comment.author}</p>
                    <p className="text-xs text-gray-500">{comment.date}</p>
                  </div>
                </div>
                <p className="text-gray-700">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}
