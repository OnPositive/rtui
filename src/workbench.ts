/**
 * Created by kor on 29/08/16.
 */
import controls=require("./controls")

export interface ILayoutPart {

    splitHorizontal(sizes: number[]): ILayoutPart[]

    splitVertical(sizes: number[]): ILayoutPart[]

    element(): Element
}

var globalId = 0;
function nextId() {
    return "split" + (globalId++);
}
export import IMenu=controls.IMenu;
export import IContributionItem=controls.IContributionItem;
export import ToolbarRenderer=controls.ToolbarRenderer;
export import Context=controls.Context;
export import DrowpdownMenu=controls.DrowpdownMenu;
import {IControl, Label} from "./controls";
import {IValueListener, ChangeEvent} from "raml-type-bindings";

declare var require: any


var Split: (a, b)=>void = require("../lib/Split").Split

export class LayoutPart implements ILayoutPart {

    constructor(private _el: Element) {

    }

    splitHorizontal(sizes: number[]): ILayoutPart[] {
        var fid = nextId();
        var nid = nextId();
        var content = `<div style="height: 100%"><div  id="${fid}" class="split split-horizontal" style="height: 100%"></div><div id="${nid}" class="split split-horizontal" style="height: 100%"></div></div>`;
        this._el.innerHTML = content;
        var r1 = new LayoutPart(document.getElementById(fid));
        var r2 = new LayoutPart(document.getElementById(nid));
        Split(["#" + fid, "#" + nid], {
            gutterSize: 8,
            cursor: 'col-resize',
            sizes: sizes
        })
        return [r1, r2];
    }

    splitVertical(sizes: number[]): ILayoutPart[] {
        var fid = nextId();
        var nid = nextId();
        var content = `<div id="${fid}"  class="split" ></div><div  id="${nid}" class="split"></div>`;
        this._el.innerHTML = content;
        var r1 = new LayoutPart(document.getElementById(fid));
        var r2 = new LayoutPart(document.getElementById(nid));
        Split(["#" + fid, "#" + nid], {
            gutterSize: 8,
            sizes: sizes,
            direction: 'vertical',
            cursor: 'row-resize'
        })
        return [r1, r2];

    }

    element() {
        return this._el;
    }
}


export interface IPartHolder {
    setViewMenu(m: IMenu);
    setToolbar(m: IMenu);
    setContextMenu(m: IMenu);
    setStatusMessage(message: string)
    updateTitle(t:string);
}

export interface IWorkbenchPart extends controls.IControl {
    id(): string,
    title(): string
    render(e: Element);
    searchable?: boolean
    onSearch?(searchStr: string)
    init?(h: IPartHolder)
}


export class Pane implements IPartHolder {

    _v: IWorkbenchPart;

    menuContentElement: Element;
    contextMenuElement: Element;
    viewMenuButton: Element
    _application: Application

    setStatusMessage(m: string) {
        this._application.setStatusMessage(m);
    }

    toolbarContentElement: Element;
    panelElement: Element

    setContextMenu(m: IMenu) {
        this.contextMenuElement.innerHTML = "";
        if (this.panelElement) {
            if (m.items.length == 0) {
                this.panelElement.setAttribute("data-toggle", "")
            }
            else {
                this.panelElement.setAttribute("data-toggle", "context")
            }
        }
        new DrowpdownMenu(m).render(this.contextMenuElement)
    }

    setViewMenu(m: IMenu) {
        this.menuContentElement.innerHTML = "";
        if (m.items.length == 0) {
            this.viewMenuButton.setAttribute("style", "display:none")
        }
        else {
            this.viewMenuButton.setAttribute("style", "display:inherit")
        }
        new DrowpdownMenu(m).render(this.menuContentElement)
    }

    setToolbar(m: IMenu) {
        this.toolbarContentElement.innerHTML = "";
        new ToolbarRenderer(m).render(this.toolbarContentElement)
    }

    constructor(public  _part: ILayoutPart) {

    }

    addPart(v: IWorkbenchPart) {
        this._v = v;
        this.render();
    }
    hid:string

    render() {
        var hid = nextId();
        var bid = nextId();
        var mid = nextId();
        this.hid=hid;
        var menuId = nextId();
        var cmenuId = nextId();
        var cmenuInnerId = nextId();
        var tid = nextId();
        var searchId = nextId();
        var cmenu = `<div id='${cmenuId}'><ul class="dropdown-menu"  id="${cmenuInnerId}"role="menu"  aria-labelledby="${mid}"></ul></div>`;
        var cnt = `<div style='display: flex;flex-direction: column;height: 100%;width: 99.9%;margin-bottom:0px;overflow: hidden' class="panel panel-primary"><div id="${hid}" class="panel-heading" style="flex: 0 0 auto;display: flex"></div>
        <div class="panel-body"  data-toggle="context" data-target="#${cmenuId}" style="flex: 1 1 0;display: flex;overflow: hidden;margin: 0;padding: 0" ><div style="width: 100%" id="${bid}"></div>${cmenu}</div></div>`
        this._part.element().innerHTML = cnt;

        this.updateHeader(searchId, tid, mid, menuId);

        this.menuContentElement = document.getElementById(menuId);
        this.toolbarContentElement = document.getElementById(tid);
        this.contextMenuElement = document.getElementById(cmenuInnerId);
        this.viewMenuButton = document.getElementById(mid)
        var bel = document.getElementById(bid);
        this.panelElement=bel.parentElement;
        if (this._v) {
            this._v.render(bel);
        }
        if (this._v.init) {
            this._v.init(this);
        }
        var hel = document.getElementById(this.hid);
        //hel.style.background="green"
        var pe = this._part.element();

        function handleResize() {
            var h = hel.getBoundingClientRect().height;
            bel.style.minHeight = "50px";
            bel.style.display = "flex";
            bel.style.flexDirection = "column";
        }

        pe.addEventListener("resize", handleResize);
        if (this._v.searchable) {
            var ie = document.getElementById(searchId)
            var view = this._v;
            ie.onkeyup = function () {
                setTimeout(
                    function () {
                        view.onSearch((<any>ie).value);
                    }, 200)
            }
        }
        handleResize();

    }
    titleId:string

    updateTitle(newTitle:string){
        document.getElementById(this.titleId).innerText=newTitle;
    }

    private updateHeader(searchId: string, tid: string, mid: string, menuId: string) {
        var hel = document.getElementById(this.hid);
        var tid2=nextId();
        this.titleId=tid2;
        var headerHtml = `<div style="display: flex;flex-direction: row;width: 100%"><div id='${tid2}'style="flex:1 1 auto">${this._v.title()}</div>`
        var searchHtml = `<input type="text"style="color: black;border-radius: 3px;height: 23px;margin-right: 4px" id="${searchId}"/>`
        if (!this._v.searchable) {
            searchHtml = "";
        }
        var th = `<span id="${tid}"></span>`
        var dropMenu = `<div class="dropdown" style="flex: 0 0 auto"/><button class="btn btn-primary dropdown-toggle btn-xs" style="display: none" type="button" id="${mid}" data-toggle="dropdown">
  <span class="caret"></span></button>
  <ul class="dropdown-menu dropdown-menu-left" style="right: 0;left: auto" role="menu" id='${menuId}' aria-labelledby="${mid}"/></div>`

        headerHtml = headerHtml + searchHtml + th + dropMenu + `</div>`;
        hel.innerHTML = headerHtml;
        return headerHtml;
    }
}
export class ContributionManager {

    menu: IMenu = {items: []}

    constructor(private onChange: (m: IMenu)=>void) {

    }

    add(item: IContributionItem) {
        this.menu.items.push(item);
        this.onChange(this.menu);
    }

    remove(item: IContributionItem) {
        this.menu.items = this.menu.items.filter(x=>x != item);
        this.onChange(this.menu);
    }


}
var nh = {
    setViewMenu(m: IMenu){
    },
    setToolbar(m: IMenu){
    },
    setContextMenu(m: IMenu){
    },
    setStatusMessage(m: string){
    },
    updateTitle(s:string){

    }
};


export abstract class ViewPart implements IWorkbenchPart, ISelectionProvider {


    addSelectionConsumer(t: {setInput(c: any)}) {
        this.addSelectionListener({
            selectionChanged(v: any[]){
                if (v.length > 0) {
                    t.setInput(v[0]);
                }
                else {
                    t.setInput(null);
                }
            }
        })
    }

    protected selectionListeners: ISelectionListener[] = []

    protected contentElement: Element
    protected holder: IPartHolder = nh;
    protected selection: any[] = []


    protected contextMenu: ContributionManager = new ContributionManager(m=>this.holder.setContextMenu(m));
    protected toolbar: ContributionManager = new ContributionManager(m=>this.holder.setToolbar(m));
    protected viewMenu: ContributionManager = new ContributionManager(m=>this.holder.setViewMenu(m));

    protected setStatusMessage(m: string) {
        this.holder.setStatusMessage(m);
    }

    public getContextMenu() {
        return this.contextMenu;
    }

    public getToolbar() {
        return this.toolbar;
    }

    public getViewMenu() {
        return this.viewMenu;
    }

    getHolder() {
        return this.holder;
    }

    addSelectionListener(l: ISelectionListener) {
        this.selectionListeners.push(l);
    }

    setTitle(t:string){
        this._title=t;
        this.holder.updateTitle(t);
    }

    removeSelectionListener(l: ISelectionListener) {
        this.selectionListeners = this.selectionListeners.filter(x=>x != l);
    }

    getSelection() {
        return this.selection;
    }

    protected onSelection(v: any[]) {
        this.selection = v;
        this.selectionListeners.forEach(x=>x.selectionChanged(v));
    }

    constructor(private _id, private _title) {
    }

    title() {
        return this._title
    }

    id() {
        return this._id;
    }


    init(holder: IPartHolder) {
        this.holder = holder;
        this.holder.setViewMenu(this.viewMenu.menu);
        this.holder.setToolbar(this.toolbar.menu);
        this.holder.setContextMenu(this.contextMenu.menu);
    }

    render(e: Element) {
        this.contentElement = e;
        this.innerRender(e);
        (<any>e).view=this;
    }

    hide(){
        if (this.contentElement){
            (<HTMLElement>this.contentElement).style.display="none"
        }
    }
    show(){
        if (this.contentElement){
            (<HTMLElement>this.contentElement).style.display="visible"
        }
    }

    refresh() {
        if (this.contentElement) {
            this.innerRender(this.contentElement)
        }
    }

    abstract innerRender(e: Element);

    dispose() {
        this.contentElement = null;
    }
}
export function getView(e:Element):ViewPart{
    while (e){
        var vl:any=e;
        if (vl.view){
            return vl.view;
        }
        e=e.parentElement;
    }
    return null;
}



declare var $: any;


export interface ILabelProvider {
    label(e: any): string
    icon?(e: any): string
}

export interface ITreeContentProvider {

    elements(i: any): any[];
    children(i: any): any[]
}
function buildTreeNode(x: any, t: ITreeContentProvider, l: ILabelProvider, selection: any[]) {

    var nodes = t.children(x).map(n=>buildTreeNode(n, t, l, selection));
    if (nodes.length == 0) {
        nodes = undefined;
    }
    var icon = undefined;
    if (l.icon) {
        icon = l.icon(x);
    }
    var selected = selection.indexOf(x) != -1
    return {
        original: x,
        text: l.label(x),
        icon: icon,
        nodes: nodes,
        state: {
            selected: selected
        }
    }
}
export interface ISelectionListener {
    selectionChanged(newSelection: any[])
}

export interface ISelectionProvider {
    addSelectionListener(l: ISelectionListener)
    removeSelectionListener(l: ISelectionListener);
    getSelection(): any[]
}

export class ArrayContentProvider implements ITreeContentProvider {

    children(x: any) {
        return [];
    }

    elements(x: any) {
        return x;
    }
}

export interface IFilter {
    accept(x: any)
}

export interface IComparator {
    compare(a: any, b: any): number
    init?(view: any)
}
export class ContentProviderProxy implements ITreeContentProvider {

    filters: IFilter[] = [];
    sorter: IComparator

    constructor(private _inner: ITreeContentProvider) {

    }

    elements(x: any) {
        var rs: any[] = this._inner.elements(x).filter(x=> {
            var accept = true;
            this.filters.forEach(x=>accept = accept && x.accept(x));
            return accept;
        })
        if (this.sorter) {
            return rs.sort((x, y)=>this.sorter.compare(x, y))
        }
        return rs;
    }

    children(x: any) {
        var rs = this._inner.children(x).filter(x=> {
            var accept = true;
            this.filters.forEach(x=>accept = accept && x.accept(x));
            return accept;
        })
        if (this.sorter) {
            return rs.sort((x, y)=>this.sorter.compare(x, y))
        }
        return rs;
    }

}
export class BasicSorter implements IComparator {

    _labelProvider: ILabelProvider;

    constructor() {

    }

    init(v: TreeView) {
        this._labelProvider = v.labelProvider;
    }

    compare(a: any, b: any): number {
        var l1 = this._labelProvider.label(a);
        var l2 = this._labelProvider.label(b);
        return l1.localeCompare(l2);
    }
}
export interface INode {

    nodes: INode[]

    original: any;
}
function findNodeNoRecursion(nodes: INode[], v: any) {
    for (var i = 0; i < nodes.length; i++) {
        var ch = nodes[i];
        if (ch.original === v) {
            return ch;
        }
    }
    return null;
}
function findNode(nodes: INode[], v: any) {
    for (var i = 0; i < nodes.length; i++) {
        var ch = nodes[i];
        if (ch.original === v) {
            return ch;
        }
        if (ch.nodes) {
            var n = findNode(ch.nodes, v);
            if (n) {
                return n;
            }
        }
    }
    return null;
}
export class TreeView extends ViewPart {

    treeId: string;
    contentProvider: ContentProviderProxy
    labelProvider: ILabelProvider
    input: any;
    treeNodes: INode[];
    searchable = true;
    asyncRender:boolean;

    setSorter(s: IComparator) {
        this.contentProvider.sorter = s;
        s.init(this);
        this.refresh();
    }

    addFilter(f: IFilter) {
        this.contentProvider.filters.push(f);
        this.refresh();
    }

    removeFilter(f: IFilter) {
        this.contentProvider.filters = this.contentProvider.filters.filter(x=>x != f);
        this.refresh();
    }

    select(model: any) {
        var vs = $('#' + this.treeId).treeview(true);
        var n = findNode(vs.all(), model);
        if (n) {
            this.selection = [model];
            this.refresh();
            $('#' + this.treeId).treeview("revealNode", n);
        }
    }

    public expand(l:number){
        var vs = $('#' + this.treeId).treeview(true);
        vs.expandNode(0);
    }

    hasModel(model: any): boolean {
        if (!this.treeNodes) {
            this.getTree();
        }
        if (findNode(this.treeNodes, model)) {
            return true;
        }
        return false;
    }

    pattern: string;

    onSearch(s: string): boolean {
        if (!this.treeId) {
            return false;
        }
        this.pattern = s;
        $('#' + this.treeId).treeview("search", s, {revealResults: true});

        return this.afterSearch(s);
    }


    constructor(id, title) {
        super(id, title);
        this.setContentProvider(new ArrayContentProvider());
        this.labelProvider={
            label(e:any){
                return e;
            }
        }
    }

    /**
     *
     * @param s
     * @returns {boolean}
     */
    private afterSearch(s: string) {
        var lst = document.getElementById(this.treeId).getElementsByTagName("li")
        var parents = {}
        var found: boolean = false;
        for (var i = 0; i < lst.length; i++) {
            var el = lst.item(i);
            if (el.classList.contains("search-result")) {
                el.style.display = "inherit";
                found = true;
                var id = el.attributes.getNamedItem("data-nodeid").value;
                var rs = $('#' + this.treeId).treeview("getParent", parseInt(id));
                parents[rs.nodeId] = true;
                while (rs.parentId !== undefined) {
                    parents[rs.parentId] = true;
                    rs = $('#' + this.treeId).treeview("getParent", rs.parentId);
                    parents[rs.nodeId] = true;
                }
            }
            else {
                el.style.display = s.length == 0 ? "inherit" : "none"
            }
        }
        for (var i = 0; i < lst.length; i++) {
            var el = lst.item(i);
            var id = el.attributes.getNamedItem("data-nodeid").value;
            if (parents[parseInt(id)]) {
                el.style.display = "inherit"
            }
        }
        return found;
    }

    setContentProvider(i: ITreeContentProvider) {
        this.contentProvider = new ContentProviderProxy(i);
        this.refresh();
    }

    setLabelProvider(l: ILabelProvider) {
        this.labelProvider = l;
        this.refresh();
    }

    getInput(): any {
        return this.input;
    }

    setInput(x: any) {
        this.input = x;
        this.refresh();
    }

    styleString:string="width:100%;overflow: auto;flex: 1 1 0; min-height: 50px;display: block"

    innerRender(e: Element) {
        var treeId = nextId();
        this.treeId = treeId;
        var view = this;
        e.innerHTML = `<div id='${treeId}' style='${this.styleString}'></div>`;
        if (this.asyncRender){
            setTimeout(()=>this.renderTreeControl(treeId,view),200)
        }
        else {
            this.renderTreeControl(treeId, view);
        }
    }

    autoExpand:number
    private renderTreeControl(treeId:string, view:TreeView) {
        $('#' + treeId).treeview({
            data: this.getTree(), expandIcon: "glyphicon glyphicon-chevron-right",
            onNodeSelected: function (x) {
                var sel = $('#' + treeId).treeview("getSelected");
                view.onSelection(sel.map(x=>x.original))
            },
            onNodeExpanded: function (x) {
                var sel = $('#' + treeId).treeview("getSelected");
                if (view.pattern) {
                    view.afterSearch(view.pattern)
                }
            },
            collapseIcon: "glyphicon glyphicon-chevron-down", borderColor: "0xFFFFFF", levels: 0
        });
        var sel = $('#' + treeId).treeview("getSelected");
        if (this.autoExpand){
            this.expand(this.autoExpand)
        }
        view.onSelection(sel.map(x=>x.original))
    }

    getTree() {
        if (this.input && this.contentProvider && this.labelProvider) {
            var els = this.contentProvider.elements(this.input);
            var nodes = els.map(x=>buildTreeNode(x, this.contentProvider, this.labelProvider, this.selection));
            this.treeNodes = <INode[]>nodes;
            return nodes;
        }
        return [];
    }
}

export enum Relation{
    LEFT, RIGHT, BOTTOM, TOP, STACk
}
export class Page {


    panes: Pane[] = [];
    root: ILayoutPart
    app: Application

    constructor(r: string) {
        this.root = new LayoutPart(document.getElementById(r));
    }

    addView(v: IWorkbenchPart, relatedTo: string, ratio: number, r: Relation) {
        var p: Pane = this.createPane(relatedTo, ratio, r);
        p._application = this.app;
        p.addPart(v);
    }

    createPane(relatedTo: string, ratio: number, r: Relation): Pane {
        if (this.panes.length == 0) {
            var p = new Pane(this.root);
            this.panes.push(p);
            return p;
        }
        var p: Pane = this.findPane(relatedTo);
        var newPart = null;
        var oldPart = null;
        if (r == Relation.LEFT) {
            var newParts = p._part.splitHorizontal([ratio, 100 - ratio]);
            newPart = newParts[0];
            oldPart = newParts[1];
        }
        if (r == Relation.RIGHT) {
            var newParts = p._part.splitHorizontal([100 - ratio, ratio]);
            newPart = newParts[1];
            oldPart = newParts[0];
        }
        if (r == Relation.BOTTOM) {
            var newParts = p._part.splitVertical([100 - ratio, ratio]);
            newPart = newParts[1];
            oldPart = newParts[0];
        }
        if (r == Relation.TOP) {
            var newParts = p._part.splitHorizontal([ratio, 100 - ratio]);
            newPart = newParts[0];
            oldPart = newParts[1];
        }
        p._part = oldPart;
        p.render();
        var newPane = new Pane(newPart);
        this.panes.push(newPane);
        return newPane;
    }

    findPane(s: string): Pane {
        for (var i = 0; i < this.panes.length; i++) {
            if (this.panes[i]._v) {
                if (this.panes[i]._v.id() == s) {
                    return this.panes[i];
                }
            }
        }
        return null;
    }
}


export abstract class AccorditionTreeView extends ViewPart {

    protected node: any;

    constructor(title: string) {
        super(title, title)
    }


    createTree(name: string) {
        var tree = new TreeView(name, name);
        this.customize(tree);
        var view = this;
        tree.addSelectionListener({
            selectionChanged(z: any[]){
                view.onSelection(z);
            }
        })
        return tree;
    }

    seachable = true;


    protected control: controls.Accordition;
    protected trees: TreeView[] = [];

    protected addTree(label: string, at: any) {
        var types = this.createTree(label);
        types.setInput(at);

        this.control.add(types)
        this.trees.push(types)
    }

    onSearch(searchStr: string) {
        var num = 0;
        var index = -1;
        var selectedIndexIsOk = false;
        this.control.children.forEach(x=> {
            if (x instanceof TreeView) {
                var has = x.onSearch(searchStr);
                if (searchStr.length > 0) {
                    if (!has) {
                        this.control.disable(x);
                    }
                    else {
                        this.control.enable(x);
                        if (num == this.control.getSelectedIndex()) {
                            selectedIndexIsOk = true;
                        }
                        index = num;
                    }

                }
                else {
                    this.control.enable(x);
                }
            }
            num++;
        })
        if (searchStr.length > 0) {
            if (!selectedIndexIsOk && index != -1) {
                this.control.expandIndex(index);
            }
        }
    }

    public setSelection(o: any) {

        var sel=this.getSelection();
        if (sel){
            if (sel[0]==o){
                return;
            }
        }
        for (var i = 0; i < this.trees.length; i++) {
            if (this.trees[i].hasModel(o)) {
                this.control.expand(this.trees[i]);
                this.trees[i].select(o);
            }
        }
    }

    protected abstract load()

    protected abstract customizeAccordition(root: controls.Accordition, node: any);

    protected abstract customize(tree: TreeView);



    showTab(title:string) {
        for (var i = 0; i < this.control.children.length; i++) {
            if (this.control.children[i].title().toLowerCase() == title.toLowerCase() || this.control.children[i].controlId == title) {
                this.control.expandIndex(i);
            }
        }
    }

    innerRender(e: Element) {
        if (!this.node) {


            new controls.Loading().render(e);
            this.load();
        }
        else {
            var title = null;
            if (this.control) {
                title = this.control.getSelectedTitleId();

            }
            var a = new controls.Accordition();
            this.control = a;
            this.trees = [];
            this.customizeAccordition(a, this.node);
            a.render(e);
            if (title) {
                this.showTab(title);
            }
        }
    }
}

export interface INavBarTheme {
    style: string
    brandImage: string
    brandImageHeight: string
    brandImageStyle: string
    brandRight?: string
}
var n=1;

export var defaultNavBar={
    style: ' margin-bottom: 5px;background-image: url(https://github.com/themes/midnight/images/nav-bg.gif)',
    brandImage: 'http://marketplace.eclipse.org/sites/default/files/styles/ds_medium/public/Logo110_80_1.png',
    brandImageHeight: '46px',
    brandImageStyle: 'margin-left: 2px;margin-top:2px;margin-right: 10px',
    brandRight:`<a class="header-logo-invertocat" href="https://github.com/apiregistry/registry" 
                   aria-label="Homepage" >
                   <img src="./images/GitHub-Mark-Light-32px.png" height="32" style="margin: 8px"/>
                </a>`
}
export class NavBar implements controls.IControl {

    _title: string = "";

    id(){
        return 'n'+(n++);
    }

    _theme: INavBarTheme = defaultNavBar

    title() {
        return this._title;
    }

    globalMenuElement: Element;
    private globalMenu: ContributionManager = new ContributionManager(x=> {
        this.renderMenu();
    })

    getMenuBar(): ContributionManager {
        return this.globalMenu;
    }

    private element: Element
    homeDisplay: boolean

    setTitle(t: string) {
        this._title = t;
        if (this.element) {
            this.element.innerHTML = "";
            this.render(this.element);
        }
    }

    render(e: Element) {
        this.element = e;
        var id = nextId();
        var tmplt = `<nav class="navbar navbar-inverse" id="header"
         style="${this._theme.style}">
         <div class="container-fluid" style="padding-left: 0px">
            <div class="navbar-header">
                
                <a class="navbar-brand" href="#" style="margin: 0px;padding: 0px">
                    
                    <img src="${this._theme.brandImage}"
                         height="${this._theme.brandImageHeight}" style="${this._theme.brandImageStyle}"/>
                    
                    <a class="navbar-brand" href="#" >
                    <span class="glyphicon glyphicon-home" onclick="Workbench.open('home')" style="display: ${this.homeDisplay?"visible":"none"}">
                    </span>
                    ${this._title}
                    </a>
                </a>
            </div>
            
            <div class="navbar-right">
                <ul class="nav navbar-nav" id="${id}"></ul>
                ${this._theme.brandRight}
            </div>
        </div>        
    </nav>`;
        e.innerHTML = tmplt;
        this.globalMenuElement = document.getElementById(id);
        this.renderMenu();
    }

    private renderMenu() {
        if (this.globalMenuElement) {
            this.globalMenuElement.innerHTML = "";
            new controls.DrowpdownMenu(this.globalMenu.menu, false).render(this.globalMenuElement);
        }
    }
}
export interface IViewRef {
    view: any,ref: string,ratio: number,relation: Relation
}
export interface IPerspective {

    title: string
    actions: IContributionItem[];
    views: IViewRef[ ]

    onOpen?: ()=>void
}
var a=1;
export class Application implements controls.IControl {


    title() {
        return this._title;
    }
    id(){
        return "a"+(a++);
    }

    private nb: NavBar = new NavBar();
    private page: Page;
    private status: Element;
    private perspective: IPerspective;

    constructor(private _title: string, private initialPerspective: IPerspective, element?: Element|string,currentP?:IPerspective,theme?:INavBarTheme) {
        this.perspective = currentP?currentP:initialPerspective;
        this.perspective.actions.forEach(a=>this.nb.getMenuBar().add(a))
        if (element) {
            if (typeof element == "string") {
                this.render(document.getElementById(<string>element))
            }
            else {
                this.render(<Element>element)
            }
        }
        var v=this;
        addCommand({
            id:"home",
            run(){
                v.home();
            }
        })
    }

    currentPerspective(){
        return this.perspective;
    }

    homePerspective(){
        return this.initialPerspective;
    }

    home(){
        this.openPerspective(this.initialPerspective)
    }

    setStatusMessage(m: string) {
        if (this.status) {
            this.status.innerHTML = m;
        }
    }

    getMenuBar(): ContributionManager {
        return this.nb.getMenuBar();
    }

    openPerspective(perspective: IPerspective) {
        this.nb.getMenuBar().menu.items = [];
        this._title=perspective.title;
        this.perspective.actions.forEach(a=>this.nb.getMenuBar().add(a))
        this.perspective = perspective;
        this.render(this.element);
    }

    element: Element;

    render(e: Element) {
        this.element = e;
        var nb = nextId();
        var main = nextId();
        var status = nextId();
        if (this.currentPerspective()!=this.initialPerspective){
            this.nb.homeDisplay=true;
        }
        else{
            this.nb.homeDisplay=false;
        }
        this.nb.setTitle(this.title());
        var tmplt = `<div style="height: 100%;display: flex;flex-direction: column">
        <div id="${nb}"></div>    
        <div id="${main}" style="flex: 1 0 0;height: 100%;display: flex;flex-direction: column"></div>
        <div>
            <p class="navbar-text" id="${status}" style="margin: 0px;padding: 0px;float: right;">...</p>
        </div>
        </div>`
        e.innerHTML = tmplt;
        this.nb.render(document.getElementById(nb));
        this.page = new Page(main);
        this.page.app = this;
        this.status = document.getElementById(status);
        this.openViews();
    }

    private openViews() {

        this.perspective.views.forEach(v=> {
            this.page.addView(v.view, v.ref, v.ratio, v.relation);
        })
    }
}


declare var BootstrapDialog: any;

export class ShowDialogAction implements IContributionItem {

    constructor(public title, private control: controls.IControl|string, private buttons:IContributionItem[]=[]) {
    }

    run() {
        var title = this.title
        var bs=[];
        var bNum=0;
        this.buttons.forEach(x=>{
            var csCl="";
            if (x.primary){
                csCl="btn-primary";
            }
            if (x.warning){
                csCl="btn-warning";
            }
            if (x.success){
                csCl="btn-success";
            }
            if (x.danger){
                csCl="btn-danger";
            }
            bs.push({
                id:"b"+bNum,
                label:x.title,
                action: (dlg)=> {
                    dlg.close()
                    x.run();
                },
                cssClass:csCl
            })
            bNum=bNum+1;
        })
        if (bs.length==0){
            bs.push({
                label: "Close",
                action: (dlg)=> {
                    dlg.close()
                }
            });
        }
        var dlgThis=this;
        var lst:IValueListener={
            valueChanged(c:ChangeEvent){
                var index=dlgThis.buttons.indexOf(c.target);
                var id="b"+index;
                var btn=dlg.getButton(id);
                var cm:IContributionItem=c.target;
                if (cm.disabled){
                    btn.disable();
                }
                else{
                    btn.enable();
                }
            }
        }
        var dlg = BootstrapDialog.show({
            title: title, buttons: bs,
            onhidden:()=>{
                this.buttons.forEach(x=>{
                    if ((<any>x).addListener){
                        (<any>x).removeListener(lst);
                    }
                })
            }
        })
        if (this.buttons.length>0){
            this.buttons.forEach(x=>{
                if ((<any>x).addListener){
                    (<any>x).addListener(lst);
                }
            })
            for (var i=0;i<this.buttons.length;i++){
                if (this.buttons[i].disabled){
                    var id="b"+i;
                    var btn=dlg.getButton(id);
                    btn.disable();
                }
            }
        }
        if (typeof this.control == "string") {
            dlg.$modalBody.html(this.control)
        }
        else {
            (<IControl>this.control).render(dlg.$modalBody[0]);
        }
    }
}
export function showInDialog(title:string,control: controls.IControl|string,btns?:IContributionItem[]){
    new ShowDialogAction(title,control,btns).run();
}
export function selectDialog(title: string,description: string,func:(x:any)=>void, root:any[],lp?:ILabelProvider,cp:ITreeContentProvider=new ArrayContentProvider()){
    if (!lp){
        lp={
            label(x:any){
               if (x.name){
                   if (typeof x.name==="function"){
                       return x.name();
                   }
                   return x.name;
               }
                if (x.title){
                    if (typeof x.title==="function"){
                        return x.title();
                    }
                    return x.title;
                }
                if (x.id){
                    if (typeof x.id==="function"){
                        return x.id();
                    }
                    return x.id;
                }
            }

        }
    }
    var tree=new TreeView("","");
    tree.asyncRender=true
    tree.autoExpand=2;
    tree.setContentProvider(cp);

    tree.setLabelProvider(lp);
    tree.setInput(root);
    var composite=new controls.VerticalFlex();
    composite._style.maxHeight="700px"
    tree.styleString+=";max-height:600px;min-height:600px"
    composite.add(new Label(description));
    composite.add(tree);
    showInDialog(title,composite,[
        {
            title:"Ok",
            run(){
                func(tree.getSelection()[0]);
            }
        }
        ,
        {
            title:"Cancel"
        }
    ])
}


export interface StateRecord {
    hash: string
}
var w: any = window;

export interface UrlHandler {
    (s: string): boolean
}
var handlers: UrlHandler[] = []

export function registerHandler(f: UrlHandler) {
    handlers.push(f);
}
export function unregisterHandler(f: UrlHandler) {
    handlers = handlers.filter(x=>x !== f);
}
w.Workbench = {

    open(url: string){
        processUrl(url)
    }
}
export function back() {
    history.back()
}


var commands={}


export function addCommand(ci:IContributionItem ){
    commands[ci.id]=ci;
}

export function processUrl(url: string) {
    if (commands[url]){
        commands[url].run();
        return;
    }
    var sState=true;
    Object.keys(commands).forEach(x=>{
        if (url.indexOf(x)==0){
            url=url.substring(x.length);
            commands[x].run(url);
            sState=false;
        }
    })
    if (sState) {
        setState({hash: url})
    }
}
export function processState(s: StateRecord) {
    for (var i = 0; i < handlers.length; i++) {
        if (handlers[i](s.hash)) {
            return;
        }
    }
}
var currentHash:string=null;
export var notifyState = function (s: StateRecord) {
    if (history && history.pushState&&s.hash.indexOf('#')==0) {
        if (currentHash&&s.hash.indexOf(currentHash)==0){
            history.replaceState(s, "",s.hash);

        }
        else {
            history.pushState(s, "", s.hash);
        }
        currentHash=s.hash;
    }
};
export function setState(s: StateRecord) {
    notifyState(s);
    processState(s);
}

if (history && history.pushState) {
    window.onpopstate = function (event) {
        if (event.state) {
            processState(event.state)
        }
        else{
            processState({hash:document.location.hash})
        }
    };
}
export function exportGlobalHandler(name:string, handler:()=>void){
    var w: any=window;
    w[name]=handler;
}

export class BackAction implements IContributionItem {

    title:string

    constructor(){
        this.title="Back"

    }

    run() {
        back()
    }

}


var w:any=window;
w.WorkbenchUtils={};
w.WorkbenchUtils.getView=getView;