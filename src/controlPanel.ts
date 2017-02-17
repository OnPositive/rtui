import forms=require("./forms");
import uifactory=require("./uifactory")
import controls=require("./controls")
import rt=require("raml-type-bindings")
import ro=require("./renderingOptions")
import {Composite} from "./controls";
import {Button} from "./forms";
import {Binding, IBinding, IValueListener} from "raml-type-bindings";

interface CollectionConfig{


    filterValues: {
        [name:string]:any
    }

    visibleFilters: string[]


}

export class CollectionControlPanel extends controls.HorizontalFlex implements IValueListener{
    //ordering
    //filters
    //groupings
    //decorators


    //visible filters
    //grouping control
    //sort control

    //state

    private config: CollectionConfig

    constructor(private view:rt.ViewBinding){
        super();
        this._style.display="inline-flex";
    }
    psComposite:controls.Composite=new controls.Composite("span");

    visiblePars:any
    renderChildren(e:HTMLElement){
        this.psComposite._style.display="inline-flex";
        this.children=[];
        this.children.push(this.psComposite);
        this.fillPS();
        var tp=new Binding("Z")
        var ptype={
            type:"object",
            displayName:"Visible Parameters",
            properties:{}
        };
        this.allConfigurableParameters().forEach(x=>{
            ptype.properties[x.id()]={ id:x.id(), displayName:rt.service.caption(x.type()),type:"boolean"};
        })
        tp._type=ptype;
        tp.value=this.visiblePars;
        tp.addListener(this);
        var b=new forms.PopoverSelect(tp,"glyphicon-cog","btn-success",false,false);

        this.children.push(b);
        super.renderChildren(e);
    }

    private fillPS() {
        var ps = this.visibleParameters().map(x => this.createParameterUI(x));
        this.psComposite.children = [];
        ps.forEach(x => {
            this.psComposite.children.push(x);
            (<controls.AbstractComposite>x).parent = this.psComposite;//
        });
    }
    valueChanged(e){
        this.fillPS();
        this.psComposite.refresh();
       // this.refresh();
    }
    processDirection(sp:IBinding,b:forms.Button){
        var val=sp.get();
        var desc=true;
        if (val=="asc"){
            desc=false;
        }
        b.children=[];
        if (desc){
            b.addHTML("<span class='glyphicon glyphicon-sort-by-order'></span>");
        }
        else{
            b.addHTML("<span class='glyphicon glyphicon-sort-by-order-alt'></span>");
        }
    }
    createParameterUI(p:rt.IBinding){
        var role="filter";
        if ((<rt.metakeys.Ordering>p.type()).ordering){
            role="sort"
        }
        var c = ro.clone(this.getRenderingOptions(), {kind: "filter"});
        var d=p.type().description;
        if (!d){
            d="";
        }
        var style="btn-primary";
        if (p.enumeratedValues()||rt.service.isMultiSelect(p.type())){
            var extra: forms.Button=null;
            if (role=="sort"){
                var sp:rt.Binding=<any>this.view.sortDirectionParameter();
                if (sp) {
                    extra = new forms.Button("");
                    extra.addClassName("btn-xs")
                    var cP=this;
                    cP.processDirection(sp,extra);
                    sp.addPrecomitListener({
                        valueChanged(){
                            cP.processDirection(sp,extra);
                        }
                    })
                    extra.onClick = (x) => {
                        var vl=sp.get()
                        if (vl=="asc"){
                            sp.set("desc");
                        }
                        else{
                            sp.set("asc");
                        }
                    }
                }
            }

            var ps= new forms.PopoverSelect(p,"glyphicon-"+role,style,true,true,extra);
            return ps;
        }
        var cm = this.createUsualFilter(style, p);
        return cm;
        //return uifactory.service.createControl(p,c);
    }

    private createUsualFilter(style: string, p: rt.IBinding) {
        var cm = new Composite("span");
        var label = new Composite("span");
        label.addClassName("btn");
        label.addClassName("btn-xs");
        label.addClassName(style)
        cm._style.position="relative";
        label._style.height = "22px"
        //label._style.background="transparent";
        label._style.marginRight = "-3px";
        label._style.marginTop = "-2px"
        label.addClassName("btn-default");
        label.addHTML("<span style='position: relative;top: 3px;' class='glyphicon glyphicon-filter'></span>")
        label.addLabel(rt.service.caption(p.type()) + ":");
        cm.add(label);
        var i = new forms.Input(false);
        //i._style.marginTop="3px";
        i._style.height = "22px";
        i._style.borderBottomRightRadius = "3px";
        i._style.borderTopRightRadius = "3px";
        i._style.borderBottomLeftRadius = "0px";
        i._style.borderTopLeftRadius = "0px";
        i._style.borderStyle = "solid";
        i._style.borderWidth = "1px";
        i._style.minWidth = "4ch";
        i._style.borderColor = "#ccc";
        i._binding = p;
        cm.add(i);
        if (rt.service.isSubtypeOf(p.type(),rt.TYPE_DATE)){

                var addon = new Composite("span");
                addon._style.display="inline";
                addon._style.width="20px";
                addon._style.paddingTop="3px";
                addon._style.paddingBottom="1px";
                addon._style.paddingLeft="2px";
                addon._style.paddingRight="2px";
                addon.addClassName("input-group-addon");
                addon._html="<span class='glyphicon glyphicon-calendar'></span>";
                cm.add(addon)



        }

        var flt=(<rt.metakeys.Filter>p.type()).filter;
        if (flt){
            if (flt.property){
                var result:any={};
                i._typeaheadFunction=(v:string,cb:(names:string[])=>void)=>{

                    var b=new Binding("");
                    b._type=this.view.collectionBinding().componentType();
                    b.context=this.view;
                    this.view.collectionBinding().workingCopy().forEach(x=>{
                        b.value=x;
                        var val=rt.calcExpression(flt.property,b);
                        if (val){
                            result[""+val]=true;
                        }
                    })
                    cb(Object.keys(result));
                    return result;
                }
            }
        }
        cm._style.marginRight = "3px"
        return cm;
    }


    visibleParameters():rt.IBinding[]{
        var pms:rt.IBinding[]=[]
        if (!this.visiblePars) {
            this.visiblePars={};
            this.allConfigurableParameters().forEach(x => {
                if (this.config && this.config.visibleFilters.indexOf(x.id()) != -1) {
                    pms.push(x);
                    return;
                }
                if (x.type().required && !x.type().default) {
                    pms.push(x);

                }
                if ((<rt.metakeys.Ordering>x.type()).ordering) {
                    pms.push(x);
                    return;
                }

                if (pms.length < 3) {
                    pms.push(x);
                    return true;
                }
            })

        }
        else{
            this.allConfigurableParameters().forEach(x => {
                if (this.visiblePars[x.id()]){
                    pms.push(x);
                }
            })
        }
        pms.forEach(x=>this.visiblePars[x.id()]=true)
        return pms;
    }

    allConfigurableParameters():rt.IBinding[]{
        var ps=this.view.parameterBindings()
        var result:rt.IBinding[]=[];
        var hasSort=false;

        ps.forEach(x => {
            if (this.view.lookupVar(x.id())) {
                x.set(this.view.lookupVar(x.id()));
            }
            else{
                if ((<rt.metakeys.Ordering>x.type()).ordering) {
                    hasSort=true;
                    //return;
                }
                result.push(x);
            }
        })
        if (hasSort) {
            result = result.filter(x => x != this.view.sortDirectionParameter());
        }
        return result;
    }
}