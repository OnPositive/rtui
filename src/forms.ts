import controls=require("./controls");

import tps=require("raml-type-bindings")
import uifactory=require("./uifactory")
import IBinding=tps.IBinding
import IPropertyGroup=tps.ts.IPropertyGroup;
import wb=require("./workbench");
import {IControl, Label, Composite, WrapComposite, VerticalFlex} from "./controls";


var sheet = document.createElement('style')
sheet.innerHTML = `.tab-content>.active.grabVertical {
display: flex;
flex: 1 1 auto;
}
.active{
z-index: 0; 
}
.pagination>.active>a, .pagination>.active>a:focus, .pagination>.active>a:hover, .pagination>.active>span, .pagination>.active>span:focus, .pagination>.active>span:hover {
z-index: 0;
}
.list-group-item.active, .list-group-item.active:focus, .list-group-item.active:hover  {
    z-index: 0;
}
.list-group-item.noRoundBorder {
    border-left-width: 0px;
    border-right-width: 0px;
    
}
.list-group-item.noRoundBorder:first-child {
    border-top-left-radius: 0px;
    border-top-right-radius: 0px;
}
.list-group-item.noRoundBorder:last-child {
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
}
.glyphicon-refresh-animate {
    -animation: spin .7s infinite linear;
    -webkit-animation: spin2 .7s infinite linear;
}

@-webkit-keyframes spin2 {
    from { -webkit-transform: rotate(0deg);}
    to { -webkit-transform: rotate(360deg);}
}

@keyframes spin {
    from { transform: scale(1) rotate(0deg);}
    to { transform: scale(1) rotate(360deg);}
}
`;
document.body.appendChild(sheet);
const ERROR=`<span class="alert-danger" style="background-color: transparent" role="alert">
        <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> </span>`
export class TabFolder extends controls.WrapComposite implements controls.HasChildValidnessDecorations{

    grabVertical: boolean=true

    constructor(){
        super("div")
        if (this.grabVertical) {
            this._style.flex = "1 1 auto";
            this._style.display = "flex";
            this._style.flexDirection = "column"
        }
    }
    canShrinkVertically():boolean{
        return this.grabVertical;
    }

    setChildValidness(validness:boolean[]){
        for (var i=0;i<validness.length;i++){
            var tb=document.getElementById(this.id()+"tab"+i);
            if (tb){
                if (!validness[i]){
                    tb.innerHTML=this.children[i].title()+ERROR;
                }
                else{
                    tb.innerText=this.children[i].title();
                }
            }
        }
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
            <a  href="#${"w"+x.id()}" data-toggle="tab" id="${this.id()+"tab"+i}">${x.title()}</a>
            </li>`;
            c+=t;
        })
        ll.innerHTML=c;
        for (var i=0;i<ll.children.length;i++){
            (<HTMLElement>ll.children.item(i)).onclick=(e)=>{
               this.potentiallyVisible()
            }
        }
        ch.appendChild(ll);
    }

    protected wrap(p:HTMLElement,c?:IControl){
        var d=document.createElement(this.wrapElement);

        d.id="w"+c.id();
        d.classList.add("tab-pane")
        if (this.grabVertical) {
            d.classList.add("grabVertical")//
        }
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
        if (this.grabVertical) {
            cc.style.flex = "1 1 auto";
            cc.style.display = "flex";
            cc.style.flexDirection = "column"
        }
        ch.appendChild(cc);
        super.renderChildren(cc);
    }

}
export class InputGroup extends controls.Composite implements  controls.HasChildValidnessDecorations{

    setChildValidness(validness:boolean[]){
        var allValid=true;
        validness.forEach(x=>{allValid=allValid&&x});
        if (this.children.length>0){
            if (this.children[0] instanceof InputGroupAddOn){
                (<InputGroupAddOn>this.children[0]).setValid(allValid);
            }
        }
    }
    constructor() {
        super("div")
        this.addClassName("input-group")
        this.addClassName("input-group-sm");
        this._style.padding = "5px";
    }
    weapperForChild:boolean=true;
}

export class InputGroupAddOn extends controls.Composite {

    valid: boolean=true;
    setValid(v:boolean){
        this.valid=v;
        this.refresh();
    }
    constructor() {
        super("div")
        this._text=""
        this.addClassName("input-group-addon")
    }
    protected renderChildren(ch: HTMLElement) {
        super.renderChildren(ch);
        if (!this.valid){
            ch.innerHTML=ch.innerHTML+ERROR
        }
    }
    setWidth(w:number){
        if (this._element){
            (<HTMLElement>this._element).style.width=w+"px";
        }
    }
    private desiredWidth;
    width(){
        if (this.desiredWidth){
            return this.desiredWidth;
        }
        if (this._element) {
            var dv=this._element.getBoundingClientRect().width+10;
            if (dv>20){
                this.desiredWidth=dv;
                return dv;
            }
            return dv;
        }
        return -1;
    }
}

export abstract class BindableControl extends controls.Composite {
    _binding: tps.IBinding


    valListener:tps.IValueListener;

    private oldVal;
    protected updateVisibility(){
        this.setVisible(tps.service.isVisible(this._binding.type(),this._binding));
        var m:tps.metakeys.VisibleWhen&tps.metakeys.DisabledWhen=this._binding.type();
        var disabled=false;
        if (m.disabledWhen){
            disabled=tps.calcCondition(m.disabledWhen,this._binding);
        }
        if (tps.service.isReadonly(this._binding.type())){
            disabled=true;
        }
        this.setDisabled(disabled);
        var val=this._binding.get();
        if (val!=this.oldVal) {
            this.oldVal=val;
            this.updateFromValue(val);
        }
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

export class BindableComposite extends BindableControl {

    hasContent:boolean

    protected initBinding(ch: HTMLElement){

    }
    needsVerticalScroll(){
        return true;
    }
    hasVerticalSchrink(){
        return super.hasVerticalSchrink();
    }
    protected updateVisibility(){
        super.updateVisibility();
        var cl=this._binding.get()!=null&&this._binding.get()!=undefined
        if (cl!=this.hasContent){
            this.refresh();
        }
    }
    onAttach(e:Element){
        super.onAttach(e);
    }

    afterCreate?:(c:BindableControl)=>void

    renderChildren(ch:HTMLElement){
        this.hasContent=this._binding.get()!=null&&this._binding.get()!=undefined;
        if (this.hasContent){
            super.renderChildren(ch)
        }
        else{
            //var cm=new Composite("div");
            ch.innerHTML=(`<div style="flex: 1 1 0"></div><div style="text-align: center">Please select ${this._binding.type().displayName.toLowerCase()} to see details</div><div style="flex: 1 1 0"></div>`);
            //super.renderElements([cm],ch)
        }
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
        this._style.paddingLeft="1px";
        this._style.paddingRight="1px";
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
export class Link extends controls.Composite{
    constructor(txt:string=""){
        super("a");
        this.attrs["href"]="#";
        this._text=txt;
    }
}

export class PagingControl extends BindableControl{

    constructor(b:Binding){
        super("nav");
        this._binding=b;
        this._style.margin="0px";
        this._style.padding="0px";
    }
    initBinding(){

    }

    start=0;
    end=5;
    protected updateFromValue(v:any){
        this.refresh();
    }
    renderChildren(ch:HTMLElement){
        var cm=new Composite("ul");
        var paged=<tps.storage.PagedCollection>this._binding
        cm._style.margin="2px";
        cm.addClassName("pagination");
        cm.addClassName("pagination-sm");
        let startPage=this.start;
        var prev=new Composite("li");

            prev.addHTML(`<a href="#" aria-label="Previous" >
        <span aria-hidden="true">&laquo;</span>
      </a>`);
        if (startPage==0){
            prev.addClassName("disabled")
        }
        cm.add(prev);
        let endPage=this.end;

        for (var i=startPage;i<endPage;i++){
            var pg=new Composite("li");
            if (i==paged.pageNum()){
                pg.addClassName("active");
            }
            let vl=i;
            if (paged.isLoading()&&i==paged.pageNum()){
                pg.addHTML('<span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>')
            }
            else pg.add(new Link(""+(i+1)));
            pg.onClick=(e)=>{paged.requestPage(vl)}

            cm.add(pg);
        }
        var next=new Composite("li")
        next.addHTML(`<a href="#" aria-label="Next">
        <span aria-hidden="true">&raquo;</span>        
        
      </a>`)
        if (endPage) {
            next.onClick = (e) => {
                paged.requestPage(this.end);
                this.end++;
                this.start++
            }
        }
        if (startPage!=0) {
            prev.onClick = (e) => {
                paged.requestPage(this.start - 1);
                this.end--;
                this.start--
            }//
        }

        if (paged.total()){
            cm.addHTML(`<span style="margin: 5px"> showing  ${paged.collectionBinding().workingCopy().length} ${tps.service.caption(paged.type()).toLocaleLowerCase()} of ${paged.total()}</span>`);
        }
        cm.add(next);
        this.children=[cm];
        super.renderChildren(ch)
    }
}
import workbench=require("./workbench")
export class MasterDetails extends controls.HorizontalFlex{

    useSplit=true;


    spEl:HTMLElement;
    onAttach(e:Element){
        if (this.useSplit){
            var lp=new workbench.LayoutPart(this._element);

            var lps=lp.splitHorizontal([50,50],true);
            this.spEl=<HTMLElement>lp.element();
            (<HTMLElement>lps[0].element()).style.maxHeight="100%";
            (<HTMLElement>lps[1].element()).style.maxHeight="100%";
            var  v=new VerticalFlex();
            v._style.flex="1 1 0";
            v._style.overflow="hidden";
            v.add(this.lst);//
            v.render(lps[0].element());
            this.createDetails(this.lst).render(lps[1].element());
        }
        super.onAttach(e);
    }
    potentiallyVisible(){
        if (this.useSplit&&this.spEl&&this.spEl.children[0]){
            if((<any>this.spEl.children[0]).onresize) {
                setTimeout(()=>{
                    let pair = (<any>this.spEl.children[0]).pairs[0];
                    (<HTMLElement>pair.a).style.width=(this.spEl.children[0].clientWidth/2-pair.aGutterSize)+"px";
                    (<HTMLElement>pair.b).style.width=(this.spEl.children[0].clientWidth/2-pair.bGutterSize)+"px";
                    pair.calculateSizes.call(pair);
                    pair.fitMin.call(pair);
                    pair.rebalance.call(pair);
                },50)

//
            }//
        }
        super.potentiallyVisible();
    }

    constructor(private lst:AbstractListControl){
        super();
        if (this.useSplit){
            delete this._style.flexDirection;
            this._style.width="100%";
            this._style.flex="1 1 0";
            return;
        }

        var cm=new controls.Composite("div");
        cm._style.flex="1 2 0";
        cm._style.display="flex";
        cm._style.overflowY="auto";
        cm._style.flexDirection="column";
        //cm.add(new PagingControl());
        cm.add(lst);
        this.add(cm);

        var cm1 = this.createDetails(lst);
        this.add(cm1);
    }

    private createDetails(lst: AbstractListControl) {
        var bnd = lst.selectionBinding;
        this._style.flex = "1 1 0";
        bnd.readonly = true;
        var cm1 = new BindableComposite("div");
        cm1._binding = bnd;
        cm1._style.display = "flex";
        cm1._style.flexDirection = "column";
        cm1._style.flex = "1 1 0";

        cm1._style.marginBottom = "5px";
        cm1._style.borderLeftStyle = "solid"
        cm1._style.borderLeftColor = "#eeeeee"
        //cm1._style.marginLeft="5px";//
        var cntrl = <controls.Composite>uifactory.service.createControl(bnd, {noStatus: true});
        if (cntrl.canShrinkChildrenVertically()) {
            cntrl._style.flex = "1 0 auto";
        }
        cm1.add(cntrl);
        return cm1;
    }
}
export class StatusRender extends BindableControl implements tps.IValueListener{

    valueChanged(e:tps.ChangeEvent){
        this.processChanges();
    }

    constructor(){
        super("div");
    }
    displayMessage:boolean=true;
    displayDecorations:boolean=true;

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
            if (this.displayMessage) {
                var msg = new controls.ErrorMessage();
                msg.setMessage(st.message);
                msg.render(this.content);
            }
        }
        else{
            this.content.innerHTML="";
        }
        if (this.displayDecorations) {
            var mn: Map<string,tps.Status> = new Map();
            this.visit(st, mn);
            this.updateStatusDecorations(this.parent, mn);
        }
    }
    updateStatusDecorations(c:IControl,mn:Map<string,tps.Status>):boolean{
        var valid=true;
        var bnd=(<BindableControl>c)._binding
        var shouldIterateChildren=true;
        if (bnd&&bnd.root()!=this._binding.root()){
            shouldIterateChildren=false;
        }
        if (shouldIterateChildren&&(<controls.AbstractComposite>c).children){
            var ch=(<controls.AbstractComposite>c).children;

            var validness:boolean[]=[];
            ch.forEach(child=>{
                var vl=this.updateStatusDecorations(child,mn);
                valid=valid&&vl;
                validness.push(vl);
            })
            if ((<controls.HasChildValidnessDecorations><any>c).setChildValidness){
                (<controls.HasChildValidnessDecorations><any>c).setChildValidness(validness);
            }
        }
        var bnd=(<BindableControl>c)._binding;
        if (bnd&&bnd.root()==this._binding.root()){
            if (mn.has(bnd.path())){
                var ss=mn.get(bnd.path());
                if (!ss.valid){
                    if (c instanceof AbstractListControl){
                        var lst=c;
                        lst.setStatus(ss);
                    }
                    return false;
                }
            }
            else if (c instanceof AbstractListControl){
                var lst=c;
                lst.setStatus(tps.ok());
            }
        }
        return valid;
    }

    visit(s:tps.Status,mn:Map<string,tps.Status>){
        if (s.path){
            mn.set(s.path,s);
        }
        if (s.inner){
            s.inner.forEach(x=>this.visit(x,mn));
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
                 (<AbstractListControl>this.body.children[0]).parent=this;
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

export class Footer extends Composite{

    needsVerticalScroll(){
        return false;
    }
    constructor(lst:AbstractListControl){
        super("div");
        this._style.width="100%";
        this._style.flex="1 1 auto"
        ///this._style.background="gray";

        this.add(new PagingControl(<Binding>lst._binding));

    }

    innerRender(r:Element){
        super.innerRender(r)
    }

}
export abstract class AbstractListControl extends BindableControl implements ISelectionProvider{

    contentPrepared:boolean;
    sl: ISelectionListener[]=[];
    private selection:any=[];

    private sm:{ [name:string]:Status}={};

    loading: boolean;

    footer: Footer;

    tag(){
        if (this.loading){
            return "div";
        }
        return super.tag();
    }
    protected addLabel(v: any, rs: Composite,t: tps.Type) {
        var lab = tps.service.label(v, t);
        if (!lab){
            lab="";
        }
        if ((<tps.metakeys.Label>t).htmlLabel){
            rs.addHTML(lab);
        }
        else {
            var label = rs.addLabel(lab);
        }
        return label;
    }

    visitInner(v:tps.Status){
        if (v){
            if (v.inner){
                v.inner.forEach(x=>{
                    if (!x.valid){
                        if (x.path&&x.path.charAt(0)=='[') {
                        this.sm[x.path]=x;
                        }
                        else{
                            this.visitInner(x);
                        }
                    }
                })
            }
        }
    }

    setStatus(v:tps.Status){
        if (v.valid){
            if (Object.keys(this.sm).length==0){
                return;
            }
        }
        this.sm={};
        this.visitInner(v);
        this.dataRefresh();
    }
    hasError(num:number){
        var err= this.sm["["+num+"]"];
        return err!=null&&err!=undefined;
    }

    canShrinkVertically():boolean{
        return true;
    }
    canShrinkChildrenVertically(){
        return false;
    }

    readonly selectionBinding:tps.Binding=new tps.Binding("selection");
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
        return [].concat(this.selection);
    }
    setSelection(v:any[],refresh=true){
        this.selection=v;
        this.contentPrepared=false;
        if (refresh) {
            this.dataRefresh();
        }
        this.sl.forEach(x=>x.selectionChanged(v));
        if (this.selectionBinding){
            var r=this.selectionBinding.readonly;
            this.selectionBinding.readonly=false;
            if (v.length==1){
                this.selectionBinding.set(v[0]);
            }
            else if (v.length==0){
                this.selectionBinding.set(null);
            }
            else{
                this.selectionBinding.set([].concat(v));
            }
            this.selectionBinding.readonly=r;
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
     createBody():controls.Composite{
        return null;
     }
     /**
     * inits binding
     * @param ch
     */
    initBinding(ch:HTMLElement):any{

        if (this._binding){
            this.selectionBinding._type={ type:this._binding.collectionBinding().componentType(), owningCollection: this._binding, uniquinessException: this.selectionBinding};
            this.selectionBinding.context=this._binding;
            this.selectionBinding.autoinit=false;
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
    createHolder(){
        return new Composite("div")
    }
    tempStyle:any;

    body:Composite

    private prepareContent() {
        if (this.contentPrepared){
            return;
        }
        var val=this._binding.get();
        if (this._binding.isLoading()||this._binding.isError()){
            this.contentPrepared=true;
            this.loading=true;
            var cc:controls.AbstractComposite=null;
            if (this._binding.isError()){
                cc=new controls.Error(this._binding.errorMessage(),()=>{
                    this._binding.clearError();
                })
            }//
            else {
                cc = new controls.Loading();
            }
            if (!this.tempStyle) {
                this.tempStyle = this._style;
            }
            this._style=<any>{};
            this._style.display="flex";
            this._style.flexDirection="column";
            this._style.flex="1 1 0";
            this._style.margin="4";//
            this.children=[]
            this.add( cc);
            this.refresh();
            return;
        }
        else{
            if (this.loading){
                this.loading=false;
                if (this.tempStyle) {
                    this._style = this.tempStyle;
                    this.parent.refresh();
                    delete this.tempStyle;
                }
            }
        }
        var ac = this._binding.collectionBinding().workingCopy();
        this.children=[]
        var c=this.createHeader();
        if (c){
            this.children.push(c);
        }
        var body=this.createBody();
        this.body=body;
        var contentB:controls.Composite=this;
        if (body){
            this.children.push(body);
            contentB=body;
        }
        this.fillBody(ac, contentB);
        this.contentPrepared=true;
        if (ac.length==0){
            this.children=[]
            var comp=new controls.Composite("div");
            comp._style.padding="10px";
            comp.addLabel("Nothing here yet");
            this.add(comp)
        }
        else if (this.needPaging()){
            this.footer=new Footer(this);
            this.add(this.footer);
        }
        this.refresh();
    }

    needPaging(){
        return (<tps.metakeys.WebCollection>this._binding.type()).paging
    }

    protected fillBody(ac: any[], contentB: controls.Composite) {
        var i = 0;
        ac.forEach(x => {
            var cc = this.toControl(x, i);
            this.customizers.forEach(c => c.customize(cc, i, x))
            i++;
            contentB.children.push(cc);
        })
        var hasRemovals = false;
        var newSelection: any[] = [];
        this.selection.forEach(v => {
            if (!this.existInValue(v, ac)) {
                hasRemovals = true;
            }
            else {
                newSelection.push(v);
            }
        })
        this.selection = newSelection;
        if (hasRemovals) {
            this.setSelection(newSelection,false);
        }
    }

    abstract toControl(v:any,position:number):controls.IControl;
}
import uif=require("./uifactory")
import {ISelectionProvider, ISelectionListener} from "./workbench";
import {IValueListener, ChangeEvent, binding, Binding, Status, IGraphPoint} from "raml-type-bindings";
import {ListenableAction} from "./actions";
export class SimpleListControl extends AbstractListControl{

    constructor(){
        super("ul")
        this.addClassName("list-group");
        this._style.margin="0px";
    }

    toControl(v:any,position): controls.IControl{

        var rs= new Composite("li")
        rs.addClassName("list-group-item")
        rs.addClassName("noRoundBorder")
        rs._style.cursor="pointer";
        if (this.isSelected(v)){
            rs.addClassName("active");
        }
        var label = this.addLabel(v, rs,this._binding.collectionBinding().componentType());
        if (this.hasError(position)){
            rs.addHTML(ERROR);
        }
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
declare var require:any
var ft:any=require("fixed-header-table");

var h:any=require("javascript-detect-element-resize")
declare function addResizeListener(e:Element,v:()=>void);
export class TableControl extends AbstractListControl{


    constructor(){
        super("div")
        this.addClassName("table");
        this.addClassName("table-striped1");
        this._style.display="flex";
        this._style.margin="0px";
        this._style.flexDirection="column"
        this._style.overflowX="hidden";
    }

    private sizes: { [name:string]: number};


    refresh(){
        super.refresh();
        if (this.attached) {
            this.resizeHeaders();
        }
    }
    public dataRefresh(){
        this.contentPrepared=false;
        var vc=this._binding.collectionBinding().workingCopy();
        this.sizes=this.estimateSizes(vc);
        if (this.children.indexOf(this.body)==-1||vc.length==0){
            super.dataRefresh();
        }
        else if (this.body) {
            this.body.children = [];
            this.fillBody(vc,this.body);
            this.contentPrepared=true;
            this.body.refresh()
            if (this.footer){
                this.footer.refresh();
            }
        }
        this.resizeHeaders();
    }
    estimateSizes(v:any[]){
        var ps = this.columnProps();
        var mmm:{ [name:string]: number}={};
        ps.forEach(x=>{
            var val=mmm[x.id];
            if (!val){
                val=0;
            }
            if (x.displayName.length>val){
                val=x.displayName.length;
            }
            v.forEach(y=>{
                var lab=tps.service.label(tps.service.getValue(x.type,y,x.id),x.type);
                if (!lab){
                    lab="";
                }
                if (lab.length>val){
                    val=lab.length;
                }
            })
            mmm[x.id]=val;
        })
        return mmm;
    }
    header:Composite;

    createHeader():controls.Composite{
        var header= new Composite("div");
        var vc=this._binding.collectionBinding().workingCopy();
        this.sizes=this.estimateSizes(vc);
        header._style.fontWeight="bold"
        header.addClassName("list-group-item")
        header._style.display="flex";
        header.addClassName("noRoundBorder");
        header._style.flexDirection="row";
        header._style.borderTopWidth="0px";
        header._style.borderBottomWidth="1px";
        header._style.borderBottomStyle="solid";
        header._style.flex="0 0 auto";

        var ps = this.columnProps();
        ps.forEach(x=>{
            var th=new Composite("div");
            th.addLabel(x.displayName);
            th._style.flex=this.calcFlex(x);
            th._style.borderBottomWidth="0px";
            header.add(th)
        })
        this.header=header;
        return header;
    }

    private calcFlex(x) {
        return this.sizes[x.id] + " " + this.sizes[x.id] + " 50px";
    }
    attached: boolean
    onAttach(e:Element){
        this.attached=true;
        super.onAttach(e);
        if (e.parentElement.parentElement) {
            addResizeListener(e.parentElement.parentElement, () => {
                this.resizeHeaders();
            })
        }
        this.resizeHeaders();
    }

    private resizeHeaders() {
        if (this.body) {
            if (this.body.children.length > 0) {
                var mm = <Composite>this.body.children[0]
                if (mm) {
                    var el=document.getElementById(mm.id());
                    if (el) {
                        var ww = el.clientWidth - 10;//
                        (mm.children).forEach((x, i) => {
                            var el = document.getElementById(x.id());
                            var w = el.clientWidth;
                            document.getElementById(this.header.children[i].id()).style.flex = "0 0 " + w + "px";
                        })
                    }
                }
            }
        }
    }

    private columnProps() {
        var ps = tps.service.visibleProperties(this._binding.collectionBinding().componentType())
        var groups=tps.service.propertyGroups(this._binding.collectionBinding().componentType());
        let columns=(<tps.metakeys.DefaultColumns>this._binding.type()).columns;
        if (columns){
            return ps.filter(x=>columns.indexOf(x.id)!=-1);
        }
        if (groups.length>0&&groups[0]){
            ps=groups[0].properties;
        }
        return ps;
    }
    createBody():controls.Composite{
        var bd=new Composite("div");
        bd._style.overflowY="auto"
        bd.addClassName("table");
        bd.addClassName("table-striped");
        bd._style.flex="1 1 auto";
        bd._style.margin="0";
        return bd;
    }
    toControl(v:any,position:number): controls.IControl{

        var lab=tps.service.label(v,this._binding.type());
        var rs= new Composite("li")
        rs._style.display="flex";
        rs._style.flexDirection="row";
        var ps = this.columnProps();
        var sel=this.isSelected(v);
        rs.addClassName("noRoundBorder");
        rs.addClassName("list-group-item")

        if (sel) {
            rs.addClassName("active")//
        }
        ps.forEach((p,i)=>{
            var td=new Composite("div");
            td._style.display="inline"
            td._style.flex=this.calcFlex(p);
            td.addClassName("col")
            if (i==0&&(<tps.metakeys.Icon>this._binding.collectionBinding().componentType()).icon){
                td.addHTML(`<img style="margin-right: 4px" src="${(<tps.metakeys.Icon>this._binding.collectionBinding().componentType()).icon}"></img>`)
            }
            this.addLabel(tps.service.getValue(p.type,v,p.id),td,p.type)

            if (i==0){
                if (this.hasError(position)){
                    td.addHTML(ERROR);
                }
            }
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