const tcb = require('tcb-admin-node')
const config = require('./config')
const reqFace = require('./req-iai-face')

let env = process.env.TCB_ENV === 'local' ? 'development-9p1it' : process.env.TCB_ENV

if (typeof Promise.allSettled !== "function") {
  Promise.allSettled = function (promises) {
    return new Promise(function (resolve, reject) {
      if (!Array.isArray(promises)) {
        return reject(
          new TypeError("arguments must be an array")
        );
      }
      var resolvedCounter = 0;
      var promiseNum = promises.length;
      var resolvedValues = new Array(promiseNum);
      for (var i = 0; i < promiseNum; i++) {
        (function (i) {
          Promise.resolve(promises[i]).then(
            function (value) {
              resolvedCounter++;
              resolvedValues[i] = value;
              if (resolvedCounter == promiseNum) {
                return resolve(resolvedValues);
              }
            },
            function (reason) {
              resolvedCounter++;
              resolvedValues[i] = reason;
              if (resolvedCounter == promiseNum) {
                return reject(reason);
              }
            }
          );
        })(i);
      }
    });
  };
}

// 腾讯云的id和key
let secretId = config.SecretId || ''
let secretKey = config.SecretKey || ''

tcb.init({
  env
  // secretId,
  // secretKey,
})

const analyzeFace = reqFace.analyzeFace

exports.main = async (event) => {
  const { fileID = '', base64Main = '' } = event

  let Image = ''


  if (fileID) {

    console.log('fileID :', fileID);
    const res = await tcb.callFunction({
      name: 'image-safe-check',
      data: {
        fileID
      }
    })

    console.log('res :', res);

    // return res
    // let { fileContent } = await tcb.downloadFile({
    //   fileID
    // })

    // Image = fileContent.toString('base64')
  }
}
