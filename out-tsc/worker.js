"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("./models");
const fs = require("fs");
const _ = require("lodash");
const Queue = require("bull");
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const videoQueue = new Queue("video transcoding", redisUrl);
const audioQueue = new Queue("audio transcoding", redisUrl);
const uploadAllToS3 = require('s3').uploadAllToS3;
const uploadToS3 = require('s3').uploadToS3;
const downloadFromS3 = require('s3').downloadFromS3;
const encodeVideo = require('video').encodeVideo;
const createScreenshots = require('video').createScreenshots;
videoQueue.process(async (job, done) => {
    let acBackgroundJob = null;
    try {
        const jobData = job.data;
        acBackgroundJob = await models_1.models.AcBackgroundJob.findOne({
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
            await downloadFromS3(process.env.S3_VIDEO_UPLOAD_BUCKET, jobData.fileKey, videoInFilename);
            const videoDuration = await encodeVideo(videoInFilename, videoOutFilename, tempOutVThumbnailDir, jobData, acBackgroundJob);
            await uploadToS3(process.env.S3_VIDEO_PUBLIC_BUCKET, jobData.fileKey, videoOutFilename);
            await createScreenshots(videoOutFilename, tempOutVThumbnailDir, jobData, videoDuration);
            await uploadAllToS3(tempOutVThumbnailDir, process.env.S3_VIDEO_THUMBNAIL_BUCKET);
            acBackgroundJob.progress = 100;
            acBackgroundJob.data.finalDuration = videoDuration;
            acBackgroundJob.data.status = "Complete";
        }
        else {
            console.error("Can't find acBackgroundJob");
            done("Can't find acBackgroundJob");
        }
    }
    catch (error) {
        if (acBackgroundJob) {
            try {
                acBackgroundJob.progress = 0;
                acBackgroundJob.data.status = "Error";
                await acBackgroundJob.save();
            }
            catch (innerError) {
                console.error(innerError);
                done(error);
            }
        }
        console.error(error);
        done(error);
    }
});
