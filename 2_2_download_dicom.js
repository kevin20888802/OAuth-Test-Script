const https = require('https');
const fs = require('fs');
const querystring = require('querystring');

// --------------------------------------------------------
//
// 0. 設定
//
// --------------------------------------------------------

// 下載要取的檔案名稱
var result_file_name = "result";
var result_file_type = "dcm";

// 下載檔案存放的資料夾
var download_folder = "/downloads";

// keyclock取得token的網址
var keyclock_host = "oauth.dicom.tw";
var keyclock_token_endpoint = "/realms/Cylab/protocol/openid-connect/token";

// 認證資訊 (如果是在瀏覽器上建議直接連到keycloak的登入畫面做認證)
var client_id = "account";
var username = "test1111";
var password = "test1234";

var ckan_package_id = "dicom_20220707_1";

// raccoon網址
var raccoon_host = "d812-111-251-167-165.ngrok.io";
var raccoon_url = "/dicom-web/studies/1.2.276.0.7230010.3.1.4.1637094980.13328.1608080296.30";

// --------------------------------------------------------
//
// 1. 取得Access Token
//
// --------------------------------------------------------

var access_token = "";

var postData = querystring.stringify({
  "grant_type": "password",
  "client_id": client_id,
  "username": username,
  "password": password
});

var options = 
{
  hostname: keyclock_host,
  path: keyclock_token_endpoint,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    'Content-Length': postData.length
  },
};

var req = https.request(options, res => 
{
  res.on('data', d => 
  {
    access_token += d;
    access_token = "Bearer " + JSON.parse(access_token)["access_token"];
    console.log(access_token);
    console.log(`==============================\n1.Keyclock 取得Access Token - OK\n==============================\n`);
    // --------------------------------------------------------
    //
    // 2. 帶入access_token傳送request到raccoon網址
    //
    // --------------------------------------------------------
    var options2 = 
    {
      hostname: raccoon_host,
      path: raccoon_url,
      method: 'GET',
      headers: {
        'Accept': "multipart/related; type=application/dicom",
        'authorization': access_token,
        'package_id': ckan_package_id
      },
    };
    var req2 = https.request(options2, res => 
    {
      console.log(`statusCode: ${res.statusCode}`);
      if(res.statusCode == 200)
      {
        console.log("下載中");
      }
      let content_type = res.headers["content-type"].split(";");
      var stream = fs.createWriteStream(`./${download_folder}/temp_download.tmp`,'utf16le');
      stream.on('finish', () => {
          console.log('下載完成');
      });
      res.pipe(stream);

      res.on('end', async function () 
      {
          //console.log(body);
          // 如果content type 是 multipart就進行額外處理
          if (content_type[0].startsWith("multipart")) 
          {
            console.log("content type是multipart\n將進行分割處理");
            await MultipartFileToFiles(`./${download_folder}/temp_download.tmp`,`./${download_folder}/${result_file_name}`,`${result_file_type}`);
          }
          else // 否則直接將tmp檔案重新命名
          {
            fs.renameSync(`./${download_folder}/temp_download.tmp`, `./${download_folder}/${result_file_name}.${result_file_type}`, (error) => 
            { 
                if (error) 
                { 
                    console.log(`==============================\n2.下載檔案${_filename}.${result_file_type} - FAILED\n==============================\n`);
                    console.log("重新命名失敗，請檢查檔案是否被使用，並且資料夾有存取權限。");
                    console.log(error); 
                    reject(error);
                } 
                else 
                { 
                    console.log(`==============================\n2.下載檔案${_filename}.${result_file_type} - OK\n==============================\n`);
                    resolve(res);
                } 
            });
          }

          // 刪除暫存檔案
          fs.unlink(`./${download_folder}/temp_download.tmp`,function(err){
            if(err) return console.log(err);
            console.log('temp file deleted');
          }); 

          if (res.statusCode == 200) {
              console.log(`==============================\n2.Raccoon測試 - OK\n==============================\n`);
          }
          else {
              console.log(`==============================\n2.Raccoon測試 - FAILED\n==============================\n`);
          }
      });

    });

    req.on('error', error =>
    {
      console.log(`==============================\n2.Raccoon測試 - FAILED\n==============================\n`);
      console.error(error);
    });
    req2.end();
  });

  res.on('error', error => 
  {
    console.log(`==============================\n1.Keyclock 取得Access Token - FAILED\n==============================\n`);
    console.error(error);
  });
});

req.write(postData);
req.end();

/**
 * 將multipart/related的資料寫入到多個檔案中。
 */
async function MultipartFileToFiles(i_multipart , i_filename, i_file_type)
{
    return new Promise ((resolve, reject) => 
    {
        let i = -1;
        let o_filename = `${i_filename}_${i}.${i_file_type}`;
        var wstream;
        
        let readerStream = fs.createReadStream(i_multipart);
        let _tmp = "";
        let _contentLength = 0;
        let _currentLength = 0;
        let _mode = "head";
        readerStream.on("readable", function() {
            var chunk;
            // 將資料逐個字元做判斷及處理
            while (null !== (chunk = readerStream.read(1))) 
            {
                if(_mode == "head")
                {
                    _tmp += chunk;
                    if(_tmp.split('\r\n').length >= 5)
                    {
                        let _headInfo = _tmp.split('\r\n');
                        _contentLength = parseInt(_headInfo[2].replace("Content-length: ",""));
                        i += 1;
                        o_filename = `./${download_folder}/${result_file_name}_${i}.${result_file_type}`;
                        console.log(`正在處理檔案:${o_filename}`);
                        wstream = fs.createWriteStream(o_filename);
                        _mode = "write";
                    }
                }
                else
                {
                    _tmp = "";
                    if(!(_currentLength >= _contentLength))
                    {
                        wstream.write(chunk);
                        _currentLength += 1;
                    }
                    else
                    {
                        _mode = "head";
                        _contentLength = 0;
                        _currentLength = 0;
                        wstream.end();
                    }
                }
            }
        });
        
        readerStream.on("end", function() {
            resolve();
        });
        
        readerStream.on("error", function(err) {
            console.log(err.stack);
            reject();
        });
    });
}