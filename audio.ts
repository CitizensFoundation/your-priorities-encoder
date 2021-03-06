import { AcBackgroundJob } from "./models/acBackgroundJob";
const ffmpegStatic = require("ffmpeg-static");
const ffprobeStatic = require("ffprobe-static");
const ffmpeg = require("fluent-ffmpeg");

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

export const encodeAudio = async (
  audioInFilename: string,
  audioOutFilename: string,
  jobData: JobDataAttributes,
  acBackgroundJob: AcBackgroundJob
) => {
  return (await new Promise(async (resolve, reject) => {
    try {

      ffmpeg()
        .setFfmpegPath(ffmpegStatic)
        .setFfprobePath(ffprobeStatic.path)
        .input(audioInFilename)
        .audioCodec("aac")
        .audioBitrate(160)
        .audioFrequency(44100)
        .on("progress", async (info: any) => {
          //acBackgroundJob.progress = info.percent / 2;
          //await acBackgroundJob.save();
        })
        .on("end", () => {
          ffmpeg.ffprobe(audioOutFilename, (err: string, metadata: any) => {
            if (err) {
              reject(err);
            } else {
              resolve(metadata.format.duration as number);
            }
          });
        })
        .on("error", (err: any, stdout: string, stderr: string) => {
          console.error(`Error: ${err.message}`);
          console.error(`ffmpeg output: ${stdout}`);
          console.error(`ffmpeg stderr: ${stderr}`);
          reject(err);
        })
        .save(audioOutFilename);
    } catch (error) {
      reject(error);
    }
  })) as number;
};

export const encodeFlac = async (
  videoInFilename: string,
  audioOutFilename: string
) => {
  return (await new Promise(async (resolve, reject) => {
    try {

      ffmpeg()
        .setFfmpegPath(ffmpegStatic)
        .setFfprobePath(ffprobeStatic.path)
        .input(videoInFilename)
        .audioCodec("flac")
        .on("progress", async (info: any) => {
          //acBackgroundJob.progress = info.percent / 2;
          //await acBackgroundJob.save();
        })
        .on("end", () => {
          resolve(1);
        })
        .on("error", (err: any, stdout: string, stderr: string) => {
          console.error(`Error: ${err.message}`);
          console.error(`ffmpeg output: ${stdout}`);
          console.error(`ffmpeg stderr: ${stderr}`);
          resolve(0);
        })
        .save(audioOutFilename);
    } catch (error) {
      console.error(error);
      resolve(0);
    }
  })) as number;
};


module.exports = {
  encodeAudio,
  encodeFlac
};
