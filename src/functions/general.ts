import https from 'https';
import { PPTSIGN } from '../configs/api';
import fs from 'fs';
import { getJsonObject } from '../utils/file';
const config = getJsonObject('configs/storage.json');
var pushplus_key = config.monitor.pushplus_key;
export const GeneralSign = async (uf: string, _d: string, vc3: string, name: string, activeId: string | number, uid: string, fid: string) => {
  let data = '', rtime = Math.random() * 4001 + 5000, push_str = ""
  return new Promise((resolve) => {
    setTimeout(() => {
      https.get(PPTSIGN.URL + `?activeId=${activeId}&uid=${uid}&clientip=&latitude=-1&longitude=-1&appType=15&fid=${fid}&name=${name}`, {
        headers: {
          'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
        }
      }, (res) => {
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          if (data === 'success') {
            console.log(`[通用]签到成功,随机延时:${rtime}`)
            push_str = push_str + `【通用】签到成功,随机延时:${rtime}<br/>`
            resolve('success')
            fs.writeFileSync("temp_PushStr.txt", push_str, { encoding: 'utf-8', flag: 'a' });
            if(pushplus_key!=""){setTimeout(() => {
              let data = fs.readFileSync("temp_PushStr.txt")
              https.get(`https://www.pushplus.plus/send?token=${pushplus_key}&title=cx-签到通知√&content=${data.toString()}`, (res) => {
                console.log(res.statusCode)
              })
            }, 100)}else{console.log("pushplus密钥为空，不推送签到信息")}
            
          } else {
            console.log(data)
            push_str = push_str + `[通用]签到失败,随机延时:${rtime},错误信息:${data}\\n`
            resolve(data)
            fs.writeFileSync("temp_PushStr.txt", push_str, { encoding: 'utf-8', flag: 'a' });
            if(pushplus_key!=""){
            setTimeout(() => {
              let data = fs.readFileSync("temp_PushStr.txt")
              https.get(`https://www.pushplus.plus/send?token=${pushplus_key}&title=cx-签到通知√&content=${data.toString()}`, (res) => {
                console.log(res.statusCode)
              })
            }, 100)}else{console.log("pushplus密钥为空，不推送签到信息")}

          }
        })
      })
        }, rtime)
      })
      
    }