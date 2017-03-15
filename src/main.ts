import {Binding} from "raml-type-bindings";
declare function require(c:any):any
require("headjs/dist/1.0.0/head.js")
export import rtb=require("raml-type-bindings")
import display=require("./uifactory");
export import wb=require("./workbench");
export import controls=require("./controls")
export import forms=require("./forms")

declare var head:any;

var prepared=false;
wb.defaultNavBar.brandRight = "";
// <!--<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">-->
//
// <!--<link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap3-dialog/1.34.9/css/bootstrap-dialog.min.css" rel="stylesheet" type="text/css"/>-->
// <!--<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.4.2/jquery.contextMenu.min.css">-->
// <!--<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">-->
// <!--<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.8.0/styles/default.min.css">-->
// <!--<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.17.45/css/bootstrap-datetimepicker.min.css" />-->
//
// <!--<script src="https://code.jquery.com/jquery-3.1.0.min.js" integrity="sha256-cCueBR6CsyA4/9szpPfrX3s49M9vUU5BgtiJj06wt/s=" crossorigin="anonymous"></script>
// <!--<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
// <!--<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.17.1/moment.min.js"></script>
// <!--<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap3-dialog/1.34.9/js/bootstrap-dialog.min.js"></script>
// <!--<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.17.45/js/bootstrap-datetimepicker.min.js"></script>
// <!--<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-3-typeahead/4.0.2/bootstrap3-typeahead.js"></script>
// <!--<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.4.2/jquery.contextMenu.js"></script>
// <!--<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/0.3.6/marked.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.8.0/highlight.min.js"></script>-->
export function prepare(f:()=>void){
    if (prepared){
        f();
        return;
    }
    head.load(["https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.17.1/moment.min.js"], function(){
        head.load(
            [
                "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"
                ,"https://cdnjs.cloudflare.com/ajax/libs/marked/0.3.6/marked.min.js",
                "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.8.0/highlight.min.js",
                "https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.4.2/jquery.contextMenu.js",
                "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-3-typeahead/4.0.2/bootstrap3-typeahead.js",
                "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.17.45/js/bootstrap-datetimepicker.min.js",
                "https://cdnjs.cloudflare.com/ajax/libs/bootstrap3-dialog/1.34.9/js/bootstrap-dialog.min.js",
                "https://cdnjs.cloudflare.com/ajax/libs/normalize/3.0.3/normalize.css",
                "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css",
                "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.17.45/css/bootstrap-datetimepicker.min.css",
                "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.8.0/styles/default.min.css",
                "https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css",
                "https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.4.2/jquery.contextMenu.min.css",
                "https://cdnjs.cloudflare.com/ajax/libs/bootstrap3-dialog/1.34.9/css/bootstrap-dialog.min.css"
            ],()=>{prepared=true;f()})
    })
}

export function register(t:{ types:{ [name:string]:any}}){
    Object.keys(t.types).forEach(x=>{
        rtb.service.register(t.types[x]);
    })
}

export function render(el:HTMLElement, b:rtb.Binding|rtb.Type,o:{},r?:any):rtb.Binding{
    var tr:Binding;
    var options=r?r:o;
    if (!(b instanceof rtb.Binding)) {
        tr=rtb.binding(o,b);
    }
    else{
        tr=b;
    }
    prepare(()=>{
            var control = display.service.createControl(tr, options);
            control.render(el);


    })
    return tr;
}
export function control( b:rtb.Binding|rtb.Type,o:{},r?:any){
        if (b instanceof rtb.Binding) {
            var control = display.service.createControl(b, o);
            return control
        }
        else{
            var bnd=rtb.binding(o,b);
            var control = display.service.createControl(bnd, r);
            return control;
        }
}


export function simpleListView(title: string,value:any[],icon:string,labelField:string){
    let result=new wb.TreeView(title,title);
    result.setLabelProvider(new wb.SimpleLabelProvider(icon,labelField));
    result.setInput(value);
    return result;
}

export function application(el: string| HTMLElement,title: string,defaultPespective:IPerspective,initialPerspective: IPerspective,cb?:(a:Application)=>void){
    prepare(()=>{
        let app=new wb.Application(title,initialPerspective,el,defaultPespective);
        if (cb){
            cb(app);
        }
    })
}
class SimpleView extends wb.ViewPart{

    constructor(title:string, private f:(e:HTMLElement)=>void){
        super(title,title);
    }
    innerRender(e:HTMLElement){
        this.f(e);
    }
}
export function view(title: string, f:(el: HTMLElement)=>void):wb.ViewPart{
    return new SimpleView(title,f);
}
export import ViewPart=wb.ViewPart;
export import IPerspective=wb.IPerspective;
export import Application=wb.Application;
export import Relation=wb.Relation;