
const fs = require('fs');

// 下載檔案存放的資料夾
var download_folder = "/downloads";

// 下載要取的檔案名稱
var result_file_name = "result";
var result_file_type = "dcm";

async function writeProcess(i_tmpfile , i_filename, i_file_type)
{
    return new Promise ((resolve, reject) => 
    {
        let i = 77;
        let o_filename = `./${download_folder}/${result_file_name}_${i}.${result_file_type}`;
        var wstream;
        
        let readerStream = fs.createReadStream(`./${download_folder}/temp_download.tmp`);
        let _tmp = "";
        let _contentLength = 0;
        let _currentLength = 0;
        let _mode = "head";
        readerStream.on("readable", function() {
            //wstream.write(chunk);
            var chunk;
            while (null !== (chunk = readerStream.read(1) /* here */)) 
            {
                if(_mode == "head")
                {
                    _tmp += chunk;
                    if(_tmp.split('\r\n').length >= 5)
                    {
                        let _headInfo = _tmp.split('\r\n');
                        console.log(_headInfo);
                        _contentLength = parseInt(_headInfo[2].replace("Content-length: ",""));
                        i += 1;
                        o_filename = `./${download_folder}/${result_file_name}_${i}.${result_file_type}`;
                        wstream = fs.createWriteStream(o_filename);
                        _mode = "write";
                    }
                }
                else
                {
                    _tmp = "";
                    if(!(_currentLength >= _contentLength))
                    {
                        //console.log(chunk);
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

async function main()
{
    await writeProcess();
}
main();

//console.log(rawdata);
/*let parts = rawdata.split(boundary);
for (let i = 1; i < parts.length - 1; i++) {
    // 開始寫入檔案
    // 第一行是 Content-type 檔案類型 第二行是檔案大小
    let lines = parts[i].split('\n');
    let wstream = fs.createWriteStream(o_filename, { encoding: 'ascii' });
    console.log("saving file:" + o_filename);
    for (let j = 4; j < lines.length; j++) {
        //wstream.write(lines[j] + "\n");
        wstream.write(lines[j] + "\n");
    }
    wstream.end();
}*/