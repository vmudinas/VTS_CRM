import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { FaThumbsUp, FaThumbsDown, FaFlag } from 'react-icons/fa'; // Assuming react-icons is available or can be added

// Explicitly cast icons to React.ElementType to satisfy TypeScript during build
const FaThumbsUpIcon = FaThumbsUp as React.ElementType;
const FaThumbsDownIcon = FaThumbsDown as React.ElementType;
const FaFlagIcon = FaFlag as React.ElementType;

interface Video {
  id: number;
  title: string;
  description: string;
  category: string;
  videoPath: string;
  thumbnailPath: string;
  uploadedAt: string;
}

enum ReactionType {
    Like = 0,
    Dislike = 1
}

interface VideoReaction {
    id: number;
    userId: number;
    videoId: number;
    type: ReactionType;
    createdAt: string;
}


// Helper function to get user info (placeholder for actual auth)
const getUserInfo = (): { id: number | null; name: string } => {
  // In a real app, this would check for an authenticated user
  // For now, if a placeholder ID exists, we'll treat them as a "User", otherwise "Guest"
  let userId = localStorage.getItem('placeholderUserId');
  if (userId) {
     return { id: parseInt(userId, 10), name: `User_${userId}` };
  }
  return { id: null, name: 'Guest User' };
};

const VideoPage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]); // Fix syntax error here
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'title' | 'uploadedAt'>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null); // State for user's reaction

  const videoRef = useRef<HTMLVideoElement>(null);
  const currentUser = useMemo(() => getUserInfo(), []); // Get user info once

  // Effect to fetch videos on component mount
  useEffect(() => {
    fetch('/api/videos')
      .then(res => res.json())
      .then(setVideos)
      .catch(error => console.error('Error fetching videos:', error));
  }, []);

  // Function to save playback position to the backend
  const savePlaybackPosition = useCallback(async (videoId: number, position: number) => {
    if (!videoId || currentUser.id === null) return; // Don't save if no video or no logged-in user

    try {
      // In a real app, you'd include the user's auth token in headers
      const response = await fetch('/api/PlaybackHistory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${yourAuthToken}` // Add auth token here
        },
        body: JSON.stringify({
          videoId: videoId,
          positionSeconds: position,
          userId: currentUser.id // Use actual user ID
        }),
      });

      if (!response.ok) {
        console.error('Failed to save playback position:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error saving playback position:', error);
    }
  }, [currentUser.id]); // Include currentUser.id in dependencies

  // Effect to handle saving playback position on video events
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !selectedVideo) return;

    const handleTimeUpdate = () => {
      // Save position periodically (e.g., every 5 seconds)
      if (videoElement.currentTime > 0 && videoElement.currentTime % 5 < 0.1) { // Simple throttling, only save if time > 0
         savePlaybackPosition(selectedVideo.id, videoElement.currentTime);
      }
    };

    const handlePause = () => {
      if (videoElement.currentTime > 0) { // Only save if video has been played
         savePlaybackPosition(selectedVideo.id, videoElement.currentTime);
      }
    };

    const handleEnded = () => {
      savePlaybackPosition(selectedVideo.id, 0); // Save 0 on end
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);

    // Cleanup event listeners
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [selectedVideo, savePlaybackPosition]); // Re-attach listeners when selectedVideo changes


  // Function to handle saving video reaction
  const handleReaction = useCallback(async (type: ReactionType) => {
    if (!selectedVideo || currentUser.id === null) {
        alert('Please log in to react to videos.');
        return;
    }

    try {
      // In a real app, you'd include the user's auth token in headers
      const response = await fetch('/api/VideoReactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${yourAuthToken}` // Add auth token here
        },
        body: JSON.stringify({
          videoId: selectedVideo.id,
          type: type,
          userId: currentUser.id // Use actual user ID
        }),
      });

      if (response.ok) {
        // Update local state based on the reaction
        if (userReaction === type) {
          // User un-reacted
          setUserReaction(null);
        } else {
          // User reacted or changed reaction
          setUserReaction(type);
        }
        // alert('Reaction saved!'); // Or provide more subtle feedback
      } else {
         const errorText = await response.text();
         console.error('Failed to save reaction:', response.status, response.statusText, errorText);
         alert('Failed to save reaction.');
      }
    } catch (error) {
      console.error('Error saving reaction:', error);
      alert('Error saving reaction.');
    }
  }, [selectedVideo, userReaction, currentUser.id]); // Include dependencies


  // Group and filter/sort videos
  const categorizedVideos = useMemo(() => {
    const categories: { [key: string]: Video[] } = {};
    const filteredVideos = videos.filter(video =>
      filterCategory === '' || video.category === filterCategory
    );

    filteredVideos.forEach(video => {
      const category = video.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(video);
    });

    // Sort videos within each category
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => {
        if (sortBy === 'title') {
          return sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
        } else { // sortBy === 'uploadedAt'
          const dateA = new Date(a.uploadedAt).getTime();
          const dateB = new Date(b.uploadedAt).getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA; // Fix getTime() call
        }
      });
    });

    return categories;
  }, [videos, sortBy, sortOrder, filterCategory]);

  // Get unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const categories = videos.map(video => video.category || 'Uncategorized');
    return ['', ...Array.from(new Set(categories))]; // Add empty string for "All Categories"
  }, [videos]);


  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Handle video selection and playback
  const handleVideoSelect = useCallback(async (video: Video) => {
    setSelectedVideo(video);
    setUserReaction(null); // Reset reaction state for the new video

    if (videoRef.current) {
      videoRef.current.src = video.videoPath;
      videoRef.current.load(); // Load the video metadata

      let savedPosition = 0;
      if (currentUser.id !== null) { // Only fetch history if user is logged in
          // Fetch playback history for this video and user
          try {
             // In a real app, you'd include the user's auth token in headers
            const historyResponse = await fetch(`/api/PlaybackHistory/${video.id}`, {
               headers: {
                // 'Authorization': `Bearer ${yourAuthToken}` // Add auth token here
               }
            });

            if (historyResponse.ok) {
              const history = await historyResponse.json();
              if (history && history.positionSeconds > 0) {
                savedPosition = history.positionSeconds;
              }
            } else if (historyResponse.status !== 404) {
              console.error('Failed to fetch playback history:', historyResponse.status, historyResponse.statusText);
            }
          } catch (error) {
            console.error('Error fetching playback history:', error);
          }

          // Fetch user's reaction for this video
          try {
              const reactionResponse = await fetch(`/api/VideoReactions/${video.id}`, {
                  headers: {
                      // 'Authorization': `Bearer ${yourAuthToken}` // Add auth token here
                  }
              });

              if (reactionResponse.ok) {
                  const reaction = await reactionResponse.json();
                  setUserReaction(reaction.type); // Set the user's reaction
              } else if (reactionResponse.status === 204) {
                  setUserReaction(null); // No reaction found
              } else {
                  console.error('Failed to fetch user reaction:', reactionResponse.status, reactionResponse.statusText);
              }
          } catch (error) {
              console.error('Error fetching user reaction:', error);
          }
      }


      // Seek to saved position after metadata is loaded, then play
      videoRef.current.onloadedmetadata = () => {
         if (videoRef.current) {
           videoRef.current.currentTime = savedPosition;
           videoRef.current.play();
         }
      };
       // If metadata is already loaded (e.g., if selecting the same video again quickly)
      if (videoRef.current.readyState >= 1) {
           videoRef.current.currentTime = savedPosition;
           videoRef.current.play();
      }
    }
  }, [currentUser.id]); // Include currentUser.id in dependencies


  // Handle reporting a video
  const handleReportVideo = useCallback(async () => {
    if (!selectedVideo) {
      alert('Please select a video to report.');
      return;
    }

    const reportDetails = prompt('Please provide details for the report:');
    if (!reportDetails) return; // User cancelled or entered empty details

    try {
      // Use current user info for name/email, default to Guest if not logged in
      const userName = currentUser.name;
      const userEmail = currentUser.id !== null ? `user${currentUser.id}@example.com` : 'guest@example.com'; // Placeholder email

      const response = await fetch('/api/Messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          subject: `Video Report: ${selectedVideo.title} (ID: ${selectedVideo.id})`,
          message: reportDetails,
        }),
      });

      if (response.ok) {
        alert('Video reported successfully. Thank you for your feedback.');
      } else {
        const errorText = await response.text();
        console.error('Failed to send report:', response.status, response.statusText, errorText);
        alert('Failed to send report.');
      }
    } catch (error) {
      console.error('Error sending report:', error);
      alert('Error sending report.');
    }
  }, [selectedVideo, currentUser]); // Include dependencies


  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Videos</h1>

        {/* Video Player */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">{selectedVideo ? selectedVideo.title : 'Select a video'}</h2>
            <video
              ref={videoRef}
              controls
              className="w-full rounded-lg bg-black"
              poster={selectedVideo ? selectedVideo.thumbnailPath : ''}
              style={{ maxHeight: '60vh' }}
            />
            {selectedVideo && (
              <>
                <div className="mt-2 text-gray-700">{selectedVideo.description}</div>
                <div className="text-xs text-gray-500 mt-1">Category: {selectedVideo.category}</div>
                <div className="text-xs text-gray-400">Uploaded: {new Date(selectedVideo.uploadedAt).toLocaleDateString()}</div>

                {/* Reaction and Report Buttons */}
                <div className="mt-4 flex items-center space-x-4">
                  <button
                    onClick={() => handleReaction(ReactionType.Like)}
                    className={`p-2 rounded-full ${userReaction === ReactionType.Like ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                    title="Like"
                    disabled={currentUser.id === null} // Disable if not logged in
                  >
                    <FaThumbsUpIcon />
                  </button>
                   <button
                    onClick={() => handleReaction(ReactionType.Dislike)}
                    className={`p-2 rounded-full ${userReaction === ReactionType.Dislike ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                    title="Dislike"
                    disabled={currentUser.id === null} // Disable if not logged in
                  >
                    <FaThumbsDownIcon />
                  </button>
                   <button
                    onClick={handleReportVideo}
                    className="p-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600"
                    title="Report"
                    disabled={currentUser.id === null} // Disable if not logged in
                  >
                    <FaFlagIcon />
                  </button>
                   {currentUser.id === null && (
                       <span className="text-sm text-gray-600">Log in to like, dislike, or report.</span>
                   )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Controls: Sort and Filter */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <label htmlFor="filterCategory" className="mr-2 text-gray-700">Filter by Category:</label>
            <select
              id="filterCategory"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border rounded p-1"
            >
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat === '' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sortBy" className="mr-2 text-gray-700">Sort by:</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'title' | 'uploadedAt')}
              className="border rounded p-1 mr-2"
            >
              <option value="uploadedAt">Upload Date</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1 px-2 rounded"
            >
              {sortOrder === 'asc' ? 'ASC' : 'DESC'}
            </button>
          </div>
        </div>


        {/* Video Categories */}
        <div>
          {Object.entries(categorizedVideos).map(([category, videoList]) => (
            <div key={category} className="mb-4 bg-white rounded-xl shadow">
              <div
                className="flex justify-between items-center p-4 cursor-pointer bg-gray-200 rounded-t-xl"
                onClick={() => toggleCategory(category)}
              >
                <h3 className="text-lg font-semibold text-gray-800">{category} ({videoList.length})</h3>
                <span>{expandedCategories.includes(category) ? '▲' : '▼'}</span>
              </div>
              {expandedCategories.includes(category) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
                  {videoList.map(video => (
                    <div
                      key={video.id}
                      className="bg-gray-100 rounded-lg shadow hover:shadow-md transition cursor-pointer flex flex-col"
                      onClick={() => handleVideoSelect(video)}
                    >
                       <img
                        src={video.thumbnailPath}
                        alt={video.title}
                        className="w-full h-32 object-cover rounded-t-lg"
                      />
                      <div className="p-3 flex-1 flex col">
                        <div className="font-semibold text-md text-gray-900 truncate">{video.title}</div>
                        <div className="text-xs text-gray-700 flex-1 line-clamp-2">{video.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
