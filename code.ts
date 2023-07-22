// import { Label } from 'cc';

import { warn } from 'cc';
import { v3 } from 'cc';
import dyl_data, { _log, _log1 } from './Dyl';
import { UITransform } from 'cc';
import { _decorator, Component, Node, director, input, instantiate } from 'cc';
import { error } from 'cc';
import { off } from 'process';
import { Vec3 } from 'cc';
import { resources } from 'cc';
import { SpriteFrame } from 'cc';
import { arrayBuffer } from 'stream/consumers';
import { Label } from 'cc';
import { Sprite } from 'cc';
import { DylNode_btn } from './DylNode_btn';
import { Model } from '../Model/Model';
import { Director } from 'cc';
import { NodeEventType } from 'cc';
import { CCBoolean } from 'cc';
import { CCInteger } from 'cc';
import { CCString } from 'cc';
import { CCFloat } from 'cc';
import { Color } from 'cc';
import { UIOpacity } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, menu, executeInEditMode } = _decorator;
let  _update = ()=>{
    // _update();
    const options = {
        uuid: director.getScene().children[0].uuid,
        path: 'active',
        dump: {
            value: true,
        },
    };
    Editor.Message.request('scene', 'set-property', options);
    let selectarr = Editor.Selection.getSelected('node');
    let s = director.getScene();
    Editor.Selection.select("node", s.children[0].uuid);
    Editor.Selection.clear('node');
    setTimeout(()=>{
        Editor.Selection.select("node", selectarr);
    }, 50);
}

@ccclass('DylUiItem')
class DylUiItem {
    @property([CCBoolean])
    activeArr: boolean[] = [];

    @property([CCInteger])
    posArr: number[] = [];
    @property([CCInteger])
    scaleArr: number[] = [];
    @property([CCInteger])
    colorArr: number[] = [];
    @property([CCInteger]) // 这个就是宽高
    sizeArr: number[] = [];

    @property([CCInteger]) // 透明度的, 其实这个也是根据组件处理, 添加一个乱来的数值
    opacityArr: number[] = [];
    @property([CCFloat]) // 角度, 直接添加好了
    angleArr: number[] = [];

    @property([CCString])
    stringArr: string[] = [];
}
let _checkVarr = []; // 用来保存多余空的v位置, 到时候先放这个地方
// 功能,可以切换多个界面用的, 就是用来保存, 触发切换的方法只有在编辑的时候有用, 添加f1 到 f6; 可自动删除
@ccclass('DylUi')
@menu('🍏Dyl/UI')
@executeInEditMode
export class DylUi extends Component { 
    public static uidata = {}; // 把ui的tab放在这里,以后随时调用
    public static uidataArr = []; // 把ui的tab放在这里,以后随时调用
    // @property({ tooltip:"是否开启按键模式:f1删除,f2直接保存,f3插入,f4新增"})
    // isKey = false; // 是否开启快捷键,主要是为了防止误点

    @property
    _nowId = -1; // 当前的id; 切换时, 会自己检测,是否需要更改内容 

    @property({type: CCInteger, step: 1})
    set nowId (value:number) {
        this._read(value);
    }
    get nowId () {
        return this._nowId;
    }
    
    @property([Node])
    nodeArr: Node[] = []; // 保存所有节点
    @property([Vec3]) // 这个是用来保存所有这种类型, 因为很多都是相同的,用一份就够了
    vArr: Vec3[] = [];

    @property([DylUiItem])
    items:DylUiItem[] = []; 

    checkIsSelect () {
        let arr = Editor.Selection.getSelected("node");
        if (arr.length === 1) {
            if (arr[0] === this.node.uuid) {
                return true;
            }
        }
        return false;
    }

    getJs () { // 获取触发编辑器更改内容的脚本
        let arr = Editor.Selection.getSelected("node");
        if (arr.length === 1) {
            let node = cce.Node.query(arr[0]); // 选中的节点
            if (!node.getComponent(DylUi)) { // 没有就返回父节点的ui
                if (node.parent === this.node) {
                    return node.parent.getComponent(DylUi);
                }
            }
            else {
                if (node === this.node) {
                    return node.getComponent(DylUi);
                }
            }
        }
    }

    f1() { // 直接保存, 不要删除了,删除自己手动去删除吧,快捷键有风险
        let self = this.getJs();
        if (!self) {
            return;
        }
        // if (!self.checkIsSelect()) { // 不开启,不理会
        //     return;
        // }
        self._save(self._nowId); // 直接 保存当前就好了
        // Editor.Selection.select("node", self.node.uuid);
        _update();
        console.log("保存id:" + self._nowId);
    }
    f3() { // 插入
        let self = this.getJs();
        if (!self) {
            return;
        }
        self.items.push(null);
        for (let i = self.items.length - 1; i > self._nowId; i--) {
            self.items[i] = self.items[i - 1];
        }
        self.items[self._nowId] = new DylUiItem();
        self._save(self._nowId);
        // Editor.Selection.select("node", self.node.uuid);
        _update();
        console.log("插入id:" + self._nowId);
    }
    f4() { // 新增
        let self = this.getJs();
        if (!self) {
            return;
        }
        self._nowId = self.items.length;
        self.items.push(new DylUiItem());
        self._save(self._nowId);
        // Editor.Selection.select("node", self.node.uuid);
        _update();
        console.log("末尾新增id:" + self._nowId);
    }
    f5() { // 切换
        let self = this.getJs();
        if (!self) {
            return;
        }
        let id = (self._nowId + 1) % self.items.length;
        self._read(id);
        // Editor.Selection.select("node", self.node.uuid);
        _update();
        console.log("切换到下一个id:" + self._nowId);
    }

    // kkk: boolean = false;
    protected __preload(): void {
        if (EDITOR) {
            DylUi.uidataArr.push(this); // 只有编辑状态有用
        }
        if (this._nowId < 0) {
            this._save(0);
            this._nowId = 0;
        }
    }

    getItem (id: number) { // 主要是处理突变的id        
        if (id < 0) {
            return this.items[0];
        }
        if (id >= this.items.length) { // 没有就添加吧
            id = this.items.length
            let item = new DylUiItem();
            this.items.push(item);
            return item;
        }
        return this.items[id];
    }
    
    _save(id:number) { // 保存当前存档,添加到现在的存档
        console.log("save", id);
        // 这里添加一下, 判断这个_vArr 有没有多余的内容, 不然越用越多,先获取多余的
        let arr = [];
        _checkVarr = []; // 先清空
        let checkArr = (varr)=>{
            for (let i = 0; i < varr.length; i++) {
                arr[varr[i]] = true; // 这就说明这里已经有了,到时候不需要添加
            }
        }
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            checkArr(item.posArr);
            checkArr(item.scaleArr);
            checkArr(item.colorArr);
            checkArr(item.sizeArr);
        }
        for (let i = 0; i < this.vArr.length; i++) {
            if (!arr[i]) {
                // _checkVarr.push(arr[i]); // 没有用到就加入
                _checkVarr[i] = true;
            }
        }
        let item = this.getItem(id);
        console.log("----------")
        console.log(id);
        console.log(item);
        this._saveNode(item);
    }
    _saveNode (item:DylUiItem) {
        let nowArr = []; // 当前的所有节点
        let getNode = (node:Node)=>{
            nowArr.push(node);
            for (let i = 0; i < node.children.length; i++) {
                // getNode(node.children[i]);
                nowArr.push(node.children[i]); // 只做一层,不多搞了
            }
        }
        getNode(this.node); // 当前节点也算的, 但最后是不会计算当前
        
        // 对比两边的节点, 先排除两边共同的node, 就是没有先直接赋值为null, 已经有了, 直接更新内容
        for (let i = 0; i < this.nodeArr.length; i++) {
            if (this.nodeArr[i] === null) {
                continue;
            }
            let id = nowArr.indexOf(this.nodeArr[i]);
            if (id >= 0) {
                nowArr[id] = null; // 
                this._saveNode1(item, this.nodeArr[i], i); 
            }
            else {
                this.nodeArr[i] = null; // 找不到就是说已经被排除了
            }
        }

        // 这里添加新添加的节点, 先放在null的地方上,没有再到后面填补
        for (let i = 0; i < nowArr.length; i++) {
            let node = nowArr[i];
            if (node) { // 空的就跳过
                let hasNull = false; // 看看是否有null的位置
                for (let j = 0; j < this.nodeArr.length; j++) {
                    if (!this.nodeArr[j]) { // 既然这里为空的, 就在这里添加内容, 不要浪费位置了
                        this.nodeArr[j] = node;
                        this._saveNode2(node, j); // 新内容,要在所有item都添加这里内容,所以要用另一个函数
                        hasNull = true;
                        break;
                    }
                }
                if (!hasNull) { // 没有的就要自己新增一个位置了
                    this.nodeArr.push(node);
                    this._saveNode2(node, this.nodeArr.length - 1);
                }
            }
        }
    }
    _saveNode2 (node:Node, id: number) { // 
        for (let i = 0; i < this.items.length; i++) {
            this._saveNode1(this.items[i], node, id);
        }
    }
    _saveNode1 (item:DylUiItem, node:Node, id: number) { // 
        item.activeArr[id] = node.active;
        item.posArr[id] = this._getVid(node.getPosition());
        item.scaleArr[id] = this._getVid(node.getScale());

        let sprite = node.getComponent(Sprite);
        console.log("sprite......>", sprite);
        if (sprite) {
            console.log("sprite------->", id);
            item.colorArr[id] = this._getColorId(sprite.color);
            console.log("sprite=======>", id, item.colorArr[id]);
        }
        let lab = node.getComponent(Label);
        if (lab) {
            item.colorArr[id] = this._getColorId(lab.color);
            item.stringArr[id] = lab.string;
        }
        else {
            item.stringArr[id] = "";
        }
        if (!sprite && !lab) {
            item.colorArr[id] = 0; // 还是给个记录吧, 不然不知道cocos 会出现什么问题
        }

        let ui = node.getComponent(UITransform);
        if (ui) {
            item.sizeArr[id] = this._getVid(v3(ui.width, ui.height, 0));
        }
        else {
            item.sizeArr[id] = 0;
        }

        let oui = node.getComponent(UIOpacity);
        if (oui) {
            item.opacityArr[id] = oui.opacity;
        }
        else {
            item.opacityArr[id] = 0;
        }

        item.angleArr[id] = node.angle
    }

    _read(id:number) { // 读取第id个内容
        if (id < 0) {
            _log1("这个id小于0", id);
            return;
        }
        if (id >= this.items.length) {
            _log1("这个id大于等于当前存储的数组", id);
            return;
        }
        if (id === this._nowId) { // 两个是一样的
            return;
        }
        let item = this.items[id];
        let item1 = this.items[this._nowId]; // 这个是旧的
        for (let i = 0; i < this.nodeArr.length; i++) {
            let node = this.nodeArr[i];
            if (node) {
                node.active = item.activeArr[i];
                if (item.posArr[i] !== item1.posArr[i]) { 
                    node.setPosition(this.vArr[item.posArr[i]]);
                }

                if (item.scaleArr[i] !== item1.scaleArr[i]) { 
                    node.setScale(this.vArr[item.scaleArr[i]]);
                }
                let sprite = node.getComponent(Sprite);
                if (sprite) {
                    if (item.colorArr[i] !== item1.colorArr[i]) { 
                        let v = this.vArr[item.colorArr[i]]
                        sprite.color = new Color(v.x, v.y, v.z);
                    }
                }
                let lab = node.getComponent(Label);
                if (lab) {
                    if (item.colorArr[i] !== item1.colorArr[i]) { 
                        let v = this.vArr[item.colorArr[i]]
                        lab.color = new Color(v.x, v.y, v.z);
                    }
                    lab.string = item.stringArr[i]; // 这个就懒得判断了,判断数值相等,直接赋值好像差不多
                }

                let ui = node.getComponent(UITransform);
                if (ui) {
                    if (item.sizeArr[i] !== item1.sizeArr[i]) { 
                        let v = this.vArr[item.sizeArr[i]]
                        ui.setContentSize(v.x, v.y);
                    }
                }

                let oui = node.getComponent(UIOpacity);
                if (oui) {
                    oui.opacity = item.opacityArr[i];
                }
                node.angle = item.angleArr[i];
            }
        }
        this._nowId = id;
    }

    _getColorId (color:Color) {
        let v = v3(color.r, color.g, color.b);
        return this._getVid(v);
    }

    _getVid (v:Vec3) {
        for (let i = 0; i < this.vArr.length; i++) {
            if (_checkVarr[i]) { // 已经不在了, 没必要再处理, 不然很麻烦
                continue;
            }
            if (this.vArr[i].equals(v, 0.5)) {
                return i;
            }
        }
        let i = _checkVarr.indexOf(true); // 看看是否有空位
        if (i >= 0) {
            _checkVarr[i] = false;
            this.vArr[i] = v;
            return i;
        }
        else {
            this.vArr.push(v);
            return this.vArr.length - 1;
        }
        // if (_checkVarr.length > 0) {
        //     let id = _checkVarr[_checkVarr.length - 1]; // 获取最后一个id
        //     _checkVarr.length--;
        //     this.vArr[id] = v;
        //     return id;
        // }
        // this.vArr.push(v); // 没有对于位置就直接添加吧
        // return this.vArr.length;
    }

    // protected onEnable(): void {
    //     console.log("onEnable");
    //     this._addEventListeners();
    // }
    // protected onDisable(): void {
    //     console.log("onDisable");
    //     this._removeEventListeners();
    // }
    // protected _addEventListeners () {
    //     director.on(Director.EVENT_AFTER_UPDATE, this.updateLayout, this);
    //     this.node.on(NodeEventType.SIZE_CHANGED, this._resized, this);
    //     this.node.on(NodeEventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
    //     this.node.on(NodeEventType.CHILD_ADDED, this._childAdded, this);
    //     this.node.on(NodeEventType.CHILD_REMOVED, this._childRemoved, this);
    //     this.node.on(NodeEventType.SIBLING_ORDER_CHANGED, this._childrenChanged, this);
    //     this.node.on('childrenSiblingOrderChanged', this.updateLayout, this);
    // }

    // protected _removeEventListeners () {
    //     director.off(Director.EVENT_AFTER_UPDATE, this.updateLayout, this);
    //     this.node.off(NodeEventType.SIZE_CHANGED, this._resized, this);
    //     this.node.off(NodeEventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
    //     this.node.off(NodeEventType.CHILD_ADDED, this._childAdded, this);
    //     this.node.off(NodeEventType.CHILD_REMOVED, this._childRemoved, this);
    //     this.node.off(NodeEventType.SIBLING_ORDER_CHANGED, this._childrenChanged, this);
    //     this.node.off('childrenSiblingOrderChanged', this.updateLayout, this);
    // }

    // protected updateLayout () {
    //     console.log("updateLayout");
    // }
    // protected _resized () {
    //     console.log("_resized");
    // }
    // protected _doLayoutDirty () {
    //     console.log("_doLayoutDirty");
    // }
    // protected _childAdded () {
    //     console.log("_childAdded");
    // }
    // protected _childRemoved () {
    //     console.log("_childRemoved");
    // }
    // protected _childrenChanged () {
    //     console.log("_childrenChanged");
    // }
   
}

