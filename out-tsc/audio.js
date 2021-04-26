"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeAudio = void 0;
const ffmpegStatic = require("ffmpeg-static");
const ffprobeStatic = require("ffprobe-static");
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);
const encodeAudio = async (audioInFilename, audioOutFilename, jobData, acBackgroundJob) => {
    return (await new Promise(async (resolve, reject) => {
        try {
            ffmpeg()
                .setFfmpegPath(ffmpegStatic)
                .setFfprobePath(ffprobeStatic.path)
                .input(audioInFilename)
                .audioCodec("h264")
                .audioCodec("aac")
                .audioBitrate(160)
                .audioFrequency(44100)
                .on("progress", async (info) => {
                acBackgroundJob.progress = info.percent / 2;
                await acBackgroundJob.save();
            })
                .on("end", () => {
                ffmpeg.ffprobe(audioOutFilename, (err, metadata) => {
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
                .save(audioOutFilename);
        }
        catch (error) {
            reject(error);
        }
    }));
};
exports.encodeAudio = encodeAudio;
module.exports = {
    encodeAudio: exports.encodeAudio
};
