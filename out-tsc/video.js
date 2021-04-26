"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScreenshots = exports.encodeVideo = void 0;
const ffmpegStatic = require("ffmpeg-static");
const ffprobeStatic = require("ffprobe-static");
const _ = require("lodash");
process.env.FFMPEG_PATH = ffmpegStatic;
process.env.FFPROBE_PATH = ffprobeStatic.path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);
console.log(`ffprope ${ffprobeStatic.path}`);
ffmpeg.getAvailableEncoders((err, encoders) => {
    //console.log('getAvailableEncoders', encoders);
});
console.log(`ffmpeg path ${ffmpegStatic}`);
const encodeVideo = async (videoInFilename, videoOutFilename, jobData, acBackgroundJob) => {
    return (await new Promise(async (resolve, reject) => {
        try {
            let height, width;
            if (jobData.portrait) {
                height = 1280;
                width = 720;
            }
            else {
                width = 1280;
                height = 720;
            }
            ffmpeg()
                .setFfmpegPath(ffmpegStatic)
                .setFfprobePath(ffprobeStatic.path)
                .input(videoInFilename)
                .videoBitrate(2400)
                .videoCodec("libx264")
                .size(`${width}x${height}`)
                .audioCodec("aac")
                .audioBitrate(160)
                .audioFrequency(44100)
                .outputOption(
            //          '-crf 23',
            //         '-force_key_frames "expr:gte(t,n_forced*2)"',
            //      '-profile:v baseline',
            "-g 48")
                .on("progress", (info) => {
                console.log(`Video progress ${info}`);
                //acBackgroundJob.progress = info.percent / 2;
                //await acBackgroundJob.save();
            })
                .on("end", () => {
                console.log(`Video Encoding End ${videoOutFilename}`);
                ffmpeg.ffprobe(videoOutFilename, (err, metadata) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(metadata.format.duration);
                    }
                });
            })
                .on("error", (err, stdout, stderr) => {
                console.error(`Error: ${err.message}`);
                console.error(`ffmpeg output: ${stdout}`);
                console.error(`ffmpeg stderr: ${stderr}`);
                reject(err);
            })
                .save(videoOutFilename);
        }
        catch (error) {
            reject(error);
        }
    }));
};
exports.encodeVideo = encodeVideo;
const createScreenshots = async (filename, outFolder, jobData, duration) => {
    return await new Promise(async (resolve, reject) => {
        try {
            let screenshotConfig = {
                filename: jobData.thumbnailPattern.replace("{count}", "%0000i") + ".png",
                folder: outFolder,
                size: "864x486",
            };
            if (duration < 11) {
                screenshotConfig = _.merge(screenshotConfig, {
                    timestamps: ["0%"],
                });
            }
            else {
                screenshotConfig = _.merge(screenshotConfig, {
                    count: duration / 10,
                });
            }
            ffmpeg(filename)
                .setFfmpegPath(ffmpegStatic)
                .setFfprobePath(ffprobeStatic.path)
                .screenshots(screenshotConfig)
                .on("end", () => {
                resolve(true);
            })
                .on("error", (err, stdout, stderr) => {
                console.error(`Error: ${err.message}`);
                console.error(`ffmpeg output: ${stdout}`);
                console.error(`ffmpeg stderr: ${stderr}`);
                reject(err);
            });
        }
        catch (error) {
            reject(error);
        }
    });
};
exports.createScreenshots = createScreenshots;
module.exports = {
    createScreenshots: exports.createScreenshots,
    encodeVideo: exports.encodeVideo
};
