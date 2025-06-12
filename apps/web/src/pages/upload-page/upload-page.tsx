import { useState } from "react";
import type { FC, ChangeEvent, FormEvent } from "react";
import { Page } from "../page";
import { config } from "../../config";

// List of countries for the blocklist selection
const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia",
  "Germany", "France", "Japan", "Brazil", "India", "China"
];

export const UploadPage: FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [blockedCountries, setBlockedCountries] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      // Set default title based on filename if title is empty
      if (!title) {
        const fileName = e.target.files[0].name;
        // Remove extension from filename
        const titleFromFile = fileName.split('.').slice(0, -1).join('.') || fileName;
        setTitle(titleFromFile);
      }
    }
  };

  const handleCountryChange = (country: string) => {
    setBlockedCountries(prev =>
      prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim() !== '') {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !title) {
      alert("Please select a file and provide a title");
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      // 1. Get a presigned URL from the backend
      const presignedUrlResponse = await fetch(`${config.apiUrl}/upload/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileType: selectedFile.type,
          fileName: selectedFile.name,
        }),
      });

      if (!presignedUrlResponse.ok) {
        throw new Error('Failed to get presigned URL');
      }

      const presignedData = await presignedUrlResponse.json();
      const { presignedUrl, videoId, fileKey } = presignedData;

      setUploadProgress(20);

      // 2. Upload the file directly to S3 using the presigned URL
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      setUploadProgress(80);

      // 3. Save video metadata
      const metadataResponse = await fetch(`${config.apiUrl}/videos/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          fileKey,
          title,
          description,
          tags,
          blockedCountries,
        }),
      });

      if (!metadataResponse.ok) {
        throw new Error('Failed to save video metadata');
      }

      // Reset the form after successful upload
      setSelectedFile(null);
      setTitle("");
      setDescription("");
      setBlockedCountries([]);
      setTags([]);
      setUploadProgress(100);

      alert("Video uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Upload Video</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Video File</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept="video/*"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">MP4, MOV, or WebM up to 2GB</p>
              </div>
            </div>
            {selectedFile && (
              <p className="text-sm text-green-600">Selected: {selectedFile.name}</p>
            )}
          </div>

          {/* Title Section */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <div className="mt-1">
              <input
                id="title"
                name="title"
                type="text"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter video title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <div className="mt-1">
              <textarea
                id="description"
                name="description"
                rows={4}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter video description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Country Blocklist Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Blocked Countries</label>
            <p className="text-xs text-gray-500">Select countries where this video should not be available</p>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COUNTRIES.map(country => (
                <div key={country} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`country-${country}`}
                    checked={blockedCountries.includes(country)}
                    onChange={() => handleCountryChange(country)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`country-${country}`} className="ml-2 text-sm text-gray-700">
                    {country}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Tags Input Section */}
          <div className="space-y-2">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags</label>
            <div className="mt-1">
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 -mr-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none focus:bg-indigo-500 focus:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                id="tags"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Add tags (press Enter to add)"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>
            <p className="text-xs text-gray-500">Press Enter to add a tag</p>
          </div>

          {/* Upload Progress Bar - only shown during upload */}
          {isSubmitting && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Upload Progress</label>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-right">{uploadProgress}%</p>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 ${
                isSubmitting || !selectedFile
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isSubmitting ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>
        </form>
      </div>
    </Page>
  );
}
