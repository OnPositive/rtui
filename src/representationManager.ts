import tps=require("raml-type-bindings")
import uif=require("./uifactory")
import ic=require("./controls")
import frms=require("./forms")
import ro=require("./renderingOptions")
import {Composite} from "./controls";
import {AbstractListControl, BindableControl} from "./forms";

export type Representation=(b?:tps.IBinding,r?:ro.RenderingOptions)=>ic.IControl&IContainer;

export class RepresentationRegistry{

    representations: {[ name: string]: Representation}={}

    bindable: {[ name: string]: boolean}={}

}

export interface IContainer{

    add(v:ic.IControl);
}

export class RepresentationProcessor{

    registry:RepresentationRegistry=new RepresentationRegistry;

    constructor(){
        this.registry["hc"]=()=>new ic.HorizontalFlex();
        this.registry["rc"]=()=>new frms.AlignedContainer(true);
        this.registry["lc"]=()=>new frms.AlignedContainer(false);

        this.registry["vc"]=()=>new ic.VerticalFlex();
        this.registry["tf"]=()=>new frms.TabFolder();
        this.registry["htf"]=()=>new ic.HorizontalTabFolder();
        this.registry["accordition"]=()=>new ic.AccorditionContainer();
        this.registry["h3"]=()=>new frms.BindedHeader(3);
        this.registry["h1"]=()=>new frms.BindedHeader(1);
        this.registry["list"]=(b,r)=>uif.createList(b,r,"list");
        this.registry["list-only"]=(b,r)=>uif.createList(b,r,"list-only");
        this.registry["table"]=(b,r)=>uif.createList(b,r,"table");
        this.registry["table-only"]=(b,r)=>uif.createList(b,r,"table-only");
        this.registry["elements"]=(b,r)=>uif.createList(b,r,"elements");
        this.registry["inline"]=(b,r)=>uif.service.createControl(b,r);
        this.registry["h2"]=()=>new frms.BindedHeader(2);
        this.registry["h4"]=()=>new frms.BindedHeader(4);
        this.registry["h5"]=()=>new frms.BindedHeader(5);
        this.registry["label"]=()=>new frms.Interpolator(5);
        this.registry["tag-list"]=()=>new frms.ButtonMultiSelectControl();
        this.registry["icon"]=()=>new frms.BindedIcon();
        this.registry["thumbnail"]=()=>new frms.Thumbnail();
        this.registry.bindable["tag-list"]=true;
        this.registry.bindable["thumbnail"]=true;
        this.registry.bindable["h3"]=true;
        this.registry.bindable["list"]=true;
        this.registry.bindable["list-only"]=true;
        this.registry.bindable["table"]=true;
        this.registry.bindable["table-only"]=true;
        this.registry.bindable["elements"]=true;
        this.registry.bindable["inline"]=true;
        this.registry.bindable["h1"]=true;
        this.registry.bindable["h2"]=true;
        this.registry.bindable["h4"]=true;
        this.registry.bindable["h5"]=true;
        this.registry.bindable["label"]=true;//
    }

    processRepresentation(b:tps.IBinding, representation: any,pc:IContainer,options:ro.RenderingOptions){
        if (!representation){
            return uif.service.createControl(b,options);
        }
        if (typeof representation=="string"){
            var key=representation;
            var cp=key.indexOf('(');
            var argArray:string[]=[];
            if (cp!=-1){
                var args=key.substring(cp+1,key.length-1);
                key=key.substring(0,cp)
                argArray=args.split(",");
            }
            if (this.registry[key]){
                var val=this.registry[key];
                var rs=val(b,options);
                processArgs(rs,argArray);
                return rs;
                //this is control
            }
            //this is binding with default representation
            var subBnd=b.binding(key);
            if(subBnd.type()==tps.TYPE_ANY){
                if (representation=="----"){
                    var cnt=new Composite("hr");
                    return cnt;
                }
                var i=new frms.Interpolator();
                i.label=representation;
                i._binding=b;
                return i;
            }
            var tp=subBnd.type();
            var rep:any=(<tps.metakeys.Representation>tp).representation
            var result= this.processRepresentation(subBnd,rep,pc,options);
            processArgs(result,argArray);
            return result;
        }
        if (typeof representation=="object"){
            if (Array.isArray(representation)){
                //this is a sequence of items to render
                var ls:any[]=representation;
                ls.forEach(x=>{
                    pc.add(this.processRepresentation(b,x,pc,options));
                })
                return pc;
            }
            else{
                //this is binding to representation or representation to binding
                var keys=Object.keys(representation);
                if (keys.length==1){
                    var key=keys[0];
                    var val=representation[key];
                    var cp=key.indexOf('(');
                    var argArray:string[]=[];
                    if (cp!=-1){
                        var args=key.substring(cp+1,key.length-1);
                        key=key.substring(0,cp)
                        argArray=args.split(",");
                    }
                    const isBinding=this.registry.bindable[key];

                    //console.log(argArray)
                    var ff=this.registry[key];
                    if (ff) {

                        if (isBinding){
                            if (key=="label"){
                                var rs=ff(vb,options);
                                (<BindableControl>rs)._binding=b;
                                rs.label=val;//
                            }
                            else {
                                var vb=b.binding(val);
                                var rs=ff(vb,options);
                                (<BindableControl>rs)._binding = vb;
                            }
                        }
                        else {
                            var rs=ff(b,options);
                            this.processRepresentation(b, val, rs, options);
                        }
                        processArgs(rs,argArray);
                        return rs;
                    }
                }
            }
        }
    }
}
function processArgs(v:ic.IControl,array:string[]){
    array.forEach(x=>{
        x=x.trim();
        if (x=="grabVertical"){
            (<Composite>v)._style.flex="1 1 auto";
        }
        if (x=="grab"){
            (<Composite>v)._style.flex="1 1 auto";
        }
        if (x=="no-min-size"){
            (<Composite>v)._style.flexBasis="0";
        }
        if (x=="no-margin"){
            (<Composite>v)._style.margin="0px";
        }
        if (x=="padTop"){
            (<Composite>v)._style.paddingTop="5px";
        }
        if (x=="padBottom"){
            (<Composite>v)._style.paddingBottom="5px";
        }
        if (x=="no-selection"){
            (<AbstractListControl>v).setSelectionVisible(false);//
        }
        if (x=="padLeft"){
            (<Composite>v)._style.paddingLeft="5px";
        }
        if (x=="padRight"){
            (<Composite>v)._style.paddingRight="5px";
        }
        if (x=="pad"){
            (<Composite>v)._style.padding="5px";
        }
        if (x=="eq"){
            (<Composite>v).children.forEach(y=>{
                (<Composite>y)._style.flex="1 1 0";
            });
        }
    })
}