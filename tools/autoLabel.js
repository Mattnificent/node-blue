
module.exports = function (str) {
    str = str || '';
    
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
        return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    }).replace(/\(.*\)/g, '').replace(/[\W_]/g, '');
};
    