const request = require('request');
const fs = require('fs');
const tfnode = require('@tensorflow/tfjs-node');

var upload_file_name = "upd.png";
var api_host = "1287-111-251-144-121.ngrok.io";
var api_url = "/guess";

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

var access_token = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGZllJd3k1TGEzUlJZbjFvVmFYaTNzamNscU5mMFRVN1c5U00tMnZ2Ry1JIn0.eyJleHAiOjE2NTY1MDQ5NzUsImlhdCI6MTY1NTkwMDE3NSwiYXV0aF90aW1lIjoxNjU1OTAwMTc1LCJqdGkiOiJjOTVmOTQ0NC1kNDUxLTQ0NWEtOWQ4YS03NDFhNmFhNWQ4MDUiLCJpc3MiOiJodHRwczovL2FpYXV0aC52Ni5yb2Nrcy9hdXRoL3JlYWxtcy9kYXRhc2hhcmluZyIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJjOTY5ODQ1YS01ZWI0LTRmMzAtYjMxMS1lMzA5Y2MyNDhkNjUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJhcGlzZXJ2ZXIiLCJzZXNzaW9uX3N0YXRlIjoiNDRiOTE2OTEtNWYyYy00ZTZmLWIxMDEtZjJkNTA4Y2IxZTg2IiwiYWNyIjoiMSIsInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsImRlZmF1bHQtcm9sZXMtZGF0YXNoYXJpbmciLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgb3BlbmlkZW1haWwiLCJzaWQiOiI0NGI5MTY5MS01ZjJjLTRlNmYtYjEwMS1mMmQ1MDhjYjFlODYiLCJuYW1lIjoiSG9uZ3hpbiBXYW5nIiwicHJlZmVycmVkX3VzZXJuYW1lIjoia2V2aW4yMDg4IiwiZ2l2ZW5fbmFtZSI6Ikhvbmd4aW4iLCJmYW1pbHlfbmFtZSI6IldhbmciLCJlbWFpbCI6ImtldmluMjA4ODg4MDJAZ21haWwuY29tIn0.MXLzUVNbH8thx7wOatUpdtIsHtulxFAJHIKz0-T_9kW9oX1_KZnc1StCkItRQmW3wuxjne3-FQHh3yzILDELBHTmDdkK12MHdZZxDKS0FUj89QvklW7p7PnjtQn8KjI1C1bMEddFmtUznCACJoqzKfcrQbzhREBxY3BowGnAbuef4ZrK3XPE07iFpcblc2NRYxrnT0V45z1yZ7Y3MV_-U7fP7JCoeGy6cEYbXjxBBZYnrrR6zTDgsV7HjoAVc32Zl6cS2yklivC_X0cA3nrT2_x6tE1lHptWrBm-jLXG6bIWvHfz_fkthvSRGcEuw2kaaU6nKowyWQGdSGVSkthY4g";

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
    } 
    else 
    {
        console.log('\n\n\n辨識結果:\n' + body + "\n\n\n");
    }
});
