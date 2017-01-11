import controls=require("./controls");
import tps=require("raml-type-bindings")
import forms=require("./forms")
import actions=require("./actions")
import IBinding=tps.IBinding
import IPropertyGroup=tps.ts.IPropertyGroup;
import {RadioSelect, Button} from "./forms";
import {Binding} from "raml-type-bindings";
import {Composite} from "./controls";


export interface RenderingContext {
    maxLength?: number
    tabsTop?: boolean
    horizontalBooleans?: boolean,
    dialog?: boolean
    noStatus?:boolean
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

tps.declareMeta(tps.TYPE_BOOLEAN, BooleanControlFactory);
declare var $:any
const StringControlFactory: IControlFactory = {
    createControl(b: IBinding, rc?: RenderingContext){

        var r = new forms.InputGroup();
        var nAddon = new forms.InputGroupAddOn();
        r._style.width = "100%";
        r.add(nAddon)
        if (rc && rc.maxLength) {
            nAddon._style.width = rc.maxLength + "ch";
        }
        nAddon._style.textAlign = "left"
        var ll = new controls.Composite("span");
        var gtitle=b.type().displayName + (b.type().required ? "* " : " ");
        ll.addLabel(gtitle);
        if (b.type().description) {
            ll.add(new forms.Help(b.type().description))
        }
        ll._style.cssFloat = "left";
        nAddon.add(ll);
        var mm: tps.FullTypeOptions = <any>b.type();
        if (mm.enum || mm.enumValues) {
            if(mm.enum){
                if (mm.enum.length<6) {
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
                w._style.height="100%"
                w._style.flex="1 1 auto"
                w._binding = b;
                var vm=new controls.Composite("div");
                var s = new forms.Section(b.type().displayName,true)
                s._style.margin = "5px";
                s.body._style.padding = "0px";

                s.add(w);

                return s;
            }
            var te=(<tps.metakeys.TypeAhead>b.type()).typeahead;
            if (te){
                w.afterCreate=(c)=>{
                    var w:any=window;
                    $("#"+c.id()).typeahead({ source:function(name:string,c:(v:string[])=>void){c(tps.calcExpression(te,b))}});
                }
            }

            w._binding = b;
            r.add(w);
        }
        return r;
    }
}
const ArrayControlFactory: IControlFactory = {
    createControl(b: IBinding, rc?: RenderingContext){
        var r = new forms.Section(b.type().displayName,true);
        if (tps.service.isMultiSelect(b.type())){
            var bm=new forms.ButtonMultiSelectControl();
            var ct=tps.service.componentType(b.type());
            var cl=new tps.Binding("");
            cl.value=forms.enumOptions(ct,b);
            cl._type=b.type();
            bm._binding=cl;
            bm.selectionBinding=<Binding>b;
            var cmm=new controls.Composite("span")
            cmm.setTitle(b.type().displayName);
            cmm.add(bm)
            return cmm;
        }
        var lst:forms.AbstractListControl = new forms.SimpleListControl();
        var props=tps.service.visibleProperties(b.collectionBinding().componentType());

        if (props.length>1){
            var tb=new forms.TableControl();
            tb._binding=b;
            //this is ids;
            lst=tb;
        }
        lst._binding = b;
        var items=[
            new actions.CreateAction(b, lst.selectionBinding),
            new actions.EditAction(b, lst.selectionBinding),
            new actions.DeleteAction(b, lst.selectionBinding),
        ];
        r.toolbar.items =items;
        var dr=new forms.DropDown();
        dr.items=items;
        dr.addTo(lst);
        r.add(lst);
        return r;
    }
}

tps.declareMeta(tps.TYPE_SCALAR, StringControlFactory);
tps.declareMeta(tps.TYPE_ARRAY, ArrayControlFactory);
tps.declareMeta(tps.TYPE_MAP, ArrayControlFactory);
export class DisplayManager {

    createControl(b: IBinding, r?: RenderingContext): controls.IControl {
        r = this.copyContext(r);
        var c = <IControlFactory><any>tps.service.resolvedType(b.type());
        if (!b.get()) {
            var dv = b.type().default
            b.set(dv);
        }
        if (c.createControl) {
            var tp = c.createControl(b, r);
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
        var groups = tps.service.propertyGroups(b.type());
        if (groups.length == 0) {
            return new controls.Label(tps.service.label(b.get(), b.type()));
        }
        if (groups.length == 1) {
            var group= this.renderGroup(b, groups[0], r, r.noStatus?false:true);
            group.setTitle(b.type().displayName);
            return group;
        }
        else {
            if (groups[0].properties.length < 6||true) {
                var rs: controls.Composite = <controls.Composite>this.renderGroup(b, groups[0], r, true&&(!r.noStatus));
                var tf = groups.length<=4?new forms.TabFolder():new controls.HorizontalTabFolder("div");
                tf._style.padding="5px";
                for (var i = 1; i < groups.length; i++) {
                    var ss: controls.IControl = this.renderGroup(b, groups[i]);
                    if (ss instanceof controls.VerticalFlex) {
                        if (ss.children.length == 1) {
                            var  vv=ss.children[0];

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

    renderGroup(b: IBinding, g: tps.ts.IPropertyGroup, r?: RenderingContext, needStatus: boolean = false) {
        var result = new controls.VerticalFlex();
        result._style.flex="1 1 auto";
        result.setTitle(g.caption);
        if (needStatus) {
            let rnd = new forms.StatusRender();
            rnd._binding = b;
            result.add(rnd)
        }
        if (!r) {
            r = {};
        }
        if (!r.maxLength) {
            r.maxLength = 5;
        }
        g.properties.forEach(x => {
            if (tps.service.isScalar(x)) {
                if (r.maxLength < x.displayName.length) {
                    r.maxLength = x.displayName.length;
                }
            }
        })
        if (r.maxLength < 10) {
            r.maxLength = 12;
        }
        g.properties.forEach(x => {

            var o = this.copyContext(r);
            o.dialog = false;
            o.noStatus=true;
            result.add(this.createControl(b.binding(x.id), o));

        });

        return result;
    }
}
export const service = new DisplayManager();