import rtb=require("raml-type-bindings")
import cntrl=require("./controls")
import uif=require("./uifactory")
import wb=require("./workbench")
import action=require("./actions")
import {Binding} from "raml-type-bindings";
const basicAuth = {

    type: "object",
    properties: {
        login: {
            type: "string"
        },
        password: {
            type: "password"
        }
        ,
        remember: {
            displayName: "Keep logged in",
            type: "boolean"
        }
    }
}


export function authBinding(t: rtb.SecuritySchemeDefinition): rtb.IBinding {
    var b = new rtb.Binding(t.id);
    if (t.kind == "Basic Authentication") {
        b._type = basicAuth;
    }
    return b;
}

export function authUI(t: rtb.SecuritySchemeDefinition): cntrl.IControl {
    return uif.service.createControl(authBinding(t));
}
export function key(b:rtb.IBinding): string {
    var op=<any>(<rtb.Operation>b.type())
    var s=scheme(b);
    var bu=op.baseUri;
    if (bu&&s){
        return bu+":"+s.id;
    }
}

export function credentials(b:rtb.IBinding){
    var c=key(b);
    if (!c){
        return false;
    }
    var item=sessionStorage.getItem(c);
    if (item){
        return JSON.parse(item);
    }
    item=localStorage.getItem(c);
    if (item){
        return JSON.parse(item);
    }
}
export function storeCredentials(b: Binding,c:any){
    if (c.remember){
        localStorage.setItem(key(b),JSON.stringify(c));
    }
    else {
        sessionStorage.setItem(key(b), JSON.stringify(c));
    }
}
function needsAuthentification(ts:rtb.Operation){
    if (ts.securedBy){
        if (ts.securedBy.length>0){
            return ts.securedBy[0]
        }
    }
}
rtb.setAuthService({
    authError(b:rtb.IBinding){
        if (credentials(b)){
            storeCredentials(<rtb.Binding>b,"");
        }
    },
    needsAuth(b:rtb.IBinding):boolean{
        if (needsAuthentification(<any>b.type())){
            if (credentials(b)){
                return false;
            }
            return true;
        }
        return false;
    },
    patchRequest(b:rtb.IBinding, r){
        if (needsAuthentification(<any>b.type())){
            var cm=credentials(b);
            if (cm) {
                r.auth = {
                    user: cm.login,
                    password: cm.password
                }
            }
        }
        console.log("Patching")//
        return r;
    }
})


let scheme = function (b: rtb.IBinding):rtb.SecuritySchemeDefinition {
    var op = (<rtb.Operation>b.type())
    var mm = (<rtb.Operation>b.type()).securedBy;
    if (!mm){
        return null;
    }
    var scheme: rtb.SecuritySchemeDefinition = null;
    mm.forEach(x => {
        if (x) {
            scheme = <any>rtb.service.resolveTypeByName(x);
        }
    })
    return scheme;
};
export function doAuth(b:rtb.IBinding,onComplete:()=>void){
     var sc = scheme(b);
    authDialog(sc,(x)=>{
        this.storeCredentials(b,x);
        onComplete();
    });
}
export function authDialog(t: rtb.SecuritySchemeDefinition,onComplete:(v)=>void) {
    var bnd=authBinding(t);
    wb.showInDialog(t.displayName ? t.displayName : "Login", uif.service.createControl(bnd, {
        dialog: true,
        maxMasterDetailsLevel: 0
    }), [
        new action.CommitValidAction(<rtb.Binding>bnd, ()=>{
            onComplete(bnd.get())
        }),
        Cancel,
    ])
}
const Cancel = {
    title: "Cancel",
    run(){
    }
}