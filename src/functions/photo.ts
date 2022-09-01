import https from 'https';
import fs from 'fs';
import path from 'path';
import { PPTSIGN, PANCHAOXING, PANLIST, PANUPLOAD } from '../configs/api';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { getJsonObject } from '../utils/file';
const config = getJsonObject('configs/storage.json');
var pushplus_key = config.monitor.pushplus_key;
export const PhotoSign = async (uf: string, _d: string, vc3: string, name: string, activeId: string | number, uid: string, fid: string, objectId: unknown) => {
  let data = '',rtime = Math.random() *4001 +5000,push_str = ""
  return new Promise((resolve) => {
    setTimeout(()=>{https.get(PPTSIGN.URL + `?activeId=${activeId}&uid=${uid}&clientip=&useragent=&latitude=-1&longitude=-1&appType=15&fid=${fid}&objectId=${objectId}&name=${name}`, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (data === 'success') {
          console.log(`[拍照]签到成功,随机延时:${rtime}`)
          push_str = push_str+`【拍照】签到成功,随机延时:${rtime}<br/>`
          resolve('success')
          fs.writeFileSync("temp_PushStr.txt", push_str,{encoding:'utf-8',flag:'a'});
          if(pushplus_key!=""){
          setTimeout(() => {
            let data = fs.readFileSync("temp_PushStr.txt")
            https.get(`https://www.pushplus.plus/send?token=${pushplus_key}&title=cx-签到通知√&content=${data.toString()}`, (res) => {
              console.log(res.statusCode)
            })
          }, 100)}else{console.log("pushplus密钥为空，不推送签到信息")}
          return
        } else {
          push_str = push_str+`【拍照】签到失败,随机延时:${rtime},错误信息:${data}<br/>`
          resolve(data)
          fs.writeFileSync("temp_PushStr.txt", push_str,{encoding:'utf-8',flag:'a'});
          if(pushplus_key!=""){
          setTimeout(() => {
            let data = fs.readFileSync("temp_PushStr.txt")
            https.get(`https://www.pushplus.plus/send?token=${pushplus_key}&title=cx-签到通知×&content=${data.toString()}`, (res) => {
              console.log(res.statusCode)
            })
          }, 100)}else{console.log("pushplus密钥为空，不推送签到信息")}
        }
        
      })
    })},rtime) 
  })
}

// 在Termux或其他终端中使用，从云盘获取图片
export const getObjectIdFromcxPan = (uf: string, _d: string, vc3: string, uid: string) => {
  let data = ''
  return new Promise((resolve) => {
    https.get(PANCHAOXING.URL, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        let start_of_enc = data.indexOf('enc ="') + 6
        let enc = data.slice(start_of_enc, data.indexOf('"', start_of_enc))
        let start_of_rootdir = data.indexOf('_rootdir = "') + 12
        let parentId = data.slice(start_of_rootdir, data.indexOf('"', start_of_rootdir))
        let objectId = ''

        data = ''
        let postreq = https.request(PANLIST.URL + `?puid=0&shareid=0&parentId=${parentId}&page=1&size=50&enc=${enc}`, {
          method: PANLIST.METHOD,
          headers: {
            'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
          }
        }, (res) => {
          res.on('data', (chunk) => { data += chunk })
          res.on('end', () => {
            let result = JSON.parse(data)
            for (let i = 0; i < result.list.length; i++) {
              if (result.list[i].name == '0.jpg' || result.list[i].name == '0.png') {
                objectId = result.list[i].objectId
                break
              }
            }
            if (objectId != '') {
              resolve(objectId)
            } else {
              console.log('未查询到符合的图片，请去网盘检查检查！')
            }
          })
        })
        postreq.write(`puid=0&shareid=0&parentId=${parentId}&page=1&size=50&enc=${enc}`)
        postreq.end()
      })
    })
  })
}

// 直接上传图片获得objectId，在UI项目里使用
export const uploadPhoto = async (uf: string, _d: string, _uid: string, vc3: string, token: string, buffer: Buffer) => {
  const FormData = (await import('form-data')).default
  let form = new FormData()
  let tempFilePath = path.join(tmpdir(), randomBytes(16).toString('hex') + '.jpg');

  // form-data 库只支持文件流，所以只能先写入文件再从文件读了
  fs.writeFileSync(tempFilePath, buffer)
  let readStream = fs.createReadStream(tempFilePath)
  form.append('file', readStream)
  form.append('puid', _uid)

  return new Promise((resolve) => {
    let data = ''
    // 上传文件
    let request = https.request(PANUPLOAD.URL + '?_token=' + token, {
      method: PANUPLOAD.METHOD,
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${_uid}; vc3=${vc3};`,
        'Content-Type': `multipart/form-data;boundary=${form.getBoundary()}`
      }
    }, (res) => {
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        fs.unlink(tempFilePath, () => { });
        resolve(data);
      })
    })
    form.pipe(request)
  })
}