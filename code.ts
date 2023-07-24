/**
 * * 返回 函数数组 是给 _update使用的函数数组, 主要是有一个需要初始化的函数, 只能出来两个函数
 * 这个是直接处理对象的, 不需要返回值
 * @param time number|fun(end-start)=>time 延时时间, 如果是函数(value|arr = end - start)=>time, 那就是获取时间的函数, 这种一般是给匀速的用的
 * @param obj 需要操作的对象
 * @param set (obj, ...arr) 根据后面参数来设置
 * @param get (obj)  函数或者值, 如果是函数,那就是从当前对象的状态来获取值
 * @param endValue 值或者数组
 * @param easefun 缓冲函数, 字符串用也可以
 */
export function act_lerp (obj, time, set:Function, get, endValue, easefun ?: string | Function) {
    if (!easefun) {
        easefun = (t)=>t;
    }
    else if (typeof easefun === "string") {
        easefun = easeStrFun(easefun);
    }
    if (Array.isArray(endValue)) {
        let endarr = endValue;
        let startarr = null;
        let initfun = (t)=>{
            if (typeof get === "function") {
                startarr = get(obj);
            }
            else {
                startarr = get;
            }
            if (typeof time === "function") { // 根据差值获取最后运行的时间
                let arr1 = [];
                for (let i = 0; i < startarr.length; i++) {
                    arr1.push(endarr[i] - startarr[i]);
                }
                time = time(arr1);
            }
            return t;
        }

        let tfun = (t)=>{
            if (t >= time) {
                set(obj, ...endarr);
                return t - time;
            }
            let r = t / time;
            let ans = [];
            for (let i = 0; i < startarr.length; i++) {
                ans.push(lerp(easefun, startarr[i], endarr[i], r));
            }
            set(obj, ...ans);
            return true;
        }
        return [initfun, tfun];
    }
    else {
        let startValue = 0;

        let initfun = (t)=>{
            if (typeof get === "function") {
                startValue = get(obj);
            }
            else {
                startValue = get;
            }
            if (typeof time === "function") { // 根据差值获取最后运行的时间
                time = time(endValue - startValue);
            }
            return t;
        }

        let tfun = (t)=>{
            if (t >= time) {
                set(obj, endValue);
                return t - time;
            }
            let r = t / time;
            set(obj, lerp(easefun, startValue, endValue, r));
            return true;
        }
        return [initfun, tfun];
    }
 }

 /**
  * 返回的是给 _update使用的函数数组, 主要是有一个需要初始化的函数, 只能出来两个函数
  ** 数字变化用的,例如血条变化, 数字不断跳动, 倒计时之类的
  * @param obj 操作对象, 随便填,后面函数需要用它
  * @param perTime 数值变化一 消耗的时间
  * @param updateFun (obj, new, old) 更新函数
  * @param start number | (obj)=>num 直接是开始数值, 或者 直接从对象里获取开始值 (函数主要用处是, 这个初始值,是会变化的, 所以要在运行的时候才确定)
  * @param end number | (obj)=>num 到达这个数字的时候,就会停止运行, 如果是函数, 那就会每次都从函数里获取这个值, 所以这个值是可以变的
  */
 export function act_run (obj, perTime:number, updateFun:Function, start: number | Function, end: number | Function) {
    let nowValue = 0;
    
    let lastTime = 0; // 存储的时间
    let endIsFun = (typeof end === "function");
    let runfun = function (time) {
        let dt = time - lastTime; // 这个就是消耗了多少时间, 这次
        let n = Math.floor(dt / perTime); // 现在消耗多少步
        //@ts-ignore
        let endNum = endIsFun ? end(obj) : end;
        if (endNum === nowValue) { // 已经结束了, 可以直接跳过了
            return false;
        }
        if (n === 0) { // 时间不够数字变化, 不需要更新,跳过就好了
            return true;
        }
        if (endNum > nowValue) { // 增加
            if ((nowValue + n) >= endNum) { // 这个达到目的了, 可以结束了
                updateFun(obj, endNum, nowValue);
                return false;
            }
            updateFun(obj, nowValue + n, nowValue);
            nowValue += n;
        }
        else {
            if ((nowValue - n) <= endNum) { // 这个达到目的了, 可以结束了
                updateFun(obj, endNum, nowValue);
                return false;
            }
            updateFun(obj, nowValue - n, nowValue);
            nowValue -= n;
        }
        lastTime = lastTime + (n * perTime)
        return true;
    }
    // return _update(runfun);
    let initfun = (time)=>{
        if (typeof start === "function")  {
            nowValue = start(obj);
        }
        else {
            nowValue = start;
        }
        updateFun(obj, nowValue, nowValue); // 一开始就初始化一下
        return time;
    }
    return [initfun, runfun];
 }
