"use strict";
const fs = require("fs");
const aws = require("aws-sdk");
const _ = require("lodash");
const endPoint = process.env.S3_ENDPOINT || "s3.amazonaws.com";
const s3 = new aws.S3({
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    endpoint: endPoint,
    region: process.env.S3_REGION ||
        (process.env.S3_ENDPOINT || process.env.S3_ACCELERATED_ENDPOINT
            ? null
            : "us-east-1"),
});
const uploadToS3 = async (bucket, keyName, filename) => {
    return await new Promise(async (resolve, reject) => {
        try {
            const data = await fs.readFile(filename);
            const results = await s3.upload({
                Bucket: bucket,
                Key: keyName,
                Body: data,
            });
            resolve(results);
        }
        catch (error) {
            reject(error);
        }
    });
};
const downloadFromS3 = async (bucket, keyName, saveLocation) => {
    return await new Promise(async (resolve, reject) => {
        try {
            const params = {
                Bucket: bucket,
                Key: keyName,
            };
            const { Body } = await s3.getObject(params).promise();
            await fs.writeFile(saveLocation, Body);
            resolve(true);
        }
        catch (error) {
            reject(error);
        }
    });
};
const uploadAllToS3 = async (folderName, bucket) => {
    return await new Promise(async (resolve, reject) => {
        try {
            fs.readdir(folderName, async (err, files) => {
                if (err) {
                    reject(err);
                }
                else {
                    files.forEach(async (file) => {
                        await uploadToS3(bucket, file, file);
                    });
                    resolve(true);
                }
            });
        }
        catch (error) {
            reject(error);
        }
    });
};
module.exports = {
    uploadAllToS3,
    downloadFromS3,
    uploadToS3,
    s3
};
