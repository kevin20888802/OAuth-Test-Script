const https = require('https');
const fs = require('fs');
const querystring = require('querystring');
const FormData = require('form-data');
// --------------------------------------------------------
//
// 0. 設定
//
// --------------------------------------------------------

// ckan的token(目前需手動取得，除非有爬蟲登入程式...。) https://ckan.dicom.tw/user/{ckan使用者名稱}/api-tokens
var ckan_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJaUTZneG1pZHJKSXJVdTNFMWswUnZEUFFRaWNleGRQLVRhTmxLU2hDUjlOMWVnek02eGhFLTRYVjJWUFVfam9vOUpJU2J3Q2hHbmJnbXd0MCIsImlhdCI6MTY1NzE3OTgzNX0.VodnicpSYf1p741pPtE71H8iW3Kxqsg3iw04qbMdoLs";

// ckan網址
var ckan_host = "ckan.dicom.tw";

// 下載檔案存放的資料夾
var download_folder = "/downloads";

// 資料集的id
var dataset_id = "dicom_20220707_0";

// --------------------------------------------------------
//
// 1. 讀取資料集及其所有resource的檔案下載網址
//
// --------------------------------------------------------
/**
 * 取得ckan某個資料集所有resource的下載網址。
 * @param {*} i_dataset_id 資料集id
 */

async function get_ckan_dataset_resource_links(i_dataset_id)
{
    return new Promise ((resolve, reject) => 
    {
        let _data = "";
        let postData = querystring.stringify({
            "id": i_dataset_id
        });
        var options2 = 
        {
            hostname: ckan_host,
            path: "/api/3/action/package_show",
            method: 'POST',
            headers: {
                'Accept': "*/*",
                'authorization': ckan_token,
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'Content-Length': postData.length
            }
        };
        var _req = https.request(options2, res => 
        {
            res.on('data', d => 
            {
                _data += d;
            });
            
            res.on('end', function()
            {
                if(res.statusCode == 200)
                {
                    console.log(`==============================\n1.讀取資料集及其所有resource的檔案下載網址 - SUCCESS\n==============================\n`);
                    resolve(JSON.parse(_data)["result"]["resources"]);
                }
                else
                {
                    console.log(`==============================\n1.讀取資料集及其所有resource的檔案下載網址 - FAILED\n==============================\n`);
                    console.log(`請檢查是否有權限讀取該資料集...。\n`);
                    reject(res.statusCode);
                } 
            });

            res.on('error', error => 
            {
                console.log(`==============================\n1.讀取資料集及其所有resource的檔案下載網址 - FAILED\n==============================\n`);
                console.log(`可能為其他錯誤...\n`);
                console.error(error);
                reject(error);
            });
        });
        _req.write(postData);
        _req.end();
    });
}

// --------------------------------------------------------
//
// 2. 下載所有resource的檔案
//
// --------------------------------------------------------

async function download_file(i_url)
{
    return new Promise ((resolve, reject) => 
    {
        let _url = new URL(i_url);
        var options2 = 
        {
            hostname: _url.hostname,
            path: _url.pathname,
            method: 'GET',
            headers: {
                'Accept': "*/*",
                'authorization': ckan_token
            }
        };
        var _req = https.request(options2, res => 
        {
            var stream = fs.createWriteStream(`./${download_folder}/temp_download.tmp`,{encoding: 'utf8'});
            stream.on('finish', () => {
                console.log('File Saved !');
            });
            res.pipe(stream);

            res.on('end', function () 
            {
                if (res.statusCode == 200) 
                {
                    let filename = res.headers['content-disposition'].split('filename=')[1].split('.')[0].replace('"','');
                    let extension = res.headers['content-disposition'].split('.')[1].split(';')[0].replace('"','');
                    fs.rename(`./${download_folder}/temp_download.tmp`, `./${download_folder}/${filename}.${extension}`, (error) => 
                    { 
                        if (error) 
                        { 
                            console.log(`==============================\n2.下載檔案${filename}.${extension} - FAILED\n==============================\n`);
                            console.log("重新命名失敗，請檢查檔案是否被使用，並且資料夾有存取權限。");
                            console.log(error); 
                            reject(error);
                        } 
                        else 
                        { 
                            console.log(`==============================\n2.下載檔案${filename}.${extension} - OK\n==============================\n`);
                            resolve(res);
                        } 
                    });
                }
                else 
                {
                    console.log(`==============================\n2.下載所有resource的檔案 - FAILED\n==============================\n`);
                    reject(res.statusCode);
                }
            });
        });
        _req.end();
    });
}

async function main()
{
    let resource_metadata = await get_ckan_dataset_resource_links(dataset_id);
    for(let i = 0; i < resource_metadata.length; i++)
    {
        await download_file(resource_metadata[i]["upload"]);
    }
}
main();