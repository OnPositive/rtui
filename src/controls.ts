declare var require: any
require("../../lib/bootstrap-contextmenu")
require("../../lib/bootstrap-treeview")

export interface IControl{
    render(e:Element);
    dispose?();
    title():string;
    id(): string
    controlId?:string
    contextActions?:IContributionItem[]

    extraStyles?:CSSStyleDeclaration
}

export interface IContributionItem{
    id?:string
    title?: string
    link?: string
    image?: string
    disabled?: boolean
    checked?:boolean
    danger?:boolean
    warning?:boolean
    primary?: boolean
    success?: boolean
    run?(args?:any):void
    items?:IContributionItem[]
}

export interface IMenu extends IContributionItem{
    items:IContributionItem[]
}

export class ToolbarRenderer{

    constructor(private menu:IMenu){}

    style: CSSStyleDeclaration=<any>{}

    render(host:Element){
        this.menu.items.forEach(x=>{
            var button=document.createElement("button");
            button.classList.add("btn")
            button.classList.add("btn-xs")
            if (x.checked){
                button.classList.add("btn-success");
            }
            else {
                if (x.danger){
                    button.classList.add("btn-danger")
                }
                else {
                    button.classList.add("btn-primary")
                }
            }
            copyProps(this.style,button.style);
            button.textContent=x.title
            if (x.image){
                button.innerHTML=`<span class="${x.image}"></span>`+x.title;
            }
            if (x.run){
                button.onclick=x.run
            }
            if (x.disabled){
                button.disabled=true;
            }
            host.appendChild(button);
        })
    }
}
export class DrowpdownMenu{

    constructor(private menu:IMenu,private setRoles:boolean=true){}

    render(host:Element){
        this.menu.items.forEach(x=>{
            var li=document.createElement("li");
            if (this.setRoles) {
                li.setAttribute("role", "presentation");
            }

            if (x.disabled){
                li.classList.add("disabled");
            }

            var a=document.createElement("a");
            a.setAttribute("href",x.link?x.link:"#")
            if (this.setRoles) {
                a.setAttribute("role", "menuitem")
            }
            a.style.cursor="hand";
            if ((x).run){
                a.onclick=function (e){
                    x.run();
                };
            }
            if (x.checked){
                a.innerHTML=x.title+"<span class='glyphicon glyphicon-ok' style='float: right'></span>"
            }
            else{
                a.innerHTML=x.title;
            }
            li.appendChild(a);
            host.appendChild(li);
        })
    }
}
export class Context{

    constructor(private menu:IMenu){}

    render(host:Element){
        this.menu.items.forEach(x=>{
            var li=document.createElement("li");
            //li.setAttribute("role","presentation");
            if (x.disabled){
                li.classList.add("disabled");
            }
            var a=document.createElement("a");
            //a.setAttribute("role","menuitem")
            if ((x).run){
                a.onclick=(x).run;
            }
            a.innerHTML=x.title;
            li.appendChild(a);
            host.appendChild(li);

        })
    }
}
var c=1;

export abstract class AbstractComposite implements IControl{

    private _title: string;

    children:IControl[]=[]
    protected _element:Element;
    protected _id:string;

    id(){
        if (this._id){
            return this._id;
        }
        this._id="c"+(c++);
        return this._id;
    }

    render(e:Element){
        this._element=e;
        this.innerRender(e);
    }

    refresh(){
        if (this._element){
            this.innerRender(this._element);
        }
    }

    protected abstract innerRender(e:Element):Element|void

    add(c:IControl){
        this.children.push(c);
        this.refresh();

    }

    remove(c:IControl){
        this.children=this.children.filter(x=>x!=c);
        this.refresh();
    }
    dispose(){
        this._element=null;
        this.children.forEach(x=>{
            if (x.dispose){
                x.dispose();
            }
        })
    }

    setTitle(title:string){
        this._title=title;
    }

    title(){
        return this._title;
    }
}

function copyProps(a:any,b:any){
    Object.keys(a).forEach(k=>{
        b[k]=a[k];
    })
}
export class Composite extends AbstractComposite{

    constructor(private tagName:string){super()}

    _style:CSSStyleDeclaration=<CSSStyleDeclaration>{}

    _styleString: string;

    attrs:any={};

    _className:string

    _classNames:string[]=[]

    _text:string

    addLabel(l:string){
        var cnt=new Composite("span");
        cnt._text=l;
        this.add(cnt);
        return cnt;
    }

    addClassName(c:string){
        this._classNames.push(c);
    }

    style(){
        return this._style;
    }
    withClass(c:string){
        this._className=c;
        return this;
    }

    protected innerRender(e:Element){
        var ch=document.createElement(this.tagName)
        e.appendChild(ch);
        this.renderContent(ch);
    }

    refresh(){
        if (this._element) {
            this._element.innerHTML = null;
            this.renderContent(<HTMLElement>this._element);
        }
    }

    protected renderContent(ch: HTMLElement) {
        ch.id=this.id();
        if (this._styleString){
            ch.setAttribute("style",this._styleString);
        }
        else if (this._style){
            copyProps(this._style,ch.style);
        }
        if (this._className){
            ch.className=this._className;
        }
        Object.keys(this.attrs).forEach(k=>{
            ch.setAttribute(k,this.attrs[k])
        })
        this._classNames.forEach(x=>{ch.classList.add(x)})
        if (this._text){
            ch.innerText=this._text;
        }
        this.extraRender(ch);
        this.renderChildren(ch);
    }

    protected renderChildren(ch: HTMLElement) {
        this.children.forEach(c=> {
            var w = this.wrap(ch,c);
            var el = c.render(w);

            if (el) {
                w.appendChild(el)
            }
        })
    }
    protected extraRender(ch: HTMLElement){

    }
    protected wrap(p:HTMLElement,c?:IControl){
        return p;
    }
}

export class WrapComposite extends Composite{

    wrapElement:string="div"

    protected wrap(p:HTMLElement){
        var d=document.createElement(this.wrapElement);
        p.appendChild(d);
        return d;
    }
}
export class HorizontalFlex extends Composite{

    constructor(){
        super("div")
        this._style.display="flex";
        this._style.flexDirection="row"
    }
    wrapStyle: CSSStyleDeclaration=<any>{}

    protected wrap(p:HTMLElement){
        var d=document.createElement("div");
        copyProps(this.wrapStyle,d.style);
        p.appendChild(d);
        return d;
    }
}
export class VerticalFlex extends Composite{

    constructor(){
        super("div")
        this._style.display="flex";
        this._style.flexDirection="column"
    }
    wrapStyle: CSSStyleDeclaration=<any>{}

    protected wrap(p:HTMLElement){
        var d=document.createElement("div");
        copyProps(this.wrapStyle,d.style);
        p.appendChild(d);
        return d;
    }
}

var globalId=0;
function nextId(){
    return "el"+(globalId++);
}
export class Loading extends  AbstractComposite{
    protected innerRender(e:Element){
        e.innerHTML=`<div style="display: flex;flex: 1 1 0; flex-direction: column;justify-content: center;"><div style="display: flex;flex-direction: row;justify-content: center"><div><div>Loading...</div><img src='./lib/progress.gif'/></div></div></div>`
    }
}
export class Label extends AbstractComposite{

    constructor(title?:string,private content?:string){
        super();
        this.setTitle(title);
    }
    protected innerRender(e:Element){
        if (this.content){
            e.innerHTML = `<span style="padding: 5px;overflow: auto">${this.content}</span>`
        }
        else {
            e.innerHTML = `<span>${this.title()}</span>`
        }
    }
}
export class Accordition extends AbstractComposite{

    public expand(c:IControl){
        var index=this.children.indexOf(c);
        this.expandIndex(index);
    }
    protected selectedIndex:number;

    getSelectedIndex(){
        return this.selectedIndex;
    }
    getSelectedTitle(){
        if (this.selectedIndex!=undefined){
            return this.children[this.selectedIndex].title();
        }
    }
    getSelectedTitleId(){
        if (this.selectedIndex!=undefined){
            var c=this.children[this.selectedIndex];
            return c.controlId?c.controlId:c.title();
        }
    }

    public expandIndex(index: number){
        var bids=this.bids;
        var gids=this.gids;
        this.selectedIndex=index;
        for (var j=0;j<bids.length;j++) {
            if (j!=index) {
                if(document.getElementById(bids[j])) {
                    document.getElementById(bids[j]).style.display = "none";
                    document.getElementById(gids[j]).style.flex = null;
                }
                //document.getElementById(gids[j]).style.display = "none";
            }
            else{
                if(document.getElementById(bids[j])) {
                    document.getElementById(bids[j]).style.display = "flex";
                    document.getElementById(gids[j]).style.flex = "1 1 0";
                    document.getElementById(gids[j]).style.display = "flex";
                }
            }
        }
    }

    getHeader(c:IControl){
        var positon=this.children.indexOf(c);
        if (positon=-1){
            return null;
        }
        return document.getElementById(this.headings[positon]);
    }

    disabled={

    }

    disable(c:IControl){
        var positon=this.children.indexOf(c);
        if (positon==-1){
            return null;
        }
        document.getElementById(this.headings[positon]).style.color="gray";
        this.disabled[this.headings[positon]]=true;
    }
    enable(c:IControl){
        var positon=this.children.indexOf(c);
        if (positon==-1){
            return null;
        }
        delete this.disabled[this.headings[positon]];
        document.getElementById(this.headings[positon]).style.color="black";
    }

    private bids:string[]
    private gids: string[]
    private headings: string[]
    protected innerRender(e:Element){
        var topId=nextId();

        var templates:string[]=[]
        var headings:string[]=[]
        this.headings=headings;
        var bids:string[]=[]
        var gids:string[]=[]
        for (var i=0;i<this.children.length;i++){
            var elId=nextId();
            var hId=nextId();
            var bid=nextId();
            var gid=nextId();
            bids.push(elId)
            headings.push(hId)
            gids.push(gid)
            var styleExpanded=i==0?"flex: 1 1 0":"display: none";
            var expanded=i==0;
            var s=`<div id="${gid}" class="panel panel-default" style="margin: 0px;${styleExpanded}; display: flex;flex-direction: column">
               <div class="panel-heading" id="${hId}">
                <h4 class="panel-title" style="display: inline;cursor: pointer"><a>${this.children[i].title()}</a></h4>
                <div style="float: right" id="${"T"+hId}"></div>
            </div>
            <div id="${elId}"  style="flex: 1 1 auto;display: flex;flex-direction: column;${styleExpanded}">
            <div class="panel-body" style="background: red;flex: 1 1"><div id="${bid}" style="background: green;"></div></div>
            </div>
           </div>`;
           templates.push(s);
        }
        var content=`<div class="panel-group" id="${topId}" style="margin: 0;padding: 0;display: flex;flex-direction: column;flex: 1 1 auto; height: 100%">
             ${templates.join('')}       
        </div>`
        e.innerHTML=content;
        for (var i=0;i<this.children.length;i++){
            var el=document.getElementById(bids[i]);
            this.children[i].render(el);
            //e.style.maxHeight="500px"
        }
        var i=0;
        this.bids=bids;
        this.gids=gids;
        headings.forEach(x=>{
            var panelId=bids[i];
            var containerId=gids[i]
            var k=i;
            if (this.children[i].contextActions){
                var tH=document.getElementById("T"+x);
                new ToolbarRenderer({items: this.children[i].contextActions}).render(tH)
            }
            document.getElementById(x).onclick=()=> {
                if (!this.disabled[x]) {
                    this.expandIndex(k);
                }
            }
            i++;
        });
    }
}