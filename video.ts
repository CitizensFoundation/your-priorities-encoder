import { AcBackgroundJob } from "./models/acBackgroundJob";
const ffmpegStatic = require("ffmpeg-static");
const ffprobeStatic = require("ffprobe-static");

const _ = require("lodash");

process.env.FFMPEG_PATH = ffmpegStatic;
process.env.FFPROBE_PATH = ffprobeStatic.path;

const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

console.log(`ffprope ${ffprobeStatic.path}`)

ffmpeg.getAvailableEncoders((err:any, encoders:any) => {
  //console.log('getAvailableEncoders', encoders);
});
console.log(`ffmpeg path ${ffmpegStatic}`)

export const encodeVideo = async (
  videoInFilename: string,
  videoOutFilename: string,
  jobData: JobDataAttributes,
  acBackgroundJob: AcBackgroundJob
) => {
  return (await new Promise(async (resolve, reject) => {
    try {
      let height, width;

      if (jobData.portrait) {
        height = 1280;
        width = 720;
      } else {
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
          "-g 48",
        //  "-keyint_min 48",
         // "-bf 3",
        //  "-b strategy 2",
       //   "-refs 5"
        )
        .on("progress", (info: any) => {
          console.log(`Video progress ${info}`)
          //acBackgroundJob.progress = info.percent / 2;
          //await acBackgroundJob.save();
        })
        .on("end", () => {
          console.log(`Video Encoding End ${videoOutFilename}`)
          ffmpeg.ffprobe(videoOutFilename, (err: string, metadata: any) => {
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
        .save(videoOutFilename);
    } catch (error) {
      reject(error);
    }
  })) as number;
};

export const createScreenshots = async (
  filename: string,
  outFolder: string,
  jobData: JobDataAttributes,
  duration: number
) => {
  return await new Promise(async (resolve, reject) => {
    try {
      let screenshotConfig = {
        filename: jobData.thumbnailPattern.replace("{count}", "%0000i")+".png",
        folder: outFolder,
        size: "864x486",
      };

      if (duration < 11) {
        screenshotConfig = _.merge(screenshotConfig, {
          timestamps: ["0%"],
        });
      } else {
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
        .on("error", (err: any, stdout: string, stderr: string) => {
          console.error(`Error: ${err.message}`);
          console.error(`ffmpeg output: ${stdout}`);
          console.error(`ffmpeg stderr: ${stderr}`);
          reject(err);
        });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  createScreenshots,
  encodeVideo
};
