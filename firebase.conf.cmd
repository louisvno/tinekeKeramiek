#production
firebase functions:config:set database.x500path="x500Imgs" database.x1000path="x1000Imgs" database.thumbpath="thumbnails" database.imgstoragepaths="storagePathsByImgId" database.sourcepath="sourceImgs"

#test
firebase functions:config:set database.x500path="test_x500Imgs" database.x1000path="test_x1000Imgs" database.thumbpath="test_thumbnails" database.sourcepath="test_sourceImgs "database.temp_x500path="temp_test_x500Imgs" database.temp_x1000path="temp_test_x1000Imgs" database.temp_thumbpath="temp_test_thumbnails" database.temp_sourcepath="temp_test_sourceImgs"