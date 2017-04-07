import controls=require("./controls");
import ro=require("./renderingOptions")
export import tps=require("raml-type-bindings")
import uifactory=require("./uifactory")
import IBinding=tps.IBinding
import IPropertyGroup=tps.ts.IPropertyGroup;
import wb=require("./workbench");
import {IControl, Composite, VerticalFlex, HorizontalFlex, IContributionItem, Accordition} from "./controls";
import {ISelectionProvider, ISelectionListener} from "./workbench";
import {IValueListener, ChangeEvent, Binding, Status, ViewBinding, metakeys} from "raml-type-bindings";
import {ListenableAction} from "./actions";
import auth=require("./auth")
import ex=require("./extraCss")
var sheet = document.createElement('style')
sheet.innerHTML =ex;
document.body.appendChild(sheet);
const ERROR = `<span class="alert-danger" style="background-color: transparent" role="alert">
        <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> </span>`
export class TabFolder extends controls.WrapComposite implements controls.HasChildValidnessDecorations {

    grabVertical: boolean = true

    rendersLabel(c: IControl) {
        return true;
    }

    constructor() {
        super("div")
        if (this.grabVertical) {

            this._style.display = "flex";
            this._style.flexDirection = "column"
        }
        this.onChildVisibilityChanged = (c, v) => {
            var i = this.children.indexOf(c);
            if (i != -1) {
                var header = document.getElementById(this.id() + "tab" + i);
                if (header) {
                    if (v) {
                        header.style.display = "";
                    }
                    else {
                        header.style.display = "none";
                        document.getElementById("w" + this.children[i].id()).classList.remove("active");
                        if (header.parentElement.classList.contains("active")) {
                            header.parentElement.classList.remove("active");
                            for (var j = 0; j < this.children.length; j++) {
                                var element = document.getElementById(this.id() + "tab" + j)
                                element.parentElement.classList.add("active");
                                //if (element.style.display != "none") {
                                document.getElementById("w" + this.children[j].id()).classList.add("active");
                                break;
                                //}
                            }
                        }
                    }
                }
            }
        }
    }

    canShrinkVertically(): boolean {
        return this.grabVertical;
    }

    setChildValidness(validness: boolean[]) {
        for (var i = 0; i < validness.length; i++) {
            var tb = document.getElementById(this.id() + "tab" + i);
            if (tb) {
                if (!validness[i]) {
                    tb.innerHTML = this.children[i].title() + ERROR;
                }
                else {
                    tb.innerText = this.children[i].title();
                }
            }
        }
    }


    protected extraRender(ch: HTMLElement) {
        if (this.grabVertical) {
            ch.style.flex = this.getRenderingOptions().dialog ? "1 1 auto" : "1 1 0";
        }
        var rs: string[] = [];
        var ll = document.createElement("ul");
        ll.classList.add("nav")
        ll.classList.add("nav-tabs");
        var c = ""
        var vm = 0;
        this.children.forEach((x, i) => {
            var visible = (!(x instanceof controls.Composite)) || (<controls.Composite>x).isVisible();
            if (true) {
                var t = `      
            <li class="${vm == 0 ? 'active' : ''}">
            <a  href="#${"w" + x.id()}" data-toggle="tab" style="display: ${visible}" id="${this.id() + "tab" + i}">${x.title()}</a>
            </li>`;
                c += t;
                vm++;
            }
        })
        ll.innerHTML = c;
        for (var i = 0; i < ll.children.length; i++) {
            (<HTMLElement>ll.children.item(i)).onclick = (e) => {
                this.potentiallyVisible()
            }
        }
        ch.appendChild(ll);
    }


    protected wrap(p: HTMLElement, c?: IControl) {
        var d = document.createElement(this.wrapElement);

        d.id = "w" + c.id();
        d.classList.add("tab-pane")
        if (this.grabVertical) {
            d.classList.add("grabVertical")//
        }
        if (this.children.indexOf(c) == 0) {
            d.classList.add("active")
        }
        p.appendChild(d);
        return d;
    }

    protected renderChildren(ch: HTMLElement) {

        var cc = document.createElement("div");
        cc.classList.add("tab-content")
        cc.classList.add("clearfix")
        if (this.grabVertical) {
            cc.style.flex = this.getRenderingOptions().dialog ? "1 1 auto" : "1 1 0";
            cc.style.display = "flex";
            cc.style.flexDirection = "column"
        }
        ch.appendChild(cc);
        super.renderChildren(cc);
    }

}
export class InputGroup extends controls.Composite implements controls.HasChildValidnessDecorations {

    setChildValidness(validness: boolean[]) {
        var allValid = true;
        validness.forEach(x => {
            allValid = allValid && x
        });
        if (this.children.length > 0) {
            if (this.children[0] instanceof InputGroupAddOn) {
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

    weapperForChild: boolean = true;
}

export class InputGroupAddOn extends controls.Composite {

    valid: boolean = true;

    setValid(v: boolean) {
        this.valid = v;
        this.refresh();
    }

    constructor() {
        super("div")
        this._text = ""
        this.addClassName("input-group-addon")
    }

    protected renderChildren(ch: HTMLElement) {
        super.renderChildren(ch);
        if (!this.valid) {
            ch.innerHTML = ch.innerHTML + ERROR
        }
    }

    setWidth(w: number) {
        if (this._element) {
            (<HTMLElement>this._element).style.width = w + "px";
        }
    }

    private desiredWidth;

    width() {
        if (this.desiredWidth) {
            return this.desiredWidth;
        }
        if (this._element) {
            var dv = this._element.getBoundingClientRect().width + 10;
            if (dv > 20) {
                this.desiredWidth = dv;
                return dv;
            }
            return dv;
        }
        return -1;
    }
}

export abstract class BindableControl extends controls.Composite {
    _binding: tps.IBinding


    valListener: tps.IValueListener;

    private oldVal;

    title(){
        var rrr=super.title();
        if (!rrr){
            if (this._binding){
                return tps.service.caption(this._binding.type());
            }
        }
        return rrr;
    }

    protected updateVisibility() {
        this.setVisible(tps.service.isVisible(this._binding.type(), this._binding));
        var m: tps.metakeys.VisibleWhen&tps.metakeys.DisabledWhen = this._binding.type();
        var disabled = false;
        if (m.disabledWhen) {
            disabled = tps.calcCondition(m.disabledWhen, this._binding);
        }
        if (tps.service.isReadonly(this._binding.type())) {
            disabled = true;
        }
        this.setDisabled(disabled);
        var val = this._binding.get();
        if (val != this.oldVal) {
            this.oldVal = val;
            this.updateFromValue(val);
        }
        return;
    }

    protected updateFromValue(v: any) {

    }

    protected renderContent(ch: HTMLElement) {
        super.renderContent(ch);
        var vv = this;
        if (!this.valListener) {
            this.valListener = {
                valueChanged(){
                    vv.updateVisibility();
                }
            }
        }
        this.initBinding(ch);
    }

    protected abstract initBinding(ch: HTMLElement);

    afterCreate?: (c: BindableControl) => void

    onAttach(e: Element) {
        super.onAttach(e);
        if (this.afterCreate) {
            this.afterCreate(this)
        }
        if (this._binding) {
            var m: tps.metakeys.VisibleWhen&tps.metakeys.DisabledWhen&tps.metakeys.EnumValues&tps.metakeys.TypeAhead = this._binding.type();
            //if (m.visibleWhen||m.hiddenWhen||m.disabledWhen||m.enumValues||m.typeahead){
            this._binding.root().addListener(this.valListener);
            this.updateVisibility();
            //}
        }
    }

    onDetach(e: Element) {
        super.onDetach(e);
        this._binding.root().removeListener(this.valListener);
    }
}


export class ApplyRevertComposite extends BindableControl {

    constructor(private d: tps.CachingBinding) {
        super('div');
        this._binding = d;
        var h = this;
        d.dirtyController.addListener({
            valueChanged(){
                h.refresh();
            }
        })

    }

    initBinding() {

    }

    renderChildren(c: HTMLElement) {
        var h = new Composite("span")
        h._style.cssFloat = "right";
        var cmm = new Button("Apply Changes");
        var dirty = this.d.dirtyController.get();
        if (!dirty) {
            cmm.addClassName("btn-disabled")
            cmm.setDisabled(true);
        }
        cmm.onClick = (x) => {
            this.d.commit()
        }
        cmm.addClassName("btn-primary")
        cmm._style.marginRight = "5px";
        h.add(cmm);
        var r = new Button("Revert");
        if (!dirty) {
            r.addClassName("btn-disabled")
            r.setDisabled(true);
        }
        h.add(r);
        r.onClick = (x) => {
            this.d.revert()
        }
        h._style.padding = "5px"
        h.render(c);
    }
}
export class BindableComposite extends BindableControl {

    hasContent: boolean

    contentCreated: boolean;

    pb: Binding;

    protected initBinding(ch: HTMLElement) {
        if (!this.contentCreated) {
            this.contentCreated = true;
            this.children = [];
            var footer = null
            if (!this._binding.autoCommit()) {
                let cachingBinding = new tps.CachingBinding(<tps.Binding>this._binding);
                this.pb = cachingBinding;
                footer = new ApplyRevertComposite(cachingBinding);
                if (this.getRenderingOptions().maxMasterDetailsLevel==0){
                    footer.setVisible(false);
                }
            }
            else {
                this.pb = (<tps.Binding>this._binding);
            }
            var cntrl = <controls.Composite>uifactory.service.createControl(this.pb, this.getRenderingOptions());
            this.children.push(cntrl);
            if (footer) {
                this.children.push(footer);
            }
            if (cntrl.canShrinkChildrenVertically()) {
                cntrl._style.flex = "1 0 0";
            }
        }
    }

    onDetach(e: HTMLElement) {
        super.onDetach(e);
        if (this.pb != this._binding) {
            (<tps.CachingBinding>this.pb).dispose();
        }
    }

    needsVerticalScroll() {
        return true;
    }

    hasVerticalSchrink() {
        return super.hasVerticalSchrink();
    }

    protected updateVisibility() {
        super.updateVisibility();
        var cl = this._binding.get() != null && this._binding.get() != undefined
        if (cl != this.hasContent) {
            this.refresh();
        }
    }

    onAttach(e: Element) {
        super.onAttach(e);
    }

    afterCreate?: (c: BindableControl) => void


    renderChildren(ch: HTMLElement) {
        this.hasContent = this._binding.get() != null && this._binding.get() != undefined;
        if (this.hasContent) {

            super.renderChildren(ch)

        }
        else {
            //var cm=new Composite("div");
            ch.innerHTML = (`<div style="flex: 1 1 0"></div><div style="text-align: center">Please select ${tps.service.caption(this._binding.type()).toLowerCase()} to see details</div><div style="flex: 1 1 0"></div>`);
            //super.renderElements([cm],ch)
        }
    }
}

export class Input extends BindableControl {
    constructor(form:boolean=true) {
        super("input")
        if (form) {
            this.addClassName("form-control");
        }

    }

    protected updateFromValue(v: any) {
        var el: HTMLInputElement = <HTMLInputElement>this._element;
        if (v != el.value) {
            if (v === undefined || v === null) {
                v = "";
            }
            if (tps.service.isSubtypeOf(this._binding.type(),tps.TYPE_DATE)){
                v=tps.service.label(v,this._binding.type());
            }

            el.value = "" + v;
        }
    }
    di:boolean
    protected initBinding(ch: HTMLElement) {
        var el: HTMLInputElement = <HTMLInputElement>ch;
        if (this._binding) {
            var val = this._binding.get();
            if (!val) {
                val = "";
            }
            if (tps.service.isNumber(this._binding.type())) {
                this._element.setAttribute("type", "number");
                var mm: tps.NumberType = this._binding.type();
                if (mm.maximum) {
                    this._element.setAttribute("maximum", "" + mm.maximum);

                }
                if (mm.minimum) {
                    this._element.setAttribute("minimum", "" + mm.minimum);
                }
                if (mm.step) {
                    this._element.setAttribute("step", "" + mm.step);
                }
            }


            if (tps.service.isSubtypeOf(this._binding.type(), tps.TYPE_PASSWORD)) {
                this._element.setAttribute("type", "password");
            }

            el.value = val;
            el.onkeyup = (e) => {
                var q=el.value;
                if (tps.service.isSubtypeOf(this._binding.type(),tps.TYPE_DATEONLY)){
                    this._binding.set(moment(q).format("YYYY-MM-DD"))
                }
                else {
                    this._binding.set(q);
                }
            }
            el.onchange = (e) => {
                this._binding.set(el.value);
            }
        }
    }

    _typeaheadFunction:string | ((name: string, c: (v: string[]) => void)=>void)

    onAttach(x){
        super.onAttach(x);
        var bnd=this._binding;
        if (tps.service.isSubtypeOf(this._binding.type(),tps.TYPE_DATE)){
            if (tps.service.isSubtypeOf(bnd.type(),tps.TYPE_DATEONLY)){
                $("#" + this.id()).datetimepicker({format:"YYYY-MM-DD"});
            }
            else {
                $("#" + this.id()).datetimepicker();
            }
            $("#" + this.id()).on("dp.change", function(e) {
                if (tps.service.isSubtypeOf(bnd.type(),tps.TYPE_DATEONLY)){
                    bnd.set(moment(e.date).format("YYYY-MM-DD"))
                }
                else {
                    bnd.set(moment(e.date).toISOString())
                }
            });

        }
        else {
            var haste = this._typeaheadFunction || (<tps.metakeys.TypeAhead>this._binding.type()).typeahead;
            var v = this
            if (haste) {
                var te = this._typeaheadFunction;
                if (!te) {
                    te = (<tps.metakeys.TypeAhead>this._binding.type()).typeahead;
                }
                if (typeof te == "string") {
                    var code=te;
                    var typeAheadFunction = function (name: string, c: (v: string[]) => void) {
                        c(tps.calcExpression(code, v._binding))
                    };
                    te = typeAheadFunction
                }
                var w: any = window;
                $("#" + this.id()).typeahead({
                    source:te
                })

            }
        }
    }
}
export class TextArea extends BindableControl {
    constructor() {
        super("textarea")
        this.addClassName("form-control");
    }

    protected updateFromValue(v: any) {
        var el: HTMLInputElement = <HTMLInputElement>this._element;
        if (v != el.value) {
            if (v === undefined || v === null) {
                v = "";
            }
            el.value = "" + v;
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
            el.onkeyup = (e) => {
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
        this._style.paddingLeft = "1px";
        this._style.paddingRight = "1px";
        this.attrs["data-toggle"] = "tooltip"
        this.attrs["data-placement"] = "right"
        this.attrs.title = value;
    }
}
export let enumOptions = tps.enumOptions;
export function enumValues(b: IBinding): any[] {
    let type = b.type();
    return enumOptions(type, b);
}

export class EnumInfo {
    labelsMap = new Map<string,any>();
    values: any[] = []
    labels: any[] = []
    selectedIndex: number = -1;
    value: string

    constructor(private b: IBinding, radio: boolean = false, doSet = true) {
        var enumv: any[] = enumValues(b);
        var vl = b.get();

        let type = b.type();
        const hasDescriptions: tps.metakeys.EnumDescriptions = <any>type;
        if (type.default) {
            if (!vl) {
                vl = type.default;
            }
        }
        for (var i = 0; i < enumv.length; i++) {
            var lab = enumv[i];
            var val = lab;
            if (hasDescriptions.enumDescriptions) {
                val = hasDescriptions.enumDescriptions[i];
            }
            else {
                if (typeof lab != "string") {
                    val = tps.service.label(lab, type);
                }
            }
            if (val === b.get()) {
                this.selectedIndex = (i);
            }
            this.labelsMap.set(val, lab);
            this.labels.push(val);
        }
        if ((!type.required) || ((enumv.indexOf(vl) == -1) && !radio)) {
            if (!type.default) {
                this.labels = [''].concat(this.labels);
                enumv = [''].concat(this.labels);
                this.labelsMap.set('', '');
                if (!vl || this.labels.indexOf(vl) == -1) {
                    vl = "";
                    if (doSet && b.get()) {
                        b.set("");
                    }
                }
                if ((!type.required)) {
                    this.selectedIndex++;
                }
            }
        }
        else {
            if (enumv.indexOf(vl) == -1) {
                if (doSet && b.get()) {
                    this.b.set("");
                }
            }
        }
        if (this.selectedIndex == -1) {
            this.selectedIndex = 0;
        }
        this.values = enumv;
    }
}


export class Select extends BindableControl {
    constructor() {
        super("select")
        this.addClassName("form-control");
    }

    selectInited: boolean
    enumOptions: string[]
    inUpdate = false;

    protected updateVisibility() {
        super.updateVisibility();
        var enumF = (<tps.metakeys.EnumValues>this._binding.type()).enumValues;
        if (enumF) {
            var enumv = tps.calcExpression(enumF, this._binding);
            if (JSON.stringify(this.enumOptions) != JSON.stringify(enumv)) {
                this.selectInited = false;
                if (this._element) {
                    this.inUpdate = true;
                    try {
                        this.initBinding(<HTMLElement>this._element);
                    } finally {
                        this.inUpdate = false;
                    }
                }
            }
        }
    }

    updateFromValue(v: any) {
        if (this._element) {
            this.selectInited = false;
            this.initBinding(<HTMLElement>this._element);
        }
    }

    onAttach(el: HTMLElement) {
        var info = new EnumInfo(this._binding, false, !this.inUpdate)
        el.onchange = (e) => {
            this._binding.set(info.labelsMap.get((<HTMLInputElement>el).value));
        }
        super.onAttach(el);
    }

    protected initBinding(ch: HTMLElement) {
        var el: HTMLSelectElement = <HTMLSelectElement>ch;
        if (this._binding) {
            if (!this.selectInited) {
                var info = new EnumInfo(this._binding, false, !this.inUpdate)
                this.enumOptions = [].concat(info.values);
                el.onchange = (e) => {
                    this._binding.set(info.labelsMap.get(el.value));
                }
                this.children = [];
                info.labels.forEach(x => {
                    this.children.push(new Option(x))
                })
                this.selectInited = true;
                this.refresh();
                el.selectedIndex = info.selectedIndex;
            }
        }
    }
}
export class RadioSelect extends BindableControl {
    constructor() {
        super("div")
        this._style.padding = "5px";
    }

    initBinding() {
    }

    protected updateFromValue(v: any) {
        this.refresh();
    }

    renderContent(e: HTMLElement) {
        super.renderContent(e);
        var info = new EnumInfo(this._binding, true)
        var mm = document.createElement("div");
        if (this.needLabel()){
        mm.appendChild(document.createTextNode(this._binding.type().displayName));
        var descr = this._binding.type().description;
        if (descr) {
            var h = new Help(descr);
            h._style.paddingLeft = "2px"
            h._style.paddingRight = "2px"
            h.render(mm);
        }
        mm.appendChild(document.createTextNode(':'));
            }
        e.appendChild(mm);
        info.labels.forEach(x => {
            var input = document.createElement("input");
            input.type = "radio";
            var vl = info.labelsMap.get(x);
            input.onchange = (e) => {
                this._binding.set(vl)
            };
            input.name = "r" + this.id();
            input.value = vl;
            if (vl == this._binding.get()) {
                input.checked = true;
            }
            var lab = document.createElement("div")
            lab.appendChild(input);
            lab.appendChild(document.createTextNode(" " + x))
            e.appendChild(lab);
        });
    }

}

export class Button extends controls.Composite {
    constructor(text: string) {
        super("button")
        //this.attrs.type="select";
        //this.addClassName("form-control");
        this.addClassName("btn")
        this.addClassName("btn-default")
        this._text = text;
    }
}

export class Link extends controls.Composite {
    constructor(txt: string = "") {
        super("a");
        this.attrs["href"] = "#";
        this._text = txt;
    }
}

export class PagingControl extends BindableControl {

    constructor(b: Binding) {
        super("nav");
        this._binding = b;
        this._style.margin = "0px";
        this._style.padding = "0px";
    }

    initBinding() {

    }

    start = 0;
    end = 5;

    protected updateFromValue(v: any) {
        this.refresh();
    }

    lastTimeHasPaged: boolean

    renderChildren(ch: HTMLElement) {
        var cm = new Composite("ul");
        var paged = <tps.storage.PagedCollection>this._binding
        cm._style.margin = "2px";
        cm.addClassName("pagination");
        cm.addClassName("pagination-sm");
        let startPage = this.start;
        var prev = new Composite("li");

        prev.addHTML(`<a href="#" aria-label="Previous" >
        <span aria-hidden="true">&laquo;</span>
      </a>`);
        if (startPage == 0) {
            prev.addClassName("disabled")
        }
        cm.add(prev);
        let endPage = this.end;
        var pc = paged.pageCount();

        if (this.end - this.start < 5) {
            this.end = this.start + 5;
        }

        if (pc < endPage) {
            endPage = paged.pageCount();
            this.end = endPage;
        }

        var total = paged.total();
        var inside = paged.get();//
        if (paged.hasAllData()||(total != -1 && (inside && inside.length >= total) || (paged.isLoading() && !this.lastTimeHasPaged))) {
            this.lastTimeHasPaged = false;
            return;
        }
        this.lastTimeHasPaged = true;
        for (var i = startPage; i < endPage; i++) {
            var pg = new Composite("li");
            if (i == paged.pageNum()) {
                pg.addClassName("active");
            }
            let vl = i;
            if (paged.isLoading() && i == paged.pageNum()) {
                pg.addHTML('<span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>')
            }
            else pg.add(new Link("" + (i + 1)));
            pg.onClick = (e) => {
                paged.requestPage(vl)
            }

            cm.add(pg);
        }
        var next = new Composite("li")
        next.addHTML(`<a href="#" aria-label="Next">
        <span aria-hidden="true">&raquo;</span>        
        
      </a>`)
        if (endPage) {
            next.onClick = (e) => {
                paged.requestPage(this.end - 1);
                if (this.end < paged.pageCount()) {
                    this.end++;
                    this.start++
                }
            }
        }
        if (startPage != 0) {
            prev.onClick = (e) => {
                paged.requestPage(this.start - 1);
                this.end--;
                this.start--
            }//
        }

        if (paged.total() && paged.total() != -1) {
            cm.addHTML(`<span style="margin: 5px"> showing  ${paged.collectionBinding().workingCopy().length} ${tps.service.caption(paged.type()).toLocaleLowerCase()} of ${paged.total()}</span>`);
        }
        cm.add(next);

        this.children = [cm];
        super.renderChildren(ch)
    }
}
import workbench=require("./workbench")
export class MasterDetails extends controls.HorizontalFlex {

    useSplit = true;


    spEl: HTMLElement;

    master: VerticalFlex;
    details: controls.AbstractComposite

    onAttach(e: Element) {
        if (this.useSplit) {
            var lp = new workbench.LayoutPart(this._element);

            var lps = lp.splitHorizontal([50, 50], true);
            this.spEl = <HTMLElement>lp.element();
            (<HTMLElement>lps[0].element()).style.maxHeight = "100%";
            (<HTMLElement>lps[1].element()).style.maxHeight = "100%";
            var v = new VerticalFlex();
            v._style.flex = "1 1 0";
            v._style.overflow = "hidden";
            this.lst.onVisibilityChanged = (v) => {
                this.setVisible(v);
                if (v) {
                    this.potentiallyVisible()
                }
            }
            v.add(this.lst);//
            v.render(lps[0].element());
            this.master = v;
            this.details = <controls.AbstractComposite>this.createDetails(this.lst);
            this.details.render(lps[1].element());
        }
        super.onAttach(e);
    }

    potentiallyVisible() {
        if (this.useSplit && this.spEl && this.spEl.children[0]) {
            if ((<any>this.spEl.children[0]).onresize) {
                setTimeout(() => {
                    let pair = (<any>this.spEl.children[0]).pairs[0];
                    (<HTMLElement>pair.a).style.width = (this.spEl.children[0].clientWidth / 2 - pair.aGutterSize) + "px";
                    (<HTMLElement>pair.b).style.width = (this.spEl.children[0].clientWidth / 2 - pair.bGutterSize) + "px";
                    pair.calculateSizes.call(pair);
                    pair.fitMin.call(pair);
                    pair.rebalance.call(pair);
                    this.master.potentiallyVisible();
                    this.details.potentiallyVisible();
                }, 50)

//
            }//
        }
        super.potentiallyVisible();
    }

    constructor(private lst: AbstractListControl) {
        super();
        if (this.useSplit) {
            delete this._style.flexDirection;
            this._style.width = "100%";
            this._style.flex = "1 1 0";
            this._style.display = "flex"
            return;
        }

        var cm = new controls.Composite("div");
        cm._style.flex = "1 2 0";
        cm._style.display = "flex";
        cm._style.overflowY = "auto";
        cm._style.flexDirection = "column";
        //cm.add(new PagingControl());
        cm.add(lst);
        this.add(cm);

        var cm1 = this.createDetails(lst);
        this.add(cm1);
    }

    private createDetails(lst: AbstractListControl) {
        var bnd = lst.selectionBinding();

        var tp=bnd.type();
        if (tp.details&&tp.details.length>0){
            var details=tp.details[0];
            var tpp=tps.service.resolvedType(details);
            console.log(tpp);
            (<tps.Binding>bnd)._type=(<tps.Operation>tpp).result;
            var bn=new tps.OperationBinding(<tps.Operation>tpp,<tps.Binding>bnd);
            bnd.addListener({
                valueChanged(){
                    //bn.changed();
                    var value=bnd.get();
                    bn.execute(x=>{
                        var vl=bnd.get();
                        if (value==vl) {
                            if (vl&&!Array.isArray(vl)) {
                                Object.keys(x).forEach(k=>{
                                    vl[k]=x[k];
                                    (<tps.Binding>bnd).binding(k).refresh();
                                })
                            }
                        }
                        if ((<any>bnd).$cach){

                            (<any>bnd).$cach.ol.valueChanged();
                        }
                        else{
                            //(<any>bnd).set(tps.utils.deepCopy(bnd.get()))
                        }
                    })
                }
            })
            // bn.addListener({
            //     valueChanged(){
            //         console.log(bn.get());
            //     }
            // })

        }
        this._style.flex = "1 1 0";
        var cm1 = new BindableComposite("div");
        cm1._binding = bnd;
        cm1._style.display = "flex";
        cm1._style.flexDirection = "column";
        cm1._style.flex = "1 1 0";
        cm1._style.marginBottom = "5px";
        cm1._style.borderLeftStyle = "solid"
        cm1._style.borderLeftColor = "#eeeeee"
        //cm1._style.marginLeft="5px";//
        var opt = this.getRenderingOptions();
        let mmdl = opt.maxMasterDetailsLevel ? opt.maxMasterDetailsLevel : 1;
        cm1.setRenderingOptions(ro.clone(opt, {
            noStatus: true,
            noStatusDecorations: false,
            maxMasterDetailsLevel: mmdl - 1
        }));
        return cm1;
    }
}
export class StatusRender extends BindableControl implements tps.IValueListener {

    valueChanged(e: tps.ChangeEvent) {
        this.processChanges();
    }

    constructor() {
        super("div");
    }

    displayMessage: boolean = true;
    displayDecorations: boolean = true;

    onAttach(e: Element) {
        super.onAttach(e)
        if (this._binding) {
            this._binding.binding("$status").addListener(this);
            this.processChanges();
        }
    }

    private content: Element;

    processChanges() {
        var st: tps.Status = this._binding.binding("$status").get();
        if (!this.content) {
            var sp = document.createElement("span");
            this.content = sp;
            this._element.appendChild(sp);
        }
        if (st.severity == tps.Severity.ERROR) {
            if (this.displayMessage) {
                var msg = new controls.ErrorMessage();
                msg.setMessage(st.message);
                msg.render(this.content);
            }
        }
        else {
            this.content.innerHTML = "";
        }
        if (this.displayDecorations) {
            var mn: Map<string,tps.Status> = new Map();
            this.visit(st, mn);
            this.updateStatusDecorations(this.parent, mn);
        }
    }

    updateStatusDecorations(c: IControl, mn: Map<string,tps.Status>): boolean {
        var valid = true;
        var bnd = (<BindableControl>c)._binding
        var shouldIterateChildren = true;
        if (bnd && bnd.root() != this._binding.root()) {
            shouldIterateChildren = false;
        }
        if (shouldIterateChildren && (<controls.AbstractComposite>c).children) {
            var ch = (<controls.AbstractComposite>c).children;

            var validness: boolean[] = [];
            ch.forEach(child => {
                var vl = this.updateStatusDecorations(child, mn);
                valid = valid && vl;
                validness.push(vl);
            })
            if ((<controls.HasChildValidnessDecorations><any>c).setChildValidness) {
                (<controls.HasChildValidnessDecorations><any>c).setChildValidness(validness);
            }
        }
        var bnd = (<BindableControl>c)._binding;
        if (bnd && bnd.root() == this._binding.root()) {
            if (mn.has(bnd.uid())) {
                var ss = mn.get(bnd.uid());
                if (!ss.valid) {
                    if (c instanceof AbstractListControl) {
                        var lst = c;
                        lst.setStatus(ss);
                    }
                    return false;
                }
            }
            else if (c instanceof AbstractListControl) {
                var lst = c;
                lst.setStatus(tps.ok());
            }
        }
        return valid;
    }

    visit(s: tps.Status, mn: Map<string,tps.Status>) {
        if (s.uid) {
            mn.set(s.uid, s);
        }
        if (s.inner) {
            s.inner.forEach(x => this.visit(x, mn));
        }
    }


    onDetach(e: Element) {
        super.onDetach(e)
        if (this._binding) {
            this._binding.binding("$status").removeListener(this);
        }
    }

    protected initBinding(ch: HTMLElement) {
    }
}

export abstract class ActionPresenter extends controls.Composite implements IValueListener {
    items: controls.IContributionItem[] = []

    onAttach() {
        this.items.forEach(i => {
            var ls = <ListenableAction>i;
            if (ls.addListener) {
                ls.addListener(this);
            }
        })
    }

    valueChanged(c: ChangeEvent) {
        if (this._element) {
            this._element.innerHTML = "";
        }
        this.renderElement(<HTMLElement>this._element);

    }

    protected renderContent(ch: HTMLElement) {
        super.renderContent(ch);
        this.renderElement(ch);
    }

    abstract renderElement(e: HTMLElement);

    onDetach() {
        this.items.forEach(i => {
            var ls = <ListenableAction>i;
            if (ls.removeListener) {
                ls.removeListener(this);
            }
        })
    }
}

export class Toolbar extends ActionPresenter implements IValueListener {

    constructor() {
        super("span")
        this._style.cssFloat = "right";
        this._style.marginLeft="3px"
    }

    renderElement(e: HTMLElement) {
        var rnd = new controls.ToolbarRenderer(<any>this);
        rnd.style.marginRight = "5px";
        rnd.render(this._element);
    }
}
declare var $: any;

export interface MenuContributor{
    contribute():IContributionItem[]
}
export class DropDown extends ActionPresenter implements IValueListener {

    constructor() {
        super("div")
        this._styleString = "float: right";
    }

    ownerId: string;
    contributors: MenuContributor[]=[]
    onAttach() {
        super.onAttach()
        this.valueChanged(null);
    }

    renderElement(e: HTMLElement) {
        var view = this;
        $.contextMenu({
            selector: "#" + view.ownerId + ">*",
            build: () => {
                return {items: view.mapItems()}
            }
        })
    }

    mapItems() {
        var result: any = {}
        var ms=this.items;
        this.contributors.forEach(x=>{ms=ms.concat(x.contribute())})
        ms.forEach(x => {
            var res: any = {
                name: x.title,
                icon: x.image,
                disabled: x.disabled,
                callback: () => {
                    x.run()
                }
            }
            if (x.checked){
                res.icon="fa-check";
                //res.selected="true"
            }
            if (x.items) {
                var rr = new DropDown();
                rr.items = x.items;
                res.items = rr.mapItems();
            }
            result[x.id ? x.id : x.title] = res;
        })
        return result;
    }

    addTo(v: Composite) {
        this.ownerId = v.id();
        var view = this;
        v.addLifycleListener({
            attached(c, e){

                view.renderElement(<HTMLElement>e);
            },
            detached(c, e){

            }
        })
    }
}

export class Section extends controls.Composite {

    heading: Composite;
    toolbar: Toolbar = new Toolbar();
    body: Composite = new controls.WrapComposite("div");


    add(c: IControl) {
        this.body.add(c);
    }

    renderContent(ch: HTMLElement) {
        var cchh=false;
        if (this.parent instanceof TabFolder) {
            this._style.borderRadius = "0px";
            this.heading._style.borderTopWidth = "0px";
            this._style.borderTopWidth = "0px";
            this.heading._text = " ";
            this.heading._style.minHeight = "40px";
            this.toolbar._styleString = "float: left";
            this.heading._style.paddingLeft = "5px";
            cchh=true;
        }
        if (this.parent){
            if (this.parent.parent==null){
                this._style.marginRight="5px";
                this._style.marginLeft="5px";
            }
        }
        if (this.parent instanceof Accordition){
            this._style.borderRadius = "0px";
            //this.heading._style.borderTopWidth = "0px";
            this._style.borderBottomWidth = "0px";
            this._style.borderLeftWidth="0px"
            this.heading._text = " ";
            this.heading._style.minHeight = "40px";
            this.toolbar._styleString = "float: left";
            this.heading._style.paddingLeft = "5px";
            cchh=true;
        }
        if (cchh){
            if (this.toolbar.items.length==0){
                this.heading.setVisible(false);
            }
        }
        super.renderContent(ch);
    }

    protected renderChildren(ch: HTMLElement) {
        if (this.body.children.length == 1) {
            if (this.body.children[0] instanceof AbstractListControl) {
                (<AbstractListControl>this.body.children[0]).parent = this;
                this.renderElements([this.heading, this.body.children[0]], ch);
                return;
            }
        }
        super.renderChildren(ch)
    }

    constructor(title: string = "", grabVertical: boolean = false) {
        super("div");
        this.setTitle(title);
        this.addClassName("panel")
        this.addClassName("panel-default")
        var heading = new controls.WrapComposite("div");
        heading._text = this.title();
        heading.wrapElement = "span";
        heading.addClassName("panel-heading");
        if (!heading._text || !heading._text.trim()) {
            heading._style.minHeight = "40px";

        }
        heading.add(this.toolbar);
        this._style.paddingBottom = "0px"
        this._style.marginBottom = "0px"
        if (grabVertical) {
            this._style.display = "flex";
            this._style.flexDirection = "column";
            this._style.flex = "1 1";
        }
        this.heading = heading;
        super.add(heading)
        this.body.addClassName("panel-body");
        if (grabVertical) {
            this.body._style.display = "flex";
            this.body._style.flexDirection = "column";
            this.body._style.flex = "1 1";
        }
        this._style.minHeight = "200px";
        super.add(this.body);
    }
}


class RefreshOnChange implements IValueListener {
    constructor(private  c: AbstractListControl) {

    }

    valueChanged(e) {
        this.c.dataRefresh(e);

    }
}
export interface  IControlCustomizer {
    customize(c: IControl, i: number, data: any);
}

export class Footer extends Composite {

    needsVerticalScroll() {
        return false;
    }

    constructor(lst: AbstractListControl) {
        super("div");
        this._style.width = "100%";
        this._style.flex = "0 0 auto"
        ///this._style.background="gray";

        this.add(new PagingControl(<Binding>lst._binding));

    }

    innerRender(r: Element) {
        super.innerRender(r)
    }

}
export abstract class AbstractListControl extends BindableControl implements ISelectionProvider {

    contentPrepared: boolean;
    sl: ISelectionListener[] = [];

    private sm: {[name: string]: Status} = {};

    loading: boolean;

    footer: Footer;

    selectionVisible:boolean=true

    collection() {
        return this._binding.collectionBinding();
    }
    setSelectionVisible(s:boolean){
        this.selectionVisible=s;
        this.refresh();
    }
    protected addIcon(v: any, td: Composite, i: number = 0) {
        var icon = tps.service.icon(v, this._binding.collectionBinding().componentType())
        if (i == 0 && icon) {
            td.addHTML(`<img style="margin-right: 4px;max-height: 24px" src="${icon}"></img>`)
        }
    }

    selectionBinding() {
        return this._binding.collectionBinding().selectionBinding();
    }

    updateFromValue(v: any) {
        this.dataRefresh();
    }

    isSelected(v) {
        return this.collection().isSelected(v);
    }

    tag() {
        if (this.loading) {
            return "div";
        }
        return super.tag();
    }

    protected addInstanceLabel(v: any, rs: Composite, t: tps.Type) {
        var rt = tps.service.resolvedType(t);
        var lab = tps.service.label(v, t);
        if (!lab) {
            lab = "";
        }
        if ((<tps.metakeys.Label>rt).htmlLabel) {
            rs.addHTML(lab);
        }
        else {
            var label = rs.addLabel(lab);
        }
        return label;
    }

    visitInner(v: tps.Status) {
        if (v) {
            if (v.inner) {
                v.inner.forEach(x => {
                    if (!x.valid) {
                        if (x.path && x.path.charAt(0) == '[') {
                            this.sm[x.path] = x;
                        }
                        else {
                            this.visitInner(x);
                        }
                    }
                })
            }
        }
    }

    setStatus(v: tps.Status) {
        if (v.valid) {
            if (Object.keys(this.sm).length == 0) {
                return;
            }
        }
        this.sm = {};
        this.visitInner(v);
        this.dataRefresh();
    }

    hasError(num: number) {
        var err = this.sm["[" + num + "]"];
        return err != null && err != undefined;
    }

    canShrinkVertically(): boolean {
        return true;
    }

    canShrinkChildrenVertically() {
        return false;
    }

    customizers: IControlCustomizer[] = [];

    addControlCustomizer(c: IControlCustomizer) {
        this.customizers.push(c);
    }

    removeControlCustomizer(c: IControlCustomizer) {
        this.customizers = this.customizers.filter(x => x != c);
    }

    labelCustomizers: IControlCustomizer[] = [];

    addLabelCustomizer(c: IControlCustomizer) {
        this.labelCustomizers.push(c);
    }

    removeLabelCustomizer(c: IControlCustomizer) {
        this.labelCustomizers = this.customizers.filter(x => x != c);
    }

    addSelectionListener(v: ISelectionListener) {
        this.sl.push(v);
    }

    removeSelectionListener(v: ISelectionListener) {
        this.sl = this.sl.filter(x => x !== v);
    }

    select(v: any) {
        this.setSelection([v]);
    }

    getSelection(): any[] {
        return this._binding.collectionBinding().getSelection();
    }

    setSelectionIndex(n: number) {
        if (this.collection().groupBy()){
            var vl=this.lastContent[n];
            if(vl instanceof tps.HasType){
                var ex=this.collection().expanded(vl);
                if (ex){
                    this.collection().collapse(vl);
                }
                else{
                    this.collection().expand(vl);
                }
                return;
            }
        }
         {
            this.collection().setSelectionIndex(n);
            this.sl.forEach(x => x.selectionChanged(this.getSelection()));
        }
    }

    setSelection(v: any[], refresh = true) {
        this.sl.forEach(x => x.selectionChanged(v));
        this._binding.collectionBinding().setSelection(v);
    }

    private rff = new RefreshOnChange(this)

    onAttach(e: Element) {
        this._binding.addListener(this.rff);
        super.onAttach(e);
    }

    onDetach(e: Element) {
        this._binding.removeListener(this.rff);
        this.contentPrepared = false;
        super.onDetach(e);
    }

    createHeader(): IControl {
        return null;
    }

    createBody(): controls.Composite {
        return null;
    }

    /**
     * inits binding
     * @param ch
     */
    initBinding(ch: HTMLElement): any {
        if (this._binding) {
            this.prepareContent();
        }
    }

    componentType() {
        return this._binding.collectionBinding().componentType();
    }

    public dataRefresh(e?: tps.ChangeEvent) {
        if (this.tryHandleSelection(e)) {
            return;
        }
        this.contentPrepared = false;
        this.prepareContent();
    }

    protected tryHandleSelection(e: tps.ChangeEvent): boolean {
        if (e && e.subKind == "selection") {
            //selection need to be updated;
            if (e.oldValue && e.newValue) {
                var suc=true;
                for (var i = 0; i < e.oldValue.length; i++) {
                    let found=false;
                    for (var j=0;j<this.lastContent.length;j++){
                        if (this.lastContent[j]==e.oldValue[i]){
                            found=true;
                            this.update(j);
                        }
                    }
                    if (!found){
                        suc=false;
                    }
                }
                for (var i = 0; i < e.newValue.length; i++) {
                    let found=false;
                    for (var j=0;j<this.lastContent.length;j++){
                        if (this.lastContent[j]==e.newValue[i]){//
                            found=true;
                            this.update(j);
                        }
                    }
                    if (!found){
                        suc=false;
                    }
                }
                return suc;
            }
        }
        return false;
    }


    createHolder() {
        return new Composite("div")
    }

    tempStyle: any;

    body: Composite
    protected elbnd: Binding = new tps.Binding("");

    private prepareContent() {
        if (this.contentPrepared) {
            return;
        }
        var val = this._binding.get();
        this.elbnd._type = this.collection().componentType();
        this.elbnd.context = this._binding;
        if (this._binding.isLoading() || this._binding.isError() || this._binding.accessControl().needsAuthentification()) {
            this.contentPrepared = true;
            this.loading = true;
            var cc: controls.AbstractComposite = null;

            if (this._binding.accessControl().needsAuthentification()) {

                if (this._binding.isError()) {
                    if (this._binding.errorKind() == "auth") {
                        cc = new controls.Error(this._binding.errorMessage(), () => {
                            auth.doAuth(this._binding, () => {
                                this._binding.clearError();//
                            })
                        }, true, "Sign in")
                    }
                    else {
                        cc = new controls.Error(this._binding.errorMessage(), () => {
                            this._binding.clearError();
                        }, this._binding.canRetry())
                    }
                }
                else {
                    cc = new controls.Error("This view requires authentification", () => {
                        auth.doAuth(this._binding, () => {
                            this._binding.clearError();
                        })
                    }, true, "Sign in")
                }
            }
            else if (this._binding.isError()) {
                cc = new controls.Error(this._binding.errorMessage(), () => {
                    this._binding.clearError();
                }, this._binding.canRetry())
            }
            //
            else {
                cc = new controls.Loading();
            }
            if (!this.tempStyle) {
                this.tempStyle = this._style;
            }
            this._style = <any>{};
            this._style.display = "flex";
            this._style.flexDirection = "column";
            this._style.flex = "1 1 0";
            this._style.margin = "4";//
            this.children = []
            this.add(cc);
            this.refresh();
            return;
        }
        else {
            if (this.loading) {
                this.loading = false;
                if (this.tempStyle) {
                    this._style = this.tempStyle;
                    this.parent.refresh();
                    delete this.tempStyle;
                }
            }
        }
        var ac = this.content();
        this.children = []
        var c = this.createHeader();
        if (c) {
            this.children.push(c);
        }
        var body = this.createBody();
        this.body = body;
        var contentB: controls.Composite = this;
        if (body) {
            this.children.push(body);
            contentB = body;
        }
        this.fillBody(ac, contentB);
        this.contentPrepared = true;
        if (ac.length == 0) {
            this.children = []
            var comp = this.createNothingContent();
            this.add(comp)
        }
        else if (this.needPaging()) {
            this.footer = new Footer(this);
            this.add(this.footer);
        }
        this.refresh();
    }

    protected content() {
        return this.collection().workingCopy();
    }



    protected createNothingContent() {
        var comp = new controls.Composite("div");
        comp._style.flex="1 1 0"
        comp._style.padding = "10px";
        comp.addLabel("Nothing here yet");
        return comp;
    }

    needPaging() {
        return (<tps.metakeys.WebCollection>this._binding.type()).paging
    }

    protected indexToControl: controls.IControl[] = [];
    protected lastContent: any[]

    protected fillBody(ac: any[], contentB: controls.Composite) {
        var i = 0;
        this.indexToControl = [];
        this.lastContent = ac;

        ac.forEach(x => {
            this.elbnd.value = x;
            var cc = this.toControl(x, i);

            this.customizers.forEach(c => c.customize(cc, i, x))
            i++;
            contentB.children.push(cc);
            this.indexToControl.push(cc);
        })
    }

    update(index: number) {
        if (!this.indexToControl) {
            return;
        }
        if (index >= 0 && index < this.indexToControl.length) {
            var ca: controls.AbstractComposite = <any>this.indexToControl[index];
            var el = ca.element();

            var data = this.lastContent[index];
            var newControl: controls.AbstractComposite = <any>this.toControl(data, index);
            this.customizers.forEach(c => c.customize(newControl, index, data))
            this.indexToControl[index] = newControl;
            newControl.parent = this;
            var shadow = document.createElement("div");
            newControl.render(shadow);
            if (el.parentElement) {
                el.parentElement.replaceChild(shadow.children[0], el);
            }
        }
        else {
            console.log("Error:calling update on not existing index");
        }
    }

    abstract toControl(v: any, position: number): controls.IControl;
}
import uif=require("./uifactory")
import moment = require("moment");


export abstract class BasicListControl extends AbstractListControl {

    layoutToControl(c: controls.Composite, l: tps.decorators.LayoutElement, num: number) {
        if (l.type == "part") {
            if (l.image) {
                c.addHTML(`<img style="margin-right: 4px;max-height: 24px" src="${l.image}"></img>`)
            }

            if (l.text) {
                if (l.html) {
                    c.addHTML(l.text);
                }
                else {
                    c.addLabel(l.text);
                }
            }
            if (l.align) {
                c._style.cssFloat = l.align;
            }
            if (l.class) {
                c._className = l.class;
            }
            else if (l.role) {
                c._className = l.role;
            }
            if ((<any>l).action){
                c.onClick=x=>{
                    var obj=this.collection().workingCopy()[num];
                    const bnds=new Binding("");
                    bnds.value=obj;//
                    bnds._type=this.collection().componentType();
                    bnds.context=this._binding
                    tps.calcExpression((<any>l).action,bnds,false);

                }
                //c._className="btn"
            }

            if (l.background) {
                c._style.background = l.background;
                if (!l.color) {

                    {
                        var q = l.background;
                        if (q.charAt(0) == "#") {
                            q = q.substring(1, 7);
                        } //remove the #

                        var R = parseInt(q.substring(0, 2), 16)
                        var G = parseInt(q.substring(2, 4), 16)
                        var B = parseInt(q.substring(4, 6), 16)
                        var black = 0.2126 * R / 255.0 + 0.7152 * G / 255.0 + 0.0722 * B / 255.0 > 0.5
                        if (black) {
                            c._style.color = "black"
                        }
                        else {
                            c._style.color = "white"
                        }
                    }

                }
            }
            if (l.color) {
                c._style.color = l.color;
            }
            //if ()
        }
        else {
            if (l.kind == "vc") {

                l.parts.forEach(x => {
                    var mm = new Composite("div");
                    //mm._style.display="block"
                    this.layoutToControl(mm, x, num);
                    c.add(mm);
                })
            }
            else {
                l.parts.forEach((x, i) => {
                    var mm = new Composite("span");
                    mm._style.marginRight = "5px";
                    this.layoutToControl(mm, x, num);
                    c.add(mm);
                })
            }
        }
    }
    constructor() {
        super("div")
        this.addClassName("list-group");
        this._style.display = "flex";
        this._style.margin = "0px";
        this._style.flexDirection = "column"
        this._style.overflowX = "hidden";
        this._style.flex = "1 1 0";
    }
    protected appendGroupBy(position:number, rs: Composite, v: any, sel: boolean) {
        if (this.collection().groupBy() || this.collection().tree()) {
            var ll = this.collection().levels()[position];
            if (ll) {
                rs._style.paddingLeft = (30 * ll) + "px";
            }
            var chld = this.collection().children(v);
            var expanded = this.collection().expanded(v);
            if (chld.length > 0) {
                var c: controls.Composite = null;
                if (!expanded) {
                    c = rs.addHTML("<span class='glyphicon glyphicon-chevron-right' style='margin-right: 5px'></span>")
                    if (this.collection().tree()) {
                        c.onClick = (c) => this.collection().expand(v)

                    }
                }
                else {
                    c = rs.addHTML("<span class='glyphicon glyphicon-chevron-down' style='margin-right: 5px'></span>")
                    if (this.collection().tree()) {
                        c.onClick = (c) => this.collection().collapse(v)//
                    }
                }

            }
            if (!sel && this.collection().groupBy() && chld.length > 0) {
                rs._classNames.push("groupNode");
            }
        }
    }

    createBody(): controls.Composite {
        var bd = new Composite("div");
        bd._style.overflowY = "auto"
        bd.addClassName("table");
        bd.addClassName("table-striped");
        bd._style.flex = "1 1 auto";
        bd._style.margin = "0";
        return bd;
    }


    public dataRefresh(e: tps.ChangeEvent) {
        if (this.tryHandleSelection(e)) {
            return;
        }
        this.contentPrepared = false;
        var vc = this._binding.collectionBinding().workingCopy();
        if (this.children.indexOf(this.body) == -1 || vc.length == 0 || this._binding.isError() || this._binding.accessControl().needsAuthentification()) {
            super.dataRefresh();
        }
        else if (this.body) {
            this.body.children = [];
            this.fillBody(vc, this.body);
            this.contentPrepared = true;
            this.body.refresh()
            if (this.footer) {
                this.footer.refresh();
            }
        }
    }
}


export class SimpleListControl extends BasicListControl {



    toControl(v: any, position): controls.IControl {
        this.elbnd.value = v;

        var rs = new Composite("li")
        rs.addClassName("list-group-item")
        rs.addClassName("noRoundBorder")
        var sel=this.isSelected(v)&&this.selectionVisible;
        this.appendGroupBy(position, rs, v, sel);
        if (position == 0) {
            rs._style.borderTopWidth = "0px";
        }
        rs._style.cursor = "pointer";
        if (sel) {
            rs.addClassName("active");
        }
        var layout = tps.decorators.calculateLayout(this.elbnd);
        if (layout) {
            var mm=rs;
            if ((<any>layout).background){
                mm=new Composite("span");
                rs.add(mm);
            }
            this.layoutToControl(mm, layout, 0);
        }
        else {
            //console.log(JSON.stringify(layout));
            this.addIcon(v, rs);
            var label = this.addInstanceLabel(v, rs, this._binding.collectionBinding().componentType());
            if (this.hasError(position)) {
                rs.addHTML(ERROR);
            }
            this.labelCustomizers.forEach(x => x.customize(label, position, v));
        }
        rs.onClick = () => {
            this.setSelectionIndex(position);
        }
        return rs;
    }
}

export class FullRenderList extends BasicListControl {


    constructor() {
        super();
        this._style.flex="0 0 auto";

    }
    createNothingContent(){
        return new Composite("span");
    }

    toControl(v: any, position): controls.IControl {
        var bnd=new tps.Binding("item");
        bnd.value=v;
        if (!this._binding.accessControl().canEditItem(v)){
            bnd.readonly=true;//
            bnd.immutable=true;

        }
        bnd._type=this.elbnd.type();
        var cntrl=uifactory.service.createControl(bnd,this.getRenderingOptions());
        return cntrl;
    }
}

export class ButtonMultiSelectControl extends AbstractListControl {

    protected createNothingContent() {
        var comp = new controls.Composite("div");
        return comp;
    }

    constructor() {
        super("div")
        this._style.paddingLeft = "5px";
        this._style.paddingRight = "5px";
        //this.addClassName("list-group");
    }

    updateFromValue() {
        this._binding.refresh();
    }

    dataRefresh() {
        this.contentPrepared = false;
        this.refresh();
    }

    _single: boolean = false;

    setSingle(single: boolean) {
        this._single = single;
    }
    protected content() {
        var cnt= this.collection().workingCopy();
        if (cnt.length==0){
            return this.collection().getSelection();
        }
        return cnt;
    }
    needLabel() {
        if (this.parent) {
            if (this.parent.rendersLabel(this)) {
                return false;
            }
        }
        return true;
    }

    initBinding(c: HTMLElement) {
        if (!this.title()) {
            this.setTitle(tps.service.caption(this._binding.type()));
        }
        super.initBinding(c)
    }

    renderContent(ch: HTMLElement) {
        if (this.needLabel()) {
            ch.innerHTML = "<span>" + this.title() + ":</span>";
        }
        super.renderContent(ch);
    }

    toControl(v: any): controls.IControl {
        var lab = tps.service.label(v, this._binding.collectionBinding().componentType());
        var rs = new Button(lab);
        rs._classNames = ["btn", "btn-xs", "btn-primary"]
        rs._style.margin = "3px";
        rs._style.cursor = "pointer";
        var icon=tps.service.icon(v,this._binding.collectionBinding().componentType());
        if (icon){
            rs.addHTML(`<img src="${icon}" width="16px" style="margin-left: 3px;margin-right: 3px;margin-top:2px;float: left">`)
        }
        if (true) {
            rs.onClick = () => {
                if (!this._binding.collectionBinding().selectionBinding().accessControl().canEditSelf()){
                    return;
                }
                if (!this.isSelected(v)) {
                    rs.removeClassName("btn-primary")
                    rs.addClassName("btn-success");

                    var mm = [v].concat(this.getSelection());
                    if (this._single) {
                        mm = [v];
                    }
                    this.setSelection(mm);
                }
                else {
                    if (this._single) {
                        this.setSelection([]);
                        return;
                    }
                    rs.addClassName("btn-primary")
                    rs.removeClassName("btn-success");
                    var mm = [].concat(this.getSelection());
                    mm = mm.filter(x => !tps.service.isSame(x, v, this.componentType()));
                    this.setSelection(mm);
                }
            }
        }
        if (this.isSelected(v)) {
            rs.addClassName("btn-success");
        }
        else {
            rs.addClassName("btn-primary");
        }

        return rs;
    }
}
declare var require: any

var h: any = require("javascript-detect-element-resize")
declare function addResizeListener(e: Element, v: () => void);
export class TableControl extends BasicListControl {


    private sizes: {[name: string]: number};


    refresh() {
        super.refresh();
        if (this.attached) {
            this.resizeHeaders();
        }
    }

    public dataRefresh(e: tps.ChangeEvent) {
        super.dataRefresh(e);
        this.resizeHeaders();
    }

    estimateSizes(v: any[]) {
        var ps = this.columnProps();
        var mmm: {[name: string]: number} = {};
        ps.forEach(x => {
            if (!x) {
                return
            }
            var val = mmm[x.id];
            if (!val) {
                val = 0;
            }
            if (x.displayName.length > val) {
                val = x.displayName.length;
            }
            v.forEach(y => {
                var lab = tps.service.label(tps.service.getValue(x.type, y, x.id), x.type);
                if (!lab) {
                    lab = "";
                }
                let sz = lab.length;
                var rt = tps.service.resolvedType(x.type);
                if ((<tps.metakeys.Label>rt).cellSize) {
                    sz = (<tps.metakeys.Label>rt).cellSize;
                }
                if (sz > val) {
                    val = sz;
                }
            })
            mmm[x.id] = val;
        })
        return mmm;
    }

    header: Composite;

    createHeader(): controls.Composite {
        var header = new Composite("div");
        var vc = this._binding.collectionBinding().workingCopy();
        this.sizes = this.estimateSizes(vc);
        header._style.fontWeight = "bold"
        header.addClassName("list-group-item")
        header._style.display = "flex";
        header.addClassName("noRoundBorder");
        header._style.flexDirection = "row";
        header._style.borderTopWidth = "0px";
        header._style.borderBottomWidth = "1px";
        header._style.borderBottomStyle = "solid";
        header._style.flex = "0 0 auto";

        var ps = this.columnProps();
        ps.forEach(x => {
            var th = new Composite("div");
            th.addLabel(x.displayName);
            th._style.flex = this.calcFlex(x);
            th._style.borderBottomWidth = "0px";
            header.add(th)
        })
        this.header = header;
        return header;
    }

    private calcFlex(x) {
        return this.sizes[x.id] + " " + this.sizes[x.id] + " 50px";
    }

    attached: boolean

    onAttach(e: Element) {
        this.attached = true;
        super.onAttach(e);
        if (e.parentElement && e.parentElement.parentElement) {
            addResizeListener(e.parentElement.parentElement, () => {
                this.resizeHeaders();
            })
        }
        else {
            if (e.parentElement) {
                addResizeListener(e.parentElement, () => {
                    this.resizeHeaders();
                })
            }
        }
        this.resizeHeaders();
    }

    lastWidth = -1;

    scheduled = false;

    private resizeHeaders() {
        if (this.scheduled) {
            return;
        }
        var v = this;
        this.scheduled = true;
        setTimeout(function () {
            v.scheduled = false;
            v.innerRefreshHeaders();
        }, 50)
    }

    private innerRefreshHeaders() {
        if (this.body) {
            if (this.body.children.length > 0) {
                var mm = <Composite>this.body.children[0]
                if (mm) {
                    var el = document.getElementById(mm.id());
                    if (el) {
                        var ww = el.clientWidth - 10;//
                        if (this.lastWidth == ww) {
                            return;
                        }
                        this.lastWidth = ww;
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
        var ps: tps.Property[] = [];
        let columns = (<tps.metakeys.DefaultColumns>this._binding.type()).columns;
        if (columns) {
            ps = []
            columns.forEach(x => {
                var pr = tps.service.property(this._binding.collectionBinding().componentType(), x);
                if (!pr) {
                    return;
                }
                ps.push(pr);
            })
        }
        else {
            var ps = tps.service.visibleProperties(this._binding.collectionBinding().componentType())
            var groups = tps.service.propertyGroups(this._binding.collectionBinding().componentType());
            if (groups.length > 0 && groups[0]) {
                ps = groups[0].properties.filter(x => {
                    var c = <tps.FullTypeOptions>x.type;
                    if (c.visibleWhen || c.hiddenWhen) {
                        return false;
                    }
                    return true;
                });
            }
        }
        return ps;
    }

    toControl(v: any, position: number): controls.IControl {

        var lab = tps.service.label(v, this._binding.type());
        var rs = new Composite("li")
        rs._style.display = "flex";
        rs._style.flexDirection = "row";
        var ps = this.columnProps();
        var sel=this.isSelected(v)&&this.selectionVisible;
        rs.addClassName("noRoundBorder");
        rs.addClassName("list-group-item")

        if (sel) {
            rs.addClassName("active")//
        }

        ps.forEach((p, i) => {
            var td = new Composite("div");
            td._style.display = "inline"
            td._style.flex = this.calcFlex(p);
            td.addClassName("col")
            var has=false;
            if (this.collection().groupBy() || this.collection().tree()){
                if (this.collection().children(v).length>0) {
                    if (i==0) {
                        this.appendGroupBy(position, rs, v, sel);
                        has=true;
                        var layout = tps.decorators.calculateLayout(this.elbnd);
                        if (layout) {
                            var mm = td;
                            if ((<any>layout).background) {
                                mm = new Composite("span");
                                rs.add(mm);
                            }
                            this.layoutToControl(mm, layout, 0);
                        }
                    }
                    if (i!=0){

                        return;
                    }
                    //return rs;
                }
            }
            if (!has) {
                this.addIcon(v, td, i);
                this.addInstanceLabel(tps.service.getValue(p.type, v, p.id), td, p.type)
            }
            if (i == 0) {

                if (this.hasError(position)) {
                    td.addHTML(ERROR);
                }
            }
            rs.add(td);
        });
        rs._style.cursor = "pointer";
        rs.onClick = () => {
            this.setSelectionIndex(position);
        }
        return rs;
    }


}
export class PopoverSelect extends BindableControl{

    constructor(private b:tps.IBinding,icon?:string,btnStyle:string="btn-success",private select=true,showTitle=true,private extra?:IControl){
        super("div");
        this._binding=b;
        //this._style.marginTop="3px";
        this._style.marginRight="3px";
        var title=tps.service.caption(b.type());
        var dialogTitle=title;
        if (!showTitle){
            title="";
        }
        var description=b.type().description;
        if (!description){
            description="";
        }
        var cl=b.get();
        if (!cl){
            cl=b.type().default;
        }
        var caption=tps.service.label(cl,b.type());

        this.addHTML(`<div class="btn-group" id="${this.id()+"container"}">
${select?`<button  type="button"  style="cursor: hand;" class="btn btn-xs ${btnStyle}">${icon?`<span style="position: relative;top:2px;margin-right: 2px" class="glyphicon ${icon}"></span>`:""}${title}:</button>`:""}
<button href="#" id="${this.id()+"p"}"  type="button" class="btn btn-xs ${!select?btnStyle:"btn-default dropdown-toggle"} 
aria-haspopup="true" aria-expanded="false" data-trigger="manual"

title="${dialogTitle}"  data-content="${description}"><span id="${this.id()+'lc'}" >${showTitle?caption:""}</span>${select?`<span class="caret"></span>`:`<span class="glyphicon ${icon}"></span>${showTitle?title:""}`}</button>
</div>`);
    }
    onAttach(e:HTMLElement){
        var v=this.id()+'content';
        var binding=this.b;
        var id=this.id();
        var visible=false;
        if (this.extra){
            this.extra.render(document.getElementById(this.id()+"container"))
        }
        document.getElementById(id+'p').onclick=(x)=>{
            if (!visible) {
                (<any>$("#" + id + 'p')).popover("show");//
                visible=true;
            }
            else{
                (<any>$("#" + id + 'p')).popover("hide");//
                visible=false;
            }
            x.stopPropagation()
        }
        var options=this.getRenderingOptions();
        (<any>$("#"+this.id()+'p')).popover({placement:"auto bottom",animation: false,template:`<div class="popover" role="tooltip">
<div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content" style="min-width: 200px" id="${v}"></div></div>`})
        $("#"+this.id()).on('shown.bs.popover', function (e) {
            var content=document.getElementById(v);
            var cm=new Composite("span");
            cm._rendersLabel=true;
            let opt=ro.clone(options);
            opt.maxValuesForRadio=15
            cm.add( uifactory.service.createControl(binding,opt));
            cm.render(content);
            document.onmouseup=(x)=>{
                var e=x.srcElement;
                var found=false;
                while (e){
                    if (e==content){
                        found=true;
                    }
                    if (e.id==id+'p'){
                        found=true;
                    }
                    e=e.parentElement;

                }
                if (!found){
                    (<any>$("#"+id+'p')).popover("hide");
                    visible=false;
                    //x.stopPropagation();
                }
            }
            //content.innerHTML=content.innerHTML+"<a style='background: rebeccapurple;height: 300px' > HEllo world</a>"
        })
        super.onAttach(e);
    }

    updateFromValue(){
        if (!this.select){
            return;
        }
        var el=document.getElementById(this.id()+'lc');
        if (el){
            var cl=this.b.get();
            if (!cl){
                cl=this.b.type().default;
            }
            var original=(<tps.Binding>this.b).fromReferenceToOriginal(cl);
            var tp=this.b.type();
            if (original){
                cl=original;
                var rt=(<tps.Binding>this.b).referencedType();
                if (rt){
                    tp=rt;
                }
            }
            var caption=tps.service.label(cl,tp);
            el.innerText=caption;
            var icon=tps.service.icon(cl,tp);
            if (icon){
                el.innerHTML=el.innerHTML+(`<img src="${icon}" width="16px" style="margin-left: -3px;margin-right: 3px;margin-top:2px;float: left">`)
            }
            //(<any>$("#"+this.id()+'p')).popover("hide");
        }
    }
    initBinding(){

    }

}

export class CheckBox extends BindableControl {

    constructor(caption: string = "") {
        super("div")
        this.setTitle(caption)
        this.addClassName("checkbox")
        this.addClassName("checkbox-inline")
        this._style.paddingLeft = "5px";
        this._style.paddingRight = "2px";
        this._style.margin = "0px";
    }

    updateFromValue(v) {
        if (this.input) {
            this.input.checked = ("" + v) == "true"
        }
    }

    innerSetDisabled(v: boolean) {
        super.innerSetDisabled(v);
        if (v) {
            (<HTMLElement>this._element).style.opacity = "0.4"
        }
        else {
            (<HTMLElement>this._element).style.opacity = "";
        }
    }

    input: HTMLInputElement;

    protected initBinding(ch: HTMLElement): any {
        var lab = document.createElement("label")
        var input = document.createElement("input");
        this.input = input;
        input.type = "checkbox";

        input.onchange = (e) => {
            this._binding.set(input.checked);
        }
        if (this._binding) {
            input.checked = ("" + this._binding.get()) == "true"
        }
        lab.appendChild(input);
        lab.appendChild(document.createTextNode(this.title()))
        ch.appendChild(lab)
    }
}
export class BindedReadonly extends BindableControl{
    initBinding() {
        if (this._binding) {
            this.setTitle(tps.service.caption(this._binding.type()));
        }
    }

    updateFromValue() {
        this.refresh();
    }

    protected updateVisibility() {
        super.updateVisibility()
    }

    needLabel() {
        if (this.parent) {
            if (this.parent.rendersLabel(this)) {
                return false;
            }
        }
        return true;
    }

    canShrinkVertically() {
        return false;
    }

    needsVerticalScroll() {
        return false;
    }
}
export class BindedLink extends BindedReadonly {


    renderContent(c: HTMLElement) {
        super.renderContent(c);
        if (this._binding) {
            var vl = this._binding.get();
            var cnt = tps.service.label(vl, this._binding.type());

            // if (this.needLabel()) {
            //     cnt = "<span class='fieldCaption' style='display: inline'>" + this.title() + ":</span><span class='fieldValue' style='margin-left: 5px'>" + cnt + "</span>";
            // }
            if (vl) {
                var uheader="https://www.youtube.com/watch?v=";
                var uheader1="http://www.youtube.com/watch?v=";
                var alternative="https://youtu.be/"
                if ((""+vl).startsWith(uheader)){
                    c.innerHTML=`<iframe width="300" height="200" src="https://www.youtube.com/embed/${(""+vl).substring(uheader.length)}" frameborder="0" allowfullscreen></iframe>`
                }
                else if ((""+vl).startsWith(uheader1)){
                    c.innerHTML=`<iframe width="300" height="200" src="https://www.youtube.com/embed/${(""+vl).substring(uheader1.length)}" frameborder="0" allowfullscreen></iframe>`
                }
                else if ((""+vl).startsWith(alternative)){
                    c.innerHTML=`<iframe width="300" height="200" src="https://www.youtube.com/embed/${(""+vl).substring(alternative.length)}" frameborder="0" allowfullscreen></iframe>`
                }
                else {//
                    c.innerHTML = `<a style="padding: 4px" href="${vl}">${this.title()}</a>`;
                }
            }
        }
    }
}

export class BindedImage extends BindedReadonly {

    constructor(){
        super("span")
    }
    height: number=150;


    renderContent(c: HTMLElement) {
        super.renderContent(c);
        if (this._binding) {
            var vl = this._binding.get();
            var cnt = tps.service.label(vl, this._binding.type());

            if (this.needLabel()) {
                cnt = "<span class='fieldCaption' style='display: inline'>" + this.title() + ":</span><span class='fieldValue' style='margin-left: 5px'>" + cnt + "</span>";
            } //
            if (vl) {
                c.innerHTML = `<img height="${this.height}" src="${vl}"></img>`;
            }
        }
    }
}
export class BindedIcon extends BindedImage{
    constructor(){
        super();
        this.height=24;
    }
}
export class Thumbnail extends BindedImage{
    constructor(){
        super();
        this.height=64;
    }
}
export class BindedFrame extends BindedReadonly {

    constructor(){
        super("span")
    }
    renderContent(c: HTMLElement) {
        super.renderContent(c);
        if (this._binding) {
            var vl = this._binding.get();
            var cnt = tps.service.label(vl, this._binding.type());

            if (this.needLabel()) {
                cnt = "<span class='fieldCaption' style='display: inline'>" + this.title() + ":</span><span class='fieldValue' style='margin-left: 5px'>" + cnt + "</span>";
            } //
            if (vl) {
                c.innerHTML = `<iframe width="100%" src="${vl}"></iframe>`;
            }
        }
    }
}
export class BindedCode extends BindedReadonly {

    constructor(){
        super("pre")
    }
    renderContent(c: HTMLElement) {
        super.renderContent(c);
        if (this._binding) {
            var vl = this._binding.get();
            if (!vl){
                vl=""
            }
            var language=(<any>this._binding.type()).language;
            if (language){
                if (this._binding.parent()){
                    var val=this._binding.parent().lookupVar(language);
                    if (val&&val[language]){
                        language=val[language];
                    }
                }
            }
            else language="javascript"
            c.innerHTML="<code class='"+language+"'>"+controls.escapeHtml(vl)+"</code>";
            setTimeout(function () {
                if ((<any>window).hljs) {
                    (<any>window).hljs.highlightBlock(c)
                }
            },100)
        }
    }
}


export class BindedLabel extends BindedReadonly {

    onAttach(x){
        super.onAttach(x);
    }


    renderContent(c: HTMLElement) {
        super.renderContent(c);
        if (this._binding) {
            var vl = this._binding.get();

            var cnt = tps.service.label(vl, this._binding.type());

            if (!(<tps.metakeys.Label>this._binding.type()).htmlLabel&&!tps.service.isSubtypeOf(this._binding.type(),tps.TYPE_HTML)) {
                cnt = controls.escapeHtml(cnt);
            }
            if (this._binding.parent()){
                var label=(<tps.metakeys.Label>this._binding.parent().type()).label;
                var id=this._binding.id();
                if (label==id||(!label&&(id=="name"||id=="title"||id=="label"))){
                    var options=this.getRenderingOptions();
                    if (options.level<=3) {
                        cnt = "<h3>" + cnt + "</h3>"
                        c.innerHTML = cnt;
                        return;
                    }
                    if (options.level<=6){
                        cnt = "<h5>" + cnt + "</h5>"
                        c.innerHTML = cnt;
                        return;
                    }

                }
            }
            if (this.needLabel()) {
                cnt = "<span class='fieldCaption' style='display: inline'>" + this.title() + ":</span><span class='fieldValue' style='margin-left: 5px'>" + cnt + "</span>";
            }

            c.innerHTML = `<span style="padding: 4px">${cnt}</span>`;
        }
    }
}
export class BindedHeader extends BindedReadonly{

    constructor(level=3){
        super("h"+level)
    }
    renderContent(c: HTMLElement) {
        super.renderContent(c);
        if (this._binding) {
            var vl = this._binding.get();

            var cnt = tps.service.label(vl, this._binding.type());
            if (!(<tps.metakeys.Label>this._binding.type()).htmlLabel&&!tps.service.isSubtypeOf(this._binding.type(),tps.TYPE_HTML)) {
                cnt = controls.escapeHtml(cnt);
            }
            c.innerHTML = `<span style="padding: 4px">${cnt}</span>`;
        }
    }
}
export class AlignedContainer extends Composite{

    fl:HorizontalFlex=new HorizontalFlex();

    constructor(right:boolean=true){
        super("div")
        if (right){
            this.fl._style.cssFloat="right";
        }
        else{
            this.fl._style.cssFloat="left";
        }
        this.children.push(this.fl);
        this.fl.parent=this;
    }
    add(c:IControl){
        this.fl.add(c);
    }
    remove(c:IControl){
        this.fl.remove(c);
    }

}
export class BindedButton extends BindedReadonly{
    constructor(){
        super("button")
        this.addClassName("btn");
        this.addClassName("btn-default")
        this._style.margin="5px";

    }
    renderContent(c: HTMLElement) {
        super.renderContent(c);
        if (this._binding) {
            c.innerText=tps.service.caption(this._binding.type());
            c.onclick=(x)=>{
                var exp=(<any>this._binding.type()).body;
                tps.calcExpression(exp,this._binding,false);
                this._binding.root().refresh();
                //console.log("Clicked");
            }
        }
    }
}
export class Interpolator extends BindedReadonly{

    label: string
    constructor(level=3){
        super("span")
    }
    renderContent(c: HTMLElement) {
        super.renderContent(c);
        if (this._binding) {
            var vl = this._binding.get();

            var cnt = tps.ts.interpolate(this.label,vl, this._binding.type());
            if (!(<tps.metakeys.Label>this._binding.type()).htmlLabel&&!tps.service.isSubtypeOf(this._binding.type(),tps.TYPE_HTML)) {
                cnt = controls.escapeHtml(cnt);
            }
            c.innerHTML = `<span style="padding: 4px">${cnt}</span>`;
        }
    }
}