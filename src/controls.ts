import {IValueListener, Binding} from "raml-type-bindings";
import ro=require("./renderingOptions")
declare var require: any

import layout=require("./layout");
var jquery=require("jquery")//
window.jQuery=jquery
window.$=jquery;
require("../lib/bootstrap-treeview") //


export interface IControl {
    render(e: Element);
    dispose?();
    title(): string;
    description?(): string
    id(): string
    controlId?: string
    contextActions?: IContributionItem[]
    extraStyles?: CSSStyleDeclaration

    onAttach?(e:Element):void
    onDetach?(e:Element):void
    setDisabled?(v:boolean):void

    weapperForChild?:boolean
}

export interface IContributionItem {
    id?: string
    title?: string

    link?: string
    image?: string
    disabled?: boolean
    checked?: boolean
    danger?: boolean
    warning?: boolean
    primary?: boolean
    success?: boolean
    run?(args?: any): void
    items?: IContributionItem[]

}
export interface IListanableItem extends IContributionItem{
    addListener(v:IValueListener);
    removeListener(v:IValueListener);
}

export interface IMenu extends IContributionItem {
    items: IContributionItem[]
}

export class ToolbarRenderer {

    constructor(private menu: IMenu) {
    }

    style: CSSStyleDeclaration = <any>{}

    render(host: Element) {
        this.menu.items.forEach(x => {
            var button = document.createElement("button");
            button.classList.add("btn")
            button.classList.add("btn-xs")
            if (x.checked) {
                button.classList.add("btn-success");
            }
            else {
                if (x.danger) {
                    button.classList.add("btn-danger")
                }
                else {
                    button.classList.add("btn-primary")
                }
            }
            copyProps(this.style, button.style);
            button.textContent = x.title
            if (x.image) {
                button.innerHTML = `<span class="${x.image}"></span>` + x.title;
            }
            if (x.run) {
                button.onclick = ()=>{x.run()}
            }
            if (x.disabled) {
                button.disabled = true;
            }
            host.appendChild(button);
        })
    }
}
export class DrowpdownMenu {

    constructor(private menu: IMenu, private setRoles: boolean = true) {
    }

    render(host: Element) {
        this.menu.items.forEach(x => {
            var li = document.createElement("li");
            if (this.setRoles) {
                li.setAttribute("role", "presentation");
            }

            if (x.disabled) {
                li.classList.add("disabled");
            }

            var a = document.createElement("a");
            a.setAttribute("href", x.link ? x.link : "#")
            if (this.setRoles) {
                a.setAttribute("role", "menuitem")
            }
            a.style.cursor = "hand";
            if ((x).run) {
                a.onclick = function (e) {
                    x.run();
                };
            }
            if (x.checked) {
                a.innerHTML = x.title + "<span class='glyphicon glyphicon-ok' style='float: right'></span>"
            }
            else {
                a.innerHTML = x.title;
            }
            li.appendChild(a);
            if (host) {
                host.appendChild(li);
            }
        })
    }
}
export class Context {

    constructor(private menu: IMenu) {
    }

    render(host: Element) {
        this.menu.items.forEach(x => {
            var li = document.createElement("li");
            //li.setAttribute("role","presentation");
            if (x.disabled) {
                li.classList.add("disabled");
            }
            var a = document.createElement("a");
            //a.setAttribute("role","menuitem")
            if ((x).run) {
                a.onclick = (x).run;
            }
            a.innerHTML = x.title;
            li.appendChild(a);
            host.appendChild(li);

        })
    }
}
var c = 1;


export interface HasChildValidnessDecorations {
    setChildValidness(valid:boolean[]);
}
export abstract class AbstractComposite implements IControl {

    private _title: string;
    _style: CSSStyleDeclaration = <CSSStyleDeclaration>{}

    children: IControl[] = []
    parent: AbstractComposite;
    protected _element: Element;
    protected _id: string;

    _renderingOptions:ro.RenderingOptions;

    setRenderingOptions(o:ro.RenderingOptions){
        this._renderingOptions=ro.clone(o);
    }
    getRenderingOptions(){
        if (!this._renderingOptions){
            if (this.parent){
                return this.parent.getRenderingOptions();
            }
            return ro.defaultOptions();
        }
        return this._renderingOptions
    }
    rendersLabel(c:IControl){
        return false;
    }
    element(){
        return this._element;
    }

    setDisabled(v:boolean){
        return;
    }

    canShrinkVertically():boolean{
        return false;
    }

    hasVerticalSchrink(){
        if (this.canShrinkVertically()){
            return true;
        }
        if(this.parent&&this.parent instanceof AbstractComposite){
            return (<AbstractComposite>this.parent).canShrinkVertically();
        }
        return false;
    }
    canShrinkChildrenVertically(){
        var can=true;
        if (this.children.length==0){
            return false;//atomic controls are not shrinkable FIXME
        }
        this.children.forEach(x=>{
            if (x instanceof AbstractComposite){
                can=can&&(x.canShrinkVertically()||x.hasVerticalSchrink());
            }
        })
        return can
    }

    completeRefresh(c:AbstractComposite){
        this._element.replaceChild(<Element>c.render(this._element),c._element);
    }

    id() {
        if (this._id) {
            return this._id;
        }
        this._id = "c" + (c++);
        return this._id;
    }

    render(e: Element) {
        this._element = e;

        return this.innerRender(e);
    }

    refresh() {
        if (this._element) {
            this.innerRender(this._element);
        }
    }

    protected abstract innerRender(e: Element): Element|void

    add(c: IControl) {
        this.children.push(c);
        this.refresh();
        (<AbstractComposite>c).parent=this;
    }

    remove(c: IControl) {
        this.children = this.children.filter(x => x != c);
        this.refresh();
    }

    potentiallyVisible(){
        this.children.forEach(x=>{(<AbstractComposite>x).potentiallyVisible()});
    }

    dispose() {
        this._element = null;
        this.children.forEach(x => {
            if (x.dispose) {
                x.dispose();
            }
        })
    }

    setTitle(title: string) {
        this._title = title;
    }

    title() {
        return this._title;
    }
}
declare var window:any;




function copyProps(a: any, b: any) {
    Object.keys(a).forEach(k => {
        b[k] = a[k];
    })
}
function disable(e:Element,v:boolean){
    ((<any>e).disabled)=v;
    for (var i=0;i<e.children.length;i++){
        disable(e.children.item(i),v)
    }
}
export interface LifeCycleListener{
    attached(c:Composite,e:Element);
    detached(c:Composite,e:Element);
}
export class Composite extends AbstractComposite {

    constructor(private tagName: string) {
        super()
    }
    setSelectionVisible(sel:boolean){
        this.children.forEach(x=>{
            if (x instanceof Composite){
                x.setSelectionVisible(sel);
            }
        })
    }
    protected disabled:boolean=false;
     _rendersLabel:boolean
    rendersLabel(c:IControl){
        if (this._rendersLabel){
            return true;
        }
        if (this.children.length==1&&this.parent){
            return this.parent.rendersLabel(c);
        }
        return false;
    }
    needLabel() {
        if (this.parent) {
            if (this.parent.rendersLabel(this)) {
                return false;
            }
        }
        return true;
    }
    setDisabled(v: boolean){
        if (this.disabled!=v){
            this.innerSetDisabled(v);
            this.disabled=v;
            this.children.forEach(x=>x.setDisabled(v))
        }
    }
    protected  innerSetDisabled(v:boolean){
        if (this._element){
            disable(<HTMLElement>this._element,v);
        }
    }
    private lifecycle:LifeCycleListener[]=[];

    protected _description:string
    setDescription(d:string){
        this._description=d;
    }

    description(){
        if (!this._description){
            if (this.children.length==1){
                if (this.children[0].description) {
                    return this.children[0].description();
                }
            }
        }
        return this._description;
    }



    addLifycleListener(l:LifeCycleListener){
        this.lifecycle.push(l)
    }
    removeLifycleListener(l:LifeCycleListener){
        this.lifecycle=this.lifecycle.filter(x=>x!=l);
    }

    onAttach(e:Element){
        this.lifecycle.forEach(x=>x.attached(this,e))
        this.potentiallyVisible();
    }
    onDetach(e:Element){
        this.lifecycle.forEach(x=>x.detached(this,e))
    }

    _styleString: string;

    attrs: any = {};

    _className: string

    _classNames: string[] = []

    _text: string
    _html: string



    addLabel(l: string) {
        var cnt = new Composite("span");
        cnt._text = l;
        this.add(cnt);
        return cnt;
    }
    addHTML(l: string) {
        var cnt = new Composite("span");
        cnt._html = l;
        this.add(cnt);
        return cnt;
    }

    addClassName(c: string) {
        this._classNames.push(c);
    }
    removeClassName(c: string) {
        this._classNames=this._classNames.filter(x=>x!=c);

    }

    style() {
        return this._style;
    }

    withClass(c: string) {
        this._className = c;
        return this;
    }
    tag(){
       return this.tagName;
    }

    protected innerRender(e: Element) {
        var ch = document.createElement(this.tag())
        if (!this.parent){
            layout.adjustLayout(this);
        }
        e.appendChild(ch);

        this._element=ch;
        this.renderContent(ch);
    }

    refresh() {
        if (this._element) {
            this._element.innerHTML = "";
            this.renderContent(<HTMLElement>this._element);
        }
    }
    private visible: boolean=true;
    setVisible(visible:boolean){
        if (this.parent&&(<any>this.parent).weapperForChild){
            if ((<Composite>this.parent).setVisible) {
                (<Composite>this.parent).setVisible(visible)
            }
        }
        if (visible!=this.visible){
            this.visible=visible;
            this.innerUpdateVisible(visible);

        }

    }
    dsStyle:string

    protected innerUpdateVisible(visible: boolean) {
        if (this._element) {
            if (!visible) {
                this.dsStyle=(<HTMLElement>this._element).style.display;
                (<HTMLElement>this._element).style.display = "none";
            }
            else {
                (<HTMLElement>this._element).style.display = this._style.display ? this._style.display : this.dsStyle;
            }
            if (this.onVisibilityChanged) {
                this.onVisibilityChanged(visible);
            }
            if (this.parent && (<Composite>this.parent).onChildVisibilityChanged) {
                (<Composite>this.parent).onChildVisibilityChanged(this, visible);
            }
        }
    }
    isVisible(){
        return this.visible;
    }
    onChildVisibilityChanged?:(c,v:boolean)=>void;
    onVisibilityChanged?:(v:boolean)=>void;
    onClick?:(m:MouseEvent)=>void;

    needsVerticalScroll(){
        return this.hasVerticalSchrink()&&!this.canShrinkChildrenVertically();
    }

    protected renderContent(ch: HTMLElement) {
        ch.id = this.id();
        if (this._styleString) {
            ch.setAttribute("style", this._styleString);
        }
        else if (this._style) {
            copyProps(this._style, ch.style);
        }
        if (this._className) {
            ch.className = this._className;
        }
        Object.keys(this.attrs).forEach(k => {
            ch.setAttribute(k, this.attrs[k])
        })
        this._classNames.forEach(x => {
            ch.classList.add(x)
        })
        if (this._text) {
            ch.innerText = this._text;
        }
        if (this._html) {
            ch.innerHTML = this._html;
        }
        if (this.onClick){
             ch.onclick=this.onClick;
        }
        if (this.needsVerticalScroll()){
            ch.style.overflowY="auto";
        }
        this.extraRender(ch);

        ch["$control"]=this;
        this.renderChildren(ch);
        if (this._footer){
            this._footer.render(ch);
        }
        if (!this.visible){
            (<HTMLElement>this._element).style.display="none";
        }
        if(this.disabled){
            this.innerSetDisabled(this.disabled)
        }
    }
    _footer: IControl

    protected renderChildren(ch: HTMLElement) {
        var v=this.children;
        this.renderElements(v, ch);
    }

    protected renderElements(v: IControl[], ch: HTMLElement) {
        v.forEach(c => {
            var w = this.wrap(ch, c);
            var el = c.render(w);

            if (el) {
                w.appendChild(el)
            }
        })
    }

    protected extraRender(ch: HTMLElement) {

    }

    protected wrap(p: HTMLElement, c?: IControl) {
        return p;
    }
}

export class WrapComposite extends Composite {

    wrapElement: string = "div"

    protected wrap(p: HTMLElement, c?: IControl) {
        if (c instanceof Composite){
            return p;
        }
        var d = document.createElement(this.wrapElement);
        p.appendChild(d);
        return d;
    }
}
export class Form extends Composite {
    constructor() {
        super("div")
        this._style.padding = "10px";
        this._style.width = "100%"
    }

}
export class HorizontalFlex extends Composite {

    constructor() {
        super("div")
        this._style.display = "flex";
        this._style.flexDirection = "row"
    }

    wrapStyle: CSSStyleDeclaration = <any>{}

    needChildLabel:boolean=true;

    rendersLabel(c:IControl){
        return !this.needChildLabel;
    }

    protected wrap(p: HTMLElement,c?: IControl) {
        if (c instanceof Composite&&!(c instanceof InputGroup)){
            return p;
        }
        var d = document.createElement("div");
        copyProps(this.wrapStyle, d.style);
        if (c instanceof InputGroup){
            d.style.flex=c._style.flex;
        }
        p.appendChild(d);
        return d;
    }
}
export class VerticalFlex extends Composite {

    constructor() {
        super("div")
        this._style.display = "flex";
        this._style.flexDirection = "column"
        this.onChildVisibilityChanged=(x)=>{
            setTimeout(e=> {
                this.resize();
            },50);
        }
    }

    wrapStyle: CSSStyleDeclaration = <any>{}


    potentiallyVisible(){
        setTimeout(e=> {
            this.resize();
        },50);
        this.resize();
        super.potentiallyVisible();
    }

    private resize() {
        var maxSize = 0;
        this.children.forEach(x => {
            if (x instanceof forms.InputGroup) {
                var ic = <forms.InputGroup>x;
                if (ic.children[0] instanceof forms.InputGroupAddOn) {
                    var iadd = <forms.InputGroupAddOn>ic.children[0];
                    var w = iadd.width();
                    if (w > maxSize) {
                        maxSize = w;
                    }
                }
            }
        })
        this.children.forEach(x => {
            if (x instanceof forms.InputGroup) {
                var ic = <forms.InputGroup>x;
                if (ic.children[0] instanceof forms.InputGroupAddOn) {
                    var iadd = <forms.InputGroupAddOn>ic.children[0];
                    iadd.setWidth(maxSize + 5);//
                }
            }
        })
    }

    protected wrap(p: HTMLElement,c?: IControl) {
        if (c instanceof Composite){
            return p;
        }
        var d = document.createElement("div");
        copyProps(this.wrapStyle, d.style);
        p.appendChild(d);
        return d;
    }
    canShrinkVertically():boolean{
        return true;
    }
}

var globalId = 0;
function nextId() {
    return "el" + (globalId++);
}
export class Loading extends AbstractComposite {
    protected innerRender(e: Element) {
        e.innerHTML = `<div style="display: flex;flex: 1 1 0; flex-direction: column;justify-content: center;"><div style="display: flex;flex-direction: row;justify-content: center"><div><div>Loading...</div><img src='https://petrochenko-pavel-a.github.io/raml-explorer/lib/progress.gif'/></div></div></div>`
    }
}
export class Loading2 extends Composite {

    constructor(){
        super("div");
        this._styleString="display: flex;flex: 1 1 0; flex-direction: column;justify-content: center;";
    }

    protected innerRender(e: Element) {
        e.innerHTML = `<div style="display: flex;flex-direction: row;justify-content: center"><div><div>Loading...</div><img src='https://petrochenko-pavel-a.github.io/raml-explorer/lib/progress.gif'/></div></div>`
    }
}
export class Error  extends AbstractComposite {

    constructor(private message:string,private cb:()=>void,private canRetry:boolean,private rm:string="Retry..."){super();}

    protected innerRender(e: Element) {

        e.innerHTML = `<div style="display: flex;flex: 1 1 0; flex-direction: column;justify-content: center;"><div style="display: flex;flex-direction: row;justify-content: center">
        <div class="alert-danger" style="max-width: 60%;background-color: transparent"><span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>${this.message} ${this.canRetry?`(<a href='#'>${this.rm}</a>)`:""}</div></div></div>`;
        (<HTMLElement>this._element).onclick=(x)=>{this.cb()}
    }
}
export class Label extends AbstractComposite {

    constructor(title?: string, private content?: string) {
        super();
        this.setTitle(title);
    }

    protected innerRender(e: Element) {
        if (this.content) {
            e.innerHTML = `<span style="padding: 5px;overflow: auto">${this.content}</span>`
        }
        else {
            e.innerHTML = `<span>${this.title()}</span>`
        }
    }
}

export class ErrorMessage extends AbstractComposite{

    _message:string

    setMessage(m:string){
        if (m.length>100){
            m=m.substring(0,70)+'...';
        }
        this._message=m;

        this.refresh();
    }
    getMessage(){
        return this._message;
    }
    innerRender(e: HTMLElement){
        e.innerHTML=`
        <div class="alert alert-danger" role="alert" style="margin: 5px">
        <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
        <span class="sr-only">Error:</span>
        ${this._message}
        </div>`
    }
}
export class AccorditionContainer extends VerticalFlex{
    acc:Accordition=new Accordition();

    constructor(){
        super();
        this.acc._style.flex="1 1 0";
        this.acc.parent=this;
        this.children.push(this.acc)
        this._style.overflow="hidden"
        this.wrapStyle.display="flex";
    }

    add(c:IControl){
        this.acc.add(c);
    }
}
export class Accordition extends AbstractComposite {

    public expand(c: IControl) {
        var index = this.children.indexOf(c);
        this.expandIndex(index);
    }

    protected selectedIndex: number;

    getSelectedIndex() {
        return this.selectedIndex;
    }

    getSelectedTitle() {
        if (this.selectedIndex != undefined) {//
            return this.children[this.selectedIndex].title();
        }
    }

    getSelectedTitleId() {
        if (this.selectedIndex != undefined) {
            var c = this.children[this.selectedIndex];
            return c.controlId ? c.controlId : c.title();
        }
    }

    public expandIndex(index: number) {
        var bids = this.bids;
        var gids = this.gids;
        this.selectedIndex = index;
        var c=this.children[index];
        if (c instanceof Composite){
            c.potentiallyVisible();
        }
        for (var j = 0; j < bids.length; j++) {
            if (j != index) {
                if (document.getElementById(bids[j])) {
                    document.getElementById(bids[j]).style.display = "none";
                    document.getElementById(gids[j]).style.flex = null;
                }
                //document.getElementById(gids[j]).style.display = "none";
            }
            else {
                if (document.getElementById(bids[j])) {
                    document.getElementById(bids[j]).style.display = "flex";
                    document.getElementById(gids[j]).style.flex = "1 1 0";
                    document.getElementById(gids[j]).style.display = "flex";
                }
            }
        }
    }

    getHeader(c: IControl) {
        var positon = this.children.indexOf(c);
        if (positon = -1) {
            return null;
        }
        return document.getElementById(this.headings[positon]);
    }

    disabled = {}

    disable(c: IControl) {
        var positon = this.children.indexOf(c);
        if (positon == -1) {
            return null;
        }
        document.getElementById(this.headings[positon]).style.color = "gray";
        this.disabled[this.headings[positon]] = true;
    }

    enable(c: IControl) {
        var positon = this.children.indexOf(c);
        if (positon == -1) {
            return null;
        }
        delete this.disabled[this.headings[positon]];
        document.getElementById(this.headings[positon]).style.color = "black";
    }

    private bids: string[]
    private gids: string[]
    private headings: string[]

    protected innerRender(e: HTMLElement) {
        var topId = nextId();
        var templates: string[] = []
        var headings: string[] = []
        this.headings = headings;
        if (this._style) {
            copyProps(this._style, e.style);
        }
        var bids: string[] = []
        var gids: string[] = []
        for (var i = 0; i < this.children.length; i++) {
            var elId = nextId();
            var hId = nextId();
            var bid = nextId();
            var gid = nextId();
            bids.push(elId)
            headings.push(hId)
            gids.push(gid)
            var hh=`<div class="panel-body" style="background: red;flex: 1 1"><div id="${bid}" style="background: green;"></div></div>`;
            var isComposite=this.children[i] instanceof Composite;//
            var styleExpanded = i == 0 ? "flex: 1 1 0" : "display: none";
            var expanded = i == 0;
            var s = `<div id="${gid}" class="panel panel-default" style="margin: 0px;${styleExpanded}; display: flex;flex-direction: column">
               <div class="panel-heading" id="${hId}">
                <h4 class="panel-title" style="display: inline;cursor: pointer"><a>${this.children[i].title()}</a></h4>
                <div style="float: right" id="${"T" + hId}"></div>
            </div>
            
            <div id="${elId}"  style="flex: 1 1 auto;display: flex;overflow:auto;flex-direction: column;${styleExpanded}">       
                ${isComposite?"":hh}
            </div>
           </div>`;
            templates.push(s);
        }
        var content = `<div class="panel-group" id="${topId}" style="margin: 0;padding: 0;display: flex;flex-direction: column;flex: 1 1 auto;">
             ${templates.join('')}       
        </div>`
        e.innerHTML = content;
        for (var i = 0; i < this.children.length; i++) {
            var el = document.getElementById(bids[i]);
            this.children[i].render(el);
            //e.style.maxHeight="500px"
        }
        var i = 0;
        this.bids = bids;
        this.gids = gids;
        headings.forEach(x => {
            var panelId = bids[i];
            var containerId = gids[i]
            var k = i;
            if (this.children[i].contextActions) {
                var tH = document.getElementById("T" + x);
                new ToolbarRenderer({items: this.children[i].contextActions}).render(tH)
            }
            document.getElementById(x).onclick = () => {
                if (!this.disabled[x]) {
                    this.expandIndex(k);
                }
            }
            i++;
        });
    }
}
import workbench=require("./workbench")
let processAdd = function (v: any) {
    if (v.$control) {
        var cnt: IControl = v.$control;
        if (!v.attached) {
            if (cnt.onAttach) {
                cnt.onAttach(v);
            }
            v.attached=true;
        }

    }
    if (v.children) {
            for (var i = 0; i < v.children.length; i++) {
                processAdd(v.children.item(i))
            }
    }
    return cnt;
};
let processRemove = function (v: HTMLElement&any) {
    if (v.$control) {
        var cnt: IControl = v.$control;
        if (cnt.onDetach) {
            cnt.onDetach(v);
        }
        v.attached=false;

    }
    {
        if (v.children) {
            for (var i = 0; i < v.children.length; i++) {
                processRemove(v.children.item(i))
            }
        }
    }
    return cnt;
};
if (!window.observer) {
    var observer = new MutationObserver(function (mutations: MutationRecord[]) {
        mutations.forEach(x => {
            for (var i = 0; i < x.addedNodes.length; i++) {
                var v: any = x.addedNodes[i];
                var cnt = processAdd(v);

            }
            for (var i = 0; i < x.removedNodes.length; i++) {
                var v: any = x.removedNodes[i];
                var cnt = processRemove(v);

            }
        })
    });
    var config = {attributes: false, childList: true, characterData: false, subtree: true};
    observer.observe(document, config);
    window.observer=observer;
}
import forms=require("./forms")
import tps=require("raml-type-bindings")
import {InputGroup} from "./forms";


var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

export function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
    });
}
export class SourceCode extends Composite{

    _editable: boolean=false;

    constructor(title: string="",public _language:string="javascript",public _content: string=""){
        super("pre")
        this.setTitle(title);
    }
    setContent(c:string){
        this._content=c;
        this.refresh();
    }
    getContent(){
        return this._content;
    }
    setEditable(e:boolean){
        this._editable=e;
        this.refresh();
    }
    getEditable(){
        return this._editable;
    }
    setLanguage(l:string){
        this._language=l;
        this.refresh();
    }
    getLanguage(){
        return this._language;
    }

    renderContent(e: HTMLElement) {
        if (!this._editable){
            e.innerHTML="<code class='"+this._language+"'>"+escapeHtml(this._content)+"</code>";
            var id=this.id();
            setTimeout(function () {
                if (window.hljs) {
                    window.hljs.highlightBlock(e)
                }
            },100)
        }
    }
}
export class HorizontalTabFolder extends Composite {

    list: forms.SimpleListControl;
    validness:boolean[]=[];

    rendersLabel(c:IControl){
        return true;
    }
    constructor(cntrl:string="div"){
        super(cntrl);
    }

    setChildValidness(validness:boolean[]){
        this.validness=validness;
         if (this.list){
             this.list.dataRefresh(null);
         }
    }

    innerRender(e: Element) {
        var f = new Form();
        f._style.display="flex";
        f._style.flexDirection="column";
        f._style.overflow="auto"
        f._style.width="100%"
        //f._style.height = "100%"
        //f._style.overflow="auto"
        var vv = new VerticalFlex();
        //vv.wrapStyle.height = "100%";
        var m = new HorizontalFlex();
        m.needChildLabel=false;
        m.addClassName("panel")
        m.addClassName("panel-default")
        //vv._style.height = "100%"
        m._style.flex = "1 1 auto"
        vv._style.flex = "1 1 auto"
        vv._style.margin="0px"
        m._style.margin="0px"
        //m._style.backgroundColor="gray"
        //m._style.height = "100%"
        var view = this;
        var hide = false;
        if (true) {
            var view=this;
            var t = new forms.SimpleListControl();
            t._style.flex="0 0 auto";
            this.list=t;
            if (this.parent) {
                t.addControlCustomizer({
                    customize(c, i, v){
                        if (i == view.children.length - 1) {
                            (<Composite>c)._style.borderBottomWidth = "0px";

                        }
                    }
                })
            }
            t.addLabelCustomizer({
                customize(c, i, v){
                    var desc=(<Composite>v).description();
                    if (desc){
                        (<Composite>c)._style.whiteSpace="nowrap";
                        (<Composite>c).add(new forms.Help(desc));
                    }
                    if (view.validness[i]===false){
                        (<Composite>c).addHTML(`<span class="alert-danger" style="background-color: transparent" role="alert">
        <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> </span>`);
                    }
                }
            })
            t.style().borderRight="solid"
            t.style().borderRightWidth="1px"
            t.style().borderRightColor="#ddd"

            //t.styleString = "overflow: auto;flex: 1 1 0; min-height: 50px;height: 100%;display: block;background: lightgray; min-width:200px"
            m.add(t);
            m.add(f);
            // t.setLabelProvider({
            //     label(e: any): string{
            //         return e.title();
            //     }
            // })
            var b=new tps.Binding("");
            b._type={
                type: tps.TYPE_ARRAY,
                itemType: tps.TYPE_ANY
            }
            t._binding=b
            t._binding.set(this.children);
            //t.setContentProvider(new workbench.ArrayContentProvider())
            //t.setInput(this.children)
            t.addSelectionListener({
                selectionChanged(v: any[]){
                    if (v.length == 1) {
                        f.children = []
                        f.add(v[0]);
                        f.refresh();
                    }
                }
            })
            if (this.children.length <= 1) {
                hide = true;
            }

        }

        vv.add(m)
        vv.render(e);
        // if (hide) {
        //     t.hide();
        // }
        if (this.children && this.children.length > 0) {
             t.select(this.children[0]);
         }
    }
}