import controls=require("./controls");
import wb=require("./workbench");
import {IControl, Label, Composite, WrapComposite, VerticalFlex} from "./controls";
import {PropertyDescription, PropertyGroup,groupProps,collapseInnerProps} from "./properties";

export enum Severity{
    OK, WARNING, ERROR
}

export class Status {
    sev: Severity
    message: string
}

export class Form extends controls.Composite {
    constructor() {
        super("form")
        this._style.padding = "10px";
        this._style.width = "100%"
    }
}
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
}

export class InputGroupAddOn extends controls.Composite {

    constructor() {
        super("div")
        this.addClassName("input-group-addon")
    }
}

export abstract class BindableControl extends controls.Composite {
    _binding: IBinding

    protected renderContent(ch: HTMLElement) {
        super.renderContent(ch);
        this.initBinding(ch);
    }

    protected abstract initBinding(ch: HTMLElement);

}

export class Input extends BindableControl {
    constructor() {
        super("input")
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
        this.attrs["data-toggle"] = "tooltip"
        this.attrs["data-placement"] = "right"
        this.attrs.title = value;
    }
}
export class Select extends BindableControl {
    constructor() {
        super("select")
        //this.attrs.type="select";
        this.addClassName("form-control");
    }

    protected initBinding(ch: HTMLElement) {
        var el: HTMLSelectElement = <HTMLSelectElement>ch;
        if (this._binding) {
            el.value = this._binding.get();
            el.onchange = (e)=> {
                this._binding.set(el.value);
            }
        }
    }
}
export class Button extends controls.Composite {
    constructor(text: string) {
        super("button")
        //this.attrs.type="select";
        this.addClassName("form-control");
        this._text = text;
    }
}



export class Toolbar extends controls.Composite {

    items: controls.IContributionItem[] = []

    constructor() {
        super("span")
        this._styleString = "float: right";
    }

    protected renderContent(ch: HTMLElement) {
        super.renderContent(ch);
        var rnd = new controls.ToolbarRenderer(<any>this);
        rnd.style.marginRight = "5px";
        rnd.render(ch);
    }
}

export class Section extends controls.Composite {

    heading: Composite;
    toolbar: Toolbar = new Toolbar();
    body: Composite= new controls.WrapComposite("div");


    protected description: string;


    add(c: IControl) {
        this.body.add(c);
    }

    constructor(title: string = "") {
        super("div");
        this.setTitle(title);
        this.addClassName("panel")
        this.addClassName("panel-default")
        var heading = new controls.WrapComposite("div");
        heading._text = this.title();
        heading.wrapElement = "span";
        heading.addClassName("panel-heading");
        if (!heading._text.trim()) {
            heading._style.minHeight="40px";

        }
        heading.add(this.toolbar);
        this._style.paddingBottom="0px"
        this._style.marginBottom="0px"
        this.heading = heading;
        super.add(heading)
        this.body.addClassName("panel-body");
        super.add(this.body);
    }
}

function createControl(p: PropertyDescription, b: IBridge) {
    var cm = new controls.VerticalFlex();

    var group = new PropertyGroup();
    cm.add(new Label(p.description?marked(p.description):""));
    var groups:PropertyGroup[]=[];
    if (p.map) {
        var kd: PropertyDescription = {};
        kd.displayName = "Key";
        kd.id = "$key";
        kd.required = true;
        kd.scalar = true;
        group.properties.push(kd);

    }
    if (p.children && p.children.length > 0) {
        p.children.forEach(x=> {
            group.properties.push(collapseInnerProps(x));
            //group.properties.push(x);
        })
        groups=groupProps(group.properties);
        var rs:PropertyDescription[]=[];
    }

    else {
        var kd: PropertyDescription = {};
        kd.displayName = "Value";
        kd.id = "$value";
        kd.required = true;
        kd.scalar = true;
        group.properties.push(kd);
        groups=[group];
    }
    if (groups.length>0){
        cm.add(renderPropertyGroup(groups[0], b))

    }

    if (groups.length>1) {
        var dd = new TabFolder();
        for (var i=1;i<groups.length;i++){
            dd.add(renderPropertyGroup(groups[i],b,{tabsTop:true}));
        }
    }
    cm.add(dd);
    return cm;
}
declare var $: any

function deepCopy(obj: any) {
    var newObj = $.extend(true, {}, obj);
    return newObj;
}


export class CreateAction {

    obj = {};

    constructor(private pd: PropertyDescription, private b: IBinding) {
    }

    run() {
        var control = createControl(this.pd, new ObjectBridge(this.obj));
        var view = this;
        new wb.ShowDialogAction("Create " + this.pd.displayName, control, [{
            title: "Create",
            run(){
                view.b.set(view.obj)
            },
            primary: true

        }, {
            title: "Cancel",
            run(){

            },
            warning: true
        }]).run();
    }
}
export class EditAction {

    obj = {};

    constructor(private pd: PropertyDescription, private b: IBinding) {

        this.obj = deepCopy(b.get());
    }

    run() {
        var control = createControl(this.pd, new ObjectBridge(this.obj));
        var view = this;
        new wb.ShowDialogAction("Edit " + this.pd.displayName, control, [{
            title: "Apply",
            run(){
                view.b.set(view.obj)
            },
            primary: true

        }, {
            title: "Cancel",
            run(){

            },
            warning: true
        }]).run();
    }
}

declare var marked: any;


export class ListView extends BindableControl implements wb.ISelectionProvider {

    constructor(private pd: PropertyDescription, private emptyText: string = "") {
        super("ul")
    }

    selectionListeners: wb.ISelectionListener[] = []

    addSelectionListener(l: wb.ISelectionListener) {
        this.selectionListeners.push(l);
    }

    removeSelectionListener(l: wb.ISelectionListener) {
        this.selectionListeners = this.selectionListeners.filter(x=>x != l);
    }

    getSelection(): any[] {
        if (this.selectedIndex > 0) {
            var val = this._binding.get();
            if (Array.isArray(val)) {
                if (val.length > this.selectedIndex) {
                    return [val[this.selectedIndex]]
                }
            }
        }
        return [];
    }

    renderValue(v: any) {
        if (this.pd.array) {
            v = v["item"];
        }
        if (this.pd.map) {
            var key = v["$key"];
            var vl = v["$value"];
            if (!vl) {
                vl = deepCopy(v);
                delete vl["$key"]
            }
            var bg = `<span class="badge">` + key + `</span>`;
            return JSON.stringify(vl) + bg;
        }
        return "";
    }

    selectedIndex = 0;

    protected  initBinding(ch: HTMLElement) {
        ch.innerHTML = "";
        var view = this;
        if (this._binding != null) {

            var b = this._binding.get();
            if (b && Array.isArray(b) && (b.length > 0)) {
                var elements: any[] = b;
                var position = 0;
                var view = this;
                elements.forEach(z=> {
                    var index = position;
                    var el = document.createElement("li");
                    el.classList.add("list-group-item");
                    if (position == this.selectedIndex) {
                        el.classList.add("active")
                    }
                    el.style.borderRadius = "0px";
                    el.style.border = "0px";
                    el.style.cursor = "pointer"
                    el.style.margin = "1px";
                    el.style.borderBottom = "1px";
                    el.onclick = (e)=> {
                        view.selectedIndex = index;
                        view.initBinding(ch);
                        this.selectionListeners.forEach(x=> {
                            x.selectionChanged(view.getSelection())
                        })
                    }
                    el.innerHTML = view.renderValue(z);
                    ch.appendChild(el)
                    position++;
                })

            }
            else {
                ch.innerHTML = this.emptyText;
            }
        }
    }
}
export class TableEditor extends BindableControl {

    initBinding() {
        this.listView._binding = this._binding;
        this.listView.refresh();
        if (this._binding.get() && Array.isArray(this._binding.get())) {
            var el: any[] = this._binding.get();
            this._selection = el[0];
        }
        this.updateToolbar(this.content.toolbar);
    }

    protected appendValue(v: any) {
        if (this._binding != null) {
            if (this.pd.array || this.pd.map) {
                var value = this._binding.get();
                var ar: any[] = [];
                if (!Array.isArray(value)) {
                    if (value) {
                        ar = [value];
                    }
                }
                else {
                    ar = value;
                }
                ar.push(v);
                if (v["$value"]) {
                    v = v["$value"];
                }
                this._binding.set(ar);
                this.initBinding();
            }
        }
    }

    protected replaceValue(old: number, v: any) {
        if (this._binding != null) {
            if (this.pd.array || this.pd.map) {
                var value = this._binding.get();
                var ar: any[] = [];

                if (!Array.isArray(value)) {
                    if (value) {
                        ar = [value];
                    }
                }
                else {
                    ar = value;
                }
                ar[old] = v;
                this._binding.set(ar);
                this.initBinding();
            }
        }
    }

    protected removeValue(v: any) {
        if (this._binding != null) {
            if (this.pd.array || this.pd.map) {
                var value = this._binding.get();
                var ar: any[] = [];
                if (!Array.isArray(value)) {
                    if (value) {
                        ar = [value];
                    }
                }
                else {
                    ar = value;
                }
                ar = ar.filter((x,i)=>x != v&&i!=v);
                this._binding.set(ar);
                this.initBinding();
            }
        }
    }

    content: Section;

    listView: ListView;

    _selection: any

    updateToolbar(toolbar: Toolbar) {
        toolbar.items = [];
        var view = this;
        toolbar.items.push({
            title: "Create",
            run(){
                new CreateAction(view.pd, {
                    get(){
                        return {};
                    },
                    set(v: any){
                        view.appendValue(v);
                    }

                }).run();
            }
        })
        toolbar.items.push({
            title: "Edit Selected",
            disabled: (view._selection == null),
            run(){
                new EditAction(view.pd, {
                    get(){
                        return view._selection;
                    },
                    set(v: any){
                        view.replaceValue(view.listView.selectedIndex, v);
                    }

                }).run();
            }
        })
        toolbar.items.push({
            title: "Delete Selected",
            danger: true,
            disabled: (view._selection == null),
            run(){
                view.removeValue(view.listView.selectedIndex);
            }
        })
        toolbar.refresh();
    }

    constructor(private pd: PropertyDescription,private ctx:RenderingContext={}) {
        super("div")
        this._style.height = "100%";
        this._style.width = "100%";
        var v = new controls.VerticalFlex();
        v._style.height = "100%";
        v._style.width = "100%";
        v.wrapStyle.flex = "1 1 0"
        this.add(v);
        var tb = new controls.HorizontalFlex();
        var s = new Section(ctx.tabsTop?" ":pd.displayName);
        s.body._style.padding = "0px"
        if (ctx.tabsTop){
            s._style.borderRadius="0px";
            s.heading._style.borderTopWidth="0px";
            s._style.borderTopWidth="0px";
        }
        var view = this;
        this.content = s;
        this.listView = new ListView(pd, "<div style='padding: 10px'>" + (pd.description?marked(pd.description):"") + "</div>");
        s.add(this.listView);
        var toolbar = s.toolbar;
        this.listView.addSelectionListener({

            selectionChanged(v: any[]){
                if (v != null && v.length > 0) {
                    view._selection = v[0];
                    view.updateToolbar(toolbar)
                }
            }
        })


        tb._style.width = "100%"
        tb._style.height = "100%"
        //tb._style.backgroundColor="red"
        tb.wrapStyle.flex = "1 1 0"
        if (!ctx.tabsTop) {

            tb.wrapStyle.padding = "5px"
        }
        else{
            tb.wrapStyle.padding = "0px"
            s._style.padding="0px"
        }
        tb.add(s);
        //tb.add(toolbar);
        //v.add(b)
        v.add(tb)
        //v.add(body);
    }
}


export interface IBridge {
    get(path: string): any
    set(path: string, v: any): any
    keys(): string[]
    binding(p: string): IBinding;
}

export interface IBinding {
    get(): any
    set(v: any)
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

export class ObjectBridge implements IBridge {

    listeners:((x)=>void)[]=[]

    addListener(l:(x)=>void){
        this.listeners.push(l);
    }
    removeListener(l:(x)=>void){
        this.listeners=this.listeners.filter(x=>x!=l);
    }

    constructor(private obj: any) {

    }

    get(path: string): any {
        return this.obj[path];
    }

    set(path: string, v: any) {
        if (v==null||v==""){
            delete this.obj[path]
        }
        else {
            this.obj[path] = v;
        }
        this.listeners.forEach(x=>x(this.obj))
    }

    binding(p: string) {
        return new BridgeBinding(p, this);
    }

    keys() {
        return Object.keys(this.obj)
    }
}

export class BridgeBinding implements IBinding {

    constructor(private id: string, private br: IBridge) {

    }

    get() {
        return this.br.get(this.id)
    }

    set(v: any) {
        this.br.set(this.id, v);
    }
}

export class ArrayBinding implements IBinding {

    constructor(private p: PropertyDescription, private br: IBinding) {
    }

    get() {
        var vl = this.br.get();
        if (this.p.array) {
            if (Array.isArray(vl)) {
                var ar: any[] = vl;
                return ar.map(x=> {
                    return {item: x}
                });
            }
        }
        return vl;
    }

    set(v: any) {

        if (this.p.array) {
            if (Array.isArray(v)) {
                var ar = <any[]>v;
                this.br.set(ar.map(x=>x.item))
            }
            else {
                this.br.set(v);
            }
        }

    }
}
export class MapBinding implements IBinding {

    constructor(private id: string, private br: IBridge) {

    }

    get() {
        var result: any[] = [];
        this.br.keys().forEach(k=> {
            var v = {
                $key: k
            }
            var cl = this.br.get(k);
            if (Array.isArray(cl)) {
                v["$value"] = cl;
            }
            else if (typeof cl == "object") {
                var vl = deepCopy(cl);
                vl["$key"] = k;
                v = vl;
            }
            else {
                if (cl) {
                    v["$value"] = cl;
                }
            }
            result.push(v);
        })
        return result;
    }

    set(v: any) {
        this.br.keys().forEach(c=> {
            this.br.set(c, null);
        })
        if (Array.isArray(v)) {
            var items:any[]=v;
            items.forEach(x=>{
                var vl=x["$value"];
                if (!vl){
                    vl=deepCopy(x);
                    delete vl["$key"];
                }
                var key=x["$key"];
                this.br.set(key,vl);
            })

        }
    }
}
class ProxyBridge implements IBridge{

    constructor(private parent:IBridge,private segment:string){

    }

    get(path: string): any {
        var vl=this.parent.get(this.segment);
        if (path=="$value"){
            return vl;
        }
        if (vl==null){
            return null;
        }
        return vl[path];
    }

    set(path: string, v: any): any {
        if (path=="$value"){
            if (v){
                this.parent.set(this.segment,v);
                return;
            }
            else{
                this.parent.set(this.segment,null);
                return;
            }
        }
        var vl=this.parent.get(this.segment);
        if (vl==null){
            if (!v){
                return;
            }
            vl={};
        }
        {
            if (!v){
                delete vl[path];
            }
            else {
                vl[path] = v;
            }
            if (Object.keys(vl).length==0){
                vl=null;
            }
            this.parent.set(this.segment, vl);
        }
    }

    keys(): string[] {
        var vl=this.parent.get(this.segment);
        if (vl){
            return Object.keys(vl);
        }
        return [];
    }

    binding(p: string): IBinding {
        return new BridgeBinding(p,this);
    }
}
class NillBinding implements IBinding{
    constructor(private  p:IBinding){

    }
    get(){
        var r=this.p.get();
        if (r){
            return true
        }
    }
    set(v:any){
        if (v){
            this.p.set("!!!NULL_VALUE")
        }
    }
}
var binding = function (bridge: IBridge, p:PropertyDescription) {
    var segments=p.id.split("=>");
    var lst=p.id;
    if (segments.length>0){
        lst=segments[segments.length-1];
        for (var i=0;i<segments.length-1;i++){
            bridge=new ProxyBridge(bridge,segments[i])
        }
    }
    var ls= bridge.binding(lst);
    if (p.array){
        ls=new ArrayBinding(p,ls);
    }
    if (p.map){
        ls=new MapBinding(p.id,bridge);
    }
    if (p.nil){
        ls=new NillBinding(ls);
    }
    return ls;
};
export interface RenderingContext{
    tabsTop?:boolean;
}

export function renderPropertyGroup(p: PropertyGroup, bridge: IBridge,ctx:RenderingContext={}) {
    var maxLength = 0;
    var container = new controls.VerticalFlex();
    container.setTitle(p.caption);
    p.properties.forEach(x=> {
        if (x.scalar) {
            var dl = x.displayName.length;
            if (dl > maxLength) {
                maxLength = dl;
            }
        }
    })
    maxLength += 5;
    p.properties.forEach(p=> {
        if (p.map) {
            return;
        }
        if (p.array) {
            return;
        }
        if (p.scalar) {
            if (!p.boolean&&!p.nil) {
                var r = new InputGroup();
                var nAddon = new InputGroupAddOn();
                r._style.width = "100%";
                r.add(nAddon)
                nAddon._style.width = maxLength + "ch";
                nAddon._style.textAlign = "left"
                var ll = new controls.Composite("span");
                ll.addLabel(p.displayName + (p.required ? "* " : " "));
                if (p.description) {
                    ll.add(new Help(p.description))
                }
                ll._style.cssFloat = "left";
                nAddon.add(ll);
                if (p.enumOptions) {
                    var select = new Select();
                    select._binding = binding(bridge, p);
                    p.enumOptions.forEach(x=> {
                        select.add(new Option(x))
                    })
                    r.add(select);
                }
                else {
                    var w:TextArea|Input = new Input();
                    if (p.multiline){
                        w= new TextArea();
                        w._style.minHeight="200px";
                        w._style.borderRadius="0px";
                        if (ctx.tabsTop){
                            w._style.borderTopWidth="0px";
                            container.add(w);
                            return;
                        }
                        w._style.borderWidth="0px";
                        w._binding = binding(bridge, p) ;

                        var s=new Section(p.displayName)
                        s._style.margin="5px";
                        s.body._style.padding="0px";

                        s.add(w);
                        container.add(s);
                        return;
                    }
                    //w.attrs["data-provide"]="typeahead";
                    //w.attrs["data-source"]='["typeahead","ded"]';
                    w._binding = binding(bridge, p);
                    r.add(w);

                }
                container.add(r);
            }
        }
    })
    p.properties.forEach(p=> {
        if (p.map) {
            var rs = new TableEditor(p,ctx);
            rs._binding = binding(bridge,p)
            container.add(rs);
            return;
        }
        else if (p.array) {
            var rs = new TableEditor(p,ctx);
            rs._binding = binding(bridge,p)
            container.add(rs);
            return;
        }
        else{

        }
    })
    var checks=new WrapComposite("span")
    checks.wrapElement="span"
    p.properties.forEach(p=> {
        if (p.nil||p.boolean) {
            var rs = new CheckBox(p.displayName);
            rs._binding = binding(bridge,p)
            checks.add(rs);
            var h=new Help(p.description);
            checks.add(h);
            h._style.paddingRight="10px"
            h._style.marginTop="2px"
            return;
        }
    })
    container.add(checks)
    return container;
}