const request = require('request');
const fs = require('fs');
const tfnode = require('@tensorflow/tfjs-node');

var upload_file_name = "upd.png";
//var api_host = "1287-111-251-144-121.ngrok.io";
//var api_url = "/guess";
var api_host = "apiserv.v6.rocks";
var api_url = "/kctest/guess";

// --------------------------------------------------------
//
    /**
    先手動到postman取得token。
    在postman登入oauth2.0的地方輸入這些
    Grant Type 選擇 Authorization Code
    Callback URL = https://apiserv.v6.rocks/kctest/oidc_callback
    Auth URL = https://aiauth.v6.rocks/auth/realms/datasharing/protocol/openid-connect/auth
    Access Token URL = https://aiauth.v6.rocks/auth/realms/datasharing/protocol/openid-connect/token
    Client ID = apiserver
    Client Secret = act0MAtu10sUstvx9HcBC7BjjiBzJFu0
    Scope = openid profile openidemail
    按下Get New Access Token會跳出他keycloak的登入畫面
    登入後取得Access Token(必須得用這個token，這樣才有user id。)
    **/
// 0. 取得Access Token
// (因為沒有開帳號密碼直接登入的功能，請使用postman先取得token後複製貼上至此。)
// --------------------------------------------------------

var access_token = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGZllJd3k1TGEzUlJZbjFvVmFYaTNzamNscU5mMFRVN1c5U00tMnZ2Ry1JIn0.eyJleHAiOjE2NTY2NTM3ODgsImlhdCI6MTY1NjA0OTc5NywiYXV0aF90aW1lIjoxNjU2MDQ4OTg4LCJqdGkiOiIxYmNlMmZhZS1iMWQ4LTQzNzUtOTYyZi1iN2I0MjFhZTgwM2IiLCJpc3MiOiJodHRwczovL2FpYXV0aC52Ni5yb2Nrcy9hdXRoL3JlYWxtcy9kYXRhc2hhcmluZyIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJjOTY5ODQ1YS01ZWI0LTRmMzAtYjMxMS1lMzA5Y2MyNDhkNjUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJhcGlzZXJ2ZXIiLCJzZXNzaW9uX3N0YXRlIjoiMzE4Mjg2NjMtMDk5MC00ZWM1LTgzMDctMjdmOTU5MmQ4ZmE3IiwiYWNyIjoiMCIsInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsImRlZmF1bHQtcm9sZXMtZGF0YXNoYXJpbmciLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgb3BlbmlkZW1haWwiLCJzaWQiOiIzMTgyODY2My0wOTkwLTRlYzUtODMwNy0yN2Y5NTkyZDhmYTciLCJuYW1lIjoiSG9uZ3hpbiBXYW5nIiwicHJlZmVycmVkX3VzZXJuYW1lIjoia2V2aW4yMDg4IiwiZ2l2ZW5fbmFtZSI6Ikhvbmd4aW4iLCJmYW1pbHlfbmFtZSI6IldhbmciLCJlbWFpbCI6ImtldmluMjA4ODg4MDJAZ21haWwuY29tIn0.sBekrbQ9MMucmV67t2kRV88FJAuM6L0YIqTGC6l667zHGrXbiNtSOlzTM23VZRP-q8nbg4nCbQvI-wxG0u-yynebKy71QxkUaPxas2tu8TDgMbyqOupy_0RILse1b-CDz7Fr0ON0WTBclNUkmcsdv3aKl9GFEPf8_OYYO3qig5k_20DLu-lRPbPkhY4fCUy6VVIbvcCfKm2aIAdTNugZckvGQo0wggV4CpucXUPHsDXlm0-oGRPfMXZjtoel-8wbUb-2GYfYElQKTa6WzYqLgBVksQmhgDTNa9X6Ay2rJUOzT-G84xt-dufYxu6Nz_h9DKduEqj_2lgyVj2M6Gay3Q";

// --------------------------------------------------------
//
// 1. 上傳圖片到api server
//
// --------------------------------------------------------

// 先讀取圖片...
const imageBuffer = fs.readFileSync(upload_file_name);
// 將圖片轉換成tensor
const tfimage = tfnode.node.decodeImage(imageBuffer);
//console.log(JSON.stringify(tfimage.arraySync()));

// 將圖片的字串資料放到json後post到api
var req = request.post(
{
    uri:`https://${api_host}${api_url}`,
    headers: {
        'Accept': "*/*",
        'Authorization': access_token,
    },
    // 將tensor轉換成陣列後轉換成字串
    json:JSON.stringify(tfimage.arraySync())
}, 
function (err, resp, body) 
{
    if (err) 
    {
        console.log('Error!');
        console.log(err);
    } 
    else 
    {
        console.log('\n\n\n辨識結果:\n' + body + "\n\n\n");
    }
});
