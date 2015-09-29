/**
 * 类似riot的js模板工具
 *
 * 低版本浏览器中forEach
 * 节点属性中{}内部属性分类
 *     外部处理属性： if,each
 *     布尔属性： disabled
 *     类属性: {class1:true,class2:false}
 *     js表达式 {bool ? class1 : class2}
 *
 * todo:
 * 自关闭标签自动关闭
 */

var jstemplate = (function () {
    var setting = {
        selfCloseTag: 'br,img,hr',
        handleAttr: {
            if: function (val) {
                return '\nif(' + val + '){';
            },
            each: function (val) {
                var pats = val.split(' in ');
                if (pats.length == 2) {
                    var left = pats[0].split(',');
                    if (left.length > 0) {
                        if (left.length == 1) {
                            left.unshift('_$index');
                        }
                        return '\nfor(var ' + left[0] + ' in ' + pats[1] + '){var ' + left[1] + '=' + pats[1] + '[' + left[0] + '];';
                    }
                }
                return '\nfor(' + val + '){';
            }
        },
        boolAttr: 'enable,disabled,checked'
    }

    function addHTML(html) {
        return html ? "_$+='" + html + "';":'';
    }

    function addCode(c) {
        return c ? "_$+=" + c + ';' : '';
    }

    /*编译带有{}的字符串*/
    function compileString(tpl) {
        var js = '', start = 0;
        tpl.replace(/\{([^}]*)\}/g, function (a, b, c) {
            // console.log(a,b,c);
            js += addHTML(tpl.substring(start, c));
            // 判断是否是class1:true,class2:false格式
            if (/^\s*\w+\s*\:/.test(b)) {
                var attrs = b.split(',');
                attrs.forEach(function (attr) {
                    var val = attr.split(':');
                    js += addCode(val[1] + ' ? " ' + val[0] + '":""');
                });
            } else {
                js += addCode(b);
            }
            start = c + a.length;
        });
        if(start > 0){
            return start < tpl.length ? js + addHTML(tpl.substring(start, tpl.length)) : js;
        }
        return addHTML(tpl);
    }

    /*通过dom编译后的函数代码*/
    function compileDom(e) {
        // console.log(e);
        if (!e.tagName) {
            return compileString(e.textContent);
        }
        var outerHtml = e.outerHTML;
        if (outerHtml.indexOf('{') < 0) {
            return addHTML(outerHtml);
        }
        var tag = e.tagName.toLowerCase();
        var code = addHTML('<' + tag );
        var beforeCode = '', afterCode = '';
        // 自身节点属性
        var len = e.attributes.length;
        if (len > 0) {
            for (var i = 0; i < len; i++) {
                var attr = e.attributes[i];
                var name = attr.name, value = attr.value;
                if (setting.handleAttr[name]) {
                    // 是否被大括号括起来
                    if (/^\s*\{([^}]*)\}\s*$/.test(value)) {
                        beforeCode += setting.handleAttr[name](RegExp.$1);
                        afterCode += '\n}';
                    } else {
                        code += addCode("'"+name+"'=\""+value+'"');
                    }
                } else {
                    // 属性值是否被大括号括起来
                    if (/^\s*\{([^}]*)\}\s*$/.test(value)) {
                        // bool属性，例如disabled
                        if ((',' + setting.boolAttr + ',').indexOf(',' + name + ',') >= 0) {
                            code += '\n_$ += (' + RegExp.$1 + '? "' + name + '":"");';
                        } else {
                            code += '\n_$ +=" ' + name + '"=' + compileString(value);
                        }
                    } else {
                        code += '\n_$ +=\' ' + name + '=\"' + value + '"\';';
                    }
                }
            }
        }
        code += '\n_$ +=\'>\';';
        // 添加子节点代码
        len = e.childNodes.length;
        if (len) {
            var children = e.childNodes;
            for (var i = 0; i < len; i++) {
                code += compileDom(children[i]);
            }
        }
        // console.log('code', code);
        return ('\n' + beforeCode + code + '\n_$ +=\'</' + tag + '>\';' + afterCode + '').replace(/[\r\t\n]/g, '').replace(/';_\$\s*\s*\+=\s*'/g, '');
    }

//compileString('{class1:true,class2:false}')
    // compile('test', tpl);
    function jstemplate(tpl) {
        var div = document.createElement('div');
        div.innerHTML = tpl;
        var code = '', len = div.childNodes.length, i = 0, childNodes = div.childNodes;
        while (i < len) {
            code += compileDom(childNodes[i]);
            i++;
        }
        return new Function('that', 'var _$="";with(that){' + code.replace(/[\r\t\n]/g, '').replace(/';_\$\s*\s*\+=\s*'/g, '') + '} return _$;');
    }
// _$+='<div color="test">';_$+=test;_$ +='</div>';
    return jstemplate;
})();
