import { AcBackgroundJob } from "./models/acBackgroundJob";
const ffmpegStatic = require("ffmpeg-static");
const ffprobeStatic = require("ffprobe-static");
const ffmpeg = require("fluent-ffmpeg");

ffmpeg.setFfmpegPath(ffmpegStatic.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const encodeVideo = async (
  videoInFilename: string,
  videoOutFilename: string,
  thumbnailOutFolder: string,
  jobData: JobDataAttributes,
  acBackgroundJob: AcBackgroundJob
) => {
  return await new Promise(async (resolve, reject) => {
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
        .input(videoInFilename)
        .videoBitrate(2400)
        .videoCodec("h264")
        .size(`${width}x${height}`)
        .audioCodec("AAC")
        .audioBitrate(160)
        .audioFrequency(44100)
        .withOutputOptions('-force_key_frames "expr:gte(t,n_forced*2)"')
        .outputOption(
          "-x265-params keyint=48:min-keyint=48:scenecut=0:ref=5:bframes=3:b-adapt=2"
        )
        .takeScreenshots(
          { count: 1, timemarks: ["00:00:01.000"], size: "200x200" },
          thumbnailOutFolder
        )
        .on("progress", async (info: any) => {
          acBackgroundJob.progress = info.percent / 2;
          await acBackgroundJob.save();
        })
        .on("end", () => {
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
  }) as number;
};

const createScreenshots = async (
  filename: string,
  outFolder: string,
  jobData: JobDataAttributes,
  duration: number
) => {
  return await new Promise(async (resolve, reject) => {
    try {
      let screenshotConfig = {
        filename: jobData.thumbnailPattern.replace("{count}", "%0000i"),
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