import https from 'https';
import { PPTSIGN } from '../configs/api';
import fs from 'fs';
import { getJsonObject } from '../utils/file';
const config = getJsonObject('configs/storage.json');
var pushplus_key = config.monitor.pushplus_key;
export const QRCodeSign = async (enc: string, name: string, fid: string, uid: string, aid: string | number, uf: string, _d: string, vc3: string) => {
  return new Promise((resolve) => {
    let data = '',rtime = Math.random() *3001 +3000,push_str = ""
    setTimeout(()=>{https.get(PPTSIGN.URL + `?enc=${enc}&name=${encodeURI(name)}&activeId=${aid}&uid=${uid}&clientip=&useragent=&latitude=-1&longitude=-1&fid=${fid}&appType=15`, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (data === 'success') {
          console.log(`[二维码]签到成功,随机延时:${rtime}`)
          push_str = push_str+`【二维码】签到成功,随机延时:${rtime}<br/>`
          resolve("success")
          fs.writeFileSync("temp_PushStr.txt", push_str,{encoding:'utf-8',flag:'a'});
          if(pushplus_key!=""){
          setTimeout(() => {
            let data = fs.readFileSync("temp_PushStr.txt")
            https.get(`https://www.pushplus.plus/send?token=${pushplus_key}&title=cx-签到通知√&content=${data.toString()}`, (res) => {
              console.log("pushplus推送完成，状态码：",res.statusCode)
            })
          }, 100)}else{console.log("pushplus密钥为空，不推送签到信息")}
        } else {
          console.log(data)
          push_str = push_str+`【二维码】签到失败,随机延时:${rtime},错误信息:${data}<br/>`
          resolve(data)
          fs.writeFileSync("temp_PushStr.txt", push_str,{encoding:'utf-8',flag:'a'});
          if(pushplus_key!=""){
          setTimeout(() => {
            let data = fs.readFileSync("temp_PushStr.txt")
            https.get(`https://www.pushplus.plus/send?token=${pushplus_key}&title=cx-签到通知×&content=${data.toString()}`, (res) => {
              console.log("pushplus推送完成，状态码：",res.statusCode)
            })
          }, 100)}else{console.log("pushplus密钥为空，不推送签到信息")}
        }
        
      })
    })},rtime) 
  })
}