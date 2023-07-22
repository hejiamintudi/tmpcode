const fs = require('fs');
const main = require('./main2.js')
let classArr = main.classArr;
let mainJs = ""; // 最总输出的内容
// let 头文件数组 = main.头文件数组; // 记录添加在当前场景添加了什么类
let 头文件数组 = []; // 改为自己算自己的,别管他人了, 返回的是别人的内容, 单独生成一个文件

let varTemplate = `
    public get #名字#(): #类型# {
        return this.getId(#id#, #默认#);
    }
    public set #名字#(value: #类型#) {
        if (this.setId(#id#, value)) {
            this._#名字#(value);
        }
    }
    protected _#名字#(value:#类型#) { // 单纯定义一下,具体内容要在扩展里自己定义
    }
    
`
/// 回调函数 /// 暂时不处理
let varTemplate1 = `
    public get #名字#(): #类型# {
        return this.getId(#id#, #默认#);
    }
    public set #名字#(value: #类型#) {
        if (this.setId(#id#, value)) {
            #函数#
            this._#名字#(value);
        }
    }
    protected _#名字#(value:#类型#) { // 单纯定义一下,具体内容要在扩展里自己定义
    }
`
let classVarTemplate = `
    private #名字#_: #类型# | null = null; 
    public get #名字#(): #类型# | null  {
        return this.#名字#_;
    }
    public set #名字#(value: #类型# | null) {
        if (value === this.#名字#_) { // 相同就不管了
            return;
        }
        this.#名字#_ = value;
        if (value !== null) {
            value.zzzzz_saveId = this.zzzzz_saveId; 
            value.zzzzz_saveName = this.zzzzz_saveName; 
        }
        this._save();
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
            this._save();
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
                self._save();
                #函数#
                this._#名字#(value);
                return true;
            }
        })
        self._save();
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
            this._save();
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
                    value1.zzzzz_saveId = this.zzzzz_saveId;    // zzzzz_saveName
                    value1.zzzzz_saveName = this.zzzzz_saveName;    // zzzzz_saveName
                }
                self._save();
                #函数#
                this._#名字#(value);
                return true;
            }
        })
        this._save();
        #函数#
        this._#名字#(value);
    }
    protected _#名字#(value:Array<#类型#>) { // 单纯定义一下,具体内容要在扩展里自己定义
    }
`

let 加载普通类 = `
        if (this.#名字# && data[#id#]) {
            this.#名字#.zzzzz_load(data[#id#], this.zzzzz_saveId, this.zzzzz_saveName);    
        }
        else if (!this.#名字# && data[#id#]) {
            this.#名字# = new #类名#();
            this.#名字#.zzzzz_load(data[#id#], this.zzzzz_saveId, this.zzzzz_saveName)
            // this.#名字#.zzzzz_saveId = this.zzzzz_saveId;
        }
        else if (this.#名字# && !data[#id#]) {
            this.#名字# = null;
        }
`
let 加载子类数组 = `
        dataArr = data[#id#];
        if (!dataArr) {
            this.#名字# = null;
        }
        else {
            nodeArr = []; // 加下划线的就是真实数组
            for (let i = 0; i < dataArr.length; i++) {
                let node = new #类名#();
                node.zzzzz_load(dataArr[i], this.zzzzz_saveId, this.zzzzz_saveName);
                nodeArr.push(node);
            } 
            this.#名字# = nodeArr as Array<#类名#>; // 到时候自有set get     
        }
`
let 加载普通数组 = `this.#名字# = data[#id#]; // 到时候自有set get`

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

// TODO: classTemplate
let classTemplate = `
#头文件#
export  class #类名# #继承# {
    protected _data: any = []; // 这个只是当前类对应的的
    public zzzzz_model: any = null; // 
    public zzzzz_saveId: number = -1; // 直接保存对应属性就好了
    public zzzzz_saveName: string = ""; // 直接保存对应属性名
    #字段定义#
    protected _save() { // 触发保存效果,就是值改变了
        this.zzzzz_model._save(this.zzzzz_saveId, this.zzzzz_saveName);
    }
    protected getId(id:number, defaultValue) {
        if (this._data[id] === undefined) { // 没定义返回默认值
            return defaultValue;
        }
    }
    protected setId(id:number, value):boolean { // 返回这个值是否被改变了
        if (this._data[id] === value) { // 相同就跳过
            return false;
        }
        this._data[id] = value;
        this._save(); 
        return true;
    }
    public zzzzz_load (data, zzzzz_saveId, zzzzz_saveName) {
        this._data = data;
        this.zzzzz_saveId = zzzzz_saveId;
        this.zzzzz_saveName = zzzzz_saveName;
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
    }

    public zzzzz_getSaveData () { // 获取当前类的数据
#获取子类数据#
        // if (!this.-名字-) {
        //     this._data[-id-] = null;
        // }
        // else {
        //     this._data[-id-] = this.-名字-.zzzzz_getSaveData()
        // }

        let arr = null
        let arr1 = null

#获取子类数组#
        // if (!this.-名字-) {
        //     this._data[-id-] = null;
        // }
        // else {
        //     arr = this.-名字-;
        //     arr1 = [];
        //     for (let i = 0; i < arr.length; i++) {
        //         arr1.push(arr[i].zzzzz_getSaveData())
        //     }
        //     this._data[-id-] = arr1
        // }


#获取普通数组#
        // this._data[-id-] = this._-名字-_


        return this._data; // 
    }
    
}
`

// // 主类
// let ModelTemplate = ` 
// class #类名# = {
//     public _data = []; // 这个只是当前类对应的的
//     public zzzzz_saveId: number = #存档id#; // -1 是总的, 不需要另外上传,其他需要
//     getId(id:number, defaultValue) {
//         if (this._data[id] === undefined) { // 没定义返回默认值
//             return defaultValue;
//         }
//     }
//     setId(id:number, value) {
//         if (this._data[id] === value) { // 相同就跳过
//             return;
//         }
//         this._data[id] = value;
//         Model.sava(this.zzzzz_saveId); 
//     }
//     #字段定义#
//     init () {
//         #初始化#
//     }
// }
// `
function gettype (data) { // 获取类型和默认值
    for (let i = 0; i < classArr.length; i++) {
        if (classArr[i] === data) { // 有这个class
            return data;
        }
    }
    return typeof data;
}
// TODO: newclass
// name 可能是数组， 第一个是子类， 第二个是model类名， 第三个和第四个 可能就是需要基础的父类，或者父类data
function newclass(name, ...dataArr) { // 添加子类, 子类名, 到时候要处理的
    let id = 0; // 需要记录的是 name：model的类名， childName：子类名， 
    let 子类名_ = "";
    let 继承 = "";
    if (Array.isArray(name)) {
        if (name[0]) {
            子类名_ = name[0];
            // 头文件数组.push(子类名_);
        }
        else {
            子类名_ = name[1];
        }
        let fun = function (data) {
            if (typeof data === "string") { // 这个代表需要直接基础的父类
                继承 = data;
                头文件数组.push(继承);
                // 头文件数组.push(继承);
            }
            else if (data !== undefined) {
                if (!继承) {
                    继承 = data.name;
                    头文件数组.push(data.name);
                }
                id = data.num;
            }
        }
        fun(name[2]);
        fun(name[3]);
        if (继承) {
            继承 = " extends  " + 继承 + " "; // 补全代码
        }
        name = name[1];
    }
    else { // 都一样
        子类名_ = name;
    }
    
    let varStr = ""; 
    let _获取子类数据 = "";
    let _获取子类数组 = "";
    let _获取普通数组 = "";
    let _加载普通类 = "";
    let _加载子类数组 = "";
    let _加载普通数组 = "";
    for (let i = 0; i < dataArr.length; i++) {
        let arr = dataArr[i];
        if (Array.isArray(arr[0])) {
            let type = gettype(arr[0][0]); // 第0个才是
            if (typeof type !== "string") { // 特殊类的
                let 类型 = type.name;
                头文件数组.push(类型);
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

                    str = classArrVarTemplate;
                    str = str.replace(/#名字#/g, 名字);
                    str = str.replace(/#id#/g, id);
                    str = str.replace(/#类型#/g, 类型);
                    str = str.replace(/#类名#/g, 类型);
                    if (函数) {
                        str = str.replace(/#函数#/g, "this." + 函数 + "(value)");
                    }
                    else {
                        str = str.replace(/#函数#/g, "");
                    }
                    varStr = varStr + str;

                    str = 加载子类数组;
                    str = str.replace(/#名字#/g, 名字);
                    str = str.replace(/#id#/g, id);
                    str = str.replace(/#类型#/g, 类型);
                    str = str.replace(/#类名#/g, 类型);
                    _加载子类数组 = _加载子类数组 + str;

                    str = 获取子类数组;
                    str = str.replace(/#名字#/g, 名字);
                    str = str.replace(/#id#/g, id);
                    str = str.replace(/#类型#/g, 类型);
                    str = str.replace(/#类名#/g, 类型);
                    _获取子类数组 = _获取子类数组 + str;
                    id++;
                }
            }
            else { // 普通类型的
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


                    let str = "";

                    str = arrVarTemplate;
                    str = str.replace(/#名字#/g, 名字);
                    str = str.replace(/#id#/g, id);
                    str = str.replace(/#类型#/g, 类型);
                    str = str.replace(/#类名#/g, 类型);
                    if (函数) {
                        str = str.replace(/#函数#/g, "this." + 函数 + "(value)");
                    }
                    else {
                        str = str.replace(/#函数#/g, "");
                    }
                    varStr = varStr + str;

                    str = 加载普通数组;
                    str = str.replace(/#名字#/g, 名字);
                    str = str.replace(/#id#/g, id);
                    str = str.replace(/#类型#/g, 类型);
                    str = str.replace(/#类名#/g, 类型);
                    _加载普通数组 = _加载普通数组 + str;

                    str = 获取普通数组;
                    str = str.replace(/#名字#/g, 名字);
                    str = str.replace(/#id#/g, id);
                    str = str.replace(/#类型#/g, 类型);
                    str = str.replace(/#类名#/g, 类型);
                    _获取普通数组 = 获取普通数组 + str;

                    id++;
 
                }
            }
        }
        else {
            let type = gettype(arr[0]);
            if (typeof type !== "string") { // 特殊类的
                let 类型 = type.name;
                头文件数组.push(类型);
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

                    str = classVarTemplate;
                    str = str.replace(/#名字#/g, 名字);
                    str = str.replace(/#id#/g, id);
                    str = str.replace(/#类型#/g, 类型);
                    str = str.replace(/#类名#/g, 类型);
                    if (函数) {
                        str = str.replace(/#函数#/g, "this." + 函数 + "(value)");
                    }
                    else {
                        str = str.replace(/#函数#/g, "");
                    }
                    varStr = varStr + str;

                    str = 加载普通类;
                    str = str.replace(/#名字#/g, 名字);
                    str = str.replace(/#id#/g, id);
                    str = str.replace(/#类型#/g, 类型);
                    str = str.replace(/#类名#/g, 类型);
                    _加载普通类 = _加载普通类 + str;

                    str = 获取子类数据;
                    str = str.replace(/#名字#/g, 名字);
                    str = str.replace(/#id#/g, id);
                    str = str.replace(/#类型#/g, 类型);
                    str = str.replace(/#类名#/g, 类型);
                    _获取子类数据 = _获取子类数据 + str;

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
                    if (函数) {
                        str = str.replace(/#函数#/g, "this." + 函数 + "(value)");
                    }
                    else {
                        str = str.replace(/#函数#/g, "");
                    }
                    str = str.replace(/#名字#/g, 名字);
                    str = str.replace(/#默认#/g, 默认);
                    str = str.replace(/#类型#/g, 类型);
                    str = str.replace(/#id#/g, id++);
                    varStr = varStr + str;
                }
            }
            
        }
    }
    
    let js = classTemplate;
    js = js.replace(/#类名#/g, name);
    js = js.replace(/#字段定义#/g, varStr);
    js = js.replace(/#获取子类数据#/g, _获取子类数据);
    js = js.replace(/#获取子类数组#/g, _获取子类数组);
    js = js.replace(/#获取普通数组#/g, _获取普通数组);
    js = js.replace(/#加载普通类#/g, _加载普通类);
    js = js.replace(/#加载子类数组#/g, _加载子类数组);
    js = js.replace(/#加载普通数组#/g, _加载普通数组);
    js = js.replace(/#继承#/g, 继承);

    let 头文件 = `
import {sys, director} from 'cc';
`
    // const main = require('./main2.js')
    头文件数组 = [...new Set(头文件数组)];
    for (let i = 0; i < 头文件数组.length; i++) {
        头文件 += ("import { 类名 } from './类名';\n").replace(/类名/g, 头文件数组[i]);
    }
    js = js.replace(/#头文件#/g, 头文件);
    let folderPath = "../assets/Script/Model";
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
        console.log('Folder created!');
      } else {
        console.log('Folder already exists!');
      }
    fs.writeFile('../assets/Script/Model/' + name + '.ts', js, (err) => {
        if (err) throw err;
        console.log(name + '.ts 已经生成');
    });
    // mainJs += js; // 添加到主js里
    // main.js += js;
    
    let ans = {name: 子类名_, num: id};
    classArr.push(ans);
    return ans; // 返回这个就好了,到时候会自己处理了
}

module.exports = {
    fun: newclass,
};