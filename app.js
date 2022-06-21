const https = require('https');
const fs = require('fs');
var querystring = require('querystring');

// --------------------------------------------------------
//
// 0. 設定
//
// --------------------------------------------------------

// 下載要取的檔案名稱
var result_file_name = "result.dcm"

// keyclock取得token的網址
var keyclock_host = "oauth.dicom.tw";
var keyclock_token_endpoint = "/realms/Cylab/protocol/openid-connect/token";

// 認證資訊
var client_id = "account";
var username = "test";
var password = "test1234";

// raccoon網址
var raccoon_host = "180f-111-251-144-121.ngrok.io";
var raccoon_url = "/api/dicom/wado/?requestType=WADO&studyUID=1.2.392.200036.9116.2.6.1.48.1215619068.1461311730.989789&seriesUID=1.2.392.200036.9116.2.6.1.48.1215619068.1461312448.885264&objectUID=1.2.392.200036.9116.2.6.1.48.1215619068.1461312530.871296&contentType=application/dicom";

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
    //console.log(access_token);
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
        'Accept': "*/*",
        'authorization': access_token
      },
    };
    var req2 = https.request(options2, res => 
    {
      console.log(`statusCode: ${res.statusCode}`);

      var stream = fs.createWriteStream(result_file_name,{encoding: 'utf8'});
      stream.on('finish', () => {
        console.log('File Saved !');
      });
      res.pipe(stream);

      res.on('data', d => {
        //process.stdout.write(d);
      });

      res.on('end', function () 
      {

        if (res.statusCode == 200) 
        {
          console.log(`==============================\n2.Raccoon測試 - OK\n==============================\n`);
        }
        else 
        {
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
