import forms=require("./forms");
import uifactory=require("./uifactory")
import controls=require("./controls")
import actions=require("./actions")

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
export class ClearFilterAction extends actions.CollectionAction{

    constructor(private f:rt.metakeys.Filter,c:Binding,private filterBinding:IBinding){
        super(c);
        this.startListening();
        this.valueChanged(null);
    }
    run(){
        var vl="";
        if (this.f.filter.noFilterValue){
            vl=this.f.filter.noFilterValue
        }
        this.filterBinding.set(vl);
    }
    valueChanged(e:rt.ChangeEvent){
        super.valueChanged(e);
        this.title=this.defaultTitle();

    }

    defaultTitle(){
        if (!this.f){
            return "Filter";
        }
        var pt=rt.service.property(this.depBnd.type(),this.f.filter.property);
        var pc=rt.service.caption(pt).toLowerCase();
        return "Clear "+rt.service.caption(this.filterBinding.type()).toLowerCase()+" filter";//
    }

    isEnabled(){
        if (this.filterBinding) {
            return this.filterBinding.get()&&((this.filterBinding.get()!=this.f.filter.noFilterValue)||(!this.f.filter.noFilterValue));
        }
        return true;//
    }
}
export class FilterAction extends actions.CollectionAction{

    constructor(private f:rt.metakeys.Filter,c:Binding,private filterBinding:IBinding){
        super(c);
        this.startListening();
        this.valueChanged(null);
    }
    run(){
        var vl=this.depBnd.get();
        var filterVal = rt.service.getValue(this.depBnd.type(),vl, this.f.filter.property, this.depBnd);
        filterVal=rt.service.convert(this.filterBinding.type(),this.depBnd.binding(this.f.filter.property).type(),filterVal)
        this.filterBinding.set(filterVal);
    }
    valueChanged(e:rt.ChangeEvent){
        super.valueChanged(e);
        this.title=this.defaultTitle();
    }

    defaultTitle(){
        if (!this.f){
            return "Filter";
        }
        var vl=this.depBnd.get();

        if (vl) {
            var filterVal = rt.service.getValue(this.depBnd.type(),vl, this.f.filter.property, this.depBnd);
            var opName=""
            switch (this.f.filter.op){
                case "eq":
                    opName="equal";
                    break
                case "neq":
                    opName="equal";
                    break
                case "lt":
                    opName="less then";
                    break
                case "gt":
                    opName="greater then";
                    break
                case "le":
                    opName="less or equal then";
                    break
                case "ge":
                    opName="greater or equal then";
                    break
            }
            var pt=rt.service.property(this.depBnd.type(),this.f.filter.property);
            var pc=rt.service.caption(this.filterBinding.type()).toLowerCase();
            var nm="Constraint items to "+pc+" "+opName+" "+rt.service.label(filterVal,pt)
            return nm;
        }
    }

    isEnabled(){
        return this.depBnd.get()!==undefined&&this.depBnd.get()!==null;
    }
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
    private layout:rt.metakeys.ParametersLayout;
    private config: CollectionConfig

    constructor(private view:rt.ViewBinding){
        super();
        this._style.display="inline-flex";
        this.layout=<rt.metakeys.ParametersLayout>view.type();
    }
    psComposite:controls.Composite=new controls.Composite("span");

    _menu:controls.IContributionItem[];

    contribute():controls.IContributionItem[]{

        if(!this._menu) {
            var filters:controls.IContributionItem={
                id:"filters",
                title: "Filters",
                image:"fa-filter",
                items:[]
            }
            var allItems:controls.IContributionItem[]=[];

            var rs: controls.IContributionItem[] = []
            this.allConfigurableParameters().forEach(x => {
                if (x.enumeratedValues()) {
                    var menu=new actions.ValuesMenu(<rt.Binding>x);
                    if ((<rt.metakeys.Filter>x.type()).filter){
                        filters.items.push(menu);
                    }
                    if ((<rt.metakeys.Ordering>x.type()).ordering){
                        menu.image="fa-sort-numeric-desc"
                        allItems.push(menu);
                    }
                    //menu.image="fa-filter";

                }
                else{
                    var mm=<rt.metakeys.Filter>x.type();
                    if (mm.filter){
                        if (mm.filter.op&&mm.filter.property){
                            var lm={
                                title:rt.service.caption(x.type()),
                                items:[new FilterAction(mm,this.view,x),new ClearFilterAction(mm,this.view,x)]
                            }
                            filters.items.push(lm);
                        }
                    }
                }
            })
            if (filters.items.length>0){
                allItems.push(filters);
            }
            allItems=allItems.reverse();
            this._menu = allItems;
        }

        return this._menu;

    }

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
            ptype.properties[x.id()]={ id:"", displayName:rt.service.caption(x.type()),type:"boolean"};
        })
        tp._type=ptype;
        tp.value=this.visiblePars;
        tp.addListener(this);

        var b=new forms.PopoverSelect(tp,"glyphicon-cog","btn-success",false,false);
        if (this.layout.parametersLayout&&this.layout.parametersLayout.allowConfiguration!==false){
            this.children.push(b);
        }

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
            var initialVisibility=false;
            if (this.layout.parametersLayout){
                if (this.layout.parametersLayout.initiallyVisible){
                    this.layout.parametersLayout.initiallyVisible.forEach(s=>{
                        initialVisibility=true;
                        this.allConfigurableParameters().forEach(p=>{
                            if (p.id()==s){
                                pms.push(p);
                            }
                        })
                    })
                }
            }
            if (!initialVisibility){
            this.allConfigurableParameters().forEach(x => {


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
            })}

        }
        else{
            var already:string[]=[]
            if (this.layout.parametersLayout){
                if (this.layout.parametersLayout.initiallyVisible){
                    this.layout.parametersLayout.initiallyVisible.forEach(s=>{
                        initialVisibility=true;
                        this.allConfigurableParameters().forEach(p=>{
                            if (p.id()==s){
                                if (this.visiblePars[p.id()]) {
                                    pms.push(p);
                                    already.push(p.id())
                                }
                            }
                        })//
                    })
                }
            }
            this.allConfigurableParameters().forEach(x => {
                if (this.visiblePars[x.id()]&&already.indexOf(x.id())==-1){
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