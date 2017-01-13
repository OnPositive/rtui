import controls=require("./controls");

import tps=require("raml-type-bindings")
import IBinding=tps.IBinding
import IPropertyGroup=tps.ts.IPropertyGroup;
import wb=require("./workbench");
import {IControl, Label, Composite, WrapComposite, VerticalFlex} from "./controls";


export class TabFolder extends controls.WrapComposite{

    constructor(){
        super("div")
    }

    protected extraRender(ch: HTMLElement) {
        var rs:string[]=[];
        var ll=document.createElement("ul");
        ll.classList.add("nav")
        ll.classList.add("nav-tabs");
        var c=""

        this.children.forEach((x,i)=>{
            var t=`      
            <li class="${i==0?'active':''}">
            <a  href="#${"w"+x.id()}" data-toggle="tab">${x.title()}</a>
            </li>`;
            c+=t;
        })
        ll.innerHTML=c;
        ch.appendChild(ll);
    }

    protected wrap(p:HTMLElement,c?:IControl){
        var d=document.createElement(this.wrapElement);

        d.id="w"+c.id();
        d.classList.add("tab-pane")
        if (this.children.indexOf(c)==0){
            d.classList.add("active")
        }
        p.appendChild(d);
        return d;
    }

    protected renderChildren(ch: HTMLElement) {
        var cc=document.createElement("div");
        cc.classList.add("tab-content")
        cc.classList.add("clearfix")
        ch.appendChild(cc);
        super.renderChildren(cc);
    }

}
export class InputGroup extends controls.Composite {

    constructor() {
        super("div")
        this.addClassName("input-group")
        this.addClassName("input-group-sm");
        this._style.padding = "5px";
    }
    weapperForChild:boolean=true;
}

export class InputGroupAddOn extends controls.Composite {

    constructor() {
        super("div")
        this.addClassName("input-group-addon")
    }
}



export abstract class BindableControl extends controls.Composite {
    _binding: tps.IBinding


    valListener:tps.IValueListener;

    protected updateVisibility(){
        var m:tps.metakeys.VisibleWhen&tps.metakeys.DisabledWhen=this._binding.type();
        var visible=true;
        if (m.visibleWhen){
            visible=visible&&tps.calcCondition(m.visibleWhen,this._binding);
        }
        var vl=this._binding.type();
        if ((<any>vl).discriminateCondition){
            var cond:string[]=(<any>vl).discriminateCondition;
            if (this._binding.parent()){
                visible=visible&&this._binding.parent().binding(cond[0]).get()==cond[1];
            }
        }
        if (m.hiddenWhen){
            visible=visible&&!tps.calcCondition(m.hiddenWhen,this._binding)
        }
        this.setVisible(visible);
        var disabled=false;
        if (m.disabledWhen){
            disabled=tps.calcCondition(m.disabledWhen,this._binding);
        }


        if (tps.service.isReadonly(this._binding.type())){
            disabled=true;
        }
        this.setDisabled(disabled);
        var val=this._binding.get();
        this.updateFromValue(val);
        return;
    }
    protected updateFromValue(v:any){

    }




    protected renderContent(ch: HTMLElement) {
        super.renderContent(ch);
        var vv=this;
        if (!this.valListener){
            this.valListener={
                valueChanged(){
                    vv.updateVisibility();
                }
            }
        }
        this.initBinding(ch);
    }

    protected abstract initBinding(ch: HTMLElement);

    afterCreate?:(c:BindableControl)=>void

    onAttach(e:Element){
        super.onAttach(e);
        if (this.afterCreate){
            this.afterCreate(this)
        }
        if (this._binding){
            var m:tps.metakeys.VisibleWhen&tps.metakeys.DisabledWhen&tps.metakeys.EnumValues&tps.metakeys.TypeAhead=this._binding.type();
            //if (m.visibleWhen||m.hiddenWhen||m.disabledWhen||m.enumValues||m.typeahead){
            this._binding.root().addListener(this.valListener);
            this.updateVisibility();
            //}
        }
    }

    onDetach(e:Element){
        super.onDetach(e);
        this._binding.root().removeListener(this.valListener);
    }
}



export class Input extends BindableControl {
    constructor() {
        super("input")
        this.addClassName("form-control");

    }
    protected updateFromValue(v:any){
        var el: HTMLInputElement = <HTMLInputElement>this._element;
        if (v!=el.value){
            if (v===undefined||v===null){
                v="";
            }
            el.value=""+v;
        }
    }
    protected initBinding(ch: HTMLElement) {
        var el: HTMLInputElement = <HTMLInputElement>ch;
        if (this._binding) {
            var val = this._binding.get();
            if (!val) {
                val = "";
            }
            if (tps.service.isNumber(this._binding.type())){
                this._element.setAttribute("type","number");
                var mm:tps.NumberType=this._binding.type();
                if (mm.maximum){
                    this._element.setAttribute("maximum",""+mm.maximum);

                }
                if (mm.minimum){
                    this._element.setAttribute("minimum",""+mm.minimum);
                }
                if (mm.step){
                    this._element.setAttribute("step",""+mm.step);
                }
            }

            el.value = val;
            el.onkeyup = (e)=> {
                this._binding.set(el.value);
            }
            el.onchange = (e)=> {
                this._binding.set(el.value);
            }
        }
    }
}
export class TextArea extends BindableControl {
    constructor() {
        super("textarea")
        this.addClassName("form-control");
    }


    protected initBinding(ch: HTMLElement) {
        var el: HTMLInputElement = <HTMLInputElement>ch;
        if (this._binding) {
            var val = this._binding.get();
            if (!val) {
                val = "";
            }
            el.value = val;
            el.onkeyup = (e)=> {
                this._binding.set(el.value);
            }
        }
    }
}
export class Option extends controls.Composite {
    constructor(value: any) {
        super("option")
        this._text = value;
        //this.attrs.type="select";
        this.addClassName("form-control");

    }
}

export class Help extends controls.Composite {
    constructor(value: string) {
        super("span")
        this.addClassName("glyphicon")
        this.addClassName("glyphicon-question-sign")
        this._style.paddingLeft="3px";
        this.attrs["data-toggle"] = "tooltip"
        this.attrs["data-placement"] = "right"
        this.attrs.title = value;
    }
}
export let enumOptions = function (type: tps.Type, b: IBinding) {
    var enumv = type.enum;
    if (!enumv) {
        var enumF = (<tps.metakeys.EnumValues>type).enumValues;
        enumv = tps.calcExpression(enumF, b);
        if (!Array.isArray(enumv)) {
            if (typeof enumv == "object") {
                enumv = Object.keys(enumv);
            }
        }
    }

    if (!enumv) {
        enumv = []
    }
    return enumv;
};
export function enumValues(b:IBinding):any[]{
    let type = b.type();
    return enumOptions(type, b);
}

export class EnumInfo{
    labelsMap = new Map<string,any>();
    values:any[]=[]
    labels:any[]=[]
    selectedIndex:number=0;
    value: string
    constructor(private b:IBinding){
        var enumv:any[]=enumValues(b);
        var vl=b.get();
        var needCommit=(!vl)&&b.type().required;
        if (needCommit&&enumv.length>0){
            vl=enumv[0];
            b.set(vl);
        }
        const hasDescriptions: tps.metakeys.EnumDescriptions = <any>b.type();
        for (var i = 0; i < enumv.length; i++) {
            var lab = enumv[i];
            var val = lab;
            if (hasDescriptions.enumDescriptions) {
                val = hasDescriptions.enumDescriptions[i];
            }
            else {
                if (typeof lab != "string") {
                    val = tps.service.label(lab, b.type());
                }
            }
            if (val===b.get()){
                this.selectedIndex=(i+(b.type().required?0:1));
            }
            this.labelsMap.set(val, lab);
            this.labels.push(val);
        }
        if (!b.type().required) {
            this.labels.push('');
            this.labelsMap.set('', '');
            if (!vl||this.labels.indexOf(vl)==-1){
                vl="";
                b.set("");
            }
        }
        else{
            if (enumv.indexOf(vl)==-1){
                this.b.set("");
            }
        }
        this.values=enumv;
    }
}


export class Select extends BindableControl {
    constructor() {
        super("select")
        this.addClassName("form-control");
    }
    selectInited:boolean
    enumOptions:string[]

    protected updateVisibility(){
        super.updateVisibility();
        var enumF=(<tps.metakeys.EnumValues>this._binding.type()).enumValues;
        if (enumF){
            var enumv=tps.calcExpression(enumF,this._binding);
            if (JSON.stringify(this.enumOptions)!=JSON.stringify(enumv)){
                this.selectInited=false;
                if (this._element) {
                    this.initBinding(<HTMLElement>this._element);
                }
            }
        }
    }
    protected initBinding(ch: HTMLElement) {
        var el: HTMLSelectElement = <HTMLSelectElement>ch;
        if (this._binding) {
            if (!this.selectInited) {
                var info=new EnumInfo(this._binding)
                this.enumOptions=[].concat(info.values);
                el.onchange = (e) => {
                    this._binding.set(info.labelsMap.get(el.value));
                }
                this.children = [];
                info.labels.forEach(x => {
                    this.children.push(new Option(x))
                })
                this.selectInited=true;
                this.refresh();
                el.selectedIndex=info.selectedIndex;
            }
        }
    }
}
export class RadioSelect extends BindableControl {
    constructor() {
        super("div")
        this._style.padding="5px";
    }
    initBinding(){}

    renderContent(e:HTMLElement){
        super.renderContent(e);
        var info=new EnumInfo(this._binding)
        var mm=document.createElement("div");
        mm.appendChild(document.createTextNode(this._binding.type().displayName));
        var descr=this._binding.type().description;
        if (descr){
            var h=new Help(descr);
            h._style.paddingLeft="2px"
            h._style.paddingRight="2px"
            h.render(mm);
        }
        mm.appendChild(document.createTextNode(':'));
        e.appendChild(mm);
        info.labels.forEach(x=>{
            var input=document.createElement("input");
            input.type="radio";
            var vl=info.labelsMap.get(x);
            input.onchange=(e)=>{this._binding.set(vl)};
            input.name=(this._binding.id());
            input.value=vl;
            if (vl==this._binding.get()){
                input.checked=true;
            }
            var lab=document.createElement("div")
            lab.appendChild(input);
            lab.appendChild(document.createTextNode(" "+x))
            e.appendChild(lab);
        });
    }

}

export class Button extends controls.Composite {
    constructor(text: string) {
        super("button")
        //this.attrs.type="select";
        this.addClassName("form-control");
        this.addClassName("btn")
        this.addClassName("btn-default")
        this._text = text;
    }
}

export class StatusRender extends BindableControl implements tps.IValueListener{

    valueChanged(e:tps.ChangeEvent){
        this.processChanges();
    }

    constructor(){
        super("div");
    }

    onAttach(e:Element){
        super.onAttach(e)
        if (this._binding){
            this._binding.binding("$status").addListener(this);
            this.processChanges();
        }
    }
    private content:Element;
    processChanges(){
        var st:tps.Status=this._binding.binding("$status").get();
        if (!this.content){
            var sp=document.createElement("span");
            this.content=sp;
            this._element.appendChild(sp);
        }
        if (st.severity==tps.Severity.ERROR){
            var msg=new controls.ErrorMessage();
            msg._message=st.message;
            msg.render(this.content);
        }
        else{
            this.content.innerHTML="";
        }
    }
    onDetach(e:Element){
        super.onDetach(e)
        if (this._binding){
            this._binding.binding("$status").removeListener(this);
        }
    }

    protected initBinding(ch: HTMLElement) {
    }
}

export abstract class ActionPresenter extends controls.Composite implements IValueListener{
    items: controls.IContributionItem[] = []

    onAttach(){
        this.items.forEach(i=>{
            var ls=<ListenableAction>i;
            if (ls.addListener){
                ls.addListener(this);
            }
        })
    }
    valueChanged(c:ChangeEvent){
        if (this._element) {
            this._element.innerHTML = "";
        }
        this.renderElement(<HTMLElement>this._element);

    }
    protected renderContent(ch: HTMLElement) {
        super.renderContent(ch);
        this.renderElement(ch);
    }

    abstract renderElement(e:HTMLElement);

    onDetach(){
        this.items.forEach(i=>{
            var ls=<ListenableAction>i;
            if (ls.removeListener){
                ls.removeListener(this);
            }
        })
    }
}

export class Toolbar extends ActionPresenter implements IValueListener{

    constructor() {
        super("span")
        this._styleString = "float: right";
    }
    renderElement(e:HTMLElement){
        var rnd = new controls.ToolbarRenderer(<any>this);
        rnd.style.marginRight = "5px";
        rnd.render(this._element);
    }
}
declare var $:any;
export class DropDown extends ActionPresenter implements IValueListener{

    constructor() {
        super("div")
        this._styleString = "float: right";
    }
    ownerId: string;
    onAttach(){
        super.onAttach()
        this.valueChanged(null);
    }
    renderElement(e:HTMLElement){
        var view=this;
        $.contextMenu({
            selector:"#"+view.ownerId+">*",
            build:()=>{ return { items: view.mapItems()}}
        })
    }
    mapItems(){
        var result={}
        this.items.forEach(x=>{
            result[x.id?x.id:x.title]={
                name:x.title,
                icons:x.image,
                disabled:x.disabled,
                callback: ()=>{ x.run() }
            }
        })
        return result;
    }

    addTo(v:Composite){
        this.ownerId=v.id();
        var view=this;
        v.addLifycleListener({
            attached(c,e){

                view.renderElement(<HTMLElement>e);
            },
            detached(c,e){

            }
        })
    }
}

export class Section extends controls.Composite {

    heading: Composite;
    toolbar: Toolbar = new Toolbar();
    body: Composite= new controls.WrapComposite("div");





    add(c: IControl) {
        this.body.add(c);
    }
    renderContent(ch:HTMLElement){
        if (this.parent instanceof TabFolder){
            this._style.borderRadius="0px";
            this.heading._style.borderTopWidth="0px";
            this._style.borderTopWidth="0px";
        }
        if ((this.parent instanceof TabFolder)) {
            this.heading._text = " ";
            this.heading._style.minHeight="40px";
            this.toolbar._styleString = "float: left";
            this.heading._style.paddingLeft = "5px";
        }
        super.renderContent(ch);
    }

    protected renderChildren(ch: HTMLElement) {
        if (this.body.children.length==1){
             if (this.body.children[0] instanceof AbstractListControl){
                this.renderElements([this.heading,this.body.children[0]],ch);

                return;
            }
        }
        super.renderChildren(ch)
    }

    constructor(title: string = "",grabVertical:boolean=false) {
        super("div");
        this.setTitle(title);
        this.addClassName("panel")
        this.addClassName("panel-default")
        var heading = new controls.WrapComposite("div");
        heading._text=this.title();
        heading.wrapElement = "span";
        heading.addClassName("panel-heading");
        if (!heading._text.trim()) {
            heading._style.minHeight="40px";

        }
        heading.add(this.toolbar);
        this._style.paddingBottom="0px"
        this._style.marginBottom="0px"
        if (grabVertical){
            this._style.display="flex";
            this._style.flexDirection="column";
            this._style.flex="1 1";
        }
        this.heading = heading;
        super.add(heading)
        this.body.addClassName("panel-body");
        if (grabVertical){
            this.body._style.display="flex";
            this.body._style.flexDirection="column";
            this.body._style.flex="1 1";
        }
        super.add(this.body);
    }
}



class RefreshOnChange implements IValueListener{
    constructor(private  c:AbstractListControl){

    }
    valueChanged(){
        this.c.dataRefresh();
    }
}
export interface  IControlCustomizer{
    customize(c:IControl,i:number,data:any);
}

export abstract class AbstractListControl extends BindableControl implements ISelectionProvider{

    contentPrepared:boolean;
    sl: ISelectionListener[]=[];
    private selection:any=[];

    selectionBinding:tps.Binding=new tps.Binding("selection");
    customizers:IControlCustomizer[]=[];

    addControlCustomizer(c:IControlCustomizer){
        this.customizers.push(c);
    }
    removeControlCustomizer(c:IControlCustomizer){
        this.customizers=this.customizers.filter(x=>x!=c);
    }
    labelCustomizers:IControlCustomizer[]=[];

    addLabelCustomizer(c:IControlCustomizer){
        this.labelCustomizers.push(c);
    }
    removeLabelCustomizer(c:IControlCustomizer){
        this.labelCustomizers=this.customizers.filter(x=>x!=c);
    }

    addSelectionListener(v:ISelectionListener){
        this.sl.push(v);
    }
    removeSelectionListener(v:ISelectionListener){
        this.sl=this.sl.filter(x=>x!==v);
    }
    select(v:any){
        this.setSelection([v]);
    }


    getSelection():any[]{
        return this.selection;
    }
    setSelection(v:any[]){
        this.selection=v;
        this.contentPrepared=false;
        this.prepareContent();
        this.sl.forEach(x=>x.selectionChanged(v));
        if (this.selectionBinding){
            if (v.length==1){
                this.selectionBinding.set(v[0]);
            }
            else if (v.length==0){
                this.selectionBinding.set(null);
            }
            else{
                this.selectionBinding.set(v);
            }
        }
    }
    private rff=new RefreshOnChange(this)
    onAttach(e:Element){
        this._binding.addListener(this.rff);
        super.onAttach(e);
    }
    onDetach(e:Element){
        this._binding.removeListener(this.rff);
        super.onDetach(e);
    }
    createHeader():IControl{
        return null;
     }
     createBody():controls.AbstractComposite{
        return null;
     }
     /**
     * inits binding
     * @param ch
     */
    initBinding(ch:HTMLElement):any{

        if (this._binding){
            this.selectionBinding._type=this._binding.collectionBinding().componentType();
            this.selectionBinding.context=this._binding;
            this.prepareContent();
        }
    }
    componentType(){
        return this._binding.collectionBinding().componentType();
    }
    public dataRefresh(){
        this.contentPrepared=false;
        this.prepareContent();
    }

    isSelected(v){
        return this.existInValue(v,this.getSelection());
    }
    existInValue(v,r:any[]){
        var plain=r.indexOf(v)!=-1;
        if (plain){
            return plain;
        }
        //check for value with same key
        var keyProp=tps.service.keyProp(this.componentType());

        if (keyProp){
            var vl=v[keyProp];
            if(vl) {
                plain=plain||(r.filter(x => x[keyProp] ===vl).length!=0);
            }
        }
        //now we have complete result
        return plain;
    }
    private prepareContent() {
        if (this.contentPrepared){
            return;
        }
        var ac = this._binding.collectionBinding().workingCopy();
        this.children = [];

        var c=this.createHeader();
        if (c){
            this.children.push(c);
        }
        var body=this.createBody();
        var contentB:controls.AbstractComposite=this;
        if (body){
            this.children.push(body);
            contentB=body;
        }
        var i=0;
        ac.forEach(x => {
            var cc=this.toControl(x,i);
            this.customizers.forEach(c=>c.customize(cc,i,x))
            i++;
            contentB.children.push(cc);
        })
        var hasRemovals=false;
        var newSelection:any[]=[];
        this.selection.forEach(v=>{
            if (!this.existInValue(v,ac)){
                hasRemovals=true;
            }
            else{
                newSelection.push(v);
            }
        })
        this.selection=newSelection;
        if (hasRemovals){
            this.setSelection(newSelection);
        }
        this.contentPrepared=true;
        if (ac.length==0){
            this.children=[]
            var comp=new controls.Composite("div");
            comp._style.padding="10px";
            comp.addLabel("Nothing here yet");
            this.add(comp)
        }
        this.refresh();
    }

    abstract toControl(v:any,position:number):controls.IControl;
}
import uif=require("./uifactory")
import {ISelectionProvider, ISelectionListener} from "./workbench";
import {IValueListener, ChangeEvent, binding, Binding} from "raml-type-bindings";
import {ListenableAction} from "./actions";
export class SimpleListControl extends AbstractListControl{

    constructor(){
        super("ul")
        this.addClassName("list-group");
    }
    toControl(v:any,position): controls.IControl{
        var lab=tps.service.label(v,this._binding.type());
        var rs= new Composite("li")
        rs.addClassName("list-group-item")
        rs._style.cursor="pointer";
        if (this.isSelected(v)){
            rs.addClassName("active");
        }
        var label=rs.addLabel(lab);

        this.labelCustomizers.forEach(x=>x.customize(label,position,v));
        rs.onClick=()=>{
            this.setSelection([v]);
        }
        return rs;
    }
}
export class ButtonMultiSelectControl extends AbstractListControl{

    constructor(){
        super("div")
        //this.addClassName("list-group");
    }
    toControl(v:any): controls.IControl{
        var lab=tps.service.label(v,this._binding.type());
        var rs= new Button(lab);
        rs._classNames=["btn","btn-xs","btn-primary"]
        rs._style.margin="3px";
        rs._style.cursor="pointer";
        rs.onClick=()=>{
            if (!this.isSelected(v)){
                rs.removeClassName("btn-primary")
                rs.addClassName("btn-success");
                var mm=[v].concat(this.getSelection());
                this.setSelection(mm);
            }
            else{
                rs.addClassName("btn-primary")
                rs.removeClassName("btn-success");
                var mm=[].concat(this.getSelection());
                mm=mm.filter(x=>x!=v);
                this.setSelection(mm);

            }
        }
        if (this.isSelected(v)){
            rs.addClassName("btn-success");
        }
        else{
            rs.addClassName("btn-primary");
        }
        return rs;
    }
}
export class TableControl extends AbstractListControl{



    constructor(){
        super("table")
        this.addClassName("table");
        this.addClassName("table-striped");
    }
    createHeader():controls.AbstractComposite{
        var header= new Composite("thead");
        var tr=new Composite("tr");
        header.add(tr);
        var ps = this.columnProps();
        ps.forEach(x=>{
            var th=new Composite("th");
            th.addLabel(x.displayName);
            th._style.borderBottomWidth="0px";
            tr.add(th)
        })
        return header;
    }

    private columnProps() {
        var ps = tps.service.visibleProperties(this._binding.collectionBinding().componentType())
        return ps;
    }
    createBody():controls.AbstractComposite{
        return new Composite("tbody");
    }
    toControl(v:any): controls.IControl{
        var lab=tps.service.label(v,this._binding.type());
        var rs= new Composite("tr")
        var ps = this.columnProps();
        var sel=this.isSelected(v);

        ps.forEach(p=>{
            var td=new Composite("td");
            if (sel) {
                td._style.backgroundColor = "#337ab7"
            }
            var val=v[p.id];
            if (!val){
                val="";
            }
            //adding label
            td.addLabel(val);
            rs.add(td);
        });
        rs._style.cursor="pointer";
        rs.onClick=()=>{
            this.setSelection([v]);
        }

        return rs;
    }
}

export class CheckBox extends BindableControl{

    constructor( caption:string=""){
        super("div")
        this.setTitle(caption)
        this.addClassName("checkbox")
        this.addClassName("checkbox-inline")
        this._style.paddingLeft="5px";
        this._style.paddingRight="2px";
        this._style.margin="0px";
    }

    innerSetDisabled(v: boolean){
        super.innerSetDisabled(v);
        if (v){
            (<HTMLElement>this._element).style.opacity="0.4"
        }
        else{
            (<HTMLElement>this._element).style.opacity="";
        }
    }
    protected initBinding(ch: HTMLElement): any {
        var lab=document.createElement("label")
        var input=document.createElement("input");
        input.type="checkbox";

        input.onchange=(e)=>{
            this._binding.set(input.checked);
        }
        if (this._binding){
            input.checked=(""+this._binding.get())=="true"
        }
        lab.appendChild(input);
        lab.appendChild(document.createTextNode(this.title()))
        ch.appendChild(lab)
    }
}