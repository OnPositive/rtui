import controls=require("./controls");
import tps=require("raml-type-bindings")
import forms=require("./forms")
import controlPanel=require("./controlPanel")
import actions=require("./actions")
import IBinding=tps.IBinding
import ro=require("./renderingOptions")
import IPropertyGroup=tps.ts.IPropertyGroup;
import {RadioSelect, StatusRender} from "./forms";
import {Binding} from "raml-type-bindings";
import {Label, Composite} from "./controls";

declare const marked: any

export interface RenderingContext extends ro.RenderingOptions {


}

interface IControlFactory {
    createControl?(b: IBinding, r?: RenderingContext);
}

const BooleanControlFactory: IControlFactory = {

    createControl(b: IBinding, r?: RenderingContext){
        var rs = new forms.CheckBox(b.type().displayName);
        rs._binding = b
        if (b.type().description) {
            var h = new forms.Help(b.type().description);
            h._style.paddingRight = "10px"
            h._style.marginTop = "2px"
            var s = new controls.Composite("span");
            s.add(rs);
            s.add(h);
            return s;
        }
        return rs;
    }
}

const UnionControlFactory: IControlFactory = {

    createControl(b: IBinding, r?: RenderingContext){
        var u: tps.UnionType = <any>b.type();
        var allScalar = true;
        var allObject = true;
        var allArray = true;
        var allMap = true;
        u.options.forEach(x => {
            allScalar = x && tps.service.isScalar(tps.service.resolvedType(x));
        });
        if (allScalar) {
            return StringControlFactory.createControl(b);
        }
        var s = new controls.Composite("span");
        s.addLabel("Can not represent type: " + u.displayName);
        return s;
    }
}
tps.declareMeta(tps.TYPE_UNION, UnionControlFactory);
tps.declareMeta(tps.TYPE_BOOLEAN, BooleanControlFactory);
declare var $: any
const StringControlFactory: IControlFactory = {
    createControl(b: IBinding, rc?: RenderingContext){
        if ((<tps.metakeys.Reference>b.type()).reference) {
            return referenceControl(b);
        }
        if (!b.accessControl().canEditSelf()) {
            var bl = new forms.BindedLabel("div");
            bl._binding = b;
            return bl;
        }
        var r = new forms.InputGroup();
        var nAddon = new forms.InputGroupAddOn();
        if (rc.kind != "filter") {
            r._style.width = "100%";
        }
        else {
            //r._style.maxWidth = "300px";
            r._style.padding = "0px"
            r._style.marginRight = "3px"//
        }
        r.add(nAddon)

        nAddon._style.textAlign = "left"
        var ll = new controls.Composite("span");
        var gtitle = b.type().displayName + (b.type().required ? "* " : " ");
        ll.addLabel(gtitle);
        if (b.type().description) {
            ll.add(new forms.Help(b.type().description))
        }
        ll._style.cssFloat = "left";
        nAddon.add(ll);
        var mm: tps.FullTypeOptions = <any>b.type();
        if ((mm.enum || mm.enumValues)) {
            if (mm.enum) {
                if (mm.enum.length < 6 && rc.kind != "filter") {
                    var res = new RadioSelect()
                    res._binding = b;
                    return res;
                }
            }
            var select = new forms.Select();
            select._binding = b;
            r.add(select);
        }
        else {
            var w: forms.TextArea|forms.Input = new forms.Input();

            if ((<tps.StringType>b.type()).multiline) {
                w = new forms.TextArea();
                w._style.minHeight = "200px";
                w._style.borderRadius = "0px";
                if (rc.tabsTop) {
                    w._style.borderTopWidth = "0px";
                    return w;
                }
                w._style.borderWidth = "0px";
                w._style.height = "100%"
                w._style.flex = "1 1 auto"
                w._binding = b;
                var vm = new controls.Composite("div");
                var s = new forms.Section(b.type().displayName, true)
                if (!rc.noMargin) {
                    s._style.margin = "5px";
                }
                s.body._style.padding = "0px";
                s.add(w);

                return s;
            }


            w._binding = b;
            r.add(w);
        }

        return r;
    }
}

const ArrayControlFactory: IControlFactory = {
    createControl(b: IBinding, rc?: RenderingContext){
        var r = new forms.Section(b.type().displayName, true);

        var params = (<tps.Operation>b.type()).parameters;
        var menuOnlyItems=[]
        if (b instanceof tps.ViewBinding) {
            var ps = b.parameterBindings();
            if (ps.length > 0) {
                var hs = new controlPanel.CollectionControlPanel(b);
                if (hs.visibleParameters().length>0) {
                    r.heading._style.padding = "5px"
                    hs._style.cssFloat = "right"
                    r.heading.add(hs);//
                }
                //r.toolbar._style.marginTop = "3px";//
            }
        }
        if (tps.service.isMultiSelect(b.type())) {
            if (!b.accessControl().canEditSelf()) {
                var bm = new forms.ButtonMultiSelectControl();
                bm._binding = b;

                //tps.unidirectional(b,bl);
                return bm;
            }
            var bm = new forms.ButtonMultiSelectControl();
            var ct = tps.service.componentType(b.type());

            var ll = tps.enumOptionsBinding(b.type(), b);
            if (ll) {
                var cl: Binding;
                if (ll) {
                    cl = ll.collection;
                }
                else {
                    var cl = new tps.Binding("");
                    cl.value = forms.enumOptions(ct, b);
                    cl._type = b.type();
                }
                bm._binding = cl;
                tps.bidirectional(b, cl, ll.transformer, ll.btrasform);//
                var cmm = new controls.Composite("span")
                cmm.setTitle(tps.service.caption(b.type()));
                bm.setTitle(tps.service.caption(b.type()));
                cmm.add(bm)
                return cmm;
            }
        }
        r.setDescription(b.type().description)
        var lst: forms.AbstractListControl = new forms.SimpleListControl();
        var props = tps.service.visibleProperties(b.collectionBinding().componentType());
        var repre = <any>b.type();
        var representation = repre.representation;
        if (props.length > 1) {
            var repre = <any>b.type();
            if (representation != "list" && representation != "list-only") {
                var tb = new forms.TableControl();

                tb._binding = b;
                //this is ids;
                lst = tb;
            }
        }
        lst._binding = b;
        var items = [];
        if (b.accessControl().supportsAdd()) {
            if (b.addOperation()) {
                items.push(new actions.CreateWithConstructorAction(b, b.addOperation()));
            }
            else {
                items.push(new actions.CreateAction(b));
            }
        }
        if (b.accessControl().supportsUpdate()) {
            items.push(new actions.EditAction(b));
        }
        if (b.accessControl().supportsRemove()) {
            items.push(new actions.DeleteAction(b));
        }
        r.toolbar.items = items;
        var dr = new forms.DropDown();
        dr.items = items.concat(menuOnlyItems);
        dr.addTo(lst);
        let v = (v: boolean) => {
            r.setVisible(v)
        };
        if (representation != "list-only" && representation != "table-only" && props.length > 1 && (rc.maxMasterDetailsLevel > 0)) {

            var md = new forms.MasterDetails(lst);
            r.body._style.padding = "0px";//
            r.body._style.paddingRight = "3px";//
            r.add(md)
            md.onVisibilityChanged = v;
        }
        else {
            r.add(lst);
            lst.onVisibilityChanged = v;
        }

        return r;
    }
}

tps.declareMeta(tps.TYPE_SCALAR, StringControlFactory);
tps.declareMeta(tps.TYPE_ARRAY, ArrayControlFactory);
tps.declareMeta(tps.TYPE_MAP, ArrayControlFactory);

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

function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
    });
}
tps.declareMeta(tps.TYPE_MARKDOWN, <tps.metakeys.Label>{

    label(v: string){
        if (!v) {
            return "";
        }
        return marked(v);
    },

    htmlLabel: true
})
tps.declareMeta(tps.TYPE_BOOLEAN, <tps.metakeys.Label>{

    cellSize: 1,

    label(v: string){
        if (!v) {
            return "<span class='glyphicon glyphicon-unchecked'></span>"
        }
        return "<span class='glyphicon glyphicon-chevron-down'></span>"

    },

    htmlLabel: true
})
function referenceControl(b: IBinding) {
    if (!b.accessControl().canEditSelf()) {
        var bm = new forms.ButtonMultiSelectControl();
        var bl = new Binding("val");
        bl._type = tps.array(b.type());
        bl._type.displayName = tps.service.caption(b.type());
        bm._binding = bl;
        tps.unidirectional(b, bl);
        return bm;
    }
    var bm = new forms.ButtonMultiSelectControl();
    var ct = tps.service.componentType(b.type());
    bm.setSingle(true)
    var ll = tps.enumOptionsBinding(b.type(), b);
    var cl: Binding;
    if (ll) {
        cl = ll.collection;
    }
    if (!ll) {
        var rs = new Composite("span");
        rs.addLabel("Can not bind reference")
        return rs;
    }
    bm._binding = cl;
    tps.bidirectional(b, cl, ll.transformer, ll.btrasform);//
    var cmm = new controls.Composite("span")
    cmm.setTitle(tps.service.caption(b.type()));
    bm.setTitle(tps.service.caption(b.type()));
    cmm.add(bm)
    return cmm;
}
export class DisplayManager {

    createOperationControl(op: tps.Operation, r?: RenderingContext): controls.IControl {
        return new controls.Label(op.displayName);
    }

    createControl(b: IBinding, r?: RenderingContext): controls.IControl {
        r = this.copyContext(r);
        var c = <IControlFactory><any>b.type();
        if (!b.get() && b.get() !== false) {
            var dv = b.type().default
            if (dv) {
                b.set(dv);
            }
        }

        if (c.createControl) {
            var tp = c.createControl(b, r);
            tp.setRenderingOptions(r);
            if (r.dialog && !tps.service.isObject(b.type())) {
                var result = new controls.VerticalFlex();
                let rnd = new forms.StatusRender();
                rnd._binding = b;
                result.add(rnd)
                result.add(tp)
                return result;
            }
            return tp;
        }
        if ((<tps.metakeys.Reference>b.type()).reference) {
            return referenceControl(b);
        }
        var groups = tps.service.propertyGroups(b.type());
        if (groups.length == 0) {
            return new controls.Label(tps.service.label(b.get(), b.type()));
        }
        if (groups.length == 1) {
            var group = this.renderGroup(b, groups[0], r, r.noStatus ? false : true);
            group.setTitle(b.type().displayName);
            group.setRenderingOptions(r);
            return group;
        }
        else {
            if (groups[0].properties.length < 6 || true) {
                var rs: controls.Composite = <controls.Composite>this.renderGroup(b, groups[0], r, true && (!r.noStatus));
                rs.setRenderingOptions(r);
                var tf = groups.length <= 4 ? new forms.TabFolder() : new controls.HorizontalTabFolder("div");
                tf._style.padding = "5px";
                for (var i = 1; i < groups.length; i++) {
                    var cm = ro.clone(r, {noStatus: true, noStatusDecorations: true, noMargin: true})
                    var ss: controls.IControl = this.renderGroup(b, groups[i], cm, false);
                    if (ss instanceof controls.VerticalFlex) {
                        if (ss.children.length == 1) {
                            var vv = ss.children[0];

                            ss = vv;
                        }

                    }
                    tf.add(ss);
                }
                //qm.add(tf);
                rs.add(tf);
                return rs;
            }
        }
        // var vs: tps.metakeys.VisibleWhen = <any>b.type();
        //
        // return null;
    }

    private copyContext(r: RenderingContext) {
        var dfo = ro.defaultOptions();
        Object.keys(dfo).forEach(x => {
            if (r[x] == undefined) {
                r[x] = dfo[x];
            }
        })
        if (r) {
            var o = {};
            Object.keys(r).forEach(x => o[x] = r[x])
            r = o;
        }
        else {
            r = {};
        }
        return r;
    }

    renderGroup(b: IBinding, g: tps.ts.IPropertyGroup, r?: RenderingContext, needStatus: boolean = false): controls.AbstractComposite {
        var result = new controls.VerticalFlex();
        result._style.flex = "1 1 auto";
        result.setTitle(g.caption);
        if (!r) {
            r = {
                noStatus: !needStatus,
                noStatusDecorations: true
            }
        }

        if (needStatus || (!r.noStatusDecorations)) {
            let rnd = new forms.StatusRender();
            if (!needStatus) {
                rnd.displayMessage = false;
            }
            if (r.noStatusDecorations) {
                rnd.displayDecorations = false;
            }
            rnd._binding = b;
            result.add(rnd)
        }
        if (!r) {
            r = {};
        }

        g.properties.forEach(x => {
            var o = this.copyContext(r);
            o.dialog = false;
            o.noStatus = true;
            result.add(this.createControl(b.binding(x.id), o));
        });
        if (result.children.length == 2) {
            if (result.children[1] instanceof forms.Section && result.children[0] instanceof StatusRender) {

                var rr = <forms.Section>result.children[1];
                rr.add(result.children[0]);
                return rr;
            }
        }
        return result;
    }
}
export const service = new DisplayManager();