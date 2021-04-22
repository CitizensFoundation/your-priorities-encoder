const Queue = require('bull');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegStatic.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const videoQueue = new Queue('video transcoding',redisUrl);
const audioQueue = new Queue('audio transcoding',redisUrl);

