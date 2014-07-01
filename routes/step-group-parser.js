var libxmljs = require("libxmljs");
var events = require('events');
var fs = require('fs');
var util = require('util');
require('./policy-constants');

var EventEmitter = events.EventEmitter;

var newLine = '\n';

/**
 * StepGroupParser Class.
 *
 * @constructor
 */
function StepGroupsParser(policyConstants) {
    this.policyConstants = policyConstants;
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
            groupFileMap = Object.merge(groupFileMap, generatePair(groupFilesArr[i], self.policyConstants));
        }
        self.emit('finish', groupFileMap);
    });
}

module.exports = StepGroupsParser;

// utility functions

function generatePair(groupFile, policyConstants) {
    var xmlDoc = libxmljs.parseXml(groupFile);
    var stepGroupNodes = xmlDoc.get('//'+ policyConstants.stepGroupsStr).childNodes();
    var stepGroupArr = [];
    for (var i=0; i< stepGroupNodes.length; i++) {
        if (stepGroupNodes[i].name() && stepGroupNodes[i].name()=== policyConstants.stepGroupStr) {
            var stepGroupName = stepGroupNodes[i].attr('name').value();
            stepGroupArr[stepGroupName]=getInnerXML(stepGroupNodes[i], stepGroupName, policyConstants);
        }
    }
    return stepGroupArr;
}

function getInnerXML(node, stepGroupName, policyConstants) {
    var childNodes = node.childNodes();
    var innerXML = '';
    var childNodesLen = childNodes.length;
    for (var i=0; i < childNodesLen; i++) {
        innerXML = innerXML+childNodes[i].toString();
    }

    return generatePadding(policyConstants, stepGroupName, true) + newLine + innerXML + newLine + generatePadding(policyConstants, stepGroupName, false);
}

function generatePadding(policyConstants, stepGroupName, isStart) {
    if (isStart) {
        return policyConstants.getStepGroupSectionStart().replace('##stepGroupName##', '##'+stepGroupName+'##');
    } else {
        return policyConstants.getStepGroupSectionEnd().replace('##stepGroupName##', '##' + stepGroupName + '##');
    }
}

Object.merge = function (destination, source) {
    for (var property in source) {
        if (source.hasOwnProperty(property)) {
            destination[property] = source[property];
        }
    }
    return destination;
};