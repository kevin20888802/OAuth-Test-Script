const https = require('https');
const fs = require('fs');
const querystring = require('querystring');
const FormData = require('form-data');

// --------------------------------------------------------
//
// 0. 設定
//
// --------------------------------------------------------

// 上傳的資料集csv檔案名稱(或網址，需要把file_is_url改成true。)
//var upload_file_path = "http://dl.dropboxusercontent.com/s/1yagot9ih6z2rdm/out.csv";
var upload_file_path = "./out.csv";
var upload_file_name = "out.csv";
var upload_format = "csv"; // 上傳的檔案格式為何
var file_is_url = false;

// 認證資訊( 需要開啟keycloak client的Direct Access Grants Enabled ， 如未開啟則需手動取得token。)
// 並且在ckan裡面需要有相對應的權限(如要從0開始則需要有Sysadmin管理員權限來建立organization)
/**
 * 如果非管理員但是有加入組織則需有相對應的權限。
 * 
 * SysAdmin : 可以做全部的事情(包括新增組織，其他都沒法動新增刪除組織相關的事情，但是需要後台跑指令設定...。)
 * Admin: Can add/edit and delete datasets, as well as manage organization members. 可新增修改刪除資料集
 * Editor: Can add and edit datasets, but not manage organization members. 可新增修改資料集 不可刪除資料集
 * Member: Can view the organization's private datasets, but not add new datasets. 只能瀏覽資料集
 * 
 */

// ckan的token(目前需手動取得，除非有爬蟲登入程式...。) https://ckan.dicom.tw/user/{ckan使用者名稱}/api-tokens
var ckan_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJaUTZneG1pZHJKSXJVdTNFMWswUnZEUFFRaWNleGRQLVRhTmxLU2hDUjlOMWVnek02eGhFLTRYVjJWUFVfam9vOUpJU2J3Q2hHbmJnbXd0MCIsImlhdCI6MTY1NzE3OTgzNX0.VodnicpSYf1p741pPtE71H8iW3Kxqsg3iw04qbMdoLs";

// ckan網址
var ckan_host = "ckan.dicom.tw";

// 是否要建立相關資料
// 請注意，在ckan使用瀏覽器直接按按鈕刪除似乎不會立刻刪除，因為會跑到資源回收桶，需要要再按一次刪除。
var create_organization = false; // 是否要建立組織?(需要有sysadmin)
var organization_id = "cylab_22222"; // 組織id
var organization_title = "cylab_22222" // 組織名稱
var organization_description = "" // 組織簡介

var create_dataset = false; // 是否要建立dataset?(需要有組織內的Admin或是Editor權限)
var dataset_id = "dicom_20220707_0"; // 資料集id (不會顯示在網頁上的)
var dataset_name = "dicom_20220707_0"; // 資料集名稱 (會顯示在網頁上的)
var dataset_note = "dicom 20220707_0"; // 資料集簡介

// --------------------------------------------------------
//
// 1. 建立組織(如果需要)
//
// --------------------------------------------------------

if(create_organization)
{
  let _data = "";
  let postData = querystring.stringify({
    "name": organization_id,
    "title": organization_title,
    "description": organization_description,
    "state": "active",
  });
  
  let options = 
  {
    hostname: ckan_host,
    path: "/api/action/organization_create",
    method: 'POST',
    headers: {
      'Authorization': ckan_token,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Content-Length': postData.length
    },
  };

  let req = https.request(options, res => 
    {
      res.on('data', d => 
      {
        _data += d;
        if(res.statusCode == 200)
        {
          console.log(`==============================\n1.建立組織 - SUCCESS\n==============================\n`);
        }
        else
        {
          console.log(`==============================\n1.建立組織 - FAILED\n==============================\n`);
          console.log(`請檢查組織是否已建立或是在資料庫中的id有所重複...。\n`);
        } 
        console.log(_data);
      });
    
      res.on('error', error => 
      {
        console.log(`==============================\n1.建立組織 - FAILED\n==============================\n`);
        console.log(`可能為其他錯誤...\n`);
        console.error(error);
      });
    
    });
    
    req.write(postData);
    req.end();
}

// --------------------------------------------------------
//
// 2. 建立資料集(如果需要)
//
// --------------------------------------------------------


if(create_dataset)
{
  let _data = "";
  let postData = querystring.stringify({
    "key": dataset_id,
    "name": dataset_name,
    "notes": dataset_note,
    "owner_org": organization_id,
  });

  let options = 
  {
    hostname: ckan_host,
    path: "/api/action/package_create",
    method: 'POST',
    headers: {
      'Authorization': ckan_token,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Content-Length': postData.length
    },
  };

  let req = https.request(options, res => 
    {
      res.on('data', d => 
      {
        _data += d;
      });
      
      res.on('end', function()
      {
        console.log(_data);
        if(res.statusCode == 200)
        {
          console.log(`==============================\n2.建立資料集 - SUCCESS\n==============================\n`);
        }
        else
        {
          console.log(`==============================\n2.建立資料集 - FAILED\n==============================\n`);
          console.log(`請檢查資料集是否已建立或是在資料庫中的id有所重複...。\n`);
        } 
      });

      res.on('error', error => 
      {
        console.log(`==============================\n2.建立資料集 - FAILED\n==============================\n`);
        console.log(`可能為其他錯誤...\n`);
        console.error(error);
      });
    
    });
    
    req.write(postData);
    req.end();
}

// --------------------------------------------------------
//
// 3. 將csv上傳到指定的資料集
//
// --------------------------------------------------------

/**
 * 將resource(檔案)上傳到ckan的指定資料集。
 * @param {*} i_filepath 實際檔案的路徑
 * @param {*} i_isUrl 檔案路徑是否為網路上的網址
 * @param {*} i_dataset_id 資料集id
 * @param {*} i_name 檔案名稱
 * @param {*} i_format 在ckan上顯示的檔案格式
 */
function upload_resource_to_dataset(i_filepath,i_isUrl,i_dataset_id,i_name,i_format)
{
  let _data = "";
  let _form = new FormData();
  _form.append("package_id",i_dataset_id);
  _form.append("name",i_name);
  _form.append("format",i_format);
  if(i_isUrl)
  {
    _form.append("upload",i_filepath);
  }
  else
  {
    _form.append("upload",fs.createReadStream(i_filepath));
  }
  console.log(i_dataset_id);

  let options = 
  {
    hostname: ckan_host,
    path: "/api/3/action/resource_create",
    method: 'POST',
    headers: {
      'Authorization': ckan_token,
      'Content-Type': 'multipart/form-data; boundary=' + _form.getBoundary()
    },
    formData: _form,
  };

  let req = https.request(options, res => 
    {
      res.on('data', d => 
      {
        _data += d;
        if(res.statusCode == 200)
        {
          console.log(`==============================\n3.上傳資料集的resource檔案 - SUCCESS\n==============================\n`);
        }
        else
        {
          console.log(`==============================\n3.上傳資料集的resource檔案 - FAILED\n==============================\n`);
          console.log(`請檢查檔案是否有錯誤、名稱是否重複，或是資料集id是否有建立並且正確...。\n`);
          console.log(`並檢查是否已設置好ckan的上傳空間。\n( https://docs.ckan.org/en/2.9/maintaining/filestore.html 的Setup file uploads那部分。)\n`);
        } 

        console.log(_data);
      });
    
      res.on('error', error => 
      {
        console.log(`==============================\n3.上傳資料集的resource檔案 - FAILED\n==============================\n`);
        console.log(`可能為其他錯誤...\n`);
        console.error(error);
      });
    
    });
    
    _form.pipe(req);
}

upload_resource_to_dataset(upload_file_path,file_is_url,dataset_id,upload_file_name,upload_format);