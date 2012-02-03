var _und = require('./underscore-min');
var ViewLibrary = exports.ViewLibrary = function (M) {

    this.M = M;
    //var that = Object.create(ViewLibrary);
    //return that;
};

ViewLibrary.prototype.lib = {};

ViewLibrary.prototype.tmpCode = function() {
    var that = this;
    Object.keys(this.M).forEach(function(val) {
        if (that.M[val] && that.M[val].type && that.M[val].isView) {
            that.lib[that.M[val].type] = (that.loop((that.M[val]), '', '', '', false, true));
        }
    });
}

ViewLibrary.prototype._childViews = {};

ViewLibrary.prototype.loop = function(obj, prepend, append, linePrepend, objectOnly, defaultValues) {
    var that = this,
        pre = prepend,
        post = append,
        msg = '',
        lines = linePrepend,
        val = '',
        children = '',
        k = '',
        count1 = 0,
        count2 = 0,
        childViews = {};

    //every objects gets an value property with its type
    obj.value = obj.type;

    if (obj.type === this.M.PageView.type) {
        return
    }

    if (!objectOnly) {
        msg += obj.type + '.design({\n';
    }

    if (obj) {

        if (obj.childViews) {
            childViews = obj.getChildViewsAsArray();
        }

        _und.each(obj, function(value, key) {
            if (typeof(value) !== 'function' && key !== '__proto__') {
                count1 += 1;
            }
        });

        _und.each(obj, function(value, key) {
            if (typeof(value) !== 'function' && key !== '__proto__') {

                count2 += 1;

                val = value;
                k = key;

                if (typeof(val) === 'string') {
                    val = "'" + val + "'";
                }

                _und.each(childViews, function(value) {
                    if (k === value) {
                        val = 'NOT';
                    }
                });

                if (key === 'recommendedEvents') {
                    children = val;
                    k = 'events'
                    val = '{\n';
                    var c1 = 0, c2 = 0;
                    _und.each(children, function(value, key) {
                        c1 += 1;
                    });
                    _und.each(children, function(value, key) {
                        c2 += 1;
                        val += '\t\t' + value + "\t: {\n";
                        val += '\t\t\ttarget: null,\n';
                        val += "\t\t\taction: ''\n";
                        if (c1 === c2) {
                            val += '\t\t}\n'
                        } else {
                            val += '\t\t},\n'
                        }
                    });

                    val += '\t}';
                }

                if (key === 'initialLocation' || key === 'location') {
//                    val = 'M.Location.extend({\n\t\tlatitude: 48.813338,\n\t\tlongitude: 9.178463\n\t})';
                    children = value;
                    val = 'M.Location.extend({\n';
                    var c1 = 0, c2 = 0;
                    _und.each(children, function(value, key) {
                        c1 += 1;
                    });
                    if (c1 === 0) {
                        val += '\t\tlatitude: 48.813338,\n\t\tlongitude: 9.178463\n';
                    }
                    _und.each(children, function(value, key) {
                        c2 += 1;
                        val += '\t\t' + value + "\t: {\n";
                        val += '\t\t\t' + key + ': ' + value + '\n';
                        if (c1 === c2) {
                            val += '\t\t}\n'
                        } else {
                            val += '\t\t},\n'
                        }
                    });

                    val += '\t})';
                }

                if (key === 'deleteButton') {
                    val = "M.ButtonView.design({\n\t\icon: 'delete',\n\t\tvalue: ''\n\t})";
                }

                if (key === 'searchBar') {
                    val = 'M.SearchBarView';
                }

                if (key && key === 'events') {
                    val = 'NOT';
                }

                if (key && key === 'type') {
                    val = 'NOT';
                }

                if (typeof(val) === 'boolean') {
                    val = value == true ? 'YES' : 'NO';
                }

                if (val === null || key === 'html') {
                    val = "''";
                }

                if(_und.isArray(value)){
//                    TODO build array with childViews
                    val = '[]';
                }   

                if (val !== 'NOT') {
                    if (defaultValues) {
                        msg += lines + '\t' + k + ': ' + val;
                        if (count1 !== count2) {
                            msg += ',\n'
                        } else {
                            msg += '\n'
                        }
                    }else if(!defaultValues && val !== "''"){
                        msg += lines + '\t' + k + ': ' + val;
                        if (count1 !== count2) {
                            msg += ',\n'
                        } else {
                            msg += '\n'
                        }
                    }
                }

            }
        });
    }

    if (!objectOnly) {
        msg += '})\n'
    }

    //prints the complete message from
    //console.log(msg);
    return pre + msg + post;
}

ViewLibrary.prototype.button = function(label, onclick){
    return '<div class="builder-close-btn"><a href="#" onClick="(' + onclick + ')();">' + label + '</a></div>'
}

ViewLibrary.prototype.editPopUp = function(obj){
    var metaAttr = obj.meta,
        id = obj.id;
    var html = '<div class="builder-edit-popup">';
    _und.each(metaAttr, function(value, key){
        html += key;
    });
    html += this.button('close', function(){
        console.log(id, 'close');
    });
    html += this.button('save', function(){
        console.log(id, 'save');
    });
    html += '</div>';
    return html;
}