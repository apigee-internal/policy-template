var fs = require('fs');

function PolicyTemplateUtil () {

}

// deletes the folder recursively.
PolicyTemplateUtil.prototype.deleteFolderRecursive = function(path) {
    var files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                new PolicyTemplateUtil().deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

module.exports = PolicyTemplateUtil;