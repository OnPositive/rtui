
function isLetter(c:string) {
    return c.toLowerCase() != c.toUpperCase();
}
var digits={
    "0":true,
    "1":true,
    "2":true,
    "3":true,
    "4":true,
    "5":true,
    "6":true,
    "7":true,
    "8":true,
    "9":true,
}
var blackList={}
function isDigit(c:string){
    return digits[c]
}
var list=["that",
"with",
"they",
"have",
"this",
"from",
"what",
"some",
"other",
"were",
"there",
"when",
"your",
"said",
"each",
"which",
"their",
"will",
"about",
"many",
"then",
"them",
"would",
"these",
"thing",
"more",
"could",
"come",
 "most",
"over",
"know",
"than",
"been",
"where",
"after",
"back",
"every",
"good",
"under",
"very",
"through",
"before",
"also"]
list.forEach(x=>{
    blackList[x]=1;
})

export function keywords(s:string,ignoreFirst:boolean=true):string[]{
    var words:string[]=[];
    var cword:string[]=null;

    for (var i=0;i<s.length;i++){
        var c=s.charAt(i);
        if (isLetter(c)||isDigit(c)||((c!=' '&&c!='\r'&&c!='\n')&&cword!=null&&i<s.length-1&&(isLetter(s.charAt(i+1)||isDigit(s.charAt(i+1)))))){
            if (cword==null){
                cword=[];
            }
            cword.push(c);
        }
        else{
            if (cword!=null) {
                if (ignoreFirst){
                    ignoreFirst=false;
                }
                else {
                    var cwordString = cword.join("");
                    if (cword.length > 3) {
                        if (!blackList[cwordString]) {
                            words.push(cwordString);
                            if (words.length > 5) {
                                break;
                            }
                        }
                    }
                }
            }
            cword=null;
        }
    }
    if (cword!=null) {
        var cwordString = cword.join("");
        if (cword.length > 3) {
            if (!blackList[cwordString]) {
                words.push(cwordString);
            }
        }
    }
    return words;
}
export function removeZombieGroups(labelToMethods:{ [name:string]:any[]}){
    Object.keys(labelToMethods).forEach(x=>{
        if (labelToMethods[x].length<=2){
            delete labelToMethods[x]
        }
    })
}
declare class Map<K,V>{
    set(k:K,v:V)
    has(k:K):boolean
    get(k:K):V
    delete(k:K):boolean
}

var methodToKeyWords = function (labelToMethods: {}) {
    var methodToKeywords = new Map<any,string[]>();
    Object.keys(labelToMethods).forEach(x=> {
        labelToMethods[x].forEach(m=> {
            if (methodToKeywords.has(m)) {
                methodToKeywords.get(m).push(x);
            }
            else {
                var s: string[] = [x];
                methodToKeywords.set(m, s);
            }
        })
    })
    return methodToKeywords;
};
export function removeHighlyIntersectedGroups(labelToMethods:{ [name:string]:any[]}){

    var keys=Object.keys(labelToMethods);
    var methodToKeywords = methodToKeyWords(labelToMethods);
    var changed=false;
    keys.forEach(x=>{
        var methods=labelToMethods[x];
        var ks:string[]=null;
        methods.forEach(m=>{
            var keywords=methodToKeywords.get(m);
            if (ks==null){
                ks=keywords;
            }
            else{
                ks=ks.filter(x=>keywords.indexOf(x)!=-1);
            }
        })
        ks=ks.filter(w=>w!=x);
        if (ks.length>0){
            var maxGroup=null;

            ks.forEach(g=>{
               var gm=labelToMethods[g];
               if (!gm){
                   return;
               }
               if (maxGroup==null){
                   maxGroup=g;
               }
               else if (labelToMethods[maxGroup].length<gm.length){
                   maxGroup=g;
               }
            })
            if (maxGroup) {
                var ms = labelToMethods[maxGroup];
                if (ms.length == methods.length) {
                    ///try merge words;
                }
                delete labelToMethods[x];
                changed=true;
            }
        }
    });
    if (changed) {
        methodToKeywords = methodToKeyWords(labelToMethods);
    }
    var sorted=Object.keys(labelToMethods).sort( (x,y)=>{
        return labelToMethods[x].length-labelToMethods[y].length;
    })
   sorted.forEach(x=>{
        var intersectionCount=0;
        var methods=labelToMethods[x];
        if (!methods){
            return;
        }
        methods.forEach(m=>{
            var kv=methodToKeywords.get(m);
            if (kv.length>1){
                intersectionCount++;
            }
        })
        var total=methods.length;
        var remove=0;
        var stat:boolean;
        if(total<4){
            stat=intersectionCount/total>=0.55
        }
        else{
            stat=intersectionCount/total>0.84;
        }
        if (stat){
            delete labelToMethods[x];
            methodToKeywords = methodToKeyWords(labelToMethods);
        }
    })
}
export function tryMergeToPlurals(val:{ [name:string]:any[]}){
    Object.keys(val).forEach(x=>{
        if (x.charAt(x.length-1)=='s'){
            var op1=x.substring(0,x.length-1);
            if (val[op1]){
                val[x]=val[x].concat(val[op1]);
                delete val[op1];
                return;
            }
            if (op1.charAt(op1.length-1)=="'"){
                var sm=x.substring(0,op1.length-1)+"s";
                if (val[sm]){
                    val[sm]=val[sm].concat(val[x]);
                    delete val[x];
                    return;
                }
            }

            if (op1.charAt(op1.length-1)=='e'){
                op1=x.substring(0,op1.length-1);
            }
            if (val[op1]){
                val[x]=val[x].concat(val[op1]);
                delete val[op1];
                return;
            }

            if (op1.charAt(op1.length-1)=='i'){
                op1=x.substring(0,op1.length-1)+"y";
            }
            if (val[op1]){
                val[x]=val[x].concat(val[op1]);
                delete val[op1];
            }
        }
    })
}
export function trimDesc(s:string):string{
    var words:string[]=[];
    var cword:string[]=null;
    if (s.charAt(0)=='['){
        var ll=s.indexOf(']');
        if (ll!=-1) {
            return s.substring(1, ll)
        }
    }
    for (var i=0;i<s.length;i++){
        var c=s.charAt(i);
        if (isLetter(c)||isDigit(c)){
            if (cword==null){
                cword=[];
            }
            cword.push(c);
        }
        else{
            if (cword!=null) {
                var cwordString = cword.join("");
                if (cword.length > 3) {
                    if (!blackList[cwordString]) {
                        words.push(cwordString);
                    }
                }
            }
            cword=null;
            if (c=='('){
                if (words.length>=3){
                    return s.substring(0,i);
                }
            }
            if (c=='.'||c==';'||c=='\n'||c=='\r'||c=="<"){
                if (c=='.'){
                    if (i<s.length-1){
                        var q=c.charAt(i+1);
                        if(isDigit(q)||isLetter(c)){
                            continue;
                        }
                    }
                }
                if (words.length>=2){
                    return s.substring(0,i);
                }
            }
            if (i>100){
                return s.substring(0,i)+"...";
            }
        }
    }
    return s;
}