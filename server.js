const express = require('express');
const cors = require('cors');
const ytDlp = require('yt-dlp-exec');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Function to extract YouTube video ID
function extractVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// API endpoint - 100% Working Direct URL
app.get('/api/video', async (req, res) => {
  try {
    const { url } = req.query;

    console.log('Received request for URL:', url);

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'YouTube URL is required'
      });
    }

    const videoId = extractVideoId(url);
    
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid YouTube URL'
      });
    }

    console.log('Extracted video ID:', videoId);

    // Get video info using yt-dlp-exec
    const result = await ytDlp(url, {
      dumpJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      format: 'best[ext=mp4]/best[ext=webm]/best',
      youtubeSkipDashManifest: true,
    });

    console.log('Video title:', result.title);
    console.log('Direct URL available:', !!result.url);

    if (!result.url) {
      return res.status(404).json({
        success: false,
        error: 'Could not extract direct video URL'
      });
    }

    // Return the response in exact format you want
    res.json({
      success: true,
      title: result.title,
      directUrl: result.url,
      videoId: videoId,
      duration: result.duration,
      thumbnail: result.thumbnail,
      description: result.description
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch video: ' + error.message
    });
  }
});

// Alternative endpoint with multiple quality options
app.get('/api/video/quality', async (req, res) => {
  try {
    const { url, quality = '720p' } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'YouTube URL is required'
      });
    }

    const videoId = extractVideoId(url);
    
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid YouTube URL'
      });
    }

    let format;
    switch (quality) {
      case '144p': format = 'worst[height<=144]'; break;
      case '240p': format = 'best[height<=240]'; break;
      case '360p': format = 'best[height<=360]'; break;
      case '480p': format = 'best[height<=480]'; break;
      case '720p': format = 'best[height<=720]'; break;
      case '1080p': format = 'best[height<=1080]'; break;
      default: format = 'best[height<=720]';
    }

    const result = await ytDlp(url, {
      dumpJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      format: format,
    });

    res.json({
      success: true,
      title: result.title,
      directUrl: result.url,
      videoId: videoId,
      quality: quality,
      duration: result.duration
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch video'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`🎬 Video API: http://localhost:${PORT}/api/video?url=YOUTUBE_URL`);
});