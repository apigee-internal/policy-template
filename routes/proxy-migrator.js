var libxmljs = require("libxmljs");
var events = require('events');
var fs = require('fs');
var util = require('util');
var Zip = require('adm-zip');
var PolicyTemplateUtil = require('./policy-template-utils');

var EventEmitter = events.EventEmitter;

var stepGroupElementRegex = /<StepGroup name="(\w+)"\/>/g;

/**
 * ProxyMigrator Class.
 *
 * @constructor
 */
function ProxyMigrator() {
    EventEmitter.call(this);
    return( this );
}

util.inherits(ProxyMigrator, EventEmitter);

ProxyMigrator.prototype.processUpload = function (proxyDir, groupsMap) {
    var self = this;
    fs.readdir(proxyDir + '/', function (err, proxyFiles) {
        proxyFiles.forEach(function (proxyFile) {
            var data = fs.readFileSync(proxyDir+'/'+ proxyFile, 'utf8');
            var replacedData = replaceStepGroups(groupsMap, data);
            fs.writeFileSync(proxyDir + '/' + proxyFile, replacedData);
        });
        // now zip files
        var bundleDir = proxyDir.substring(0, proxyDir.indexOf('/apiproxy/proxies'));
        var proxyName = bundleDir.substring(bundleDir.lastIndexOf('/') + 1, bundleDir.length);
        // /Users/vinoth/Downloads/test/MessagingAPI/apiproxy/proxies
        var tempDir = proxyDir.substring(0, proxyDir.indexOf('/'+proxyName+'/apiproxy/proxies'));
        // remove stepgroups dir before zipping
        var stepGroupsDir = bundleDir+'/apiproxy/stepgroups';
        new PolicyTemplateUtil().deleteFolderRecursive(stepGroupsDir);
        var zip = new Zip();
        zip.addLocalFolder(bundleDir, proxyName);
        zip.writeZip(bundleDir + '.zip');
        self.emit('finish', bundleDir + '.zip', tempDir, proxyName);
    });
}

ProxyMigrator.prototype.processDownload = function (proxyDir) {
    var self = this;
    fs.readdir(proxyDir + '/', function (err, proxyFiles) {
        var bundleDir = proxyDir.substring(0, proxyDir.indexOf('/apiproxy/proxies'));
        var apiProxyDir = proxyDir.substring(0, proxyDir.indexOf('/proxies'));
        var proxyName = bundleDir.substring(bundleDir.lastIndexOf('/') + 1, bundleDir.length);
        var tempDir = proxyDir.substring(0, proxyDir.indexOf('/' + proxyName + '/apiproxy/proxies'));

        proxyFiles.forEach(function (proxyFile) {
            var data = fs.readFileSync(proxyDir + '/' + proxyFile, 'utf8');
            // find the padding for step group generated.
            var xmlDoc = libxmljs.parseXml(data);
            var commentNodes = xmlDoc.find('//comment()');
            // var commentNodes = commentParentNode ?  commentParentNode.childNodes() : [];
            var stepGroupArr = [];
            for (var i=0; i < commentNodes.length; i++) {
                var currCommentNode = commentNodes[i];
                var currCommentStr = currCommentNode.toString();
                if (currCommentStr.indexOf('<!-- generated section for stepgroup')>-1 && currCommentStr.indexOf('begins')>-1) {
                    // get the content and remove nodes till end padding
                    var stepGroupName = extractStepGroupNameFromComment(currCommentNode.toString());
                    var stepGroupPair = removeSnippetAndGetStepGroupPair(xmlDoc, currCommentNode, stepGroupName);
                    if (!stepGroupArr[stepGroupName]) {
                        stepGroupArr = Object.merge(stepGroupArr, stepGroupPair);
                    }

                }
            }
            var proxyFileContent = xmlDoc.toString();
            fs.writeFileSync(proxyDir + '/' + proxyFile, proxyFileContent);
            if (!fs.existsSync(apiProxyDir + '/stepgroups')) {
                fs.mkdirSync(apiProxyDir+'/stepgroups');
            }
            for (var stepGroupName in stepGroupArr) {
                if (stepGroupArr.hasOwnProperty(stepGroupName)) {
                    var stepGroupData = addStepGroupPadding(stepGroupName, stepGroupArr[stepGroupName]);
                    fs.writeFileSync(apiProxyDir+'/stepgroups/'+stepGroupName+'.xml',stepGroupData);
                }
            }
        });
        // now zip files
        var zip = new Zip();
        zip.addLocalFolder(bundleDir, proxyName);
        zip.writeZip(bundleDir + '.zip');
        self.emit('finish', bundleDir + '.zip', tempDir, proxyName);
    });
}

function removeSnippetAndGetStepGroupPair(xmlDoc, commentNode, stepGroupName) {
    var nextSibling = commentNode.nextSibling();

    var stepGroupData = '';
    while(nextSibling) {
        var siblingStr = nextSibling.toString();
        if (siblingStr.indexOf('!-- generated section for stepgroup ##'+stepGroupName+'## ends')>-1) {
            nextSibling.remove();
            nextSibling = undefined;
        } else {
            stepGroupData = stepGroupData + siblingStr;
            var prevSibling = nextSibling;
            nextSibling = nextSibling.nextSibling();
            prevSibling.remove();
        }
    }
    var stepGroupElement = new libxmljs.Element(xmlDoc, 'StepGroup');
    stepGroupElement.attr({'name':stepGroupName});
    commentNode.addNextSibling(stepGroupElement);
    commentNode.remove();
    var stepGroupArr = [];
    stepGroupArr[stepGroupName] = stepGroupData;
    return stepGroupArr;
}

function addStepGroupPadding(stepGroupName, stepGroupData) {
    var topPadding = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<StepGroups>\n<StepGroup name="'+stepGroupName+'">\n';
    var bottomPadding = '\n</StepGroup>\n</StepGroups>';
    return topPadding+stepGroupData+bottomPadding;
}

function replaceStepGroups(hash, obj) {
    var k = obj,
        re = stepGroupElementRegex, // reconsider spaces (handle space with regex)
        parts = k.match(re) || [],
        t, p = undefined;

    while ((t = parts.shift())) {
        p = extractStepGroupName(t);
        k = k.replace(t, hash[p] === undefined ? t : hash[p]);
    }
    return k;
}

function extractStepGroupName(obj) {
    // assuming name is the only attribute
    var re = /"(\w+)"/g;
    var t = obj.match(re)[0];
    t = t.substring(1, t.length - 1);
    return t;
}

function extractStepGroupNameFromComment(obj) {
    // assuming name is the only attribute
    var re = /#(\w+)#/g;
    var t = obj.match(re)[0];
    t = t.substring(1, t.length - 1);
    return t;
}

Object.merge = function (destination, source) {
    for (var property in source) {
        if (source.hasOwnProperty(property)) {
            destination[property] = source[property];
        }
    }
    return destination;
};

module.exports = ProxyMigrator;

//(new ProxyMigrator()).processUpload('/Users/vinoth/Downloads/MessagingAPI/apiproxy/proxies');
