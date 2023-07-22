const subclass = (require('./main1.js')).fun
// const mainclass = (require('./main2.js')).fun // 在线版
const mainclass = (require('./main3.js')).fun // 本地版版
let Parent = subclass("Parent",  
    [1, "parent1", "parent2"], 
)

let Jm = subclass(["Jm", "Jm1", Parent],
    ["jm", "jm1", "jm2"], 
)
let Zxp = subclass(["Zt", "Zxp"],
    [2, "num1", "num2"], 
    [[Jm], "arr1", "arr2"],
    [Jm, "jm1", "jm2"],
)
mainclass(
    [3, "jm", "dyl"],
    [Zxp, "zxp1", "zxp2"],
    [[Jm],"jmArr"]
)
  
