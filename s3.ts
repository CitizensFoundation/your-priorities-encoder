const fs = require("fs");
const aws = require("aws-sdk");
const _ = require("lodash");

const endPoint = process.env.S3_ENDPOINT || "s3.amazonaws.com";

const s3 = new aws.S3({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  endpoint: endPoint,
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE ? true : false,
  region:
    process.env.S3_REGION ||
    (process.env.S3_ENDPOINT || process.env.S3_ACCELERATED_ENDPOINT
      ? null
      : "us-east-1"),
});

const uploadToS3 = async (
  bucket: string,
  keyName: string,
  filename: string
) => {
  return await new Promise(async (resolve, reject) => {
    fs.readFile(filename, async (error: string, data: any) => {
      try {
        if (error) {
          reject(error);
        } else {
          const results = await s3
            .upload({
              Bucket: bucket,
              Key: keyName,
              Body: data,
              ACL: "public-read",
            })
            .promise();
          resolve(results);
        }
      } catch (error) {
        reject(error);
      }
    });
  });
};

const downloadFromS3 = async (
  bucket: string,
  keyName: string,
  saveLocation: string
) => {
  return await new Promise(async (resolve, reject) => {
    try {
      const params = {
        Bucket: bucket,
        Key: keyName,
      };
      console.log(`DL1 ${params}`);
      const { Body } = await s3.getObject(params).promise();
      fs.writeFile(saveLocation, Body, (completed: any) => {
        console.log(`Saved: ${completed}`);
        resolve(true);
      });
    } catch (error) {
      reject(error);
    }
  });
};

const uploadAllToS3 = async (folderName: string, bucket: string) => {
  return await new Promise(async (resolve, reject) => {
    try {
      fs.readdir(folderName, async (err: string, files: Array<string>) => {
        if (err) {
          reject(err);
        } else {
          for (let i = 0; i < files.length; i++) {
            await uploadToS3(bucket, files[i], `${folderName}/${files[i]}`);
          }
          resolve(true);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  uploadAllToS3,
  downloadFromS3,
  uploadToS3,
  s3,
};
