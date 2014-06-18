var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');
var Unzip = require('adm-zip');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var StepGroupParser = require('./step-group-parser');
var ProxyMigrator = require('./proxy-migrator');
var PolicyTemplateUtil = require('./policy-template-utils');
var os = require('os');


var tempDirectory = os.tmpdir();;

//TODO : Handle policies instead of steps

/* GET policytemplates listing. */
router.get('/', function (req, res) {
    res.send('respond with a resource');
});

router.post('/upload', function (req, res) {
    var form = new multiparty.Form();
    form.parse(req, function(err, fields, files){
        handleUpload(res, err, fields, files);
    });
});

router.post('/download', function (req, res) {
    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        handleDownload(res, err, fields, files);
    });
});


function handleUpload(res, err, fields, files) {
    var length = files.filename.length;
    if (length != 1)
        handleError();
    var tempPathName = files.filename[0].path;
    // var fileName = files.filename[0].originalFilename;
    // var data = fs.createReadStream(tempPathName);

    var randomId = Math.random();
    var randomDirectory = tempDirectory + randomId;
    // Creating the directory to
    fs.mkdir(randomDirectory,function(e) {
        createTempPathAndProceed(randomDirectory, tempPathName,res, proceedWithMigration, e);
    });

    // Go into apiproxy directory

    // Go into the step definitions directory
    // load all the step definitions into memory as key-buffer pair
    // Enter proxies and iterate all files. Replace step group reference with the step group content.
    // Enter targets and iterate all files. Replace step group reference with the step group content.
}

function createTempPathAndProceed(sourceDirectory, tempPathName, res, callback, e) {
    if (e && e.code === 'EEXIST') {
        throw e;
    } else {
        console.log(sourceDirectory);
        // Extract the bundle in the temp directory
        var unzip = new Unzip(tempPathName);
        unzip.extractAllTo(sourceDirectory, true);
        fs.unlinkSync(tempPathName);
        callback(sourceDirectory, res);
    }

    // Go into the step definitions directory
    // load all the step definitions into memory as key-buffer pair


}

function proceedWithMigration(sourceDirectory, res) {

    // read all files from current directory
    fs.readdir(sourceDirectory + '/', function (err, files) {
        if (err) throw err;
        files.forEach(function (file) {
            // load contents of step groups in memory
            var stepGroupsDir = sourceDirectory + '/' + file + '/apiproxy/stepgroups';
            // Go into apiproxy directory
            var stepGroupParser = new StepGroupParser();
            stepGroupParser.on('finish',function(groupMap) {
                var proxyDir = sourceDirectory + '/' + file + '/apiproxy/proxies';
                var proxyMigrator = new ProxyMigrator();
                proxyMigrator.on('finish', function (bundlePath, tempDir, proxyName) {
                    // delete bundlePath after 10 Sec. (Find a better way).
                    setTimeout(function() { new PolicyTemplateUtil().deleteFolderRecursive(tempDir) }, 10000);
                    // Now send the Zip contents as response
                    var stat = fs.statSync(bundlePath);
                    res.setHeader('Content-disposition', 'attachment; filename=' + proxyName + '.zip');
                    res.writeHead(200, {'Content-Type': 'application/zip', 'Content-Length': stat.size});
                    var readStream = fs.createReadStream(bundlePath);
                    readStream.pipe(res);
                    //res.write('files:\n\n'+files.length);
                    // res.end();
                });
                proxyMigrator.processUpload(proxyDir, groupMap);
            });
            stepGroupParser.process(stepGroupsDir);
        });

    });
}

function handleDownload(res, err, fields, files) {
    var length = files.filename.length;
    if (length != 1)
        handleError();
    var tempPathName = files.filename[0].path;
    // var fileName = files.filename[0].originalFilename;
    // var data = fs.createReadStream(tempPathName);

    var randomId = Math.random();
    var randomDirectory = tempDirectory + randomId;
    // Creating the directory to
    fs.mkdir(randomDirectory, function (e) {
        createTempPathAndProceed(randomDirectory, tempPathName, res, proceedWithDownload, e);
    });
}

function proceedWithDownload(sourceDirectory, res) {

    // read all files from current directory
    fs.readdir(sourceDirectory + '/', function (err, files) {
        if (err) throw err;
        files.forEach(function (file) {

            var stepGroupsDir = sourceDirectory + '/' + file + '/apiproxy/stepgroups';
            var proxyDir = sourceDirectory + '/' + file + '/apiproxy/proxies';
            var proxyMigrator = new ProxyMigrator();
            proxyMigrator.on('finish', function (bundlePath, tempDir, proxyName) {
                // delete bundlePath after 10 Sec. (Find a better way).
                setTimeout(function () {
                    new PolicyTemplateUtil().deleteFolderRecursive(tempDir)
                }, 10000);
                // Now send the Zip contents as response
                var stat = fs.statSync(bundlePath);
                res.setHeader('Content-disposition', 'attachment; filename=' + proxyName + '.zip');
                res.writeHead(200, {'Content-Type': 'application/zip', 'Content-Length': stat.size});
                var readStream = fs.createReadStream(bundlePath);
                readStream.pipe(res);
                //res.write('files:\n\n'+files.length);
                // res.end();
            });
            proxyMigrator.processDownload(proxyDir);

        });

    });
}

process.on('uncaughtException', function (err) {
    // handle the error safely
    console.log(err);
});

module.exports = router;
