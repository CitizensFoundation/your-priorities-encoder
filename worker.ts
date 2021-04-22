import { Job } from "bull";
import path from "path";

const Queue = require('bull');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegStatic.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const videoQueue = new Queue('video transcoding',redisUrl);
const audioQueue = new Queue('audio transcoding',redisUrl);

videoQueue.process((job: Job, done: Function) => {

  // job.data contains the custom data passed when the job was created
  // job.id contains id of this job.
  const encodingInstructions = job;
  const startTime = Date.now();
  const inputAsset = path.join(encodingInstructions.inputFolder, encodingInstructions.inputAsset);
  const outputAsset = path.join(encodingInstructions.outputFolder, encodingInstructions.outputAsset);
  console.debug(`input: ${inputAsset}`);
  console.debug(`output: ${outputAsset}`);

  const ffmpegCommand = ffmpeg()
  .input(inputAsset)
  .videoBitrate(encodingInstructions.videoBitrate)
  .videoCodec(encodingInstructions.videoEncoder)
  .size(encodingInstructions.videoSize)
  .audioCodec(encodingInstructions.audioEncoder)
  .audioBitrate(encodingInstructions.audioBitrate)
  .audioFrequency(encodingInstructions.audioFrequency)
  .withOutputOptions('-force_key_frames "expr:gte(t,n_forced*2)"')
  .outputOption('-x265-params keyint=48:min-keyint=48:scenecut=0:ref=5:bframes=3:b-adapt=2')
  .on('progress', (info) => {
    const message = {};
    message.type = constants.WORKER_MESSAGE_TYPES.PROGRESS;
    message.message = `Encoding: ${Math.round(info.percent)}%`;
    parentPort.postMessage(message);
  })
  .on('end', () => {
    const message = {};
    message.type = constants.WORKER_MESSAGE_TYPES.DONE;
    const endTime = Date.now();
    message.message = `Encoding finished after ${(endTime - startTime) / 1000} s`;
    parentPort.postMessage(message);
  })
  .on('error', (err, stdout, stderr) => {
    const message = {};
    message.type = constants.WORKER_MESSAGE_TYPES.ERROR;
    message.message = `An error occurred during encoding. ${err.message}`;
    parentPort.postMessage(message);

    console.error(`Error: ${err.message}`);
    console.error(`ffmpeg output: ${stdout}`);
    console.error(`ffmpeg stderr: ${stderr}`);
  })
  .save(outputAsset);

  // https://morioh.com/p/6b43e4ff07d0
  var proc = ffmpeg(sourceFilePath)
  .on('filenames', function(filenames) {
    console.log('screenshots are ' + filenames.join(', '));
  })
  .on('end', function() {
    console.log('screenshots were saved');
  })
  .on('error', function(err) {
    console.log('an error happened: ' + err.message);
  })
  // take 1 screenshots at predefined timemarks and size
  .takeScreenshots({ count: 1, timemarks: [ '00:00:01.000' ], size: '200x200' }, "Video/");

  // transcode video asynchronously and report progress
  job.progress(42);

  // call done when finished
  done();

  // or give a error if error
  done(new Error('error transcoding'));
});