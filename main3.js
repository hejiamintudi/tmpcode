// 本地版本的
const fs = require('fs');
let mainTab = require('./main2.js') // 统一一下,大家共用这个
let classArr = mainTab.classArr;
// let 头文件数组 = mainTab.头文件数组
let 头文件数组 = []
let 头文件 = `
import {sys, director} from 'cc';
`
let varTemplate = `
    public get #名字#(): #类型# {
        return this.getId(#id#, #默认#);
    }
    public set #名字#(value: #类型#) {
        if (this.setId(#id#, value, "#名字#")) {
            this._#名字#(value);
        }
    }
    protected _#名字#(value:#类型#) { // 单纯定义一下,具体内容要在扩展里自己定义
    }
`
/// 回调函数 ///
let varTemplate1 = `
    public get #名字#(): #类型# {
        return this.getId(#id#, #默认#);
    }
    public set #名字#(value: #类型#) {
        if (this.setId(#id#, value, "#名字#")) {
            #函数#
            this._#名字#(value);
        }
    }
    protected _#名字#(value:#类型#) { // 单纯定义一下,具体内容要在扩展里自己定义
    }
`
let classVarTemplate = `
    private #名字#_: #类型# | null = null; 
    public get #名字#(): #类型# | null {
        return this.#名字#_;
    }
    public set #名字#(value: #类型# | null) {
        if (value === this.#名字#_) { // 相同就不管了
            return;
        }
        this.#名字#_ = value;
        if (value !== null) {
            value.zzzzz_saveId = #id#; 
            value.zzzzz_saveName = "#名字#"; 
        }
        this._save(#id#, "#名字#");
        #函数#
        this._#名字#(value);
    }
    protected _#名字#(value:#类型#) { // 单纯定义一下,具体内容要在扩展里自己定义
    }
`

let arrVarTemplate = `
    private #名字#__: Array<#类型#> = null;
    private #名字#_: Array<#类型#> = null; // 暂时不管
    public get #名字#(): Array<#类型#> {
        return this.#名字#_
    }
    public set #名字#(value: Array<#类型#>) {
        if (value === this.#名字#__) { // 都不用管了
            return;
        }
        if (value === null) {
            this.#名字#__ = null;
            this.#名字#_ = null;
            this._save(#id#, "#名字#");
            return;
        }
        this.#名字#__ = value;
        let self = this;
        this.#名字#_ = new Proxy(value, {
            set: function(target: any, key: string, value1: any) {
                if (value1 === target[key]) {
                    return true;
                }
                target[key] = value1;
                self._save(#id#, "#名字#");
                #函数#
                this._#名字#(value);
                return true;
            }
        })
        this._save(#id#, "#名字#");
        #函数#
        this._#名字#(value);
    }
    protected _#名字#(value: Array<#类型#>) { // 单纯定义一下,具体内容要在扩展里自己定义
    }
`
let classArrVarTemplate = `
    private #名字#__: Array<#类型#> = null;
    private #名字#_: Array<#类型#> = null; // 暂时不管 proxy
    public get #名字#(): Array<#类型#> {
        return this.#名字#_
    }
    public set #名字#(value: Array<#类型#>) {
        if (this.#名字#__ === value) {
            return;
        }
        if (value === null) {
            this.#名字#__ = null;
            this.#名字#_ = null;
            this._save(#id#, "#名字#");
            return;
        }
        this.#名字#__ = value;
        let self = this;
        this.#名字#_ = new Proxy(value, {
            set: function(target: any, key: string, value1: any) {
                if (value1 === target[key]) {
                    return true;
                }
                target[key] = value1;
                if (value1) {
                    value1.zzzzz_saveId = #id#;    
                    value1.zzzzz_saveName = "#名字#"; 
                }
                self._save(#id#, "#名字#");
                #函数#
                this._#名字#(value);
                return true;
            }
        })
        this._save(#id#, "#名字#");
        #函数#
        this._#名字#(value);
    }
    protected _#名字#(value:Array<#类型#>) { // 单纯定义一下,具体内容要在扩展里自己定义
    }
`
let 加载普通变量 = {
    加载string: `
        value = sys.localStorage.getItem("#id#");
        if (value === null) {
            data[#id#] = #默认#
        }
        else {
            data[#id#] = value;
        }
`,
    加载number: `
        value = sys.localStorage.getItem("#id#");
        if (value === null) {
            data[#id#] = #默认#
        }
        else {
            data[#id#] = Number(value);
        }
`,
    加载boolean: `
        value = sys.localStorage.getItem("#id#");
        if (value === null) {
            data[#id#] = #默认#
        }
        else {
            data[#id#] = (value === "1"); 
        }
`
}
let 获取上传普通变量 = {
    上传string: `
    #id#: function (self) { // 普通子类
        return self._data[#id#];
    },
`,
    上传number: `
    #id#: function (self) { // 普通子类
        return self._data[#id#] + "";
    },
`,
    上传boolean: `
    #id#: function (self) { // 普通子类
        if (self._data[#id#]) {
            return "1";
        }
        else {
            return "0";
        }
    },
`
}

let 加载普通类 = `
        value = JSON.parse(sys.localStorage.getItem("#id#"));
        if (this.#名字# && value) {
            this.#名字#.zzzzz_load(value, #id#, "#名字#");    
            this.#名字#.zzzzz_model = this;   
        }
        else if (!this.#名字# && value) {
            this.#名字# = new #类名#();
            this.#名字#.zzzzz_load(value, #id#, "#名字#")
            this.#名字#.zzzzz_model = this;
            this.#名字#.zzzzz_saveId = #id#;
            this.#名字#.zzzzz_saveName = "#名字#"; 
        }
        else if (this.#名字# && !value) {
            this.#名字# = null;
        }
`
let 加载子类数组 = `
        dataArr = JSON.parse(sys.localStorage.getItem("#id#"));
        if (!dataArr) {
            this.#名字# = null;
        }
        else {
            nodeArr = []; // 加下划线的就是真实数组
            for (let i = 0; i < dataArr.length; i++) {
                let node = new #类名#();
                node.zzzzz_load(dataArr[i], #id#, "#名字#");
                node.zzzzz_model = this;
                nodeArr.push(node);
            } 
            this.#名字# = nodeArr as Array<#类名#>; // 到时候自有set get     
        }
`
let 加载普通数组 = `this.#名字# = JSON.parse(sys.localStorage.getItem("#id#")); // 到时候自有set get`

let 获取子类数据 = `
        if (!this.#名字#) {
            this._data[#id#] = null;
        }
        else {
            this._data[#id#] = this.#名字#.zzzzz_getSaveData()
        }
`
let 获取子类数组 = `
        if (!this.#名字#) {
            this._data[#id#] = null;
        }
        else {
            arr = this.#名字#;
            arr1 = [];
            for (let i = 0; i < arr.length; i++) {
                arr1.push(arr[i].zzzzz_getSaveData())
            }
            this._data[#id#] = arr1
        }
`
let 获取普通数组 = `this._data[#id#] = this.#名字#__`;
        // this._data[-id-] = this._-名字-_

let 获取上传普通数组 = `
        #id#: function (self) { // 普通数组
            return JSON.stringify(self.#名字#__)
        },
`
let 获取上传普通子类 = `
        #id#: function (self) { // 普通子类
            let data = self.#名字#;
            if (!data) {
                return "null";
            }
            return JSON.stringify(data.zzzzz_getSaveData());
        },
`
let 获取上传普通子类数组 = `
        #id#: function (self) { // 普通子类数组
            let arr = self.#名字#;
            if (!arr) {
                return "null";
            }
            else {
                let arr1 = [];
                for (let i = 0; i < arr.length; i++) {
                    arr1.push(arr[i].zzzzz_getSaveData())
                }
                return JSON.stringify(arr1);
            }
        },
`
// TODO: classTemplate
let classTemplate = `
let _self: any = null;
export class Model #继承# {
    public static getInstance(): Model {
        if (!_self) {
            return new Model();
        }
        return _self;
    }
    
    protected _data: any = []; // 这个只是当前类对应的的
    protected _saveFunTab:any = {
        // 
        #获取上传函数#
        // 1: function (self) { // 普通数组
        //     return self.#名字#__
        // },
        // 2: function (self) { // 普通子类
        //     let data = self.#名字#;
        //     if (!data) {
        //         return null;
        //     }
        //     return data.zzzzz_getSaveData();
        // },
        // 3: function (self) { // 普通子类数组
        //     let arr = self.#名字#;
        //     if (!arr) {
        //         return null;
        //     }
        //     else {
        //         arr1 = [];
        //         for (let i = 0; i < arr.length; i++) {
        //             arr1.push(arr[i].zzzzz_getSaveData())
        //         }
        //         return arr1;
        //     }
        // },

    }; // 获取存档内容的函数, 普通值就是从_data里获取就好了
    private saveTab: any = {}; // 记录改变的内容, 到时候一起上传
    #字段定义#
    public _save(id:number, name:string) { // 触发保存效果,就是值改变了
        _self.saveTab[id] = name;
        director.emit("change_" + name);
    }
    public static _update() { // 上传或者说保存代码 自动判断的
        if (!self) {
            return;
        }
        let tab = _self.saveTab;
        let isUpdate = false;
        for (let i in tab) {
            isUpdate = true;
            // let data = _self._data[i];
            director.emit("change1_" + tab[i]);
            tab[i] = _self._saveFunTab[i](_self);
            sys.localStorage.setItem(i, tab[i]);
            // ;
            // if (_self._saveFunTab[i]) {
            //     tab[i] = _self._saveFunTab[i](_self);
            // }
            // else {
            //     tab[i] = data;
            // }
        }
        // 上传,或者保存tab 现在不知道是否要合在一起发送
        if (isUpdate) {
            // ;
            _self.saveTab = {}; // 重置内容
        }
    }
    protected getId(id:number, defaultValue) {
        if (this._data[id] === undefined) { // 没定义返回默认值
            return defaultValue;
        }
        return this._data[id];
    }
    protected setId(id:number, value, name):boolean {
        if (this._data[id] === value) { // 相同就跳过
            return false;
        }
        this._data[id] = value;
        this._save(id, name);
        return true; 
    }
    constructor () {
        _self = this;
        this.zzzzz_load();
    }
    private zzzzz_load () {
        let data = [];
        let value = null;
#加载普通变量#
#加载普通类#
        // this.-名字-.zzzzz_load(data[-id-]);

        let dataArr = null; // 这个其实就是一个元素而已
        let nodeArr = null; // 子类数组
        let handler = null;
#加载子类数组#
        // dataArr = data[-id-];
        // nodeArr = []; // 加下划线的就是真实数组
        // for (let i = 0; i < dataArr.length; i++) {
        //     let node = new -类名-();
        //     node.zzzzz_load(data, zzzzz_saveId);
        //     nodeArr.push(node);
        // } 
        // this.-名字- = nodeArr as Array<-类名->; // 到时候自有set get 

#加载普通数组#
        // this.-名字- = data[-id-]; // 到时候自有set get 
        this._data = data;
    }
}
director.on("EVENT_AFTER_UPDATE", Model._update);
`

function gettype (data) { // 获取类型和默认值
    for (let i = 0; i < classArr.length; i++) {
        if (classArr[i] === data) { // 有这个class
            return data;
        }
    }
    return typeof data;
}

// function newclass(name, dataArr) { // 添加子类, 子类名, 到时候要处理的
//     let id = 0;
//     let varStr = ""; 
//     let _获取子类数据 = "";
//     let _获取子类数组 = "";
//     let _获取普通数组 = "";
//     let _加载普通类 = "";
//     let _加载子类数组 = "";
//     let _加载普通数组 = "";
//     for (let i = 0; i < dataArr.length; i++) {
//         let arr = dataArr[i];
//         if (Array.isArray(arr[0])) {
//             let type = gettype(arr[0][0]); // 第0个才是
//             if (typeof type !== "string") { // 特殊类的
//                 let 类型 = type.name;
//                 let 默认 = null;
//                 for (let j = 1; j < arr.length; j++) {
//                     let 名字 = arr[j];
//                     let str = "";

//                     str = classArrVarTemplate;
//                     str = str.replace(/#名字#/g, 名字);
//                     str = str.replace(/#类型#/g, 类型);
//                     varStr = varStr + str;

//                     str = 加载子类数组;
//                     str = str.replace(/#名字#/g, 名字);
//                     str = str.replace(/#id#/g, id);
//                     str = str.replace(/#类名#/g, 类型);
//                     _加载子类数组 = _加载子类数组 + str;

//                     str = 获取子类数组;
//                     str = str.replace(/#名字#/g, 名字);
//                     str = str.replace(/#id#/g, id);
//                     _获取子类数组 = _获取子类数组 + str;
//                     id++;
//                 }
//             }
//             else { // 普通类型的
//                 let 类型 = type;
//                 let 默认 = null;
//                 for (let j = 1; j < arr.length; j++) {
//                     let 名字 = arr[j];
//                     let str = "";

//                     str = arrVarTemplate;
//                     str = str.replace(/#名字#/g, 名字);
//                     str = str.replace(/#类型#/g, 类型);
//                     varStr = varStr + str;

//                     str = 加载普通数组;
//                     str = str.replace(/#名字#/g, 名字);
//                     str = str.replace(/#id#/g, id);
//                     _加载普通数组 = _加载普通数组 + str;

//                     str = 获取普通数组;
//                     str = str.replace(/#名字#/g, 名字);
//                     str = str.replace(/#id#/g, id);
//                     _获取普通数组 = 获取普通数组 + str;

//                     id++;
 
//                 }
//             }
//         }
//         else {
//             let type = gettype(arr[0]);
//             if (typeof type !== "string") { // 特殊类的
//                 let 类型 = type.name;
//                 let 默认 = null;
//                 for (let j = 1; j < arr.length; j++) {
//                     let 名字 = arr[j];
//                     let str = "";

//                     str = classVarTemplate;
//                     str = str.replace(/#名字#/g, 名字);
//                     str = str.replace(/#类型#/g, 类型);
//                     varStr = varStr + str;

//                     str = 加载普通类;
//                     str = str.replace(/#名字#/g, 名字);
//                     str = str.replace(/#id#/g, id);
//                     _加载普通类 = _加载普通类 + str;

//                     str = 获取子类数据;
//                     str = str.replace(/#名字#/g, 名字);
//                     str = str.replace(/#id#/g, id);
//                     _获取子类数据 = _获取子类数据 + str;

//                     id++;
 
//                     // let str = varTemplate.replace(/#名字#/g, arr[i]);
//                     // str = str.replace(/#id#/g, id++);
//                     // varStr = varStr + str.replace(/#类型#/g, type);
//                 }
//             }
//             else { // 普通类型的
//                 let 类型 = type;
//                 let 默认 = arr[0];
//                 for (let j = 1; j < arr.length; j++) {
//                     let 名字 = arr[j];
//                     let str = "";

//                     str = varTemplate;
//                     str = str.replace(/#名字#/g, 名字);
//                     str = str.replace(/#默认#/g, 默认);
//                     str = str.replace(/#类型#/g, 类型);
//                     str = str.replace(/#id#/g, id++);
//                     varStr = varStr + str;
//                 }
//             }
            
//         }
//     }
//     let js = classTemplate;
//     js = js.replace(/#类名#/g, name);
//     js = js.replace(/#字段定义#/g, varStr);
//     js = js.replace(/#获取子类数据#/g, _获取子类数据);
//     js = js.replace(/#获取子类数组#/g, _获取子类数组);
//     js = js.replace(/#获取普通数组#/g, _获取普通数组);
//     js = js.replace(/#加载普通类#/g, _加载普通类);
//     js = js.replace(/#加载子类数组#/g, _加载子类数组);
//     js = js.replace(/#加载普通数组#/g, _加载普通数组);
//     mainJs += js; // 添加到主js里
//     return {name: name}; // 返回这个就好了,到时候会自己处理了
// }
let getStr = function (str, 名字, id, 类型, 函数) {
    if (函数) {
        str = str.replace(/#函数#/g, "this." + 函数 + "(value)");
    }
    else {
        str = str.replace(/#函数#/g, "");
    }
    str = str.replace(/#名字#/g, 名字);
    str = str.replace(/#id#/g, id);
    str = str.replace(/#类名#/g, 类型);
    str = str.replace(/#类型#/g, 类型);
    return str;
}
function mainclass(继承, ...dataArr) { // 添加子类, 子类名, 到时候要处理的 // TODO:mainclass
    if (typeof 继承 !== "string") { // 这个是继承的内容
        dataArr = [继承, ...dataArr]; // 放回这里
        继承 = "";
    }
    else {
        头文件数组.push(继承)
    }
    
    let id = 0;
    let varStr = ""; 
    let _加载普通变量 = "";
    let _加载普通类 = "";
    let _加载子类数组 = "";
    let _加载普通数组 = "";
    let _获取上传函数 = "";
    for (let i = 0; i < dataArr.length; i++) {
        let arr = dataArr[i];
        if (Array.isArray(arr[0])) {
            let type = gettype(arr[0][0]); // 第0个才是
            if (typeof type !== "string") { // 特殊类的
                let 类型 = type.name;
                let 默认 = null;
                头文件数组.push(类型)
                for (let j = 1; j < arr.length; j++) {
                    let 名字 = arr[j];

                    let arr2 = 名字.split(":");
                    名字 = arr2[0];
                    let 函数 = arr2[1]; // 如果没有就是空的
                    if (!函数) {
                        函数 = "";
                    }

                    let str = "";

                    varStr += getStr(classArrVarTemplate, 名字, id, 类型, 函数);
                    _加载子类数组 += getStr(加载子类数组, 名字, id, 类型, 函数);
                    _获取上传函数 += getStr(获取上传普通子类数组, 名字, id, 类型, 函数);
                    
                    id++;
                }
            }
            else { // 普通数组的
                let 类型 = type;
                let 默认 = null;
                for (let j = 1; j < arr.length; j++) {
                    let 名字 = arr[j];

                    let arr2 = 名字.split(":");
                    名字 = arr2[0];
                    let 函数 = arr2[1]; // 如果没有就是空的
                    if (!函数) {
                        函数 = "";
                    }

                    varStr += getStr(arrVarTemplate, 名字, id, 类型, 函数);
                    _加载普通数组 += getStr(加载普通数组, 名字, id, 类型, 函数);
                    _获取上传函数 += getStr(获取上传普通数组, 名字, id, 类型, 函数);
                    // let str = "";

                    // str = arrVarTemplate;
                    // str = str.replace(/#名字#/g, 名字);
                    // str = str.replace(/#类型#/g, 类型);
                    // varStr = varStr + str;

                    // str = 加载普通数组;
                    // str = str.replace(/#名字#/g, 名字);
                    // str = str.replace(/#id#/g, id);
                    // _加载普通数组 = _加载普通数组 + str;

                    // str = 获取普通数组;
                    // str = str.replace(/#名字#/g, 名字);
                    // str = str.replace(/#id#/g, id);
                    // _获取普通数组 = 获取普通数组 + str;

                    id++;
 
                }
            }
        }
        else {
            let type = gettype(arr[0]);
            if (typeof type !== "string") { // 特殊类的
                let 类型 = type.name;
                头文件数组.push(类型)
                let 默认 = null;
                for (let j = 1; j < arr.length; j++) {
                    let 名字 = arr[j];

                    let arr2 = 名字.split(":");
                    名字 = arr2[0];
                    let 函数 = arr2[1]; // 如果没有就是空的
                    if (!函数) {
                        函数 = "";
                    }

                    let str = "";

                    varStr += getStr(classVarTemplate, 名字, id, 类型, 函数);
                    
                    _加载普通类 += getStr(加载普通类, 名字, id, 类型, 函数);
                    _获取上传函数 += getStr(获取上传普通子类, 名字, id, 类型, 函数);
                    // str = classVarTemplate;
                    // str = str.replace(/#名字#/g, 名字);
                    // str = str.replace(/#类型#/g, 类型);
                    // varStr = varStr + str;

                    // str = 加载普通类;
                    // str = str.replace(/#名字#/g, 名字);
                    // str = str.replace(/#id#/g, id);
                    // _加载普通类 = _加载普通类 + str;

                    // str = 获取子类数据;
                    // str = str.replace(/#名字#/g, 名字);
                    // str = str.replace(/#id#/g, id);
                    // _获取子类数据 = _获取子类数据 + str;

                    id++;
 
                    // let str = varTemplate.replace(/#名字#/g, arr[i]);
                    // str = str.replace(/#id#/g, id++);
                    // varStr = varStr + str.replace(/#类型#/g, type);
                }
            }
            else { // 普通类型的
                let 类型 = type;
                let 默认 = arr[0];
                if (typeof 默认 === "string") {
                    默认 = "'" + 默认 + "'";
                }
                for (let j = 1; j < arr.length; j++) {
                    let 名字 = arr[j];

                    let arr2 = 名字.split(":");
                    名字 = arr2[0];
                    let 函数 = arr2[1]; // 如果没有就是空的
                    if (!函数) {
                        函数 = "";
                    }
                    let str = "";
                    if (函数) { // 这个才是需要被使用的
                        str = varTemplate1
                    }
                    else {
                        str = varTemplate;
                    }
                    str = getStr(varTemplate, 名字, id, 类型, 函数);
                    str = str.replace(/#默认#/g, 默认);
                    varStr += str;

                    _加载普通变量 += (getStr(加载普通变量["加载" + 类型], 名字, id, 类型, 函数).replace(/#默认#/g, 默认));
                    _获取上传函数 += getStr(获取上传普通变量["上传" + 类型], 名字, id, 类型, 函数);
                    id++
                    // str = varTemplate;
                    // str = str.replace(/#名字#/g, 名字);
                    // str = str.replace(/#默认#/g, 默认);
                    // str = str.replace(/#类型#/g, 类型);
                    // str = str.replace(/#id#/g, id++);
                    // varStr = varStr + str;
                }
            }
            
        }
    }
    let js = classTemplate;
    
    // js = js.replace(/#类名#/g, name);
    js = js.replace(/#字段定义#/g, varStr);
    // js = js.replace(/#获取子类数据#/g, _获取子类数据);
    // js = js.replace(/#获取子类数组#/g, _获取子类数组);
    // js = js.replace(/#获取普通数组#/g, _获取普通数组);
    js = js.replace(/#加载普通类#/g, _加载普通类);
    js = js.replace(/#加载普通变量#/g, _加载普通变量);
    js = js.replace(/#加载子类数组#/g, _加载子类数组);
    js = js.replace(/#加载普通数组#/g, _加载普通数组);
    js = js.replace(/#加载普通数组#/g, _加载普通数组);
    js = js.replace(/#获取上传函数#/g, _获取上传函数);

    if (继承) {
        继承 = " extends  " + 继承 + " "; // 补全代码
        头文件数组.push(继承)
    }
    js = js.replace(/#继承#/g, 继承);
    let folderPath = "../assets/Script/Model";
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
        console.log('Folder created!');
      } else {
        console.log('Folder already exists!');
      }
    // mainJs += js; // 添加到主js里
    头文件数组 = [...new Set(头文件数组)];
    for (let i = 0; i < 头文件数组.length; i++) {
        let str = ("import { 类名 } from './类名';\n").replace(/类名/g, 头文件数组[i]);
        头文件 += str;
    }
    fs.writeFile('../assets/Script/Model/Model.ts', 头文件 + js, (err) => {
        if (err) throw err;
        console.log('Model.ts 已经生成');
    });
}


// // data
// function adddata(dataArr) { // 添加主类 
//     let id = 0;
//     let varStr = "";
//     for (let i = 0; i < dataArr.length; i++) {
//         let arr = dataArr[i];
        
//         if (Array.isArray(arr[0])) {
//             let type = typeof arr[0][0]; // 第0个才是
//             for (let j = 1; j < arr.length; j++) {
//                 let str = boolTemplate.replace(/#名字#/g, arr[i]);
//                 str = str.replace(/#id#/g, id++);
//                 varStr = varStr + str.replace(/#类型#/g, type);
//             }
//         }
//         else if (typeof arr[0] === "boolean") {
//             let type = typeof arr[0];
//             for (let j = 1; j < arr.length; j++) {
//                 let str = boolTemplate.replace(/#名字#/g, arr[i]);
//                 str = str.replace(/#id#/g, id++);
//                 varStr = varStr + str.replace(/#类型#/g, type);
//             }
//         }
//         else {
//             let type = typeof arr[0];
//             for (let j = 1; j < arr.length; j++) {
//                 let str = varTemplate.replace(/#名字#/g, arr[i]);
//                 str = str.replace(/#id#/g, id++);
//                 varStr = varStr + str.replace(/#类型#/g, type);
//             }
//         }

//     }
// }
mainTab.fun = mainclass;
module.exports = mainTab;