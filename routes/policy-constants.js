/**
 * Creates an instance of PolicyConstants based on whether its the
 * Constants are for Legacy Policy conventions or for the new one
 * @param isOldFormat
 * @constructor
 */
function PolicyConstants(isOldFormat) {
    if (isOldFormat) {
        this.stepGroupStr = 'StepGroup';
        this.stepGroupsStr = 'StepGroups';
        this.stepGroupElementRegex = /<StepGroup name="(\w+)"\/>/g;
    } else {
        this.stepGroupStr = 'PolicyGroup';
        this.stepGroupsStr = 'PolicyGroups';
        this.stepGroupElementRegex = /<PolicyGroup name="(\w+)"\/>/g;
    }
}

/**
 * Gives the top Padding which identifies the start of the
 * block which represents the contents of the Step Group
 * @param stepGroupName
 * @returns {string}
 */
PolicyConstants.prototype.getTopPadding = function (stepGroupName) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<' + this.stepGroupsStr + '>\n<' + this.stepGroupStr + ' name="' + stepGroupName + '">\n';
}

/**
 * Gives the bottom padding which identifies the end of the
 * block which represents the contents of the Step Group.
 *
 * @returns {string}
 */
PolicyConstants.prototype.getBottomPadding = function () {
    return '\n</' + this.stepGroupsStr + '>\n</' + this.stepGroupsStr + '>';
}

/**
 * // TODO:
 * @returns {string}
 */
PolicyConstants.prototype.getStepGroupSectionStart = function () {
    return '<!-- generated section for ' + this.stepGroupStr + ' ##stepGroupName## begins. PLEASE DO NOT REMOVE THIS -->';
}

/**
 * // TODO:
 * @returns {string}
 */
PolicyConstants.prototype.getStepGroupSectionEnd = function () {
    return '<!-- generated section for ' + this.stepGroupStr + ' ##stepGroupName## ends. PLEASE DO NOT REMOVE THIS -->';
}

module.exports = PolicyConstants;