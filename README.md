# OAuth Test Script

Some scripts written in NodeJS javascript to test CKAN , Keycloak , and Raccoon's Functionalities by sending HTTP Requests programmably.

# List Of Test Scripts

## 1_upload_dataset_to_ckan.js
Create organization,create dataset and upload resource in one run.

## 2_1_download_ckan_dataset_resources.js
Download CKAN dataset with NodeJS javascript.

## 2_2_download_dicom.js
Download DICOM Image from Raccoon's WADO-RS API with OAuth Authorization in NodeJS javascript.

# How to use

1.Run npm install.
```
npm install
```

2.Fill in or edit required parameters on the settings part in the script. And prepare the files that is ready to upload.

3.Run the desired script by using node [script_name]
```
node .\1_upload_dataset_to_ckan.js
node .\2_1_download_ckan_dataset_resources.js
node .\2_2_download_dicom.js
```
