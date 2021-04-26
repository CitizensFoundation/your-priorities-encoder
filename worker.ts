import { Job } from "bull";
import { models } from "./models";
import { AcBackgroundJob } from "./models/acBackgroundJob";

const fs = require("fs");
const _ = require("lodash");
const Queue = require("bull");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const videoQueue = new Queue("video transcoding", redisUrl);
const audioQueue = new Queue("audio transcoding", redisUrl);

const uploadAllToS3 = require('./s3').uploadAllToS3;
const uploadToS3 = require('./s3').uploadToS3;
const downloadFromS3 = require('./s3').downloadFromS3;

const encodeVideo = require('./video').encodeVideo;
const createScreenshots = require('./video').createScreenshots;
const encodeAudio = require('./audio').encodeAudio;

videoQueue.process(async (job: Job, done: Function) => {
  let acBackgroundJob: AcBackgroundJob | null = null;

  console.log(`Got job ${job.id}`)

  try {
    const jobData = job.data as JobDataAttributes;
    acBackgroundJob = await AcBackgroundJob.findOne({
      where: {
        id: jobData.acBackgroundJobId,
      },
    });

    if (acBackgroundJob) {
      const tempInDir = `/tmp/${acBackgroundJob.id}/in`;
      const tempOutVideoDir = `/tmp/${acBackgroundJob.id}/outVideo`;
      const tempOutVThumbnailDir = `/tmp/${acBackgroundJob.id}/outThumbnails`;
      await fs.promises.mkdir(tempInDir, { recursive: true });
      await fs.promises.mkdir(tempOutVideoDir, { recursive: true });
      await fs.promises.mkdir(tempOutVThumbnailDir, { recursive: true });
      const videoInFilename = `${tempInDir}/${jobData.fileKey}`;
      const videoOutFilename = `${tempInDir}/${jobData.fileKey}`;

      console.log(`Video Download from S3`)

      await downloadFromS3(
        process.env.S3_VIDEO_UPLOAD_BUCKET!,
        jobData.fileKey,
        videoInFilename
      );

      console.log(`Video Encoding`)

      const videoDuration = await encodeVideo(
        videoInFilename,
        videoOutFilename,
        jobData,
        acBackgroundJob
      );

      console.log(`Video duration: ${videoDuration}`);

      console.log(`Video Upload to S3`)

      await uploadToS3(
        process.env.S3_VIDEO_PUBLIC_BUCKET!,
        jobData.fileKey,
        videoOutFilename
      );

      await createScreenshots(
        videoOutFilename,
        tempOutVThumbnailDir,
        jobData,
        videoDuration as number
      );

      await uploadAllToS3(
        tempOutVThumbnailDir,
        process.env.S3_VIDEO_THUMBNAIL_BUCKET!
      );

      acBackgroundJob.progress = 100;
      acBackgroundJob.data.finalDuration = videoDuration;
      acBackgroundJob.data.status = "Complete";
      await acBackgroundJob.save();
      console.log(`Video Job ${job.id} Completed`)
      done();
    } else {
      console.error("Can't find acBackgroundJob");
      done("Can't find acBackgroundJob");
    }
  } catch (error) {
    if (acBackgroundJob) {
      try {
        acBackgroundJob.progress = 0;
        acBackgroundJob.data.status = "Error";
        await acBackgroundJob.save();
      } catch (innerError) {
        console.error(innerError);
        done(error);
      }
    }
    console.error(error);
    done(error);
  }
});

audioQueue.process(async (job: Job, done: Function) => {
  let acBackgroundJob: AcBackgroundJob | null = null;

  console.log(`Got job ${job.id}`)

  try {
    const jobData = job.data as JobDataAttributes;
    acBackgroundJob = await AcBackgroundJob.findOne({
      where: {
        id: jobData.acBackgroundJobId,
      },
    });

    if (acBackgroundJob) {
      const tempInDir = `/tmp/${acBackgroundJob.id}/in`;
      const tempOutAudioDir = `/tmp/${acBackgroundJob.id}/outAudio`;
      await fs.promises.mkdir(tempInDir, { recursive: true });
      await fs.promises.mkdir(tempOutAudioDir, { recursive: true });
      const audioInFilename = `${tempInDir}/${jobData.fileKey}`;
      const audioOutFilename = `${tempInDir}/${jobData.fileKey}`;

      console.log(`Audio Download from S3`)

      await downloadFromS3(
        process.env.S3_AUDIO_UPLOAD_BUCKET!,
        jobData.fileKey,
        audioInFilename
      );

      console.log(`Audio Encoding`)

      const audioDuration = await encodeAudio(
        audioInFilename,
        audioOutFilename,
        jobData,
        acBackgroundJob
      );

      console.log(`Audio duration: ${audioDuration}`);

      console.log(`Audio Upload to S3`)

      await uploadToS3(
        process.env.S3_AUDIO_PUBLIC_BUCKET!,
        jobData.fileKey,
        audioOutFilename
      );

      acBackgroundJob.progress = 100;
      acBackgroundJob.data.finalDuration = audioDuration;
      acBackgroundJob.data.status = "Complete";
      await acBackgroundJob.save();

      console.log(`Audio Job ${job.id} Completed`)

      done();
    } else {
      console.error("Can't find acBackgroundJob");
      done("Can't find acBackgroundJob");
    }
  } catch (error) {
    if (acBackgroundJob) {
      try {
        acBackgroundJob.progress = 0;
        acBackgroundJob.data.status = "Error";
        await acBackgroundJob.save();
      } catch (innerError) {
        console.error(innerError);
        done(error);
      }
    }
    console.error(error);
    done(error);
  }
});
