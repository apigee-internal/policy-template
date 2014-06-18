var libxmljs = require("libxmljs");
var events = require('events');
var fs = require('fs');
var util = require('util');

var EventEmitter = events.EventEmitter;
var stepGroupSectionStart = '<!-- generated section for stepgroup ##stepGroupName## begins. PLEASE DO NOT REMOVE THIS -->';
var stepGroupSectionEnd = '<!-- generated section for stepgroup ##stepGroupName## ends. PLEASE DO NOT REMOVE THIS -->';

var newLine = '\n';

/**
 * StepGroupParser Class.
 *
 * @constructor
 */
function StepGroupsParser() {
    EventEmitter.call(this);
    return( this );
}

util.inherits(StepGroupsParser, EventEmitter);

StepGroupsParser.prototype.process = function (dir) {
    var self = this;
    fs.readdir(dir + '/', function (err, groupFiles) {
        var groupFilesArr=[];
        var groupFileMap = [];
        groupFiles.forEach(function (groupFile) {
            var data = fs.readFileSync(dir+'/'+groupFile, 'utf8');
            groupFilesArr.push(data);
        });
        for (var i=0; i< groupFilesArr.length; i++) {
            groupFileMap = Object.merge(groupFileMap, generatePair(groupFilesArr[i]));
        }
        self.emit('finish', groupFileMap);
    });
}

function generatePair(groupFile) {
    var xmlDoc = libxmljs.parseXml(groupFile);
    var stepGroupNodes = xmlDoc.get('//StepGroups').childNodes();
    var stepGroupArr = [];
    for (var i=0; i< stepGroupNodes.length; i++) {
        if (stepGroupNodes[i].name() && stepGroupNodes[i].name()==='StepGroup') {
            var stepGroupName = stepGroupNodes[i].attr('name').value();
            stepGroupArr[stepGroupName]=getInnerXML(stepGroupNodes[i], stepGroupName);
        }
    }
    return stepGroupArr;
}

function getInnerXML(node, stepGroupName) {
    var childNodes = node.childNodes();
    var innerXML = '';
    var childNodesLen = childNodes.length;
    for (var i=0; i < childNodesLen; i++) {
        innerXML = innerXML+childNodes[i].toString();
    }

    return generatePadding(stepGroupName, true) + newLine + innerXML + newLine + generatePadding(stepGroupName, false);
}

function generatePadding(stepGroupName, isStart) {
    if (isStart) {
        return stepGroupSectionStart.replace('##stepGroupName##', '##'+stepGroupName+'##');
    } else {
        return stepGroupSectionEnd.replace('##stepGroupName##', '##' + stepGroupName + '##');
    }
}

module.exports = StepGroupsParser;

Object.merge = function (destination, source) {
    for (var property in source) {
        if (source.hasOwnProperty(property)) {
            destination[property] = source[property];
        }
    }
    return destination;
};


//Testing Code
//var stepParser = new StepGroupsParser();
//stepParser.processUpload('/Users/vinoth/Downloads/MessagingAPI/apiproxy/stepgroups');
//stepParser.on('finish', function (testArr) {
//    for (var j in testArr) {
//        if (testArr.hasOwnProperty(j)) {
//            console.dir(j + ' : ' + testArr[j]);
//        }
//    }
//});