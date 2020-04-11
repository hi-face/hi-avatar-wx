require('./promise-allSettled')
const extCi = require("@cloudbase/extension-ci");
const tcb = require('tcb-admin-node')
const detectFace = require('./req-iai-face').detectFace

let env = process.env.TCB_ENV === 'local' ? 'development-9p1it' : process.env.TCB_ENV

tcb.init({
  env
})
tcb.registerExtension(extCi)


const getBase64 = async (fileID) => {
  let { fileContent } = await tcb.downloadFile({
    fileID
  })

  return fileContent.toString('base64')
}

exports.main = async (event) => {
  const { fileID = '', base64Main = '' } = event

  if (fileID) {
    let imgID = fileID.replace('cloud://', '')
    let index = imgID.indexOf('/')
    let cloudPath = imgID.substr(index)
    let cloudEnvPath = imgID.substr(0, index)

    console.log('cloudEnvPath :', cloudEnvPath)

    let facePath1 = '/face-recognition1'
    const opts = {
      rules: [
        {
          // 处理结果的文件路径，如以’/’开头，则存入指定文件夹中，否则，存入原图文件存储的同目录
          fileid: facePath1 + cloudPath,
          rule: "imageMogr2/thumbnail/!600x600r/cut/600x600/center" // 处理样式参数，与下载时处理图像在url拼接的参数一致
        },
      ]
    }


    await tcb.invokeExtension("CloudInfinite", {
      action: "ImageProcess",
      cloudPath: cloudPath, // 存储图像的绝对路径，与tcb.uploadFile中一致
      // fileContent, // 该字段可选，文件内容：Uint8Array|Buffer。有值，表示上传时处理图像；为空，则处理已经上传的图像
      operations: opts
    });

    let faceFileID = cloudEnvPath + facePath1 + cloudPath

    const base64 = await getBase64(faceFileID)

    return Promise.allSettled([
      tcb.callFunction({
        name: 'image-safe-check',
        data: {
          fileID: faceFileID
        }
      }),
      detectFace(base64)
    ]).then((results) => {
      let checkResult = results[0]
      let faceResult = results[1]

      if (checkResult.result.status) {

        return checkResult.result
      }

      return {
        ...faceResult,
        data: {
          ...faceResult.data,
          faceFileID
        }
      }
    }).catch(error => {
      console.log('error :', error);

    })
  }
  
  let errorString = '请设置 fileID'
  console.log(errorString)
  return {
    data: {},
    time: new Date(),
    status: -10086,
    message: errorString
  }
}
